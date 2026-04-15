import mongoose from 'mongoose';
import { generateEmbedding } from './embeddings.js';
import { rerankDocuments } from './reranker.js';
import { RAG_CONFIG } from '../config/rag.config.js';

/**
 * Perform vector search on posts collection (Stage 1 — coarse retrieval).
 * Returns up to candidateLimit results at minScore. Reranking happens in performRAGSearch.
 */
async function searchPosts(queryEmbedding) {
  const { candidateLimit, minScore } = RAG_CONFIG.vectorSearch;
  try {
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');

    console.log(`\n[Vector Search] Searching posts — limit=${candidateLimit}, minScore=${minScore}`);
    console.log(`[Vector Search] Query embedding dimensions: ${queryEmbedding.length}`);

    const results = await postsCollection.aggregate([
      {
        $vectorSearch: {
          index: 'posts_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: candidateLimit
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          authorName: 1,
          topicName: 1,
          createdAt: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      },
      {
        $match: { score: { $gte: minScore } }
      }
    ]).toArray();

    console.log(`[Vector Search] Posts retrieved: ${results.length}`);
    results.forEach((post, i) => {
      console.log(`  [Post ${i + 1}] vectorScore=${post.score.toFixed(4)} | author=${post.authorName} | topic=${post.topicName}`);
      console.log(`    "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`);
    });

    return results;
  } catch (error) {
    console.error('[Vector Search] Error searching posts:', error);
    return [];
  }
}

/**
 * Perform vector search on resources collection (Stage 1 — coarse retrieval).
 */
async function searchResources(queryEmbedding) {
  const { candidateLimit, minScore } = RAG_CONFIG.vectorSearch;
  try {
    const db = mongoose.connection.db;
    const resourcesCollection = db.collection('resources');

    console.log(`\n[Vector Search] Searching resources — limit=${candidateLimit}, minScore=${minScore}`);
    console.log(`[Vector Search] Query embedding dimensions: ${queryEmbedding.length}`);

    const results = await resourcesCollection.aggregate([
      {
        $vectorSearch: {
          index: 'resources_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: candidateLimit
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          url: 1,
          createdAt: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      },
      {
        $match: { score: { $gte: minScore } }
      }
    ]).toArray();

    console.log(`[Vector Search] Resources retrieved: ${results.length}`);
    results.forEach((resource, i) => {
      console.log(`  [Resource ${i + 1}] vectorScore=${resource.score.toFixed(4)} | title="${resource.title}"`);
      console.log(`    "${resource.description.substring(0, 100)}${resource.description.length > 100 ? '...' : ''}"`);
      console.log(`    URL: ${resource.url}`);
    });

    return results;
  } catch (error) {
    console.error('[Vector Search] Error searching resources:', error);
    return [];
  }
}

/**
 * Full two-stage RAG search: vector retrieval → reranker → LLM context.
 * @param {string} query - The user's query text
 * @param {Object} options
 * @param {number} options.postsLimit - Max posts to pass to LLM (after reranking)
 * @param {number} options.resourcesLimit - Max resources to pass to LLM (after reranking)
 * @returns {Promise<{posts: Array, resources: Array}>}
 */
export async function performRAGSearch(query, options = {}) {
  const {
    postsLimit = RAG_CONFIG.llm.postsLimit,
    resourcesLimit = RAG_CONFIG.llm.resourcesLimit,
  } = options;

  try {
    console.log('\n════════════════════════════════════════════');
    console.log('=== RAG Search Started ===');
    console.log(`[RAG] User Query: "${query}"`);
    console.log(`[RAG] Config: vectorMinScore=${RAG_CONFIG.vectorSearch.minScore}, candidateLimit=${RAG_CONFIG.vectorSearch.candidateLimit}, rerankerThreshold=${RAG_CONFIG.reranker.threshold}, postsLimit=${postsLimit}, resourcesLimit=${resourcesLimit}`);

    console.log('\n[RAG] Stage 1 — Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);
    console.log(`[RAG] Embedding: ${queryEmbedding.length} dims | sample=[${queryEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]`);

    console.log('\n[RAG] Stage 1 — Vector search (parallel)...');
    const [postCandidates, resourceCandidates] = await Promise.all([
      searchPosts(queryEmbedding),
      searchResources(queryEmbedding)
    ]);

    console.log(`\n[RAG] Stage 1 Summary: ${postCandidates.length} post candidates, ${resourceCandidates.length} resource candidates`);

    console.log('\n[RAG] Stage 2 — Reranking (parallel)...');
    const [posts, resources] = await Promise.all([
      rerankDocuments(
        query,
        postCandidates,
        doc => `${doc.content} ${doc.topicName}`,
        RAG_CONFIG.reranker.threshold,
        postsLimit
      ),
      rerankDocuments(
        query,
        resourceCandidates,
        doc => `${doc.title}. ${doc.description}`,
        RAG_CONFIG.reranker.threshold,
        resourcesLimit
      )
    ]);

    console.log(`\n[RAG] Stage 2 Summary: ${posts.length} posts, ${resources.length} resources passed reranking`);
    console.log('=== RAG Search Completed ===');
    console.log('════════════════════════════════════════════\n');

    return { posts, resources };
  } catch (error) {
    console.error('[RAG] Error performing RAG search:', error);
    return { posts: [], resources: [] };
  }
}

/**
 * Format RAG results into a context string for the LLM prompt.
 * @param {Object} ragResults - Results from performRAGSearch
 * @returns {string} Formatted context string
 */
export function formatRAGContext(ragResults) {
  const { posts, resources } = ragResults;
  const contextParts = [];

  const usingFallback = [...posts, ...resources].some(d => d.rerankerFallback);
  console.log(`[RAG Context] Formatting context for LLM... (rerankerFallback=${usingFallback})`);

  if (posts.length > 0) {
    contextParts.push('## Community Posts:');
    posts.forEach((post, index) => {
      contextParts.push(
        `\n### Post ${index + 1} (by ${post.authorName} in topic: ${post.topicName}):\n` +
        `Content: ${post.content}\n` +
        `Posted: ${new Date(post.createdAt).toLocaleDateString()}`
      );
      const rscore = post.rerankScore != null ? post.rerankScore.toFixed(4) : 'fallback';
      console.log(`  [Context] Post ${index + 1}: rerankScore=${rscore} vectorScore=${post.score?.toFixed(4) ?? 'n/a'} | "${post.content.substring(0, 50)}..."`);
    });
  }

  if (resources.length > 0) {
    contextParts.push('\n## Resources:');
    resources.forEach((resource, index) => {
      contextParts.push(
        `\n### Resource ${index + 1}:\n` +
        `Title: ${resource.title}\n` +
        `Description: ${resource.description}\n` +
        `URL: ${resource.url}`
      );
      const rscore = resource.rerankScore != null ? resource.rerankScore.toFixed(4) : 'fallback';
      console.log(`  [Context] Resource ${index + 1}: rerankScore=${rscore} vectorScore=${resource.score?.toFixed(4) ?? 'n/a'} | "${resource.title}"`);
    });
  }

  const context = contextParts.join('\n');
  console.log(`[RAG Context] Total context length: ${context.length} characters`);

  return { context, usingFallback };
}

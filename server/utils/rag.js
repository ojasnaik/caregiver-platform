import mongoose from 'mongoose';
import { generateEmbedding } from './embeddings.js';

/**
 * Perform vector search on posts collection
 * @param {number[]} queryEmbedding - The embedding vector of the user query
 * @param {number} limit - Maximum number of results to return
 * @param {number} minScore - Minimum similarity score (0-1)
 * @returns {Promise<Array>} Array of relevant posts
 */
export async function searchPosts(queryEmbedding, limit = 3, minScore = 0.7) {
  try {
    const db = mongoose.connection.db;
    const postsCollection = db.collection('posts');

    console.log(`\n[Vector Search] Searching posts with limit=${limit}, minScore=${minScore}`);
    console.log(`[Vector Search] Query embedding dimensions: ${queryEmbedding.length}`);

    const results = await postsCollection.aggregate([
      {
        $vectorSearch: {
          index: 'posts_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit
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
        $match: {
          score: { $gte: minScore }
        }
      }
    ]).toArray();

    console.log(`[Vector Search] Posts found: ${results.length}`);
    results.forEach((post, index) => {
      console.log(`  [Post ${index + 1}] Score: ${post.score.toFixed(4)} | Author: ${post.authorName} | Topic: ${post.topicName}`);
      console.log(`    Content: ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}`);
    });

    return results;
  } catch (error) {
    console.error('[Vector Search] Error searching posts:', error);
    return [];
  }
}

/**
 * Perform vector search on resources collection
 * @param {number[]} queryEmbedding - The embedding vector of the user query
 * @param {number} limit - Maximum number of results to return
 * @param {number} minScore - Minimum similarity score (0-1)
 * @returns {Promise<Array>} Array of relevant resources
 */
export async function searchResources(queryEmbedding, limit = 3, minScore = 0.7) {
  try {
    const db = mongoose.connection.db;
    const resourcesCollection = db.collection('resources');

    console.log(`\n[Vector Search] Searching resources with limit=${limit}, minScore=${minScore}`);
    console.log(`[Vector Search] Query embedding dimensions: ${queryEmbedding.length}`);

    const results = await resourcesCollection.aggregate([
      {
        $vectorSearch: {
          index: 'resources_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: limit
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
        $match: {
          score: { $gte: minScore }
        }
      }
    ]).toArray();

    console.log(`[Vector Search] Resources found: ${results.length}`);
    results.forEach((resource, index) => {
      console.log(`  [Resource ${index + 1}] Score: ${resource.score.toFixed(4)} | Title: ${resource.title}`);
      console.log(`    Description: ${resource.description.substring(0, 100)}${resource.description.length > 100 ? '...' : ''}`);
      console.log(`    URL: ${resource.url}`);
    });

    return results;
  } catch (error) {
    console.error('[Vector Search] Error searching resources:', error);
    return [];
  }
}

/**
 * Perform RAG search on both posts and resources
 * @param {string} query - The user's query text
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Object containing relevant posts and resources
 */
export async function performRAGSearch(query, options = {}) {
  const {
    postsLimit = 3,
    resourcesLimit = 3,
    minScore = 0.7
  } = options;

  try {
    console.log('\n=== RAG Search Started ===');
    console.log(`[RAG] User Query: "${query}"`);
    console.log(`[RAG] Search parameters: postsLimit=${postsLimit}, resourcesLimit=${resourcesLimit}, minScore=${minScore}`);

    // Generate embedding for the query
    console.log('[RAG] Generating embedding for query...');
    const queryEmbedding = await generateEmbedding(query);
    console.log(`[RAG] Embedding generated: ${queryEmbedding.length} dimensions`);
    console.log(`[RAG] Embedding sample (first 5 values): [${queryEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}, ...]`);

    // Perform parallel searches
    const [posts, resources] = await Promise.all([
      searchPosts(queryEmbedding, postsLimit, minScore),
      searchResources(queryEmbedding, resourcesLimit, minScore)
    ]);

    console.log(`\n[RAG] Search Summary:`);
    console.log(`  - Posts matched: ${posts.length}`);
    console.log(`  - Resources matched: ${resources.length}`);
    console.log(`=== RAG Search Completed ===\n`);

    return {
      posts,
      resources
    };
  } catch (error) {
    console.error('[RAG] Error performing RAG search:', error);
    return {
      posts: [],
      resources: []
    };
  }
}

/**
 * Format RAG results into context string for the LLM
 * @param {Object} ragResults - Results from performRAGSearch
 * @returns {string} Formatted context string
 */
export function formatRAGContext(ragResults) {
  const { posts, resources } = ragResults;
  const contextParts = [];

  console.log('[RAG Context] Formatting context for LLM...');

  if (posts.length > 0) {
    contextParts.push('## Relevant Posts from Community:');
    posts.forEach((post, index) => {
      contextParts.push(
        `\n### Post ${index + 1} (by ${post.authorName} in topic: ${post.topicName}):\n` +
        `Content: ${post.content}\n` +
        `Posted: ${new Date(post.createdAt).toLocaleDateString()}`
      );
      console.log(`  [Context] Added Post ${index + 1}: "${post.content.substring(0, 50)}..." (Score: ${post.score?.toFixed(4) || 'N/A'})`);
    });
  }

  if (resources.length > 0) {
    contextParts.push('\n## Relevant Resources:');
    resources.forEach((resource, index) => {
      contextParts.push(
        `\n### Resource ${index + 1}:\n` +
        `Title: ${resource.title}\n` +
        `Description: ${resource.description}\n` +
        `URL: ${resource.url}`
      );
      console.log(`  [Context] Added Resource ${index + 1}: "${resource.title}" (Score: ${resource.score?.toFixed(4) || 'N/A'})`);
    });
  }

  const context = contextParts.join('\n');
  console.log(`[RAG Context] Context length: ${context.length} characters`);
  
  return context;
}

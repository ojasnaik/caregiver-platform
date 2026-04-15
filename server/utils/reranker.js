import { pipeline } from '@xenova/transformers';
import { RAG_CONFIG } from '../config/rag.config.js';

let rerankerPipeline = null;

async function getRerankerPipeline() {
  if (!rerankerPipeline) {
    console.log(`[Reranker] Loading ${RAG_CONFIG.reranker.model} (first load may take ~1 min)...`);
    rerankerPipeline = await pipeline('text-classification', RAG_CONFIG.reranker.model);
    console.log('[Reranker] Model loaded successfully');
  }
  return rerankerPipeline;
}

/**
 * Rerank documents against a query using the configured cross-encoder model.
 * Falls back to vector-score ordering if reranking fails.
 *
 * @param {string} query
 * @param {Array} docs - Candidate documents from vector search (each has a .score field)
 * @param {function} textExtractor - (doc) => string to score against query
 * @param {number} threshold - Min rerank score to keep (default from config)
 * @param {number} topK - Max docs to return after filtering
 * @returns {Promise<Array>} Docs with rerankScore field, sorted desc. Falls back to vector score on error.
 */
export async function rerankDocuments(
  query,
  docs,
  textExtractor,
  threshold = RAG_CONFIG.reranker.threshold,
  topK = 3
) {
  if (docs.length === 0) {
    console.log('[Reranker] No candidates to rerank, skipping');
    return [];
  }

  try {
    const reranker = await getRerankerPipeline();

    console.log(`\n[Reranker] Scoring ${docs.length} candidates against query: "${query}"`);

    // @xenova/transformers v2 requires text pairs as [query, document] tuples.
    // Process sequentially to avoid batch format issues.
    const rawScores = [];
    for (const doc of docs) {
      const result = await reranker([query, textExtractor(doc)]);
      rawScores.push(result[0]);
    }

    const scored = docs.map((doc, i) => ({ ...doc, rerankScore: rawScores[i].score }));

    console.log(`[Reranker] All candidate scores (threshold=${threshold}):`);
    scored.forEach((doc, i) => {
      const keep = doc.rerankScore >= threshold ? '✓ KEEP' : '✗ DROP';
      const text = textExtractor(doc).substring(0, 80);
      console.log(`  [${i + 1}] ${keep} rerankScore=${doc.rerankScore.toFixed(4)} vectorScore=${doc.score?.toFixed(4) ?? 'n/a'} | "${text}..."`);
    });

    const kept = scored
      .filter(doc => doc.rerankScore >= threshold)
      .sort((a, b) => b.rerankScore - a.rerankScore)
      .slice(0, topK);

    console.log(`[Reranker] Result: kept ${kept.length}/${docs.length}, returning top ${Math.min(kept.length, topK)}`);

    if (kept.length === 0) {
      console.log('[Reranker] No documents passed threshold — this collection contributes no context');
    } else {
      console.log('[Reranker] Final docs for LLM context:');
      kept.forEach((doc, i) => {
        console.log(`  [${i + 1}] rerankScore=${doc.rerankScore.toFixed(4)} | "${textExtractor(doc).substring(0, 80)}..."`);
      });
    }

    return kept;

  } catch (error) {
    console.error(`[Reranker] Reranking failed: ${error.message}`);
    console.warn('[Reranker] Falling back to vector similarity ordering (no rerankScore filtering applied)');

    const fallback = docs
      .slice()
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, topK)
      .map(doc => ({ ...doc, rerankScore: null, rerankerFallback: true }));

    console.log(`[Reranker] Fallback: returning top ${fallback.length} by vectorScore`);
    fallback.forEach((doc, i) => {
      console.log(`  [${i + 1}] vectorScore=${doc.score?.toFixed(4) ?? 'n/a'} | "${textExtractor(doc).substring(0, 80)}..."`);
    });

    return fallback;
  }
}

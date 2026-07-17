// Pre-download the RAG models so they are cached inside the image/filesystem
// at build time. Run once during `docker build` (or manually) to avoid a
// multi-hundred-MB download on the first chat request after a cold start.
import { pipeline } from '@xenova/transformers';
import { RAG_CONFIG } from './config/rag.config.js';

console.log('[Prewarm] Downloading embedding model (Xenova/all-MiniLM-L6-v2)...');
await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

console.log(`[Prewarm] Downloading reranker model (${RAG_CONFIG.reranker.model})...`);
await pipeline('text-classification', RAG_CONFIG.reranker.model);

console.log('[Prewarm] Models cached successfully.');

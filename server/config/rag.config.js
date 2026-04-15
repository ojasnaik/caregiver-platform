export const RAG_CONFIG = {
  vectorSearch: {
    candidateLimit: 10,  // docs fetched per collection before reranking
    minScore: 0.6,       // cosine similarity floor (0–1)
  },
  reranker: {
    model: 'Xenova/bge-reranker-base',
    threshold: 0.5,      // sigmoid score floor (0–1); 0.5 = logit decision boundary
  },
  llm: {
    postsLimit: 3,       // max posts passed to LLM after reranking
    resourcesLimit: 3,   // max resources passed to LLM after reranking
  },
};

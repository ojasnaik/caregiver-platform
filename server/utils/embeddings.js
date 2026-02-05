import { pipeline } from '@xenova/transformers';

// Initialize the embedding model (lazy loading - only loads when first used)
let embeddingPipeline = null;

/**
 * Initialize the embedding pipeline
 * This uses the same model as the Python script: 'all-MiniLM-L6-v2' (384 dimensions)
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('Loading Hugging Face embedding model (this may take a minute first time)...');
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Embedding model loaded successfully!');
  }
  return embeddingPipeline;
}

/**
 * Generate an embedding vector for the given text
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector (384 dimensions)
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Text must be a non-empty string');
  }

  try {
    console.log('[Embedding] Starting embedding generation for text length:', text.length);
    const extractor = await getEmbeddingPipeline();
    console.log('[Embedding] Pipeline loaded, processing text...');
    
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    console.log('[Embedding] Extraction complete, converting to array...');
    
    // Convert the tensor to a regular array
    const embedding = Array.from(output.data);
    console.log('[Embedding] Embedding generated successfully, dimensions:', embedding.length);
    return embedding;
  } catch (error) {
    console.error('[Embedding] Error generating embedding:', error);
    console.error('[Embedding] Error type:', error.constructor.name);
    console.error('[Embedding] Error message:', error.message);
    if (error.stack) {
      console.error('[Embedding] Error stack:', error.stack);
    }
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embedding from multiple fields (combines them with ". ")
 * @param {Object} doc - The document object
 * @param {string[]} fields - Array of field names to combine
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function generateEmbeddingFromFields(doc, fields) {
  const textParts = fields
    .map(field => {
      const value = doc[field];
      return value ? String(value).trim() : '';
    })
    .filter(part => part.length > 0);
  
  const combinedText = textParts.join('. ');
  
  if (!combinedText) {
    throw new Error('No valid text found in the specified fields');
  }
  
  return await generateEmbedding(combinedText);
}


import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { performRAGSearch, formatRAGContext } from '../utils/rag.js';

const router = express.Router();

// Initialize Gemini AI
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

// POST /api/chat - Send message to Gemini
router.post('/', async (req, res) => {
  try {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🚀 CHAT REQUEST RECEIVED');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required and must be a non-empty string' 
      });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(503).json({ 
        success: false, 
        message: 'Chat service is not configured. Please set GEMINI_API_KEY in environment variables.' 
      });
    }

    const userQuery = message.trim();
    
    console.log(`\n[Chat API] Received query: "${userQuery}"`);
    
    // Perform RAG search to find relevant posts and resources
    const ragResults = await performRAGSearch(userQuery, {
      postsLimit: 3,
      resourcesLimit: 3,
      minScore: 0.7
    });

    // Format the context from RAG results
    const ragContext = formatRAGContext(ragResults);
    
    console.log(`[Chat API] RAG Results: ${ragResults.posts.length} posts, ${ragResults.resources.length} resources`);

    // Build the prompt with RAG context
    let prompt = userQuery;
    
    if (ragContext) {
      prompt = `You are a helpful assistant for a caregiver and single parent community platform. When answering questions, please reference relevant posts and resources from the community when applicable.

${ragContext}

User Question: ${userQuery}

Instructions:
- If the context above contains relevant posts or resources, please reference them naturally in your response.
- For posts, mention something like "Refer to this post by [author name] in the [topic name] discussion" or "As mentioned in a post by [author name]..."
- For resources, mention something like "Check out this resource: [title]" and include the URL if helpful.
- Provide a helpful, empathetic response that incorporates the community knowledge when relevant.
- If the context doesn't contain relevant information, answer based on your general knowledge.
- Always be supportive and understanding of the caregiver's situation.`;
    }

    console.log(`[Chat API] Sending prompt to Gemini (length: ${prompt.length} characters)...`);
    
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`[Chat API] Received response from Gemini (length: ${text.length} characters)`);

    // Prepare references for the frontend
    const references = {
      posts: ragResults.posts.map(post => ({
        id: post._id.toString(),
        content: post.content,
        authorName: post.authorName,
        topicName: post.topicName,
        createdAt: post.createdAt,
        score: post.score
      })),
      resources: ragResults.resources.map(resource => ({
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description,
        url: resource.url,
        score: resource.score
      }))
    };

    console.log(`[Chat API] Returning response with ${references.posts.length} post references and ${references.resources.length} resource references`);
    console.log(`[Chat API] Request completed successfully`);
    console.log('═══════════════════════════════════════════════════════════\n');

    res.json({ 
      success: true, 
      response: text,
      references: references
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get response from chat service' 
    });
  }
});

export default router;

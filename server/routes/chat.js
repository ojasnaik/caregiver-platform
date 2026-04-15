import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { performRAGSearch, formatRAGContext } from '../utils/rag.js';
import { RAG_CONFIG } from '../config/rag.config.js';

const router = express.Router();

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

// POST /api/chat - Send message to Gemini with RAG context
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

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(503).json({
        success: false,
        message: 'Chat service is not configured. Please set GEMINI_API_KEY in environment variables.'
      });
    }

    const userQuery = message.trim();
    console.log(`[Chat API] Received query: "${userQuery}"`);

    const ragResults = await performRAGSearch(userQuery, {
      postsLimit: RAG_CONFIG.llm.postsLimit,
      resourcesLimit: RAG_CONFIG.llm.resourcesLimit,
    });

    const { context: ragContext, usingFallback } = formatRAGContext(ragResults);
    console.log(`[Chat API] RAG Results: ${ragResults.posts.length} posts, ${ragResults.resources.length} resources (fallback=${usingFallback})`);

    let prompt;

    if (ragContext && !usingFallback) {
      prompt = `You are a supportive assistant for a caregiver and single parent community.

CONTEXT — retrieved and ranked from the community:
${ragContext}

User question: ${userQuery}

Instructions:
- Answer using ONLY the context above. Do not introduce information not present in the context.
- Be concise and clear — keep your response focused and easy to read.
- Naturally reference relevant posts (e.g. "As mentioned by [author] in the [topic] discussion...") and resources (title + URL).
- Be empathetic and supportive in tone.`;
    } else if (ragContext && usingFallback) {
      prompt = `You are a supportive assistant for a caregiver and single parent community.

CONTEXT — retrieved from the community (ordered by similarity, use your judgment on relevance):
${ragContext}

User question: ${userQuery}

Instructions:
- Use the context above where it is genuinely relevant to the question. Skip items that are not relevant.
- Be concise and clear — keep your response focused and easy to read.
- Reference relevant posts (e.g. "As mentioned by [author]...") and resources (title + URL) when applicable.
- Be empathetic and supportive in tone.`;
    } else {
      prompt = `You are a supportive assistant for a caregiver and single parent community.
No specific community posts or resources were found for this question.

User question: ${userQuery}

Answer from your general knowledge. Be concise, clear, and empathetic.`;
    }

    console.log(`[Chat API] Sending prompt to Gemini (length: ${prompt.length} characters, context: ${ragContext ? 'YES' : 'NO'})...`);
    console.log('\n[Chat API] ── FULL LLM PROMPT INPUT ────────────────────────────────────────');
    console.log(prompt);
    console.log('[Chat API] ── END PROMPT ────────────────────────────────────────────────────\n');

    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log(`[Chat API] Received response from Gemini (length: ${text.length} characters)`);
    console.log('\n[Chat API] ── FULL LLM RESPONSE OUTPUT ─────────────────────────────────────');
    console.log(text);
    console.log('[Chat API] ── END RESPONSE ──────────────────────────────────────────────────\n');

    const references = {
      posts: ragResults.posts.map(post => ({
        id: post._id.toString(),
        content: post.content,
        authorName: post.authorName,
        topicName: post.topicName,
        createdAt: post.createdAt,
        score: post.score,
        rerankScore: post.rerankScore,
      })),
      resources: ragResults.resources.map(resource => ({
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description,
        url: resource.url,
        score: resource.score,
        rerankScore: resource.rerankScore,
      }))
    };

    console.log(`[Chat API] Returning response with ${references.posts.length} post references and ${references.resources.length} resource references`);
    console.log('═══════════════════════════════════════════════════════════\n');

    res.json({ success: true, response: text, references });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get response from chat service'
    });
  }
});

export default router;

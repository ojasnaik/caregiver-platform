import Groq from 'groq-sdk';

let groq = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groq) groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groq;
}

export async function compactHistory(history) {
  if (!history || history.length === 0) return '';

  const client = getGroqClient();
  if (!client) {
    console.warn('[ChatMemory] GROQ_API_KEY not set — skipping history compaction');
    return '';
  }

  const transcript = history
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  try {
    const result = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You summarize caregiver support conversations. Return 3-5 concise bullet points capturing the main topics discussed, user concerns, and any advice given. Be factual and brief.',
        },
        { role: 'user', content: transcript },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const summary = result.choices[0].message.content.trim();
    console.log(`[ChatMemory] Compacted ${history.length} messages into summary (${summary.length} chars)`);
    return summary;
  } catch (err) {
    console.error('[ChatMemory] Groq compaction failed — continuing without history:', err.message);
    return '';
  }
}

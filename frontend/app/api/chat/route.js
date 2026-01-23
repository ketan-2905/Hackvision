import { createXai } from '@ai-sdk/xai';
import { streamText } from 'ai';

// Force edge runtime for streaming
export const runtime = 'edge';

// Initialize xAI provider
const xai = createXai({
  apiKey: process.env.XAI_API_KEY || '',
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages } = body;

    // Extract weaknesses and anxiety from body
    const weaknesses = body.weaknesses || '';
    const anxietyLevel = body.anxietyLevel || 0;

    // Build the system prompt
    const systemPrompt = `You are a High-Pressure Technical Recruiter conducting a challenging mock interview.

Your goal is to test the candidate rigorously while adapting to their stress levels.

CANDIDATE PROFILE:
- Identified Weaknesses: ${weaknesses || 'General technical knowledge'}
- Current Anxiety Level: ${anxietyLevel.toFixed(2)} (0 = calm, 1 = highly anxious)

INTERVIEW STRATEGY:
${anxietyLevel > 0.6
        ? '- The candidate is showing high anxiety. Maintain pressure but be slightly more encouraging to keep them engaged.'
        : anxietyLevel > 0.3
          ? '- The candidate is moderately anxious. Push harder on their weak areas with follow-up questions.'
          : '- The candidate appears calm. Increase difficulty and ask deep, probing questions about their weaknesses.'
      }

RULES:
1. Focus heavily on their identified weaknesses (${weaknesses || 'technical fundamentals'})
2. Ask follow-up questions that expose gaps in understanding
3. Be direct and professional, like a real technical interviewer
4. If they struggle, ask clarifying questions before moving on
5. Occasionally throw in curveball questions related to their weak areas
6. Keep responses CONCISE and interview-like (not conversational) - your responses will be spoken aloud
7. Use SHORT, CLEAR sentences optimized for text-to-speech
8. End each response with ONE challenging question

Begin the interview now.`;

    // Stream the response from Grok
    const result = await streamText({
      model: xai('grok-beta'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.8,
      maxTokens: 300,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

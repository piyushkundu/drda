// AI Document Generation API Route
import { NextRequest, NextResponse } from 'next/server';
import { DRAFTING_SYSTEM_PROMPT, getDraftingPrompt } from '@/lib/prompts';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export const maxDuration = 300; // Allow up to 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { topic, department, letterType, additionalContext, sender, recipient, district, date, model = 'llama-3.3-70b-versatile' } = await req.json();
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 });

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: DRAFTING_SYSTEM_PROMPT },
          { role: 'user', content: getDraftingPrompt(topic, department || 'General', letterType || 'letter', additionalContext, sender, recipient, district, date) },
        ],
        stream: true,
        temperature: 0.4,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      return NextResponse.json({ 
        error: 'Groq API error', 
        details: errorText 
      }, { status: response.status });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              const data = trimmed.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`));
                }
              } catch { /* skip malformed JSON */ }
            }
          }
        } finally { controller.close(); }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'AI generation failed', details: String(error) }, { status: 500 });
  }
}



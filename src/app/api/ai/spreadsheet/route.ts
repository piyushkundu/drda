import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { text, command, model = 'llama-3.3-70b-versatile' } = await req.json();
    if (!text || !command) return NextResponse.json({ error: 'Text and command are required' }, { status: 400 });

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: command },
          { role: 'user', content: text },
        ],
        stream: false,
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      return NextResponse.json({ error: 'Groq API error', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ result: result.trim() });
  } catch (error) {
    return NextResponse.json({ error: 'AI correction failed', details: String(error) }, { status: 500 });
  }
}

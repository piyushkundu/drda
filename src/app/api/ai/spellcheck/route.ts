// AI-powered Hindi Spell Check API Route
// Uses Groq for context-aware spell correction
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SPELL_CHECK_SYSTEM_PROMPT = `You are a Hindi spell checker. Given a sentence with potentially misspelled Hindi words, identify the misspelled words and suggest corrections.

Rules:
1. Output JSON format: { "errors": [{ "word": "misspelled", "correction": "correct", "position": 0 }] }
2. If no errors found, return: { "errors": [] }
3. Only check Hindi words (Devanagari script). Skip English, numbers, abbreviations.
4. Consider common matra errors: ि/ी, ु/ू, े/ै, ो/ौ, ं/ँ
5. Consider common consonant confusions: श/ष, ब/व, ण/न
6. Use the full sentence context to determine the correct word.
7. Output ONLY JSON, no explanations.`;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ errors: [] });

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SPELL_CHECK_SYSTEM_PROMPT },
          { role: 'user', content: `Check this Hindi text for spelling errors:\n"${text}"` },
        ],
        temperature: 0.1,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ errors: [] });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) return NextResponse.json({ errors: [] });

    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ errors: [] });
    }
  } catch (error) {
    return NextResponse.json({ errors: [], error: String(error) }, { status: 500 });
  }
}

// OCR API Route using Groq Vision (Llama 4 Scout)
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const ocrPrompt = `You are an expert OCR system. Extract ALL text from this image — whether it is in Hindi (Devanagari script), English (Latin script), or a mix of both. 
Return ONLY the extracted text exactly as it appears in the image, preserving:
- Original line breaks and paragraph structure
- The original language of each word (do NOT translate anything)
- Numbers, dates, and special characters as-is
Do not add any commentary, explanation, headers, or labels. Just output the raw extracted text.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: ocrPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'unknown error');
      console.error('Groq Vision API error:', errorText);
      return NextResponse.json(
        { error: 'Groq Vision API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const extractedText = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed', details: String(error) },
      { status: 500 }
    );
  }
}

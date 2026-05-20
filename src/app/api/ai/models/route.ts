// AI Models List API Route
import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export async function GET() {
  try {
    const response = await fetch(`https://api.groq.com/openai/v1/models`, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      signal: AbortSignal.timeout(5000) 
    });
    if (!response.ok) return NextResponse.json({ models: [], connected: false });
    const data = await response.json();
    const models = (data.data || []).map((m: { id: string }) => ({
      name: m.id,
      size: 0,
    }));
    return NextResponse.json({ models, connected: true });
  } catch {
    return NextResponse.json({ models: [], connected: false });
  }
}

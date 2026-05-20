// ============================================
// Ollama Client Wrapper
// ============================================

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

export async function ollamaChat(
  model: string,
  messages: OllamaMessage[],
  stream: boolean = true
): Promise<Response> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream,
      options: {
        temperature: 0.3,
        num_predict: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  return response;
}

export async function ollamaGenerate(
  model: string,
  prompt: string,
  system?: string,
  stream: boolean = true
): Promise<Response> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream,
      options: {
        temperature: 0.3,
        num_predict: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  return response;
}

export async function listOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data.models || []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Model name mapping
export const MODEL_MAP: Record<string, string> = {
  'gemma4': 'gemma3', // Use gemma3 as fallback if gemma4 not available
  'qwen2.5': 'qwen2.5',
  'llama3.1': 'llama3.1',
};

export function resolveModelName(model: string, availableModels: string[]): string {
  // Try exact match first
  if (availableModels.some(m => m.startsWith(model))) {
    return availableModels.find(m => m.startsWith(model)) || model;
  }
  // Try mapped name
  const mapped = MODEL_MAP[model];
  if (mapped && availableModels.some(m => m.startsWith(mapped))) {
    return availableModels.find(m => m.startsWith(mapped)) || mapped;
  }
  // Return first available model
  return availableModels[0] || model;
}

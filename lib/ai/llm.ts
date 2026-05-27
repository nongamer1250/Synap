/**
 * LLM abstraction layer.
 * Uses Groq by default (free tier, very fast).
 * Falls back to Ollama locally when GROQ_API_KEY is not set.
 */

import Groq from 'groq-sdk';

const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Groq free tier model
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = 'llama3';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
  apiKey?: string;
}

/** Single completion — returns the full text response */
export async function complete(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  if (options.apiKey || process.env.GROQ_API_KEY) {
    return completeWithGroq(messages, options);
  }
  return completeWithOllama(messages, options);
}

/** Streaming completion — returns a ReadableStream */
export async function stream(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  if (options.apiKey || process.env.GROQ_API_KEY) {
    return streamWithGroq(messages, options);
  }
  return streamWithOllama(messages, options);
}

// ── Groq implementations ──────────────────────────────────────

async function completeWithGroq(
  messages: LLMMessage[],
  options: LLMOptions
): Promise<string> {
  const groq = new Groq({ apiKey: options.apiKey || process.env.GROQ_API_KEY });
  const defaultModels = [GROQ_MODEL, 'llama-3.1-8b-instant', 'qwen/qwen3-32b', 'meta-llama/llama-4-scout-17b-16e-instruct'];
  const models = options.model 
    ? [options.model, ...defaultModels.filter(m => m !== options.model)]
    : defaultModels;
  let lastError: any = null;

  for (const model of models) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      });

      return completion.choices[0]?.message?.content ?? '';
    } catch (err: any) {
      console.warn(`Groq error using model ${model}:`, err?.message || err);
      lastError = err;
      // If rate limit (429) or token limits are hit, try next model
      if (
        err?.status === 429 ||
        err?.status === 413 ||
        (err?.message && (
          err.message.includes('429') ||
          err.message.includes('413') ||
          err.message.toLowerCase().includes('rate limit') ||
          err.message.toLowerCase().includes('limit reached')
        ))
      ) {
        continue;
      }
      // For other errors, we can also try the next model as a safeguard
      continue;
    }
  }

  throw lastError || new Error('All Groq models failed');
}

async function streamWithGroq(
  messages: LLMMessage[],
  options: LLMOptions
): Promise<ReadableStream<Uint8Array>> {
  const groq = new Groq({ apiKey: options.apiKey || process.env.GROQ_API_KEY });
  const defaultModels = [GROQ_MODEL, 'llama-3.1-8b-instant', 'qwen/qwen3-32b', 'meta-llama/llama-4-scout-17b-16e-instruct'];
  const models = options.model 
    ? [options.model, ...defaultModels.filter(m => m !== options.model)]
    : defaultModels;
  let lastError: any = null;

  for (const model of models) {
    try {
      const groqStream = await groq.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2048,
        stream: true,
      });

      const encoder = new TextEncoder();

      return new ReadableStream<Uint8Array>({
        async start(controller) {
          for await (const chunk of groqStream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        },
      });
    } catch (err: any) {
      console.warn(`Groq stream error using model ${model}:`, err?.message || err);
      lastError = err;
      if (
        err?.status === 429 ||
        err?.status === 413 ||
        (err?.message && (
          err.message.includes('429') ||
          err.message.includes('413') ||
          err.message.toLowerCase().includes('rate limit') ||
          err.message.toLowerCase().includes('limit reached')
        ))
      ) {
        continue;
      }
      continue;
    }
  }

  throw lastError || new Error('All Groq models failed to stream');
}

// ── Ollama implementations ────────────────────────────────────

async function completeWithOllama(
  messages: LLMMessage[],
  options: LLMOptions
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 4096,
      },
      format: options.jsonMode ? 'json' : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message?.content ?? '';
}

async function streamWithOllama(
  messages: LLMMessage[],
  options: LLMOptions
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      options: { temperature: options.temperature ?? 0.3 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama stream failed: ${response.statusText}`);
  }

  const encoder = new TextEncoder();
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const content = json.message?.content ?? '';
            if (content) controller.enqueue(encoder.encode(content));
            if (json.done) controller.close();
          } catch {
            // Partial JSON line — skip
          }
        }
      }
    },
  });
}

/** Vision completion — extracts text from an image base64 */
export async function completeVision(
  base64Image: string,
  contentType: string,
  prompt: string,
  apiKey?: string
): Promise<string> {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error('GROQ_API_KEY is required for vision tasks.');
  }

  const groq = new Groq({ apiKey: key });
  const model = 'meta-llama/llama-4-scout-17b-16e-instruct';

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${contentType};base64,${base64Image}`,
              },
            },
          ] as any,
        },
      ],
      temperature: 0.2,
    });

    return completion.choices[0]?.message?.content ?? '';
  } catch (err: any) {
    console.error('Groq vision error:', err?.message || err);
    throw err;
  }
}


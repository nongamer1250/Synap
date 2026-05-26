/**
 * Embedding wrapper using HuggingFace Inference API.
 * Model: sentence-transformers/all-MiniLM-L6-v2 (384 dims, free)
 *
 * Falls back to Ollama locally if HF_API_KEY is not set.
 */

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function embedText(text: string): Promise<number[]> {
  if (HF_API_KEY) {
    return embedWithHuggingFace(text);
  }
  return embedWithOllama(text);
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // HuggingFace supports batch embedding natively
  if (HF_API_KEY) {
    return embedBatchWithHuggingFace(texts);
  }
  // Ollama doesn't support batch natively — embed concurrently for high performance
  return Promise.all(texts.map((text) => embedWithOllama(text)));
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 6, delay = 5000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, init);
      if (response.ok) {
        return response;
      }

      // Check if it's a loading/rate limit error (503 Service Unavailable, 424 Failed Dependency, 429 Too Many Requests)
      const isRetryable = response.status === 503 || response.status === 424 || response.status === 429;
      if (isRetryable && i < retries - 1) {
        console.warn(`HuggingFace model is loading or busy (status ${response.status}). Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // Try checking response body for loading indicators
      try {
        const clone = response.clone();
        const body = await clone.json();
        if (body?.error && body.error.includes('loading') && i < retries - 1) {
          console.warn(`HuggingFace model is currently loading. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } catch {
        // Response is not JSON or cloning failed - proceed
      }

      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`HuggingFace fetch attempt failed: ${err instanceof Error ? err.message : err}. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed to fetch HuggingFace API after ${retries} attempts`);
}

async function embedWithHuggingFace(text: string): Promise<number[]> {
  const response = await fetchWithRetry(
    `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  // HF returns nested array for single input
  return Array.isArray(data[0]) ? data[0] : data;
}

async function embedBatchWithHuggingFace(texts: string[]): Promise<number[][]> {
  const response = await fetchWithRetry(
    `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: texts }),
    }
  );

  if (!response.ok) {
    throw new Error(`HuggingFace batch embedding failed: ${response.statusText}`);
  }

  return response.json();
}

async function embedWithOllama(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding;
}

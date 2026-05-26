/**
 * Whisper transcription wrapper.
 * Uses Groq Whisper API (free tier) for cloud transcription.
 * Falls back to HuggingFace Whisper inference for very short audio.
 */

import Groq from 'groq-sdk';
import { createReadStream } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe audio from a Buffer or URL.
 * @param audioBuffer - The raw audio file buffer
 * @param filename - Original filename (used for format detection)
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<TranscriptionResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required for transcription');
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Write buffer to a temp file (Groq SDK needs a file stream)
  const ext = filename.split('.').pop() || 'mp3';
  const tempPath = join(tmpdir(), `synap-${Date.now()}.${ext}`);

  try {
    await writeFile(tempPath, audioBuffer);

    const transcription = await groq.audio.transcriptions.create({
      file: createReadStream(tempPath),
      model: 'whisper-large-v3-turbo', // Best free Groq Whisper model
      response_format: 'verbose_json',
      language: 'en',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = transcription as any;
    return {
      text: transcription.text,
      language: (t.language as string | undefined) ?? 'en',
      duration: (t.duration as number | undefined),
    };
  } finally {
    // Always clean up temp file
    await unlink(tempPath).catch(() => {});
  }
}

/**
 * Text chunking utility for RAG pipeline.
 *
 * Strategy:
 * - Split text into sentences using punctuation boundaries
 * - Group sentences into chunks of ~512 tokens (≈ 400 words)
 * - Add 64-token overlap between chunks to prevent context loss
 * - Return chunks with metadata (index, char offsets)
 */

export interface Chunk {
  content: string;
  chunk_index: number;
  char_start: number;
  char_end: number;
}

const TARGET_CHUNK_WORDS = 400;
const OVERLAP_WORDS = 64;

/** Split text into sentences */
function splitIntoSentences(text: string): string[] {
  // Split on .  !  ?  followed by whitespace or end of string
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Count approximate word count */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Chunk text with overlap */
export function chunkText(text: string): Chunk[] {
  const sentences = splitIntoSentences(text);
  const chunks: Chunk[] = [];

  let currentSentences: string[] = [];
  let currentWordCount = 0;
  let charPosition = 0;
  let chunkIndex = 0;
  let chunkStart = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const words = wordCount(sentence);

    if (currentWordCount + words > TARGET_CHUNK_WORDS && currentSentences.length > 0) {
      // Flush current chunk
      const content = currentSentences.join(' ');
      chunks.push({
        content,
        chunk_index: chunkIndex++,
        char_start: chunkStart,
        char_end: chunkStart + content.length,
      });

      // Overlap: keep last OVERLAP_WORDS worth of sentences
      const overlapSentences: string[] = [];
      let overlapCount = 0;
      for (let j = currentSentences.length - 1; j >= 0; j--) {
        const w = wordCount(currentSentences[j]);
        if (overlapCount + w > OVERLAP_WORDS) break;
        overlapSentences.unshift(currentSentences[j]);
        overlapCount += w;
      }

      // Update char position for next chunk start
      const nonOverlap = currentSentences.slice(0, currentSentences.length - overlapSentences.length);
      charPosition += nonOverlap.join(' ').length + 1;
      chunkStart = charPosition;

      currentSentences = overlapSentences;
      currentWordCount = overlapCount;
    }

    currentSentences.push(sentence);
    currentWordCount += words;
  }

  // Flush remaining
  if (currentSentences.length > 0) {
    const content = currentSentences.join(' ');
    chunks.push({
      content,
      chunk_index: chunkIndex,
      char_start: chunkStart,
      char_end: chunkStart + content.length,
    });
  }

  return chunks;
}

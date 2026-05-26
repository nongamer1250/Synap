const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Custom self-contained .env.local parser
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    // Ignore comments
    if (line.trim().startsWith('#')) return;
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hfApiKey = process.env.HUGGINGFACE_API_KEY;
const hfModel = 'sentence-transformers/all-MiniLM-L6-v2';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple sentence-aware chunker replica
function chunkText(text, maxWords = 400, overlap = 64) {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  const chunks = [];
  let currentChunk = [];
  let currentWordCount = 0;
  let charStart = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const wordCount = sentence.split(/\s+/).filter(Boolean).length;

    if (currentWordCount + wordCount > maxWords && currentChunk.length > 0) {
      const content = currentChunk.join('');
      chunks.push({
        content,
        char_start: charStart,
        char_end: charStart + content.length,
        chunk_index: chunks.length,
      });

      // Handle overlap by backtracking a few sentences
      let overlapWords = 0;
      let backtrackIndex = currentChunk.length - 1;
      const tempChunk = [];
      
      while (backtrackIndex >= 0 && overlapWords < overlap) {
        const backSentence = currentChunk[backtrackIndex];
        const backWords = backSentence.split(/\s+/).filter(Boolean).length;
        tempChunk.unshift(backSentence);
        overlapWords += backWords;
        backtrackIndex--;
      }

      currentChunk = tempChunk;
      currentWordCount = overlapWords;
      charStart = charStart + (content.length - tempChunk.join('').length);
    }

    currentChunk.push(sentence);
    currentWordCount += wordCount;
  }

  if (currentChunk.length > 0) {
    const content = currentChunk.join('');
    chunks.push({
      content,
      char_start: charStart,
      char_end: charStart + content.length,
      chunk_index: chunks.length,
    });
  }

  return chunks;
}

// HuggingFace embed batch helper
async function embedBatch(texts) {
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${hfModel}/pipeline/feature-extraction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${hfApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: texts }),
    }
  );

  if (!response.ok) {
    throw new Error(`HF embedding failed: ${response.statusText}`);
  }

  return response.json();
}

async function run() {
  try {
    console.log('Fetching all notes...');
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, title, content, user_id, upload_id');

    if (notesError) throw notesError;

    console.log(`Found ${notes.length} notes. Checking embeddings...`);

    for (const note of notes) {
      // Check if this note already has chunks
      const { count, error: countError } = await supabase
        .from('document_chunks')
        .select('id', { count: 'exact', head: true })
        .eq('note_id', note.id);

      if (countError) throw countError;

      if (count > 0) {
        console.log(`Note "${note.title}" already has ${count} chunks. Skipping.`);
        continue;
      }

      console.log(`Generating embeddings for note: "${note.title}"...`);
      const chunks = chunkText(note.content);
      
      if (chunks.length === 0) {
        console.log('No content to chunk. Skipping.');
        continue;
      }

      console.log(`- Created ${chunks.length} chunks. Fetching vector embeddings from HuggingFace...`);
      const embeddings = await embedBatch(chunks.map(c => c.content));

      console.log('- Saving chunks to Supabase...');
      const { error: insertError } = await supabase
        .from('document_chunks')
        .insert(
          chunks.map((chunk, i) => ({
            note_id: note.id,
            upload_id: note.upload_id,
            user_id: note.user_id,
            content: chunk.content,
            chunk_index: chunk.chunk_index,
            embedding: embeddings[i],
            metadata: {
              char_start: chunk.char_start,
              char_end: chunk.char_end,
            },
          }))
        );

      if (insertError) {
        console.error(`Failed to save chunks for note ${note.id}:`, insertError);
      } else {
        console.log(`Successfully embedded "${note.title}"!`);
      }
    }

    console.log('Re-embedding process completed!');
  } catch (err) {
    console.error('Error in re-embed script:', err);
  }
}

run();

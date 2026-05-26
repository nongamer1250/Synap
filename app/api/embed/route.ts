import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embedBatch } from '@/lib/ai/embed';
import { chunkText } from '@/lib/ai/chunker';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { note_id } = await request.json();

    if (!note_id) {
      return NextResponse.json({ error: 'note_id is required' }, { status: 400 });
    }

    // Fetch note content
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('content, upload_id')
      .eq('id', note_id)
      .eq('user_id', user.id)
      .single();

    if (noteError || !note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Delete existing chunks for this note (re-embed on update)
    await supabase
      .from('document_chunks')
      .delete()
      .eq('note_id', note_id)
      .eq('user_id', user.id);

    // Chunk the note content
    const chunks = chunkText(note.content);

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No content to embed' }, { status: 400 });
    }

    // Embed all chunks in batch
    const embeddings = await embedBatch(chunks.map((c) => c.content));

    // Insert chunks with embeddings
    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert(
        chunks.map((chunk, i) => ({
          note_id,
          upload_id: note.upload_id,
          user_id: user.id,
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
      console.error('Chunk insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save embeddings' }, { status: 500 });
    }

    return NextResponse.json({
      data: { chunks_created: chunks.length },
    });
  } catch (error) {
    console.error('Embed error:', error);
    return NextResponse.json({ error: 'Embedding failed' }, { status: 500 });
  }
}

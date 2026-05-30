import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embedBatch } from '@/lib/ai/embed';
import { chunkText } from '@/lib/ai/chunker';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(request: Request) {
  const startTime = Date.now();
  let user_id: string | undefined = undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    user_id = user.id;

    // 1. Rate Limiting Check (100 requests / min)
    const ip = getClientIp(request);
    const limiter = await rateLimit(`embed:${ip}`, 100, 60);
    
    if (!limiter.success) {
      logger.warn('Embed rate limit breached', { userId: user.id, route: '/api/embed', metadata: { ip } });
      return NextResponse.json(
        { error: 'Too many embedding requests. Please wait a minute.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limiter.limit),
            'X-RateLimit-Remaining': String(limiter.remaining),
            'X-RateLimit-Reset': String(limiter.reset),
          }
        }
      );
    }

    // 2. Request Schema Zod Validation
    const schema = z.object({
      note_id: z.string().uuid(),
    });

    const body = await request.clone().json().catch(() => ({}));
    const validated = schema.safeParse(body);

    if (!validated.success) {
      logger.warn('Embed request payload validation failed', {
        userId: user.id,
        route: '/api/embed',
        metadata: { errors: validated.error.errors },
      });
      return NextResponse.json(
        { error: 'Invalid request payload', details: validated.error.errors },
        { status: 400 }
      );
    }

    const { note_id } = validated.data;

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
  } catch (error: any) {
    logger.error('Batch embedding process failed', error, {
      userId: user_id,
      route: '/api/embed',
      latencyMs: Date.now() - startTime,
    });
    return NextResponse.json({ error: 'Embedding failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildRAGContext } from '@/lib/ai/rag';
import { stream } from '@/lib/ai/llm';
import type { LLMMessage } from '@/lib/ai/llm';
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

    // 1. Rate Limiting Check (20 requests / min)
    const ip = getClientIp(request);
    const limiter = await rateLimit(`chat:${ip}`, 20, 60);
    
    if (!limiter.success) {
      logger.warn('Chat rate limit breached', { userId: user.id, route: '/api/chat', metadata: { ip } });
      return NextResponse.json(
        { error: 'Too many chat requests. Please wait a minute.' },
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
      session_id: z.string().uuid(),
      message: z.string().min(1).max(5000),
      note_id: z.string().uuid().nullable().optional(),
    });

    const body = await request.clone().json().catch(() => ({}));
    const validated = schema.safeParse(body);

    if (!validated.success) {
      logger.warn('Chat request payload validation failed', {
        userId: user.id,
        route: '/api/chat',
        metadata: { errors: validated.error.errors },
      });
      return NextResponse.json(
        { error: 'Invalid request payload', details: validated.error.errors },
        { status: 400 }
      );
    }

    const { session_id, message, note_id } = validated.data;

    // Verify session belongs to user
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Save user message
    await supabase.from('chat_messages').insert({
      session_id,
      role: 'user',
      content: message,
    });

    // Fetch conversation history
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(12);

    const conversationHistory: LLMMessage[] = (history ?? []).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Build RAG context
    const ragContext = await buildRAGContext(
      message,
      user.id,
      note_id ?? session.note_id,
      conversationHistory.slice(0, -1) // exclude current message
    );

    // Stream LLM response
    const readable = await stream(ragContext.messages, { temperature: 0.3, maxTokens: 1024 });

    // Accumulate response for saving to DB (in background)
    let fullResponse = '';
    const encoder = new TextEncoder();

    const transformedStream = new ReadableStream({
      async start(controller) {
        const reader = readable.getReader();

        // Stream sources as a special first chunk
        const sourcesHeader = `data: ${JSON.stringify({ sources: ragContext.sources })}\n\n`;
        controller.enqueue(encoder.encode(sourcesHeader));

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Save assistant message to DB when stream is done
            supabase.from('chat_messages').insert({
              session_id,
              role: 'assistant',
              content: fullResponse,
              sources: ragContext.sources,
            }).then();

            controller.close();
            break;
          }

          const text = new TextDecoder().decode(value);
          fullResponse += text;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    logger.error('Chat session handler failed', error, {
      userId: user_id,
      route: '/api/chat',
      latencyMs: Date.now() - startTime,
    });
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      // Get messages for a session
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data: messages });
    }

    // Get all sessions
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error('Chat sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Create a new chat session
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { note_id, title } = await request.json();

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        note_id: note_id || null,
        title: title || 'New Chat',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: session });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

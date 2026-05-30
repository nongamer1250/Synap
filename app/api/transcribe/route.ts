import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/ai/transcribe';
// @ts-ignore - Import the parser directly to bypass the index.js module.parent startup bug in Next.js bundlers
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const maxDuration = 60; // Vercel max for free tier

export async function POST(request: Request) {
  const startTime = Date.now();
  let bodyUploadId: string | null = null;
  let user_id: string | undefined = undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    user_id = user.id;

    // 1. Rate Limiting Check (10 uploads / hour)
    const ip = getClientIp(request);
    const limiter = await rateLimit(`transcribe:${ip}`, 10, 3600);
    
    if (!limiter.success) {
      logger.warn('Transcribe rate limit breached', { userId: user.id, route: '/api/transcribe', metadata: { ip } });
      return NextResponse.json(
        { error: 'Too many file processing requests. Limit is 10 uploads per hour.' },
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
      upload_id: z.string().uuid(),
    });

    const body = await request.clone().json().catch(() => ({}));
    const validated = schema.safeParse(body);

    if (!validated.success) {
      logger.warn('Transcribe request payload validation failed', {
        userId: user.id,
        route: '/api/transcribe',
        metadata: { errors: validated.error.errors },
      });
      return NextResponse.json(
        { error: 'Invalid request payload', details: validated.error.errors },
        { status: 400 }
      );
    }

    const { upload_id } = validated.data;
    bodyUploadId = upload_id;

    // Fetch upload record
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .select('*')
      .eq('id', bodyUploadId)
      .eq('user_id', user.id)
      .single();

    if (uploadError || !upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase
      .from('uploads')
      .update({ status: 'processing' })
      .eq('id', bodyUploadId);

    // Extract storage path from file_url (everything after '/uploads/')
    const urlParts = upload.file_url.split('/uploads/');
    const storagePath = urlParts[1];

    if (!storagePath) {
      throw new Error('Invalid file URL structure.');
    }

    // Download file from Supabase Storage using the SDK (respects RLS)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('uploads')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      throw new Error('Failed to download file from storage');
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());

    let textContent = '';
    let durationSeconds: number | null = null;

    if (upload.file_type === 'audio') {
      const filename = upload.file_url.split('/').pop() || 'audio.mp3';
      // Transcribe audio using Whisper
      const result = await transcribeAudio(fileBuffer, filename);
      textContent = result.text;
      durationSeconds = result.duration ? Math.round(result.duration) : null;
    } else if (upload.file_type === 'pdf') {
      // Extract text from PDF using legacy pdf-parse
      const pdfData = await pdf(fileBuffer);
      textContent = pdfData.text || '';

      if (textContent.trim().length < 50) {
        throw new Error('Parsed PDF text is too short or empty. Please make sure the PDF has selectable text.');
      }
    } else if (upload.file_type === 'image') {
      // Extract text from Image using LLM Vision OCR
      const base64Image = fileBuffer.toString('base64');
      const ocrPrompt = 'Extract all study notes, text, equations, and information from this lecture page/notes image. Keep it structured and clean. Only return the extracted study notes text.';
      const { completeVision } = await import('@/lib/ai/llm');
      
      const extension = upload.file_url.split('.').pop()?.toLowerCase() || 'jpeg';
      const mimeType = extension === 'png' ? 'image/png' : (extension === 'webp' ? 'image/webp' : 'image/jpeg');

      textContent = await completeVision(base64Image, mimeType, ocrPrompt);

      if (textContent.trim().length < 20) {
        throw new Error('Failed to extract text from the image scan. Please ensure the image is clear and contains readable text.');
      }
    } else {
      throw new Error('Unsupported file type for processing.');
    }

    // Save transcript / extracted text
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        upload_id: bodyUploadId,
        user_id: user.id,
        content: textContent,
        language: 'en',
      })
      .select()
      .single();

    if (transcriptError) {
      throw transcriptError;
    }

    // Update upload status to done
    await supabase
      .from('uploads')
      .update({
        status: 'done',
        duration_seconds: durationSeconds,
      })
      .eq('id', bodyUploadId);

    return NextResponse.json({ data: transcript });
  } catch (error: any) {
    logger.error('Transcription and file processing failed', error, {
      userId: user_id,
      route: '/api/transcribe',
      latencyMs: Date.now() - startTime,
      metadata: { uploadId: bodyUploadId },
    });

    // Update status to error
    if (bodyUploadId) {
      const supabase = await createClient();
      await supabase
        .from('uploads')
        .update({ status: 'error' })
        .eq('id', bodyUploadId);
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'File processing failed' }, { status: 500 });
  }
}

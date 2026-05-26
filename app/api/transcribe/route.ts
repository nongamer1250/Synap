import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { transcribeAudio } from '@/lib/ai/transcribe';
// @ts-ignore - Import the parser directly to bypass the index.js module.parent startup bug in Next.js bundlers
import pdf from 'pdf-parse/lib/pdf-parse.js';

export const maxDuration = 60; // Vercel max for free tier

export async function POST(request: Request) {
  let bodyUploadId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    bodyUploadId = body.upload_id;

    if (!bodyUploadId) {
      return NextResponse.json({ error: 'upload_id is required' }, { status: 400 });
    }

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
  } catch (error) {
    console.error('File processing error:', error);

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

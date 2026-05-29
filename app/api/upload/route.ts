import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/webm',
  'audio/ogg',
];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_PDF_SIZE = 10 * 1024 * 1024;   // 10MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine file type
    let isAudio = ALLOWED_AUDIO_TYPES.includes(file.type);
    let isPdf = ALLOWED_PDF_TYPES.includes(file.type);
    let isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

    // Fallback: Check file extension if browser MIME-type detection is missing or incorrect (common on mobile browsers)
    if (!isAudio && !isPdf && !isImage && file.name) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        isPdf = true;
      } else if (['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(extension || '')) {
        isAudio = true;
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
        isImage = true;
      }
    }

    if (!isAudio && !isPdf && !isImage) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload MP3, WAV, M4A, WebM, OGG, PDF, or Image.' },
        { status: 400 }
      );
    }

    const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_PDF_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${isAudio ? '25MB' : '10MB'}.` },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const storagePath = `${user.id}/${Date.now()}.${fileExt}`;
    const bytes = await file.arrayBuffer();

    const { error: storageError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(storagePath);

    // Create upload record in DB
    const { data: upload, error: dbError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        file_type: isAudio ? 'audio' : (isPdf ? 'pdf' : 'image'),
        file_url: publicUrl,
        file_size: file.size,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save upload record' }, { status: 500 });
    }

    return NextResponse.json({ data: upload });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

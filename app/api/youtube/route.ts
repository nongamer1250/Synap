import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractVideoId, getVideoDetails, getVideoTranscript } from '@/lib/ai/youtube';

export const maxDuration = 60; // Max execution time for Vercel Serverless

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL. Please provide a valid video link.' }, { status: 400 });
    }

    // Step 1: Fetch Video Metadata & Transcript in parallel to save critical execution time
    let details: any;
    let transcriptText: string;

    try {
      const [fetchedDetails, fetchedTranscript] = await Promise.all([
        getVideoDetails(videoId).catch((err) => {
          console.error('oEmbed fetch error, using fallbacks:', err);
          return {
            title: `YouTube Video — ${videoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            author: 'YouTube Creator',
          };
        }),
        getVideoTranscript(videoId),
      ]);
      
      details = fetchedDetails;
      transcriptText = fetchedTranscript;
    } catch (err: any) {
      console.error('Transcript retrieval failed:', err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Could not fetch transcript for this video.' },
        { status: 400 }
      );
    }

    // Step 2: Create entry in uploads table
    const { data: upload, error: uploadError } = await supabase
      .from('uploads')
      .insert({
        user_id: user.id,
        title: details.title,
        file_type: 'youtube',
        file_url: `https://www.youtube.com/watch?v=${videoId}`,
        status: 'done', // Transcript is ready immediately
      })
      .select()
      .single();

    if (uploadError) {
      console.error('DB upload insert error:', uploadError);
      return NextResponse.json({ error: 'Failed to create upload record' }, { status: 500 });
    }

    // Step 3: Create entry in transcripts table
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        upload_id: upload.id,
        user_id: user.id,
        content: transcriptText,
        language: 'en',
      })
      .select()
      .single();

    if (transcriptError) {
      console.error('DB transcript insert error:', transcriptError);
      // Clean up the upload record if transcript fails
      await supabase.from('uploads').delete().eq('id', upload.id);
      return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        upload_id: upload.id,
        title: upload.title,
        transcript: transcript.content,
      },
    });
  } catch (error) {
    console.error('YouTube API endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

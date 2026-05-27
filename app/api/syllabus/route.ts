import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { complete, completeVision } from '@/lib/ai/llm';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';

export const maxDuration = 60; // Max timeout on Vercel Hobby

const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SYLLABUS_SYSTEM_PROMPT = `You are an expert curriculum analyzer.
Analyze the syllabus raw text and extract a list of main topics/chapters for a structured study plan.

RULES:
- Extract between 5 and 25 core topics/chapters.
- Provide a clear, short title for each topic.
- Provide a brief 1-2 sentence description of what the topic covers (sub-concepts, objectives, keywords).
- Return the response as a JSON object matching this structure EXACTLY:
  {
    "title": "A general title for the syllabus / course",
    "topics": [
      {
        "title": "Topic 1 Title",
        "description": "Brief description of concepts covered."
      }
    ]
  }
`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const titleVal = formData.get('title') as string | null;
    const examDateVal = formData.get('exam_date') as string | null;
    const customApiKey = request.headers.get('x-groq-api-key') || undefined;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let isPdf = ALLOWED_PDF_TYPES.includes(file.type);
    let isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

    // Fallback: Check file extension if browser MIME-type detection is missing or incorrect (common on mobile browsers)
    if (!isPdf && !isImage && file.name) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'pdf') {
        isPdf = true;
      } else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension || '')) {
        isImage = true;
      }
    }

    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or an image (JPEG, PNG, WebP).' },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max size is 10MB.' }, { status: 400 });
    }

    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const storagePath = `${user.id}/syllabus/${Date.now()}.${fileExt}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: storageError } = await supabase.storage
      .from('uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', storageError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(storagePath);

    // 2. Extract raw text from file
    let rawText = '';
    if (isPdf) {
      const pdfData = await pdf(buffer);
      rawText = pdfData.text || '';
    } else if (isImage) {
      const base64Image = buffer.toString('base64');
      const ocrPrompt = 'Extract all syllabus topics, chapter titles, course schedules, and course information from this syllabus image. Keep it structured and clean. Only return the extracted syllabus text.';
      rawText = await completeVision(base64Image, file.type, ocrPrompt, customApiKey);
    }

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Failed to extract text from syllabus. Please ensure the file contains readable text.' },
        { status: 400 }
      );
    }

    // 3. Send raw text to LLM to extract structured topics
    const response = await complete(
      [
        { role: 'system', content: SYLLABUS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the following syllabus text and return the structured JSON:\n\n${rawText}`,
        },
      ],
      {
        temperature: 0.2,
        maxTokens: 3000,
        jsonMode: true,
        model: 'llama-3.3-70b-versatile',
        apiKey: customApiKey,
      }
    );

    let parsedSyllabus: { title: string; topics: { title: string; description: string }[] };
    try {
      parsedSyllabus = JSON.parse(response);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', response);
      return NextResponse.json({ error: 'AI failed to generate a structured syllabus study plan.' }, { status: 500 });
    }

    const syllabusTitle = titleVal || parsedSyllabus.title || file.name.replace(/\.[^/.]+$/, '');
    const topics = parsedSyllabus.topics || [];

    if (topics.length === 0) {
      return NextResponse.json({ error: 'No topics could be extracted from the syllabus.' }, { status: 400 });
    }

    // 4. Save Syllabus and Syllabus Topics to Database
    const { data: syllabusRecord, error: syllabusError } = await supabase
      .from('syllabi')
      .insert({
        user_id: user.id,
        title: syllabusTitle,
        exam_date: examDateVal || null,
        file_url: publicUrl,
        file_type: isPdf ? 'pdf' : 'image',
        raw_text: rawText,
        topic_count: topics.length,
      })
      .select()
      .single();

    if (syllabusError || !syllabusRecord) {
      console.error('Syllabus insert error:', syllabusError);
      return NextResponse.json({ error: 'Failed to save syllabus to database' }, { status: 500 });
    }

    const topicsToInsert = topics.map((topic, index) => ({
      syllabus_id: syllabusRecord.id,
      user_id: user.id,
      title: topic.title,
      description: topic.description || null,
      sort_order: index,
      status: 'not_started',
    }));

    const { error: topicsError } = await supabase
      .from('syllabus_topics')
      .insert(topicsToInsert);

    if (topicsError) {
      console.error('Syllabus topics insert error:', topicsError);
      // Clean up syllabus record on topics failure
      await supabase.from('syllabi').delete().eq('id', syllabusRecord.id);
      return NextResponse.json({ error: 'Failed to save syllabus topics' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        ...syllabusRecord,
        topics: topicsToInsert,
      },
    });
  } catch (error) {
    console.error('Syllabus POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: syllabi, error } = await supabase
      .from('syllabi')
      .select('*, syllabus_topics(id, status)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Syllabi fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: syllabi });
  } catch (error) {
    console.error('Syllabi GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

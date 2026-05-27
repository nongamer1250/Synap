import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { complete } from '@/lib/ai/llm';

export const maxDuration = 60;

const NOTES_SYSTEM_PROMPT = `You are an expert academic note-taker and study assistant.
Your task is to convert lecture transcripts into beautiful, well-structured study notes.

RULES:
- Use clear markdown formatting with headings (##, ###)
- Extract and emphasize KEY CONCEPTS in bold
- Use bullet points for lists and sub-concepts
- Include a brief summary at the top
- Identify important DEFINITIONS and label them clearly
- Keep notes concise but comprehensive
- Group related information logically
- Do NOT add information not present in the transcript

OUTPUT FORMAT (JSON):
{
  "title": "Short descriptive title for these notes",
  "summary": "2-3 sentence overview of the main topic",
  "content": "Full markdown notes here...",
  "key_concepts": ["concept1", "concept2", "concept3", ...]
}`;

function splitTranscript(text: string, maxSegmentLength = 8000): string[] {
  const words = text.split(/\s+/);
  const segments: string[] = [];
  let currentSegment: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length + 1 > maxSegmentLength && currentSegment.length > 0) {
      segments.push(currentSegment.join(' '));
      currentSegment = [];
      currentLength = 0;
    }
    currentSegment.push(word);
    currentLength += word.length + 1;
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment.join(' '));
  }

  return segments;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, upload_id } = body;
    const customApiKey = request.headers.get('x-groq-api-key') || undefined;

    // 1. Generate Notes for a Single Segment (using premium 70B model)
    if (action === 'generate_segment') {
      const { segment, index, total } = body;
      if (!segment) {
        return NextResponse.json({ error: 'segment content is required' }, { status: 400 });
      }

      // Enforce daily limit of 5 notes per day for the free tier (only if no custom API key is provided)
      if (!customApiKey || !customApiKey.startsWith('gsk_')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        if (countError) {
          console.error('Failed to query daily note count:', countError);
        } else if (count !== null && count >= 5) {
          return NextResponse.json(
            { error: 'Daily free limit reached (5 notes/day). Please add your own free Groq API key in the API Settings on the Upload page to unlock unlimited notes!' },
            { status: 403 }
          );
        }
      }

      const response = await complete(
        [
          { role: 'system', content: NOTES_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `This is section ${index + 1} of ${total} of a long lecture transcript. Please create study notes for this section:\n\n${segment}`,
          },
        ],
        { 
          temperature: 0.4, 
          maxTokens: 2000, 
          jsonMode: true,
          model: 'llama-3.3-70b-versatile', // Premium 70B model
          apiKey: customApiKey,
        }
      );

      return NextResponse.json({ data: JSON.parse(response) });
    }

    // 2. Consolidate Segment Notes & Save to Database
    if (action === 'consolidate') {
      const { title, segments_data } = body;
      if (!segments_data || !Array.isArray(segments_data) || segments_data.length === 0) {
        return NextResponse.json({ error: 'segments_data is required' }, { status: 400 });
      }

      let finalTitle = title || segments_data.find(s => s.title)?.title || 'Lecture Notes';
      let allKeyConcepts: string[] = [];
      let contents: string[] = [];
      let summaries: string[] = [];

      segments_data.forEach((s) => {
        if (s.content) contents.push(s.content);
        if (s.summary) summaries.push(s.summary);
        if (s.key_concepts) allKeyConcepts = allKeyConcepts.concat(s.key_concepts);
      });

      const parsed = {
        title: finalTitle,
        summary: summaries.filter(s => s).slice(0, 3).join(' '),
        content: contents.filter(c => c).join('\n\n---\n\n'),
        key_concepts: Array.from(new Set(allKeyConcepts)),
      };

      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          upload_id: upload_id || null,
          user_id: user.id,
          title: parsed.title,
          summary: parsed.summary,
          content: parsed.content,
          key_concepts: parsed.key_concepts,
        })
        .select()
        .single();

      if (error) {
        console.error('Note insert error:', error);
        return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
      }

      return NextResponse.json({ data: note });
    }

    // 3. Backwards Compatibility / Fallback: Direct single chunk process
    const { transcript } = body;
    if (!transcript || transcript.trim().length < 50) {
      return NextResponse.json(
        { error: 'Transcript is too short to generate notes' },
        { status: 400 }
      );
    }

    let parsed: {
      title: string;
      summary: string;
      content: string;
      key_concepts: string[];
    };

    const segments = splitTranscript(transcript);

    if (segments.length === 1) {
      // Enforce daily limit of 5 notes per day for the free tier (only if no custom API key is provided)
      if (!customApiKey || !customApiKey.startsWith('gsk_')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        if (countError) {
          console.error('Failed to query daily note count:', countError);
        } else if (count !== null && count >= 5) {
          return NextResponse.json(
            { error: 'Daily free limit reached (5 notes/day). Please add your own free Groq API key in the API Settings on the Upload page to unlock unlimited notes!' },
            { status: 403 }
          );
        }
      }

      const response = await complete(
        [
          { role: 'system', content: NOTES_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Please create study notes from this lecture transcript:\n\n${transcript}`,
          },
        ],
        { temperature: 0.4, maxTokens: 2000, jsonMode: true, model: 'llama-3.3-70b-versatile', apiKey: customApiKey }
      );

      try {
        parsed = JSON.parse(response);
      } catch {
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    } else {
      // Enforce daily limit of 5 notes per day for the free tier (only if no custom API key is provided)
      if (!customApiKey || !customApiKey.startsWith('gsk_')) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
          .from('notes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString());

        if (countError) {
          console.error('Failed to query daily note count:', countError);
        } else if (count !== null && count >= 5) {
          return NextResponse.json(
            { error: 'Daily free limit reached (5 notes/day). Please add your own free Groq API key in the API Settings on the Upload page to unlock unlimited notes!' },
            { status: 403 }
          );
        }
      }

      // Server-side Map-Reduce parallel fallback (uses Mixtral/8B to minimize timeouts)
      const contents: string[] = new Array(segments.length);
      const summaries: string[] = new Array(segments.length);
      const keyConceptsParts: string[][] = new Array(segments.length);
      const titles: string[] = new Array(segments.length);

      const promises = segments.map(async (segment, i) => {
        const segmentPrompt = `This is part ${i + 1} of ${segments.length} of a long lecture transcript. Please create study notes for this section:\n\n${segment}`;
        
        try {
          const response = await complete(
            [
              { role: 'system', content: NOTES_SYSTEM_PROMPT },
              {
                role: 'user',
                content: segmentPrompt,
              },
            ],
            { 
              temperature: 0.4, 
              maxTokens: 2000, 
              jsonMode: true,
              model: 'llama-3.1-8b-instant',
              apiKey: customApiKey,
            }
          );

          const partParsed = JSON.parse(response);
          contents[i] = partParsed.content || '';
          summaries[i] = partParsed.summary || '';
          keyConceptsParts[i] = partParsed.key_concepts || [];
          titles[i] = partParsed.title || '';
        } catch (e) {
          console.error(`Failed to generate/parse chunk ${i + 1} response:`, e);
          contents[i] = '';
          summaries[i] = '';
          keyConceptsParts[i] = [];
          titles[i] = '';
        }
      });

      await Promise.all(promises);

      let finalTitle = titles.find(t => t) || 'Lecture Notes';
      let allKeyConcepts: string[] = [];
      keyConceptsParts.forEach(parts => {
        if (parts) allKeyConcepts = allKeyConcepts.concat(parts);
      });

      parsed = {
        title: finalTitle,
        summary: summaries.filter(s => s).slice(0, 3).join(' '),
        content: contents.filter(c => c).join('\n\n---\n\n'),
        key_concepts: Array.from(new Set(allKeyConcepts)),
      };
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        upload_id: upload_id || null,
        user_id: user.id,
        title: parsed.title,
        summary: parsed.summary,
        content: parsed.content,
        key_concepts: parsed.key_concepts,
      })
      .select()
      .single();

    if (error) {
      console.error('Note insert error:', error);
      return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 });
    }

    return NextResponse.json({ data: note });
  } catch (error) {
    console.error('Notes generation error:', error);
    return NextResponse.json({ error: 'Failed to generate notes' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: notes });
  } catch (error) {
    console.error('Notes fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

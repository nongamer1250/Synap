import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { complete, LLMMessage } from '@/lib/ai/llm';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Authenticate user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 411 });
    }

    const body = await req.json();
    const { syllabusTitle, topics } = body;

    if (!syllabusTitle || !topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'Missing syllabus title or topics' }, { status: 400 });
    }

    const topicsFormatted = topics
      .map((t: any, index: number) => `- ${t.title}: ${t.description || 'No description'}`)
      .join('\n');

    const systemMessage = "You are a Senior Academic Coach specializing in high-speed, last-minute exam preparation and active recall revision.";
    
    const userPrompt = `You are tasked with generating a highly condensed, dense, last-minute revision **Cheat Sheet** for this curriculum.
Syllabus Title: ${syllabusTitle}
Topics covered:
${topicsFormatted}

Please structure the Cheat Sheet into exactly three sections:
1. **Top 20 High-Yield Core Facts** (extremely concise, single-line bullet points packed with high-value study information).
2. **Essential Formulas, Rules, or Key Theories** (rendered in clean, readable text).
3. **10 Critical Definitions & Terminology** (precise, high-yield glossary terms).

Ensure the entire output is structured in beautifully styled, clean Markdown. Do not include introductory text, conversational fluff, or meta-comments. Start directly with the Markdown content.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    // Request Groq completion in standard markdown
    const markdownResult = await complete(messages, {
      temperature: 0.6,
      maxTokens: 3072
    });

    return NextResponse.json({ data: markdownResult });
  } catch (err: any) {
    console.error('[API/Syllabus/CheatSheet] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate cheat sheet' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { complete, LLMMessage } from '@/lib/ai/llm';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Authenticate the user session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 411 });
    }

    const body = await req.json();
    const { syllabusTitle, topics } = body;

    if (!syllabusTitle || !topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json({ error: 'Missing syllabus details or topics' }, { status: 400 });
    }

    // Format syllabus topics into prompt
    const topicsFormatted = topics
      .map((t: any, index: number) => `${index + 1}. Subject: ${t.title}\n   Description: ${t.description || 'No description provided'}`)
      .join('\n\n');

    const systemMessage = "You are a Senior Academic Professor and Examiner specializing in university curriculum modeling and cognitive testing science.";
    
    const userPrompt = `You are tasked with analyzing the following academic curriculum syllabus and forecasting the Top 10 most probable exam questions.
Syllabus Title: ${syllabusTitle}
Curriculum Topics:
${topicsFormatted}

For each predicted question, you MUST provide:
1. A clear, academically rigorous question testing deep comprehension.
2. The question difficulty level (Easy, Medium, Hard).
3. An array of key concepts tested by the question.
4. A highly detailed, structured, exemplary model answer that would receive full marks in an exam.

Your response MUST be a single, valid JSON object with the following exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here...",
      "difficulty": "Medium",
      "concepts": ["Concept 1", "Concept 2"],
      "answer": "Detailed model answer text here..."
    }
  ]
}

Ensure the response contains exactly 10 questions. Return ONLY the JSON object. Do not include markdown formatting, backticks, or text before/after the JSON.`;

    const messages: LLMMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userPrompt }
    ];

    // Request Groq completion in JSON mode
    const rawResult = await complete(messages, {
      jsonMode: true,
      temperature: 0.65,
      maxTokens: 4096
    });

    const parsedData = JSON.parse(rawResult);

    if (!parsedData || !Array.isArray(parsedData.questions)) {
      throw new Error('Invalid JSON format returned from AI');
    }

    return NextResponse.json({ data: parsedData.questions });
  } catch (err: any) {
    console.error('[API/Syllabus/Predict] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate predicted exam questions' },
      { status: 500 }
    );
  }
}

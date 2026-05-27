import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get syllabus
    const { data: syllabus, error: syllabusError } = await supabase
      .from('syllabi')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (syllabusError || !syllabus) {
      return NextResponse.json({ error: 'Syllabus not found' }, { status: 404 });
    }

    // Get topics
    const { data: topics, error: topicsError } = await supabase
      .from('syllabus_topics')
      .select('*')
      .eq('syllabus_id', id)
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true });

    if (topicsError) {
      console.error('Syllabus topics fetch error:', topicsError);
      return NextResponse.json({ error: 'Failed to fetch syllabus topics' }, { status: 500 });
    }

    // Get sample papers
    const { data: samplePapers, error: papersError } = await supabase
      .from('sample_papers')
      .select('id, title, format_description, created_at')
      .eq('syllabus_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      data: {
        ...syllabus,
        topics: topics || [],
        sample_papers: samplePapers || [],
      },
    });
  } catch (error) {
    console.error('Syllabus detail GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { exam_date, title, topic_id, status } = body;

    // Verify ownership of the syllabus first
    const { data: syllabus, error: checkError } = await supabase
      .from('syllabi')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !syllabus) {
      return NextResponse.json({ error: 'Syllabus not found or unauthorized' }, { status: 404 });
    }

    if (topic_id) {
      // 1. Update topic status
      if (status && !['not_started', 'in_progress', 'completed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid topic status' }, { status: 400 });
      }

      const { data: topic, error: topicError } = await supabase
        .from('syllabus_topics')
        .update({ status })
        .eq('id', topic_id)
        .eq('syllabus_id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (topicError) {
        console.error('Topic status update error:', topicError);
        return NextResponse.json({ error: 'Failed to update topic status' }, { status: 500 });
      }

      return NextResponse.json({ data: topic });
    } else {
      // 2. Update syllabus details (exam_date or title)
      const updateData: Record<string, any> = {};
      if (exam_date !== undefined) updateData.exam_date = exam_date || null;
      if (title !== undefined) updateData.title = title;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
      }

      const { data: updatedSyllabus, error: updateError } = await supabase
        .from('syllabi')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Syllabus update error:', updateError);
        return NextResponse.json({ error: 'Failed to update syllabus' }, { status: 500 });
      }

      return NextResponse.json({ data: updatedSyllabus });
    }
  } catch (error) {
    console.error('Syllabus PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('syllabi')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Syllabus delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete syllabus' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Syllabus DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

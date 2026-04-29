import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ examPaperId: string }> }
) {
  try {
    const { examPaperId } = await params;

    // Fetch exam paper metadata
    const { data: paper, error: paperError } = await supabaseAdmin
      .from('exam_papers')
      .select('id, name, question_ids, created_at')
      .eq('id', examPaperId)
      .single();

    if (paperError || !paper) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    const questionIds: string[] = paper.question_ids || [];

    if (questionIds.length === 0) {
      return NextResponse.json({ paper, questions: [] });
    }

    // Fetch questions in the stored order
    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .in('id', questionIds);

    if (qError) {
      return NextResponse.json({ error: qError.message }, { status: 500 });
    }

    // Re-sort to match the stored question_ids order
    const ordered = questionIds
      .map((id, index) => {
        const q = questions?.find((q) => q.id === id);
        if (!q) return null;
        return { ...q, exam_number: index + 1 };
      })
      .filter(Boolean);

    return NextResponse.json({ paper, questions: ordered });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ examPaperId: string }> }
) {
  try {
    const { examPaperId } = await params;

    const { error } = await supabaseAdmin
      .from('exam_papers')
      .delete()
      .eq('id', examPaperId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

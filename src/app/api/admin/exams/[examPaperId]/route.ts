import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ examPaperId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await supabase.auth.getUser(token.value);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examPaperId } = await params;

    // Check ownership
    const { data: paper } = await supabaseAdmin
      .from('exam_papers')
      .select('created_by')
      .eq('id', examPaperId)
      .single();

    if (!paper) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (authData.user.user_metadata?.role === 'teacher' && paper.created_by !== authData.user.id) {
      return NextResponse.json({ error: 'Forbidden. Bạn chỉ được sửa đề do mình tạo ra.' }, { status: 403 });
    }

    const body = await request.json();
    const updates: any = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.question_ids !== undefined) updates.question_ids = body.question_ids;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Không có dữ liệu cập nhật' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('exam_papers')
      .update(updates)
      .eq('id', examPaperId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ examPaperId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data: authData, error: authError } = await supabase.auth.getUser(token.value);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examPaperId } = await params;

    // Check ownership
    const { data: paper } = await supabaseAdmin
      .from('exam_papers')
      .select('created_by')
      .eq('id', examPaperId)
      .single();

    if (!paper) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (authData.user.user_metadata?.role === 'teacher' && paper.created_by !== authData.user.id) {
      return NextResponse.json({ error: 'Forbidden. Bạn chỉ được xóa đề do mình tạo ra.' }, { status: 403 });
    }

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

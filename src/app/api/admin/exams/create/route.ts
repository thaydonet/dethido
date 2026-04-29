import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_token');

    if (!adminToken || adminToken.value !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examName, questionIds } = await request.json();

    if (!examName || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Check name doesn't already exist
    const { data: existing } = await supabaseAdmin
      .from('exam_papers')
      .select('id')
      .eq('name', examName.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Tên đề này đã tồn tại!' }, { status: 409 });
    }

    // Save only the exam metadata + ordered list of question IDs
    const { data, error } = await supabaseAdmin
      .from('exam_papers')
      .insert({
        name: examName.trim(),
        question_ids: questionIds, // UUID array, no data duplication
      })
      .select()
      .single();

    if (error) {
      console.error('exam_papers insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('create exam error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

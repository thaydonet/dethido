import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const dang_toan = searchParams.get('dang_toan');
  const difficulty = searchParams.get('difficulty') || null;
  const type = searchParams.get('type') || null;
  const count = parseInt(searchParams.get('count') || '10', 10);
  const excludeIdsRaw = searchParams.get('exclude_ids') || '';
  const excludeIds = excludeIdsRaw ? excludeIdsRaw.split(',').filter(Boolean) : [];

  if (!dang_toan) {
    return NextResponse.json(
      { error: 'Missing required parameter: dang_toan' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin.rpc('get_questions_by_dang', {
    p_dang_toan: dang_toan,
    p_difficulty: difficulty,
    p_type: type,
    p_count: count,
    p_exclude_ids: excludeIds,
  });

  if (error) {
    console.error('[quiz/route] Supabase RPC error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const questions = (data || []).map((q: any, index: number) => ({
    ...q,
    exam_number: index + 1,
  }));

  return NextResponse.json({ questions, total: questions.length });
}

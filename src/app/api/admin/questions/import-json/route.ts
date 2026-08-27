import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token');
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token.value);
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, questions } = body;

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'JSON không hợp lệ. Cần có "title" và mảng "questions".' }, { status: 400 });
    }

    // Map JSON questions to DB format
    const rows = questions.map((q: any, index: number) => {
      const type = (q.type || 'mcq').toLowerCase();

      // Build options object (only for mcq/msq)
      let options: any = null;
      if (type === 'mcq' || type === 'msq') {
        options = {
          ...(q.option_a !== undefined && { option_a: q.option_a }),
          ...(q.option_b !== undefined && { option_b: q.option_b }),
          ...(q.option_c !== undefined && { option_c: q.option_c }),
          ...(q.option_d !== undefined && { option_d: q.option_d }),
        };
        if (Object.keys(options).length === 0) options = null;
      }

      const metadata: any = {
        type,
        difficulty: q.difficulty_level || 'medium',
        is_dynamic: q.is_dynamic ?? false,
      };
      if (q.explanation) metadata.explanation = q.explanation;

      return {
        de_id: title.trim(),
        so_cau: index + 1,
        phan: type === 'mcq' ? '1' : type === 'msq' ? '2' : '3',
        content: q.question || q.content || '',
        options,
        answer: q.correct_option || q.answer || '',
        // explanation is stored inside metadata.explanation, NOT as a separate column
        metadata,
        created_by: user.id,
      };
    });

    const { data, error } = await supabaseAdmin
      .from('questions')
      .insert(rows)
      .select('id');

    if (error) {
      console.error('import-json insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: data?.length ?? 0 });
  } catch (err: any) {
    console.error('import-json error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

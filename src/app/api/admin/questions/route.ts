import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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

    const user = authData.user;
    const isTeacher = user.user_metadata?.role === 'teacher';

    let query = supabaseAdmin
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (isTeacher) {
      // Teacher only sees their own questions
      query = query.eq('created_by', user.id);
    }
    // Admin sees all questions (no filter)

    let allQuestions: any[] = [];
    let page = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) break;
      if (!data || data.length === 0) break;
      allQuestions = [...allQuestions, ...data];
      if (data.length < pageSize) break;
      page++;
    }

    return NextResponse.json({ data: allQuestions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

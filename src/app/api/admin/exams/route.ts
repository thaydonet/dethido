import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token');

    let isTeacher = false;
    let userId = null;

    if (token) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
      const { data: authData } = await supabase.auth.getUser(token.value);
      
      if (authData.user) {
        userId = authData.user.id;
        isTeacher = authData.user.user_metadata?.role === 'teacher';
      }
    }

    let query = supabaseAdmin
      .from('exam_papers')
      .select('id, name, slug, question_ids, created_at, created_by')
      .order('created_at', { ascending: false });

    if (isTeacher && userId) {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query;

    if (error) {
      // Fallback if created_by doesn't exist yet
      if (error.code === '42703') { // undefined_column
        const fallbackQuery = await supabaseAdmin
          .from('exam_papers')
          .select('id, name, slug, question_ids, created_at')
          .order('created_at', { ascending: false });
        return NextResponse.json({ data: fallbackQuery.data || [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

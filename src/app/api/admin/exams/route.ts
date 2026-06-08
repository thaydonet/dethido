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
      .select('id, name, slug, question_ids, created_at, created_by, view_count')
      .order('created_at', { ascending: false });

    if (isTeacher && userId) {
      query = query.eq('created_by', userId);
    }

    const { data, error } = await query;

    let examPapers: any[] = data || [];

    if (error) {
      // Fallback if view_count or created_by doesn't exist yet
      if (error.code === '42703') { // undefined_column
        const fallbackQuery = await supabaseAdmin
          .from('exam_papers')
          .select('id, name, slug, question_ids, created_at, created_by')
          .order('created_at', { ascending: false });
        
        if (fallbackQuery.error && fallbackQuery.error.code === '42703') {
           const veryOldQuery = await supabaseAdmin
            .from('exam_papers')
            .select('id, name, slug, question_ids, created_at')
            .order('created_at', { ascending: false });
           examPapers = veryOldQuery.data || [];
        } else {
           examPapers = fallbackQuery.data || [];
        }
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    let totalTeachers = 0;
    let usersList: any[] = [];
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!usersError && usersData?.users) {
      usersList = usersData.users;
      totalTeachers = usersList.filter(u => u.user_metadata?.role === 'teacher').length;
    }

    const finalData = examPapers.map((paper: any) => {
      const creator = usersList.find(u => u.id === paper.created_by);
      return {
        ...paper,
        created_by_email: creator ? creator.email : 'N/A'
      };
    });

    return NextResponse.json({ data: finalData, totalTeachers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

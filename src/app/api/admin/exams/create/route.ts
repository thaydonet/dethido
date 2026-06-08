import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/slugify';

export async function POST(request: NextRequest) {
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

    const baseSlug = slugify(examName.trim());
    let finalSlug = baseSlug;
    
    // Ensure unique slug
    const { data: existingSlugs } = await supabaseAdmin
      .from('exam_papers')
      .select('slug')
      .like('slug', `${baseSlug}%`);
      
    if (existingSlugs && existingSlugs.length > 0) {
      finalSlug = `${baseSlug}-${existingSlugs.length + 1}`;
    }

    // Save only the exam metadata + ordered list of question IDs
    const { data, error } = await supabaseAdmin
      .from('exam_papers')
      .insert({
        name: examName.trim(),
        slug: finalSlug, // The new slug column
        question_ids: questionIds, // UUID array, no data duplication
        created_by: authData.user.id, // Store the teacher who created it
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

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'thaydo.net@gmail.com';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token');
  if (!token) return { isAuth: false, user: null };
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  
  const { data, error } = await supabase.auth.getUser(token.value);
  if (error || !data.user) return { isAuth: false, user: null };

  return { isAuth: true, user: data.user };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAuth, user } = await checkAuth();
  if (!isAuth || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = user.email === ADMIN_EMAIL;
  const isTeacher = !isAdmin && user.user_metadata?.role === 'teacher';

  try {
    if (isAdmin) {
      // Admin can delete any question
      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (isTeacher) {
      // Teacher can only delete their own questions
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from('questions')
        .select('created_by')
        .eq('id', id)
        .single();

      if (fetchErr || !existing) {
        return NextResponse.json({ error: 'Không tìm thấy câu hỏi' }, { status: 404 });
      }
      if (existing.created_by !== user.id) {
        return NextResponse.json({ error: 'Forbidden. Bạn chỉ có thể xóa câu hỏi do mình tạo.' }, { status: 403 });
      }

      const { error } = await supabaseAdmin
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAuth, user } = await checkAuth();
  if (!isAuth || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = user.email === ADMIN_EMAIL;
  const isTeacher = !isAdmin && user.user_metadata?.role === 'teacher';

  if (isTeacher) {
    return NextResponse.json({ error: 'Forbidden. Chỉ admin mới được quyền sửa câu hỏi.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    
    const { error } = await supabaseAdmin
      .from('questions')
      .update(body)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

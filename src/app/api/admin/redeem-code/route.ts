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

// GET — check if current teacher has any active grants
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('teacher_grants')
    .select('id, granted_by, granted_at, access_codes(description)')
    .eq('teacher_user_id', user.id)
    .limit(10);

  if (error) return NextResponse.json({ hasGrant: false, grants: [] });
  return NextResponse.json({ hasGrant: (data?.length ?? 0) > 0, grants: data || [] });
}

// POST — teacher redeems a code
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await request.json();
  if (!code?.trim()) return NextResponse.json({ error: 'Vui lòng nhập mã.' }, { status: 400 });

  const normalizedCode = code.trim().toUpperCase();

  // Find the code
  const { data: codeRow, error: codeErr } = await supabaseAdmin
    .from('access_codes')
    .select('id, granted_by, max_uses, used_count, expires_at, is_active, description')
    .eq('code', normalizedCode)
    .maybeSingle();

  if (codeErr || !codeRow) {
    return NextResponse.json({ error: 'Mã không tồn tại. Kiểm tra lại hoặc liên hệ Admin.' }, { status: 404 });
  }

  if (!codeRow.is_active) {
    return NextResponse.json({ error: 'Mã này đã bị vô hiệu hóa.' }, { status: 410 });
  }

  if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Mã đã hết hạn sử dụng.' }, { status: 410 });
  }

  if (codeRow.used_count >= codeRow.max_uses) {
    return NextResponse.json({ error: 'Mã đã đạt số lần sử dụng tối đa.' }, { status: 410 });
  }

  // Check if teacher already has a grant from this admin
  const { data: existing } = await supabaseAdmin
    .from('teacher_grants')
    .select('id')
    .eq('teacher_user_id', user.id)
    .eq('granted_by', codeRow.granted_by)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Bạn đã được cấp quyền truy cập ngân hàng này rồi.' }, { status: 409 });
  }

  // Create grant
  const { error: grantErr } = await supabaseAdmin
    .from('teacher_grants')
    .insert({
      teacher_user_id: user.id,
      granted_by: codeRow.granted_by,
      access_code_id: codeRow.id,
    });

  if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 });

  // Increment used_count
  await supabaseAdmin
    .from('access_codes')
    .update({ used_count: codeRow.used_count + 1 })
    .eq('id', codeRow.id);

  return NextResponse.json({
    success: true,
    message: `✅ Kích hoạt thành công! Bạn đã có quyền truy cập ngân hàng câu hỏi.${codeRow.description ? ` (${codeRow.description})` : ''}`,
  });
}

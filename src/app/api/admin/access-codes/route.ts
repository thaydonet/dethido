import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'thaydo.net@gmail.com';

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

function generateCode(): string {
  // Format: XXXX-XXXX-XXXX (alphanumeric uppercase, no confusing chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment()}-${segment()}-${segment()}`;
}

// GET — admin lists their access codes
export async function GET() {
  const user = await getAuthUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('access_codes')
    .select('id, code, description, max_uses, used_count, expires_at, is_active, created_at')
    .eq('granted_by', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

// POST — admin generates a new access code
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const description = body.description || '';
  const maxUses = parseInt(body.max_uses) || 1;
  const expiresAt = body.expires_at || null; // ISO string or null

  // Generate unique code (retry up to 5 times)
  let code = '';
  for (let i = 0; i < 5; i++) {
    const candidate = generateCode();
    const { data: existing } = await supabaseAdmin
      .from('access_codes')
      .select('id')
      .eq('code', candidate)
      .maybeSingle();
    if (!existing) { code = candidate; break; }
  }

  if (!code) return NextResponse.json({ error: 'Không tạo được mã, thử lại.' }, { status: 500 });

  const { data, error } = await supabaseAdmin
    .from('access_codes')
    .insert({
      code,
      granted_by: user.id,
      description,
      max_uses: maxUses,
      used_count: 0,
      expires_at: expiresAt,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

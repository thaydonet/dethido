import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import AdminDashboard from '@/components/AdminDashboard';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token');
  
  if (!token) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase.auth.getUser(token.value);

  if (error || !data.user) {
    return null;
  }
  
  return data.user;
}

export default async function AdminPage() {
  const user = await getUser();
  if (!user) {
    redirect('/admin/login');
  }

  const { data: questions, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
  }

  return <AdminDashboard initialQuestions={questions || []} user={user as any} />;
}

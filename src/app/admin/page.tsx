import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import AdminDashboard from '@/components/AdminDashboard';

export const revalidate = 0;

async function checkAuth() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin_token');
  
  if (!adminToken || adminToken.value !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }
}

export default async function AdminPage() {
  await checkAuth();

  const { data: questions, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
  }

  return <AdminDashboard initialQuestions={questions || []} />;
}

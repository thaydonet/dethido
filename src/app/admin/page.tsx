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

  let allQuestions: any[] = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error('Error fetching questions at page', page, error);
      break;
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    allQuestions = [...allQuestions, ...data];
    
    if (data.length < pageSize) {
      break;
    }
    
    page++;
  }
  
  const questions = allQuestions;

  return <AdminDashboard initialQuestions={questions || []} user={user as any} />;
}

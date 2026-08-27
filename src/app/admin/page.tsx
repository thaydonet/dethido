import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import AdminDashboard from '@/components/AdminDashboard';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

const ADMIN_EMAIL = 'thaydo.net@gmail.com';

async function getUser() {
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

async function fetchAllQuestions(filter: (q: any) => any) {
  let allQuestions: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    let query = supabaseAdmin
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    query = filter(query);

    const { data, error } = await query;
    if (error || !data || data.length === 0) break;
    allQuestions = [...allQuestions, ...data];
    if (data.length < pageSize) break;
    page++;
  }
  return allQuestions;
}

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/admin/login');

  const isAdminByEmail = user.email === ADMIN_EMAIL;
  const isTeacher = !isAdminByEmail && user.user_metadata?.role === 'teacher';

  let hasGrant = false;
  let grantedByIds: string[] = [];

  if (isTeacher) {
    // Check if teacher has any active grants
    const { data: grants } = await supabaseAdmin
      .from('teacher_grants')
      .select('granted_by')
      .eq('teacher_user_id', user.id);

    if (grants && grants.length > 0) {
      hasGrant = true;
      grantedByIds = grants.map((g: any) => g.granted_by);
    }
  }

  let questions: any[] = [];

  if (isAdminByEmail) {
    // Admin: see all questions
    questions = await fetchAllQuestions((q: any) => q);
  } else if (isTeacher && hasGrant) {
    // Teacher with grant: own questions + all questions from grantors (admin's questions)
    // Fetch own questions
    const ownQs = await fetchAllQuestions((q: any) => q.eq('created_by', user.id));
    // Fetch admin questions (created_by IS NULL = system questions, or created_by = grantor)
    const adminQs = await fetchAllQuestions((q: any) =>
      q.or(`created_by.is.null,created_by.in.(${grantedByIds.join(',')})`)
    );
    // Merge, deduplicate by id
    const seen = new Set<string>();
    for (const q of [...adminQs, ...ownQs]) {
      if (!seen.has(q.id)) { seen.add(q.id); questions.push(q); }
    }
  } else {
    // Teacher without grant: only own questions
    questions = await fetchAllQuestions((q: any) => q.eq('created_by', user.id));
  }

  const userWithRole = {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      role: isAdminByEmail ? 'admin' : (user.user_metadata?.role || 'teacher'),
      hasGrant,
    },
  };

  return <AdminDashboard initialQuestions={questions} user={userWithRole as any} />;
}

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import HomeLayout from '@/components/HomeLayout';

// Force dynamic rendering to always fetch the latest questions
export const revalidate = 0;

export default async function Home() {
  // Fetch 20 latest questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch unique exam sets (de_id) with count
  const { data: examsData, error: examsError } = await supabase
    .from('questions')
    .select('de_id')
    .order('de_id', { ascending: true });

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
  }

  if (examsError) {
    console.error('Error fetching exams:', examsError);
  }

  // Group by de_id and count
  const examSets = examsData?.reduce((acc: any[], curr) => {
    const existing = acc.find(item => item.de_id === curr.de_id);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ de_id: curr.de_id, count: 1 });
    }
    return acc;
  }, []) || [];

  return <HomeLayout initialQuestions={questions || []} examSets={examSets} />;
}

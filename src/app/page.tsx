import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import HomeLayout from '@/components/HomeLayout';

// Force dynamic rendering to always fetch the latest questions
export const revalidate = 0;

export default async function Home(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const limit = 9;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  // Fetch all papers to calculate total stats
  const { data: allPapers } = await supabase.from('exam_papers').select('question_ids');
  const totalExams = allPapers?.length || 0;
  const totalQuestions = (allPapers || []).reduce((acc, curr) => acc + (curr.question_ids?.length || 0), 0);
  const totalPages = Math.ceil(totalExams / limit);

  // Fetch paginated exam_papers
  const { data: examPapersRaw } = await supabase
    .from('exam_papers')
    .select('id, name, slug, question_ids, created_at')
    .order('created_at', { ascending: false })
    .range(start, end);

  const examSets = (examPapersRaw || []).map((p: any) => ({
    de_id: p.name,
    slug: p.slug,
    count: (p.question_ids || []).length,
    type: 'generated' as const,
  }));

  return (
    <HomeLayout 
      examSets={examSets} 
      totalExams={totalExams}
      totalQuestions={totalQuestions}
      currentPage={page}
      totalPages={totalPages}
    />
  );
}

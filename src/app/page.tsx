import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import HomeLayout from '@/components/HomeLayout';

// Force dynamic rendering to always fetch the latest questions
export const revalidate = 0;

export default async function Home() {
  // Fetch exam_papers (new generated exams)
  const { data: examPapersRaw } = await supabase
    .from('exam_papers')
    .select('id, name, question_ids, created_at')
    .order('created_at', { ascending: false });

  // Fetch unique de_id from questions (original exams from pipeline)
  const { data: deIdRows } = await supabase
    .from('questions')
    .select('de_id')
    .order('de_id', { ascending: true });

  // Build examSets from de_id (original exams only, exclude names already in exam_papers)
  const paperNames = new Set((examPapersRaw || []).map((p: any) => p.name));

  const deIdMap: Record<string, number> = {};
  (deIdRows || []).forEach((r: any) => {
    deIdMap[r.de_id] = (deIdMap[r.de_id] || 0) + 1;
  });

  const originalExamSets = Object.entries(deIdMap)
    .filter(([de_id]) => !paperNames.has(de_id))
    .map(([de_id, count]) => ({ de_id, count, type: 'original' as const }));

  const examPapers = (examPapersRaw || []).map((p: any) => ({
    de_id: p.name,
    count: (p.question_ids || []).length,
    type: 'generated' as const,
  }));

  const allExamSets = [...examPapers, ...originalExamSets];

  return <HomeLayout examSets={allExamSets} />;
}

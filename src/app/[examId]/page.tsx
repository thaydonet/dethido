import { supabaseAdmin } from '@/lib/supabase-admin';
import ExamInterface from '@/components/ExamInterface';
import { notFound } from 'next/navigation';

export const revalidate = 0;

async function getExamBySlug(examId: string) {
  const decodedId = decodeURIComponent(examId);

  // Try to find an exam_paper with this name (slug)
  const { data: paper, error: paperError } = await supabaseAdmin
    .from('exam_papers')
    .select('id, name, question_ids')
    .eq('name', decodedId)
    .single();

  if (paperError || !paper || !paper.question_ids?.length) {
    // Fallback: try as de_id from questions table
    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('de_id', decodedId)
      .order('so_cau', { ascending: true });

    if (qError || !questions?.length) return null;
    return questions.map((q) => ({ ...q, exam_number: q.so_cau }));
  }

  // Fetch all questions for this exam_paper, in order
  const { data: questions, error: qError } = await supabaseAdmin
    .from('questions')
    .select('*')
    .in('id', paper.question_ids);

  if (qError || !questions) return null;

  // Re-sort by stored question_ids order
  const ordered = paper.question_ids
    .map((id: string, index: number) => {
      const q = questions.find((q) => q.id === id);
      if (!q) return null;
      return { ...q, exam_number: index + 1 };
    })
    .filter(Boolean);

  return ordered;
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const questions = await getExamBySlug(examId);

  if (!questions || questions.length === 0) {
    return notFound();
  }

  return <ExamInterface questions={questions} />;
}

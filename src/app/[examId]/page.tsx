import { supabaseAdmin } from '@/lib/supabase-admin';
import ExamInterface from '@/components/ExamInterface';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const decodedId = decodeURIComponent(examId);

  const { data: paper } = await supabaseAdmin
    .from('exam_papers')
    .select('name')
    .or(`slug.eq.${decodedId},name.eq.${decodedId}`)
    .single();

  return {
    title: paper?.name || 'Đề thi thử TN THPT Môn Toán - 2026',
  };
}

async function getExamBySlug(examId: string) {
  const decodedId = decodeURIComponent(examId);

  // Try to find an exam_paper with this slug or name
  const { data: paper, error: paperError } = await supabaseAdmin
    .from('exam_papers')
    .select('id, name, slug, question_ids')
    .or(`slug.eq.${decodedId},name.eq.${decodedId}`)
    .single();

  if (paperError || !paper || !paper.question_ids?.length) {
    // Fallback: try as de_id from questions table
    const { data: questions, error: qError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('de_id', decodedId)
      .order('so_cau', { ascending: true });

    if (qError || !questions?.length) return null;
    return { questions: questions.map((q) => ({ ...q, exam_number: q.so_cau })), title: decodedId };
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

  return { questions: ordered, title: paper.name };
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const examData = await getExamBySlug(examId);

  if (!examData || examData.questions.length === 0) {
    return notFound();
  }

  return <ExamInterface questions={examData.questions} examTitle={examData.title} />;
}

import { supabaseAdmin } from '@/lib/supabase-admin';
import ExamInterface from '@/components/ExamInterface';

export const revalidate = 0; // Always fetch fresh questions

async function getRandomQuestions() {
  try {
    // Fetch MCQ questions (type = 'mcq')
    const { data: mcqQuestions, error: mcqError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('metadata->>type', 'mcq');

    // Fetch MSQ questions (type = 'msq')
    const { data: msqQuestions, error: msqError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('metadata->>type', 'msq');

    // Fetch SA questions (type = 'sa')
    const { data: saQuestions, error: saError } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('metadata->>type', 'sa');

    if (mcqError || msqError || saError) {
      console.error('Error fetching questions:', { mcqError, msqError, saError });
      return [];
    }

    // Shuffle array helper
    const shuffleArray = (array: any[]) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Lấy số lượng câu hỏi có sẵn (tối đa 12 MCQ, 4 MSQ, 6 SA)
    const availableMCQ = mcqQuestions?.length || 0;
    const availableMSQ = msqQuestions?.length || 0;
    const availableSA = saQuestions?.length || 0;

    const numMCQ = Math.min(12, availableMCQ);
    const numMSQ = Math.min(4, availableMSQ);
    const numSA = Math.min(6, availableSA);

    console.log(`Available questions: MCQ=${availableMCQ}, MSQ=${availableMSQ}, SA=${availableSA}`);
    console.log(`Selected: MCQ=${numMCQ}, MSQ=${numMSQ}, SA=${numSA}`);

    // Select random questions
    const selectedMCQ = shuffleArray(mcqQuestions || []).slice(0, numMCQ);
    const selectedMSQ = shuffleArray(msqQuestions || []).slice(0, numMSQ);
    const selectedSA = shuffleArray(saQuestions || []).slice(0, numSA);

    // Combine and number them
    const allQuestions = [
      ...selectedMCQ.map((q, idx) => ({ ...q, exam_number: idx + 1 })),
      ...selectedMSQ.map((q, idx) => ({ ...q, exam_number: numMCQ + idx + 1 })),
      ...selectedSA.map((q, idx) => ({ ...q, exam_number: numMCQ + numMSQ + idx + 1 })),
    ];

    return allQuestions;
  } catch (error) {
    console.error('Error in getRandomQuestions:', error);
    return [];
  }
}

export default async function ExamPage() {
  const questions = await getRandomQuestions();

  return <ExamInterface questions={questions} />;
}

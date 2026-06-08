import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ExamInterface from '@/components/ExamInterface';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ dang: string }>;
  searchParams: Promise<{ count?: string; difficulty?: string; type?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dang } = await params;
  const dangToan = decodeURIComponent(dang);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thi.booktoan.com';

  return {
    title: `Quiz: ${dangToan} | Luyện tập theo dạng toán`,
    description: `Luyện tập dạng toán "${dangToan}". Hệ thống câu hỏi phân loại theo độ khó NB/TH/VD/VDC cho kỳ thi TN THPT Môn Toán 2026.`,
    openGraph: {
      title: `Quiz: ${dangToan}`,
      description: `Luyện tập dạng toán "${dangToan}" với câu hỏi phong phú, đa dạng.`,
      type: 'article',
      url: `${siteUrl}/quiz/${dang}`,
    },
    twitter: {
      card: 'summary',
      title: `Quiz: ${dangToan}`,
      description: `Luyện tập dạng "${dangToan}"`,
    },
  };
}

async function fetchQuestions(dangToan: string, count: number, difficulty: string | null, type: string | null) {
  const { data, error } = await supabaseAdmin.rpc('get_questions_by_dang', {
    p_dang_toan: dangToan,
    p_difficulty: difficulty,
    p_type: type,
    p_count: count,
    p_exclude_ids: [],
  });

  if (error) {
    console.error('[quiz/[dang]] RPC error:', error);
    return [];
  }

  return (data || []).map((q: any, index: number) => ({
    ...q,
    exam_number: index + 1,
  }));
}

export default async function QuizDangPage({ params, searchParams }: PageProps) {
  const { dang } = await params;
  const sp = await searchParams;

  const dangToan = decodeURIComponent(dang);
  const count = Math.min(Math.max(parseInt(sp.count || '10', 10), 1), 50);
  const difficulty = sp.difficulty && sp.difficulty !== 'all' ? sp.difficulty : null;
  const type = sp.type && sp.type !== 'all' ? sp.type : null;

  const questions = await fetchQuestions(dangToan, count, difficulty, type);

  if (questions.length === 0) {
    // Render a friendly no-questions page instead of notFound()
    return (
      <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
        {/* Header */}
        <header
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1.5rem 2rem',
          }}
        >
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/quiz"
              style={{
                color: 'rgba(255,255,255,0.85)',
                textDecoration: 'none',
                padding: '0.5rem 1.25rem',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.9rem',
                background: 'rgba(255,255,255,0.15)',
                transition: 'all 0.2s',
              }}
            >
              ← Chọn dạng khác
            </Link>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Quiz: {dangToan}</h1>
          </div>
        </header>
        <div
          style={{
            maxWidth: 600,
            margin: '4rem auto',
            textAlign: 'center',
            background: 'white',
            borderRadius: 16,
            padding: '3rem 2rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ color: '#4a5568', marginBottom: '0.75rem' }}>Chưa có câu hỏi cho dạng này</h2>
          <p style={{ color: '#718096', marginBottom: '1.5rem' }}>
            Dạng toán <strong>&quot;{dangToan}&quot;</strong> chưa có câu hỏi
            {difficulty ? ` ở độ khó "${difficulty}"` : ''} trong ngân hàng.
          </p>
          <Link
            href="/quiz"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 10,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Chọn dạng khác
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Back bar with settings */}
      <div
        style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '0.875rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 0,
          zIndex: 200,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        }}
      >
        <Link
          href="/quiz"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#667eea',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            padding: '0.4rem 0.85rem',
            border: '2px solid #e2e8f0',
            borderRadius: 8,
            transition: 'all 0.2s',
          }}
        >
          ← Chọn dạng
        </Link>

        <span
          style={{
            fontWeight: 700,
            color: '#2d3748',
            fontSize: '0.975rem',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {dangToan}
        </span>

        {/* Count Selector */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>Số câu:</span>
          {[5, 10, 20].map((n) => (
            <Link
              key={n}
              href={`/quiz/${dang}?count=${n}${difficulty ? `&difficulty=${sp.difficulty}` : ''}${sp.type && sp.type !== 'all' ? `&type=${sp.type}` : ''}`}
              style={{
                padding: '0.3rem 0.7rem',
                borderRadius: 6,
                fontSize: '0.85rem',
                fontWeight: 700,
                textDecoration: 'none',
                border: '2px solid',
                borderColor: count === n ? '#667eea' : '#e2e8f0',
                background: count === n ? '#667eea' : 'white',
                color: count === n ? 'white' : '#4a5568',
                transition: 'all 0.2s',
              }}
            >
              {n}
            </Link>
          ))}
        </div>

        {/* Difficulty filter */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 600 }}>Độ khó:</span>
          {[
            { val: 'all', label: 'Tất cả' },
            { val: 'NB', label: 'NB' },
            { val: 'TH', label: 'TH' },
            { val: 'VD', label: 'VD' },
            { val: 'VDC', label: 'VDC' },
          ].map(({ val, label }) => {
            const isActive = (sp.difficulty || 'all') === val;
            const diffColors: Record<string, string> = {
              NB: '#48bb78',
              TH: '#3b82f6',
              VD: '#f59e0b',
              VDC: '#ef4444',
              all: '#667eea',
            };
            return (
              <Link
                key={val}
                href={`/quiz/${dang}?count=${sp.count || 10}${val !== 'all' ? `&difficulty=${val}` : ''}${sp.type && sp.type !== 'all' ? `&type=${sp.type}` : ''}`}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '2px solid',
                  borderColor: isActive ? diffColors[val] : '#e2e8f0',
                  background: isActive ? diffColors[val] : 'white',
                  color: isActive ? 'white' : '#4a5568',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quiz Interface */}
      <ExamInterface questions={questions} examTitle={`Quiz: ${dangToan}`} />
    </div>
  );
}

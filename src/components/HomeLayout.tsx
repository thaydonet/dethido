'use client';


interface ExamSet {
  de_id: string;
  count: number;
  type: 'generated' | 'original';
}

interface HomeLayoutProps {
  examSets: ExamSet[];
}

export default function HomeLayout({ examSets }: HomeLayoutProps) {
  const totalQuestions = examSets.reduce((s, e) => s + e.count, 0);
  const generatedCount = examSets.filter(e => e.type === 'generated').length;

  return (
    <div className="hl-root">

      {/* ══════════════ HERO ══════════════ */}
      <header className="hl-hero">
        <div className="hl-hero-glow" aria-hidden />
        <div className="hl-hero-inner">
          <div className="hl-hero-content">
            <h1 className="hl-hero-title">
              Hệ thống Ôn luyện<br />
              <span className="hl-grad">Toán học THPT 2026</span>
            </h1>
            <p className="hl-hero-sub">
              Sẵn sàng cho Kỳ thi Tốt nghiệp THPT với kho đề thi và câu hỏi chất lượng cao,
              được chọn lọc và có lời giải chi tiết.
            </p>

            <a href="/de-thi-thu-tn-thpt-mon-toan-2026" className="hl-cta-large">
              <span className="hl-cta-icon">🎯</span>
              <span className="hl-cta-text">Làm đề thi thử TN THPT Môn Toán 2026</span>
              <span className="hl-cta-arr">→</span>
            </a>
            <p className="hl-hero-sub">
              (Mỗi lần bạn làm đề thi sẽ thay đổi câu hỏi ngẫu nhiên).
            </p>
          </div>

          <div className="hl-hero-image-wrap">
            <img src="/math_exam_2026.png" alt="Math Exam 2026" className="hl-hero-image" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="hl-stats">
          {[
            { icon: '📂', value: examSets.length, label: 'Đề thi bám sát cấu trúc' },
            { icon: '❓', value: totalQuestions, label: 'Câu hỏi chất lượng' },
            { icon: '💡', value: '100%', label: 'Có lời giải chi tiết' },
            { icon: '∑', value: 'Trực quan', label: 'Toán học chuẩn LaTeX' },
          ].map(s => (
            <div key={s.label} className="hl-stat">
              <span className="hl-stat-icon">{s.icon}</span>
              <span className="hl-stat-val">{s.value}</span>
              <span className="hl-stat-lbl">{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ══════════════ BODY ══════════════ */}
      <div className="hl-body-simplified">
        <div className="hl-features">
          <div className="hl-feature-card">
            <div className="hl-feature-icon">📝</div>
            <h3 className="hl-feature-title">Cấu trúc đề thi mới nhất</h3>
            <p className="hl-feature-desc">
              Đề thi được biên soạn bám sát định dạng cấu trúc đề thi Tốt nghiệp THPT năm 2026 môn Toán do Bộ GD&ĐT công bố, bao gồm các phần Trắc nghiệm, Nhiều đáp án, và Trả lời ngắn.
            </p>
          </div>

          <div className="hl-feature-card">
            <div className="hl-feature-icon">⏱️</div>
            <h3 className="hl-feature-title">Trải nghiệm thi thật</h3>
            <p className="hl-feature-desc">
              Giao diện làm bài trực quan, đồng hồ đếm ngược 90 phút và hệ thống chấm điểm tự động ngay sau khi nộp bài giúp bạn đánh giá năng lực chính xác.
            </p>
          </div>

          <div className="hl-feature-card">
            <div className="hl-feature-icon">💡</div>
            <h3 className="hl-feature-title">Lời giải chi tiết</h3>
            <p className="hl-feature-desc">
              Mỗi câu hỏi đều đi kèm lời giải rõ ràng, mạch lạc, kết hợp đồ thị và phương trình chuẩn LaTeX giúp học sinh dễ dàng nắm bắt phương pháp giải.
            </p>
          </div>
        </div>

        <div className="hl-exam-list">
          <h2 className="hl-section-title">Danh sách Đề thi</h2>
          {examSets.length === 0 && (
            <p style={{ textAlign: 'center', color: '#64748b' }}>Chưa có đề thi nào. Admin có thể tạo đề trong trang quản trị.</p>
          )}
          <div className="hl-exams-grid">
            {examSets.map(exam => (
              <a key={exam.de_id} href={`/${encodeURIComponent(exam.de_id)}`} className="hl-exam-card">
                <div className="hl-exam-icon">{exam.type === 'generated' ? '✨' : '📚'}</div>
                <div className="hl-exam-info">
                  <h3 className="hl-exam-name">{exam.de_id}</h3>
                  <p className="hl-exam-count">{exam.count} câu hỏi{exam.type === 'generated' ? ' · Đề tổng hợp' : ''}</p>
                </div>
                <div className="hl-exam-arr">→</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ STYLES ══════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap');

        .hl-root {
          min-height: 100vh;
          background: #f0f4f8;
          color: #1e293b;
          font-family: 'Inter', sans-serif;
        }

        /* ── Hero ── */
        .hl-hero {
          position: relative;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%);
          overflow: hidden;
          padding: 3.5rem 2rem 0;
        }
        .hl-hero-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 80% at 5% 20%, rgba(255,255,255,0.18) 0%, transparent 55%),
            radial-gradient(ellipse 40% 50% at 95% 80%, rgba(139,92,246,0.3) 0%, transparent 55%);
          pointer-events: none;
        }
        /* ── Hero Customization ── */
        .hl-hero-inner {
          position: relative;
          max-width: 1200px; margin: 0 auto;
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap;
          gap: 4rem; padding-bottom: 4.5rem; padding-top: 2rem;
        }
        .hl-hero-content {
          flex: 1; min-width: 300px; max-width: 600px;
        }
        .hl-hero-image-wrap {
          flex: 1; min-width: 300px;
          display: flex; justify-content: center;
          position: relative;
        }
        .hl-hero-image {
          width: 100%; max-width: 480px; height: auto;
          border-radius: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
          transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
          transition: transform 0.3s;
        }
        .hl-hero-image:hover {
          transform: perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(-10px);
        }
        
        .hl-hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800; line-height: 1.15;
          color: white; margin-bottom: 1.25rem;
        }
        .hl-hero-sub {
          color: rgba(255,255,255,0.9);
          font-size: 1.15rem; line-height: 1.7;
          margin-bottom: 2.5rem;
        }
        .hl-cta-large {
          display: inline-flex; align-items: center; gap: 12px;
          background: linear-gradient(135deg, #fde68a 0%, #f59e0b 100%);
          color: #78350f;
          padding: 1.25rem 2rem; border-radius: 16px;
          font-weight: 800; font-size: 1.15rem;
          text-decoration: none;
          box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);
          transition: all 0.3s;
        }
        .hl-cta-large:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(245, 158, 11, 0.5);
          background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
        }
        .hl-cta-icon { font-size: 1.5rem; }
        .hl-cta-arr { transition: transform 0.2s; font-size: 1.25rem; }
        .hl-cta-large:hover .hl-cta-arr { transform: translateX(6px); }

        /* Stats bar */
        .hl-stats {
          position: relative;
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(255,255,255,0.15);
        }
        .hl-stat {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 2rem 1rem; gap: 8px;
          background: rgba(255,255,255,0.08);
          transition: background 0.2s;
          border-left: 1px solid rgba(255,255,255,0.1);
        }
        
        /* ── Body layout ── */
        .hl-body-simplified {
          max-width: 1200px; margin: 0 auto;
          padding: 5rem 2rem;
          min-height: calc(100vh - 600px);
        }

        .hl-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2.5rem;
        }

        .hl-feature-card {
          background: white;
          padding: 2.5rem;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          transition: transform 0.3s, box-shadow 0.3s;
          border-top: 4px solid #6366f1;
        }

        .hl-feature-card:nth-child(2) { border-top-color: #8b5cf6; }
        .hl-feature-card:nth-child(3) { border-top-color: #a855f7; }

        .hl-feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }

        .hl-feature-icon {
          font-size: 3rem;
          margin-bottom: 1.5rem;
        }

        .hl-feature-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 1rem;
        }

        .hl-feature-desc {
          color: #64748b;
          line-height: 1.7;
          font-size: 1.05rem;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .hl-hero-inner {
            flex-direction: column;
            text-align: center;
            gap: 3rem;
          }
          .hl-cta-large {
            flex-direction: column;
            width: 100%;
          }
          .hl-hero { padding: 2rem 1rem 0; }
          .hl-stats { grid-template-columns: repeat(2,1fr); }
          .hl-stat { border-bottom: 1px solid rgba(255,255,255,0.1); }
          .hl-stat:nth-child(odd) { border-left: none; }
          .hl-body-simplified { padding: 3rem 1rem; }
        }

        /* ── Exam List ── */
        .hl-exam-list {
          margin-top: 4rem;
        }
        .hl-section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 2rem;
          color: #1e293b;
          margin-bottom: 2rem;
          text-align: center;
        }
        .hl-exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .hl-exam-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          transition: all 0.3s;
          border: 1px solid #e2e8f0;
        }
        .hl-exam-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.08);
          border-color: #6366f1;
        }
        .hl-exam-icon {
          font-size: 2rem;
          background: #f1f5f9;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }
        .hl-exam-info {
          flex: 1;
        }
        .hl-exam-name {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1e293b;
          word-break: break-word;
        }
        .hl-exam-count {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }
        .hl-exam-arr {
          color: #6366f1;
          font-weight: bold;
          transition: transform 0.2s;
        }
        .hl-exam-card:hover .hl-exam-arr {
          transform: translateX(4px);
        }
      `}</style>
    </div>
  );
}

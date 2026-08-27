'use client';

import { useState, useEffect, Fragment, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { renderLatexContent } from '@/lib/latex-renderer';
import styles from './ExamInterface.module.css';
import 'katex/dist/katex.min.css';

interface Question {
  id: string;
  exam_number: number;
  de_id: string;
  content: string;
  options: any;
  answer: string;
  explanation?: string;
  image_url?: string;
  metadata: any;
}

interface ExamInterfaceProps {
  questions: Question[];
  examTitle?: string;
}

// ── Scoring per Bộ GD&ĐT 2026 ─────────────────────────────────────────
// Phần I  (MCQ): 12 câu × 0.25đ = 3.0 điểm
// Phần II (MSQ): 4  câu, mỗi câu tối đa 1.0đ, điểm luỹ tiến = 4.0 điểm
// Phần III (SA): 6  câu × 0.5đ  = 3.0 điểm
// Tổng: 10.0 điểm
const SCORE_MCQ = 0.25;
const SCORE_SA = 0.5;
const MSQ_PROGRESSIVE: Record<number, number> = {
  0: 0,
  1: 0.1,
  2: 0.25,
  3: 0.5,
  4: 1.0,
};

const getQuestionType = (q: Question) => q.metadata?.type || 'mcq';

const sortByType = (qs: Question[]): Question[] => {
  const order: Record<string, number> = { mcq: 0, msq: 1, sa: 2 };
  return [...qs]
    .sort((a, b) => (order[getQuestionType(a)] ?? 0) - (order[getQuestionType(b)] ?? 0))
    .map((q, i) => ({ ...q, exam_number: i + 1 }));
};

export default function ExamInterface({
  questions: initialQuestions,
  examTitle,
}: ExamInterfaceProps) {
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>(() =>
    sortByType(initialQuestions || [])
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({}); // Câu đánh dấu xem lại (Vàng)
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [navOpen, setNavOpen] = useState(false); // Mobile drawer toggle
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const router = useRouter();

  useEffect(() => {
    setDisplayQuestions(sortByType(initialQuestions));
    setAnswers({});
    setFlagged({});
    setTimeLeft(90 * 60);
    setIsSubmitted(false);
  }, [initialQuestions]);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionNumber]: answer }));
  };

  const toggleFlag = (questionNumber: number) => {
    if (isSubmitted) return;
    setFlagged((prev) => ({ ...prev, [questionNumber]: !prev[questionNumber] }));
  };

  const handleSubmit = useCallback(
    (autoSubmit = false) => {
      if (!autoSubmit) {
        const answered = Object.keys(answers).length;
        const total = displayQuestions.length;
        const unDone = total - answered;
        const msg =
          unDone > 0
            ? `Bạn còn ${unDone} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài không?`
            : 'Bạn đã hoàn thành tất cả các câu. Bạn có chắc chắn muốn nộp bài?';
        if (!confirm(msg)) return;
      }
      setIsSubmitted(true);
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    },
    [answers, displayQuestions.length]
  );

  const handleShuffle = () => {
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const mcqs = shuffle(initialQuestions.filter((q) => getQuestionType(q) === 'mcq'));
    const msqs = shuffle(initialQuestions.filter((q) => getQuestionType(q) === 'msq'));
    const sas = shuffle(initialQuestions.filter((q) => getQuestionType(q) === 'sa'));
    setDisplayQuestions([...mcqs, ...msqs, ...sas].map((q, i) => ({ ...q, exam_number: i + 1 })));
    setAnswers({});
    setFlagged({});
    setTimeLeft(90 * 60);
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExplanation = (id: string) => {
    setShowExplanation((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToQuestion = (num: number) => {
    questionRefs.current[num]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setNavOpen(false);
  };

  // ── Scoring calculation ───────────────────────────────────────────────
  const calculateScoreDetail = () => {
    let p1 = 0; // MCQ
    let p2 = 0; // MSQ
    let p3 = 0; // SA

    displayQuestions.forEach((q) => {
      const ua = answers[q.exam_number];
      const type = getQuestionType(q);

      if (type === 'mcq') {
        if (ua && ua.toUpperCase() === q.answer.toUpperCase()) p1 += SCORE_MCQ;
      } else if (type === 'sa') {
        if (ua && ua.trim() === q.answer.trim()) p3 += SCORE_SA;
      } else if (type === 'msq') {
        if (!ua) return;
        const userObj: Record<string, boolean> = {};
        ua.split(',').forEach((pair) => {
          const [k, v] = pair.split(':');
          if (k) userObj[k.toLowerCase()] = v === 'true';
        });
        const correctSet = new Set(q.answer.split(',').map((s) => s.trim().toLowerCase()));
        let correctSubCount = 0;
        ['a', 'b', 'c', 'd'].forEach((opt) => {
          const shouldBeTrue = correctSet.has(opt);
          const userSaysTrue = userObj[opt] === true;
          if (shouldBeTrue === userSaysTrue) correctSubCount++;
        });
        p2 += MSQ_PROGRESSIVE[correctSubCount] ?? 0;
      }
    });

    return {
      p1: Math.round(p1 * 100) / 100,
      p2: Math.round(p2 * 100) / 100,
      p3: Math.round(p3 * 100) / 100,
      total: Math.round((p1 + p2 + p3) * 100) / 100,
    };
  };

  // Trạng thái cho nút trong Navigator
  const getNavStatus = (q: Question) => {
    const ua = answers[q.exam_number];
    const isFlag = flagged[q.exam_number];
    const type = getQuestionType(q);

    if (!isSubmitted) {
      if (isFlag) return 'flagged';
      if (ua !== undefined) return 'done';
      return 'empty';
    }

    // Sau khi nộp bài
    if (!ua) return 'wrong';
    if (type === 'mcq') return ua.toUpperCase() === q.answer.toUpperCase() ? 'correct' : 'wrong';
    if (type === 'sa') return ua.trim() === q.answer.trim() ? 'correct' : 'wrong';
    return 'done';
  };

  const mcqList = displayQuestions.filter((q) => getQuestionType(q) === 'mcq');
  const msqList = displayQuestions.filter((q) => getQuestionType(q) === 'msq');
  const saList = displayQuestions.filter((q) => getQuestionType(q) === 'sa');
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const progressPercent = Math.round((answeredCount / (displayQuestions.length || 1)) * 100);
  const score = isSubmitted ? calculateScoreDetail() : null;
  const isTimeWarning = timeLeft < 300; // < 5 phút

  if (displayQuestions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h2>Không thể tải đề thi</h2>
          <p>Chưa có câu hỏi nào trong đề này.</p>
          <button onClick={() => router.push('/')} className={styles.btnBack}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // ── Left Column Navigator ─────────────────────────────────────────────
  const QuestionNavigator = () => (
    <div className={styles.navigatorCard}>
      <div className={styles.navCardHeader}>
        <span className="ed-icon">📋</span>
        <span className={styles.navCardTitle}>Danh sách câu hỏi</span>
      </div>

      {/* Section I (Xanh) */}
      {mcqList.length > 0 && (
        <div className={styles.navGroup}>
          <div className={`${styles.navGroupTitle} ${styles.navGroupTitleP1}`}>
            Phần I · Trắc nghiệm ({mcqList.length} câu)
          </div>
          <div className={styles.navGrid}>
            {mcqList.map((q) => {
              const status = getNavStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.exam_number)}
                  className={`${styles.navBtn} ${styles[`status_${status}`]}`}
                  title={`Câu ${q.exam_number}`}
                >
                  {q.exam_number}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section II (Vàng / Hổ phách) */}
      {msqList.length > 0 && (
        <div className={styles.navGroup}>
          <div className={`${styles.navGroupTitle} ${styles.navGroupTitleP2}`}>
            Phần II · Đúng / Sai ({msqList.length} câu)
          </div>
          <div className={styles.navGrid}>
            {msqList.map((q) => {
              const status = getNavStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.exam_number)}
                  className={`${styles.navBtn} ${styles.navBtnP2} ${styles[`status_${status}`]}`}
                  title={`Câu ${q.exam_number}`}
                >
                  {q.exam_number}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section III (Tím) */}
      {saList.length > 0 && (
        <div className={styles.navGroup}>
          <div className={`${styles.navGroupTitle} ${styles.navGroupTitleP3}`}>
            Phần III · Trả lời ngắn ({saList.length} câu)
          </div>
          <div className={styles.navGrid}>
            {saList.map((q) => {
              const status = getNavStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.exam_number)}
                  className={`${styles.navBtn} ${styles.navBtnP3} ${styles[`status_${status}`]}`}
                  title={`Câu ${q.exam_number}`}
                >
                  {q.exam_number}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Legend */}
      <div className={styles.navLegend}>
        <div className={styles.legendRow}>
          <span className={`${styles.legendDot} ${styles.dotDone}`} />
          <span>Đã trả lời ({answeredCount})</span>
        </div>
        <div className={styles.legendRow}>
          <span className={`${styles.legendDot} ${styles.dotFlagged}`} />
          <span>Đánh dấu xem lại ({flaggedCount})</span>
        </div>
        <div className={styles.legendRow}>
          <span className={`${styles.legendDot} ${styles.dotEmpty}`} />
          <span>Chưa làm ({displayQuestions.length - answeredCount})</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>

      {/* ── Fixed Sticky Progress Bar on Top ── */}
      <div className={styles.stickyProgressWrap}>
        <div
          className={styles.stickyProgressBar}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── Top Header Bar ── */}
      <header className={styles.examHeader}>
        <div className={styles.headerInner}>
          
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleGroup}>
              <h1 className={styles.headerTitle}>
                {examTitle || 'Đề thi thử TN THPT Môn Toán 2026'}
              </h1>
              <span className={styles.headerMeta}>
                Tổng 10 điểm · 90 phút · {displayQuestions.length} câu
              </span>
            </div>
          </div>

          <div className={styles.headerRight}>
            <div className={`${styles.clockPill} ${isTimeWarning ? styles.clockWarning : ''}`}>
              <span className={styles.clockIcon}>⏱</span>
              <span className={styles.clockTime}>{formatTime(timeLeft)}</span>
            </div>
            {!isSubmitted && (
              <button onClick={() => handleSubmit(false)} className={styles.btnTopSubmit}>
                Nộp bài
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ── 3-Column / 2-Column Responsive Layout ── */}
      <div className={styles.layoutMain}>
        
        {/* ── COL 1: LEFT NAVIGATOR ── */}
        <aside className={styles.colLeft}>
          <QuestionNavigator />
        </aside>

        {/* ── COL 2: MIDDLE QUESTIONS STREAM ── */}
        <main className={styles.colMiddle}>

          {/* Results Box (after submit) */}
          {isSubmitted && score && (
            <div id="results" className={styles.resultsCard}>
              <div className={styles.resultsHeader}>
                <span className={styles.resultsBadge}>🎓 KẾT QUẢ BÀI THI</span>
                <h2 className={styles.resultsTotalScore}>
                  {score.total.toFixed(2)} <span className={styles.resultsMax}>/ 10 điểm</span>
                </h2>
                <p className={styles.resultsComment}>
                  {score.total >= 8
                    ? '🎉 Xuất sắc! Bạn đã nắm rất vững kiến thức.'
                    : score.total >= 6.5
                    ? '👍 Khá tốt! Xem lại các câu sai để bứt phá lên 8+.'
                    : '💪 Hãy rèn luyện thêm và đọc kỹ lời giải chi tiết bên dưới.'}
                </p>
              </div>

              <div className={styles.resultsPartsGrid}>
                <div className={styles.partCard}>
                  <div className={styles.partLabel}>Phần I · Trắc nghiệm</div>
                  <div className={styles.partScore}>{score.p1.toFixed(2)} / 3.00 đ</div>
                </div>
                <div className={styles.partCard}>
                  <div className={styles.partLabel}>Phần II · Đúng/Sai</div>
                  <div className={styles.partScore}>{score.p2.toFixed(2)} / 4.00 đ</div>
                </div>
                <div className={styles.partCard}>
                  <div className={styles.partLabel}>Phần III · Trả lời ngắn</div>
                  <div className={styles.partScore}>{score.p3.toFixed(2)} / 3.00 đ</div>
                </div>
              </div>

              <div className={styles.resultsActions}>
                <button onClick={handleShuffle} className={styles.btnRetry}>
                  🔀 Làm lại bài thi (Xáo đề)
                </button>
                <button onClick={() => router.push('/')} className={styles.btnBackHome}>
                  Về trang chủ
                </button>
              </div>
            </div>
          )}

          {/* Question Stream with Section Header Banners */}
          <div className={styles.questionsList}>
            {displayQuestions.map((q, index) => {
              const type = getQuestionType(q);
              const ua = answers[q.exam_number];
              const isFlag = flagged[q.exam_number];

              // Kiểm tra câu đầu tiên của mỗi phần để chèn Tiêu đề Phần
              const prevType = index > 0 ? getQuestionType(displayQuestions[index - 1]) : null;
              const isFirstOfPart = prevType !== type;

              // Correctness check after submit
              const isCorrect =
                isSubmitted &&
                type !== 'msq' &&
                !!ua &&
                (type === 'mcq'
                  ? ua.toUpperCase() === q.answer.toUpperCase()
                  : ua.trim() === q.answer.trim());
              const isWrong = isSubmitted && type !== 'msq' && !!ua && !isCorrect;

              return (
                <Fragment key={q.id}>
                  {/* ── Tiêu đề Phần I (Xanh) ── */}
                  {isFirstOfPart && type === 'mcq' && (
                    <div className={`${styles.partBanner} ${styles.partBannerP1}`}>
                      <div className={styles.partBannerTop}>
                        <span className={`${styles.partBadge} ${styles.partBadgeP1}`}>PHẦN I</span>
                        <span className={`${styles.partScoreTag} ${styles.partScoreTagP1}`}>3.0 điểm (12 câu × 0.25đ)</span>
                      </div>
                      <h2 className={`${styles.partTitle} ${styles.partTitleP1}`}>
                        Câu Trắc Nghiệm Nhiều Phương Án Lựa Chọn
                      </h2>
                      <p className={styles.partDesc}>
                        Thí sinh trả lời từ câu 1 đến câu 12. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
                      </p>
                    </div>
                  )}

                  {/* ── Tiêu đề Phần II (Vàng / Hổ phách) ── */}
                  {isFirstOfPart && type === 'msq' && (
                    <div className={`${styles.partBanner} ${styles.partBannerP2}`}>
                      <div className={styles.partBannerTop}>
                        <span className={`${styles.partBadge} ${styles.partBadgeP2}`}>PHẦN II</span>
                        <span className={`${styles.partScoreTag} ${styles.partScoreTagP2}`}>4.0 điểm (4 câu luỹ tiến)</span>
                      </div>
                      <h2 className={`${styles.partTitle} ${styles.partTitleP2}`}>
                        Câu Trắc Nghiệm Đúng / Sai
                      </h2>
                      <p className={styles.partDesc}>
                        Thí sinh trả lời từ câu 1 đến câu 4. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai. Điểm tối đa mỗi câu là 1.0 điểm.
                      </p>
                    </div>
                  )}

                  {/* ── Tiêu đề Phần III (Tím) ── */}
                  {isFirstOfPart && type === 'sa' && (
                    <div className={`${styles.partBanner} ${styles.partBannerP3}`}>
                      <div className={styles.partBannerTop}>
                        <span className={`${styles.partBadge} ${styles.partBadgeP3}`}>PHẦN III</span>
                        <span className={`${styles.partScoreTag} ${styles.partScoreTagP3}`}>3.0 điểm (6 câu × 0.5đ)</span>
                      </div>
                      <h2 className={`${styles.partTitle} ${styles.partTitleP3}`}>
                        Câu Trắc Nghiệm Trả Lời Ngắn
                      </h2>
                      <p className={styles.partDesc}>
                        Thí sinh trả lời từ câu 1 đến câu 6. Điền kết quả số hoặc phân số/số thập phân theo yêu cầu đề bài.
                      </p>
                    </div>
                  )}

                  {/* ── Question Card ── */}
                  <div
                    ref={(el) => {
                      questionRefs.current[q.exam_number] = el;
                    }}
                    className={`${styles.questionCard} ${
                      type === 'mcq'
                        ? styles.cardP1
                        : type === 'msq'
                        ? styles.cardP2
                        : styles.cardP3
                    } ${isFlag ? styles.cardFlagged : ''}`}
                  >
                    {/* Card Header */}
                    <div className={styles.qCardHeader}>
                      <div className={styles.qCardTitleGroup}>
                        <span
                          className={`${styles.qNumber} ${
                            type === 'mcq'
                              ? styles.qNumberP1
                              : type === 'msq'
                              ? styles.qNumberP2
                              : styles.qNumberP3
                          }`}
                        >
                          Câu {q.exam_number}
                        </span>
                        <span
                          className={`${styles.qTypeTag} ${
                            type === 'mcq'
                              ? styles.qTypeTagP1
                              : type === 'msq'
                              ? styles.qTypeTagP2
                              : styles.qTypeTagP3
                          }`}
                        >
                          {type === 'mcq'
                            ? 'Trắc nghiệm 4 lựa chọn'
                            : type === 'msq'
                            ? 'Trắc nghiệm Đúng / Sai'
                            : 'Câu hỏi Trả lời ngắn'}
                        </span>
                      </div>

                      {!isSubmitted && (
                        <button
                          onClick={() => toggleFlag(q.exam_number)}
                          className={`${styles.btnFlag} ${isFlag ? styles.flaggedActive : ''}`}
                          title="Đánh dấu câu hỏi để xem lại sau"
                        >
                          <span>{isFlag ? '★' : '☆'}</span>
                          <span>{isFlag ? 'Đã đánh dấu' : 'Xem lại sau'}</span>
                        </button>
                      )}

                      {isSubmitted && type !== 'msq' && (
                        <span
                          className={`${styles.badgeResult} ${
                            isCorrect
                              ? styles.badgeCorrect
                              : isWrong
                              ? styles.badgeWrong
                              : styles.badgeSkipped
                          }`}
                        >
                          {isCorrect ? '✓ Đúng' : isWrong ? '✗ Sai' : '○ Bỏ qua'}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className={styles.qContent}>
                      {renderLatexContent(q.content)}
                    </div>

                    {q.image_url && (
                      <img src={q.image_url} alt="Hình vẽ câu hỏi" className={styles.qImage} />
                    )}

                    {/* ── MCQ (4 Đáp án lớn dễ bấm 52px) ── */}
                    {type === 'mcq' && q.options && (
                      <div className={styles.mcqGrid}>
                        {['A', 'B', 'C', 'D'].map((opt) => {
                          const content = q.options[`option_${opt.toLowerCase()}`];
                          if (!content) return null;
                          const selected = ua === opt;
                          const isCorrectA = q.answer.toUpperCase().includes(opt);
                          const showCor = isSubmitted && isCorrectA;
                          const showWrong = isSubmitted && selected && !isCorrectA;

                          return (
                            <label
                              key={opt}
                              className={`${styles.mcqOption} ${selected ? styles.mcqSelected : ''} ${
                                showCor ? styles.mcqOptionCorrect : ''
                              } ${showWrong ? styles.mcqOptionWrong : ''}`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.exam_number}`}
                                value={opt}
                                checked={selected}
                                onChange={() => {
                                  if (!isSubmitted) handleAnswerChange(q.exam_number, opt);
                                }}
                                disabled={isSubmitted}
                                className={styles.hiddenRadio}
                              />
                              <span className={styles.mcqLabel}>{opt}</span>
                              <div className={styles.mcqText}>
                                {renderLatexContent(content)}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* ── MSQ (Đúng / Sai 4 ý) ── */}
                    {type === 'msq' && q.options && (
                      <div className={styles.msqList}>
                        {['a', 'b', 'c', 'd'].map((opt) => {
                          const content = q.options[`option_${opt}`];
                          if (!content) return null;

                          const userObj: Record<string, boolean> = {};
                          if (ua) {
                            ua.split(',').forEach((pair) => {
                              const [k, v] = pair.split(':');
                              if (k) userObj[k.toLowerCase()] = v === 'true';
                            });
                          }
                          const userChoice = userObj[opt];
                          const correctSet = new Set(
                            q.answer.split(',').map((s) => s.trim().toLowerCase())
                          );
                          const isCorr = correctSet.has(opt);

                          return (
                            <div key={opt} className={styles.msqRow}>
                              <div className={styles.msqTextCol}>
                                <span className={styles.msqOptLetter}>{opt.toLowerCase()})</span>
                                <div className={styles.msqContent}>
                                  {renderLatexContent(content)}
                                </div>
                              </div>

                              <div className={styles.msqBtnGroup}>
                                <button
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => {
                                    if (isSubmitted) return;
                                    const newObj = { ...userObj, [opt]: true };
                                    handleAnswerChange(
                                      q.exam_number,
                                      Object.entries(newObj)
                                        .map(([k, v]) => `${k}:${v}`)
                                        .join(',')
                                    );
                                  }}
                                  className={`${styles.msqChoiceBtn} ${
                                    userChoice === true ? styles.choiceSelected : ''
                                  } ${
                                    isSubmitted
                                      ? isCorr
                                        ? styles.choiceCorrect
                                        : userChoice === true
                                        ? styles.choiceWrong
                                        : ''
                                      : ''
                                  }`}
                                >
                                  Đúng
                                </button>

                                <button
                                  type="button"
                                  disabled={isSubmitted}
                                  onClick={() => {
                                    if (isSubmitted) return;
                                    const newObj = { ...userObj, [opt]: false };
                                    handleAnswerChange(
                                      q.exam_number,
                                      Object.entries(newObj)
                                        .map(([k, v]) => `${k}:${v}`)
                                        .join(',')
                                    );
                                  }}
                                  className={`${styles.msqChoiceBtn} ${
                                    userChoice === false ? styles.choiceSelected : ''
                                  } ${
                                    isSubmitted
                                      ? !isCorr
                                        ? styles.choiceCorrect
                                        : userChoice === false
                                        ? styles.choiceWrong
                                        : ''
                                      : ''
                                  }`}
                                >
                                  Sai
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── SA (Trả lời ngắn) ── */}
                    {type === 'sa' && (
                      <div className={styles.saContainer}>
                        <div className={styles.saInputWrap}>
                          <input
                            type="text"
                            placeholder="Nhập câu trả lời của bạn..."
                            value={ua || ''}
                            onChange={(e) => {
                              if (!isSubmitted) handleAnswerChange(q.exam_number, e.target.value);
                            }}
                            disabled={isSubmitted}
                            className={`${styles.saInput} ${
                              isSubmitted
                                ? isCorrect
                                  ? styles.saCorrect
                                  : styles.saWrong
                                : ''
                            }`}
                          />
                        </div>
                        {isSubmitted && (
                          <div className={styles.saAnswerBox}>
                            <strong>Đáp án chính xác:</strong> {q.answer}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Lời giải chi tiết sau khi nộp bài ── */}
                    {isSubmitted && (q.explanation || q.metadata?.loi_giai) && (
                      <div className={styles.explBox}>
                        <div className={styles.explHead}>
                          <span className={styles.explTitle}>💡 Hướng dẫn & Lời giải chi tiết</span>
                          <button
                            onClick={() => toggleExplanation(q.id)}
                            className={styles.btnToggleExpl}
                          >
                            {showExplanation[q.id] ? 'Thu gọn' : 'Xem lời giải'}
                          </button>
                        </div>
                        {showExplanation[q.id] && (
                          <div className={styles.explContent}>
                            {renderLatexContent(q.explanation || q.metadata?.loi_giai)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>

          {/* Bottom Submit */}
          {!isSubmitted && (
            <div className={styles.bottomSubmitWrap}>
              <button onClick={() => handleSubmit(false)} className={styles.btnBottomSubmit}>
                Hoàn thành & Nộp bài thi
              </button>
            </div>
          )}

        </main>

        {/* ── COL 3: RIGHT STATUS & SUBMIT CARD ── */}
        <aside className={styles.colRight}>
          <div className={styles.statusStickyCard}>
            
            {/* Clock */}
            <div className={`${styles.rightClockBox} ${isTimeWarning ? styles.clockWarning : ''}`}>
              <span className={styles.rightClockLabel}>Thời gian còn lại</span>
              <div className={styles.rightClockTime}>{formatTime(timeLeft)}</div>
            </div>

            {/* Progress */}
            <div className={styles.rightProgressBox}>
              <div className={styles.rightProgressHead}>
                <span>Tiến độ</span>
                <strong>{progressPercent}%</strong>
              </div>
              <div className={styles.rightProgressBar}>
                <div
                  className={styles.rightProgressFill}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.rightStatsList}>
              <div className={styles.rightStatRow}>
                <span className={styles.rightStatLabel}>Đã làm:</span>
                <span className={styles.rightStatVal}>{answeredCount} / {displayQuestions.length}</span>
              </div>
              <div className={styles.rightStatRow}>
                <span className={styles.rightStatLabel}>Xem lại sau:</span>
                <span className={styles.rightStatValWarning}>{flaggedCount} câu</span>
              </div>
              <div className={styles.rightStatRow}>
                <span className={styles.rightStatLabel}>Chưa làm:</span>
                <span className={styles.rightStatValMuted}>{displayQuestions.length - answeredCount} câu</span>
              </div>
            </div>

            {/* Submit Action */}
            {!isSubmitted ? (
              <button onClick={() => handleSubmit(false)} className={styles.btnRightSubmit}>
                Nộp bài thi
              </button>
            ) : (
              <button onClick={handleShuffle} className={styles.btnRightRetry}>
                🔀 Làm lại bài thi
              </button>
            )}

          </div>
        </aside>

      </div>

      {/* ── Mobile FAB ── */}
      <button
        onClick={() => setNavOpen(true)}
        className={styles.mobileFab}
        aria-label="Danh sách câu hỏi"
      >
        <span>📋</span>
        <span>{answeredCount}/{displayQuestions.length}</span>
        <span className={styles.fabClock}>· {formatTime(timeLeft)}</span>
      </button>

      {/* ── Mobile Drawer ── */}
      {navOpen && (
        <div className={styles.drawerOverlay} onClick={() => setNavOpen(false)}>
          <div className={styles.drawerCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHead}>
              <span className={styles.drawerTitle}>Danh sách câu hỏi</span>
              <button onClick={() => setNavOpen(false)} className={styles.drawerClose}>
                ✕ Đóng
              </button>
            </div>
            <div className={styles.drawerScroll}>
              <QuestionNavigator />
            </div>
            {!isSubmitted && (
              <div className={styles.drawerFooter}>
                <button
                  onClick={() => {
                    setNavOpen(false);
                    handleSubmit(false);
                  }}
                  className={styles.btnDrawerSubmit}
                >
                  Nộp bài thi ({answeredCount}/{displayQuestions.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

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
const SCORE_SA  = 0.5;
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
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [navOpen, setNavOpen] = useState(false); // mobile drawer toggle
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const router = useRouter();

  // ── Helpers ──────────────────────────────────────────────────────────

  useEffect(() => {
    setDisplayQuestions(sortByType(initialQuestions));
    setAnswers({});
    setTimeLeft(90 * 60);
    setIsSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestions]);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitted]);

  // ── Formatting ───────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Answer handling ──────────────────────────────────────────────────
  const handleAnswerChange = (questionNumber: number, answer: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionNumber]: answer }));
  };

  const handleSubmit = useCallback(
    (autoSubmit = false) => {
      if (!autoSubmit) {
        const answered = Object.keys(answers).length;
        if (
          !confirm(
            `Bạn đã làm ${answered}/${displayQuestions.length} câu.\nBạn có chắc muốn nộp bài?`
          )
        )
          return;
      }
      setIsSubmitted(true);
      setTimeout(
        () => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }),
        150
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, displayQuestions.length]
  );

  const handleShuffle = () => {
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const mcqs = shuffle(initialQuestions.filter(q => getQuestionType(q) === 'mcq'));
    const msqs = shuffle(initialQuestions.filter(q => getQuestionType(q) === 'msq'));
    const sas  = shuffle(initialQuestions.filter(q => getQuestionType(q) === 'sa'));
    setDisplayQuestions([...mcqs, ...msqs, ...sas].map((q, i) => ({ ...q, exam_number: i + 1 })));
    setAnswers({});
    setTimeLeft(90 * 60);
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExplanation = (id: string) =>
    setShowExplanation(prev => ({ ...prev, [id]: !prev[id] }));

  const scrollToQuestion = (num: number) => {
    questionRefs.current[num]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setNavOpen(false);
  };

  // ── Scoring per Bộ GD&ĐT 2026 ───────────────────────────────────────
  const calculateScoreDetail = () => {
    let p1 = 0; // MCQ
    let p2 = 0; // MSQ
    let p3 = 0; // SA

    displayQuestions.forEach(q => {
      const ua   = answers[q.exam_number];
      const type = getQuestionType(q);

      if (type === 'mcq') {
        if (ua && ua.toUpperCase() === q.answer.toUpperCase()) p1 += SCORE_MCQ;
      } else if (type === 'sa') {
        if (ua && ua.trim() === q.answer.trim()) p3 += SCORE_SA;
      } else if (type === 'msq') {
        if (!ua) return;
        // Parse stored answer  "a:true,b:false,c:true,d:false"
        const userObj: Record<string, boolean> = {};
        ua.split(',').forEach(pair => {
          const [k, v] = pair.split(':');
          if (k) userObj[k.toLowerCase()] = v === 'true';
        });
        // Correct set: letters in q.answer string e.g. "a,c" or "A,C"
        const correctSet = new Set(q.answer.split(',').map(s => s.trim().toLowerCase()));
        let correctSubCount = 0;
        ['a', 'b', 'c', 'd'].forEach(opt => {
          const shouldBeTrue = correctSet.has(opt);
          const userSaysTrue = userObj[opt] === true;
          if (shouldBeTrue === userSaysTrue) correctSubCount++;
        });
        p2 += MSQ_PROGRESSIVE[correctSubCount] ?? 0;
      }
    });

    return {
      p1: +p1.toFixed(2),
      p2: +p2.toFixed(2),
      p3: +p3.toFixed(2),
      total: +(p1 + p2 + p3).toFixed(2),
    };
  };

  // ── Navigator cell status ─────────────────────────────────────────────
  const getNavStatus = (q: Question): 'correct' | 'wrong' | 'done' | 'empty' => {
    const ua   = answers[q.exam_number];
    const type = getQuestionType(q);
    if (!isSubmitted) return ua !== undefined ? 'done' : 'empty';
    if (!ua) return 'wrong'; // skipped = red after submit
    if (type === 'mcq') return ua.toUpperCase() === q.answer.toUpperCase() ? 'correct' : 'wrong';
    if (type === 'sa')  return ua.trim() === q.answer.trim() ? 'correct' : 'wrong';
    return 'done'; // msq: partial shown as done (evaluated per sub-option)
  };

  // ── Derived counts ───────────────────────────────────────────────────
  const mcqList = displayQuestions.filter(q => getQuestionType(q) === 'mcq');
  const msqList = displayQuestions.filter(q => getQuestionType(q) === 'msq');
  const saList  = displayQuestions.filter(q => getQuestionType(q) === 'sa');
  const answeredCount = Object.keys(answers).length;
  const score = isSubmitted ? calculateScoreDetail() : null;

  if (displayQuestions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Không thể tải đề thi</h2>
          <p>Chưa có đủ câu hỏi. Vui lòng upload thêm đề thi.</p>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // ── Navigator content (shared desktop sidebar + mobile drawer) ────────
  const NavigatorContent = () => (
    <div className={styles.navContent}>
      {/* Timer in nav */}
      <div className={styles.navTimer}>
        <span className={styles.navTimerLabel}>⏱ Thời gian còn lại</span>
        <span className={`${styles.navTimerValue} ${timeLeft < 300 ? styles.navTimerWarning : ''}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress bar */}
      <div className={styles.navProgress}>
        <div className={styles.navProgressBar}>
          <div
            className={styles.navProgressFill}
            style={{ width: `${(answeredCount / displayQuestions.length) * 100}%` }}
          />
        </div>
        <span className={styles.navProgressText}>
          {answeredCount}/{displayQuestions.length} câu đã làm
        </span>
      </div>

      {/* Section I – MCQ */}
      {mcqList.length > 0 && (
        <div className={styles.navSection}>
          <div className={`${styles.navSectionTitle} ${styles.navSecMCQ}`}>
            Phần I · Trắc nghiệm ({mcqList.length} × 0.25đ)
          </div>
          <div className={styles.navGrid}>
            {mcqList.map(q => {
              const st = getNavStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.exam_number)}
                  className={`${styles.navCell} ${styles.navCellMCQ} ${
                    st === 'done' ? styles.navCellDone :
                    st === 'correct' ? styles.navCellCorrect :
                    st === 'wrong'   ? styles.navCellWrong : ''
                  }`}
                  title={`Câu ${q.exam_number}`}
                >
                  {q.exam_number}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section II – MSQ */}
      {msqList.length > 0 && (
        <div className={styles.navSection}>
          <div className={`${styles.navSectionTitle} ${styles.navSecMSQ}`}>
            Phần II · Đúng/Sai ({msqList.length} × tối đa 1.0đ)
          </div>
          <div className={styles.navGrid}>
            {msqList.map(q => {
              const st = getNavStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.exam_number)}
                  className={`${styles.navCell} ${styles.navCellMSQ} ${
                    st === 'done' ? styles.navCellDone :
                    st === 'correct' ? styles.navCellCorrect :
                    st === 'wrong'   ? styles.navCellWrong : ''
                  }`}
                  title={`Câu ${q.exam_number}`}
                >
                  {q.exam_number}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section III – SA */}
      {saList.length > 0 && (
        <div className={styles.navSection}>
          <div className={`${styles.navSectionTitle} ${styles.navSecSA}`}>
            Phần III · Trả lời ngắn ({saList.length} × 0.5đ)
          </div>
          <div className={styles.navGrid}>
            {saList.map(q => {
              const st = getNavStatus(q);
              return (
                <button
                  key={q.id}
                  onClick={() => scrollToQuestion(q.exam_number)}
                  className={`${styles.navCell} ${styles.navCellSA} ${
                    st === 'done' ? styles.navCellDone :
                    st === 'correct' ? styles.navCellCorrect :
                    st === 'wrong'   ? styles.navCellWrong : ''
                  }`}
                  title={`Câu ${q.exam_number}`}
                >
                  {q.exam_number}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nộp bài inside nav */}
      {!isSubmitted && (
        <button onClick={() => handleSubmit(false)} className={styles.navSubmitBtn}>
          🎯 Nộp bài
        </button>
      )}

      {/* Legend */}
      <div className={styles.navLegend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-color="empty" /> Chưa làm
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-color="done" /> Đã làm
        </span>
        {isSubmitted && (
          <>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} data-color="correct" /> Đúng
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} data-color="wrong" /> Sai/Bỏ
            </span>
          </>
        )}
      </div>
    </div>
  );

  // ── Section heading labels ────────────────────────────────────────────
  const sectionLabels: Record<string, string> = {
    mcq: '📝 Phần I · Trắc nghiệm — mỗi câu đúng: 0.25 điểm',
    msq: '⚖️ Phần II · Đúng / Sai — điểm luỹ tiến theo số ý đúng',
    sa:  '✏️ Phần III · Trả lời ngắn — mỗi câu đúng: 0.5 điểm',
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>

      {/* ── Sticky header ── */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button onClick={() => router.push('/')} className={styles.homeButton}>
              🏠 Home
            </button>
            <div>
              <h1 className={styles.examTitle}>
                {examTitle || 'Đề thi thử TN THPT Môn Toán 2026'}
              </h1>
              <p className={styles.examInfo}>
                90 phút · {mcqList.length} MCQ + {msqList.length} Đúng/Sai + {saList.length} SA · Tổng 10 điểm
              </p>
            </div>
          </div>
          <div className={styles.timerBox}>
            <div className={styles.timerLabel}>Thời gian còn lại</div>
            <div className={`${styles.timer} ${timeLeft < 300 ? styles.timerWarning : ''}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </header>

      {/* ── Two-column layout ── */}
      <div className={styles.layout}>

        {/* ─── Questions column ─── */}
        <main className={styles.questionsCol}>

          {/* Results box (appears after submit) */}
          {isSubmitted && score && (
            <div id="results" className={styles.resultsBox}>
              <h2 className={styles.resultsTitle}>🎓 Kết quả bài thi</h2>

              <div className={styles.scoreBreakdown}>
                <div className={`${styles.scorePartCard} ${styles.spcMCQ}`}>
                  <div className={styles.scorePartLabel}>Phần I · Trắc nghiệm</div>
                  <div className={styles.scorePartValue}>{score.p1.toFixed(2)}</div>
                  <div className={styles.scorePartMax}>/ 3.00 điểm</div>
                </div>
                <div className={`${styles.scorePartCard} ${styles.spcMSQ}`}>
                  <div className={styles.scorePartLabel}>Phần II · Đúng/Sai</div>
                  <div className={styles.scorePartValue}>{score.p2.toFixed(2)}</div>
                  <div className={styles.scorePartMax}>/ 4.00 điểm</div>
                </div>
                <div className={`${styles.scorePartCard} ${styles.spcSA}`}>
                  <div className={styles.scorePartLabel}>Phần III · Trả lời ngắn</div>
                  <div className={styles.scorePartValue}>{score.p3.toFixed(2)}</div>
                  <div className={styles.scorePartMax}>/ 3.00 điểm</div>
                </div>
              </div>

              <div className={styles.totalScore}>
                <span className={styles.totalScoreValue}>{score.total.toFixed(2)}</span>
                <span className={styles.totalScoreLabel}>&nbsp;/ 10.00 điểm</span>
              </div>

              <div className={styles.feedback}>
                {score.total >= 8   ? '🎉 Xuất sắc!'        :
                 score.total >= 6.5 ? '👍 Khá tốt!'         :
                 score.total >= 5   ? '💪 Cố gắng thêm!'   :
                                      '📚 Cần ôn tập thêm!'}
              </div>

              <div className={styles.resultsActions}>
                <button onClick={() => router.push('/')} className={styles.homeButtonResult}>
                  🏠 Về trang chủ
                </button>
                <button onClick={handleShuffle} className={styles.retryButton}>
                  🔀 Làm lại (xáo đề)
                </button>
              </div>
              <p className={styles.retryNote}>Xem lời giải từng câu bên dưới ↓</p>
            </div>
          )}

          {/* Questions list */}
          <div className={styles.questionsList}>
            {(() => {
              let lastType = '';
              return displayQuestions.map(q => {
                const type       = getQuestionType(q);
                const ua         = answers[q.exam_number];
                const showHd     = type !== lastType;
                if (showHd) lastType = type;

                // After-submit correctness (MCQ & SA only; MSQ evaluated per-option)
                const isCorrect =
                  isSubmitted &&
                  type !== 'msq' &&
                  !!ua &&
                  (type === 'mcq'
                    ? ua.toUpperCase() === q.answer.toUpperCase()
                    : ua.trim() === q.answer.trim());
                const isWrong = isSubmitted && type !== 'msq' && !!ua && !isCorrect;

                const sectionClass =
                  type === 'mcq' ? styles.section1 :
                  type === 'msq' ? styles.section2 : styles.section3;

                return (
                  <Fragment key={q.id}>
                    {/* Section heading */}
                    {showHd && (
                      <div
                        className={`${styles.sectionHeading} ${
                          type === 'mcq' ? styles.sectionHeadingMCQ :
                          type === 'msq' ? styles.sectionHeadingMSQ :
                                          styles.sectionHeadingSA
                        }`}
                      >
                        {sectionLabels[type] || type.toUpperCase()}
                      </div>
                    )}

                    {/* Question block */}
                    <div
                      ref={el => { questionRefs.current[q.exam_number] = el; }}
                      className={`${styles.questionBlock} ${sectionClass}`}
                    >
                      <div className={styles.questionHeader}>
                        <span className={styles.questionNumber}>Câu {q.exam_number}:</span>
                        {isSubmitted && type !== 'msq' && (
                          <span
                            className={`${styles.resultBadge} ${
                              isCorrect ? styles.correct :
                              isWrong   ? styles.incorrect : styles.skipped
                            }`}
                          >
                            {isCorrect ? '✓ Đúng' : isWrong ? '✗ Sai' : '○ Bỏ qua'}
                          </span>
                        )}
                      </div>

                      <div className={styles.questionContent}>
                        {renderLatexContent(q.content)}
                      </div>

                      {q.image_url && (
                        <img src={q.image_url} alt="Question" className={styles.questionImage} />
                      )}

                      {/* ── MCQ ── */}
                      {type === 'mcq' && q.options && (
                        <div className={styles.optionsGrid}>
                          {['A', 'B', 'C', 'D'].map(opt => {
                            const content = q.options[`option_${opt.toLowerCase()}`];
                            if (!content) return null;
                            const selected   = ua === opt;
                            const isCorrectA = q.answer.toUpperCase().includes(opt);
                            const showCor    = isSubmitted && isCorrectA;
                            const showWrong  = isSubmitted && selected && !isCorrectA;
                            return (
                              <label
                                key={opt}
                                className={`${styles.optionItem}
                                  ${selected  ? styles.selected      : ''}
                                  ${showCor   ? styles.correctOption  : ''}
                                  ${showWrong ? styles.wrongOption    : ''}`}
                              >
                                <input
                                  type="radio"
                                  name={`q-${q.exam_number}`}
                                  value={opt}
                                  checked={selected}
                                  onChange={() => { if (!isSubmitted) handleAnswerChange(q.exam_number, opt); }}
                                  disabled={isSubmitted}
                                  style={{ display: 'none' }}
                                />
                                <span className={styles.optionLabel}>{opt}</span>
                                <span className={styles.optionText}>
                                  {renderLatexContent(content)}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* ── MSQ – Đúng/Sai per sub-option ── */}
                      {type === 'msq' && q.options && (
                        <div className={styles.msqList}>
                          {['a', 'b', 'c', 'd'].map(opt => {
                            const content = q.options[`option_${opt}`];
                            if (!content) return null;

                            // Parse stored answer
                            const userObj: Record<string, boolean> = {};
                            if (ua) {
                              ua.split(',').forEach(pair => {
                                const [k, v] = pair.split(':');
                                if (k) userObj[k.toLowerCase()] = v === 'true';
                              });
                            }
                            const userChoice  = userObj[opt];
                            const correctSet  = new Set(
                              q.answer.split(',').map(s => s.trim().toLowerCase())
                            );
                            const isCorr = correctSet.has(opt);

                            // Button classes after submit
                            const trueBtnCls = isSubmitted
                              ? (isCorr ? styles.msqBtnCorrect : userChoice === true ? styles.msqBtnWrong : '')
                              : (userChoice === true ? styles.msqButtonSelected : '');
                            const falseBtnCls = isSubmitted
                              ? (!isCorr ? styles.msqBtnCorrect : userChoice === false ? styles.msqBtnWrong : '')
                              : (userChoice === false ? styles.msqButtonSelected : '');

                            const rowCls = isSubmitted
                              ? (userChoice === isCorr ? styles.msqCorrect :
                                 userChoice !== undefined ? styles.msqWrong : styles.msqUnanswered)
                              : '';

                            return (
                              <div key={opt} className={`${styles.msqItem} ${rowCls}`}>
                                <div className={styles.msqContent}>
                                  <span className={styles.msqLabel}>{opt.toUpperCase()})</span>
                                  <span className={styles.msqText}>
                                    {renderLatexContent(content)}
                                  </span>
                                </div>
                                <div className={styles.msqButtons}>
                                  <label className={`${styles.msqButton} ${trueBtnCls}`}>
                                    <input
                                      type="radio"
                                      name={`q-${q.exam_number}-${opt}`}
                                      value="true"
                                      checked={userChoice === true}
                                      onChange={() => {
                                        if (isSubmitted) return;
                                        const newObj = { ...userObj, [opt]: true };
                                        handleAnswerChange(
                                          q.exam_number,
                                          Object.entries(newObj).map(([k, v]) => `${k}:${v}`).join(',')
                                        );
                                      }}
                                      disabled={isSubmitted}
                                    />
                                    <span>Đúng</span>
                                  </label>
                                  <label className={`${styles.msqButton} ${falseBtnCls}`}>
                                    <input
                                      type="radio"
                                      name={`q-${q.exam_number}-${opt}`}
                                      value="false"
                                      checked={userChoice === false}
                                      onChange={() => {
                                        if (isSubmitted) return;
                                        const newObj = { ...userObj, [opt]: false };
                                        handleAnswerChange(
                                          q.exam_number,
                                          Object.entries(newObj).map(([k, v]) => `${k}:${v}`).join(',')
                                        );
                                      }}
                                      disabled={isSubmitted}
                                    />
                                    <span>Sai</span>
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ── SA ── */}
                      {type === 'sa' && (
                        <div className={styles.shortAnswerBox}>
                          <input
                            type="text"
                            placeholder="Nhập đáp án của bạn..."
                            value={ua || ''}
                            onChange={e => handleAnswerChange(q.exam_number, e.target.value)}
                            disabled={isSubmitted}
                            className={`${styles.shortAnswerInput}
                              ${isSubmitted ? (isCorrect ? styles.shortAnswerCorrect : isWrong ? styles.shortAnswerWrong : '') : ''}`}
                          />
                          {isSubmitted && (
                            <div className={styles.correctAnswer}>
                              Đáp án đúng: <strong>{q.answer}</strong>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Explanation ── */}
                      {isSubmitted && (() => {
                        const expl = q.explanation || q.metadata?.explanation || q.metadata?.loi_giai;
                        if (!expl) return null;
                        return (
                          <div className={styles.explanationBox}>
                            <div className={styles.explanationHeader}>
                              <strong>💡 Lời giải:</strong>
                              <button
                                onClick={() => toggleExplanation(q.id)}
                                className={styles.explanationToggle}
                              >
                                {showExplanation[q.id] ? '▲ Ẩn lời giải' : '▼ Xem lời giải'}
                              </button>
                            </div>
                            {showExplanation[q.id] && (
                              <div className={styles.explanationContent}>
                                {renderLatexContent(expl)}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </Fragment>
                );
              });
            })()}
          </div>

          {/* Submit below questions */}
          {!isSubmitted && (
            <div className={styles.submitSection}>
              <button onClick={() => handleSubmit(false)} className={styles.submitButton}>
                🎯 Nộp bài
              </button>
            </div>
          )}
        </main>

        {/* ─── Desktop sidebar navigator ─── */}
        <aside className={styles.navSidebar}>
          <NavigatorContent />
        </aside>
      </div>

      {/* ── Mobile FAB ── */}
      <button
        className={styles.navFab}
        onClick={() => setNavOpen(true)}
        aria-label="Mở bảng điều hướng câu hỏi"
      >
        📋&nbsp;{answeredCount}/{displayQuestions.length}
      </button>

      {/* ── Mobile bottom drawer ── */}
      {navOpen && (
        <div className={styles.drawerOverlay} onClick={() => setNavOpen(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHandle} />
            <button className={styles.drawerClose} onClick={() => setNavOpen(false)}>
              ✕ Đóng
            </button>
            <NavigatorContent />
          </div>
        </div>
      )}
    </div>
  );
}

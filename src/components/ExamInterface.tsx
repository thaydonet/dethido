'use client';

import { useState, useEffect, Fragment } from 'react';
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

export default function ExamInterface({ questions: initialQuestions, examTitle }: ExamInterfaceProps) {
  const [displayQuestions, setDisplayQuestions] = useState(initialQuestions);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const toggleExplanation = (id: string) => {
    setShowExplanation(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Shuffle within each type section (MCQ stays with MCQ, MSQ with MSQ, SA with SA)
  const handleShuffle = () => {
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const mcqs = shuffle(initialQuestions.filter(q => (q.metadata?.type || 'mcq') === 'mcq'));
    const msqs = shuffle(initialQuestions.filter(q => q.metadata?.type === 'msq'));
    const sas = shuffle(initialQuestions.filter(q => q.metadata?.type === 'sa'));
    const shuffled = [...mcqs, ...msqs, ...sas].map((q, i) => ({ ...q, exam_number: i + 1 }));
    setDisplayQuestions(shuffled);
    setAnswers({});
    setTimeLeft(90 * 60);
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sort helper: MCQ → MSQ → SA
  const sortByType = (qs: Question[]): Question[] => {
    const order: Record<string, number> = { mcq: 0, msq: 1, sa: 2 };
    const sorted = [...qs].sort((a, b) => {
      const ta = a.metadata?.type || 'mcq';
      const tb = b.metadata?.type || 'mcq';
      return (order[ta] ?? 0) - (order[tb] ?? 0);
    });
    return sorted.map((q, i) => ({ ...q, exam_number: i + 1 }));
  };

  // Reset state when component mounts with new questions
  useEffect(() => {
    setDisplayQuestions(sortByType(initialQuestions));
    setAnswers({});
    setTimeLeft(90 * 60);
    setIsSubmitted(false);
  }, [initialQuestions]);

  // Timer countdown
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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    if (isSubmitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer,
    }));
  };

  const handleSubmit = (autoSubmit = false) => {
    if (!autoSubmit) {
      const confirmSubmit = confirm(
        `Bạn đã làm ${Object.keys(answers).length}/${displayQuestions.length} câu.\nBạn có chắc muốn nộp bài?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitted(true);
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const calculateScore = () => {
    let correct = 0;
    displayQuestions.forEach((q) => {
      const userAnswer = answers[q.exam_number];
      const type = getQuestionType(q);

      if (type === 'msq') {
        // MSQ: Check if all options are answered correctly
        if (!userAnswer) return;

        const userAnswerObj: Record<string, boolean> = {};
        userAnswer.split(',').forEach(pair => {
          const [key, value] = pair.split(':');
          userAnswerObj[key] = value === 'true';
        });

        const correctAnswers = q.answer.split(',');
        let allCorrect = true;

        ['A', 'B', 'C', 'D'].forEach(option => {
          const shouldBeTrue = correctAnswers.includes(option);
          const userSaysTrue = userAnswerObj[option] === true;
          if (shouldBeTrue !== userSaysTrue) {
            allCorrect = false;
          }
        });

        if (allCorrect) correct++;
      } else {
        // MCQ and SA: exact match
        if (userAnswer && userAnswer === q.answer) {
          correct++;
        }
      }
    });
    return correct;
  };

  const getQuestionType = (q: Question) => {
    return q.metadata?.type || 'mcq';
  };

  const getQuestionSection = (q: Question) => {
    const type = getQuestionType(q);
    if (type === 'mcq') return 'section1';
    if (type === 'msq') return 'section2';
    return 'section3';
  };

  const mcqCount = displayQuestions.filter(q => getQuestionType(q) === 'mcq').length;
  const msqCount = displayQuestions.filter(q => getQuestionType(q) === 'msq').length;
  const saCount = displayQuestions.filter(q => getQuestionType(q) === 'sa').length;

  if (displayQuestions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Không thể tải đề thi</h2>
          <p>Chưa có đủ câu hỏi trong ngân hàng. Vui lòng upload thêm đề thi.</p>
          <button onClick={() => router.push('/')} className={styles.backButton}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sticky Header */}
      <header className={`${styles.header} ${!isMobileMenuOpen ? styles.headerCollapsed : ''}`}>
        <div className={styles.mobileToggle}>
          <button
            className={styles.hamburgerBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? '✕ Đóng' : '☰ Menu'}
          </button>
          {!isMobileMenuOpen && (
            <div className={`${styles.timer} ${timeLeft < 300 ? styles.timerWarning : ''} ${styles.miniTimer}`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className={`${styles.headerContent} ${!isMobileMenuOpen ? styles.hideOnMobile : ''}`}>
          <div className={styles.headerLeft}>
            <button onClick={() => router.push('/')} className={styles.homeButton}>
              🏠 Home
            </button>
            <div>
              <h1 className={styles.examTitle}>{examTitle || 'Đề thi thử TN THPT Môn Toán - 2026'}</h1>
              <p className={styles.examInfo}>
                Thời gian: 90 phút | Tổng số câu: {displayQuestions.length} ({mcqCount} MCQ + {msqCount} MSQ + {saCount} SA)
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

      {/* Main Content */}
      <main className={styles.content}>
        {/* Section Headers */}
        <div className={styles.sectionInfo}>
          <div className={`${styles.sectionBadge} ${styles.section1Badge}`}>
            Phần 1: Trắc nghiệm (MCQ) - {mcqCount} câu
          </div>
          <div className={`${styles.sectionBadge} ${styles.section2Badge}`}>
            Phần 2: Đúng - sai (MSQ) - {msqCount} câu
          </div>
          <div className={`${styles.sectionBadge} ${styles.section3Badge}`}>
            Phần 3: Trả lời ngắn (SA) - {saCount} câu
          </div>
        </div>

        {/* All Questions grouped by section */}
        <div className={styles.questionsList}>
          {(() => {
            const sectionLabels: Record<string, string> = {
              mcq: 'Phần I: Trắc nghiệm (MCQ)',
              msq: 'Phần II: Đúng - sai (MSQ)',
              sa: 'Phần III: Trả lời ngắn',
            };
            let lastType = '';
            return displayQuestions.map((q) => {
            const type = getQuestionType(q);
            const userAnswer = answers[q.exam_number];
            const isCorrect = isSubmitted && userAnswer === q.answer;
            const isWrong = isSubmitted && userAnswer && userAnswer !== q.answer;
            const showHeading = type !== lastType;
            if (showHeading) lastType = type;

            return (
              <Fragment key={q.id}>
                {showHeading && (
                  <div className={styles.sectionHeading}>
                    {sectionLabels[type] || type.toUpperCase()}
                  </div>
                )}
                <div className={`${styles.questionBlock} ${styles[getQuestionSection(q)]}`}>
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>Câu {q.exam_number}:</span>
                  {isSubmitted && (
                    <span className={`${styles.resultBadge} ${isCorrect ? styles.correct : isWrong ? styles.incorrect : styles.skipped}`}>
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

                {/* MCQ Options */}
                {type === 'mcq' && q.options && (
                  <div className={styles.optionsGrid}>
                    {['A', 'B', 'C', 'D'].map((option) => {
                      const optionKey = `option_${option.toLowerCase()}`;
                      const optionContent = q.options[optionKey];
                      if (!optionContent) return null;

                      const isSelected = userAnswer === option;
                      const isCorrectAnswer = q.answer.includes(option);
                      const showCorrect = isSubmitted && isCorrectAnswer;
                      const showWrong = isSubmitted && isSelected && !isCorrectAnswer;

                      return (
                        <label
                          key={option}
                          className={`${styles.optionItem} ${isSelected ? styles.selected : ''
                            } ${showCorrect ? styles.correctOption : ''} ${showWrong ? styles.wrongOption : ''
                            }`}
                        >
                          <input
                            type="radio"
                            name={`question-${q.exam_number}`}
                            value={option}
                            checked={isSelected}
                            onChange={(e) => {
                              if (isSubmitted) return;
                              handleAnswerChange(q.exam_number, option);
                            }}
                            disabled={isSubmitted}
                            style={{ display: 'none' }}
                          />
                          <span className={styles.optionLabel}>{option}</span>
                          <span className={styles.optionText}>
                            {renderLatexContent(optionContent)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* MSQ Options - Đúng/Sai for each option */}
                {type === 'msq' && q.options && (
                  <div className={styles.msqList}>
                    {['a', 'b', 'c', 'd'].map((option) => {
                      const optionKey = `option_${option.toLowerCase()}`;
                      const optionContent = q.options[optionKey];
                      if (!optionContent) return null;

                      // Parse user answer (format: "A:true,B:false,C:true,D:false")
                      const userAnswerObj: Record<string, boolean> = {};
                      if (userAnswer) {
                        userAnswer.split(',').forEach(pair => {
                          const [key, value] = pair.split(':');
                          userAnswerObj[key] = value === 'true';
                        });
                      }

                      const userChoice = userAnswerObj[option];
                      const correctAnswers = q.answer.split(',');
                      const isCorrectAnswer = correctAnswers.includes(option);

                      const showResult = isSubmitted;
                      const isCorrect = showResult && userChoice === isCorrectAnswer;
                      const isWrong = showResult && userChoice !== undefined && userChoice !== isCorrectAnswer;

                      return (
                        <div
                          key={option}
                          className={`${styles.msqItem} ${showResult && isCorrect ? styles.msqCorrect :
                              showResult && isWrong ? styles.msqWrong : ''
                            }`}
                        >
                          <div className={styles.msqContent}>
                            <span className={styles.msqLabel}>{option})</span>
                            <span className={styles.msqText}>
                              {renderLatexContent(optionContent)}
                            </span>
                          </div>
                          <div className={styles.msqButtons}>
                            <label className={`${styles.msqButton} ${userChoice === true ? styles.msqButtonSelected : ''}`}>
                              <input
                                type="radio"
                                name={`question-${q.exam_number}-${option}`}
                                value="true"
                                checked={userChoice === true}
                                onChange={() => {
                                  if (isSubmitted) return;
                                  const newAnswerObj = { ...userAnswerObj, [option]: true };
                                  const newAnswer = Object.entries(newAnswerObj)
                                    .map(([k, v]) => `${k}:${v}`)
                                    .join(',');
                                  handleAnswerChange(q.exam_number, newAnswer);
                                }}
                                disabled={isSubmitted}
                              />
                              <span>Đúng</span>
                            </label>
                            <label className={`${styles.msqButton} ${userChoice === false ? styles.msqButtonSelected : ''}`}>
                              <input
                                type="radio"
                                name={`question-${q.exam_number}-${option}`}
                                value="false"
                                checked={userChoice === false}
                                onChange={() => {
                                  if (isSubmitted) return;
                                  const newAnswerObj = { ...userAnswerObj, [option]: false };
                                  const newAnswer = Object.entries(newAnswerObj)
                                    .map(([k, v]) => `${k}:${v}`)
                                    .join(',');
                                  handleAnswerChange(q.exam_number, newAnswer);
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

                {/* Short Answer */}
                {type === 'sa' && (
                  <div className={styles.shortAnswerBox}>
                    <input
                      type="text"
                      placeholder="Nhập đáp án của bạn..."
                      value={userAnswer || ''}
                      onChange={(e) => handleAnswerChange(q.exam_number, e.target.value)}
                      disabled={isSubmitted}
                      className={styles.shortAnswerInput}
                    />
                    {isSubmitted && (
                      <div className={styles.correctAnswer}>
                        Đáp án đúng: <strong>{q.answer}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation after submit */}
                {isSubmitted && (() => {
                  const explanation = q.explanation || q.metadata?.explanation || q.metadata?.loi_giai;
                  if (!explanation) return null;
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
                          {renderLatexContent(explanation)}
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

        {/* Submit Button */}
        {!isSubmitted && (
          <div className={styles.submitSection}>
            <button onClick={() => handleSubmit(false)} className={styles.submitButton}>
              Nộp bài
            </button>
          </div>
        )}

        {/* Results */}
        {isSubmitted && (
          <div id="results" className={styles.resultsBox}>
            <h2 className={styles.resultsTitle}>🎓 Kết quả bài thi</h2>
            <div className={styles.scoreDisplay}>
              <div className={styles.score}>
                {calculateScore()}/{displayQuestions.length}
              </div>
              <div className={styles.scoreLabel}>Số câu đúng</div>
            </div>
            <div className={styles.scorePercentage}>
              Điểm: {((calculateScore() / displayQuestions.length) * 10).toFixed(2)}/10
            </div>
            <div className={styles.feedback}>
              {calculateScore() / displayQuestions.length >= 0.8 ? '🎉 Xuất sắc!' :
                calculateScore() / displayQuestions.length >= 0.6 ? '👍 Khá tốt!' :
                  calculateScore() / displayQuestions.length >= 0.4 ? '💪 Cố gắng thêm!' :
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
      </main>
    </div>
  );
}

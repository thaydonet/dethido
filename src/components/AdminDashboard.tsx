'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminDashboard.module.css';
import 'katex/dist/katex.min.css';

interface Question {
  id: string;
  de_id: string;
  so_cau: number;
  phan: string;
  content: string;
  options: any;
  answer: string;
  explanation?: string;
  image_url?: string;
  metadata: any;
  created_at: string;
}

interface AdminDashboardProps {
  initialQuestions: Question[];
}

export default function AdminDashboard({ initialQuestions }: AdminDashboardProps) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDe, setFilterDe] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  // Generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<Question[] | null>(null);
  const [examName, setExamName] = useState('');
  const [isSavingExam, setIsSavingExam] = useState(false);

  // Exam papers list
  const [examPapers, setExamPapers] = useState<{ id: string; name: string; question_ids: string[] }[]>([]);

  const router = useRouter();

  // Fetch exam_papers on mount
  useEffect(() => {
    fetch('/api/admin/exams')
      .then(r => r.json())
      .then(d => setExamPapers(d.data || []))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== id));
      } else {
        alert('Có lỗi xảy ra khi xóa câu hỏi');
      }
    } catch (error) {
      alert('Có lỗi xảy ra');
    }
  };

  const toggleSolution = (id: string) => {
    setShowSolution(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getQuestionType = (q: Question) => {
    if (q.metadata?.type) return q.metadata.type;
    if (q.options) {
      const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
      if (opts.option_a && opts.option_b) return 'mcq';
    }
    return 'sa';
  };

  const handleGenerateExam = () => {
    const mcqs = questions.filter(q => getQuestionType(q) === 'mcq');
    const msqs = questions.filter(q => getQuestionType(q) === 'msq');
    const sas = questions.filter(q => getQuestionType(q) === 'sa');

    if (mcqs.length < 12 || msqs.length < 4 || sas.length < 6) {
      alert(`Không đủ câu hỏi để tạo đề! Cần ít nhất 12 MCQ, 4 MSQ, 6 SA. Hiện có: ${mcqs.length} MCQ, ${msqs.length} MSQ, ${sas.length} SA.`);
      return;
    }

    const shuffle = (array: any[]) => [...array].sort(() => 0.5 - Math.random());
    const selectedMCQs = shuffle(mcqs).slice(0, 12);
    const selectedMSQs = shuffle(msqs).slice(0, 4);
    const selectedSAs = shuffle(sas).slice(0, 6);

    setGeneratedExam([...selectedMCQs, ...selectedMSQs, ...selectedSAs]);
    setIsGenerating(true);
  };

  const handleReplaceQuestion = (index: number) => {
    if (!generatedExam) return;
    const currentQ = generatedExam[index];
    const type = getQuestionType(currentQ);
    
    const availablePool = questions.filter(q => 
      getQuestionType(q) === type && 
      !generatedExam.some(gq => gq.id === q.id)
    );

    if (availablePool.length === 0) {
      alert('Không còn câu hỏi khác cùng loại để thay thế!');
      return;
    }

    const replacement = availablePool[Math.floor(Math.random() * availablePool.length)];
    const newExam = [...generatedExam];
    newExam[index] = replacement;
    setGeneratedExam(newExam);
  };

  const handleSaveExam = async () => {
    if (!examName.trim()) {
      alert('Vui lòng nhập tên đề!');
      return;
    }
    if (!generatedExam || generatedExam.length === 0) return;

    setIsSavingExam(true);
    try {
      const res = await fetch('/api/admin/exams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName: examName.trim(),
          questionIds: generatedExam.map(q => q.id)
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Tạo đề "${examName.trim()}" thành công! Truy cập tại: /${encodeURIComponent(examName.trim())}`);
        setIsGenerating(false);
        setGeneratedExam(null);
        setExamName('');
        // Refresh exam papers list without full reload
        fetch('/api/admin/exams')
          .then(r => r.json())
          .then(d => setExamPapers(d.data || []))
          .catch(() => {});
      } else {
        alert('Lỗi: ' + data.error);
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi lưu đề');
    } finally {
      setIsSavingExam(false);
    }
  };

  const handleDeleteExamPaper = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa đề "${name}"?`)) return;
    const res = await fetch(`/api/admin/exams/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setExamPapers(prev => prev.filter(p => p.id !== id));
    } else {
      alert('Có lỗi khi xóa đề');
    }
  };

  const stats = useMemo(() => {
    const typeCount: Record<string, number> = {};
    const deCount: Record<string, number> = {};

    questions.forEach(q => {
      const type = getQuestionType(q);
      typeCount[type] = (typeCount[type] || 0) + 1;
      deCount[q.de_id] = (deCount[q.de_id] || 0) + 1;
    });

    return { typeCount, deCount, total: questions.length };
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const type = getQuestionType(q);
      const matchType = filterType === 'all' || type === filterType;
      const matchDe = filterDe === 'all' || q.de_id === filterDe;
      const matchSearch = searchTerm === '' ||
        q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.de_id.toLowerCase().includes(searchTerm.toLowerCase());

      return matchType && matchDe && matchSearch;
    });
  }, [questions, filterType, filterDe, searchTerm]);

  const uniqueDe = useMemo(() => {
    return Array.from(new Set(questions.map(q => q.de_id))).sort();
  }, [questions]);

  useEffect(() => {
    setMounted(true);
    // Render KaTeX after mount
    if (typeof window !== 'undefined') {
      const renderMath = async () => {
        try {
          // @ts-expect-error - No types available for auto-render.js
          const renderMathInElement = (await import('katex/dist/contrib/auto-render.js')).default;

          const elements = document.querySelectorAll('.math-content');
          elements.forEach((element) => {
            renderMathInElement(element, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
              ],
              throwOnError: false
            });
          });
        } catch (error) {
          console.error('Error rendering math:', error);
        }
      };

      renderMath();
    }
  }, [filteredQuestions, editingId, showSolution, generatedExam, isGenerating]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.subtitle}>Quản lý ngân hàng câu hỏi</p>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Đăng xuất
        </button>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Tổng câu hỏi</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div>
            <div className={styles.statValue}>{stats.typeCount.mcq || 0}</div>
            <div className={styles.statLabel}>Trắc nghiệm (MCQ)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div>
            <div className={styles.statValue}>{stats.typeCount.msq || 0}</div>
            <div className={styles.statLabel}>Đúng - sai (MSQ)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✏️</div>
          <div>
            <div className={styles.statValue}>{stats.typeCount.sa || 0}</div>
            <div className={styles.statLabel}>Trả lời ngắn (SA)</div>
          </div>
        </div>
      </div>

      {/* ── Exam Papers List ── */}
      {examPapers.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a202c', marginBottom: '1rem' }}>
            ✨ Đề thi đã tạo ({examPapers.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {examPapers.map(paper => (
              <div key={paper.id} style={{
                background: 'white',
                borderRadius: '10px',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📋</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1a202c' }}>{paper.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#718096' }}>{(paper.question_ids || []).length} câu hỏi</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <a
                    href={`/${encodeURIComponent(paper.name)}`}
                    target="_blank"
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#667eea',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    🔗 Xem đề
                  </a>
                  <button
                    onClick={() => handleDeleteExamPaper(paper.id, paper.name)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: '#fed7d7',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                    title="Xóa đề"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Tìm kiếm câu hỏi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={styles.select}
        >
          <option value="all">Tất cả loại</option>
          <option value="mcq">Trắc nghiệm (MCQ)</option>
          <option value="msq">Đúng - sai (MSQ)</option>
          <option value="sa">Trả lời ngắn (SA)</option>
        </select>

        <select
          value={filterDe}
          onChange={(e) => setFilterDe(e.target.value)}
          className={styles.select}
        >
          <option value="all">Tất cả đề</option>
          {uniqueDe.map(de => (
            <option key={de} value={de}>{de}</option>
          ))}
        </select>
      </div>

      <div className={styles.results}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className={styles.resultCount}>
            Hiển thị {filteredQuestions.length} / {stats.total} câu hỏi
          </p>
          <button onClick={handleGenerateExam} className={styles.generateBtn}>
            ✨ Tạo đề ngẫu nhiên (12 MCQ + 4 MSQ + 6 SA)
          </button>
        </div>
      </div>

      <div className={styles.questionList}>
        {filteredQuestions.map((q) => (
          <div key={q.id} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <div className={styles.questionMeta}>
                <span className={styles.badge}>{q.de_id}</span>
                <span className={styles.badge}>Câu {q.so_cau}</span>
                <span className={`${styles.badge} ${styles[getQuestionType(q)]}`}>
                  {getQuestionType(q).toUpperCase()}
                </span>
              </div>
              <div className={styles.actions}>
                <button
                  onClick={() => setEditingId(editingId === q.id ? null : q.id)}
                  className={styles.editBtn}
                  title="Xem chi tiết"
                >
                  {editingId === q.id ? '▲' : '▼'}
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className={styles.deleteBtn}
                  title="Xóa"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div
              className={`${styles.questionContent} math-content`}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
              dangerouslySetInnerHTML={{ __html: q.content }}
            />

            {editingId === q.id && mounted && (
              <div className={styles.questionDetails}>
                <div className={styles.detailSection}>
                  <strong>Nội dung đầy đủ:</strong>
                  <div
                    className="math-content"
                    dangerouslySetInnerHTML={{ __html: q.content }}
                  />
                </div>

                {q.options && (
                  <div className={styles.detailSection}>
                    <strong>Các đáp án:</strong>
                    <div className={styles.optionsList}>
                      {Object.entries(q.options).map(([key, value]) => (
                        <div key={key} className={styles.optionItem}>
                          <span className={styles.optionLabel}>{key}.</span>
                          <span
                            className="math-content"
                            dangerouslySetInnerHTML={{ __html: String(value) }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {q.answer && (
                  <div className={styles.detailSection}>
                    <strong>Đáp án đúng:</strong> <span className={styles.correctAnswer}>{q.answer}</span>
                  </div>
                )}

                {q.image_url && (
                  <div className={styles.detailSection}>
                    <strong>Hình ảnh:</strong>
                    <img src={q.image_url} alt="Question" className={styles.questionImage} />
                  </div>
                )}

                {(q.explanation || q.metadata?.explanation || q.metadata?.loi_giai) && (() => {
                  const solutionText = q.explanation || q.metadata?.explanation || q.metadata?.loi_giai;
                  return (
                    <div className={styles.detailSection}>
                      <div className={styles.solutionHeader}>
                        <strong>💡 Lời giải:</strong>
                        <button
                          onClick={() => toggleSolution(q.id)}
                          className={styles.toggleBtn}
                        >
                          {showSolution[q.id] ? '▲ Ẩn' : '▼ Hiện'}
                        </button>
                      </div>
                      {showSolution[q.id] && (
                        <div
                          className={`${styles.solutionContent} math-content`}
                          dangerouslySetInnerHTML={{ __html: solutionText }}
                        />
                      )}
                    </div>
                  );
                })()}

                {q.metadata && (
                  <div className={styles.detailSection}>
                    <strong>Thông tin bổ sung:</strong>
                    <div className={styles.metadataGrid}>
                      {q.metadata.difficulty && <div><strong>Độ khó:</strong> {q.metadata.difficulty}</div>}
                      {q.metadata.grade && <div><strong>Lớp:</strong> {q.metadata.grade}</div>}
                      {q.metadata.chapter && <div><strong>Chương:</strong> {q.metadata.chapter}</div>}
                      {q.metadata.concept && <div><strong>Khái niệm:</strong> {q.metadata.concept}</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isGenerating && generatedExam && (
        <div className={styles.generatorOverlay}>
          <div className={styles.generatorModal}>
            <div className={styles.generatorHeader}>
              <h2>Tạo đề mới (22 câu)</h2>
              <button onClick={() => setIsGenerating(false)} className={styles.closeBtn}>&times;</button>
            </div>
            
            <div className={styles.generatorContent}>
              <div className={styles.questionList}>
                {generatedExam.map((q, index) => (
                  <div key={q.id + index} className={styles.questionCard}>
                    <div className={styles.questionHeader}>
                      <div className={styles.questionMeta}>
                        <span className={styles.badge}>Câu {index + 1}</span>
                        <span className={`${styles.badge} ${styles[getQuestionType(q)]}`}>
                          {getQuestionType(q).toUpperCase()}
                        </span>
                        <span className={styles.badge} style={{ opacity: 0.7 }}>Gốc: {q.de_id} - Câu {q.so_cau}</span>
                      </div>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleReplaceQuestion(index)}
                          className={styles.replaceBtn}
                          title="Thay câu khác cùng loại"
                        >
                          🔄 Thay câu
                        </button>
                      </div>
                    </div>
                    
                    <div
                      className={`${styles.questionContent} math-content`}
                      dangerouslySetInnerHTML={{ __html: q.content }}
                    />
                    
                    {q.options && (
                      <div className={styles.optionsList} style={{ marginTop: '1rem' }}>
                        {Object.entries(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map(([key, value]) => (
                          <div key={key} className={styles.optionItem}>
                            <span className={styles.optionLabel}>{key}.</span>
                            <span
                              className="math-content"
                              dangerouslySetInnerHTML={{ __html: String(value) }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.generatorFooter}>
              <input 
                type="text" 
                className={styles.examNameInput}
                placeholder="Nhập tên mã đề (VD: de-thi-thu-2026-moi)"
                value={examName}
                onChange={e => setExamName(e.target.value)}
              />
              <button 
                onClick={handleSaveExam}
                className={styles.saveBtn}
                disabled={isSavingExam || !examName.trim()}
              >
                {isSavingExam ? 'Đang lưu...' : '💾 Xuất đề'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

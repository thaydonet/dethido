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
  const router = useRouter();

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
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
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
  }, [filteredQuestions, editingId, showSolution]);

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
            <div className={styles.statLabel}>Nhiều đáp án (MSQ)</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✏️</div>
          <div>
            <div className={styles.statValue}>{stats.typeCount.sa || 0}</div>
            <div className={styles.statLabel}>Tự luận (SA)</div>
          </div>
        </div>
      </div>

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
          <option value="msq">Nhiều đáp án (MSQ)</option>
          <option value="sa">Tự luận (SA)</option>
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
        <p className={styles.resultCount}>
          Hiển thị {filteredQuestions.length} / {stats.total} câu hỏi
        </p>
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
              dangerouslySetInnerHTML={{ __html: q.content.substring(0, 200) + (q.content.length > 200 ? '...' : '') }}
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
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface ExamSet {
  de_id: string;
  slug?: string;
  count: number;
  type: 'generated' | 'original';
  created_by_email?: string;
  view_count?: number;
}

interface HomeLayoutProps {
  examSets: ExamSet[];
  totalExams: number;
  totalQuestions: number;
  currentPage: number;
  totalPages: number;
}

// Bảng màu ngẫu nhiên sắc nét, độ tương phản cao cho tiêu đề đề thi
const EXAM_TITLE_THEMES = [
  { titleColor: '#1d4ed8', iconBg: '#eff6ff', iconBorder: '#bfdbfe', badgeColor: '#2563eb', badgeBg: '#eff6ff', badgeBorder: '#bfdbfe' },
  { titleColor: '#7c3aed', iconBg: '#f5f3ff', iconBorder: '#ddd6fe', badgeColor: '#7c3aed', badgeBg: '#f5f3ff', badgeBorder: '#ddd6fe' },
  { titleColor: '#059669', iconBg: '#ecfdf5', iconBorder: '#a7f3d0', badgeColor: '#059669', badgeBg: '#ecfdf5', badgeBorder: '#a7f3d0' },
  { titleColor: '#b45309', iconBg: '#fffbeb', iconBorder: '#fde68a', badgeColor: '#b45309', badgeBg: '#fffbeb', badgeBorder: '#fde68a' },
  { titleColor: '#c026d3', iconBg: '#fdf4ff', iconBorder: '#f5d0fe', badgeColor: '#c026d3', badgeBg: '#fdf4ff', badgeBorder: '#f5d0fe' },
  { titleColor: '#0891b2', iconBg: '#ecfeff', iconBorder: '#a5f3fc', badgeColor: '#0891b2', badgeBg: '#ecfeff', badgeBorder: '#a5f3fc' },
  { titleColor: '#ea580c', iconBg: '#fff7ed', iconBorder: '#fed7aa', badgeColor: '#ea580c', badgeBg: '#fff7ed', badgeBorder: '#fed7aa' },
  { titleColor: '#4f46e5', iconBg: '#eef2ff', iconBorder: '#c7d2fe', badgeColor: '#4f46e5', badgeBg: '#eef2ff', badgeBorder: '#c7d2fe' },
  { titleColor: '#0f766e', iconBg: '#f0fdfa', iconBorder: '#99f6e4', badgeColor: '#0f766e', badgeBg: '#f0fdfa', badgeBorder: '#99f6e4' },
  { titleColor: '#be123c', iconBg: '#fff1f2', iconBorder: '#fecdd3', badgeColor: '#be123c', badgeBg: '#fff1f2', badgeBorder: '#fecdd3' },
];

function getExamTheme(deId: string, index: number) {
  let hash = 0;
  for (let i = 0; i < deId.length; i++) {
    hash = (hash << 5) - hash + deId.charCodeAt(i);
    hash |= 0;
  }
  const colorIndex = Math.abs(hash + index * 3) % EXAM_TITLE_THEMES.length;
  return EXAM_TITLE_THEMES[colorIndex];
}

export default function HomeLayout({
  examSets,
  totalExams,
  totalQuestions,
  currentPage,
  totalPages,
}: HomeLayoutProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc đề thi theo tìm kiếm
  const filteredExams = useMemo(() => {
    if (!searchTerm.trim()) return examSets;
    const term = searchTerm.toLowerCase();
    return examSets.filter(
      (e) =>
        e.de_id.toLowerCase().includes(term) ||
        (e.created_by_email && e.created_by_email.toLowerCase().includes(term))
    );
  }, [examSets, searchTerm]);

  return (
    <div className="edtech-home">

      {/* ══════════════ SECTION 1: HERO (NỀN XANH DƯƠNG NHẸ #EFF6FF ➔ #F8FAFC) ══════════════ */}
      <section className="ed-section ed-hero">
        <div className="ed-container">
          <div className="ed-hero-grid">

            {/* Left Content */}
            <div className="ed-hero-left">
              <div className="ed-tagline-badge">
                <span className="ed-tagline-dot" />
                <span className="ed-tagline-text">Học rõ từng bước – thi vững từng điểm.</span>
              </div>

              <h1 className="ed-hero-heading">
                Luyện Toán thông minh – <br />
                <span className="ed-text-primary">vững điểm thi THPT</span>
              </h1>

              <p className="ed-hero-subheading">
                Hệ thống ngân hàng câu hỏi bám sát cấu trúc mới của Bộ GD&ĐT 2026.
                Giao diện tinh gọn, không gây áp lực, tập trung 100% vào tư duy và lời giải chi tiết.
              </p>

              <div className="ed-hero-cta-group">
                <a href="#kho-de" className="ed-btn-3d ed-btn-3d-primary">
                  <span>Làm bài ngay</span>
                  <span className="ed-btn-arr">↓</span>
                </a>
                <Link href="/de-thi-thu-tn-thpt-mon-toan-2026" className="ed-btn-3d ed-btn-3d-outline">
                  <span>Thi thử THPT 2027</span>
                  <span className="ed-btn-arr">→</span>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="ed-hero-stats">
                <div className="ed-hero-stat-item">
                  <div className="ed-stat-num">{totalExams > 0 ? `${totalExams}+` : '100+'}</div>
                  <div className="ed-stat-lbl">Đề thi chọn lọc</div>
                </div>
                <div className="ed-hero-stat-divider" />
                <div className="ed-hero-stat-item">
                  <div className="ed-stat-num">5000+</div>
                  <div className="ed-stat-lbl">Câu hỏi có lời giải</div>
                </div>
                <div className="ed-hero-stat-divider" />
                <div className="ed-hero-stat-item">
                  <div className="ed-stat-num">150+ </div>
                  <div className="ed-stat-lbl">Đề thi thử Toán 2026</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Preview Card */}
            <div className="ed-hero-right">
              <div className="ed-preview-card">

                <div className="ed-card-header-bar">
                  <div className="ed-card-dots">
                    <span className="ed-dot red" />
                    <span className="ed-dot yellow" />
                    <span className="ed-dot green" />
                  </div>
                  <span className="ed-card-header-title">Đề thi mẫu chuẩn 2026 · Toán 12</span>
                  <span className="ed-card-header-badge">Thời gian: 90:00</span>
                </div>

                <div className="ed-card-body">
                  <div className="ed-sample-question">
                    <div className="ed-sample-q-head">
                      <span className="ed-q-tag">Câu 1 · Trắc nghiệm</span>
                      <span className="ed-q-points">0.25 điểm</span>
                    </div>
                    <p className="ed-sample-q-text">
                      Cho hàm số <code className="ed-math-code">y = f(x)</code> có bảng biến thiên trên khoảng <code className="ed-math-code">(-∞; +∞)</code>.
                      Hàm số đồng biến trên khoảng nào dưới đây?
                    </p>

                    <div className="ed-sample-options">
                      <div className="ed-sample-opt selected">
                        <span className="ed-opt-key">A</span>
                        <span className="ed-opt-val">(-∞; 2)</span>
                        <span className="ed-opt-check">✓ Đã chọn</span>
                      </div>
                      <div className="ed-sample-opt">
                        <span className="ed-opt-key">B</span>
                        <span className="ed-opt-val">(0; +∞)</span>
                      </div>
                      <div className="ed-sample-opt">
                        <span className="ed-opt-key">C</span>
                        <span className="ed-opt-val">(-1; 3)</span>
                      </div>
                      <div className="ed-sample-opt">
                        <span className="ed-opt-key">D</span>
                        <span className="ed-opt-val">(1; 4)</span>
                      </div>
                    </div>
                  </div>

                  <div className="ed-preview-footer">
                    <div className="ed-preview-progress">
                      <div className="ed-progress-bar">
                        <div className="ed-progress-fill" style={{ width: '65%' }} />
                      </div>
                      <span className="ed-progress-txt">Đã làm 14/22 câu</span>
                    </div>
                    <Link href="/de-thi-thu-tn-thpt-mon-toan-2026" className="ed-preview-btn-3d">
                      Vào làm thử →
                    </Link>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ══════════════ SECTION 2: 3 TÍNH NĂNG CHỦ ĐẠO (NỀN TRẮNG TINH #FFFFFF) ══════════════ */}
      <section className="ed-section ed-features-section">
        <div className="ed-container">

          <div className="ed-section-head">
            <div className="ed-section-badge">
              <span>⚡ PHƯƠNG PHÁP HỌC TẬP</span>
            </div>
            <h2 className="ed-section-title">Hệ Thống Luyện Thi Toàn Diện</h2>
            <p className="ed-section-desc">
              Tối ưu cho việc học hiểu bản chất, rèn phản xạ giải nhanh và theo dõi sự tiến bộ mỗi ngày.
            </p>
          </div>

          <div className="ed-features-grid">

            {/* Feature 1: Kho câu hỏi */}
            <div className="ed-feature-card">
              <div className="ed-feat-icon-box ed-icon-blue">
                <span className="ed-feat-icon">📚</span>
              </div>
              <h3 className="ed-feat-title">Kho câu hỏi & Đề thi chọn lọc</h3>
              <p className="ed-feat-desc">
                Hàng ngàn câu hỏi phân loại chi tiết theo từng chuyên đề Toán 12, bám sát đầy đủ 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai và Trả lời ngắn.
              </p>
              <div className="ed-feat-sublink">
                <span>Cập nhật liên tục 2027</span>
              </div>
            </div>

            {/* Feature 2: Thi đấu / Thi thử */}
            <div className="ed-feature-card">
              <div className="ed-feat-icon-box ed-icon-blue">
                <span className="ed-feat-icon">⏱️</span>
              </div>
              <h3 className="ed-feat-title">Thi thử trực tuyến 90 phút</h3>
              <p className="ed-feat-desc">
                Phòng thi ảo với đồng hồ đếm ngược, giao diện làm bài tập trung, tự động lưu câu trả lời và chấm điểm tự động tức thì ngay khi nộp bài.
              </p>
              <div className="ed-feat-sublink">
                <span>Mô phỏng áp lực thi thật</span>
              </div>
            </div>

            {/* Feature 3: Phân tích năng lực (Accent Purple #7C3AED) */}
            <div className="ed-feature-card ed-feat-purple">
              <div className="ed-feat-icon-box ed-icon-purple">
                <span className="ed-feat-icon">🧠</span>
              </div>
              <h3 className="ed-feat-title">Phân tích năng lực & Lời giải</h3>
              <p className="ed-feat-desc">
                100% câu hỏi có lời giải từng bước và đồ thị KaTeX. Tự động nhận diện dạng bài yếu để bổ sung kiến thức đúng trọng tâm.
              </p>
              <div className="ed-feat-sublink ed-sublink-purple">
                <span>Học rõ từng bước giải</span>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ══════════════ SECTION 3: DANH SÁCH ĐỀ THI (NỀN XANH BĂNG / ICE-BLUE #F0F9FF ➔ #F8FAFC) ══════════════ */}
      <section className="ed-section ed-exams-section" id="kho-de">
        <div className="ed-container">

          <div className="ed-section-head">
            <div className="ed-section-badge">
              <span>📚 KHO ĐỀ THI CHỌN LỌC</span>
            </div>
            <h2 className="ed-section-title">Danh Sách Đề Thi Trắc Nghiệm</h2>
            <p className="ed-section-desc">
              Chọn đề thi bất kỳ để bắt đầu làm bài online hoặc bấm Thi thử để hệ thống tạo đề ngẫu nhiên.
            </p>

            {/* Search filter */}
            <div className="ed-search-bar-wrap">
              <div className="ed-search-box">
                <span className="ed-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm đề thi theo tên hoặc giáo viên biên soạn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ed-search-input"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="ed-search-clear">
                    ✕
                  </button>
                )}
              </div>
              <div className="ed-count-tag">
                Tổng số: <strong>{totalExams} đề thi</strong>
              </div>
            </div>
          </div>

          {filteredExams.length === 0 ? (
            <div className="ed-empty-state">
              <span className="ed-empty-icon">📂</span>
              <h3 className="ed-empty-title">Không tìm thấy đề thi phù hợp</h3>
              <p className="ed-empty-desc">
                {searchTerm ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm.' : 'Chưa có đề thi nào trong hệ thống.'}
              </p>
            </div>
          ) : (
            <div className="ed-exams-grid">
              {filteredExams.map((exam, index) => {
                const examUrl = `/${exam.slug || encodeURIComponent(exam.de_id)}`;
                const isGenerated = exam.type === 'generated';
                const theme = getExamTheme(exam.de_id, index);

                return (
                  <div key={exam.de_id} className="ed-exam-card">
                    <div className="ed-exam-card-top">
                      <div
                        className="ed-exam-icon-box"
                        style={{
                          backgroundColor: theme.iconBg,
                          borderColor: theme.iconBorder,
                        }}
                      >
                        <span className="ed-exam-icon">📐</span>
                      </div>
                      <span
                        className="ed-exam-badge"
                        style={{
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeColor,
                          borderColor: theme.badgeBorder,
                        }}
                      >
                        {isGenerated ? '✨ Đề tổng hợp' : '📝 Đề chuẩn'}
                      </span>
                    </div>

                    {/* Tiêu đề đề thi có màu ngẫu nhiên nổi bật */}
                    <h3
                      className="ed-exam-name"
                      style={{ color: theme.titleColor }}
                      title={exam.de_id}
                    >
                      {exam.de_id}
                    </h3>

                    <div className="ed-exam-meta-group">
                      <div className="ed-exam-meta-item">
                        <span className="ed-meta-bullet">✓</span>
                        <span><strong>{exam.count}</strong> câu hỏi chuẩn Bộ GD&ĐT</span>
                      </div>
                      {exam.created_by_email && exam.created_by_email !== 'N/A' && (
                        <div className="ed-exam-meta-item">
                          <span className="ed-meta-bullet">👨‍🏫</span>
                          <span>Biên soạn: <strong>{exam.created_by_email.split('@')[0]}</strong></span>
                        </div>
                      )}
                      {exam.view_count !== undefined && (
                        <div className="ed-exam-meta-item">
                          <span className="ed-meta-bullet">👁️</span>
                          <span><strong>{exam.view_count}</strong> lượt làm bài</span>
                        </div>
                      )}
                    </div>

                    <div className="ed-exam-card-footer">
                      <Link href={examUrl} className="ed-btn-3d-exam">
                        <span>Vào thi ngay</span>
                        <span className="ed-btn-exam-arr">→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="ed-pagination">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const isActive = currentPage === p;
                return (
                  <a
                    key={p}
                    href={`/?page=${p}#kho-de`}
                    className={`ed-page-btn-3d ${isActive ? 'active' : ''}`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          )}

        </div>
      </section>


      {/* ══════════════ SECTION 4: LỘ TRÌNH & CỔNG GIÁO VIÊN (NỀN XANH MINT NHẸ #F0FDF4 ➔ #ECFDF5) ══════════════ */}
      <section className="ed-section ed-guide-section" id="lo-trinh">
        <div className="ed-container">

          <div className="ed-guide-grid">

            {/* Box 1: Lộ trình 3 bước */}
            <div className="ed-guide-card">
              <span className="ed-guide-badge">🎯 LỘ TRÌNH ÔN THI</span>
              <h3 className="ed-guide-title">Lộ trình 3 Bước Bứt Phá Điểm 9+</h3>

              <div className="ed-step-list">
                <div className="ed-step-item">
                  <div className="ed-step-num">1</div>
                  <div>
                    <h4 className="ed-step-name">Nắm chắc 7.0 điểm nền tảng</h4>
                    <p className="ed-step-text">Hoàn thành tuyệt đối phần trắc nghiệm nhận biết, thông hiểu không để mất điểm oan.</p>
                  </div>
                </div>
                <div className="ed-step-item">
                  <div className="ed-step-num">2</div>
                  <div>
                    <h4 className="ed-step-name">Rèn luyện Phần II (Đúng/Sai)</h4>
                    <p className="ed-step-text">Tập trung giải các bài toán 4 ý Đúng/Sai để tối đa hóa 4.0 điểm luỹ tiến.</p>
                  </div>
                </div>
                <div className="ed-step-item">
                  <div className="ed-step-num">3</div>
                  <div>
                    <h4 className="ed-step-name">Chinh phục Phần III (Trả lời ngắn)</h4>
                    <p className="ed-step-text">Luyện tư duy giải toán thực tế, ứng dụng tích phân, xác suất, hình học không gian Oxyz.</p>
                  </div>
                </div>
              </div>

              <div className="ed-guide-action">
                <Link href="/de-thi-thu-tn-thpt-mon-toan-2026" className="ed-btn-3d ed-btn-3d-primary">
                  Bắt đầu thi thử ngay →
                </Link>
              </div>
            </div>

            {/* Box 2: Hướng dẫn Giáo viên */}
            <div className="ed-guide-card ed-guide-card-teacher">
              <span className="ed-guide-badge ed-badge-teacher">👨‍🏫 DÀNH CHO GIÁO VIÊN</span>
              <h3 className="ed-guide-title">Hệ Thống Quản Trị & Tạo Đề Online</h3>
              <p className="ed-guide-text">
                Giáo viên có thể dễ dàng tạo đề thi trực tuyến, xáo trộn mã đề tự động và tải đề thi về máy dưới dạng <strong>file Word, PDF hoặc HTML</strong> phục vụ giảng dạy.
              </p>

              <div className="ed-teacher-perks">
                <div className="ed-perk-item">
                  <span className="ed-perk-icon">✓</span>
                  <span>Trộn đề trắc nghiệm chuẩn cấu trúc 2026</span>
                </div>
                <div className="ed-perk-item">
                  <span className="ed-perk-icon">✓</span>
                  <span>Xuất đề kèm đáp án và lời giải chi tiết</span>
                </div>
                <div className="ed-perk-item">
                  <span className="ed-perk-icon">✓</span>
                  <span>Quản lý ngân hàng câu hỏi môn Toán không giới hạn</span>
                </div>
              </div>

              <div className="ed-guide-action">
                <a
                  href="https://toan.lop12.com/admin/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-btn-3d ed-btn-3d-secondary"
                >
                  <span>Truy cập Cổng Giáo Viên</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ══════════════ STYLES (SCOPED CSS) ══════════════ */}
      <style>{`
        .edtech-home {
          background-color: #f8fafc;
          color: #0f172a;
          font-family: 'Be Vietnam Pro', 'Inter', sans-serif;
        }

        .ed-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        .ed-section {
          padding: 4.5rem 0;
        }

        .ed-text-primary {
          color: #2563eb;
        }

        /* ── SECTION HEADER COMMON ── */
        .ed-section-head {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 3rem;
        }

        .ed-section-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 9999px;
          color: #2563eb;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 0.75rem;
        }

        .ed-section-title {
          font-size: clamp(1.75rem, 3vw, 2.25rem);
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .ed-section-desc {
          font-size: 1rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 auto;
        }

        /* ══════════════════════════════════════════════════
           3D RAISED BUTTONS (NỀN NỔI 3D HIỆN ĐẠI)
           ══════════════════════════════════════════════════ */
        .ed-btn-3d {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 48px;
          padding: 0 1.75rem;
          border-radius: 12px;
          font-size: 0.96rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          user-select: none;
          transition: all 0.12s ease-in-out;
        }

        /* 3D Primary Button (Xanh dương) */
        .ed-btn-3d-primary {
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #1d4ed8;
          border-bottom: 4px solid #1e40af;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
        }

        .ed-btn-3d-primary:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.32);
        }

        .ed-btn-3d-primary:active {
          transform: translateY(2px);
          border-bottom-width: 2px;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }

        /* 3D Outline Button (Trắng viền nổi) */
        .ed-btn-3d-outline {
          background: #ffffff;
          color: #2563eb;
          border: 1.5px solid #bfdbfe;
          border-bottom: 4px solid #93c5fd;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
        }

        .ed-btn-3d-outline:hover {
          background: #eff6ff;
          border-color: #93c5fd;
          border-bottom-color: #60a5fa;
          transform: translateY(-1px);
          box-shadow: 0 5px 12px rgba(37, 99, 235, 0.12);
        }

        .ed-btn-3d-outline:active {
          transform: translateY(2px);
          border-bottom-width: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* 3D Secondary Button (Tím) */
        .ed-btn-3d-secondary {
          background: #7c3aed;
          color: #ffffff;
          border: 1px solid #6d28d9;
          border-bottom: 4px solid #5b21b6;
          box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25);
        }

        .ed-btn-3d-secondary:hover {
          background: #6d28d9;
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(124, 58, 237, 0.32);
        }

        .ed-btn-3d-secondary:active {
          transform: translateY(2px);
          border-bottom-width: 2px;
          box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
        }

        /* 3D Exam Card Button */
        .ed-btn-3d-exam {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 44px;
          padding: 0 1.1rem;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-bottom: 3.5px solid #94a3b8;
          border-radius: 10px;
          color: #1e40af;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.12s ease;
        }

        .ed-btn-3d-exam:hover {
          background: #2563eb;
          color: #ffffff;
          border-color: #1d4ed8;
          border-bottom: 3.5px solid #1e40af;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.22);
        }

        .ed-btn-3d-exam:active {
          transform: translateY(2px);
          border-bottom-width: 1.5px;
        }

        .ed-btn-exam-arr {
          font-size: 1.15rem;
          transition: transform 0.15s;
        }

        .ed-btn-3d-exam:hover .ed-btn-exam-arr {
          transform: translateX(4px);
        }

        /* 3D Preview Mini Button */
        .ed-preview-btn-3d {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
          background: #2563eb;
          text-decoration: none;
          padding: 7px 14px;
          border-radius: 8px;
          border: 1px solid #1d4ed8;
          border-bottom: 3px solid #1e40af;
          transition: all 0.12s ease;
          display: inline-flex;
          align-items: center;
        }

        .ed-preview-btn-3d:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .ed-preview-btn-3d:active {
          transform: translateY(1.5px);
          border-bottom-width: 1.5px;
        }

        /* 3D Pagination Buttons */
        .ed-page-btn-3d {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-bottom: 3px solid #94a3b8;
          color: #334155;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          transition: all 0.12s ease;
        }

        .ed-page-btn-3d:hover {
          border-color: #2563eb;
          border-bottom-color: #1d4ed8;
          color: #2563eb;
          background: #eff6ff;
          transform: translateY(-1px);
        }

        .ed-page-btn-3d.active {
          background: #2563eb !important;
          color: #ffffff !important;
          border-color: #1d4ed8 !important;
          border-bottom: 3.5px solid #1e40af !important;
        }

        .ed-btn-arr {
          font-size: 1.1rem;
          line-height: 1;
        }

        /* ══════════════════════════════════════════════════
           SECTION 1: HERO (NỀN XANH DƯƠNG NHẸ)
           ══════════════════════════════════════════════════ */
        .ed-hero {
          background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
          border-bottom: 1px solid #dbeafe;
          padding: 4rem 0 3.5rem;
        }

        .ed-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3rem;
          align-items: center;
        }

        .ed-tagline-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1px solid #bfdbfe;
          padding: 6px 14px;
          border-radius: 9999px;
          margin-bottom: 1.25rem;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.06);
        }

        .ed-tagline-dot {
          width: 8px;
          height: 8px;
          background: #16a34a;
          border-radius: 50%;
        }

        .ed-tagline-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e40af;
        }

        .ed-hero-heading {
          font-size: clamp(2.2rem, 4vw, 3.2rem);
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          margin-bottom: 1.25rem;
          letter-spacing: -0.03em;
        }

        .ed-hero-subheading {
          font-size: 1.05rem;
          line-height: 1.7;
          color: #475569;
          margin-bottom: 2rem;
          max-width: 540px;
        }

        .ed-hero-cta-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        /* Hero Stats */
        .ed-hero-stats {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #dbeafe;
        }

        .ed-hero-stat-item {
          display: flex;
          flex-direction: column;
        }

        .ed-stat-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .ed-stat-lbl {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 500;
        }

        .ed-hero-stat-divider {
          width: 1px;
          height: 32px;
          background: #cbd5e1;
        }

        /* ── HERO PREVIEW CARD ── */
        .ed-hero-right {
          display: flex;
          justify-content: center;
        }

        .ed-preview-card {
          width: 100%;
          max-width: 460px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03);
          overflow: hidden;
        }

        .ed-card-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .ed-card-dots {
          display: flex;
          gap: 6px;
        }

        .ed-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }
        .ed-dot.red { background: #ef4444; }
        .ed-dot.yellow { background: #f59e0b; }
        .ed-dot.green { background: #10b981; }

        .ed-card-header-title {
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
        }

        .ed-card-header-badge {
          font-size: 0.72rem;
          font-weight: 700;
          background: #eff6ff;
          color: #2563eb;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .ed-card-body {
          padding: 1.25rem;
        }

        .ed-sample-question {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.1rem;
          margin-bottom: 1rem;
        }

        .ed-sample-q-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }

        .ed-q-tag {
          font-size: 0.78rem;
          font-weight: 700;
          color: #2563eb;
        }

        .ed-q-points {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748b;
          background: #ffffff;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }

        .ed-sample-q-text {
          font-size: 0.92rem;
          line-height: 1.6;
          color: #1e293b;
          margin-bottom: 0.85rem;
        }

        .ed-math-code {
          font-family: 'Inter', monospace;
          background: #ffffff;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          font-size: 0.88rem;
        }

        .ed-sample-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .ed-sample-opt {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.84rem;
          color: #334155;
        }

        .ed-sample-opt.selected {
          border-color: #2563eb;
          background: #eff6ff;
          color: #1e40af;
          font-weight: 600;
        }

        .ed-opt-key {
          font-weight: 700;
          width: 18px;
          height: 18px;
          background: #f1f5f9;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
        }

        .ed-sample-opt.selected .ed-opt-key {
          background: #2563eb;
          color: #ffffff;
        }

        .ed-opt-val {
          flex: 1;
        }

        .ed-opt-check {
          font-size: 0.72rem;
          color: #16a34a;
          font-weight: 700;
        }

        .ed-preview-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-top: 0.25rem;
        }

        .ed-preview-progress {
          flex: 1;
        }

        .ed-progress-bar {
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .ed-progress-fill {
          height: 100%;
          background: #2563eb;
          border-radius: 9999px;
        }

        .ed-progress-txt {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
        }


        /* ══════════════════════════════════════════════════
           SECTION 2: 3 TÍNH NĂNG (NỀN TRẮNG TINH)
           ══════════════════════════════════════════════════ */
        .ed-features-section {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }

        .ed-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .ed-feature-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 2rem 1.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .ed-feature-card:hover {
          border-color: #bfdbfe;
          background: #ffffff;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }

        .ed-feat-purple:hover {
          border-color: #ddd6fe;
        }

        .ed-feat-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 1.25rem;
        }

        .ed-icon-blue {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
        }

        .ed-icon-purple {
          background: #f5f3ff;
          border: 1px solid #ddd6fe;
        }

        .ed-feat-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.6rem;
          letter-spacing: -0.01em;
        }

        .ed-feat-desc {
          font-size: 0.92rem;
          line-height: 1.65;
          color: #64748b;
          margin-bottom: 1.25rem;
          flex: 1;
        }

        .ed-feat-sublink {
          font-size: 0.8rem;
          font-weight: 600;
          color: #2563eb;
        }

        .ed-sublink-purple {
          color: #7c3aed;
        }


        /* ══════════════════════════════════════════════════
           SECTION 3: KHO ĐỀ THI (NỀN XANH BĂNG / ICE-BLUE)
           ══════════════════════════════════════════════════ */
        .ed-exams-section {
          background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 40%, #f0f9ff 100%);
          border-bottom: 1px solid #e0e7ff;
        }

        .ed-search-bar-wrap {
          margin-top: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .ed-search-box {
          position: relative;
          width: 100%;
          max-width: 480px;
        }

        .ed-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          color: #94a3b8;
        }

        .ed-search-input {
          width: 100%;
          height: 46px;
          padding: 0 40px 0 44px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 9999px;
          font-size: 0.92rem;
          font-family: inherit;
          color: #0f172a;
          outline: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.15s ease;
        }

        .ed-search-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .ed-search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: #e2e8f0;
          border: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 0.72rem;
          cursor: pointer;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ed-count-tag {
          background: #ffffff;
          border: 1px solid #bfdbfe;
          color: #334155;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .ed-count-tag strong {
          color: #2563eb;
        }

        /* Exams Grid */
        .ed-exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .ed-exam-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 14px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }

        .ed-exam-card:hover {
          border-color: #2563eb;
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
        }

        .ed-exam-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .ed-exam-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .ed-exam-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
          border: 1px solid;
        }

        .ed-exam-name {
          font-size: 1.15rem;
          font-weight: 800;
          line-height: 1.4;
          margin-bottom: 1rem;
          min-height: 2.8em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: -0.01em;
        }

        .ed-exam-meta-group {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.75rem 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1.25rem;
        }

        .ed-exam-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84rem;
          color: #475569;
        }

        .ed-meta-bullet {
          font-size: 0.85rem;
          color: #2563eb;
        }

        .ed-exam-card-footer {
          padding-top: 0.75rem;
          border-top: 1px solid #f1f5f9;
        }

        /* Empty state */
        .ed-empty-state {
          text-align: center;
          padding: 3.5rem 1.5rem;
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          border-radius: 16px;
          max-width: 480px;
          margin: 0 auto;
        }

        .ed-empty-icon {
          font-size: 3rem;
          margin-bottom: 0.75rem;
          display: block;
        }

        .ed-empty-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.4rem;
        }

        .ed-empty-desc {
          font-size: 0.9rem;
          color: #64748b;
        }

        /* Pagination */
        .ed-pagination {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 3rem;
          flex-wrap: wrap;
        }


        /* ══════════════════════════════════════════════════
           SECTION 4: LỘ TRÌNH & CỔNG GIÁO VIÊN (NỀN XANH MINT)
           ══════════════════════════════════════════════════ */
        .ed-guide-section {
          background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
          border-top: 1px solid #d1fae5;
        }

        .ed-guide-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .ed-guide-card {
          background: #ffffff;
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          padding: 2.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.05);
        }

        .ed-guide-card-teacher {
          border-color: #ddd6fe;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.05);
        }

        .ed-guide-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #059669;
          margin-bottom: 0.6rem;
        }

        .ed-badge-teacher {
          color: #7c3aed;
        }

        .ed-guide-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .ed-guide-text {
          font-size: 0.92rem;
          line-height: 1.65;
          color: #475569;
          margin-bottom: 1.5rem;
        }

        .ed-step-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .ed-step-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .ed-step-num {
          width: 28px;
          height: 28px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #2563eb;
          font-weight: 800;
          font-size: 0.85rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ed-step-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .ed-step-text {
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        .ed-teacher-perks {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .ed-perk-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #334155;
        }

        .ed-perk-icon {
          color: #16a34a;
          font-weight: 800;
        }

        .ed-guide-action {
          padding-top: 0.5rem;
        }


        /* ══════════════ RESPONSIVE ══════════════ */
        @media (max-width: 1024px) {
          .ed-hero-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .ed-features-grid {
            grid-template-columns: 1fr;
          }
          .ed-guide-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .ed-section {
            padding: 3rem 0;
          }
          .ed-hero {
            padding: 2.5rem 0 2rem;
          }
          .ed-hero-stats {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .ed-hero-stat-divider {
            display: none;
          }
          .ed-sample-options {
            grid-template-columns: 1fr;
          }
          .ed-exams-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

import { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import styles from './page.module.css';

export const revalidate = 60; // Revalidate every minute

export const metadata: Metadata = {
  title: 'Luyện tập theo dạng toán | Đề thi thử TN THPT Môn Toán 2026',
  description:
    'Luyện tập các dạng toán THPT theo chủ đề: Hàm số, Đạo hàm, Tích phân, Hình học không gian, Mũ và Logarit, Xác suất – Thống kê. Phân loại theo độ khó NB/TH/VD/VDC.',
  openGraph: {
    title: 'Luyện tập theo dạng toán',
    description: 'Ôn luyện từng dạng bài toán THPT với hệ thống câu hỏi phong phú, phân loại theo độ khó.',
    type: 'website',
  },
};

interface DangToanhSummaryRow {
  dang_toan: string;
  tong_cau: number;
  so_nhan_biet: number;
  so_thong_hieu: number;
  so_van_dung: number;
  so_van_dung_cao: number;
}

interface ChapterGroup {
  name: string;
  colorIndex: number;
  icon: string;
  items: DangToanhSummaryRow[];
}

/** Map chapter prefix → visual settings */
const CHAPTER_COLORS: { prefix: string; icon: string; colorIndex: number }[] = [
  { prefix: 'Hàm số', icon: '📈', colorIndex: 0 },
  { prefix: 'Đạo hàm', icon: '∂', colorIndex: 1 },
  { prefix: 'Nguyên hàm', icon: '∫', colorIndex: 8 },
  { prefix: 'Tích phân', icon: '∬', colorIndex: 2 },
  { prefix: 'Hình học', icon: '📐', colorIndex: 3 },
  { prefix: 'Số phức', icon: '𝑖', colorIndex: 6 },
  { prefix: 'Mũ', icon: '🔢', colorIndex: 4 },
  { prefix: 'Logarit', icon: 'log', colorIndex: 4 },
  { prefix: 'Mũ và Logarit', icon: '🔢', colorIndex: 4 },
  { prefix: 'Xác suất', icon: '🎲', colorIndex: 5 },
  { prefix: 'Tổ hợp', icon: '🔗', colorIndex: 7 },
  { prefix: 'Giới hạn', icon: 'lim', colorIndex: 1 },
];

function getChapterMeta(dang: string): { colorIndex: number; icon: string } {
  for (const c of CHAPTER_COLORS) {
    if (dang.startsWith(c.prefix)) {
      return { colorIndex: c.colorIndex, icon: c.icon };
    }
  }
  return { colorIndex: 9, icon: '📚' };
}

function groupByChapter(rows: DangToanhSummaryRow[]): ChapterGroup[] {
  const map = new Map<string, { colorIndex: number; icon: string; items: DangToanhSummaryRow[] }>();

  for (const row of rows) {
    // Chapter = prefix before " - " separator, or first two words as fallback
    const dashIndex = row.dang_toan.indexOf(' - ');
    const chapterName =
      dashIndex !== -1 ? row.dang_toan.substring(0, dashIndex) : row.dang_toan.split(' ').slice(0, 2).join(' ');

    if (!map.has(chapterName)) {
      const { colorIndex, icon } = getChapterMeta(chapterName);
      map.set(chapterName, { colorIndex, icon, items: [] });
    }
    map.get(chapterName)!.items.push(row);
  }

  return Array.from(map.entries()).map(([name, val]) => ({
    name,
    colorIndex: val.colorIndex,
    icon: val.icon,
    items: val.items,
  }));
}

async function getDangToanhSummary(): Promise<DangToanhSummaryRow[]> {
  const { data, error } = await supabaseAdmin.from('dang_toan_summary').select('*').order('dang_toan');
  if (error) {
    console.error('[quiz/page] Error fetching dang_toan_summary:', error);
    return [];
  }
  return data || [];
}

export default async function QuizSelectionPage() {
  const rows = await getDangToanhSummary();
  const chapters = groupByChapter(rows);

  const totalDang = rows.length;
  const totalCau = rows.reduce((sum, r) => sum + (r.tong_cau || 0), 0);

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <Link href="/" className={styles.backLink}>
            ← Về trang chủ
          </Link>
          <h1 className={styles.heroTitle}>📚 Luyện tập theo dạng toán</h1>
          <p className={styles.heroSubtitle}>
            Chọn dạng bài để luyện tập chuyên sâu. Câu hỏi được phân loại theo độ khó NB / TH / VD / VDC.
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      {rows.length > 0 && (
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{chapters.length}</span>
            <span className={styles.statLabel}>Chương</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalDang}</span>
            <span className={styles.statLabel}>Dạng toán</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{totalCau.toLocaleString('vi-VN')}</span>
            <span className={styles.statLabel}>Câu hỏi</span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={styles.content}>
        {rows.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h2 className={styles.emptyTitle}>Chưa có câu hỏi được phân loại</h2>
            <p className={styles.emptyDesc}>
              Hệ thống chưa có câu hỏi nào được gán dạng toán. Vui lòng upload đề thi và chạy phân loại.
            </p>
          </div>
        ) : (
          chapters.map((chapter) => (
            <section key={chapter.name} className={styles.chapterSection}>
              <div className={`${styles.chapterHeader} ${styles['chapterColor' + chapter.colorIndex]}`}>
                <span className={styles.chapterIcon}>{chapter.icon}</span>
                <span>{chapter.name}</span>
                <span className={styles.chapterCount}>{chapter.items.length} dạng</span>
              </div>

              <div className={styles.cardGrid}>
                {chapter.items.map((row) => {
                  const total = row.tong_cau || 0;
                  const nb = row.so_nhan_biet || 0;
                  const th = row.so_thong_hieu || 0;
                  const vd = row.so_van_dung || 0;
                  const vdc = row.so_van_dung_cao || 0;
                  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

                  return (
                    <Link
                      key={row.dang_toan}
                      href={`/quiz/${encodeURIComponent(row.dang_toan)}`}
                      className={`${styles.dangCard} ${styles['borderColor' + chapter.colorIndex]}`}
                    >
                      <div className={styles.cardTop}>
                        <span className={styles.dangName}>{row.dang_toan}</span>
                        <span className={styles.totalBadge}>{total}</span>
                      </div>

                      {/* Difficulty mini-bars */}
                      <div className={styles.diffBars}>
                        {[
                          { key: 'nb', label: 'NB', val: nb },
                          { key: 'th', label: 'TH', val: th },
                          { key: 'vd', label: 'VD', val: vd },
                          { key: 'vdc', label: 'VDC', val: vdc },
                        ].map(({ key, label, val }) => (
                          <div key={key} className={styles.diffRow}>
                            <span className={styles.diffLabel}>{label}</span>
                            <div className={styles.diffBarTrack}>
                              <div
                                className={`${styles.diffBarFill} ${styles[key]}`}
                                style={{ width: `${pct(val)}%` }}
                              />
                            </div>
                            <span className={styles.diffCount}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

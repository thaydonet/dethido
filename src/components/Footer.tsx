import Link from 'next/link';

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

const FOOTER_LINKS: Record<string, FooterLink[]> = {
  'Hệ thống & Học tập': [
    { href: '/de-thi-thu-tn-thpt-mon-toan-2026', label: 'Thi thử TN THPT Toán 2026' },
    { href: 'https://booktoan.com', label: 'Tài liệu ôn thi Toán 12', external: true },
    { href: 'https://hoc.io.vn', label: 'Ngân hàng câu hỏi trắc nghiệm Toán THPT', external: true },
  ],
  'Dành cho Giáo viên': [
    { href: '/admin', label: 'Trang quản trị nội bộ' },
    { href: '/admin/', label: 'Tạo đề online & Xuất Word/PDF', external: true },
  ],
  'Hỗ trợ & Liên hệ': [
    { href: 'mailto:admin@lop12.com', label: 'Email: admin@lop12.com', external: true },
    { href: 'https://lop12.com', label: 'Website: lop12.com', external: true },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ft-root" role="contentinfo" aria-label="Footer">
      <div className="ft-inner">

        {/* Brand column */}
        <div className="ft-brand">
          <Link href="/" className="ft-logo" aria-label="Trang chủ">
            <div className="ft-logo-icon">📐</div>
            <span className="ft-logo-name">Luyện thi Toán 12</span>
          </Link>
          <p className="ft-slogan">
            “Học rõ từng bước – thi vững từng điểm.”
          </p>
          <p className="ft-desc">
            Hệ thống ôn luyện trực tuyến môn Toán bám sát định dạng cấu trúc đề thi Tốt nghiệp THPT 2026 của Bộ GD&ĐT.
          </p>
          <div className="ft-badges">
            <span className="ft-badge">✓ Chuẩn Bộ GD&ĐT 2026</span>
            <span className="ft-badge">✓ 100% Lời giải chi tiết</span>
            <span className="ft-badge">✓ Miễn phí hoàn toàn</span>
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title} className="ft-col">
            <h3 className="ft-col-title">{title}</h3>
            <ul className="ft-col-list">
              {links.map(({ href, label, external }) => (
                <li key={href}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ft-col-link"
                    >
                      {label}
                      <span className="ft-ext-icon">↗</span>
                    </a>
                  ) : (
                    <Link href={href} className="ft-col-link">
                      {label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom copyright */}
      <div className="ft-bottom">
        <div className="ft-bottom-inner">
          <p className="ft-copy">
            © {year} <strong>Luyện thi Toán 12</strong>. Bản quyền thuộc về hệ thống lop12.com - v2.0
          </p>
          <p className="ft-disclaimer">
            Tài liệu phục vụ mục đích học tập & ôn thi cá nhân, không thay thế sách giáo khoa và hướng dẫn chính thức từ Bộ Giáo dục & Đào tạo.
          </p>
        </div>
      </div>

      <style>{`
        .ft-root {
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          font-family: 'Be Vietnam Pro', sans-serif;
          color: #475569;
          margin-top: auto;
        }

        .ft-inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 3.5rem 1.25rem 2.5rem;
          display: grid;
          grid-template-columns: 2fr 1.2fr 1.2fr 1fr;
          gap: 3rem;
        }

        .ft-brand {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .ft-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .ft-logo-icon {
          width: 32px;
          height: 32px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }

        .ft-logo-name {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .ft-slogan {
          font-size: 0.95rem;
          font-weight: 600;
          color: #2563eb;
          margin: 0;
        }

        .ft-desc {
          font-size: 0.88rem;
          line-height: 1.6;
          color: #64748b;
          margin: 0;
          max-width: 360px;
        }

        .ft-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 0.5rem;
        }

        .ft-badge {
          display: inline-block;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .ft-col-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1.1rem;
          letter-spacing: -0.01em;
        }

        .ft-col-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        .ft-col-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.88rem;
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .ft-col-link:hover {
          color: #2563eb;
        }

        .ft-ext-icon {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .ft-bottom {
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
          padding: 1.5rem 1.25rem;
        }

        .ft-bottom-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.4rem;
        }

        .ft-copy {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }

        .ft-disclaimer {
          font-size: 0.78rem;
          color: #94a3b8;
          max-width: 680px;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 960px) {
          .ft-inner {
            grid-template-columns: 1fr 1fr;
            gap: 2.5rem;
          }
          .ft-brand {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 600px) {
          .ft-inner {
            grid-template-columns: 1fr;
            gap: 2rem;
            padding: 2.5rem 1.25rem 2rem;
          }
        }
      `}</style>
    </footer>
  );
}

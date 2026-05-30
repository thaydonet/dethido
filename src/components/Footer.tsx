import Link from 'next/link';

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

const FOOTER_LINKS: Record<string, FooterLink[]> = {
  'Học tập': [
    { href: '/de-thi-thu-tn-thpt-mon-toan-2026', label: 'Thi thử TN THPT Toán 2026' },
    { href: '/', label: 'Kho đề thi' },
  ],
  'Giáo viên': [
    { href: '/admin', label: 'Trang quản trị' },
    { href: 'https://thi.booktoan.com/admin/', label: 'Tạo đề thi online', external: true },
  ],
  'Liên hệ': [
    { href: 'mailto:admin@lop12.com', label: 'admin@lop12.com', external: true },
    { href: 'https://lop12.com', label: 'lop12.com', external: true },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ft-root" role="contentinfo" aria-label="Footer">
      {/* Wave divider */}
      <div className="ft-wave" aria-hidden>
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="ft-body">
        <div className="ft-inner">
          {/* Brand column */}
          <div className="ft-brand">
            <Link href="/" className="ft-logo" aria-label="Trang chủ">
              <span className="ft-logo-icon">📐</span>
              <span className="ft-logo-name">lop12<span>.com</span></span>
            </Link>
            <p className="ft-tagline">
              Hệ thống ôn luyện TN THPT Môn Toán 2026 — Đề thi chất lượng, lời giải chi tiết, miễn phí hoàn toàn.
            </p>
            <div className="ft-badges">
              <span className="ft-badge">📚 100+ Đề thi</span>
              <span className="ft-badge">✅ Lời giải chi tiết</span>
              <span className="ft-badge">🆓 Miễn phí</span>
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
                        <span className="ft-ext-icon" aria-label="liên kết ngoài">↗</span>
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

        {/* Bottom bar */}
        <div className="ft-bottom">
          <p className="ft-copy">
            © {year} <a href="https://lop12.com" target="_blank" rel="noopener noreferrer" className="ft-copy-link">lop12.com</a>.
            {' '}Bảo lưu mọi quyền.
          </p>
          <p className="ft-disclaimer">
            Nội dung chỉ mang tính chất tham khảo và hỗ trợ ôn thi — Không phải tài liệu chính thức của Bộ GD&ĐT.
          </p>
        </div>
      </div>

      <style>{`
        /* ════════════ FOOTER ════════════ */
        .ft-root {
          margin-top: auto;
          font-family: 'Inter', sans-serif;
          color: #cbd5e1;
          position: relative;
        }

        /* Wave */
        .ft-wave {
          color: #1e1b4b;
          line-height: 0;
          display: block;
          overflow: hidden;
        }
        .ft-wave svg {
          width: 100%;
          height: 60px;
          display: block;
        }

        /* Body */
        .ft-body {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%);
          padding: 3rem 1.5rem 0;
        }
        .ft-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 3rem;
          padding-bottom: 3rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        /* Brand */
        .ft-logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          margin-bottom: 1rem;
        }
        .ft-logo-icon { font-size: 1.5rem; }
        .ft-logo-name {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.5px;
        }
        .ft-logo-name span { color: #a5b4fc; }
        .ft-tagline {
          font-size: 0.9rem;
          line-height: 1.7;
          color: #a5b4fc;
          margin-bottom: 1.25rem;
          max-width: 300px;
        }
        .ft-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .ft-badge {
          display: inline-block;
          background: rgba(165, 180, 252, 0.15);
          border: 1px solid rgba(165, 180, 252, 0.2);
          color: #c7d2fe;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          white-space: nowrap;
        }

        /* Columns */
        .ft-col-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 1rem;
        }
        .ft-col-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .ft-col-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.9rem;
          color: #a5b4fc;
          text-decoration: none;
          transition: color 0.2s;
        }
        .ft-col-link:hover {
          color: white;
        }
        .ft-ext-icon {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        /* Bottom bar */
        .ft-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem 0 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          text-align: center;
        }
        .ft-copy {
          font-size: 0.85rem;
          color: #94a3b8;
        }
        .ft-copy-link {
          color: #a5b4fc;
          text-decoration: none;
          transition: color 0.2s;
        }
        .ft-copy-link:hover { color: white; }
        .ft-disclaimer {
          font-size: 0.78rem;
          color: #64748b;
          max-width: 540px;
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .ft-inner {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
          .ft-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 540px) {
          .ft-inner {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
        }
      `}</style>
    </footer>
  );
}

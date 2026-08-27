'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <>
      <header className="hn-header" role="banner">
        <div className="hn-inner">

          {/* ── Logo ── */}
          <Link href="/" className="hn-logo" aria-label="Trang chủ Luyện thi Toán 12">
            <div className="hn-logo-icon-box">
              <span className="hn-logo-icon">📐</span>
            </div>
            <div className="hn-logo-text-group">
              <span className="hn-logo-title">Luyện thi Toán 12</span>
              <span className="hn-logo-badge">TN THPT 2027</span>
            </div>
          </Link>

          {/* ── Tagline nhận diện bên phải ── */}
          <div className="hn-tagline">
            “Học rõ từng bước – thi vững từng điểm.”
          </div>

        </div>
      </header>

      <style>{`
        .hn-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .hn-inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 1.25rem;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        /* ── Logo ── */
        .hn-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .hn-logo-icon-box {
          width: 36px;
          height: 36px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .hn-logo-text-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hn-logo-title {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .hn-logo-badge {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        /* ── Tagline ── */
        .hn-tagline {
          font-size: 0.88rem;
          font-weight: 600;
          color: #2563eb;
          letter-spacing: -0.01em;
        }

        @media (max-width: 640px) {
          .hn-tagline {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

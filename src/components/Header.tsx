'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`hn-header${scrolled ? ' hn-scrolled' : ''}`} role="banner">
        <div className="hn-inner">
          {/* ── Logo ── */}
          <Link href="/" className="hn-logo" aria-label="Trang chủ">
            <span className="hn-logo-icon">📐</span>
            <span className="hn-logo-text">
              <span className="hn-logo-dot">luyện thi</span>
            </span>
            <span className="hn-logo-badge">Toán THPT 2026</span>
          </Link>

          {/* Tagline */}
          <div className="hn-tagline">
            Hệ thống ôn luyện môn Toán THPT Quốc gia
          </div>
        </div>
      </header>

      <style>{`
        /* ════════════ HEADER ════════════ */
        .hn-header {
          position: sticky;
          top: 0;
          z-index: 999;
          background: rgba(239, 246, 255, 0.85); /* Top menu top nền xanh nhẹ */
          backdrop-filter: blur(16px) saturate(1.8);
          -webkit-backdrop-filter: blur(16px) saturate(1.8);
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
          transition: box-shadow 0.3s, background 0.3s;
        }
        .hn-scrolled {
          background: rgba(239, 246, 255, 0.98);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.08);
        }
        .hn-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        /* Logo */
        .hn-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .hn-logo-icon {
          font-size: 1.5rem;
          line-height: 1;
        }
        .hn-logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: -0.5px;
        }
        .hn-logo-dot {
          color: #2563eb;
        }
        .hn-logo-badge {
          display: inline-block;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        /* Tagline */
        .hn-tagline {
          font-size: 0.9rem;
          color: #4b5563;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .hn-tagline { display: none; }
        }
      `}</style>
    </>
  );
}

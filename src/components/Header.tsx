'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/de-thi-thu-tn-thpt-mon-toan-2026', label: 'Thi thử THPT', icon: '📝' },
  { href: '/admin', label: 'Quản trị', icon: '⚙️' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className={`hn-header${scrolled ? ' hn-scrolled' : ''}`} role="banner">
        <div className="hn-inner">
          {/* ── Logo ── */}
          <Link href="/" className="hn-logo" aria-label="Trang chủ lop12.com">
            <span className="hn-logo-icon">📐</span>
            <span className="hn-logo-text">
              lop12<span className="hn-logo-dot">.com</span>
            </span>
            <span className="hn-logo-badge">Toán THPT 2026</span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hn-nav" aria-label="Điều hướng chính">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`hn-link${active ? ' hn-link-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="hn-link-icon">{icon}</span>
                  {label}
                </Link>
              );
            })}
            <a
              href="/de-thi-thu-tn-thpt-mon-toan-2026"
              className="hn-cta"
            >
              🎯 Làm đề thi ngay
            </a>
          </nav>

          {/* ── Hamburger ── */}
          <button
            id="header-menu-toggle"
            className={`hn-hamburger${menuOpen ? ' hn-hamburger-open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          id="mobile-menu"
          className={`hn-mobile${menuOpen ? ' hn-mobile-open' : ''}`}
          aria-hidden={!menuOpen}
        >
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`hn-mobile-link${active ? ' hn-mobile-link-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}
          <a
            href="/de-thi-thu-tn-thpt-mon-toan-2026"
            className="hn-mobile-cta"
          >
            🎯 Làm đề thi ngay
          </a>
        </div>
      </header>

      <style>{`
        /* ════════════ HEADER ════════════ */
        .hn-header {
          position: sticky;
          top: 0;
          z-index: 999;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px) saturate(1.8);
          -webkit-backdrop-filter: blur(16px) saturate(1.8);
          border-bottom: 1px solid rgba(99, 102, 241, 0.12);
          transition: box-shadow 0.3s, background 0.3s;
        }
        .hn-scrolled {
          background: rgba(255, 255, 255, 0.97);
          box-shadow: 0 4px 24px rgba(99, 102, 241, 0.12);
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
          color: #6366f1;
        }
        .hn-logo-badge {
          display: inline-block;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        /* Desktop nav */
        .hn-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .hn-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.45rem 0.9rem;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .hn-link:hover {
          background: #f1f5f9;
          color: #6366f1;
        }
        .hn-link-active {
          background: #eef2ff;
          color: #6366f1;
          font-weight: 600;
        }
        .hn-link-icon {
          font-size: 1rem;
        }
        .hn-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-left: 0.5rem;
          padding: 0.5rem 1.1rem;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          transition: all 0.25s;
        }
        .hn-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
          background: linear-gradient(135deg, #4f46e5 0%, #9333ea 100%);
        }

        /* Hamburger */
        .hn-hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          width: 40px;
          height: 40px;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: 8px;
          padding: 6px;
          transition: background 0.2s;
        }
        .hn-hamburger:hover {
          background: #f1f5f9;
        }
        .hn-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #475569;
          border-radius: 2px;
          transition: all 0.3s;
          transform-origin: center;
        }
        .hn-hamburger-open span:nth-child(1) {
          transform: translateY(7px) rotate(45deg);
        }
        .hn-hamburger-open span:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }
        .hn-hamburger-open span:nth-child(3) {
          transform: translateY(-7px) rotate(-45deg);
        }

        /* Mobile menu */
        .hn-mobile {
          display: none;
          flex-direction: column;
          gap: 4px;
          padding: 0.75rem 1.5rem 1rem;
          border-top: 1px solid #e2e8f0;
          background: rgba(255,255,255,0.98);
          animation: menuDown 0.22s ease forwards;
        }
        .hn-mobile-open {
          display: flex;
        }
        @keyframes menuDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hn-mobile-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 500;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s;
        }
        .hn-mobile-link:hover {
          background: #f1f5f9;
          color: #6366f1;
        }
        .hn-mobile-link-active {
          background: #eef2ff;
          color: #6366f1;
          font-weight: 600;
        }
        .hn-mobile-cta {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 0.5rem;
          padding: 0.875rem;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hn-nav { display: none; }
          .hn-hamburger { display: flex; }
          .hn-logo-badge { display: none; }
        }
      `}</style>
    </>
  );
}

'use client';

import React, { useState } from 'react';
import QuestionCard from './QuestionCard';

export default function SearchUI({ initialQuestions }: { initialQuestions: any[] }) {
  const [query, setQuery] = useState('');
  const [questions, setQuestions] = useState(initialQuestions);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setQuestions(initialQuestions);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      
      if (data.data) {
        setQuestions(data.data);
      } else {
        console.error('Search error:', data.error);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập nội dung cần tìm kiếm bằng AI (ví dụ: tìm bài tập về logarit...)"
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '1rem',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
        >
          {loading ? 'Đang phân tích AI...' : 'Tìm kiếm Vector'}
        </button>
      </form>

      {hasSearched && (
        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          {questions.length > 0 ? (
            <span>Tìm thấy <strong>{questions.length}</strong> kết quả tương đồng nhất.</span>
          ) : (
            <span>Không tìm thấy kết quả nào phù hợp.</span>
          )}
        </div>
      )}

      {!questions || questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
            Chưa có câu hỏi nào.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

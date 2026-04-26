'use client';

import React from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

interface QuestionProps {
  question: {
    id: string;
    de_id: string;
    so_cau: number;
    phan: string;
    content: string;
    options: Record<string, string>;
    answer?: string;
    image_url?: string;
    metadata?: any;
  };
}

// Hàm render nội dung có chứa LaTeX (cả inline $...$ và block $$...$$)
const renderLatexContent = (text: string) => {
  if (!text) return null;
  
  // Tách văn bản dựa trên các block $$...$$ hoặc inline $...$
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2);
      return <BlockMath key={index} math={math} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return <InlineMath key={index} math={math} />;
    }
    // Render text bình thường
    return <span key={index}>{part}</span>;
  });
};

export default function QuestionCard({ question }: QuestionProps) {
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Dễ': return <span className="badge badge-success">Dễ</span>;
      case 'Trung bình': return <span className="badge badge-warning">Trung bình</span>;
      case 'Khó': return <span className="badge badge-danger">Khó</span>;
      default: return null;
    }
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="card question-item">
      <div className="question-header">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Câu {question.so_cau} (Phần {question.phan})</h3>
          <span className="badge badge-primary">{question.de_id}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {question.metadata?.grade && <span className="badge" style={{ background: 'var(--border-color)' }}>{question.metadata.grade}</span>}
          {question.metadata?.difficulty && getDifficultyBadge(question.metadata.difficulty)}
        </div>
      </div>
      
      <div className="question-content" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
        {renderLatexContent(question.content)}
      </div>

      {question.image_url && (
        <div style={{ marginBottom: '1.5rem' }}>
          <img 
            src={question.image_url} 
            alt={`Hình ảnh câu ${question.so_cau}`} 
            className="math-image"
          />
        </div>
      )}

      {question.options && Object.keys(question.options).length > 0 ? (
        <div className="options-list">
          {optionLabels.map((label) => {
            const optionContent = question.options[label];
            if (!optionContent) return null;
            
            const isCorrect = question.answer && question.answer.split(',').includes(label);
            
            return (
              <div 
                key={label} 
                className="option-item"
                style={isCorrect ? { borderColor: 'var(--success)', background: 'var(--success-light)' } : {}}
              >
                <div className="option-label" style={isCorrect ? { background: 'var(--success)', color: 'white', borderColor: 'var(--success)' } : {}}>
                  {label}
                </div>
                <div>{renderLatexContent(optionContent)}</div>
              </div>
            );
          })}
        </div>
      ) : question.answer && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--success-light)', color: 'var(--success)', borderRadius: '8px', border: '1px solid var(--success)', fontWeight: 'bold' }}>
          Đáp án đúng: {question.answer}
        </div>
      )}

      {question.metadata?.loi_giai && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Lời giải chi tiết:</h4>
          <div style={{ fontSize: '1rem', lineHeight: '1.6' }}>
            {renderLatexContent(question.metadata.loi_giai)}
          </div>
        </div>
      )}

      {question.metadata?.chapter && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <strong>Chủ đề:</strong> {question.metadata.chapter}
          {question.metadata.concept && <span> &bull; <strong>Khái niệm:</strong> {question.metadata.concept}</span>}
        </div>
      )}
    </div>
  );
}

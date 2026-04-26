import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * Render nội dung có chứa LaTeX
 * Hỗ trợ:
 * - Inline: $...$
 * - Block: $$...$$
 * - HTML tags
 */
export function renderLatexContent(text: string): React.ReactNode {
  if (!text) return null;

  // Split by block math ($$...$$) and inline math ($...$)
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g);

  return parts.map((part, index) => {
    // Block math: $$...$$
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const math = part.slice(2, -2).trim();
      return <BlockMath key={index} math={math} />;
    }
    
    // Inline math: $...$
    if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1).trim();
      return <InlineMath key={index} math={math} />;
    }

    // Regular text with HTML
    return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
  });
}

/**
 * Component wrapper để render LaTeX content
 */
interface LatexContentProps {
  content: string;
  className?: string;
}

export function LatexContent({ content, className }: LatexContentProps) {
  return (
    <div className={className}>
      {renderLatexContent(content)}
    </div>
  );
}

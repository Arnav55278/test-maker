import React from 'react';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Safely parses and renders a string that may contain LaTeX expressions:
 * - Block expressions: $$...$$ or \[...\]
 * - Inline expressions: $...$ or \(...\)
 * - Normal text
 */
export const LatexRenderer: React.FC<LatexRendererProps> = ({ content, className = '', inline = false }) => {
  if (!content) return null;

  // Split content by LaTeX delimiters:
  // 1. $$ ... $$
  // 2. \[ ... \]
  // 3. \( ... \)
  // 4. $ ... $
  const renderTokens = () => {
    // Regex that captures:
    // 1: $$...$$
    // 2: \[...\]
    // 3: \(...\)
    // 4: $...$
    const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$[^$\n]+\$)/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      let math = '';
      let isDisplayMode = false;

      if (part.startsWith('$$') && part.endsWith('$$') && part.length >= 4) {
        math = part.slice(2, -2);
        isDisplayMode = true;
      } else if (part.startsWith('\\[') && part.endsWith('\\]') && part.length >= 4) {
        math = part.slice(2, -2);
        isDisplayMode = true;
      } else if (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4) {
        math = part.slice(2, -2);
        isDisplayMode = false;
      } else if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        math = part.slice(1, -1);
        isDisplayMode = false;
      }

      if (math !== '') {
        try {
          const html = katex.renderToString(math, {
            displayMode: isDisplayMode,
            throwOnError: false,
            output: 'html',
          });
          return (
            <span
              key={index}
              className={isDisplayMode ? 'block my-2 overflow-x-auto py-1' : 'inline-block px-0.5'}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code key={index} className="text-red-500 font-mono text-sm px-1 bg-red-50 rounded">
              {part}
            </code>
          );
        }
      }

      // If text contains newlines, render with line breaks
      if (part.includes('\n')) {
        const lines = part.split('\n');
        return (
          <span key={index}>
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {line}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const Component = inline ? 'span' : 'div';

  return <Component className={`latex-content leading-relaxed ${className}`}>{renderTokens()}</Component>;
};

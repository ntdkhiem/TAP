'use client';

import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
}

export function MathText({ text }: MathTextProps) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          try {
            const html = katex.renderToString(math, {
              throwOnError: false,
              displayMode: true,
            });
            return (
              <span 
                key={index} 
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            );
          } catch {
            return <span key={index} className="text-red-500">{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          try {
            const html = katex.renderToString(math, {
              throwOnError: false,
              displayMode: false,
            });
            return (
              <span 
                key={index} 
                dangerouslySetInnerHTML={{ __html: html }} 
              />
            );
          } catch {
            return <span key={index} className="text-red-500">{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

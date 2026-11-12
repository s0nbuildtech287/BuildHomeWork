import React, { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

interface TextSegment {
  kind: 'text' | 'inline' | 'block';
  content: string;
}

function splitMathSegments(input: string): TextSegment[] {
  if (!input || !input.includes('$')) {
    return [{ kind: 'text', content: input || '' }];
  }

  const segments: TextSegment[] = [];
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', content: input.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ kind: 'block', content: match[1] });
    } else if (match[2] !== undefined) {
      segments.push({ kind: 'inline', content: match[2] });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({ kind: 'text', content: input.slice(lastIndex) });
  }

  return segments;
}

function renderKatexHtml(expr: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(expr.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return null;
  }
}

export const MathText: React.FC<MathTextProps> = ({ text, className }) => {
  const segments = useMemo(() => splitMathSegments(text), [text]);

  if (segments.length === 1 && segments[0].kind === 'text') {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, idx) => {
        if (seg.kind === 'text') {
          return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
        }
        const html = renderKatexHtml(seg.content, seg.kind === 'block');
        if (!html) {
          return (
            <React.Fragment key={idx}>
              {seg.kind === 'block' ? `$$${seg.content}$$` : `$${seg.content}$`}
            </React.Fragment>
          );
        }
        if (seg.kind === 'block') {
          return (
            <span
              key={idx}
              className="my-1.5 block overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return (
          <span
            key={idx}
            className="inline-block align-middle"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
};


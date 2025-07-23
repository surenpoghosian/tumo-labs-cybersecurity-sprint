/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface Props {
  content: string;
  className?: string;
}

export default function Markdown({ content, className }: Props) {
  return (
    <ReactMarkdown
      // Cast to any to avoid TS version conflicts
      remarkPlugins={[remarkGfm as any]}
      rehypePlugins={[rehypeSanitize as any]}
      className={className}
      components={{
        h1: (props) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
        h2: (props) => <h2 className="text-xl font-semibold mt-4 mb-2" {...props} />,
        h3: (props) => <h3 className="text-lg font-semibold mt-3 mb-1" {...props} />,
        p: (props) => <p className="my-2" {...props} />,
        li: (props) => <li className="ml-4 list-disc" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
} 
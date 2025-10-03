import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            // Open links in new tab and add rel for security
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          img: ({ node, ...props }) => (
            // Ensure images are responsive
            // eslint-disable-next-line @next/next/no-img-element
            <img {...props} className="max-w-full h-auto rounded" />
          ),
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (inline) {
              return (
                <code className="rounded bg-muted px-1 py-0.5 text-sm" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="rounded-md bg-muted p-3 overflow-auto">
                <code className={match ? `language-${match[1]}` : ''} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote {...props} className="border-l-4 pl-4 italic text-muted-foreground" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

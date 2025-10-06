"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className = "" }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={`prose prose-invert max-w-none ${className}`}
      components={{
        // Customizar headers para usar tamanhos apropriados
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2">{children}</h3>,
        // Links com estilo consistente
        a: ({ href, children }) => (
          <a href={href} className="text-primary hover:text-primary/90 underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        // Listas com espaçamento apropriado
        ul: ({ children }) => <ul className="list-disc pl-6 my-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 my-2 space-y-1">{children}</ol>,
        // Blocos de código com realce
        code: ({ children }) => (
          <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-muted text-primary font-mono text-sm">{children}</code>
        ),
        // Blocos de código multi-linha
        pre: ({ children }) => (
          <pre className="p-4 rounded-lg bg-muted overflow-x-auto my-4">
            {children}
          </pre>
        ),
        // Parágrafos com espaçamento adequado
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        // Citações estilizadas
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-4 italic my-4">{children}</blockquote>
        ),
        // Tabelas com estilo consistente
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full divide-y divide-border">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="px-4 py-2 bg-muted font-medium">{children}</th>,
        td: ({ children }) => <td className="px-4 py-2 border-t border-border">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

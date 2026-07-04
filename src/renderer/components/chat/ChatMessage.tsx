import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ChatMessage as ChatMessageType } from '../../../preload/index'

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
  onInsertToDoc?: (content: string) => void
  onInsertConversation?: (messages: Array<{role: string; content: string}>) => void
  allMessages?: Array<{role: string; content: string}>
}

interface CodeProps {
  className?: string
  children?: React.ReactNode
}

function CodeBlock({ className, children }: CodeProps) {
  const match = /language-(\w+)/.exec(className || '')
  const code = String(children).replace(/\n$/, '')
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  if (match) {
    return (
      <SyntaxHighlighter
        style={isDark ? oneDark : oneLight}
        language={match[1]}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 6, fontSize: 13 }}
      >
        {code}
      </SyntaxHighlighter>
    )
  }

  return (
    <code className={className} style={{
      background: 'rgba(0,0,0,0.06)',
      padding: '2px 6px',
      borderRadius: 3,
      fontSize: '0.9em'
    }}>
      {children}
    </code>
  )
}

export function ChatMessage({ message, isStreaming, onInsertToDoc, onInsertConversation, allMessages }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className={`chat-bubble ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? (
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                return <CodeBlock className={className}>{children}</CodeBlock>
              },
              p({ children }) {
                return <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>{children}</p>
              },
              ul({ children }) {
                return <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>
              },
              ol({ children }) {
                return <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>
              },
              li({ children }) {
                return <li style={{ margin: '2px 0' }}>{children}</li>
              },
              blockquote({ children }) {
                return (
                  <blockquote style={{
                    margin: '8px 0',
                    padding: '4px 12px',
                    borderLeft: '3px solid var(--primary-color)',
                    background: 'rgba(0,0,0,0.03)',
                    borderRadius: '0 4px 4px 0'
                  }}>
                    {children}
                  </blockquote>
                )
              },
              a({ children, href }) {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--primary-color)' }}>
                    {children}
                  </a>
                )
              },
              h1({ children }) { return <h1 style={{ fontSize: 18, margin: '12px 0 6px' }}>{children}</h1> },
              h2({ children }) { return <h2 style={{ fontSize: 16, margin: '10px 0 5px' }}>{children}</h2> },
              h3({ children }) { return <h3 style={{ fontSize: 15, margin: '8px 0 4px' }}>{children}</h3> },
              hr() { return <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} /> },
              table({ children }) {
                return (
                  <div style={{ overflowX: 'auto', margin: '8px 0' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
                      {children}
                    </table>
                  </div>
                )
              },
              th({ children }) {
                return <th style={{ border: '1px solid rgba(0,0,0,0.15)', padding: '6px 10px', background: 'rgba(0,0,0,0.03)', fontWeight: 600 }}>{children}</th>
              },
              td({ children }) {
                return <td style={{ border: '1px solid rgba(0,0,0,0.15)', padding: '4px 10px' }}>{children}</td>
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
        {isStreaming && (
          <span className="chat-streaming-cursor" />
        )}
      </div>

      {/* Action buttons for assistant messages */}
      {!isUser && !isStreaming && message.content && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4, paddingLeft: 0 }}>
          {onInsertToDoc && (
            <button
              onClick={() => onInsertToDoc(message.content)}
              title="Insert this response into the current document"
              style={{
                padding: '2px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: 'var(--bg-color)',
                cursor: 'pointer',
                fontSize: 11,
                color: '#666',
                fontFamily: 'inherit'
              }}
            >
              + Insert to Doc
            </button>
          )}
          {onInsertConversation && allMessages && (
            <button
              onClick={() => onInsertConversation(allMessages)}
              title="Insert full conversation as a block into the document"
              style={{
                padding: '2px 8px',
                border: '1px solid #ccc',
                borderRadius: 4,
                background: 'var(--bg-color)',
                cursor: 'pointer',
                fontSize: 11,
                color: '#666',
                fontFamily: 'inherit'
              }}
            >
              + Insert Full Chat
            </button>
          )}
        </div>
      )}
    </div>
  )
}

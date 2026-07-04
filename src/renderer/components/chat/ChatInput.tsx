import React, { useState, useRef, useCallback, useEffect } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  onInsertContext: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, onInsertContext, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }, [])

  useEffect(() => {
    autoResize()
  }, [input, autoResize])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input, isStreaming, disabled, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Escape to stop or blur
    if (e.key === 'Escape') {
      if (isStreaming) {
        e.preventDefault()
        onStop()
      } else {
        textareaRef.current?.blur()
      }
    }
  }, [handleSend, isStreaming, onStop])

  const handleInsertContext = useCallback(() => {
    onInsertContext()
    // Focus back on textarea after inserting
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [onInsertContext])

  return (
    <div className="chat-input-area">
      <button
        className="chat-input-context-btn"
        onClick={handleInsertContext}
        disabled={disabled}
        title="Insert editor selection"
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          borderRadius: 4,
          background: 'var(--bg-color)',
          cursor: 'pointer',
          fontSize: 12,
          color: 'var(--text-color)',
          fontFamily: 'inherit',
          flexShrink: 0,
          marginBottom: 4
        }}
      >
        + Context
      </button>
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
        disabled={disabled}
        style={{ flex: 1 }}
        rows={1}
      />
      {isStreaming ? (
        <button
          className="chat-input-stop-btn"
          onClick={onStop}
          style={{
            padding: '6px 14px',
            border: '1px solid #e74c3c',
            borderRadius: 4,
            background: '#e74c3c',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'inherit',
            fontWeight: 500,
            flexShrink: 0
          }}
        >
          Stop
        </button>
      ) : (
        <button
          className="chat-input-send-btn"
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          style={{
            padding: '6px 14px',
            border: '1px solid var(--primary-btn-border-color)',
            borderRadius: 4,
            background: input.trim() ? 'var(--primary-color)' : '#ccc',
            color: '#fff',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontFamily: 'inherit',
            fontWeight: 500,
            flexShrink: 0,
            opacity: input.trim() ? 1 : 0.6
          }}
        >
          Send
        </button>
      )}
    </div>
  )
}

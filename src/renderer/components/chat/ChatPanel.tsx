import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useChatContext } from '../../contexts/ChatContext'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ProviderConfigDialog } from './ProviderConfigDialog'
import { useEditor } from '../../contexts/EditorContext'

export function ChatPanel() {
  const ctx = useChatContext()
  const editorCtx = useEditor()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [showProviderDialog, setShowProviderDialog] = useState(false)
  const [showConvMenu, setShowConvMenu] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ctx.messages, ctx.streamingContent])

  // Resize handler
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = ctx.panelHeight

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY
      const newHeight = Math.max(100, Math.min(600, startHeight + delta))
      ctx.setPanelHeight(newHeight)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [ctx.panelHeight, ctx.setPanelHeight])

  // Insert a message into the editor document
  const handleInsertToDoc = useCallback((content: string) => {
    const editorHandle = editorCtx.editorRef.current
    if (editorHandle) {
      editorHandle.insertAtCursor('\n\n' + content + '\n')
    }
  }, [editorCtx.editorRef])

  // Insert full conversation as an ai-conversation block
  const handleInsertConversation = useCallback((messages: Array<{role: string; content: string}>) => {
    const editorHandle = editorCtx.editorRef.current
    if (editorHandle) {
      editorHandle.insertAiConversation(messages)
    }
  }, [editorCtx.editorRef])

  // Handle insert context from editor
  const handleInsertContext = useCallback(() => {
    const editorHandle = editorCtx.editorRef.current
    if (editorHandle) {
      const selected = editorHandle.getSelectedText()
      if (selected) {
        ctx.sendMessage('Regarding the following content:\n\n```\n' + selected + '\n```\n')
      } else {
        // Send the full document as context
        const fullContent = editorHandle.getContent()
        if (fullContent) {
          ctx.sendMessage('Regarding this document:\n\n```markdown\n' + fullContent.slice(0, 4000) + '\n```\n')
        }
      }
    }
  }, [editorCtx.editorRef, ctx])

  const handleSwitchConversation = useCallback((id: string) => {
    ctx.switchConversation(id)
    setShowConvMenu(null)
  }, [ctx])

  if (!ctx.isOpen) return null

  return (
    <div
      className={`chat-panel ${!ctx.isOpen ? 'collapsed' : ''}`}
      ref={panelRef}
      style={{ height: ctx.panelHeight, flexShrink: 0 }}
    >
      {/* Resize handle */}
      <div
        className="chat-panel-resize"
        onMouseDown={handleResizeStart}
      />

      {/* Header */}
      <div className="chat-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 13, flexShrink: 0 }}>AI Chat</span>
          <select
            value={ctx.activeConversationId || ''}
            onChange={(e) => {
              const val = e.target.value
              if (val === '__new__') {
                ctx.newConversation()
              } else if (val) {
                handleSwitchConversation(val)
              }
            }}
            style={{
              flex: 1,
              maxWidth: 200,
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #ccc',
              fontSize: 12,
              fontFamily: 'inherit',
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              cursor: 'pointer'
            }}
          >
            {ctx.activeConversationId && (
              <option value={ctx.activeConversationId}>
                {ctx.conversations.find(c => c.id === ctx.activeConversationId)?.title?.slice(0, 40) || 'Current'}
              </option>
            )}
            {!ctx.activeConversationId && (
              <option value="">New conversation</option>
            )}
            {ctx.conversations
              .filter(c => c.id !== ctx.activeConversationId)
              .map(c => (
                <option key={c.id} value={c.id}>
                  {c.title?.slice(0, 40) || 'Untitled'}
                </option>
              ))
            }
            {ctx.conversations.length > 0 && (
              <option value="__new__">--- New conversation ---</option>
            )}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => ctx.newConversation()}
            title="New conversation"
            style={{
              padding: '2px 8px',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: 'var(--bg-color)',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-color)'
            }}
          >
            +
          </button>
          <button
            onClick={() => setShowProviderDialog(true)}
            title="Configure AI providers"
            style={{
              padding: '2px 8px',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: 'var(--bg-color)',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--text-color)'
            }}
          >
            Settings
          </button>
          <button
            onClick={ctx.togglePanel}
            title="Close chat panel"
            style={{
              padding: '2px 8px',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: 'var(--bg-color)',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-color)'
            }}
          >
            x
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {ctx.messages.length === 0 && !ctx.isStreaming && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
            fontSize: 14
          }}>
            <p>Start a conversation with the AI assistant.</p>
          </div>
        )}

        {ctx.messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onInsertToDoc={handleInsertToDoc}
            onInsertConversation={handleInsertConversation}
            allMessages={ctx.messages}
          />
        ))}

        {/* Streaming message */}
        {ctx.isStreaming && ctx.streamingContent && (
          <ChatMessage
            key="streaming"
            message={{ id: 'streaming', role: 'assistant', content: ctx.streamingContent }}
            isStreaming
            onInsertToDoc={handleInsertToDoc}
            onInsertConversation={handleInsertConversation}
            allMessages={ctx.messages}
          />
        )}

        {/* Error display */}
        {ctx.error && (
          <div className="chat-message">
            <div className="chat-bubble" style={{
              background: '#ffeaea',
              color: '#c0392b',
              border: '1px solid #f5c6cb',
              width: '100%'
            }}>
              <p style={{ margin: 0, fontSize: 13, whiteSpace: 'pre-wrap' }}>
                {ctx.error}
              </p>
              <button
                onClick={ctx.clearError}
                style={{
                  marginTop: 8,
                  padding: '2px 10px',
                  border: '1px solid #c0392b',
                  borderRadius: 4,
                  background: 'transparent',
                  color: '#c0392b',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'inherit'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput
        onSend={ctx.sendMessage}
        onStop={ctx.stopStreaming}
        onInsertContext={() => {
          // Get editor selection and paste it into input
          const editorHandle = editorCtx.editorRef.current
          if (editorHandle) {
            const content = editorHandle.getContent()
            // Focus the textarea via the ChatInput - we'll append the current selection
            // For simplicity, we send selected text directly
            if (content) {
              ctx.sendMessage(content)
            }
          }
        }}
        isStreaming={ctx.isStreaming}
      />

      {/* Provider Config Dialog */}
      {showProviderDialog && (
        <ProviderConfigDialog onClose={() => setShowProviderDialog(false)} />
      )}
    </div>
  )
}

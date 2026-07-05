import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { undo, redo } from '@codemirror/commands'
import { buildExtensions, buildSourceExtensions } from './extensions'
import { useEditor, EditorHandle } from '../../contexts/EditorContext'
import { useTheme } from '../../contexts/ThemeContext'

interface EditorProps {
  sourceMode?: boolean
}

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor({ sourceMode = false }, ref) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const editorCtx = useEditor()
  const { content, setContent, setIsModified, setShowSearch, preferences, setCursorPos, typewriterMode } = editorCtx
  const onCursorMove = useCallback((line: number, col: number) => {
    setCursorPos({ line, col })
  }, [setCursorPos])
  const { theme, themeCss } = useTheme()
  const isDark = theme.includes('dark') || theme.includes('night') || theme.includes('black')

  // Build and inject theme CSS
  useEffect(() => {
    let styleEl = document.getElementById('typora-theme-style')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'typora-theme-style'
      document.head.appendChild(styleEl)
    }
    if (themeCss) {
      styleEl.textContent = themeCss
    }
  }, [themeCss])

  // Create editor view — only on mount or sourceMode toggle (avoid rebuilds)
  useEffect(() => {
    if (!containerRef.current) return

    const extensions = sourceMode
      ? buildSourceExtensions(
          (newContent) => {
            setContent(newContent)
            setIsModified(true)
          },
          isDark,
          preferences
        )
      : buildExtensions(
          (newContent) => {
            setContent(newContent)
            setIsModified(true)
          },
          isDark,
          preferences,
          onCursorMove
        )

    const view = new EditorView({
      state: EditorState.create({
        doc: content,
        extensions
      }),
      parent: containerRef.current
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [sourceMode]) // Only rebuild on source mode toggle

  // Update content efficiently — only when it differs from current
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const currentContent = view.state.doc.toString()
    if (content !== currentContent) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
        scrollIntoView: false
      })
    }
  }, [content])

  // Update theme CSS class on container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setAttribute('data-theme', theme)
    }
  }, [theme])

  // Expose imperative API
  const getView = useCallback(() => viewRef.current, [])

  useImperativeHandle(ref, () => ({
    focus: () => {
      viewRef.current?.focus()
    },
    getContent: () => {
      return viewRef.current?.state.doc.toString() ?? ''
    },
    setContent: (c: string) => {
      const view = viewRef.current
      if (!view) return
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: c }
      })
    },
    insertText: (text: string) => {
      const view = viewRef.current
      if (!view) return
      view.dispatch(view.state.replaceSelection(text))
      view.focus()
    },
    insertAtCursor: (text: string) => {
      const view = viewRef.current
      if (!view) return
      const pos = view.state.selection.main.head
      view.dispatch({
        changes: { from: pos, insert: text },
        selection: { anchor: pos + text.length }
      })
      view.focus()
    },
    getSelectedText: () => {
      const view = viewRef.current
      if (!view) return ''
      const { from, to } = view.state.selection.main
      return view.state.sliceDoc(from, to)
    },
    insertAiPromptBlock: () => {
      const view = viewRef.current
      if (!view) return
      const pos = view.state.selection.main.head
      const block = '\n:::ai\n\n:::\n'
      view.dispatch({
        changes: { from: pos, insert: block },
        selection: { anchor: pos + 6 }
      })
      view.focus()
    },
    executeAiBlock: async () => {
      const view = viewRef.current
      if (!view) return
      const doc = view.state.doc
      const cursor = view.state.selection.main.head

      // Find the current :::ai block
      const text = doc.toString()
      const aiBlockRegex = /:::ai\n([\s\S]*?):::/g
      let match
      let promptContent = ''
      let blockEnd = 0

      while ((match = aiBlockRegex.exec(text)) !== null) {
        const blockStart = match.index
        blockEnd = match.index + match[0].length
        // Check if cursor is inside this block (including its boundaries)
        if (cursor >= blockStart && cursor <= blockEnd) {
          promptContent = match[1].trim()
          break
        }
      }

      if (!promptContent) {
        console.warn('No :::ai block found at cursor position')
        return
      }

      // Check if response already exists right after this block
      const afterBlock = text.slice(blockEnd)
      const existingResponse = afterBlock.match(/^(\s*):::ai-response\n([\s\S]*?):::/)
      let responseStart: number | null = null
      let responseMarkerEnd = 0

      if (existingResponse) {
        // Remove existing response to replace it
        const leadingWhitespace = existingResponse[1]
        responseStart = blockEnd + leadingWhitespace.length
        responseMarkerEnd = blockEnd + existingResponse[0].length
      }

      // Create/update response block with loading state
      const responseHeader = '\n\n:::ai-response\n'
      const loadingText = '...thinking...\n'
      const responseFooter = ':::\n'

      if (responseStart !== null && responseMarkerEnd > 0) {
        // Replace existing response with loading
        view.dispatch({
          changes: {
            from: responseStart,
            to: responseMarkerEnd,
            insert: responseHeader + loadingText + responseFooter
          }
        })
      } else {
        // Insert new response block
        view.dispatch({
          changes: { from: blockEnd, insert: responseHeader + loadingText + responseFooter }
        })
      }

      // Scroll to see the response
      setTimeout(() => view.dispatch({ effects: [] }), 50)

      // Send to AI with streaming
      try {
        const providers = await window.api.aiGetProviders?.() ?? { success: false, providers: [] }
        const activeProvider = (providers as any)?.providers?.find((p: any) => p.isActive)
        if (!activeProvider) throw new Error('No active AI provider configured')

        const convId = 'inline-' + Date.now()
        await window.api.aiChatSend(convId, promptContent)

        // Accumulate streaming response
        let accumulated = ''
        const unsubChunk = window.api.onAiChunk((data: any) => {
          if (data.conversationId === convId) {
            accumulated += data.chunk
            // Update the response block in real-time
            updateResponseBlock(viewRef.current, blockEnd, accumulated)
          }
        })

        const done = await new Promise<void>((resolve) => {
          const unsubDone = window.api.onAiDone((data: any) => {
            if (data.conversationId === convId) {
              unsubDone()
              resolve()
            }
          })
          const unsubErr = window.api.onAiError((data: any) => {
            if (data.conversationId === convId) {
              unsubDone()
              unsubErr()
              accumulated = '**Error:** ' + data.error
              resolve()
            }
          })
        })

        unsubChunk()
        // Final update with complete response
        updateResponseBlock(viewRef.current, blockEnd, accumulated)

      } catch (err: any) {
        const errText = '**Error:** ' + (err.message || 'Unknown error')
        updateResponseBlock(viewRef.current, blockEnd, errText)
      }
    },
    insertAiConversation: (messages: Array<{ role: string; content: string }>) => {
      const view = viewRef.current
      if (!view) return
      const pos = view.state.selection.main.head
      const now = new Date().toISOString()
      const provider = 'claude'

      let block = '\n\n```ai-conversation\n'
      block += `---\nprovider: ${provider}\ncreated: ${now}\nmessages: ${messages.length}\n---\n\n`
      messages.forEach(m => {
        const roleLabel = m.role === 'user' ? '## User' : '## Assistant'
        block += `${roleLabel}\n\n${m.content}\n\n`
      })
      block += '```\n'

      view.dispatch({
        changes: { from: pos, insert: block },
        selection: { anchor: pos + block.length }
      })
      view.focus()
    },
    toggleBold: () => wrapSelection(viewRef.current, '**', '**'),
    toggleItalic: () => wrapSelection(viewRef.current, '*', '*'),
    toggleStrikethrough: () => wrapSelection(viewRef.current, '~~', '~~'),
    toggleCode: () => wrapSelection(viewRef.current, '`', '`'),
    setHeading: (level: number) => {
      const view = viewRef.current
      if (!view) return
      const { from, to } = view.state.selection.main
      const line = view.state.doc.lineAt(from)
      const prefix = '#'.repeat(level) + ' '
      view.dispatch({
        changes: { from: line.from, to: line.to, insert: prefix + line.text.replace(/^#+\s*/, '') },
        selection: { anchor: from + prefix.length }
      })
      view.focus()
    },
    toggleBulletList: () => toggleLinePrefix(viewRef.current, '- '),
    toggleOrderedList: () => toggleLinePrefix(viewRef.current, '1. '),
    toggleTaskList: () => toggleLinePrefix(viewRef.current, '- [ ] '),
    toggleBlockquote: () => toggleLinePrefix(viewRef.current, '> '),
    insertCodeBlock: () => insertBlock(viewRef.current, '```\n', '\n```'),
    insertHorizontalRule: () => {
      const view = viewRef.current
      if (!view) return
      view.dispatch(view.state.replaceSelection('\n---\n'))
      view.focus()
    },
    insertLink: () => {
      const view = viewRef.current
      if (!view) return
      const sel = view.state.selection.main
      const text = view.state.sliceDoc(sel.from, sel.to) || 'link text'
      view.dispatch(view.state.replaceSelection(`[${text}](url)`))
      view.focus()
    },
    insertImage: () => {
      const view = viewRef.current
      if (!view) return
      view.dispatch(view.state.replaceSelection('![alt](url)'))
      view.focus()
    },
    insertToc: () => {
      const view = viewRef.current
      if (!view) return
      view.dispatch(view.state.replaceSelection('\n[toc]\n'))
      view.focus()
    },
    insertFrontMatter: () => {
      const view = viewRef.current
      if (!view) return
      const fm = '---\ntitle: \ndate: ' + new Date().toISOString().slice(0, 10) + '\ntags: []\n---\n'
      view.dispatch({ changes: { from: 0, insert: fm } })
      view.focus()
    },
    undo: () => { const v = viewRef.current; if (v) undo(v) },
    redo: () => { const v = viewRef.current; if (v) redo(v) },
    find: () => { setShowSearch(true) },
    findNext: () => { setShowSearch(true) },
    findPrevious: () => { setShowSearch(true) },
    replace: () => { setShowSearch(true) },
    replaceAll: () => { setShowSearch(true) }
  }), [setShowSearch])

  return (
    <div className={`editor-wrapper ${typewriterMode ? 'typewriter-mode' : ''}`}>
      <div
        id="write"
        className={`editor-container ${typewriterMode ? 'typewriter-mode' : ''}`}
        ref={containerRef}
        data-theme={theme}
      />
    </div>
  )
})

// Helper functions
function wrapSelection(view: EditorView | null, before: string, after: string): void {
  if (!view) return
  const { from, to } = view.state.selection.main
  const selected = view.state.sliceDoc(from, to) || 'text'
  view.dispatch(view.state.replaceSelection(before + selected + after))
  view.focus()
}

function toggleLinePrefix(view: EditorView | null, prefix: string): void {
  if (!view) return
  const { from } = view.state.selection.main
  const line = view.state.doc.lineAt(from)
  if (line.text.startsWith(prefix)) {
    view.dispatch({
      changes: { from: line.from, to: line.from + prefix.length }
    })
  } else {
    view.dispatch({
      changes: { from: line.from, insert: prefix }
    })
  }
  view.focus()
}

function insertBlock(view: EditorView | null, before: string, after: string): void {
  if (!view) return
  const { from } = view.state.selection.main
  const line = view.state.doc.lineAt(from)
  view.dispatch({
    changes: { from: line.to + 1, insert: before + after }
  })
  view.focus()
}

function updateResponseBlock(view: EditorView | null, blockEnd: number, content: string): void {
  if (!view) return
  const text = view.state.doc.toString()
  const afterBlock = text.slice(blockEnd)

  // Find existing :::ai-response block pattern
  const respRegex = /^(\s*):::ai-response\n([\s\S]*?):::\s*/
  const match = respRegex.exec(afterBlock)

  const newBlock = '\n:::ai-response\n' + (content || '(empty response)') + '\n:::\n'

  if (match) {
    // Replace existing response content
    const leadingWhitespace = match[1]
    const startOffset = blockEnd + leadingWhitespace.length
    const endOffset = blockEnd + leadingWhitespace.length + match[0].length
    view.dispatch({
      changes: { from: startOffset, to: endOffset, insert: newBlock }
    })
  } else {
    // No existing response - should not happen, but fallback
    view.dispatch({
      changes: { from: blockEnd, insert: newBlock }
    })
  }
}

export default Editor

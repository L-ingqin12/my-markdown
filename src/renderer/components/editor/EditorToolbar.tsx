import React from 'react'
import { useEditor } from '../../contexts/EditorContext'
import { useFileSystem } from '../../hooks/useFileSystem'

export function EditorToolbar() {
  const ctx = useEditor()
  const { saveFile, saveFileAs } = useFileSystem()
  const editor = ctx.editorRef.current

  const handleSave = () => {
    if (ctx.filePath) saveFile()
    else saveFileAs()
  }

  return (
    <div className="app-toolbar">
      <button onClick={() => {
        ctx.setContent(''); ctx.setFilePath(null); ctx.setFileName('Untitled'); ctx.setIsModified(false)
      }}>New</button>
      <button onClick={handleSave} title="Save (Ctrl+S)">Save</button>
      <button onClick={() => editor?.insertFrontMatter()} title="Insert YAML frontmatter (Ctrl+Shift+Y)">FM</button>
      <span className="separator" />
      <button onClick={() => editor?.undo()} title="Undo (Ctrl+Z)">&#x21A9;</button>
      <button onClick={() => editor?.redo()} title="Redo (Ctrl+Shift+Z)">&#x21AA;</button>
      <span className="separator" />
      <select defaultValue="" onChange={(e) => { const v = parseInt(e.target.value); if (v > 0) editor?.setHeading(v); e.target.value = '' }} title="Heading">
        <option value="">Normal</option>
        <option value="1">H1</option><option value="2">H2</option><option value="3">H3</option>
        <option value="4">H4</option><option value="5">H5</option><option value="6">H6</option>
      </select>
      <span className="separator" />
      <button onClick={() => editor?.toggleBold()} title="Bold"><strong>B</strong></button>
      <button onClick={() => editor?.toggleItalic()} title="Italic"><em>I</em></button>
      <button onClick={() => editor?.toggleStrikethrough()}><s>S</s></button>
      <button onClick={() => editor?.toggleCode()}>&lt;/&gt;</button>
      <span className="separator" />
      <button onClick={() => editor?.toggleBulletList()}>&bull; List</button>
      <button onClick={() => editor?.toggleOrderedList()}>1. List</button>
      <button onClick={() => editor?.toggleTaskList()}>&#x2610; Task</button>
      <span className="separator" />
      <button onClick={() => editor?.toggleBlockquote()}>&ldquo;</button>
      <button onClick={() => editor?.insertCodeBlock()}>{'{}'}</button>
      <button onClick={() => editor?.insertHorizontalRule()}>&mdash;</button>
      <span className="separator" />
      <button onClick={() => editor?.insertLink()}>Link</button>
      <button onClick={() => editor?.insertImage()}>Image</button>
      <span className="separator" />
      <button onClick={() => editor?.insertAiPromptBlock()}
        style={{ color: '#8250df', fontWeight: 600 }}
        title="Insert AI prompt block (:::ai). Execute with Ctrl+Enter.">+ AI Cell</button>
      <span className="separator" />
      <button onClick={() => ctx.setSourceMode(!ctx.sourceMode)} className={ctx.sourceMode ? 'active' : ''}>Source</button>
      <button onClick={() => ctx.setFocusMode(!ctx.focusMode)} className={ctx.focusMode ? 'active' : ''}>Focus</button>
      <span className="separator" />
      <button onClick={() => ctx.setViewMode(ctx.viewMode === 'kanban' ? 'editor' : 'kanban')} className={ctx.viewMode === 'kanban' ? 'active' : ''}>Kanban</button>
      <button onClick={() => ctx.setViewMode(ctx.viewMode === 'mindmap' ? 'editor' : 'mindmap')} className={ctx.viewMode === 'mindmap' ? 'active' : ''}>MindMap</button>
      <button onClick={() => ctx.setViewMode(ctx.viewMode === 'graph' ? 'editor' : 'graph')} className={ctx.viewMode === 'graph' ? 'active' : ''}>Graph</button>
      <span className="separator" />
      <button onClick={() => ctx.setSidebarVisible(!ctx.sidebarVisible)} className={ctx.sidebarVisible ? 'active' : ''}>Sidebar</button>
    </div>
  )
}

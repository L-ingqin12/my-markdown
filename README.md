# My Markdown

Typora-compatible Markdown editor with AI integration, knowledge graph, Excalidraw canvas, Kanban boards, and system-aware Claude CLI management.

## Features

### Core Editor
- **WYSIWYG Hybrid Preview** — Rendered markdown with source-on-focus editing (like Typora)
- **Typora Theme Compatibility** — Drop `.css` theme files into `themes/` folder
- **File Operations** — Open/Save/Auto-save with recent files
- **Export** — HTML, PDF (theme-aware), Feishu JSON, Word Document

### AI Integration (Jupyter-style)
- **Inline AI Cells** — Type `:::ai` blocks, press `Ctrl+Enter` to execute
- **Streaming Responses** — Real-time AI output directly in the document
- **Multi-Provider** — Anthropic (Claude), OpenAI (GPT), and custom endpoints
- **Document Context** — Send selected text or full document to AI
- **Conversation Blocks** — Save chat history as markdown in your documents

### Knowledge Management
- **Knowledge Graph** — d3-force visualization of document relationships via `[[wikilinks]]`
- **Mind Map** — Interactive heading hierarchy visualization (markmap)
- **Tag System** — Extract and filter by YAML frontmatter tags and inline #tags
- **Document Outline** — Sidebar with navigable heading tree

### Visual Tools
- **Excalidraw Canvas** — Embedded drawing blocks (` ```excalidraw `) with full editor
- **Kanban Boards** — Obsidian-compatible drag-and-drop boards (dnd-kit)
- **Source/Preview Toggle** — Switch between rendered view and raw markdown
- **Focus & Typewriter Modes** — Distraction-free writing

### Image Hosting
- **PicGo Integration** — Upload images to SM.MS, GitHub, Imgur, Qiniu, Tencent COS, Aliyun OSS
- **Custom Upload Commands** — User-defined shell scripts
- **Auto-upload** — Paste or drag-and-drop images to auto-upload

### System Management
- **Resource-Aware Claude CLI** — Monitor CPU/memory to dynamically manage CLI instances
- **Conversation Queue** — Queue requests when system is under load
- **Load Indicator** — Status bar showing system capacity

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Package for distribution
npm run package
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New document |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |
| `Ctrl+B` / `Ctrl+I` | Bold / Italic |
| `Ctrl+K` | Insert link |
| `Ctrl+Shift+I` | Insert image |
| `Ctrl+Shift+Y` | Insert YAML frontmatter |
| `Ctrl+\` | Toggle source code mode |
| `Ctrl+Shift+F` | Focus mode |
| `Ctrl+Shift+T` | Typewriter mode |
| `Ctrl+Shift+L` | Toggle sidebar |
| `Ctrl+Enter` | Execute AI cell (in :::ai block) |
| `Ctrl+Shift+K` | Toggle Kanban |
| `Ctrl+0` / `Ctrl+=` / `Ctrl+-` | Zoom reset / in / out |
| `F12` | Developer tools |

### Git Integration

Git operations are available via the menu and IPC API:
- Auto-commit on save
- View file status in sidebar
- Push/pull from connected remotes

## AI Cell Format

```markdown
:::ai
Explain the time complexity of this algorithm
:::

:::ai-response
The time complexity is O(n log n) because...
:::
```

## Kanban Board Format

```markdown
---
kanban-plugin: board
---

## Backlog
- [ ] Task one
- [ ] Task two @2025-12-31 #bug

## In Progress
- [ ] Working on feature

## Done **Complete**
- [x] Completed task
```

## Architecture

```
Electron Main Process
├── File Manager (open/save/auto-save)
├── AI Handlers (Anthropic/OpenAI/Custom SDKs)
├── Image Uploader (PicGo/SM.MS/GitHub/Custom)
├── Theme Manager (CSS loader/Typora compat)
├── System Monitor + Resource Calculator
├── Claude CLI Manager
└── Export Manager (HTML/PDF/Feishu/DOC)

Electron Preload (contextBridge)
└── Typed API surface (window.api)

React Renderer
├── CodeMirror 6 Editor (hybrid WYSIWYG)
├── AI Chat Panel (streaming, multi-provider)
├── Knowledge Graph (d3-force + Canvas)
├── Mind Map (markmap-lib)
├── Excalidraw Blocks (embedded canvas)
├── Kanban Board (dnd-kit drag-and-drop)
└── Sidebar (outline/tags/graph/files)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | Electron 33 |
| UI | React 19 + TypeScript |
| Editor | CodeMirror 6 + hybrid-markdown |
| AI | @anthropic-ai/sdk, openai |
| Graphs | d3-force, markmap-lib |
| Drawing | @excalidraw/excalidraw |
| DnD | @dnd-kit/core + sortable |
| Markdown | unified + remark + rehype |
| Build | electron-vite + Vite |
| Test | Vitest |

## License

MIT

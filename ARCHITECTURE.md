# Architecture Document

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   ELECTRON MAIN PROCESS                      │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────┐ │
│  │FileManager│ │MenuMgr   │ │ImageUpload │ │AI-Handlers   │ │
│  │  open/save│ │native UI │ │ PicGo/SM   │ │ Anthropic/   │ │
│  │  recent   │ │shortcuts │ │ custom cmd │ │ OpenAI SDK   │ │
│  └───────────┘ └──────────┘ └────────────┘ └─────────────┘ │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────┐ │
│  │ThemeMgr   │ │ExportMgr │ │ClaudeMgr   │ │SystemMonitor│ │
│  │ CSS load  │ │HTML/PDF  │ │ CLI spawn  │ │ CPU/RAM/IO  │ │
│  │ var inject│ │Feishu/DOC│ │ pidusage   │ │ResourceCalc │ │
│  └───────────┘ └──────────┘ └────────────┘ └─────────────┘ │
│                          │ IPC (ipcMain.handle)              │
├──────────────────────────┼──────────────────────────────────┤
│                     PRELOAD (contextBridge)                   │
│              window.api = typed API surface                   │
├──────────────────────────────────────────────────────────────┤
│                    RENDERER PROCESS                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    REACT APP                            │  │
│  │  ┌─────────┐ ┌────────────────────────────────────┐    │  │
│  │  │Toolbar  │ │        EDITOR AREA                  │    │  │
│  │  └─────────┘ │  ┌──────────────────────────────┐   │    │  │
│  │  ┌─────────┐ │  │ CodeMirror 6                 │   │    │  │
│  │  │Sidebar  │ │  │ • hybrid-markdown WYSIWYG    │   │    │  │
│  │  │Outline  │ │  │ • Typora theme CSS compat    │   │    │  │
│  │  │Tags     │ │  │ • Excalidraw embed blocks    │   │    │  │
│  │  │Graph    │ │  │ • AI cells (:::ai blocks)    │   │    │  │
│  │  │Files    │ │  └──────────────────────────────┘   │    │  │
│  │  └─────────┘ │  ┌──────────────────────────────┐   │    │  │
│  │              │  │   AI CHAT PANEL (bottom)     │   │    │  │
│  │              │  │   Streaming + Markdown render │   │    │  │
│  │              │  └──────────────────────────────┘   │    │  │
│  │              └────────────────────────────────────┘    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ StatusBar (file, cursor, theme, system load)    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── main/                         # Electron main process
│   ├── index.ts                  # App entry, window creation
│   ├── menu.ts                   # Native application menu
│   ├── ipc-handlers.ts           # IPC message handlers
│   ├── file-manager.ts           # File open/save/recent
│   ├── image-uploader.ts         # PicGo/Custom command uploader
│   ├── theme-manager.ts          # Theme CSS loader/scanner
│   ├── export.ts                 # HTML/PDF export (theme-aware)
│   ├── export-feishu.ts          # Feishu document export
│   ├── export-doc.ts             # Word document export
│   ├── store.ts                  # electron-store persistence
│   ├── preferences.ts            # User preferences
│   ├── ai-store.ts               # Encrypted API key storage
│   ├── ai-providers.ts           # Anthropic/OpenAI/Custom providers
│   ├── ai-handlers.ts            # AI chat IPC + conversation storage
│   ├── system-monitor.ts         # System resource polling
│   ├── resource-calculator.ts    # Capacity planning
│   ├── claude-manager.ts         # CLI process lifecycle
│   └── conversation-queue.ts     # Request queue
├── preload/
│   └── index.ts                  # contextBridge API surface
├── renderer/
│   ├── App.tsx                   # Root component
│   ├── global.css                # Global styles + Typora variables
│   ├── components/
│   │   ├── editor/               # CodeMirror 6 wrapper
│   │   ├── chat/                 # AI chat panel
│   │   ├── graph/                # Knowledge graph + mind map
│   │   ├── kanban/               # Kanban board
│   │   ├── excalidraw/           # Excalidraw blocks
│   │   ├── layout/               # App shell, sidebar, statusbar
│   │   ├── upload/               # Image upload config
│   │   └── dialogs/              # Preferences, About
│   ├── contexts/                 # React Contexts
│   ├── hooks/                    # Custom hooks
│   └── utils/                    # Utilities
└── shared/
    └── ipc-channels.ts           # IPC channel constants
```

## Data Flow

### AI Cell Execution (Jupyter-style)
```
User types :::ai block → Ctrl+Enter
  → Editor.executeAiBlock() extracts prompt
  → IPC: ai:chat-send → Main process
  → AI Provider sends streaming request
  → Main pushes AI_CHUNK events to renderer
  → Editor.updateResponseBlock() writes to :::ai-response
```

### Image Upload
```
Paste/Drop image
  → IPC: image:write-temp → save to temp dir
  → IPC: image:upload → main process
  → PicGo/Custom command uploads
  → Return remote URL
  → Insert ![alt](url) into document
```

### Theme Loading
```
Theme selector change
  → IPC: theme:load → read .css file
  → Inject into document <style>
  → Extract :root CSS variables
  → Apply to CodeMirror theme + UI shell
```

## IPC Channels

All communication between renderer and main process goes through typed IPC channels defined in `src/shared/ipc-channels.ts` and exposed via contextBridge in `src/preload/index.ts`.

Categories:
- `file:*` — File operations
- `image:*` — Image upload
- `theme:*` — Theme management
- `window:*` — Window controls
- `pref:*` — Preferences
- `export:*` — HTML, PDF, Feishu, DOC
- `ai:*` — AI chat streaming
- `claude:*` — Claude CLI management

## Security

- `contextIsolation: true` — Renderer has no direct Node.js access
- `nodeIntegration: false` — No require() in renderer
- API keys stored in encrypted `electron-store` instance
- All external API calls go through main process only
- No API keys exposed to renderer or window.api

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Dev mode (HMR for renderer)
npm run build          # Production build
npm test               # Unit tests (vitest, happy-dom)
npm run test:watch     # Watch mode
npm run test:e2e       # Playwright E2E tests
npm run package        # Electron-builder distribution
```

Tests are in `test/unit/` (vitest) and `test/e2e/` (playwright). The `@` alias maps to `src/renderer/` in both vite and vitest configs.

## Architecture

Three-process Electron app with strict context isolation:

**Main process** (`src/main/`) — Node.js, no DOM access. App entry point is `index.ts` which calls `registerIpcHandlers()`, `registerAiHandlers()`, `buildMenu()`, then `createWindow()`. Each subsystem (file, image, theme, export, AI, Claude CLI, git) is a separate module registered through `ipc-handlers.ts`.

**Preload** (`src/preload/index.ts`) — The bridge. Exposes `window.api` via `contextBridge.exposeInMainWorld()`. All main↔renderer communication must go through typed IPC channels defined in `src/shared/ipc-channels.ts`. The preload is the single source of truth for the API surface — adding a feature requires entries in all three: IPC channel constant, preload method, and main handler.

**Renderer** (`src/renderer/`) — React 19 single-page app loaded via `electron-vite`. The editor's core is CodeMirror 6 with `codemirror-markdown-hybrid` for Typora-style WYSIWYG (rendered by default, source on focus). `App.tsx` is the root; `EditorContext.tsx` holds the central editor state. AI streaming uses event listeners (`onAiChunk`/`onAiDone`/`onAiError`) pushed from main process — not request/response.

**IPC pattern**: Main→Renderer events (menu actions, AI chunks) use `webContents.send()`. Renderer→Main calls use `ipcRenderer.invoke()` (Promise-based). Channel names are `category:action` format.

## Principles

**Numquam ponenda est pluralitas sine necessitate** (Occam's razor). Do not introduce abstractions, helpers, indirections, or new files without a concrete need. Three similar lines are better than a premature abstraction. If something is used exactly once, leave it inline. Only add error handling and validation at system boundaries (user input, external APIs), not for internal code paths that cannot fail.

## Key constraints

- `contextIsolation: true`, `nodeIntegration: false` — renderer has zero Node.js access. All filesystem, network, and system calls go through preload IPC.
- API keys are stored encrypted in `electron-store` (main process), never exposed to renderer.
- Theme system is Typora-compatible: CSS files in `themes/` with `:root` CSS variables. Theme CSS is loaded by main process and injected as a `<style>` tag.
- The `themes/paper/` directory is its own git sub-repo (Typora theme), kept vendored.

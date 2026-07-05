# Typora Design Reference

## Sources Analyzed

- `D:/Program Files/Typora/resources/window.html` — Main app HTML structure
- `D:/Program Files/Typora/resources/style/base.css` — Core typography, `#write` styles
- `D:/Program Files/Typora/resources/style/base-control.css` — App chrome (content, sidebar, scrollbars)
- `D:/Program Files/Typora/resources/style/window.css` — Dialog/modal styles
- `D:/Program Files/Typora/resources/page-dist/electron.css` — Electron shell loader
- `%APPDATA%/Typora/profile.data` — Hex-encoded user settings JSON
- `%APPDATA%/Typora/conf/conf.user.json` — Advanced user config

## Key Design Patterns

### 1. Scroll Architecture
```
Typora:  body { overflow: hidden }  →  <content> { overflow-y: auto; bottom: 25px }
Ours:    body { overflow: hidden }  →  .app-editor-area { overflow-y: auto }
```
Scroll happens on the pane-level container, NOT on the editor content.
`#write` has `overflow-x: visible` — it never scrolls independently.

### 2. Theme Loading
```
Typora:  <link id="theme_css" href="typora://app/userData/themes/current-theme.css">
Ours:    <style id="typora-theme-style">  (textContent injected via IPC)
```
Theme CSS is loaded raw — no wrapper, no scoping. Authors use `#write` prefix convention.
User overrides: `base.user.css` + `{theme}.user.css` appended.

### 3. Settings Persistence
```
Typora:  hex-encoded JSON in profile.data  (Buffer.from(hex, 'hex').toString('utf8'))
Ours:    electron-store (plain JSON via appStore)
```
Key settings: theme, sidebarWidth, imageUploader, isDarkMode, fontSize

### 4. Sidebar
```
Typora:  position: fixed; left: -30000px  →  .pin-outline { left: 0 }
Ours:    react-resizable-panels (Group/Panel/Separator)
```

### 5. Editor Content
```
Typora:  #write { margin: 0 auto; overflow-x: visible; padding-top: 36px }
         (No max-width here — themes set it via e.g. max-width: 21cm)
Ours:    .cm-content { padding: 60px 0 40vh }
         .editor-container { max-width: 860px; margin: 0 auto }
```

## Gap Analysis

| Feature | Typora | Ours | Status |
|---------|--------|------|--------|
| Scroll container | `<content>` with `bottom: 25px` footer reserve | `.app-editor-area` + flex StatusBar | ✅ Same pattern |
| Theme inject | `<link>` tag (instant href swap) | `<style>` textContent (IPC fetch) | ✅ Works |
| Theme scoping | Author convention (`#write` prefix) | Same convention | ✅ Compatible |
| User overrides | `{theme}.user.css` | Same | ✅ Implemented |
| Sidebar width | `--sidebar-width` CSS variable | `react-resizable-panels` | ✅ Different but functional |
| Line numbers | Hidden by default | Hidden by default | ✅ Matches |
| Status bar | Hidden by default (`showStatusBar: false`) | Always visible | ⚠️ Different default |
| Quick open | Ctrl+P file search | Missing | ❌ Not implemented |
| Context menu | Right-click actions | Missing | ❌ Not implemented |
| File tree | Real filesystem browsing | Recent files only | ⚠️ Partial |
| Code highlight | `.cm-s-inner` theme classes | CM6 `syntaxHighlighting` | ✅ Works |
| Focus mode | CSS dimming `.on-focus-mode` | CSS `.focus-mode` | ✅ Implemented |
| Typewriter | CSS centering | CSS `.typewriter-mode` | ✅ Implemented |
| Column-count guard | N/A (theme authors know) | `#write { column-count: 1 !important }` | ✅ Guarded |

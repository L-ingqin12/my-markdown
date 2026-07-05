import {
  keymap, highlightSpecialChars, drawSelection, dropCursor,
  rectangularSelection, crosshairCursor, highlightActiveLine,
  highlightActiveLineGutter, lineNumbers, EditorView
} from '@codemirror/view'
import { EditorState, Extension } from '@codemirror/state'
import {
  defaultHighlightStyle, syntaxHighlighting, indentOnInput,
  bracketMatching, foldGutter, foldKeymap
} from '@codemirror/language'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { oneDark } from '@codemirror/theme-one-dark'
import { GFM } from '@lezer/markdown'
import { hybridMarkdown, lightTheme, darkTheme } from 'codemirror-markdown-hybrid'

// Typora-style defaults: no line numbers, spacious content, clean layout
export function buildExtensions(
  onChange: (content: string) => void,
  isDark: boolean,
  prefs?: { fontSize?: number; fontFamily?: string; showLineNumbers?: boolean; spellCheck?: boolean; wordWrap?: boolean },
  onCursorMove?: (line: number, col: number) => void
): Extension[] {
  const fontSize = prefs?.fontSize ?? 18
  const fontFamily = prefs?.fontFamily ?? "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"

  return [
    ...(prefs?.showLineNumbers ? [highlightActiveLineGutter()] : []),
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    highlightSelectionMatches(),
    history(),

    ...(prefs?.wordWrap !== false ? [EditorView.lineWrapping] : []),

    ...(prefs?.showLineNumbers
      ? [
          lineNumbers({
            formatNumber: n => String(n).padStart(5, ' ')
          }),
          foldGutter()
        ]
      : []),

    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      extensions: GFM
    }),

    hybridMarkdown({
      renderHeadings: true,
      renderBoldItalic: true,
      renderCodeBlocks: true,
      renderTables: true,
      renderImages: true,
      renderLinks: true,
      renderTaskLists: true,
      theme: isDark ? 'dark' : 'light',
      strict: false
    }),

    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

    // Hybrid theme first, then our custom overrides

    keymap.of([
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...(prefs?.showLineNumbers ? foldKeymap : []),
      ...completionKeymap,
      ...closeBracketsKeymap,
      indentWithTab
    ]),

    ...(isDark ? [oneDark] : []),
    isDark ? darkTheme : lightTheme,  // hybrid base theme goes first

    // Custom overrides — loaded last = highest priority
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        backgroundColor: isDark ? '#282c34' : '#ffffff !important'
      },
      '&.cm-editor, &.cm-editor.cm-focused': {
        outline: 'none !important'
      },
      '.cm-scroller': {
        fontFamily,
        lineHeight: '1.7',
        overflow: 'hidden !important',
        backgroundColor: isDark ? '#282c34' : '#ffffff !important'
      },
      '.cm-content': {
        padding: '60px 0 40vh',
        backgroundColor: isDark ? '#282c34' : '#ffffff !important'
      },
      '.cm-line': {
        padding: '0'
      },
      '.cm-gutters': {
        borderRight: 'none !important',
        backgroundColor: 'transparent',
        color: isDark ? '#555' : '#bbb',
        paddingRight: '8px',
        minWidth: '60px !important',
        width: '60px !important',
        maxWidth: '60px !important',
        fontFamily: '"Consolas", "SF Mono", "Cascadia Code", monospace',
        fontVariantNumeric: 'tabular-nums',
        fontSize: '13px'
      },
      '.cm-lineNumbers .cm-gutterElement': {
        fontFamily: '"Consolas", "SF Mono", "Cascadia Code", monospace',
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        padding: '0 6px 0 0 !important'
      },
      '.cm-activeLine': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.06) !important' : 'rgba(0,0,0,0.02) !important'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent'
      },
      '.cm-selectedLine': {
        backgroundColor: isDark ? 'rgba(255,255,255,0.08) !important' : 'rgba(0,0,0,0.03) !important',
        color: 'inherit !important'
      },
      // High-contrast selection — guaranteed visible on any background
      '.cm-selectionBackground': {
        backgroundColor: isDark ? '#264f78 !important' : '#cce5ff !important',
        outline: isDark ? '1px solid rgba(86,156,214,0.8)' : '1px solid rgba(0,120,215,0.4)',
        borderRadius: '2px'
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: isDark ? '#264f78 !important' : '#b3d9ff !important',
        outline: isDark ? '1px solid rgba(86,156,214,0.8)' : '1px solid rgba(0,120,215,0.5)'
      },
      '.cm-selectionMatch': {
        backgroundColor: isDark ? 'rgba(255,200,0,0.3)' : 'rgba(255,200,0,0.4)'
      },
      '.cm-cursor': {
        borderLeftColor: isDark ? '#fff' : '#000',
        borderLeftWidth: '2px'
      }
    }, { dark: isDark }),

    EditorView.contentAttributes.of({ spellcheck: prefs?.spellCheck ? 'true' : 'false' }),

    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
      if (update.selectionSet && onCursorMove) {
        const pos = update.state.selection.main.head
        const line = update.state.doc.lineAt(pos)
        onCursorMove(line.number, pos - line.from + 1)
      }
    })
  ]
}

export function buildSourceExtensions(
  onChange: (content: string) => void,
  isDark: boolean,
  prefs?: { fontSize?: number; fontFamily?: string; showLineNumbers?: boolean }
): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    drawSelection(),
    dropCursor(),
    highlightActiveLine(),
    history(),
    foldGutter(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    highlightSelectionMatches(),
    markdown({ base: markdownLanguage, codeLanguages: languages, extensions: GFM }),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([
      ...defaultKeymap, ...searchKeymap, ...historyKeymap,
      ...foldKeymap, ...completionKeymap, ...closeBracketsKeymap, indentWithTab
    ]),
    ...(isDark ? [oneDark] : []),
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${prefs?.fontSize ?? 15}px`,
        fontFamily: "'Consolas', 'Fira Code', 'JetBrains Mono', monospace",
        backgroundColor: isDark ? '#1e1e1e' : '#ffffff'
      },
      '&.cm-editor, &.cm-editor.cm-focused': { outline: 'none' },
      '.cm-content': { padding: '20px 0', maxWidth: '960px', margin: '0 auto' },
      '.cm-line': { padding: '0 8px' },
      '.cm-gutters': {
        borderRight: '1px solid ' + (isDark ? '#333' : '#ddd'),
        backgroundColor: isDark ? '#252526' : '#f5f5f5',
        color: isDark ? '#858585' : '#999'
      }
    }, { dark: isDark }),
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })
  ]
}

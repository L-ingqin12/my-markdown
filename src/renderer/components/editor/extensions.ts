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

export function buildExtensions(
  onChange: (content: string) => void,
  isDark: boolean,
  preferences?: { fontSize?: number; fontFamily?: string; showLineNumbers?: boolean }
): Extension[] {
  const fontSize = preferences?.fontSize ?? 16
  const fontFamily = preferences?.fontFamily ?? "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif"

  return [
    lineNumbers(),
    highlightActiveLineGutter(),
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
    foldGutter(),
    history(),

    // Markdown language
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      extensions: GFM
    }),

    // WYSIWYG: hides markdown syntax, shows rendered content
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

    // Hybrid theme
    isDark ? darkTheme : lightTheme,

    // Syntax highlighting
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

    // Key bindings
    keymap.of([
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...closeBracketsKeymap,
      indentWithTab
    ]),

    ...(isDark ? [oneDark] : []),

    // Editor appearance
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        backgroundColor: isDark ? '#282c34' : '#ffffff'
      },
      '&.cm-editor': { outline: 'none !important' },
      '&.cm-editor.cm-focused': { outline: 'none !important' },
      '.cm-scroller': {
        fontFamily,
        lineHeight: '1.8',
        overflow: 'auto !important'
      },
      '.cm-content': {
        padding: '3em 5em',
        minHeight: '100%',
        maxWidth: '900px',
        margin: '0 auto'
      },
      '.cm-line': { paddingLeft: '0', paddingRight: '0' },
      '.cm-gutters': {
        borderRight: 'none',
        backgroundColor: 'transparent',
        color: isDark ? '#555' : '#ccc'
      },
      '.cm-activeLineGutter': { backgroundColor: 'transparent' },
      '.cm-cursor': { borderLeftColor: isDark ? '#fff' : '#000' },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: isDark ? '#3a3f4b' : '#b3d7ff'
      }
    }, { dark: isDark }),

    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })
  ]
}

export function buildSourceExtensions(
  onChange: (content: string) => void,
  isDark: boolean,
  preferences?: { fontSize?: number; fontFamily?: string; showLineNumbers?: boolean }
): Extension[] {
  const fontSize = preferences?.fontSize ?? 16

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
    keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, ...completionKeymap, ...closeBracketsKeymap, indentWithTab]),
    ...(isDark ? [oneDark] : []),
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        fontFamily: "'Consolas', 'Fira Code', 'JetBrains Mono', monospace"
      },
      '.cm-content': { padding: '2em 3em', minHeight: '100%' },
      '.cm-line': { paddingLeft: '0', paddingRight: '0' },
      '&.cm-editor.cm-focused': { outline: 'none' }
    }, { dark: isDark }),
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })
  ]
}

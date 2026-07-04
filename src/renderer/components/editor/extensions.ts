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

export function buildExtensions(
  onChange: (content: string) => void,
  isDark: boolean,
  preferences?: { fontSize?: number; fontFamily?: string; showLineNumbers?: boolean }
): Extension[] {
  const exts: Extension[] = [
    // Visual
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

    // Gutters and folding
    foldGutter(),

    // Line numbers (conditional)
    ...(preferences?.showLineNumbers ? [lineNumbers()] : []),

    // History
    history(),

    // Markdown language with GFM
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
      extensions: GFM
    }),

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

    // Theme
    ...(isDark ? [oneDark] : []),

    // Editor theme customization
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${preferences?.fontSize ?? 16}px`,
        backgroundColor: isDark ? '#282c34' : '#ffffff'
      },
      '.cm-scroller': {
        fontFamily: preferences?.fontFamily ?? "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        lineHeight: '1.8'
      },
      '.cm-content': {
        padding: '2em 0',
        minHeight: '100%'
      },
      '.cm-gutters': {
        borderRight: 'none',
        backgroundColor: 'transparent',
        color: isDark ? '#555' : '#ccc'
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'transparent'
      },
      '.cm-cursor': {
        borderLeftColor: isDark ? '#fff' : '#000'
      },
      '.cm-selectionBackground, ::selection': {
        backgroundColor: isDark ? '#3a3f4b' : '#b3d7ff !important'
      },
      '.cm-foldPlaceholder': {
        backgroundColor: isDark ? '#3a3f4b' : '#f0f0f0',
        border: 'none',
        color: isDark ? '#abb2bf' : '#888',
        padding: '0 8px',
        borderRadius: '3px'
      },
      // Typora-compatible classes
      '.cm-line': {
        paddingLeft: '3em',
        paddingRight: '3em'
      },
      '&.cm-editor.cm-focused': {
        outline: 'none'
      }
    }, { dark: isDark }),

    // Change listener
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })
  ]

  return exts
}

// Build simplified extensions for source code mode (no hybrid preview)
export function buildSourceExtensions(
  onChange: (content: string) => void,
  isDark: boolean,
  preferences?: { fontSize?: number; fontFamily?: string; showLineNumbers?: boolean }
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
    keymap.of([...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, ...completionKeymap, ...closeBracketsKeymap, indentWithTab]),
    ...(isDark ? [oneDark] : []),
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${preferences?.fontSize ?? 16}px`,
        fontFamily: preferences?.fontFamily?.includes('monospace') ? preferences.fontFamily : "'Consolas', 'Fira Code', 'JetBrains Mono', monospace"
      },
      '.cm-content': { padding: '2em 0', minHeight: '100%' },
      '.cm-line': { paddingLeft: '3em', paddingRight: '3em' },
      '&.cm-editor.cm-focused': { outline: 'none' }
    }, { dark: isDark }),
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })
  ]
}

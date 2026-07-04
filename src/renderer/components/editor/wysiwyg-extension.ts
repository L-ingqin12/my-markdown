import {
  Decoration, DecorationSet, EditorView,
  ViewPlugin, ViewUpdate, WidgetType
} from '@codemirror/view'
import { RangeSetBuilder } from '@codemirror/state'
import { syntaxTree } from '@codemirror/language'

// Decoration that hides markdown syntax markers by making them 0-width
const hideMark = Decoration.replace({})

// Bold/italic styling (not just hiding, but applying actual style)
const boldStyle = Decoration.mark({ class: 'cm-wysiwyg-bold' })
const italicStyle = Decoration.mark({ class: 'cm-wysiwyg-italic' })
const strikethroughStyle = Decoration.mark({ class: 'cm-wysiwyg-strikethrough' })
const codeStyle = Decoration.mark({ class: 'cm-wysiwyg-code' })
const headingStyle = Decoration.line({ class: 'cm-wysiwyg-heading' })
const linkUrl = Decoration.replace({})

function buildWysiwygDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()
  const doc = view.state.doc

  // Process each line for WYSIWYG decorations
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i)
    const text = line.text

    // Hide heading markers: # ## ### etc
    const headingMatch = text.match(/^(#{1,6})\s/)
    if (headingMatch) {
      const level = headingMatch[1].length
      builder.add(line.from, line.from + headingMatch[0].length, hideMark)
      builder.add(line.from, line.to, Decoration.line({ class: `cm-wysiwyg-h${level}` }))
    }

    // Process inline formatting within the line
    let pos = line.from
    while (pos < line.to) {
      // Bold: **text** or __text__
      const boldMatch = doc.sliceString(pos, line.to).match(/^(\*\*|__)(.+?)\1/)
      if (boldMatch && boldMatch.index !== undefined) {
        const start = pos + boldMatch.index!
        const end = start + boldMatch[0].length
        builder.add(start, start + 2, hideMark)
        builder.add(end - 2, end, hideMark)
        builder.add(start + 2, end - 2, boldStyle)
        pos = end
        continue
      }

      // Italic: *text* or _text_ (but not ** or __)
      const italicMatch = doc.sliceString(pos, line.to).match(/^(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/)
      if (italicMatch && italicMatch.index !== undefined) {
        const start = pos + italicMatch.index!
        const content = italicMatch[1] || italicMatch[2]
        const fullLen = italicMatch[0].length
        const end = start + fullLen
        builder.add(start, start + 1, hideMark)
        builder.add(end - 1, end, hideMark)
        builder.add(start + 1, end - 1, italicStyle)
        pos = end
        continue
      }

      // Strikethrough: ~~text~~
      const strikeMatch = doc.sliceString(pos, line.to).match(/^~~(.+?)~~/)
      if (strikeMatch && strikeMatch.index !== undefined) {
        const start = pos + strikeMatch.index!
        const end = start + strikeMatch[0].length
        builder.add(start, start + 2, hideMark)
        builder.add(end - 2, end, hideMark)
        builder.add(start + 2, end - 2, strikethroughStyle)
        pos = end
        continue
      }

      // Inline code: `code`
      const codeMatch = doc.sliceString(pos, line.to).match(/^`([^`]+)`/)
      if (codeMatch && codeMatch.index !== undefined) {
        const start = pos + codeMatch.index!
        const end = start + codeMatch[0].length
        builder.add(start, start + 1, hideMark)
        builder.add(end - 1, end, hideMark)
        builder.add(start + 1, end - 1, codeStyle)
        pos = end
        continue
      }

      // Links: [text](url) - hide the URL part, show text
      const linkMatch = doc.sliceString(pos, line.to).match(/^\[(.+?)\]\((.+?)\)/)
      if (linkMatch && linkMatch.index !== undefined) {
        const start = pos + linkMatch.index!
        const bracketEnd = start + linkMatch[1].length + 1
        const urlStart = bracketEnd + 1
        const end = urlStart + linkMatch[2].length + 1
        builder.add(start, start + 1, hideMark)  // [
        builder.add(bracketEnd, end, linkUrl)     // ](url)
        pos = end
        continue
      }

      // Images: ![alt](url) - hide everything, show placeholder
      const imgMatch = doc.sliceString(pos, line.to).match(/^!\[(.+?)\]\((.+?)\)/)
      if (imgMatch && imgMatch.index !== undefined) {
        const start = pos + imgMatch.index!
        const end = start + imgMatch[0].length
        builder.add(start, end, Decoration.replace({
          widget: new ImagePlaceholder(imgMatch[1], imgMatch[2])
        }))
        pos = end
        continue
      }

      pos++
    }

    // Horizontal rule: --- or ***
    if (/^[-*_]{3,}\s*$/.test(text.trim())) {
      builder.add(line.from, line.to, Decoration.replace({
        widget: new HRWidget()
      }))
    }

    // Task list items
    const taskMatch = text.match(/^(\s*)-\s\[([ x])\]\s/)
    if (taskMatch) {
      const indent = taskMatch[1].length
      const checkStart = line.from + indent + 2
      builder.add(checkStart, checkStart + 5, Decoration.replace({
        widget: new CheckboxWidget(taskMatch[2] === 'x')
      }))
    }
  }

  return builder.finish()
}

// Widget for image placeholder
class ImagePlaceholder extends WidgetType {
  constructor(private alt: string, private url: string) {
    super()
  }
  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'cm-wysiwyg-image'
    span.innerHTML = `&#x1F5BC; ${this.alt || 'image'}`
    span.title = this.url
    span.style.cssText = 'color:#428bca;cursor:pointer;border-bottom:1px dashed #428bca;font-size:0.9em'
    span.onclick = () => {
      // On click, reveal the raw markdown
      console.log('Image URL:', this.url)
    }
    return span
  }
}

// Widget for horizontal rule
class HRWidget extends WidgetType {
  toDOM(): HTMLElement {
    const hr = document.createElement('div')
    hr.className = 'cm-wysiwyg-hr'
    return hr
  }
}

// Widget for checkbox
class CheckboxWidget extends WidgetType {
  constructor(private checked: boolean) { super() }
  toDOM(): HTMLElement {
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.checked = this.checked
    cb.className = 'cm-wysiwyg-checkbox'
    cb.onclick = (e) => e.preventDefault() // Handled via CM6
    return cb
  }
}

// The ViewPlugin that rebuilds decorations on every update
export const wysiwygPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = buildWysiwygDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = buildWysiwygDecorations(update.view)
    }
  }
}, {
  decorations: v => v.decorations
})

// Theme styles for WYSIWYG
export const wysiwygTheme = EditorView.theme({
  // Bold
  '.cm-wysiwyg-bold': {
    fontWeight: '700 !important'
  },
  // Italic
  '.cm-wysiwyg-italic': {
    fontStyle: 'italic !important'
  },
  // Strikethrough
  '.cm-wysiwyg-strikethrough': {
    textDecoration: 'line-through !important',
    opacity: '0.7'
  },
  // Inline code
  '.cm-wysiwyg-code': {
    background: 'rgba(175,184,193,0.2)',
    padding: '2px 4px',
    borderRadius: '4px',
    fontFamily: 'var(--monospace)',
    fontSize: '0.9em'
  },
  // Headings
  '.cm-wysiwyg-h1': {
    fontSize: '2em !important',
    fontWeight: '700 !important',
    marginTop: '1em',
    paddingBottom: '0.3em',
    borderBottom: '1px solid #d8dee4'
  },
  '.cm-wysiwyg-h2': {
    fontSize: '1.5em !important',
    fontWeight: '600 !important',
    marginTop: '1em',
    paddingBottom: '0.3em',
    borderBottom: '1px solid #d8dee4'
  },
  '.cm-wysiwyg-h3': {
    fontSize: '1.25em !important',
    fontWeight: '600 !important',
    marginTop: '0.8em'
  },
  '.cm-wysiwyg-h4': {
    fontSize: '1.1em !important',
    fontWeight: '600 !important'
  },
  '.cm-wysiwyg-h5': {
    fontSize: '1em !important',
    fontWeight: '600 !important'
  },
  '.cm-wysiwyg-h6': {
    fontSize: '0.9em !important',
    fontWeight: '600 !important',
    color: '#656d76'
  },
  // HR widget
  '.cm-wysiwyg-hr': {
    borderTop: '2px solid #d0d7de',
    margin: '24px 0',
    width: '100%'
  },
  // Image placeholder
  '.cm-wysiwyg-image': {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'rgba(66,139,202,0.08)',
    borderRadius: '4px'
  },
  // Checkbox
  '.cm-wysiwyg-checkbox': {
    margin: '0 8px 0 0',
    cursor: 'pointer',
    width: '16px',
    height: '16px'
  },
  // Blockquote styling
  '.cm-wysiwyg-blockquote': {
    borderLeft: '4px solid #d0d7de',
    paddingLeft: '16px',
    color: '#656d76'
  }
})

import { BrowserWindow, dialog } from 'electron'
import { writeFile } from 'fs/promises'

// ---------------------------------------------------------------------------
// Feishu Block Types
// ---------------------------------------------------------------------------

export interface FeishuBlock {
  block_id?: string
  block_type: number
  heading?: FeishuHeading
  text?: FeishuText
  code?: FeishuCode
  bullet?: FeishuBullet
  ordered?: FeishuOrdered
  table?: FeishuTable
  image?: FeishuImage
  quote?: FeishuQuote
  link?: FeishuLink
  divider?: FeishuDivider
  callout?: FeishuCallout
  todo?: FeishuTodo
}

interface FeishuHeading {
  heading_level: number
  rich_text: FeishuInline[]
  alignment?: number
}

interface FeishuText {
  rich_text: FeishuInline[]
  alignment?: number
}

interface FeishuCode {
  elements: FeishuInline[]
  style: { language: number; wrap: boolean }
}

interface FeishuBullet {
  elements: FeishuInline[]
}

interface FeishuOrdered {
  elements: FeishuInline[]
  number_type?: number
}

interface FeishuTable {
  property: { column_size: number; column_width?: number[] }
  cells: FeishuTableCell[][]
}

interface FeishuTableCell {
  rich_text: FeishuInline[]
}

interface FeishuImage {
  image_token?: string
  width?: number
  height?: number
}

interface FeishuQuote {
  rich_text: FeishuInline[]
}

interface FeishuLink {
  link: { url: string }
  text?: FeishuInline[]
}

interface FeishuDivider {
  // empty
}

interface FeishuCallout {
  rich_text: FeishuInline[]
  background_color?: number
  border_color?: number
  emoji_id?: string
}

interface FeishuTodo {
  rich_text: FeishuInline[]
  done: boolean
}

// ---------------------------------------------------------------------------
// Inline elements
// ---------------------------------------------------------------------------

export interface FeishuInline {
  content?: string
  inline_type?: number
  text_element_style?: FeishuTextStyle
  link?: { url: string }
}

interface FeishuTextStyle {
  bold?: boolean
  italic?: boolean
  strikethrough?: boolean
  underline?: boolean
  inline_code?: boolean
  text_color?: number
  background_color?: number
}

// ---------------------------------------------------------------------------
// Language code → Feishu language id mapping
// ---------------------------------------------------------------------------

const LANG_MAP: Record<string, number> = {
  javascript: 19,
  js: 19,
  jsx: 19,
  typescript: 21,
  ts: 21,
  tsx: 21,
  python: 15,
  py: 15,
  java: 11,
  go: 22,
  rust: 16,
  rs: 16,
  c: 23,
  cpp: 24,
  'c++': 24,
  'c#': 8,
  cs: 8,
  ruby: 17,
  rb: 17,
  php: 14,
  swift: 18,
  kotlin: 25,
  kt: 25,
  scala: 20,
  shell: 1,
  bash: 1,
  sh: 1,
  sql: 6,
  html: 2,
  css: 3,
  json: 4,
  xml: 5,
  yaml: 7,
  yml: 7,
  markdown: 9,
  md: 9,
  dart: 26,
  lua: 27,
  perl: 28,
  r: 29,
  haskell: 30,
  hs: 30,
  plain: 0,
  text: 0,
}

function getFeishuLang(lang: string): number {
  const normalized = lang.trim().toLowerCase()
  return LANG_MAP[normalized] ?? 0
}

// ---------------------------------------------------------------------------
// Markdown → Feishu blocks  (line‑based parser)
// ---------------------------------------------------------------------------

function parseInlineStyles(line: string): FeishuInline[] {
  const inlines: FeishuInline[] = []
  // State-machine parser using a stack to handle nested styles.
  // Tracks open/close markers for bold (**), italic (*), code (`), strikethrough (~~).
  const stack: string[] = []
  let buf = ''
  let i = 0

  function currentStyle(): FeishuTextStyle {
    return {
      bold: stack.includes('bold'),
      italic: stack.includes('italic'),
      strikethrough: stack.includes('strike'),
    }
  }

  function flush() {
    if (buf) {
      inlines.push({ content: buf, text_element_style: currentStyle() })
      buf = ''
    }
  }

  function toggleStyle(style: string) {
    flush()
    const idx = stack.lastIndexOf(style)
    if (idx !== -1) {
      stack.splice(idx, 1)
    } else {
      stack.push(style)
    }
  }

  while (i < line.length) {
    // Link [text](url)
    if (line[i] === '[') {
      const cb = line.indexOf(']', i)
      if (cb !== -1 && line[cb + 1] === '(') {
        const cp = line.indexOf(')', cb + 2)
        if (cp !== -1) {
          flush()
          inlines.push({
            content: line.slice(i + 1, cb),
            link: { url: line.slice(cb + 2, cp) },
            text_element_style: {},
          })
          i = cp + 1
          continue
        }
      }
    }

    // Inline code `...`
    if (line[i] === '`') {
      const end = line.indexOf('`', i + 1)
      if (end !== -1) {
        flush()
        inlines.push({
          content: line.slice(i + 1, end),
          text_element_style: { inline_code: true },
        })
        i = end + 1
        continue
      }
    }

    // ~~strikethrough~~
    if (line[i] === '~' && line[i + 1] === '~') {
      toggleStyle('strike')
      i += 2
      continue
    }

    // Asterisk markers: *** (bold+italic), ** (bold), * (italic)
    if (line[i] === '*') {
      let count = 0
      while (i + count < line.length && line[i + count] === '*') count++

      if (count >= 3) {
        toggleStyle('bold')
        toggleStyle('italic')
        i += 3
        continue
      }

      if (count >= 2) {
        toggleStyle('bold')
        i += 2
        continue
      }

      if (count === 1) {
        toggleStyle('italic')
        i += 1
        continue
      }
    }

    // Plain character
    buf += line[i]
    i++
  }

  flush()

  // If no matches, return the whole line as a single text element
  if (inlines.length === 0) {
    inlines.push({ content: line, text_element_style: {} })
  }

  return inlines
}

function isImageLine(line: string): string | null {
  const m = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
  return m ? m[2] : null
}

function isLinkLine(line: string): { text: string; url: string } | null {
  const m = line.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/)
  return m ? { text: m[1], url: m[2] } : null
}

function isHorizontalRule(line: string): boolean {
  return /^(\s*[-*_]\s*){3,}$/.test(line.trim())
}

function countHeadingLevel(line: string): number {
  const m = line.match(/^(#{1,6})\s/)
  return m ? m[1].length : 0
}

function isTableCellSeparator(line: string): boolean {
  return /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(line.trim())
}

// ---------------------------------------------------------------------------
// Table parser – collects consecutive table rows
// ---------------------------------------------------------------------------

interface TableAccum {
  header: string[]
  rows: string[][]
}

function parseTableRow(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1) // discard leading/trailing empty from split
    .map((c) => c.trim())
}

function isTableRow(line: string): boolean {
  return line.trimStart().startsWith('|')
}

// ---------------------------------------------------------------------------
// Main converter
// ---------------------------------------------------------------------------

export function markdownToFeishuBlocks(markdown: string): FeishuBlock[] {
  const lines = markdown.split('\n')
  const blocks: FeishuBlock[] = []

  let i = 0
  while (i < lines.length) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // Skip empty lines in between blocks
    if (trimmed === '') {
      i++
      continue
    }

    // Horizontal rule
    if (isHorizontalRule(trimmed)) {
      blocks.push({ block_type: 22, divider: {} })
      i++
      continue
    }

    // Blockquote (single line or multi-line)
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trimStart().startsWith('> ')) {
        quoteLines.push(lines[i].trimStart().slice(2))
        i++
      }
      const content = quoteLines.join('\n')
      const rich_text = parseInlineStyles(content)
      blocks.push({ block_type: 16, quote: { rich_text } })
      continue
    }

    // Code block (fenced)
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++ // skip closing ```
      }
      const codeText = codeLines.join('\n')
      blocks.push({
        block_type: 8,
        code: {
          elements: [{ content: codeText, text_element_style: {} }],
          style: { language: getFeishuLang(lang), wrap: true },
        },
      })
      continue
    }

    // Unordered list
    if (/^[-*+]\s/.test(trimmed)) {
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
        const listText = lines[i].trim().slice(2).trim()
        const rich_text = parseInlineStyles(listText)
        blocks.push({ block_type: 12, bullet: { elements: rich_text } })
        i++
      }
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const listText = lines[i].trim().replace(/^\d+\.\s/, '').trim()
        const rich_text = parseInlineStyles(listText)
        blocks.push({ block_type: 13, ordered: { elements: rich_text } })
        i++
      }
      continue
    }

    // Task list (GitHub Flavored Markdown checkbox)
    if (/^\s*[-*+]\s+\[[ x]\]\s/.test(trimmed)) {
      while (i < lines.length && /^\s*[-*+]\s+\[[ x]\]\s/.test(lines[i].trim())) {
        const done = lines[i].trim().includes('[x]')
        const text = lines[i].trim().replace(/^[-*+]\s+\[[ x]\]\s+/, '')
        const rich_text = parseInlineStyles(text)
        blocks.push({ block_type: 17, todo: { rich_text, done } })
        i++
      }
      continue
    }

    // Table
    if (isTableRow(trimmed) && i + 1 < lines.length && isTableCellSeparator(lines[i + 1])) {
      const header = parseTableRow(trimmed)
      i += 2 // skip header and separator
      const rows: string[][] = []
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(parseTableRow(lines[i]))
        i++
      }

      const columnSize = header.length
      const cells: FeishuTableCell[][] = []

      // Header row cells
      const headerCells = header.map((cell) => ({
        rich_text: parseInlineStyles(cell),
      }))
      cells.push(headerCells)

      // Data row cells
      for (const row of rows) {
        const dataCells = row.map((cell) => ({
          rich_text: parseInlineStyles(cell),
        }))
        cells.push(dataCells)
      }

      blocks.push({
        block_type: 9,
        table: {
          property: { column_size: columnSize },
          cells,
        },
      })
      continue
    }

    // Image line
    const imgSrc = isImageLine(trimmed)
    if (imgSrc) {
      blocks.push({
        block_type: 18,
        image: { image_token: imgSrc },
      })
      i++
      continue
    }

    // Single link line
    const linkMatch = isLinkLine(trimmed)
    if (linkMatch) {
      const rich_text = parseInlineStyles(linkMatch.text)
      blocks.push({
        block_type: 14,
        link: { link: { url: linkMatch.url }, text: rich_text },
      })
      i++
      continue
    }

    // Heading
    const headingLevel = countHeadingLevel(trimmed)
    if (headingLevel > 0) {
      const headingText = trimmed.slice(headingLevel).trim()
      const rich_text = parseInlineStyles(headingText)
      blocks.push({
        block_type: 1,
        heading: {
          heading_level: headingLevel,
          rich_text,
        },
      })
      i++
      continue
    }

    // Default: text paragraph
    const rich_text = parseInlineStyles(trimmed)
    blocks.push({ block_type: 2, text: { rich_text } })
    i++
  }

  return blocks
}

// ---------------------------------------------------------------------------
// Generate Feishu API request body
// ---------------------------------------------------------------------------

export interface FeishuDocument {
  title: string
  blocks: FeishuBlock[]
}

export function generateFeishuDocument(markdown: string, title: string = 'Untitled'): FeishuDocument {
  return {
    title,
    blocks: markdownToFeishuBlocks(markdown),
  }
}

// ---------------------------------------------------------------------------
// Electron export handler
// ---------------------------------------------------------------------------

export async function exportFeishu(
  content: string,
  filePath?: string,
  title?: string,
): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return null

  const doc = generateFeishuDocument(content, title || 'Feishu Export')

  if (filePath) {
    await writeFile(filePath, JSON.stringify(doc, null, 2), 'utf-8')
    return filePath
  }

  const result = await dialog.showSaveDialog(win, {
    title: 'Export Feishu JSON',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    defaultPath: 'feishu-export.json',
  })

  if (result.canceled || !result.filePath) return null
  await writeFile(result.filePath, JSON.stringify(doc, null, 2), 'utf-8')
  return result.filePath
}

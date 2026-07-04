import { v4 as uuidv4 } from 'uuid'

export interface KanbanCard {
  id: string
  title: string
  checked: boolean
  dueDate?: string
  tags: string[]
  metadata: Record<string, string>
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export interface KanbanColumn {
  id: string
  title: string
  isComplete: boolean
  cards: KanbanCard[]
}

export interface KanbanSettings {
  'kanban-plugin': string
  [key: string]: unknown
}

export interface KanbanBoard {
  columns: KanbanColumn[]
  archivedCards: KanbanCard[]
  settings: KanbanSettings
}

const PRIORITY_MAP: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
  '🟢': 'low',
  '🟡': 'medium',
  '🔴': 'high',
  '🔥': 'urgent',
}

const PRIORITY_EMOJI: Record<string, string> = {
  low: '🟢',
  medium: '🟡',
  high: '🔴',
  urgent: '🔥',
}

export function getPriorityEmoji(priority?: 'low' | 'medium' | 'high' | 'urgent'): string {
  return priority ? PRIORITY_EMOJI[priority] : ''
}

interface ExtractedMetadata {
  cleanTitle: string
  dueDate?: string
  tags: string[]
  metadata: Record<string, string>
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

function extractMetadata(rawTitle: string): ExtractedMetadata {
  let cleanTitle = rawTitle.trim()
  const tags: string[] = []
  const metadata: Record<string, string> = {}
  let dueDate: string | undefined
  let priority: 'low' | 'medium' | 'high' | 'urgent' | undefined

  // Extract priority emoji (first matching emoji found)
  for (const [emoji, level] of Object.entries(PRIORITY_MAP)) {
    const idx = cleanTitle.indexOf(emoji)
    if (idx !== -1) {
      priority = level
      cleanTitle = cleanTitle.slice(0, idx) + cleanTitle.slice(idx + emoji.length)
      cleanTitle = cleanTitle.trim()
      break
    }
  }

  // Extract dates: @2024-01-01
  cleanTitle = cleanTitle.replace(/@(\d{4}-\d{2}-\d{2})/g, (_, date: string) => {
    dueDate = date
    return ''
  }).trim()

  // Extract tags: #tag or #tag-with-dashes
  cleanTitle = cleanTitle.replace(/#([^\s#]+)/g, (_, tag: string) => {
    tags.push(tag)
    return ''
  }).trim()

  // Extract metadata fields: [field:: value]
  cleanTitle = cleanTitle.replace(/\[([^\]]+)::\s*([^\]]+)\]/g, (_: string, key: string, value: string) => {
    metadata[key.trim()] = value.trim()
    return ''
  }).trim()

  return { cleanTitle, dueDate, tags, metadata, priority }
}

/**
 * Try to extract a YAML frontmatter value from a list of lines.
 */
function parseFrontmatter(lines: string[]): KanbanSettings {
  const settings: KanbanSettings = { 'kanban-plugin': '' }
  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim()
      let value = line.slice(colonIdx + 1).trim()
      // Strip surrounding quotes
      if ((value.startsWith("'") && value.endsWith("'")) ||
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1)
      }
      settings[key] = value
    }
  }
  return settings
}

/**
 * Parse Obsidian-compatible Kanban Markdown into a typed KanbanBoard structure.
 * Returns null if the content does not have `kanban-plugin: board` in YAML frontmatter.
 */
export function parseKanban(markdown: string): KanbanBoard | null {
  if (!markdown || !markdown.trim()) return null

  if (!isKanbanBoard(markdown)) return null

  const lines = markdown.split('\n')
  const columns: KanbanColumn[] = []
  const archivedCards: KanbanCard[] = []
  let settings: KanbanSettings = { 'kanban-plugin': 'board' }

  let currentColumn: KanbanColumn | null = null
  let inArchive = false
  let inFrontMatter = false
  let frontMatterCount = 0
  let frontMatterAccum: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // --- Front matter ---
    if (i === 0 && trimmed === '---') {
      inFrontMatter = true
      frontMatterCount = 1
      continue
    }
    if (inFrontMatter) {
      if (trimmed === '---') {
        frontMatterCount++
        if (frontMatterCount === 2) {
          settings = parseFrontmatter(frontMatterAccum)
          inFrontMatter = false
        }
        continue
      }
      frontMatterAccum.push(trimmed)
      continue
    }

    // --- Archive separator ---
    if (trimmed === '***') {
      inArchive = true
      continue
    }

    // --- Column heading (## ...) ---
    if (trimmed.startsWith('## ')) {
      const rawTitle = trimmed.slice(3).trim()
      // Detect **Complete** marker
      const completeMatch = rawTitle.match(/^(.+?)\s*\*\*Complete\*\*\s*$/)
      const title = completeMatch ? completeMatch[1].trim() : rawTitle
      const isComplete = !!completeMatch
      // Skip the ## Archived heading inside archive section
      if (inArchive && (title === 'Archived' || title === 'Archive')) {
        continue
      }
      currentColumn = {
        id: uuidv4(),
        title,
        isComplete,
        cards: [],
      }
      columns.push(currentColumn)
      continue
    }

    // --- Card item (- [ ] / - [x]) ---
    const cardMatch = trimmed.match(/^- \[([ x])\] (.+)$/)
    if (cardMatch && currentColumn) {
      const checked = cardMatch[1] === 'x'
      const rawTitle = cardMatch[2]
      const { cleanTitle, dueDate, tags: cardTags, metadata, priority } = extractMetadata(rawTitle)

      const card: KanbanCard = {
        id: uuidv4(),
        title: cleanTitle,
        checked,
        dueDate,
        tags: cardTags,
        metadata,
        priority,
      }

      if (inArchive) {
        archivedCards.push(card)
      } else {
        currentColumn.cards.push(card)
      }
      continue
    }

    // --- Card continuation (non-blank, non-heading, non-separator lines indented inside a column) ---
    if (currentColumn && trimmed.length > 0 && !trimmed.startsWith('---') && !trimmed.startsWith('##') && !trimmed.startsWith('***') && !trimmed.startsWith('- [') && trimmed.startsWith('  ')) {
      const prevCards = currentColumn.cards
      if (prevCards.length > 0) {
        const lastCard = prevCards[prevCards.length - 1]
        lastCard.title += '\n' + trimmed
      }
    }
  }

  return { columns, archivedCards, settings }
}

/**
 * Quick check whether Markdown content represents a Kanban board.
 */
export function isKanbanBoard(markdown: string): boolean {
  if (!markdown || !markdown.trim()) return false
  // Match YAML frontmatter between --- markers
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/)
  if (!fmMatch) return false
  const fm = fmMatch[1]
  // Check for kanban-plugin: board (possibly with quotes)
  return /\bkanban-plugin\s*:\s*["']?board["']?/.test(fm)
}

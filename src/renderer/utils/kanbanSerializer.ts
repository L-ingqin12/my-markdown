import { KanbanBoard, KanbanCard, KanbanColumn, getPriorityEmoji } from './kanbanParser'

/**
 * Render metadata (tags, date, field values, priority) back into card title text.
 */
function renderCardMetadata(card: KanbanCard): string {
  const parts: string[] = [card.title]

  if (card.dueDate) {
    parts.push('@' + card.dueDate)
  }

  if (Array.isArray(card.tags)) {
    for (const tag of card.tags) {
      parts.push('#' + tag)
    }
  }

  for (const [key, value] of Object.entries(card.metadata)) {
    parts.push(`[${key}:: ${value}]`)
  }

  const emoji = getPriorityEmoji(card.priority)
  if (emoji) {
    parts.push(emoji)
  }

  return parts.join(' ')
}

/**
 * Serialize a single card to a Markdown list item line.
 */
function serializeCard(card: KanbanCard, indent: string): string {
  const checkMark = card.checked ? 'x' : ' '
  const titleWithMetadata = renderCardMetadata(card)
  return `${indent}- [${checkMark}] ${titleWithMetadata}`
}

/**
 * Serialize a single column with its cards to Markdown.
 */
function serializeColumn(column: KanbanColumn): string[] {
  const lines: string[] = []
  const heading = column.isComplete ? `## ${column.title} **Complete**` : `## ${column.title}`
  lines.push(heading)
  lines.push('')
  for (const card of column.cards) {
    lines.push(serializeCard(card, ''))
  }
  if (column.cards.length > 0) {
    lines.push('')
  }
  return lines
}

/**
 * Serialize KanbanBoard back to an Obsidian-compatible Markdown string.
 */
export function serializeKanban(board: KanbanBoard): string {
  const lines: string[] = []

  // YAML frontmatter
  lines.push('---')
  lines.push('kanban-plugin: board')
  for (const [key, value] of Object.entries(board.settings)) {
    if (key === 'kanban-plugin') continue
    lines.push(`${key}: ${value}`)
  }
  lines.push('---')
  lines.push('')

  // Columns
  for (const column of board.columns) {
    lines.push(...serializeColumn(column))
  }

  // Archive section
  if (board.archivedCards.length > 0) {
    lines.push('***')
    lines.push('')
    lines.push('## Archived')
    lines.push('')
    for (const card of board.archivedCards) {
      lines.push(serializeCard(card, ''))
    }
    lines.push('')
  }

  return lines.join('\n')
}

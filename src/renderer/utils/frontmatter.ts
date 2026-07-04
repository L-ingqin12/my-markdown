/**
 * Multi-dimensional Markdown frontmatter utilities.
 *
 * Provides:
 * - Parse / stringify YAML frontmatter
 * - Document properties panel data
 * - Custom fields in YAML frontmatter
 * - Dataview-like metadata queries
 * - Document relationships via wikilinks
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported frontmatter field types */
export type FrontmatterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | { [key: string]: FrontmatterValue }
  | null
  | undefined

export interface FrontmatterData {
  [key: string]: FrontmatterValue
}

/** A single property descriptor for the properties panel */
export interface DocumentProperty {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'tags' | 'select' | 'multiselect'
  value: FrontmatterValue
  options?: string[] // for select / multiselect
}

/** Dataview query operators */
export type QueryOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | '!contains' | 'between'

export interface QueryCondition {
  field: string
  operator: QueryOperator
  value: FrontmatterValue
}

export interface DataviewQuery {
  conditions: QueryCondition[]
  sortBy?: string
  sortDesc?: boolean
  limit?: number
}

/** Document link (wikilink) for relationship tracking */
export interface DocumentLink {
  target: string
  alias?: string
  type: 'wikilink' | 'tag'
}

// ---------------------------------------------------------------------------
// Known property definitions (customize these or load from preferences)
// ---------------------------------------------------------------------------

const DEFAULT_PROPERTY_DEFINITIONS: DocumentProperty[] = [
  { key: 'title', label: 'Title', type: 'text', value: '' },
  { key: 'created', label: 'Created', type: 'date', value: '' },
  { key: 'updated', label: 'Updated', type: 'date', value: '' },
  { key: 'tags', label: 'Tags', type: 'tags', value: [] as string[] },
  { key: 'aliases', label: 'Aliases', type: 'multiselect', value: [] as string[] },
  { key: 'author', label: 'Author', type: 'text', value: '' },
  { key: 'status', label: 'Status', type: 'select', value: 'draft', options: ['draft', 'review', 'published', 'archived'] },
]

// ---------------------------------------------------------------------------
// Parsing / serialization
// ---------------------------------------------------------------------------

/**
 * Extract the raw YAML frontmatter string from markdown content.
 * Returns undefined if no frontmatter is found.
 */
export function extractFrontmatterRaw(content: string): string | undefined {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  return match ? match[1] : undefined
}

/**
 * Parse YAML frontmatter from markdown content.
 * Returns an empty object if no frontmatter exists.
 *
 * NOTE: For simplicity this uses a basic line‑based parser.
 * In production you would use a library like `js-yaml`.
 */
export function parseFrontmatter(content: string): FrontmatterData {
  const raw = extractFrontmatterRaw(content)
  if (!raw) return {}

  return parseYamlLines(raw)
}

/**
 * Basic YAML line parser (handles flat keys, nested keys, lists, inline arrays).
 */
function parseYamlLines(raw: string): FrontmatterData {
  const result: FrontmatterData = {}
  const lines = raw.split('\n')
  const stack: { obj: FrontmatterData; indent: number }[] = [{ obj: result, indent: -1 }]

  for (const line of lines) {
    const trimmed = line.trimEnd()
    if (trimmed.trim() === '' || trimmed.trim().startsWith('#')) continue

    const indent = line.length - line.trimStart().length

    // Pop stack to the correct indent level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    // Inline array: key: [val1, val2, ...]
    const inlineArrMatch = trimmed.match(/^(\w[\w_-]*?):\s*\[(.*)\]$/)
    if (inlineArrMatch) {
      const key = inlineArrMatch[1]
      const values = inlineArrMatch[2]
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
      const current = stack[stack.length - 1].obj
      current[key] = values
      continue
    }

    // List item:  - value
    const listMatch = trimmed.match(/^\s*-\s+(.*)$/)
    if (listMatch) {
      const parent = stack[stack.length - 1].obj
      // Find the last key that is an array or create one
      const lastKey = Object.keys(parent).pop()
      if (lastKey && Array.isArray(parent[lastKey])) {
        ;(parent[lastKey] as FrontmatterValue[]).push(parseScalar(listMatch[1]))
      }
      continue
    }

    // Key: value
    const kvMatch = trimmed.match(/^(\w[\w_-]*?):\s*(.*)$/)
    if (kvMatch) {
      const key = kvMatch[1]
      const valueStr = kvMatch[2].trim()
      const current = stack[stack.length - 1].obj

      if (valueStr === '' || valueStr === '|' || valueStr === '>') {
        // Nested object or block – push a new sub‑object
        const sub: FrontmatterData = {}
        current[key] = sub
        stack.push({ obj: sub, indent })
      } else if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
        current[key] = valueStr.slice(1, -1)
      } else if (valueStr.startsWith("'") && valueStr.endsWith("'")) {
        current[key] = valueStr.slice(1, -1)
      } else {
        current[key] = parseScalar(valueStr)
      }
    }
  }

  return result
}

function parseScalar(value: string): FrontmatterValue {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null' || value === '~') return null
  const num = Number(value)
  if (!Number.isNaN(num) && value !== '') return num
  // Date check (ISO 8601)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value
  return value
}

/**
 * Convert frontmatter data back to a YAML string (without the `---` fences).
 */
export function stringifyFrontmatter(data: FrontmatterData): string {
  const lines: string[] = []
  for (const [key, value] of Object.entries(data)) {
    serializeValue(key, value, lines, 0)
  }
  return lines.join('\n')
}

function serializeValue(key: string, value: FrontmatterValue, lines: string[], indent: number): void {
  const pad = '  '.repeat(indent)

  if (value === null || value === undefined) {
    lines.push(`${pad}${key}:`)
  } else if (typeof value === 'string') {
    if (value.includes('\n')) {
      lines.push(`${pad}${key}: |`)
      for (const l of value.split('\n')) {
        lines.push(`${pad}  ${l}`)
      }
    } else if (value.includes(':') || value.startsWith('"') || value.startsWith("'")) {
      lines.push(`${pad}${key}: "${value.replace(/"/g, '\\"')}"`)
    } else {
      lines.push(`${pad}${key}: ${value}`)
    }
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    lines.push(`${pad}${key}: ${String(value)}`)
  } else if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${pad}${key}: []`)
    } else {
      lines.push(`${pad}${key}:`)
      for (const item of value) {
        lines.push(`${pad}- ${String(item)}`)
      }
    }
  } else if (typeof value === 'object') {
    lines.push(`${pad}${key}:`)
    for (const [k, v] of Object.entries(value)) {
      serializeValue(k, v, lines, indent + 1)
    }
  }
}

/**
 * Insert or replace YAML frontmatter in markdown content.
 */
export function setFrontmatter(content: string, data: FrontmatterData): string {
  const yaml = stringifyFrontmatter(data)
  if (yaml.trim() === '') return content

  const fm = `---\n${yaml}\n---`

  if (extractFrontmatterRaw(content) !== undefined) {
    // Replace existing frontmatter
    return content.replace(/^---\n[\s\S]*?\n---\n?/, fm + '\n\n')
  }

  // Prepend
  return fm + '\n\n' + content
}

// ---------------------------------------------------------------------------
// Document Properties Panel
// ---------------------------------------------------------------------------

/**
 * Get the property definitions for the properties panel.
 * Merges user-supplied definitions with defaults.
 */
export function getPropertyDefinitions(overrides?: DocumentProperty[]): DocumentProperty[] {
  if (!overrides || overrides.length === 0) return DEFAULT_PROPERTY_DEFINITIONS

  const merged = [...DEFAULT_PROPERTY_DEFINITIONS]
  const overrideMap = new Map(overrides.map((p) => [p.key, p]))

  for (let i = 0; i < merged.length; i++) {
    const ov = overrideMap.get(merged[i].key)
    if (ov) {
      merged[i] = { ...merged[i], ...ov }
      overrideMap.delete(merged[i].key)
    }
  }

  // Add remaining overrides not in defaults
  for (const ov of overrideMap.values()) {
    merged.push(ov)
  }

  return merged
}

/**
 * Extract properties from frontmatter data, using property definitions for metadata.
 */
export function extractProperties(
  content: string,
  definitions?: DocumentProperty[],
): DocumentProperty[] {
  const data = parseFrontmatter(content)
  const props = getPropertyDefinitions(definitions)

  return props.map((def) => ({
    ...def,
    value: data[def.key] !== undefined ? data[def.key] : def.value,
  }))
}

/**
 * Update frontmatter with values from the properties panel.
 */
export function applyProperties(content: string, properties: DocumentProperty[]): string {
  const data = parseFrontmatter(content)
  for (const prop of properties) {
    data[prop.key] = prop.value
  }
  return setFrontmatter(content, data)
}

// ---------------------------------------------------------------------------
// Custom fields
// ---------------------------------------------------------------------------

/**
 * Get the value of a custom field from frontmatter.
 * Supports dot-notation for nested fields, e.g. "metadata.author".
 */
export function getCustomField(content: string, fieldPath: string): FrontmatterValue {
  const data = parseFrontmatter(content)
  const keys = fieldPath.split('.')
  let current: unknown = data

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }

  return current as FrontmatterValue
}

/**
 * Set a custom field in frontmatter.
 * Supports dot-notation for nested fields.
 */
export function setCustomField(
  content: string,
  fieldPath: string,
  value: FrontmatterValue,
): string {
  const data = parseFrontmatter(content)
  const keys = fieldPath.split('.')
  let current = data

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key] as FrontmatterData
  }

  current[keys[keys.length - 1]] = value
  return setFrontmatter(content, data)
}

/**
 * Remove a custom field from frontmatter.
 */
export function removeCustomField(content: string, fieldPath: string): string {
  const data = parseFrontmatter(content)
  const keys = fieldPath.split('.')

  if (keys.length === 1) {
    delete data[keys[0]]
  } else {
    let current = data
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) return content
      current = current[keys[i]] as FrontmatterData
    }
    delete current[keys[keys.length - 1]]
  }

  return setFrontmatter(content, data)
}

// ---------------------------------------------------------------------------
// Dataview-like metadata queries
// ---------------------------------------------------------------------------

/**
 * Check whether a single document's frontmatter satisfies a query condition.
 */
export function matchesCondition(data: FrontmatterData, condition: QueryCondition): boolean {
  const fieldValue = data[condition.field]

  switch (condition.operator) {
    case '==':
      return fieldValue === condition.value
    case '!=':
      return fieldValue !== condition.value
    case '>':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue > condition.value
    case '<':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue < condition.value
    case '>=':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue >= condition.value
    case '<=':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue <= condition.value
    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(String(condition.value))
      }
      if (typeof fieldValue === 'string') {
        return fieldValue.includes(String(condition.value))
      }
      return false
    case '!contains':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(String(condition.value))
      }
      if (typeof fieldValue === 'string') {
        return !fieldValue.includes(String(condition.value))
      }
      return true
    case 'between':
      if (Array.isArray(condition.value) && condition.value.length === 2) {
        const [min, max] = condition.value
        return typeof fieldValue === 'number' && fieldValue >= Number(min) && fieldValue <= Number(max)
      }
      return false
    default:
      return false
  }
}

/**
 * Filter a list of frontmatter datasets using a dataview-like query.
 */
export function queryDocuments(
  documents: FrontmatterData[],
  query: DataviewQuery,
): FrontmatterData[] {
  let results = documents.filter((doc) =>
    query.conditions.every((cond) => matchesCondition(doc, cond)),
  )

  // Sorting
  if (query.sortBy) {
    results = [...results].sort((a, b) => {
      const aVal = a[query.sortBy!]
      const bVal = b[query.sortBy!]

      // Handle undefined/null
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return query.sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return query.sortDesc ? bVal - aVal : aVal - bVal
      }
      return 0
    })
  }

  // Limit
  if (query.limit && query.limit > 0) {
    results = results.slice(0, query.limit)
  }

  return results
}

/**
 * Parse a human-readable query string into a DataviewQuery.
 * Supports simple syntax: field == value, field > 5, etc.
 */
export function parseQueryString(queryStr: string): DataviewQuery {
  const conditions: QueryCondition[] = []
  const parts = queryStr.split(',').map((p) => p.trim()).filter(Boolean)

  for (const part of parts) {
    const operators: QueryOperator[] = ['!=', '>=', '<=', '==', '>', '<']
    let matched = false

    for (const op of operators) {
      const idx = part.indexOf(op)
      if (idx > 0) {
        const field = part.slice(0, idx).trim()
        const valueStr = part.slice(idx + op.length).trim()
        conditions.push({
          field,
          operator: op,
          value: parseScalar(valueStr),
        })
        matched = true
        break
      }
    }

    // Handle "contains" and "!contains"
    if (!matched) {
      const containsMatch = part.match(/^(\w[\w_-]*)\s+(contains|!contains)\s+(.+)$/)
      if (containsMatch) {
        conditions.push({
          field: containsMatch[1],
          operator: containsMatch[2] as 'contains' | '!contains',
          value: parseScalar(containsMatch[3]),
        })
      }
    }
  }

  return { conditions }
}

// ---------------------------------------------------------------------------
// Document relationships via wikilinks
// ---------------------------------------------------------------------------

/**
 * Extract all document links (wikilinks and tags) from markdown content.
 */
export function extractDocumentLinks(content: string): DocumentLink[] {
  const links: DocumentLink[] = []

  // Wikilinks: [[target]] or [[target|alias]]
  const wikiRegex = /\[\[([^\]]+?)(?:\|([^\]]+?))?\]\]/g
  let match: RegExpExecArray | null
  while ((match = wikiRegex.exec(content)) !== null) {
    links.push({
      target: match[1].trim(),
      alias: match[2]?.trim(),
      type: 'wikilink',
    })
  }

  // Tags: #tag (but not inside wikilinks or code)
  const tagRegex = /(?<!\w)#([a-zA-Z一-鿿][\w一-鿿/-]*)/g
  while ((match = tagRegex.exec(content)) !== null) {
    // Skip tags inside code blocks or inline code
    const prefix = content.slice(0, match.index)
    const backticksBefore = (prefix.match(/`/g) || []).length
    if (backticksBefore % 2 === 0) {
      links.push({
        target: match[1],
        type: 'tag',
      })
    }
  }

  return links
}

/**
 * Given a list of documents (each with their content), build a relationship graph.
 * Returns a map from document identifier to its linked document identifiers.
 */
export function buildRelationshipGraph(
  documents: { id: string; content: string }[],
): Map<string, { outgoing: DocumentLink[]; incoming: string[] }> {
  const graph = new Map<string, { outgoing: DocumentLink[]; incoming: string[] }>()

  // Index all documents by their target name
  const docIndex = new Map<string, string>()
  for (const doc of documents) {
    const fm = parseFrontmatter(doc.content)
    const title = String(fm.title || fm.aliases || doc.id)
    docIndex.set(doc.id, doc.id)
    if (title && title !== doc.id) {
      docIndex.set(title, doc.id)
    }
  }

  // Build outgoing + incoming
  for (const doc of documents) {
    const outgoing = extractDocumentLinks(doc.content)
    if (!graph.has(doc.id)) {
      graph.set(doc.id, { outgoing: [], incoming: [] })
    }
    graph.get(doc.id)!.outgoing = outgoing

    for (const link of outgoing) {
      const targetId = docIndex.get(link.target) || link.target
      if (!graph.has(targetId)) {
        graph.set(targetId, { outgoing: [], incoming: [] })
      }
      graph.get(targetId)!.incoming.push(doc.id)
    }
  }

  return graph
}

/**
 * Find backlinks (documents that link to the given document).
 */
export function findBacklinks(
  documentId: string,
  documents: { id: string; content: string }[],
): { sourceId: string; links: DocumentLink[] }[] {
  const graph = buildRelationshipGraph(documents)
  const node = graph.get(documentId)
  if (!node) return []

  return node.incoming
    .map((sourceId) => {
      const sourceDoc = documents.find((d) => d.id === sourceId)
      if (!sourceDoc) return null
      const links = extractDocumentLinks(sourceDoc.content).filter(
        (l) => l.type === 'wikilink' && l.target === documentId,
      )
      return { sourceId, links }
    })
    .filter((item): item is { sourceId: string; links: DocumentLink[] } => item !== null)
}

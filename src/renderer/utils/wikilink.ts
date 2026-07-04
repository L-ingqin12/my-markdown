// Wikilink and tag parsing utilities

export function extractWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    const target = match[1].split('|')[0].trim() // handle [[target|alias]]
    if (target && !links.includes(target)) {
      links.push(target)
    }
  }
  return links
}

export function extractTags(content: string): string[] {
  // Extract from YAML frontmatter first
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
  const tags = new Set<string>()

  if (fmMatch) {
    const fm = fmMatch[1]
    // tags: [a, b, c] or tags:\n  - a\n  - b
    const tagsLine = fm.match(/^tags:\s*\[(.*?)\]/m)
    if (tagsLine) {
      tagsLine[1].split(',').forEach(t => tags.add(t.trim().replace(/["']/g, '')))
    }
    const tagsList = fm.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m)
    if (tagsList) {
      tagsList[1].split('\n').forEach(line => {
        const t = line.replace(/^\s+-\s+/, '').trim()
        if (t) tags.add(t)
      })
    }
  }

  // Also extract inline #tags from body
  const bodyRegex = /(?<!\w)#([a-zA-Z一-鿿][\w一-鿿/-]*)/g
  let match
  while ((match = bodyRegex.exec(content)) !== null) {
    tags.add(match[1])
  }

  return Array.from(tags)
}

export function resolveWikiLinkTarget(linkText: string): { fileName: string; heading?: string } {
  // Strip alias notation: [[target|Alias]]
  const withoutAlias = linkText.split('|')[0].trim()
  const parts = withoutAlias.split('#')
  return {
    fileName: parts[0].trim(),
    heading: parts[1]?.trim()
  }
}

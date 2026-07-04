import { describe, it, expect } from 'vitest'
import { extractWikiLinks, extractTags, resolveWikiLinkTarget } from '../../src/renderer/utils/wikilink'

describe('extractWikiLinks', () => {
  it('extracts simple wikilinks', () => {
    const result = extractWikiLinks('See [[getting-started]] for details')
    expect(result).toEqual(['getting-started'])
  })

  it('extracts multiple wikilinks', () => {
    const result = extractWikiLinks('[[doc1]] and [[doc2]] and [[doc3]]')
    expect(result).toEqual(['doc1', 'doc2', 'doc3'])
  })

  it('handles wikilinks with aliases', () => {
    const result = extractWikiLinks('See [[advanced-guide|Advanced Guide]]')
    expect(result).toEqual(['advanced-guide'])
  })

  it('deduplicates identical links', () => {
    const result = extractWikiLinks('[[doc1]] and [[doc1]] again')
    expect(result).toEqual(['doc1'])
  })

  it('handles wikilinks with heading anchors', () => {
    const result = extractWikiLinks('[[doc1#section-1]] and [[doc2#intro|Intro]]')
    expect(result).toContain('doc1#section-1')
  })

  it('returns empty array for no links', () => {
    const result = extractWikiLinks('Just plain text here')
    expect(result).toEqual([])
  })

  it('handles empty string', () => {
    expect(extractWikiLinks('')).toEqual([])
  })
})

describe('extractTags', () => {
  it('extracts inline #tags', () => {
    const result = extractTags('Some text with #react and #typescript tags')
    expect(result).toContain('react')
    expect(result).toContain('typescript')
  })

  it('extracts tags from YAML frontmatter array', () => {
    const content = `---
title: Test
tags: [react, typescript, tutorial]
---
Some content`
    const result = extractTags(content)
    expect(result).toContain('react')
    expect(result).toContain('typescript')
    expect(result).toContain('tutorial')
  })

  it('extracts tags from YAML frontmatter list', () => {
    const content = `---
tags:
  - react
  - tutorial
  - advanced
---
Content`
    const result = extractTags(content)
    expect(result).toContain('react')
    expect(result).toContain('tutorial')
    expect(result).toContain('advanced')
  })

  it('deduplicates tags from frontmatter and body', () => {
    const content = `---
tags: [react]
---
More #react here`
    const result = extractTags(content)
    expect(result.filter(t => t === 'react').length).toBe(1)
  })

  it('does not match code-like patterns as tags', () => {
    const result = extractTags('const # not a tag')
    expect(result.filter(t => t.startsWith('not')).length).toBe(0)
  })

  it('handles no tags', () => {
    expect(extractTags('plain text')).toEqual([])
  })
})

describe('resolveWikiLinkTarget', () => {
  it('resolves simple filename', () => {
    const result = resolveWikiLinkTarget('getting-started')
    expect(result).toEqual({ fileName: 'getting-started', heading: undefined })
  })

  it('resolves filename with heading', () => {
    const result = resolveWikiLinkTarget('doc#installation')
    expect(result).toEqual({ fileName: 'doc', heading: 'installation' })
  })

  it('handles alias notation', () => {
    const result = resolveWikiLinkTarget('long-doc-name|Short Name')
    expect(result.fileName).toBe('long-doc-name')
  })
})

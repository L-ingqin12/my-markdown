import { describe, it, expect } from 'vitest'
import { buildGraphData } from '../../src/renderer/utils/graph'

describe('buildGraphData', () => {
  const documents = [
    { path: '/docs/getting-started.md', content: '---\ntags: [tutorial]\n---\n\n## Intro\n\nSee [[installation]] for setup.' },
    { path: '/docs/installation.md', content: '---\ntags: [setup, guide]\n---\n\n## Install\n\nFirst read [[getting-started]]. Also check [[advanced]].' },
    { path: '/docs/advanced.md', content: '---\ntags: [advanced, tutorial]\n---\n\n## Advanced\n\nRequires [[installation]] and [[getting-started]].' },
    { path: '/docs/standalone.md', content: '# Standalone\n\nNo links here.' }
  ]

  it('builds graph with correct node count', () => {
    const { nodes, edges } = buildGraphData(documents)
    expect(nodes).toHaveLength(4)
  })

  it('creates edges for wikilinks', () => {
    const { nodes, edges } = buildGraphData(documents)
    expect(edges.length).toBeGreaterThan(0)
  })

  it('assigns tags from frontmatter', () => {
    const { nodes } = buildGraphData(documents)
    const tutorialNode = nodes.find(n => n.label === 'getting-started')
    expect(tutorialNode).toBeDefined()
    expect(tutorialNode!.tags).toContain('tutorial')
  })

  it('marks current document', () => {
    const { nodes } = buildGraphData(documents, '/docs/getting-started.md')
    const current = nodes.find(n => n.path === '/docs/getting-started.md')
    expect(current!.isCurrent).toBe(true)
    const others = nodes.filter(n => n.path !== '/docs/getting-started.md')
    others.forEach(n => expect(n.isCurrent).toBe(false))
  })

  it('standalone doc has no edges', () => {
    const { nodes, edges } = buildGraphData([documents[3]])
    expect(nodes).toHaveLength(1)
    expect(edges).toHaveLength(0)
  })

  it('handles empty document list', () => {
    const { nodes, edges } = buildGraphData([])
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })

  it('creates unique edge ids', () => {
    const { edges } = buildGraphData(documents)
    const edgeIds = edges.map(e => e.id)
    const uniqueIds = new Set(edgeIds)
    expect(uniqueIds.size).toBe(edgeIds.length)
  })
})

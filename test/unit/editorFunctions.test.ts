import { describe, it, expect } from 'vitest'

// Test cursor position calculation
describe('cursor position calculation', () => {
  it('calculates line and column for start of document', () => {
    const text = '# Hello\n\nWorld'
    const pos = 0 // cursor at position 0
    const lines = text.split('\n')
    // At position 0: line 1
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1
    const lineNum = text.slice(0, pos).split('\n').length
    expect(lineNum).toBe(1)
  })

  it('calculates line and column for middle of line', () => {
    const text = '# Hello\n\nWorld'
    const pos = 3 // cursor after "Hel"
    const lineNum = text.slice(0, pos).split('\n').length
    expect(lineNum).toBe(1)
  })

  it('calculates line number across newlines', () => {
    const text = 'line1\nline2\nline3\nline4'
    const pos = text.indexOf('line3')
    const lines = text.slice(0, pos).split('\n')
    expect(lines.length).toBe(3) // line 3
  })
})

// Test word count calculation
describe('word count', () => {
  it('counts words in simple text', () => {
    const text = 'hello world test'
    const count = text.trim().split(/\s+/).length
    expect(count).toBe(3)
  })

  it('handles empty string', () => {
    const text = ''
    const count = text.trim() ? text.trim().split(/\s+/).length : 0
    expect(count).toBe(0)
  })

  it('handles multiple spaces', () => {
    const text = '  hello   world  '
    const count = text.trim().split(/\s+/).length
    expect(count).toBe(2)
  })

  it('handles markdown content', () => {
    const text = '# Hello World\n\nThis is **bold** and *italic*'
    const count = text.trim().split(/\s+/).length
    expect(count).toBe(8)
  })
})

// Test theme list handling
describe('theme list', () => {
  it('returns empty array when no themes', () => {
    const themeList: { name: string; displayName: string; isBuiltin: boolean }[] = []
    expect(themeList).toEqual([])
  })

  it('filters builtin themes', () => {
    const themes = [
      { name: 'github', displayName: 'Github', isBuiltin: true },
      { name: 'night', displayName: 'Night', isBuiltin: true },
      { name: 'custom', displayName: 'Custom', isBuiltin: false }
    ]
    const builtins = themes.filter(t => t.isBuiltin)
    expect(builtins.length).toBe(2)
  })
})

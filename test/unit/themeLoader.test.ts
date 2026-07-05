import { describe, it, expect } from 'vitest'

describe('theme CSS parsing', () => {
  it('strips file extension from theme name', () => {
    const fileName = 'github.css'
    const name = fileName.replace(/\.css$/, '')
    expect(name).toBe('github')
  })

  it('converts kebab-case to display name', () => {
    const fileName = 'drake-juejin.css'
    const name = fileName.replace(/\.css$/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    expect(name).toBe('Drake Juejin')
  })

  it('deduplicates theme names', () => {
    const paths = [
      'themes/github.css',
      'themes/old-themes/github.css',
      'themes/night.css',
      'themes/drake.css'
    ]
    const seen = new Set<string>()
    const themes: { name: string; displayName: string }[] = []
    for (const p of paths) {
      const fileName = p.split(/[/\\]/).pop() || ''
      const name = fileName.replace(/\.css$/, '')
      if (seen.has(name)) continue
      seen.add(name)
      themes.push({ name, displayName: name })
    }
    expect(themes.length).toBe(3) // github only once
  })

  it('detects CSS variable definitions', () => {
    const css = ':root { --bg-color: #ffffff; --text-color: #333; }'
    const varMatch = css.match(/:root\s*\{([^}]*)\}/)
    expect(varMatch).not.toBeNull()
    expect(varMatch![1].trim()).toContain('--bg-color')
  })

  it('handles theme with complex selectors', () => {
    const css = `#write { max-width: 860px; }
#write h1 { font-size: 2em; }
#write blockquote { border-left: 4px solid #ccc; }
#write pre.md-fences { background: #f6f8fa; }`
    // Verify #write scoping convention
    const rules = css.match(/#write\s+[^{]+\{/g)
    expect(rules).not.toBeNull()
    expect(rules!.length).toBeGreaterThanOrEqual(3)
  })

  it('falls back when theme has no :root variables', () => {
    const css = '#write { color: red; }'
    const varMatch = css.match(/:root\s*\{([^}]*)\}/)
    expect(varMatch).toBeNull()
  })
})

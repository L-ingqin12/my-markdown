import { describe, it, expect } from 'vitest'
import { markdownToHtml } from '../../src/renderer/utils/markdown'

describe('markdownToHtml', () => {
  it('converts headings', async () => {
    const html = await markdownToHtml('# Hello World')
    expect(html).toContain('<h1>')
    expect(html).toContain('Hello World')
  })

  it('converts bold and italic', async () => {
    const html = await markdownToHtml('This is **bold** and *italic*')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })

  it('converts code blocks', async () => {
    const html = await markdownToHtml('```javascript\nconst x = 1;\n```')
    expect(html).toContain('javascript')
    // rehype-highlight wraps tokens in spans
    expect(html).toContain('const')
    expect(html).toContain('<code')
  })

  it('converts inline code', async () => {
    const html = await markdownToHtml('Use `const` keyword')
    expect(html).toContain('<code>const</code>')
  })

  it('converts links', async () => {
    const html = await markdownToHtml('[GitHub](https://github.com)')
    expect(html).toContain('<a href="https://github.com"')
    expect(html).toContain('GitHub')
  })

  it('converts images', async () => {
    const html = await markdownToHtml('![logo](https://example.com/logo.png)')
    expect(html).toContain('<img')
    expect(html).toContain('logo.png')
  })

  it('converts lists', async () => {
    const html = await markdownToHtml('- Item 1\n- Item 2\n\n1. First\n2. Second')
    expect(html).toContain('<ul>')
    expect(html).toContain('<ol>')
    expect(html).toContain('Item 1')
    expect(html).toContain('First')
  })

  it('converts blockquotes', async () => {
    const html = await markdownToHtml('> This is a quote')
    expect(html).toContain('<blockquote>')
  })

  it('converts tables (GFM)', async () => {
    const html = await markdownToHtml('| A | B |\n| - | - |\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>A</th>')
    expect(html).toContain('<td>1</td>')
  })

  it('handles empty string', async () => {
    const html = await markdownToHtml('')
    expect(html).not.toContain('<')
  })

  it('converts strikethrough', async () => {
    const html = await markdownToHtml('~~deleted~~')
    expect(html).toContain('<del>')
  })
})

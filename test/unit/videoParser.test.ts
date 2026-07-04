import { describe, it, expect } from 'vitest'
import { parseVideoEmbed, parseVideoBlock, renderVideoHtml, renderVideoMarkdown, findVideoEmbeds } from '../../src/renderer/utils/video-parser'

describe('parseVideoEmbed', () => {
  it('parses basic inline format', () => {
    const embed = parseVideoEmbed('!video{https://example.com/video.mp4}')
    expect(embed).not.toBeNull()
    expect(embed!.url).toBe('https://example.com/video.mp4')
    expect(embed!.width).toBe(640)
    expect(embed!.height).toBe(360)
  })

  it('parses with size params', () => {
    const embed = parseVideoEmbed('!video{https://x.com/v.mp4|width=1280|height=720}')
    expect(embed!.width).toBe(1280)
    expect(embed!.height).toBe(720)
  })

  it('parses autoplay and loop', () => {
    const embed = parseVideoEmbed('!video{https://x.com/v.mp4|autoplay|loop|muted}')
    expect(embed!.autoplay).toBe(true)
    expect(embed!.loop).toBe(true)
    expect(embed!.muted).toBe(true)
  })

  it('returns null for non-video text', () => {
    expect(parseVideoEmbed('regular text')).toBeNull()
  })
})

describe('parseVideoBlock', () => {
  it('parses fenced block format', () => {
    const result = parseVideoBlock(':::video\nhttps://x.com/v.mp4|width=800\n:::')
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://x.com/v.mp4')
    expect(result!.width).toBe(800)
  })

  it('parses inline block format', () => {
    const result = parseVideoBlock(':::video https://y.com/v.webm :::')
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://y.com/v.webm')
  })

  it('parses markdown image with video extension', () => {
    const result = parseVideoBlock('![demo](https://x.com/demo.mp4)')
    expect(result).not.toBeNull()
    expect(result!.url).toBe('https://x.com/demo.mp4')
  })
})

describe('renderVideoHtml', () => {
  it('renders video tag', () => {
    const html = renderVideoHtml({
      url: 'https://x.com/v.mp4',
      width: 640, height: 360,
      autoplay: false, loop: false, muted: false, controls: true
    })
    expect(html).toContain('<video')
    expect(html).toContain('width="640"')
    expect(html).toContain('controls')
    expect(html).toContain('https://x.com/v.mp4')
  })

  it('includes autoplay attributes', () => {
    const html = renderVideoHtml({
      url: 'https://x.com/v.mp4',
      width: 640, height: 360,
      autoplay: true, loop: true, muted: true, controls: false
    })
    expect(html).toContain('autoplay')
    expect(html).toContain('loop')
    expect(html).toContain('muted')
  })
})

describe('renderVideoMarkdown', () => {
  it('round-trips embed to markdown', () => {
    const embed = {
      url: 'https://x.com/v.mp4',
      width: 800, height: 600,
      autoplay: true, loop: false, muted: true, controls: true
    }
    const md = renderVideoMarkdown(embed)
    const parsed = parseVideoEmbed(md)
    expect(parsed!.url).toBe('https://x.com/v.mp4')
    expect(parsed!.width).toBe(800)
    expect(parsed!.autoplay).toBe(true)
  })
})

describe('findVideoEmbeds', () => {
  it('finds inline video in markdown', () => {
    const content = 'Some text !video{https://x.com/a.mp4} more text'
    const embeds = findVideoEmbeds(content)
    expect(embeds).toHaveLength(1)
    expect(embeds[0].embed.url).toBe('https://x.com/a.mp4')
  })

  it('finds multiple embeds', () => {
    const content = `!video{https://a.com/1.mp4}
!video{https://b.com/2.webm|autoplay}`
    const embeds = findVideoEmbeds(content)
    expect(embeds).toHaveLength(2)
  })

  it('finds image-format video', () => {
    const content = 'Check this: ![demo](https://x.com/clip.mp4)'
    const embeds = findVideoEmbeds(content)
    expect(embeds).toHaveLength(1)
  })
})

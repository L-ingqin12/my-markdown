/**
 * Video embed support for Markdown.
 * Formats:
 *   !video{url}           - inline video
 *   !video{url|width=640|height=360|autoplay|loop|muted}
 *   :::video url          - block video
 *   :::                   (fenced block)
 */

export interface VideoEmbed {
  url: string
  width: number
  height: number
  autoplay: boolean
  loop: boolean
  muted: boolean
  controls: boolean
}

export function parseVideoEmbed(text: string): VideoEmbed | null {
  // Inline format: !video{url|params}
  const inlineMatch = text.match(/^!video\{([^}]+)\}$/)
  if (inlineMatch) {
    return parseVideoParams(inlineMatch[1])
  }

  return null
}

export function parseVideoBlock(content: string): VideoEmbed | null {
  // Block format: :::video\nurl\n:::
  const blockMatch = content.match(/^:::video\s*\n(.+?)\n:::$/m)
  if (blockMatch) {
    return parseVideoParams(blockMatch[1].trim())
  }

  // URL-only format
  const urlMatch = content.match(/^:::video\s+(.+?)\s*:::$/m)
  if (urlMatch) {
    return parseVideoParams(urlMatch[1].trim())
  }

  // Markdown image with video extension
  const imgMatch = content.match(/^!\[.*?\]\((.+\.(mp4|webm|mov|ogg|ogv))\)$/)
  if (imgMatch) {
    return parseVideoParams(imgMatch[1])
  }

  return null
}

function parseVideoParams(input: string): VideoEmbed {
  const parts = input.split('|').map(p => p.trim())
  const url = parts[0]
  const embed: VideoEmbed = {
    url,
    width: 640,
    height: 360,
    autoplay: false,
    loop: false,
    muted: false,
    controls: true
  }

  for (const part of parts.slice(1)) {
    if (part === 'autoplay') embed.autoplay = true
    else if (part === 'loop') embed.loop = true
    else if (part === 'muted') embed.muted = true
    else if (part === 'nocontrols') embed.controls = false
    else if (part.startsWith('width=')) embed.width = parseInt(part.slice(6)) || 640
    else if (part.startsWith('height=')) embed.height = parseInt(part.slice(7)) || 360
  }

  return embed
}

export function renderVideoHtml(embed: VideoEmbed): string {
  const attrs = [
    embed.width ? `width="${embed.width}"` : '',
    embed.height ? `height="${embed.height}"` : '',
    embed.autoplay ? 'autoplay' : '',
    embed.loop ? 'loop' : '',
    embed.muted ? 'muted' : '',
    embed.controls ? 'controls' : ''
  ].filter(Boolean).join(' ')

  return `<video ${attrs} style="max-width:100%;border-radius:6px" preload="metadata">
  <source src="${escHtml(embed.url)}">
  Your browser does not support the video tag.
</video>`
}

export function renderVideoMarkdown(embed: VideoEmbed): string {
  const params = [
    `width=${embed.width}`,
    `height=${embed.height}`,
    embed.autoplay ? 'autoplay' : '',
    embed.loop ? 'loop' : '',
    embed.muted ? 'muted' : ''
  ].filter(Boolean).join('|')

  return `!video{${embed.url}|${params}}`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Scan markdown content and find all video embeds.
 */
export function findVideoEmbeds(content: string): Array<{ index: number; embed: VideoEmbed; raw: string }> {
  const results: Array<{ index: number; embed: VideoEmbed; raw: string }> = []

  // !video{...} format
  const inlineRegex = /!video\{([^}]+)\}/g
  let match
  while ((match = inlineRegex.exec(content)) !== null) {
    const embed = parseVideoEmbed(match[0])
    if (embed) {
      results.push({ index: match.index, embed, raw: match[0] })
    }
  }

  // :::video blocks
  const blockRegex = /:::video\s*\n([\s\S]*?)\n:::/g
  while ((match = blockRegex.exec(content)) !== null) {
    const embed = parseVideoBlock(match[0])
    if (embed) {
      results.push({ index: match.index, embed, raw: match[0] })
    }
  }

  // ![alt](video.mp4) format
  const imgRegex = /!\[.*?\]\((.+\.(mp4|webm|mov|ogg|ogv))\)/g
  while ((match = imgRegex.exec(content)) !== null) {
    const embed = parseVideoParams(match[1])
    if (embed) {
      results.push({ index: match.index, embed, raw: match[0] })
    }
  }

  return results
}

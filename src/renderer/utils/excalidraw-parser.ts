import LZString from 'lz-string'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types'

export interface ExcalidrawScene {
  type: 'excalidraw'
  version: number
  source: string
  elements: ExcalidrawElement[]
  appState: AppState
  files: BinaryFiles
}

export function parseExcalidrawBlocks(content: string): Map<string, ExcalidrawScene> {
  const blocks = new Map<string, ExcalidrawScene>()
  const regex = /```excalidraw\s*\n([\s\S]*?)```/g

  let idx = 0
  let match
  while ((match = regex.exec(content)) !== null) {
    const blockContent = match[1].trim()
    const scene = parseExcalidrawContent(blockContent)
    if (scene) {
      // Use index to make key unique (same content = different blocks)
      blocks.set(`block-${idx}-${match.index}`, scene)
      idx++
    }
  }

  return blocks
}

function parseExcalidrawContent(codeBlockContent: string): ExcalidrawScene | null {
  // Try plain JSON first
  try {
    const data = JSON.parse(codeBlockContent)
    if (data.type === 'excalidraw' && Array.isArray(data.elements)) {
      return data as ExcalidrawScene
    }
  } catch { /* not plain JSON */ }

  // Try LZString decompression
  try {
    const withoutNewlines = codeBlockContent.replace(/\n{2,}/g, '').trim()
    const json = LZString.decompressFromBase64(withoutNewlines)
    if (json) {
      const data = JSON.parse(json)
      if (data.type === 'excalidraw' && Array.isArray(data.elements)) {
        return data as ExcalidrawScene
      }
    }
  } catch { /* not compressed either */ }

  return null
}

export function serializeExcalidrawBlock(sceneData: ExcalidrawScene): string {
  const json = JSON.stringify(sceneData)
  // For small scenes, use plain JSON
  if (json.length < 2000) {
    return '```excalidraw\n' + json + '\n```\n'
  }
  // For larger scenes, compress with LZString
  const compressed = LZString.compressToBase64(json)
  const chunked = compressed.match(/.{1,256}/g)?.join('\n\n') || compressed
  return '```excalidraw\n' + chunked + '\n```\n'
}

export function isExcalidrawBlock(codeBlock: string): boolean {
  return /^```excalidraw/.test(codeBlock.trim())
}

export function createEmptyScene(): ExcalidrawScene {
  return {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements: [],
    appState: { viewBackgroundColor: '#ffffff', gridSize: null },
    files: {}
  }
}

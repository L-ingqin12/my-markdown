import { describe, it, expect } from 'vitest'
import {
  parseExcalidrawBlocks,
  serializeExcalidrawBlock,
  isExcalidrawBlock,
  createEmptyScene
} from '../../src/renderer/utils/excalidraw-parser'
import type { ExcalidrawScene } from '../../src/renderer/utils/excalidraw-parser'

const simpleScene: ExcalidrawScene = {
  type: 'excalidraw',
  version: 2,
  source: 'https://excalidraw.com',
  elements: [
    {
      id: 'elem-1', type: 'rectangle',
      x: 100, y: 100, width: 200, height: 100, angle: 0,
      strokeColor: '#1e1e1e', backgroundColor: '#a5d8ff',
      fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid',
      roughness: 1, opacity: 100,
      groupIds: [], frameId: null, index: 'a0',
      roundness: { type: 3 }, seed: 1234567890,
      version: 1, versionNonce: 987654321,
      isDeleted: false, boundElements: null,
      updated: 1706659200000, link: null, locked: false
    }
  ],
  appState: { viewBackgroundColor: '#ffffff', gridSize: null },
  files: {}
}

describe('parseExcalidrawBlocks', () => {
  it('parses plain JSON excalidraw block', () => {
    const json = JSON.stringify(simpleScene)
    const md = '```excalidraw\n' + json + '\n```'
    const blocks = parseExcalidrawBlocks(md)
    expect(blocks.size).toBe(1)
    const scene = blocks.values().next().value
    expect(scene.type).toBe('excalidraw')
    expect(scene.elements).toHaveLength(1)
  })

  it('returns empty map for no blocks', () => {
    expect(parseExcalidrawBlocks('# Just markdown').size).toBe(0)
  })

  it('handles multiple blocks', () => {
    const json = JSON.stringify(simpleScene)
    const md =
      '```excalidraw\n' + json + '\n```\n\n' +
      'Some text\n\n' +
      '```excalidraw\n' + json + '\n```'
    expect(parseExcalidrawBlocks(md).size).toBe(2)
  })

  it('rejects invalid JSON', () => {
    const md = '```excalidraw\n{not valid json}\n```'
    expect(parseExcalidrawBlocks(md).size).toBe(0)
  })

  it('rejects JSON without excalidraw type', () => {
    const md = '```excalidraw\n{"type":"not-excalidraw","elements":[]}\n```'
    expect(parseExcalidrawBlocks(md).size).toBe(0)
  })

  it('rejects JSON without elements array', () => {
    const md = '```excalidraw\n{"type":"excalidraw"}\n```'
    expect(parseExcalidrawBlocks(md).size).toBe(0)
  })
})

describe('serializeExcalidrawBlock', () => {
  it('serializes to fenced code block', () => {
    const result = serializeExcalidrawBlock(simpleScene)
    expect(result).toContain('```excalidraw')
    expect(result).toContain('"type":"excalidraw"')
    expect(result).toContain('"elements"')
  })

  it('uses plain JSON for small scenes', () => {
    const result = serializeExcalidrawBlock(simpleScene)
    // Should be plain readable JSON (not compressed) for small scenes
    expect(result).toContain('"x":100')
  })
})

describe('isExcalidrawBlock', () => {
  it('detects excalidraw block', () => {
    expect(isExcalidrawBlock('```excalidraw\n{...}\n```')).toBe(true)
  })

  it('rejects normal code blocks', () => {
    expect(isExcalidrawBlock('```javascript\nconsole.log("hi")\n```')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isExcalidrawBlock('')).toBe(false)
  })
})

describe('createEmptyScene', () => {
  it('creates valid empty scene', () => {
    const scene = createEmptyScene()
    expect(scene.type).toBe('excalidraw')
    expect(scene.version).toBe(2)
    expect(scene.elements).toEqual([])
    expect(scene.appState.viewBackgroundColor).toBe('#ffffff')
    expect(scene.files).toEqual({})
  })
})

import { describe, it, expect } from 'vitest'
import { serializeKanban } from '../../src/renderer/utils/kanbanSerializer'
import { parseKanban } from '../../src/renderer/utils/kanbanParser'

describe('serializeKanban', () => {
  it('serializes back to valid kanban markdown', () => {
    const board = {
      columns: [
        {
          id: 'col-1', title: 'Todo', isComplete: false,
          cards: [
            { id: 'card-1', title: 'Task 1', checked: false, tags: [], metadata: {} },
            { id: 'card-2', title: 'Task 2', checked: false, tags: [], metadata: {} }
          ]
        },
        {
          id: 'col-2', title: 'Done', isComplete: true,
          cards: [
            { id: 'card-3', title: 'Done task', checked: true, tags: [], metadata: {} }
          ]
        }
      ],
      archivedCards: [
        { id: 'card-4', title: 'Old', checked: true, tags: [], metadata: {} }
      ],
      settings: { 'lane-width': 300 }
    }

    const md = serializeKanban(board)
    expect(md).toContain('kanban-plugin: board')
    expect(md).toContain('## Todo')
    expect(md).toContain('- [ ] Task 1')
    expect(md).toContain('- [ ] Task 2')
    expect(md).toContain('## Done **Complete**')
    expect(md).toContain('- [x] Done task')
    expect(md).toContain('***')
    expect(md).toContain('## Archive')
    expect(md).toContain('- [x] Old')
  })

  it('round-trips through parse and serialize', () => {
    const original = `---
kanban-plugin: board
---

## Backlog
- [ ] Feature A
- [ ] Feature B

## In Progress
- [ ] Bug fix

## Done **Complete**
- [x] v1.0 shipped

***

## Archive
- [x] Initial setup`

    const board = parseKanban(original)
    const roundTripped = serializeKanban(board)
    const reParsed = parseKanban(roundTripped)

    expect(reParsed.columns).toHaveLength(3)
    expect(reParsed.columns[0].title).toBe('Backlog')
    expect(reParsed.columns[0].cards).toHaveLength(2)
    expect(reParsed.archivedCards).toHaveLength(1)
  })

  it('preserves card metadata in serialization', () => {
    const board = {
      columns: [{
        id: 'c1', title: 'Todo', isComplete: false,
        cards: [{
          id: 'card-1', title: 'Task with metadata', checked: false,
          tags: ['bug', 'urgent'],
          dueDate: '2025-12-31',
          priority: 'high' as const,
          metadata: { assignee: 'alice' }
        }]
      }],
      archivedCards: [],
      settings: {}
    }

    const md = serializeKanban(board)
    expect(md).toContain('#bug')
    expect(md).toContain('#urgent')
    expect(md).toContain('@2025-12-31')
    expect(md).toContain('[assignee:: alice]')
  })

  it('handles empty board', () => {
    const board = { columns: [], archivedCards: [], settings: {} }
    const md = serializeKanban(board)
    expect(md).toContain('kanban-plugin: board')
  })
})

import { describe, it, expect } from 'vitest'
import { parseKanban, isKanbanBoard } from '../../src/renderer/utils/kanbanParser'

const basicKanban = `---
kanban-plugin: board
---

## Backlog
- [ ] Task one
- [ ] Task two

## In Progress
- [ ] Task three

## Done **Complete**
- [x] Completed task

***

## Archive
- [x] Old task`

describe('isKanbanBoard', () => {
  it('detects kanban board', () => {
    expect(isKanbanBoard(basicKanban)).toBe(true)
  })

  it('rejects non-kanban markdown', () => {
    expect(isKanbanBoard('# Just a document\n\nSome text.')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isKanbanBoard('')).toBe(false)
  })

  it('requires kanban-plugin in frontmatter', () => {
    const md = `---
title: Not a Kanban
---
## Column
- [ ] Card`
    expect(isKanbanBoard(md)).toBe(false)
  })
})

describe('parseKanban', () => {
  it('parses columns and cards', () => {
    const board = parseKanban(basicKanban)
    expect(board.columns).toHaveLength(3)
    expect(board.columns[0].title).toBe('Backlog')
    expect(board.columns[0].cards).toHaveLength(2)
    expect(board.columns[0].cards[0].title).toBe('Task one')
    expect(board.columns[0].cards[0].checked).toBe(false)
  })

  it('detects completed cards', () => {
    const board = parseKanban(basicKanban)
    const doneCol = board.columns.find(c => c.title === 'Done')
    expect(doneCol).toBeDefined()
    expect(doneCol!.cards[0].checked).toBe(true)
  })

  it('detects **Complete** marker on column', () => {
    const board = parseKanban(basicKanban)
    const doneCol = board.columns.find(c => c.title === 'Done')
    expect(doneCol!.isComplete).toBe(true)
  })

  it('parses archived cards', () => {
    const board = parseKanban(basicKanban)
    expect(board.archivedCards).toHaveLength(1)
    expect(board.archivedCards[0].title).toBe('Old task')
  })

  it('extracts card metadata', () => {
    const md = `---
kanban-plugin: board
---

## Todo
- [ ] Fix bug @2025-12-31 #bug [assignee:: alice]`
    const board = parseKanban(md)
    expect(board.columns[0].cards[0].tags).toContain('bug')
    expect(board.columns[0].cards[0].dueDate).toBe('2025-12-31')
    expect(board.columns[0].cards[0].metadata).toEqual({ assignee: 'alice' })
  })

  it('handles empty board', () => {
    const md = `---
kanban-plugin: board
---`
    const board = parseKanban(md)
    expect(board.columns).toEqual([])
    expect(board.archivedCards).toEqual([])
  })

  it('handles columns with no cards', () => {
    const md = `---
kanban-plugin: board
---

## Empty Column

## With Cards
- [ ] Card 1`
    const board = parseKanban(md)
    expect(board.columns).toHaveLength(2)
    expect(board.columns[0].cards).toEqual([])
    expect(board.columns[1].cards).toHaveLength(1)
  })
})

import React, { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useEditor } from '../../contexts/EditorContext'
import { parseKanban } from '../../utils/kanbanParser'
import { serializeKanban } from '../../utils/kanbanSerializer'
import type { KanbanBoard, KanbanCard } from '../../utils/kanbanParser'
import { KanbanColumn as KanbanColumnComponent } from './KanbanColumn'
import { KanbanDragOverlay } from './KanbanDragOverlay'
import { v4 as uuidv4 } from 'uuid'
import './kanban.css'

export function KanbanView() {
  const { content, setContent, setIsModified } = useEditor()

  const [board, setBoard] = useState<KanbanBoard | null>(null)
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')

  // Parse content whenever it changes
  useEffect(() => {
    const parsed = parseKanban(content)
    if (parsed) {
      setBoard(parsed)
    }
  }, [content])

  // Sensors configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Persist changes back to editor content
  const saveBoard = useCallback((updatedBoard: KanbanBoard) => {
    setBoard(updatedBoard)
    try {
      const md = serializeKanban(updatedBoard)
      setContent(md)
      setIsModified(true)
    } catch (err) {
      console.error('Failed to serialize kanban:', err)
    }
  }, [setContent, setIsModified])

  // --- Card operations ---

  const toggleCard = useCallback((cardId: string) => {
    if (!board) return
    saveBoard({
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: col.cards.map(c => c.id === cardId ? { ...c, checked: !c.checked } : c)
      })),
      archivedCards: board.archivedCards.map(c => c.id === cardId ? { ...c, checked: !c.checked } : c)
    })
  }, [board, saveBoard])

  const editCard = useCallback((cardId: string, newTitle: string) => {
    if (!board) return
    saveBoard({
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: col.cards.map(c => c.id === cardId ? { ...c, title: newTitle } : c)
      })),
      archivedCards: board.archivedCards.map(c => c.id === cardId ? { ...c, title: newTitle } : c)
    })
  }, [board, saveBoard])

  const deleteCard = useCallback((cardId: string) => {
    if (!board) return
    saveBoard({
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: col.cards.filter(c => c.id !== cardId)
      })),
      archivedCards: board.archivedCards.filter(c => c.id !== cardId)
    })
  }, [board, saveBoard])

  // --- Column operations ---

  const addColumn = useCallback((title: string) => {
    if (!board) return
    const trimmed = title.trim()
    if (!trimmed) return
    saveBoard({
      ...board,
      columns: [...board.columns, {
        id: uuidv4(),
        title: trimmed,
        isComplete: false,
        cards: [],
      }]
    })
    setAddingColumn(false)
    setNewColumnTitle('')
  }, [board, saveBoard])

  const renameColumn = useCallback((columnId: string, newTitle: string) => {
    if (!board) return
    saveBoard({
      ...board,
      columns: board.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c)
    })
  }, [board, saveBoard])

  const deleteColumn = useCallback((columnId: string) => {
    if (!board) return
    saveBoard({
      ...board,
      columns: board.columns.filter(c => c.id !== columnId)
    })
  }, [board, saveBoard])

  const addCardToColumn = useCallback((columnId: string, title: string) => {
    if (!board) return
    saveBoard({
      ...board,
      columns: board.columns.map(c => c.id === columnId
        ? { ...c, cards: [...c.cards, { id: uuidv4(), title, checked: false, tags: [], metadata: {} }] }
        : c
      )
    })
  }, [board, saveBoard])

  // --- Drag handlers ---

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string

    if (!board) return
    for (const col of board.columns) {
      const card = col.cards.find((c) => c.id === activeId)
      if (card) {
        setActiveCard(card)
        return
      }
    }
    const archived = board.archivedCards.find((c) => c.id === activeId)
    if (archived) {
      setActiveCard(archived)
    }
  }, [board])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over || !board) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    let sourceColIdx = -1
    let cardIdx = -1
    for (let ci = 0; ci < board.columns.length; ci++) {
      const col = board.columns[ci]
      const ci2 = col.cards.findIndex((c) => c.id === activeId)
      if (ci2 >= 0) {
        sourceColIdx = ci
        cardIdx = ci2
        break
      }
    }

    if (sourceColIdx < 0) return

    const sourceCol = board.columns[sourceColIdx]
    const card = sourceCol.cards[cardIdx]

    // Build columns with card removed from source
    let newColumns = board.columns.map((col, ci) =>
      ci === sourceColIdx ? { ...col, cards: col.cards.filter((_, i) => i !== cardIdx) } : col
    )

    const destColIdx = newColumns.findIndex((c) => c.id === overId)

    if (destColIdx >= 0) {
      // Dropped on a column itself (empty area)
      newColumns = newColumns.map((col, ci) =>
        ci === destColIdx ? { ...col, cards: [...col.cards, card] } : col
      )
    } else {
      // Dropped on a card
      let destCardColIdx = -1
      let destCardIdx = -1
      for (let ci = 0; ci < newColumns.length; ci++) {
        const ci2 = newColumns[ci].cards.findIndex((c) => c.id === overId)
        if (ci2 >= 0) {
          destCardColIdx = ci
          destCardIdx = ci2
          break
        }
      }

      if (destCardColIdx < 0) return

      if (sourceColIdx === destCardColIdx) {
        // Reorder within the same column
        const colCards = arrayMove(newColumns[sourceColIdx].cards, cardIdx, destCardIdx)
        newColumns = newColumns.map((col, ci) => ci === sourceColIdx ? { ...col, cards: colCards } : col)
      } else {
        // Move between columns
        newColumns = newColumns.map((col, ci) => {
          if (ci === destCardColIdx) {
            const cards = [...col.cards]
            cards.splice(destCardIdx, 0, card)
            return { ...col, cards }
          }
          return col
        })
      }
    }

    saveBoard({ ...board, columns: newColumns })
  }, [board, saveBoard])

  if (!board) {
    return (
      <div className="kanban-board-wrapper">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#888',
          fontSize: '14px',
        }}>
          This file does not contain a valid Kanban board (missing `kanban-plugin: board` in frontmatter).
        </div>
      </div>
    )
  }

  return (
    <div className="kanban-board-wrapper">
      <div className="kanban-board-header">
        <span className="kanban-board-header-title">Kanban Board</span>
        <div className="kanban-board-actions">
          <button
            className="primary"
            onClick={() => setAddingColumn(true)}
            title="Add a new column"
          >
            + Add Column
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board-scroll">
          {board.columns.map((col) => (
            <KanbanColumnComponent
              key={col.id}
              column={col}
              onRename={renameColumn}
              onDelete={deleteColumn}
              onAddCard={addCardToColumn}
              onToggleCard={toggleCard}
              onEditCard={editCard}
              onDeleteCard={deleteCard}
            />
          ))}

          {/* Add column inline input */}
          {addingColumn ? (
            <div className="kanban-new-column-input">
              <input
                type="text"
                placeholder="Column title..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addColumn(newColumnTitle)
                  }
                  if (e.key === 'Escape') {
                    setAddingColumn(false)
                    setNewColumnTitle('')
                  }
                }}
                autoFocus
              />
              <div className="kanban-new-column-actions">
                <button className="primary" onClick={() => addColumn(newColumnTitle)}>
                  Add
                </button>
                <button onClick={() => { setAddingColumn(false); setNewColumnTitle('') }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? <KanbanDragOverlay card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

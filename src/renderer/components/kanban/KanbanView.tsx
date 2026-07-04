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
    const updated: KanbanBoard = JSON.parse(JSON.stringify(board))
    for (const col of updated.columns) {
      const card = col.cards.find((c) => c.id === cardId)
      if (card) {
        card.checked = !card.checked
        break
      }
    }
    // Also check archived
    const archived = updated.archivedCards.find((c) => c.id === cardId)
    if (archived) {
      archived.checked = !archived.checked
    }
    saveBoard(updated)
  }, [board, saveBoard])

  const editCard = useCallback((cardId: string, newTitle: string) => {
    if (!board) return
    const updated: KanbanBoard = JSON.parse(JSON.stringify(board))
    for (const col of updated.columns) {
      const card = col.cards.find((c) => c.id === cardId)
      if (card) {
        card.title = newTitle
        break
      }
    }
    const archived = updated.archivedCards.find((c) => c.id === cardId)
    if (archived) {
      archived.title = newTitle
    }
    saveBoard(updated)
  }, [board, saveBoard])

  const deleteCard = useCallback((cardId: string) => {
    if (!board) return
    const updated: KanbanBoard = JSON.parse(JSON.stringify(board))
    for (const col of updated.columns) {
      const idx = col.cards.findIndex((c) => c.id === cardId)
      if (idx >= 0) {
        col.cards.splice(idx, 1)
        break
      }
    }
    const archIdx = updated.archivedCards.findIndex((c) => c.id === cardId)
    if (archIdx >= 0) {
      updated.archivedCards.splice(archIdx, 1)
    }
    saveBoard(updated)
  }, [board, saveBoard])

  // --- Column operations ---

  const addColumn = useCallback((title: string) => {
    if (!board) return
    const trimmed = title.trim()
    if (!trimmed) return
    const updated: KanbanBoard = JSON.parse(JSON.stringify(board))
    updated.columns.push({
      id: uuidv4(),
      title: trimmed,
      cards: [],
    })
    saveBoard(updated)
    setAddingColumn(false)
    setNewColumnTitle('')
  }, [board, saveBoard])

  const renameColumn = useCallback((columnId: string, newTitle: string) => {
    if (!board) return
    const updated: KanbanBoard = JSON.parse(JSON.stringify(board))
    const col = updated.columns.find((c) => c.id === columnId)
    if (col) {
      col.title = newTitle
      saveBoard(updated)
    }
  }, [board, saveBoard])

  const deleteColumn = useCallback((columnId: string) => {
    if (!board) return
    const updated: KanbanBoard = JSON.parse(JSON.stringify(board))
    updated.columns = updated.columns.filter((c) => c.id !== columnId)
    saveBoard(updated)
  }, [board, saveBoard])

  const addCardToColumn = useCallback((columnId: string, title: string) => {
    if (!board) return
    const updated: KanbanBoard = JSON.parse(JSON.stringify(board))
    const col = updated.columns.find((c) => c.id === columnId)
    if (col) {
      col.cards.push({
        id: uuidv4(),
        title,
        checked: false,
        tags: [],
        metadata: {},
      })
      saveBoard(updated)
    }
  }, [board, saveBoard])

  // --- Drag handlers ---

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string

    // Find the card being dragged
    if (!board) return
    for (const col of board.columns) {
      const card = col.cards.find((c) => c.id === activeId)
      if (card) {
        setActiveCard(card)
        return
      }
    }
    // Check archived
    const archived = board.archivedCards.find((c) => c.id === activeId)
    if (archived) {
      setActiveCard(archived)
    }
  }, [board])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // We handle reordering in dragEnd to avoid intermediate state issues
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveCard(null)
    const { active, over } = event
    if (!over || !board) return

    const activeId = active.id as string
    const overId = over.id as string

    // If dropped on itself, noop
    if (activeId === overId) return

    // Find source column (where the card is from)
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

    if (sourceColIdx < 0) return // Card not found (maybe archived, don't allow drag)

    const updated: KanbanBoard = JSON.parse(JSON.stringify(board))
    const sourceCol = updated.columns[sourceColIdx]
    const card = sourceCol.cards[cardIdx]

    // Determine destination
    // Check if over is a column ID
    const destColIdx = updated.columns.findIndex((c) => c.id === overId)

    if (destColIdx >= 0) {
      // Dropped on a column itself (empty area)
      // Remove from source, add to destination at end
      sourceCol.cards.splice(cardIdx, 1)
      updated.columns[destColIdx].cards.push(card)
    } else {
      // Dropped on a card - find which column that card belongs to
      let destCardColIdx = -1
      let destCardIdx = -1
      for (let ci = 0; ci < updated.columns.length; ci++) {
        const col = updated.columns[ci]
        const ci2 = col.cards.findIndex((c) => c.id === overId)
        if (ci2 >= 0) {
          destCardColIdx = ci
          destCardIdx = ci2
          break
        }
      }

      if (destCardColIdx < 0) return

      if (sourceColIdx === destCardColIdx) {
        // Reorder within the same column
        sourceCol.cards = arrayMove(sourceCol.cards, cardIdx, destCardIdx)
      } else {
        // Move between columns
        sourceCol.cards.splice(cardIdx, 1)
        // If the card was before the destination card in the source column,
        // the destCardIdx might need adjustment
        const adjustedDestIdx = updated.columns[destCardColIdx].cards.findIndex((c) => c.id === overId)
        if (adjustedDestIdx >= 0) {
          updated.columns[destCardColIdx].cards.splice(adjustedDestIdx, 0, card)
        } else {
          updated.columns[destCardColIdx].cards.push(card)
        }
      }
    }

    saveBoard(updated)
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

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import type { KanbanColumn as KanbanColumnType } from '../../utils/kanbanParser'

interface KanbanColumnProps {
  column: KanbanColumnType
  onRename: (columnId: string, newTitle: string) => void
  onDelete: (columnId: string) => void
  onAddCard: (columnId: string, title: string) => void
  onToggleCard: (cardId: string) => void
  onEditCard: (cardId: string, newTitle: string) => void
  onDeleteCard: (cardId: string) => void
}

export function KanbanColumn({
  column,
  onRename,
  onDelete,
  onAddCard,
  onToggleCard,
  onEditCard,
  onDeleteCard,
}: KanbanColumnProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(column.title)
  const [showMenu, setShowMenu] = useState(false)
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)
  const cardInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const cardIds = column.cards.map((c) => c.id)

  // Sync title state with column prop
  useEffect(() => {
    setTitleValue(column.title)
  }, [column.title])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitle])

  useEffect(() => {
    if (addingCard && cardInputRef.current) {
      cardInputRef.current.focus()
    }
  }, [addingCard])

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  const handleTitleSave = useCallback(() => {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== column.title) {
      onRename(column.id, trimmed)
    } else {
      setTitleValue(column.title)
    }
    setEditingTitle(false)
  }, [titleValue, column.id, column.title, onRename])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTitleSave()
    }
    if (e.key === 'Escape') {
      setTitleValue(column.title)
      setEditingTitle(false)
    }
  }, [handleTitleSave, column.title])

  const handleRenameClick = useCallback(() => {
    setShowMenu(false)
    setEditingTitle(true)
    setTitleValue(column.title)
  }, [column.title])

  const handleDeleteClick = useCallback(() => {
    setShowMenu(false)
    if (window.confirm(`Delete column "${column.title}" and all its cards?`)) {
      onDelete(column.id)
    }
  }, [column.id, column.title, onDelete])

  const handleAddCardSubmit = useCallback(() => {
    const trimmed = newCardTitle.trim()
    if (trimmed) {
      onAddCard(column.id, trimmed)
      setNewCardTitle('')
      // Keep the input open for adding more cards
      if (cardInputRef.current) {
        cardInputRef.current.focus()
      }
    }
  }, [newCardTitle, column.id, onAddCard])

  const handleAddCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCardSubmit()
    }
    if (e.key === 'Escape') {
      setAddingCard(false)
      setNewCardTitle('')
    }
  }, [handleAddCardSubmit])

  const handleToggleCard = useCallback((cardId: string) => {
    onToggleCard(cardId)
  }, [onToggleCard])

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'kanban-column-over' : ''}`}
    >
      {/* Column Header */}
      <div className="kanban-column-header" style={{ position: 'relative' }}>
        {editingTitle ? (
          <input
            ref={titleInputRef}
            className="kanban-column-title"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleTitleSave}
          />
        ) : (
          <div
            className="kanban-column-title"
            onClick={() => setEditingTitle(true)}
            title="Click to rename"
          >
            {column.title}
          </div>
        )}
        <span className="kanban-column-count">{column.cards.length}</span>
        <button
          className="kanban-column-menu-btn"
          onClick={() => setShowMenu(!showMenu)}
          title="Column menu"
        >
          {'⋯'}
        </button>

        {showMenu && (
          <div className="kanban-column-menu" ref={menuRef}>
            <button className="kanban-column-menu-item" onClick={handleRenameClick}>
              Rename
            </button>
            <button className="kanban-column-menu-item danger" onClick={handleDeleteClick}>
              Delete Column
            </button>
          </div>
        )}
      </div>

      {/* Cards */}
      <SortableContext id={`sortable-${column.id}`} items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="kanban-cards">
          {column.cards.length === 0 && (
            <div className="kanban-cards-empty">
              {isOver ? 'Drop here' : 'No cards'}
            </div>
          )}
          {column.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onToggle={onToggleCard}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Card */}
      {addingCard ? (
        <div className="kanban-new-card-input">
          <input
            ref={cardInputRef}
            type="text"
            placeholder="Card title..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={handleAddCardKeyDown}
            onBlur={() => {
              // Don't close on blur if has content - let user click Add
            }}
          />
          <div className="kanban-new-card-actions">
            <button className="primary" onClick={handleAddCardSubmit} onMouseDown={(e) => e.preventDefault()}>
              Add
            </button>
            <button onClick={() => { setAddingCard(false); setNewCardTitle('') }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="kanban-add-card-btn" onClick={() => setAddingCard(true)}>
          + Add a card
        </button>
      )}
    </div>
  )
}

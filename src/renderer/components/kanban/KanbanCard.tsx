import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { KanbanCard as KanbanCardType } from '../../utils/kanbanParser'

interface KanbanCardProps {
  card: KanbanCardType
  onToggle: (cardId: string) => void
  onEdit: (cardId: string, newTitle: string) => void
  onDelete: (cardId: string) => void
}

export function KanbanCard({ card, onToggle, onEdit, onDelete }: KanbanCardProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(card.title)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== card.title) {
      onEdit(card.id, trimmed)
    }
    setEditing(false)
    setEditValue(card.title)
  }, [editValue, card.id, card.title, onEdit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      setEditValue(card.title)
      setEditing(false)
    }
  }, [handleSave, card.title])

  const handleBlur = useCallback(() => {
    handleSave()
  }, [handleSave])

  const handleCheckboxChange = useCallback(() => {
    onToggle(card.id)
  }, [card.id, onToggle])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(card.id)
  }, [card.id, onDelete])

  const handleTitleClick = useCallback(() => {
    setEditing(true)
    setEditValue(card.title)
  }, [card.title])

  // Determine if due date is overdue (for styling)
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date(new Date().toDateString())

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <input
        type="checkbox"
        className="kanban-card-checkbox"
        checked={card.checked}
        onChange={handleCheckboxChange}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="kanban-card-body">
        {editing ? (
          <textarea
            ref={inputRef}
            className="kanban-card-title-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            rows={1}
          />
        ) : (
          <div
            className={`kanban-card-title ${card.checked ? 'checked' : ''}`}
            onClick={handleTitleClick}
          >
            {card.title}
          </div>
        )}

        {/* Metadata badges */}
        {(card.tags.length > 0 || card.dueDate || Object.keys(card.metadata).length > 0) && (
          <div className="kanban-card-badges">
            {card.priority && (
              <span className="kanban-badge" style={{ background: 'transparent', padding: '1px 2px' }}>
                {['urgent', 'high', 'medium', 'low'].indexOf(card.priority) >= 0
                  ? (card.priority === 'urgent' ? '\u{1F525}' : card.priority === 'high' ? '\u{1F534}' : card.priority === 'medium' ? '\u{1F7E1}' : '\u{1F7E2}')
                  : ''}
              </span>
            )}
            {card.tags.map((tag) => (
              <span key={tag} className="kanban-badge kanban-badge-tag">
                #{tag}
              </span>
            ))}
            {card.dueDate && (
              <span className={`kanban-badge kanban-badge-due ${isOverdue ? 'overdue' : ''}`}>
                {'\u{1F4C5}'} {card.dueDate}
                {isOverdue && ' (overdue)'}
              </span>
            )}
            {Object.entries(card.metadata).map(([key, value]) => (
              <span key={key} className="kanban-badge kanban-badge-field">
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        className="kanban-card-delete-btn"
        onClick={handleDeleteClick}
        title="Delete card"
      >
        {'×'}
      </button>
    </div>
  )
}

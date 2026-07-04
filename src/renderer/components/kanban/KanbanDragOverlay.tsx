import React from 'react'
import type { KanbanCard as KanbanCardType } from '../../utils/kanbanParser'

interface KanbanDragOverlayProps {
  card: KanbanCardType | null
}

export function KanbanDragOverlay({ card }: KanbanDragOverlayProps) {
  if (!card) return null

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date(new Date().toDateString())

  return (
    <div className="kanban-drag-overlay">
      <input
        type="checkbox"
        className="kanban-card-checkbox"
        checked={card.checked}
        readOnly
      />

      <div className="kanban-card-body">
        <div className={`kanban-card-title ${card.checked ? 'checked' : ''}`}>
          {card.title}
        </div>

        {(card.tags.length > 0 || card.dueDate || Object.keys(card.metadata).length > 0) && (
          <div className="kanban-card-badges">
            {card.priority && (
              <span className="kanban-badge" style={{ background: 'transparent', padding: '1px 2px' }}>
                {card.priority === 'urgent' ? '\u{1F525}' : card.priority === 'high' ? '\u{1F534}' : card.priority === 'medium' ? '\u{1F7E1}' : '\u{1F7E2}'}
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
    </div>
  )
}

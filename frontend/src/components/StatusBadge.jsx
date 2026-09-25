import React from 'react'

/**
 * StatusBadge — compact status indicator. Visual treatment is intentionally
 * monochrome with a single orange lab accent; status labels remain unchanged.
 */

const STATUS_CONFIG = {
  available:   { label: 'Available',    tone: 'status-neutral', dot: 'status-dot-accent' },
  in_use:      { label: 'In Use',       tone: 'status-neutral', dot: 'status-dot-dark' },
  maintenance: { label: 'Maintenance',  tone: 'status-neutral', dot: 'status-dot-dark' },
  pending:     { label: 'Pending',      tone: 'status-neutral', dot: 'status-dot-accent' },
  active:      { label: 'Active',       tone: 'status-neutral', dot: 'status-dot-accent' },
  cancelled:   { label: 'Cancelled',   tone: 'status-neutral', dot: 'status-dot-dark' },
  completed:   { label: 'Completed',   tone: 'status-neutral', dot: 'status-dot-dark' },
  ongoing:     { label: 'Ongoing',     tone: 'status-neutral', dot: 'status-dot-accent' },
}

export default function StatusBadge({ status, showDot = true }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    tone: 'status-neutral',
    dot: 'status-dot-dark',
  }

  return (
    <span className={`status-badge ${cfg.tone}`}>
      {showDot && <span className={`status-dot ${cfg.dot}`} />}
      {cfg.label}
    </span>
  )
}

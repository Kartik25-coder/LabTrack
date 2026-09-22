import React from 'react'

/**
 * StatusBadge — color-coded pill for equipment and reservation statuses.
 */

const STATUS_CONFIG = {
  // Equipment statuses
  available:   { label: 'Available',    bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  in_use:      { label: 'In Use',       bg: 'bg-amber-500/15',   text: 'text-amber-400',   border: 'border-amber-500/30',   dot: 'bg-amber-400'   },
  maintenance: { label: 'Maintenance',  bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/30',     dot: 'bg-red-400'     },
  // Reservation statuses
  pending:     { label: 'Pending',      bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/30',    dot: 'bg-blue-400'    },
  active:      { label: 'Active',       bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-slate-500/15',   text: 'text-slate-400',   border: 'border-slate-500/30',   dot: 'bg-slate-400'   },
  completed:   { label: 'Completed',   bg: 'bg-purple-500/15',  text: 'text-purple-400',  border: 'border-purple-500/30',  dot: 'bg-purple-400'  },
}

export default function StatusBadge({ status, showDot = true }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-600', dot: 'bg-slate-300',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  )
}

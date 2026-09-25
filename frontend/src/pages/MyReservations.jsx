import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'

const fmt = (dt) =>
  new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export default function MyReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.get('/reservations/')
      setReservations(res.data)
    } catch {
      setError('Failed to load reservations.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this reservation? This cannot be undone.')) return
    setCancellingId(id)
    try {
      await api.patch(`/reservations/${id}/cancel/`)
      await fetchReservations()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel reservation.')
    } finally {
      setCancellingId(null)
    }
  }

  const upcoming = reservations.filter(r => ['pending', 'active'].includes(r.status))
  const past     = reservations.filter(r => ['completed', 'cancelled'].includes(r.status))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-blue-500" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Reservations</h1>
          <p className="text-slate-400 mt-1 text-sm">Track all your equipment bookings</p>
        </div>
        <Link to="/dashboard"
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
          + New Reservation
        </Link>
      </div>

      {error && <div className="error-banner mb-5">{error}</div>}

      {reservations.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-lg mb-2">No reservations yet</p>
          <p className="text-slate-500 text-sm mb-5">Head to the equipment catalog to make your first booking.</p>
          <Link to="/dashboard"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            Browse Equipment
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Upcoming / Active */}
          <section>
            <SectionHeader label="Upcoming & Active" count={upcoming.length} color="blue" />
            {upcoming.length === 0 ? (
              <EmptySection message="No upcoming reservations." cta />
            ) : (
              <div className="space-y-3">
                {upcoming.map(r => (
                  <ReservationRow key={r.id} r={r} onCancel={handleCancel} cancellingId={cancellingId} />
                ))}
              </div>
            )}
          </section>

          {/* Past */}
          <section>
            <SectionHeader label="Past Reservations" count={past.length} color="slate" />
            {past.length === 0 ? (
              <EmptySection message="No past reservations." />
            ) : (
              <div className="space-y-3">
                {past.map(r => (
                  <ReservationRow key={r.id} r={r} onCancel={null} cancellingId={null} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function SectionHeader({ label, count, color }) {
  const dotColor = color === 'blue' ? 'bg-blue-400' : 'bg-slate-500'
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <h2 className="text-base font-semibold text-white">{label}</h2>
      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{count}</span>
    </div>
  )
}

function EmptySection({ message, cta }) {
  return (
    <div className="card px-5 py-6 text-slate-400 text-sm flex items-center gap-3">
      <span>{message}</span>
      {cta && (
        <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
          Browse equipment →
        </Link>
      )}
    </div>
  )
}

function ReservationRow({ r, onCancel, cancellingId }) {
  const canCancel = onCancel && ['pending', 'active'].includes(r.status)

  return (
    <div className="card px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-white text-sm truncate">{r.equipment_name}</p>
          <StatusBadge status={r.status} />
        </div>
        <p className="text-xs text-slate-500 mb-2">{r.equipment_category}</p>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {fmt(r.start_time)}
          </span>
          <span className="text-slate-600">→</span>
          <span>{fmt(r.end_time)}</span>
        </div>

        {r.notes && (
          <p className="text-xs text-slate-500 mt-1.5 italic truncate">📝 {r.notes}</p>
        )}
      </div>

      {canCancel && (
        <button
          id={`cancel-reservation-${r.id}`}
          onClick={() => onCancel(r.id)}
          disabled={cancellingId === r.id}
          className="shrink-0 bg-slate-800 hover:bg-slate-800 border border-slate-700 text-slate-500 text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
        </button>
      )}
    </div>
  )
}

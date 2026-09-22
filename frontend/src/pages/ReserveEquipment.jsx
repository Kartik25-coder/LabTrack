import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'

/** Return a datetime-local string representing "now" in local time */
function localNow() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function ReserveEquipment() {
  const { equipmentId } = useParams()
  const navigate = useNavigate()

  const [equipment, setEquipment] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [form, setForm] = useState({ start_time: '', end_time: '', notes: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchEquipment()
  }, [equipmentId])

  const fetchEquipment = async () => {
    setFetchError('')
    setFetchLoading(true)
    try {
      const res = await api.get(`/equipment/${equipmentId}/`)
      setEquipment(res.data)
    } catch {
      setFetchError('Equipment not found.')
    } finally {
      setFetchLoading(false)
    }
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.start_time || !form.end_time) {
      setError('Please select both start and end times.')
      return
    }
    const start = new Date(form.start_time)
    const end   = new Date(form.end_time)
    if (start >= end) {
      setError('End time must be after start time.')
      return
    }
    if (start < new Date()) {
      setError('Start time cannot be in the past.')
      return
    }

    setLoading(true)
    try {
      await api.post('/reservations/', {
        equipment: parseInt(equipmentId, 10),
        start_time: start.toISOString(),
        end_time:   end.toISOString(),
        notes: form.notes,
      })
      setSuccess(true)
      setTimeout(() => navigate('/my-reservations'), 2000)
    } catch (err) {
      const data = err.response?.data
      if (typeof data === 'string') {
        setError(data)
      } else if (data && typeof data === 'object') {
        // Flatten DRF validation error dict
        const msgs = Object.values(data).flat().join(' ')
        setError(msgs || 'Failed to create reservation.')
      } else {
        setError('Failed to create reservation. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-blue-500" />
      </div>
    )
  }

  if (fetchError || !equipment) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="error-banner">{fetchError || 'Equipment not found.'}</div>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-blue-400 text-sm hover:underline">
          ← Back to catalog
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-10 text-center border-emerald-500/30">
          <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Reservation Confirmed!</h2>
          <p className="text-slate-400 text-sm">Redirecting to your reservations…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Equipment
      </button>

      <div className="card p-7 shadow-2xl shadow-black/40">
        {/* Equipment info */}
        <div className="flex items-start justify-between gap-4 pb-5 mb-5 border-b border-slate-800">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white leading-snug">{equipment.name}</h1>
            <p className="text-sm text-slate-400 mt-1">{equipment.category}</p>
            {equipment.description && (
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{equipment.description}</p>
            )}
          </div>
          <div className="shrink-0">
            <StatusBadge status={equipment.status} />
          </div>
        </div>

        {equipment.status !== 'available' ? (
          <div className="text-center py-6">
            <p className="text-amber-400 font-medium text-sm">
              This equipment is currently not available for reservation.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              ← Browse other equipment
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-white mb-5">Book a Time Slot</h2>

            {error && <div className="error-banner mb-5">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="reserve-start-time" className="form-label">
                  Start Date &amp; Time <span className="text-red-400">*</span>
                </label>
                <input
                  id="reserve-start-time"
                  type="datetime-local"
                  value={form.start_time}
                  min={localNow()}
                  onChange={set('start_time')}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="reserve-end-time" className="form-label">
                  End Date &amp; Time <span className="text-red-400">*</span>
                </label>
                <input
                  id="reserve-end-time"
                  type="datetime-local"
                  value={form.end_time}
                  min={form.start_time || localNow()}
                  onChange={set('end_time')}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="reserve-notes" className="form-label">
                  Notes <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="reserve-notes"
                  value={form.notes}
                  onChange={set('notes')}
                  rows={3}
                  className="form-input resize-none"
                  placeholder="Purpose of use, experiment details, etc."
                />
              </div>

              {/* Conflict hint */}
              <p className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                💡 Overlapping reservations for the same equipment are automatically rejected.
              </p>

              <button
                id="submit-reservation"
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading
                  ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Checking availability…</>
                  : '✓ Confirm Reservation'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

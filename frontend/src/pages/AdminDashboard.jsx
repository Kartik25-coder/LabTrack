import React, { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'

const EMPTY_EQ = { name: '', category: '', description: '', status: 'available' }

const fmt = (dt) =>
  new Date(dt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export default function AdminDashboard() {
  const [equipment, setEquipment]     = useState([])
  const [reservations, setReservations] = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeTab, setActiveTab]     = useState('equipment')

  // Modal state
  const [showModal, setShowModal]   = useState(false)
  const [editingEq, setEditingEq]   = useState(null)
  const [eqForm, setEqForm]         = useState(EMPTY_EQ)
  const [eqError, setEqError]       = useState('')
  const [eqSaving, setEqSaving]     = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [eqRes, resRes] = await Promise.all([
        api.get('/equipment/'),
        api.get('/reservations/'),
      ])
      setEquipment(eqRes.data)
      setReservations(resRes.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Equipment modal helpers ───────────────────────────────────────────
  const openAdd = () => {
    setEditingEq(null)
    setEqForm(EMPTY_EQ)
    setEqError('')
    setShowModal(true)
  }

  const openEdit = (eq) => {
    setEditingEq(eq)
    setEqForm({ name: eq.name, category: eq.category, description: eq.description, status: eq.status })
    setEqError('')
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEqError('') }

  const handleEqSave = async (e) => {
    e.preventDefault()
    setEqError('')
    setEqSaving(true)
    try {
      if (editingEq) {
        await api.put(`/equipment/${editingEq.id}/`, eqForm)
      } else {
        await api.post('/equipment/', eqForm)
      }
      closeModal()
      await fetchAll()
    } catch (err) {
      const data = err.response?.data
      if (data) setEqError(Object.values(data).flat().join(' '))
      else setEqError('Save failed. Please try again.')
    } finally {
      setEqSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? All its reservations will also be removed.`)) return
    try {
      await api.delete(`/equipment/${id}/`)
      await fetchAll()
    } catch { alert('Failed to delete equipment.') }
  }

  const handleStatusChange = async (eq, newStatus) => {
    try {
      await api.patch(`/equipment/${eq.id}/update_status/`, { status: newStatus })
      setEquipment(prev =>
        prev.map(e => e.id === eq.id ? { ...e, status: newStatus } : e)
      )
    } catch { alert('Failed to update status.') }
  }

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Cancel this reservation?')) return
    try {
      await api.patch(`/reservations/${id}/cancel/`)
      await fetchAll()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel.')
    }
  }

  // ── Summary stats ─────────────────────────────────────────────────────
  const stats = [
    { label: 'Equipment',    value: equipment.length,                                       color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
    { label: 'Available',    value: equipment.filter(e => e.status === 'available').length,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'In Use',       value: equipment.filter(e => e.status === 'in_use').length,     color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
    { label: 'Reservations', value: reservations.length,                                     color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage lab equipment and all reservations</p>
        </div>
        <button
          id="refresh-btn"
          onClick={fetchAll}
          className="btn-ghost text-xs flex items-center gap-1"
        >
          <span className="text-base">↻</span> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map(({ label, value, color, bg }) => (
          <div key={label} className={`card p-5 ${bg}`}>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'equipment', label: '🔬 Equipment' },
          { key: 'reservations', label: '📅 Reservations' },
        ].map(({ key, label }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-blue-500" />
        </div>
      ) : activeTab === 'equipment' ? (
        <EquipmentTab
          equipment={equipment}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <ReservationsTab
          reservations={reservations}
          onCancel={handleCancelReservation}
        />
      )}

      {/* ── Equipment Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-7 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {editingEq ? 'Edit Equipment' : 'Add Equipment'}
              </h2>
              <button onClick={closeModal}
                className="text-slate-500 hover:text-white transition-colors text-xl leading-none">×</button>
            </div>

            {eqError && <div className="error-banner mb-4">{eqError}</div>}

            <form onSubmit={handleEqSave} className="space-y-4">
              <div>
                <label htmlFor="eq-name" className="form-label">Name <span className="text-red-400">*</span></label>
                <input
                  id="eq-name"
                  type="text"
                  value={eqForm.name}
                  onChange={e => setEqForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="form-input"
                  placeholder="e.g. Olympus BX53 Microscope"
                />
              </div>
              <div>
                <label htmlFor="eq-category" className="form-label">Category <span className="text-red-400">*</span></label>
                <input
                  id="eq-category"
                  type="text"
                  value={eqForm.category}
                  onChange={e => setEqForm(f => ({ ...f, category: e.target.value }))}
                  required
                  className="form-input"
                  placeholder="e.g. Optical Equipment"
                />
              </div>
              <div>
                <label htmlFor="eq-description" className="form-label">Description</label>
                <textarea
                  id="eq-description"
                  value={eqForm.description}
                  onChange={e => setEqForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="form-input resize-none"
                  placeholder="Brief description of the equipment…"
                />
              </div>
              <div>
                <label htmlFor="eq-status" className="form-label">Initial Status</label>
                <select
                  id="eq-status"
                  value={eqForm.status}
                  onChange={e => setEqForm(f => ({ ...f, status: e.target.value }))}
                  className="form-input bg-slate-800 cursor-pointer"
                >
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="eq-submit"
                  type="submit"
                  disabled={eqSaving}
                  className="flex-1 btn-primary py-2.5"
                >
                  {eqSaving
                    ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Saving…</>
                    : (editingEq ? 'Update' : 'Add Equipment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Equipment tab ─────────────────────────────────────────────────────────

function EquipmentTab({ equipment, onAdd, onEdit, onDelete, onStatusChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">All Equipment</h2>
        <button
          id="add-equipment-btn"
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          + Add Equipment
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-800">
                <th className="th">Name</th>
                <th className="th">Category</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {equipment.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    No equipment found. <button onClick={onAdd} className="text-blue-400 hover:underline">Add some →</button>
                  </td>
                </tr>
              ) : (
                equipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="td">
                      <p className="font-medium text-white">{eq.name}</p>
                      {eq.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{eq.description}</p>
                      )}
                    </td>
                    <td className="td text-slate-400">{eq.category}</td>
                    <td className="td">
                      {/* Inline status dropdown for quick updates */}
                      <select
                        id={`status-select-${eq.id}`}
                        value={eq.status}
                        onChange={(e) => onStatusChange(eq, e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="available">Available</option>
                        <option value="in_use">In Use</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </td>
                    <td className="td">
                      <div className="flex gap-2">
                        <button
                          id={`edit-eq-${eq.id}`}
                          onClick={() => onEdit(eq)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-3 py-1.5 rounded border border-blue-400/25 hover:bg-blue-400/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          id={`delete-eq-${eq.id}`}
                          onClick={() => onDelete(eq.id, eq.name)}
                          className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded border border-red-400/25 hover:bg-red-400/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Reservations tab ──────────────────────────────────────────────────────

function ReservationsTab({ reservations, onCancel }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = reservations.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.username?.toLowerCase().includes(q) ||
      r.equipment_name?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-white">All Reservations</h2>
        <div className="flex gap-2">
          <input
            id="res-search"
            type="text"
            placeholder="Search user or equipment…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input text-xs py-1.5 w-48"
          />
          <select
            id="reservation-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-input text-xs py-1.5 w-36 bg-slate-800 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-800">
                <th className="th">User</th>
                <th className="th">Equipment</th>
                <th className="th">Start</th>
                <th className="th">End</th>
                <th className="th">Status</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">No reservations found.</td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="td">
                      <p className="font-medium text-white">{r.username}</p>
                    </td>
                    <td className="td">
                      <p className="text-white">{r.equipment_name}</p>
                      <p className="text-xs text-slate-500">{r.equipment_category}</p>
                    </td>
                    <td className="td whitespace-nowrap">{fmt(r.start_time)}</td>
                    <td className="td whitespace-nowrap">{fmt(r.end_time)}</td>
                    <td className="td"><StatusBadge status={r.status} /></td>
                    <td className="td">
                      {['pending', 'active'].includes(r.status) && (
                        <button
                          id={`admin-cancel-${r.id}`}
                          onClick={() => onCancel(r.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-3 py-1.5 rounded border border-red-400/25 hover:bg-red-400/10 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

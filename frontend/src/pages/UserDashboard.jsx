import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'

export default function UserDashboard() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEquipment()
  }, [])

  const fetchEquipment = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.get('/equipment/')
      setEquipment(res.data)
    } catch {
      setError('Failed to load equipment. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = equipment.filter((eq) => {
    const q = search.toLowerCase()
    const matchSearch = eq.name.toLowerCase().includes(q) || eq.category.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || eq.status === filterStatus
    return matchSearch && matchStatus
  })

  const stats = [
    { label: 'Total',        count: equipment.length,                                       color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
    { label: 'Available',    count: equipment.filter(e => e.status === 'available').length,  color: 'text-blue-400', bg: 'bg-slate-800' },
    { label: 'In Use',       count: equipment.filter(e => e.status === 'in_use').length,     color: 'text-blue-400',   bg: 'bg-slate-800'   },
    { label: 'Maintenance',  count: equipment.filter(e => e.status === 'maintenance').length, color: 'text-slate-500',    bg: 'bg-slate-800'     },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Equipment Catalog</h1>
          <p className="text-slate-400 mt-1 text-sm">Browse available lab equipment and make a reservation</p>
        </div>
        <button
          id="refresh-equipment"
          onClick={fetchEquipment}
          className="btn-ghost text-xs flex items-center gap-1"
        >
          <span className="text-base">↻</span> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, count, color, bg }) => (
          <div key={label} className={`card p-4 ${bg}`}>
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="equipment-search"
            type="text"
            placeholder="Search by name or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <select
          id="status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-input sm:w-44 bg-slate-800 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="in_use">In Use</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {error && <div className="error-banner mb-6">{error}</div>}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-400">
          <p className="text-lg mb-2">No equipment found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((eq) => (
            <EquipmentCard key={eq.id} equipment={eq} />
          ))}
        </div>
      )}
    </div>
  )
}

function EquipmentCard({ equipment: eq }) {
  const canReserve = eq.status === 'available'

  return (
    <div className="card p-5 flex flex-col hover:border-slate-700 transition-all duration-200 group">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug truncate group-hover:text-blue-300 transition-colors">
            {eq.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{eq.category}</p>
        </div>
        <div className="shrink-0">
          <StatusBadge status={eq.status} />
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1 line-clamp-2">
        {eq.description || 'No description provided.'}
      </p>

      {/* Action */}
      {canReserve ? (
        <Link
          to={`/reserve/${eq.id}`}
          id={`reserve-btn-${eq.id}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          Reserve Equipment
        </Link>
      ) : (
        <div
          className={`w-full text-center text-sm font-medium py-2.5 rounded-lg cursor-not-allowed ${
            eq.status === 'maintenance'
              ? 'bg-slate-800 text-slate-500 border border-red-500/20'
              : 'bg-slate-800 text-blue-400 border border-blue-500/20'
          }`}
        >
          {eq.status === 'maintenance' ? '🔧 Under Maintenance' : '⏱ Currently In Use'}
        </div>
      )}
    </div>
  )
}

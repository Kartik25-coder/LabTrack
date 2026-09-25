import React, { useEffect, useState } from 'react'

const EMPTY = {
  title: '',
  category: '',
  description: '',
  lead_researcher: '',
  status: 'ongoing',
  start_date: '',
  end_date: '',
  outcome: '',
  equipment_used: [],
}

export default function ExperimentForm({ equipment = [], initial = null, onSubmit, onCancel, saving = false, error = '', adminMode = false }) {
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (!initial) {
      setForm(EMPTY)
      setFile(null)
      return
    }
    setForm({
      title: initial.title || '',
      category: initial.category || '',
      description: initial.description || '',
      lead_researcher: initial.lead_researcher || '',
      status: initial.status || 'ongoing',
      start_date: initial.start_date || '',
      end_date: initial.end_date || '',
      outcome: initial.outcome || '',
      equipment_used: (initial.equipment_used || []).map(String),
    })
    setFile(null)
  }, [initial])

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const toggleEquipment = (id) => {
    const value = String(id)
    setForm(prev => ({
      ...prev,
      equipment_used: prev.equipment_used.includes(value)
        ? prev.equipment_used.filter(item => item !== value)
        : [...prev.equipment_used, value],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const data = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'equipment_used') {
        value.forEach(id => data.append('equipment_used', id))
      } else if (value !== '') {
        data.append(key, value)
      }
    })
    if (file) data.append('attachment', file)
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="error-banner">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="form-label" htmlFor="experiment-title">Experiment title *</label>
          <input id="experiment-title" className="form-input" required value={form.title}
            onChange={e => update('title', e.target.value)} placeholder="e.g. Polymer degradation under UV exposure" />
        </div>

        <div>
          <label className="form-label" htmlFor="experiment-category">Category</label>
          <input id="experiment-category" className="form-input" value={form.category}
            onChange={e => update('category', e.target.value)} placeholder="Materials / Biology / Physics…" />
        </div>
        <div>
          <label className="form-label" htmlFor="experiment-lead">Lead researcher</label>
          <input id="experiment-lead" className="form-input" value={form.lead_researcher}
            onChange={e => update('lead_researcher', e.target.value)} placeholder="Researcher name" />
        </div>

        <div>
          <label className="form-label" htmlFor="experiment-start">Start date *</label>
          <input id="experiment-start" type="date" className="form-input" required value={form.start_date}
            onChange={e => update('start_date', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="experiment-end">End date</label>
          <input id="experiment-end" type="date" className="form-input" value={form.end_date}
            onChange={e => update('end_date', e.target.value)} />
        </div>

        <div>
          <label className="form-label" htmlFor="experiment-status">Status</label>
          <select id="experiment-status" className="form-input" value={form.status}
            onChange={e => update('status', e.target.value)}>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="form-label">Research data file</label>
          <input id="experiment-file" type="file" accept=".pdf,.txt,application/pdf,text/plain"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="form-input file:mr-3 file:rounded file:border-0 file:px-3 file:py-1.5 file:text-xs file:font-medium" />
          <p className="text-[11px] text-slate-500 mt-1">PDF or TXT, maximum 10 MB.{initial?.attachment_name ? ` Current: ${initial.attachment_name}` : ''}</p>
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="experiment-description">Description / procedure</label>
        <textarea id="experiment-description" rows={4} className="form-input resize-y" value={form.description}
          onChange={e => update('description', e.target.value)} placeholder="Describe the experiment, method, conditions, and observations…" />
      </div>

      <div>
        <label className="form-label" htmlFor="experiment-outcome">Outcome / findings</label>
        <textarea id="experiment-outcome" rows={4} className="form-input resize-y" value={form.outcome}
          onChange={e => update('outcome', e.target.value)} placeholder="Record the result, conclusion, measurements, or current outcome…" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">Equipment used</label>
          <span className="lab-mono text-[10px] text-slate-500">{form.equipment_used.length} selected</span>
        </div>
        {equipment.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-lg p-4 text-xs text-slate-500">No equipment is available yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {equipment.map(eq => (
              <label key={eq.id} className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${form.equipment_used.includes(String(eq.id)) ? 'border-orange-500/50 bg-orange-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                <input type="checkbox" checked={form.equipment_used.includes(String(eq.id))} onChange={() => toggleEquipment(eq.id)} />
                <span className="min-w-0">
                  <span className="block text-sm text-white truncate">{eq.name}</span>
                  <span className="block text-[11px] text-slate-500">{eq.category}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
        <button type="button" onClick={onCancel} className="btn-ghost" disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : (adminMode ? 'Save Experiment' : 'Register Experiment')}
        </button>
      </div>
    </form>
  )
}

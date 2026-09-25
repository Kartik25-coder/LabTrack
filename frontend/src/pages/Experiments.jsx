import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import StatusBadge from '../components/StatusBadge'
import ExperimentForm from '../components/ExperimentForm'

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

export default function Experiments() {
  const [experiments, setExperiments] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Controls the experiment detail modal
  const [selectedExperiment, setSelectedExperiment] = useState(null)

  // Controls the experiment registration form
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchData = async () => {
    setError('')

    try {
      const [experimentsRes, equipmentRes] = await Promise.all([
        api.get('/experiments/'),
        api.get('/equipment/'),
      ])

      setExperiments(experimentsRes.data)
      setEquipment(equipmentRes.data)
    } catch {
      setError('Failed to load experiments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const equipmentById = useMemo(
    () => Object.fromEntries(equipment.map((e) => [e.id, e])),
    [equipment]
  )

  const ongoing = experiments.filter((e) => e.status === 'ongoing')
  const past = experiments.filter((e) => e.status === 'completed')

  const handleCreate = async (formData) => {
    setSaving(true)
    setFormError('')

    try {
      const res = await api.post('/experiments/', formData)

      setExperiments((prev) => [res.data, ...prev])

      setShowForm(false)

      // Automatically open the newly created experiment
      setSelectedExperiment(res.data)
    } catch (err) {
      const data = err.response?.data

      setFormError(
        data
          ? Object.values(data).flat().join(' ')
          : 'Could not register the experiment.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-orange-500" />
      </div>
    )
  }

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="mb-7 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="lab-kicker text-slate-500 mb-1">
            Research Log / EXP-03
          </p>

          <h1 className="text-3xl font-bold text-white">
            Experiments
          </h1>

          <p className="text-slate-400 mt-1 text-sm">
            Register research, inspect complete records, and keep experiment
            data attached to the lab log.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setShowForm(true)
            setFormError('')
          }}
        >
          + Register Experiment
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="error-banner mb-5">
          {error}
        </div>
      )}

      {/* REGISTER EXPERIMENT FORM */}
      {showForm && (
        <div className="card p-6 mb-8 border-orange-500/30">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="lab-kicker text-orange-400 mb-1">
                New record
              </p>

              <h2 className="text-lg font-semibold text-white">
                Register an experiment
              </h2>
            </div>

            <button
              onClick={() => setShowForm(false)}
              className="text-slate-500 hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          <ExperimentForm
            equipment={equipment}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={saving}
            error={formError}
          />
        </div>
      )}

      {/* EXPERIMENT LIST */}
      {experiments.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-lg mb-2">
            No experiments logged yet
          </p>

          <p className="text-slate-500 text-sm">
            Register the first experiment above.
          </p>
        </div>
      ) : (
        <div className="space-y-10">

          <ExperimentSection
            label="Ongoing"
            count={ongoing.length}
            experiments={ongoing}
            onOpen={setSelectedExperiment}
            equipmentById={equipmentById}
          />

          <ExperimentSection
            label="Past"
            count={past.length}
            experiments={past}
            onOpen={setSelectedExperiment}
            equipmentById={equipmentById}
          />

        </div>
      )}

      {/* EXPERIMENT DETAIL MODAL */}
      {selectedExperiment && (
        <ExperimentDetailModal
          experiment={selectedExperiment}
          equipmentById={equipmentById}
          onClose={() => setSelectedExperiment(null)}
        />
      )}
    </div>
  )
}


/* =========================================================
   EXPERIMENT SECTION
   ========================================================= */

function ExperimentSection({
  label,
  count,
  experiments,
  onOpen,
  equipmentById,
}) {
  return (
    <section>

      {/* SECTION HEADER */}
      <div className="flex items-center gap-2 mb-3">

        <span className="w-2 h-2 rounded-full bg-orange-400" />

        <h2 className="text-base font-semibold text-white">
          {label}
        </h2>

        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
          {count}
        </span>

      </div>

      {/* EMPTY STATE */}
      {experiments.length === 0 ? (
        <div className="card px-5 py-6 text-slate-400 text-sm">
          No {label.toLowerCase()} experiments.
        </div>
      ) : (

        /*
          IMPORTANT:
          items-start prevents the other card in the row
          from stretching when one card is interacted with.
        */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

          {experiments.map((e) => (
            <ExperimentCard
              key={e.id}
              e={e}
              onOpen={() => onOpen(e)}
              equipmentById={equipmentById}
            />
          ))}

        </div>
      )}

    </section>
  )
}


/* =========================================================
   EXPERIMENT CARD
   ========================================================= */

function ExperimentCard({ e, onOpen }) {
  return (
    <article className="card overflow-hidden hover:border-slate-700 transition-colors">

      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left p-5 focus:outline-none"
      >

        {/* CARD HEADER */}
        <div className="flex items-start justify-between gap-3 mb-2">

          <div>

            <h3 className="font-semibold text-white text-sm leading-snug">
              {e.title}
            </h3>

            {e.category && (
              <p className="lab-mono text-xs text-slate-500 mt-1">
                {e.category}
              </p>
            )}

          </div>

          <div className="flex items-center gap-2">

            <StatusBadge status={e.status} />

            <span className="text-slate-500 text-xs">
              ↗
            </span>

          </div>

        </div>


        {/* DESCRIPTION PREVIEW */}
        {e.description && (
          <p className="text-sm text-slate-400 line-clamp-2">
            {e.description}
          </p>
        )}


        {/* CARD META */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-3 mt-3 border-t border-slate-800">

          <span>
            {e.lead_researcher
              ? `Lead: ${e.lead_researcher}`
              : 'Lead not specified'}
          </span>

          <span>
            {fmt(e.start_date)}
            {e.end_date
              ? ` → ${fmt(e.end_date)}`
              : ' → present'}
          </span>

        </div>

      </button>

    </article>
  )
}


/* =========================================================
   EXPERIMENT DETAIL MODAL
   ========================================================= */

function ExperimentDetailModal({
  experiment,
  equipmentById,
  onClose,
}) {

  const used = (experiment.equipment_used || [])
    .map((id) => equipmentById[id])
    .filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {

        // Clicking the dark background closes the modal
        if (e.target === e.currentTarget) {
          onClose()
        }

      }}
    >

      {/* MODAL */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">

        {/* MODAL HEADER */}
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 py-5">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="lab-kicker text-orange-400 mb-1">
                Experiment Record
              </p>

              <h2 className="text-xl font-bold text-white">
                {experiment.title}
              </h2>

              {experiment.category && (
                <p className="lab-mono text-xs text-slate-500 mt-1">
                  {experiment.category}
                </p>
              )}

            </div>

            {/* CLOSE BUTTON */}
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white text-2xl leading-none"
              aria-label="Close experiment"
            >
              ×
            </button>

          </div>

        </div>


        {/* MODAL CONTENT */}
        <div className="p-6 space-y-6">

          {/* STATUS / RESEARCHER / DATES */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">

            <StatusBadge status={experiment.status} />

            <span>
              Lead:{' '}
              {experiment.lead_researcher || 'Not specified'}
            </span>

            <span>
              {fmt(experiment.start_date)}

              {experiment.end_date
                ? ` → ${fmt(experiment.end_date)}`
                : ' → present'}
            </span>

          </div>


          {/* DESCRIPTION */}
          <Detail
            label="Description / procedure"
            value={experiment.description}
            empty="No description recorded."
          />


          {/* OUTCOME */}
          <Detail
            label="Outcome / findings"
            value={experiment.outcome}
            empty="No outcome recorded yet."
          />


          {/* EQUIPMENT */}
          <div>

            <p className="lab-kicker text-slate-500 mb-2">
              Equipment used
            </p>

            {used.length ? (

              <div className="flex flex-wrap gap-2">

                {used.map((eq) => (
                  <span
                    key={eq.id}
                    className="px-3 py-2 border border-slate-800 rounded text-xs text-slate-300"
                  >
                    {eq.name}
                  </span>
                ))}

              </div>

            ) : (

              <p className="text-sm text-slate-500">
                No equipment linked.
              </p>

            )}

          </div>


          {/* RESEARCH DATA / ATTACHMENT */}
          <div>

            <p className="lab-kicker text-slate-500 mb-2">
              Research data
            </p>

            {experiment.attachment_url ? (

              <a
                href={experiment.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 border border-orange-500/30 rounded text-sm text-orange-300 hover:bg-orange-500/10"
              >
                ↗ {experiment.attachment_name || 'Open attachment'}
              </a>

            ) : (

              <p className="text-sm text-slate-500">
                No PDF or TXT attachment.
              </p>

            )}

          </div>


          {/* RECORD INFORMATION */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">

            <div>

              <p className="lab-kicker text-slate-500 mb-1">
                Record ID
              </p>

              <p className="lab-mono text-slate-300">
                EXP-{String(experiment.id).padStart(4, '0')}
              </p>

            </div>


            <div>

              <p className="lab-kicker text-slate-500 mb-1">
                Last updated
              </p>

              <p className="text-slate-400">
                {experiment.updated_at
                  ? new Date(
                      experiment.updated_at
                    ).toLocaleString()
                  : '—'}
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}


/* =========================================================
   DETAIL COMPONENT
   ========================================================= */

function Detail({
  label,
  value,
  empty,
}) {
  return (
    <div>

      <p className="lab-kicker text-slate-500 mb-2">
        {label}
      </p>

      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-6">
        {value || empty}
      </p>

    </div>
  )
}
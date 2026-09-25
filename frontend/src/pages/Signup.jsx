import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const INITIAL = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'user',
}

export default function Signup() {
  const [form, setForm] = useState(INITIAL)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, signup } = useAuth()
  const navigate = useNavigate()

  if (user) return <Navigate to="/" replace />

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(form)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ')
        setError(msgs)
      } else {
        setError('Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="bg-slate-900 border border-blue-500/20 rounded-2xl p-10 text-center max-w-sm">
          <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
          <p className="text-slate-400 text-sm">Redirecting you to login…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">

          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 mt-1 text-sm">Join LabTrack to reserve equipment</p>
          </div>

          {error && <div className="error-banner mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-firstname" className="form-label">First Name</label>
                <input id="signup-firstname" type="text" value={form.first_name}
                  onChange={set('first_name')} className="form-input" placeholder="First" />
              </div>
              <div>
                <label htmlFor="signup-lastname" className="form-label">Last Name</label>
                <input id="signup-lastname" type="text" value={form.last_name}
                  onChange={set('last_name')} className="form-input" placeholder="Last" />
              </div>
            </div>

            <div>
              <label htmlFor="signup-username" className="form-label">Username <span className="text-slate-500">*</span></label>
              <input id="signup-username" type="text" value={form.username}
                onChange={set('username')} required autoComplete="username"
                className="form-input" placeholder="Choose a username" />
            </div>

            <div>
              <label htmlFor="signup-email" className="form-label">Email</label>
              <input id="signup-email" type="email" value={form.email}
                onChange={set('email')} className="form-input" placeholder="your@email.com" />
            </div>

            <div>
              <label htmlFor="signup-password" className="form-label">Password <span className="text-slate-500">*</span></label>
              <input id="signup-password" type="password" value={form.password}
                onChange={set('password')} required autoComplete="new-password"
                className="form-input" placeholder="Minimum 8 characters" />
            </div>

            <div>
              <label htmlFor="signup-role" className="form-label">Role</label>
              <select id="signup-role" value={form.role} onChange={set('role')}
                className="form-input bg-slate-800 cursor-pointer">
                <option value="user">Lab User</option>
                <option value="admin">Administrator</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Select Administrator only if you manage the lab.</p>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading
                ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Creating account…</>
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

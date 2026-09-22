import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()

  // Already logged in — redirect
  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(detail || 'Invalid username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ username: 'admin', password: 'Admin@123' })
    else setForm({ username: 'testuser', password: 'User@123' })
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/40">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/40">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-400 mt-1 text-sm">Sign in to LabTrack</p>
          </div>

          {/* Error */}
          {error && (
            <div className="error-banner mb-5">
              <span className="font-medium">Error: </span>{error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="form-label">Username</label>
              <input
                id="login-username"
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="username"
                className="form-input"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                className="form-input"
                placeholder="Enter your password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading
                ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> Signing in…</>
                : 'Sign In'}
            </button>
          </form>

          {/* Demo shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center mb-3">Quick demo login:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="demo-admin-btn"
                type="button"
                onClick={() => fillDemo('admin')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-2.5 text-center transition-colors"
              >
                <p className="text-xs font-semibold text-blue-400">Admin</p>
                <p className="text-xs text-slate-400 mt-0.5">admin / Admin@123</p>
              </button>
              <button
                id="demo-user-btn"
                type="button"
                onClick={() => fillDemo('user')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-2.5 text-center transition-colors"
              >
                <p className="text-xs font-semibold text-emerald-400">Lab User</p>
                <p className="text-xs text-slate-400 mt-0.5">testuser / User@123</p>
              </button>
            </div>
          </div>

          <p className="text-center text-slate-400 text-sm mt-5">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

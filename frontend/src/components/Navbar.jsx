import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Inline SVG icons ──────────────────────────────────────────────────────
const FlaskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
    />
  </svg>
)

function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const isActive = pathname === to || pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
              <FlaskIcon />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">LabTrack</span>
          </Link>

          {/* Desktop nav links */}
          {user && (
            <div className="hidden md:flex items-center gap-1 ml-6">
              {user.role === 'admin' ? (
                <NavLink to="/admin">Admin Dashboard</NavLink>
              ) : (
                <>
                  <NavLink to="/dashboard">Equipment</NavLink>
                  <NavLink to="/my-reservations">My Reservations</NavLink>
                </>
              )}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* User info chip */}
                <div className="hidden sm:flex items-center gap-2.5 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-white">{user.username}</p>
                    <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>

                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="btn-ghost text-sm"
                >
                  Logout
                </button>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden btn-ghost p-1.5"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Toggle menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileOpen
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" id="nav-login" className="btn-ghost text-sm">Login</Link>
                <Link
                  to="/signup"
                  id="nav-signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {user && mobileOpen && (
          <div className="md:hidden border-t border-slate-800 py-3 space-y-1">
            {user.role === 'admin' ? (
              <MobileNavLink to="/admin" onClick={() => setMobileOpen(false)}>Admin Dashboard</MobileNavLink>
            ) : (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setMobileOpen(false)}>Equipment</MobileNavLink>
                <MobileNavLink to="/my-reservations" onClick={() => setMobileOpen(false)}>My Reservations</MobileNavLink>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function MobileNavLink({ to, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 rounded-md text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
    >
      {children}
    </Link>
  )
}

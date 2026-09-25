import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const FlaskIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.7}
      d="M9 3h6m-1 0v6.2l5.3 8.2a2 2 0 0 1-1.7 3.1H6.4a2 2 0 0 1-1.7-3.1L10 9.2V3m-4 12h12"
    />
  </svg>
)

function NavLink({ to, children }) {
  const { pathname } = useLocation()
  const isActive = pathname === to || pathname.startsWith(to + '/')

  return (
    <Link
      to={to}
      className={`lab-nav-link ${isActive ? 'is-active' : ''}`}
    >
      <span className="lab-nav-mark" aria-hidden="true" />
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
    <nav className="lab-navbar sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4.25rem]">
          <Link to="/" className="lab-brand shrink-0" aria-label="LabTrack home">
            <span className="lab-brand-icon"><FlaskIcon /></span>
            <span>
              <span className="lab-brand-name">LabTrack</span>
              <span className="lab-brand-meta">LAB / RESERVATION SYSTEM</span>
            </span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-1 ml-8">
              {user.role === 'admin' ? (
                <>
                  <NavLink to="/admin">Admin Dashboard</NavLink>
                  <NavLink to="/experiments">Experiments</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/dashboard">Equipment</NavLink>
                  <NavLink to="/my-reservations">My Reservations</NavLink>
                  <NavLink to="/experiments">Experiments</NavLink>
                </>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2.5 lab-user-chip">
                  <div className="lab-avatar">
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-white">{user.username}</p>
                    <p className="lab-user-role">{user.role}</p>
                  </div>
                </div>

                <button id="logout-btn" onClick={handleLogout} className="btn-ghost text-sm">
                  Logout
                </button>

                <button
                  className="md:hidden btn-ghost p-1.5"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Toggle menu"
                  aria-expanded={mobileOpen}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileOpen
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />}
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" id="nav-login" className="btn-ghost text-sm">Login</Link>
                <Link to="/signup" id="nav-signup" className="lab-nav-cta">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {user && mobileOpen && (
          <div className="md:hidden lab-mobile-menu">
            {user.role === 'admin' ? (
              <>
                <MobileNavLink to="/admin" onClick={() => setMobileOpen(false)}>Admin Dashboard</MobileNavLink>
                <MobileNavLink to="/experiments" onClick={() => setMobileOpen(false)}>Experiments</MobileNavLink>
              </>
            ) : (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setMobileOpen(false)}>Equipment</MobileNavLink>
                <MobileNavLink to="/my-reservations" onClick={() => setMobileOpen(false)}>My Reservations</MobileNavLink>
                <MobileNavLink to="/experiments" onClick={() => setMobileOpen(false)}>Experiments</MobileNavLink>
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
    <Link to={to} onClick={onClick} className="lab-mobile-link">
      <span className="lab-nav-mark" aria-hidden="true" />
      {children}
    </Link>
  )
}

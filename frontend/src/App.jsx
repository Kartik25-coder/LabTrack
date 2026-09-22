import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import UserDashboard from './pages/UserDashboard'
import MyReservations from './pages/MyReservations'
import AdminDashboard from './pages/AdminDashboard'
import ReserveEquipment from './pages/ReserveEquipment'

/** Redirect root "/" based on auth state + role */
function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'admin'
    ? <Navigate to="/admin" replace />
    : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 flex flex-col">
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              {/* Public */}
              <Route path="/"       element={<HomeRedirect />} />
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Authenticated — Lab Users */}
              <Route path="/dashboard" element={
                <ProtectedRoute><UserDashboard /></ProtectedRoute>
              } />
              <Route path="/my-reservations" element={
                <ProtectedRoute><MyReservations /></ProtectedRoute>
              } />
              <Route path="/reserve/:equipmentId" element={
                <ProtectedRoute><ReserveEquipment /></ProtectedRoute>
              } />

              {/* Authenticated — Admin only */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-600">
            LabTrack &copy; {new Date().getFullYear()} — Lab Equipment Reservation System
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

import axios from 'axios'

/**
 * Axios instance pre-configured for the LabTrack API.
 * - baseURL: /api  (proxied to localhost:8000 by Vite in dev)
 * - Request interceptor: attaches Authorization: Bearer <token>
 * - Response interceptor: attempts token refresh on 401 then retries once.
 *   If refresh also fails, clears storage and redirects to /login.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach access token to every request ────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Let the browser set the multipart boundary for file uploads.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Refresh token on 401 ────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refresh = localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          // Use plain axios (not instance) to avoid circular interceptor calls
          const res = await axios.post('/api/auth/refresh/', { refresh })
          const newAccess = res.data.access
          localStorage.setItem('access_token', newAccess)
          originalRequest.headers.Authorization = `Bearer ${newAccess}`
          return api(originalRequest)
        } catch {
          // Refresh failed — force logout
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api

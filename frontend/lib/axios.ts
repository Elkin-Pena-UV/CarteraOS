import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL as string

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// --- Refresh lock ---
// Ensures a single /auth/refresh call even when multiple requests expire simultaneously.
let isRefreshing = false
let refreshQueue: Array<(success: boolean) => void> = []

function notifyQueue(success: boolean) {
  refreshQueue.forEach(cb => cb(success))
  refreshQueue = []
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// --- Interceptors ---
// No request interceptor — the httpOnly cookie is sent automatically by the browser.

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { response, config: originalConfig } = error

    if (response?.status === 401) {
      const code: string | undefined = response.data?.code
      const config = originalConfig as InternalAxiosRequestConfig & { _retry?: boolean }

      if (code === 'TOKEN_EXPIRED' && !config._retry) {
        config._retry = true

        if (isRefreshing) {
          // Piggyback on the in-flight refresh, then retry this request.
          return new Promise((resolve, reject) => {
            refreshQueue.push((success) => {
              if (success) resolve(api(config))
              else reject(error.response?.data || error.message)
            })
          })
        }

        isRefreshing = true
        try {
          // Raw axios so this call does NOT go through this interceptor.
          // withCredentials must be explicit — it is NOT inherited from the api instance.
          await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          isRefreshing = false
          notifyQueue(true)
          return api(config)
        } catch {
          isRefreshing = false
          notifyQueue(false)
          redirectToLogin()
          return Promise.reject(error.response?.data || error.message)
        }
      }

      // UNAUTHORIZED (bad/missing refresh) or already retried after refresh.
      redirectToLogin()
    }

    return Promise.reject(error.response?.data || error.message)
  }
)

export default api

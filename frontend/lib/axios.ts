import axios, { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Adjunta el token JWT en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Extrae response.data y maneja errores
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Sesión expirada o token inválido → redirige al login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    console.error('Error en la petición:', error.response?.data || error.message)
    return Promise.reject(error.response?.data || error.message)
  }
)

export default api
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios"

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// El interceptor extrae response.data, así que efectivamente
// las llamadas devuelven el body, no el AxiosResponse completo.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("Error en la petición:", error.response?.data || error.message)
    return Promise.reject(error.response?.data || error.message)
  }
)

export default api
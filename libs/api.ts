import axios, { AxiosError, AxiosRequestConfig } from 'axios'

export type ApiFieldErrors = Record<string, string[]>

export type ApiErrorResponse = {
  message?: string
  errors?: ApiFieldErrors
}

export class AppError extends Error {
  status?: number
  errors?: ApiFieldErrors

  constructor(message: string, status?: number, errors?: ApiFieldErrors) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.errors = errors
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('accessToken')
}

const clearAuthStorage = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax'
}

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

apiClient.interceptors.request.use(config => {
  config.headers['ngrok-skip-browser-warning'] = 'true'

  const fullUrl = `${config.baseURL || ''}${config.url || ''}`
  if (fullUrl.includes('ngrok')) {
    config.params = {
      'ngrok-skip-browser-warning': 'true',
      ...config.params,
    }
  }

  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message || error.message || 'Terjadi kesalahan pada server'
    const errors = error.response?.data?.errors

    // Gagal masuk bukan sesi kedaluwarsa. Sebelumnya kredensial yang salah
    // ikut memicu pelemparan ke halaman masuk panitia — peserta yang salah
    // ketik nomor telepon di beranda mendadak berpindah halaman dan tidak
    // pernah sempat membaca pesan kesalahannya. Jawaban dari jalur masuk
    // dibiarkan lewat supaya formnya sendiri yang menampilkannya.
    const isAuthAttempt = error.config?.url?.startsWith('/authentications')

    if (status === 401 && !isAuthAttempt) {
      clearAuthStorage()

      if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login'
      }
    }

    return Promise.reject(new AppError(message, status, errors))
  },
)

export const http = {
  async get<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
    const res = await apiClient.get<TResponse>(url, config)
    return res.data
  },

  async post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

    const res = await apiClient.post<TResponse>(url, body, {
      ...config,
      headers: {
        ...(isFormData ? { 'Content-Type': undefined } : {}),
        ...config?.headers,
      },
    })

    return res.data
  },

  async put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const res = await apiClient.put<TResponse>(url, body, config)
    return res.data
  },

  async patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    const res = await apiClient.patch<TResponse>(url, body, config)
    return res.data
  },

  async delete<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
    const res = await apiClient.delete<TResponse>(url, config)
    return res.data
  },
}

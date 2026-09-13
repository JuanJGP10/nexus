const DEFAULT_BASE_URL = 'http://localhost:8000'
const TOKEN_KEY = 'nexus_access_token'

export class ApiError extends Error {
  constructor(status, detail) {
    super(ApiError.formatMessage(detail))
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }

  static formatMessage(detail) {
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => item?.msg ?? JSON.stringify(item)).join(', ')
    }
    return 'Ha ocurrido un error inesperado'
  }
}

/**
 * Cliente HTTP para la API de Nexus.
 * Centraliza base URL, token JWT, serialización JSON y manejo de errores
 * para que el resto del frontend nunca llame a `fetch` directamente.
 */
export class ApiClient {
  constructor(baseUrl = import.meta.env.VITE_API_URL || DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    /** Callback opcional, lo engancha AuthContext para reaccionar a un 401 */
    this.onUnauthorized = null
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  }

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  }

  clearToken() {
    localStorage.removeItem(TOKEN_KEY)
  }

  buildUrl(path, query) {
    const url = new URL(this.baseUrl + path)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, value)
        }
      }
    }
    return url
  }

  authHeaders(auth) {
    if (!auth) return {}
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async request(path, { method = 'GET', body, query, auth = true, isFormData = false } = {}) {
    const url = this.buildUrl(path, query)
    const headers = { ...this.authHeaders(auth) }
    if (!isFormData && body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    let response
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      })
    } catch {
      throw new ApiError(0, 'No se pudo conectar con el servidor')
    }

    if (response.status === 401 && auth) {
      this.clearToken()
      this.onUnauthorized?.()
    }

    if (response.status === 204) return null

    const contentType = response.headers.get('content-type') ?? ''
    const data = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text()

    if (!response.ok) {
      throw new ApiError(response.status, data?.detail ?? data)
    }

    return data
  }

  get(path, options) {
    return this.request(path, { ...options, method: 'GET' })
  }

  post(path, body, options) {
    return this.request(path, { ...options, method: 'POST', body })
  }

  patch(path, body, options) {
    return this.request(path, { ...options, method: 'PATCH', body })
  }

  delete(path, options) {
    return this.request(path, { ...options, method: 'DELETE' })
  }

  upload(path, formData, options) {
    return this.request(path, { ...options, method: 'POST', body: formData, isFormData: true })
  }

  /** Descarga un fichero binario (p.ej. GET /files/{id}/download) devolviendo blob + nombre. */
  async download(path) {
    const response = await fetch(this.buildUrl(path), { headers: this.authHeaders(true) })

    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new ApiError(response.status, data?.detail ?? 'No se pudo descargar el archivo')
    }

    const disposition = response.headers.get('content-disposition') ?? ''
    const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
    const plainMatch = disposition.match(/filename="?([^";]+)"?/i)
    const filename = encodedMatch
      ? decodeURIComponent(encodedMatch[1])
      : (plainMatch?.[1] ?? 'download')

    return { blob: await response.blob(), filename }
  }
}

export const apiClient = new ApiClient()

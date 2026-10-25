import type { AuthResponse } from './types'

const TOKEN_KEY = 'rme_token'
const REFRESH_KEY = 'rme_refresh'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (res: Pick<AuthResponse, 'accessToken' | 'refreshToken'>) => {
    localStorage.setItem(TOKEN_KEY, res.accessToken)
    localStorage.setItem(REFRESH_KEY, res.refreshToken)
  },
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY) },
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const NO_RETRY = ['/auth/login', '/auth/signup', '/auth/refresh']

// Shared so that several requests failing with 401 at once trigger a single refresh.
let refreshing: Promise<boolean> | null = null

export function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return Promise.resolve(false)
  refreshing ??= fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) { tokenStore.clear(); return false }
      tokenStore.set(await res.json())
      return true
    })
    .catch(() => false)
    .finally(() => { refreshing = null })
  return refreshing
}

function send(path: string, options: { method?: string; body?: unknown }) {
  const token = tokenStore.get()
  return fetch(`/api/v1${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let res = await send(path, options)
  // Access tokens live 15 min: on 401, swap the refresh token for a new pair and retry once.
  // (Not for login/signup/refresh themselves, where 401 means bad credentials.)
  if (res.status === 401 && !NO_RETRY.includes(path) && await refreshTokens()) {
    res = await send(path, options)
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      // Validation errors carry per-field messages; the first one says more than "Validation failed".
      const field = body.fields && Object.values(body.fields as Record<string, string>)[0]
      message = field ?? body.message ?? message
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, message)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

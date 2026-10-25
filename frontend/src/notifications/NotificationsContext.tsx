import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { notificationsApi } from '../api/endpoints'
import { listenToStream } from '../api/stream'
import type { AppNotification } from '../api/types'
import { useAuth } from '../auth/AuthContext'

type Listener = (n: AppNotification) => void

interface NotificationsState {
  unread: number
  /** Re-reads the unread count from the server (after marking things read). */
  refreshUnread: () => Promise<void>
  /** Registers a callback for every live notification; returns the unsubscribe function. */
  subscribe: (fn: Listener) => () => void
}

const Ctx = createContext<NotificationsState | null>(null)

/** Keeps one live connection per logged-in tab and fans incoming notifications out to the UI. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth()
  const [unread, setUnread] = useState(0)
  const listeners = useRef(new Set<Listener>())

  const refreshUnread = useCallback(async () => {
    try { setUnread((await notificationsApi.unreadCount()).count) } catch { /* offline or logged out */ }
  }, [])

  const subscribe = useCallback((fn: Listener) => {
    listeners.current.add(fn)
    return () => { listeners.current.delete(fn) }
  }, [])

  const userId = me?.id
  useEffect(() => {
    if (userId == null) { setUnread(0); return }
    const abort = new AbortController()
    refreshUnread()
    listenToStream((event, data) => {
      if (event !== 'notification') return
      const n = JSON.parse(data) as AppNotification
      setUnread((c) => c + 1)
      listeners.current.forEach((fn) => fn(n))
    }, abort.signal)
    // Anything that arrived while the tab slept or the stream was reconnecting.
    const onFocus = () => { if (document.visibilityState === 'visible') refreshUnread() }
    document.addEventListener('visibilitychange', onFocus)
    return () => { abort.abort(); document.removeEventListener('visibilitychange', onFocus) }
  }, [userId, refreshUnread])

  return <Ctx.Provider value={{ unread, refreshUnread, subscribe }}>{children}</Ctx.Provider>
}

export function useNotifications() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useNotifications must be used inside <NotificationsProvider>')
  return v
}

/** Calls `refresh` whenever a live notification arrives, so a page updates without a manual reload. */
export function useLiveRefresh(refresh: () => void, filter?: (n: AppNotification) => boolean) {
  const { subscribe } = useNotifications()
  const latest = useRef({ refresh, filter })
  latest.current = { refresh, filter }
  useEffect(() => subscribe((n) => {
    const { refresh, filter } = latest.current
    if (!filter || filter(n)) refresh()
  }), [subscribe])
}

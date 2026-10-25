import { refreshTokens, tokenStore } from './client'

/**
 * Listens to the server-sent notification stream until `signal` aborts, reconnecting with backoff.
 * Uses fetch instead of EventSource because EventSource can't send the Authorization header.
 */
export async function listenToStream(onEvent: (event: string, data: string) => void, signal: AbortSignal) {
  let delay = 1000
  while (!signal.aborted) {
    try {
      const res = await fetch('/api/v1/notifications/stream', {
        headers: { Accept: 'text/event-stream', Authorization: `Bearer ${tokenStore.get() ?? ''}` },
        signal,
      })
      if (res.status === 401) {
        if (!(await refreshTokens())) return // logged out for good; the app will redirect to login
        continue
      }
      if (!res.ok || !res.body) throw new Error(`stream ${res.status}`)

      delay = 1000 // connected: reset the backoff
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        // Events are separated by a blank line; keep any incomplete tail for the next chunk.
        const parts = buffer.split(/\r?\n\r?\n/)
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          let event = 'message'
          const data: string[] = []
          for (const line of part.split(/\r?\n/)) {
            if (line.startsWith('event:')) event = line.slice(6).trim()
            else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''))
          }
          if (data.length) onEvent(event, data.join('\n'))
        }
      }
      // The server ends streams after 30 min; loop round and reconnect.
    } catch {
      if (signal.aborted) return
    }
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay * 2, 30_000)
  }
}

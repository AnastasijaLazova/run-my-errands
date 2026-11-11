import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ApiError } from '../api/client'
import { chatApi } from '../api/endpoints'
import type { ChatMessage } from '../api/types'
import { useI18n } from '../i18n/I18nContext'

const MAX_LENGTH = 2000

// Kept per tab and per user, so the conversation survives moving between pages but not logging out and in as someone else.
const storageKey = (userId: number) => `rme_chat_${userId}`
function load(userId: number): ChatMessage[] {
  try { return JSON.parse(sessionStorage.getItem(storageKey(userId)) ?? '[]') } catch { return [] }
}

/**
 * Floating "Ask me" button + chat panel. Built to work with keyboard and screen readers:
 * Esc closes and returns focus to the button, new replies are announced through a live region.
 * Mount it keyed by the user id, so each signed-in user starts from their own saved conversation.
 */
export default function ChatWidget({ userId }: { userId: number }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => load(userId))
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  const toggleRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try { sessionStorage.setItem(storageKey(userId), JSON.stringify(messages)) } catch { /* storage unavailable */ }
  }, [userId, messages])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }) }, [messages, busy, open])

  const close = () => { setOpen(false); toggleRef.current?.focus() }

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    const next: ChatMessage[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setDraft('')
    setError(null)
    setBusy(true)
    try {
      const { reply } = await chatApi.send(next)
      setMessages([...next, { role: 'assistant', content: reply }])
      setAnnounce(reply)
    } catch (err) {
      // Put the message back so nothing typed is lost; the user can just press Send again.
      setMessages(messages)
      setDraft(content)
      setError(err instanceof ApiError && err.status === 503 ? t.chat.unavailable : t.chat.error)
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const submit = (e: FormEvent) => { e.preventDefault(); send(draft) }
  const onInputKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft) }
  }

  return (
    <>
      {open && (
        <section id="chat-panel" className="chat-panel" role="dialog" aria-labelledby="chat-title"
                 onKeyDown={(e) => { if (e.key === 'Escape') close() }}>
          <header className="chat-head">
            <h2 id="chat-title">{t.chat.title}</h2>
            {messages.length > 0 && (
              <button type="button" className="chat-clear" onClick={() => { setMessages([]); setError(null) }}>{t.chat.clear}</button>
            )}
            <button type="button" className="chat-close" onClick={close} aria-label={t.chat.close} title={t.chat.close}>×</button>
          </header>

          <div className="chat-log" ref={logRef}>
            <p className="chat-msg assistant"><span className="sr-only">{t.chat.assistant}: </span>{t.chat.welcome}</p>
            {messages.length === 0 && (
              <div className="chat-suggestions">
                {t.chat.suggestions.map((s) => <button type="button" key={s} onClick={() => send(s)} disabled={busy}>{s}</button>)}
              </div>
            )}
            {messages.map((m, i) => (
              <p key={i} className={`chat-msg ${m.role}`}>
                <span className="sr-only">{m.role === 'user' ? t.chat.you : t.chat.assistant}: </span>{m.content}
              </p>
            ))}
            {busy && <p className="chat-msg assistant chat-typing" aria-hidden="true"><span /><span /><span /></p>}
          </div>

          {/* Screen readers hear the status and each new reply once, without re-reading the whole log. */}
          <div className="sr-only" role="status">{busy ? t.chat.thinking : announce}</div>
          {error && <p className="chat-error" role="alert">{error}</p>}

          <form className="chat-form" onSubmit={submit}>
            <label htmlFor="chat-input" className="sr-only">{t.chat.inputLabel}</label>
            <textarea id="chat-input" ref={inputRef} rows={2} maxLength={MAX_LENGTH} value={draft}
                      placeholder={t.chat.placeholder} aria-describedby="chat-hint"
                      onChange={(e) => setDraft(e.target.value)} onKeyDown={onInputKey} />
            <button type="submit" className="primary" disabled={busy || !draft.trim()}>{t.chat.send}</button>
            <p id="chat-hint" className="chat-hint">{t.chat.hint}</p>
          </form>
        </section>
      )}

      <button ref={toggleRef} type="button" className="chat-toggle" aria-expanded={open} aria-controls="chat-panel"
              onClick={() => (open ? close() : setOpen(true))}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
        </svg>
        <span>{open ? t.chat.close : t.chat.open}</span>
      </button>
    </>
  )
}

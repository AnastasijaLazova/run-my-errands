import { useEffect, useState, type FormEvent } from 'react'
import { meApi } from '../api/endpoints'
import type { Me } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { NeighbourhoodInput } from '../components/NeighbourhoodInput'
import { initials } from '../components/avatar'

type Form = { displayName: string; phone: string; neighbourhood: string; locale: Me['locale'] }

const fromMe = (me: Me | null): Form => ({
  displayName: me?.displayName ?? '', phone: me?.phone ?? '', neighbourhood: me?.neighbourhood ?? '', locale: me?.locale ?? 'en',
})

export default function Settings() {
  const { t, setLang } = useI18n()
  const { me, refreshMe } = useAuth()
  const [form, setForm] = useState<Form>(() => fromMe(me))
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => setForm(fromMe(me)), [me])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false) }

  const initial = fromMe(me)
  // Only send what changed; a blank phone is sent as '' so the backend clears it.
  const changes: Partial<Form> = {}
  if (form.displayName.trim() !== initial.displayName) changes.displayName = form.displayName.trim()
  if (form.phone.trim() !== initial.phone) changes.phone = form.phone.trim()
  if (form.neighbourhood.trim() !== initial.neighbourhood) changes.neighbourhood = form.neighbourhood.trim()
  if (form.locale !== initial.locale) changes.locale = form.locale
  const dirty = Object.keys(changes).length > 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.displayName.trim()) { setError(t.settings.needName); return }
    if (!form.neighbourhood.trim()) { setError(t.settings.needNeighbourhood); return }
    setSaving(true)
    try {
      await meApi.update(changes)
      if (changes.locale) setLang(changes.locale)
      await refreshMe()
      setSaved(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="settings" onSubmit={submit}>
      <header className="post-head">
        <h1>{t.settings.title}</h1>
        <p className="muted">{t.settings.sub}</p>
      </header>

      {me && (
        <section className="card settings-id">
          <span className="settings-avatar">{initials(me.displayName)}</span>
          <div><strong>{me.displayName}</strong><span>{me.email}</span></div>
          {me.neighbourhood && <span className="settings-hood">{me.neighbourhood}</span>}
        </section>
      )}

      <section className="card post-card settings-profile">
        <h2>{t.settings.profile}</h2>
        <p className="muted small">{t.settings.profileHint}</p>
        <div className="post-fields">
          <div>
            <label htmlFor="s-name">{t.auth.name}</label>
            <input id="s-name" className="soft-input" maxLength={120} value={form.displayName} onChange={(e) => set('displayName', e.target.value)} autoComplete="name" required />
          </div>
          <div>
            <label htmlFor="s-email">{t.auth.email}</label>
            <input id="s-email" className="soft-input" value={me?.email ?? ''} disabled />
          </div>
          <div>
            <label htmlFor="s-phone">{t.auth.phone}</label>
            <input id="s-phone" className="soft-input" type="tel" maxLength={32} value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" />
            <p className="muted small">{t.auth.phoneHint}</p>
          </div>
          <div>
            <label htmlFor="s-hood">{t.auth.neighbourhood}</label>
            <NeighbourhoodInput id="s-hood" className="soft-input" value={form.neighbourhood} onChange={(v) => set('neighbourhood', v)}
              placeholder={t.auth.neighbourhoodPlaceholder} required />
            <p className="muted small">{t.auth.neighbourhoodHint}</p>
          </div>
        </div>
      </section>

      <section className="card post-card settings-lang">
        <h2>{t.settings.language}</h2>
        <p className="muted small">{t.settings.languageHint}</p>
        <div className="slot-grid lang-slots" role="radiogroup" aria-label={t.settings.language}>
          {(['en', 'mk'] as const).map((l) => (
            <button type="button" key={l} role="radio" aria-checked={form.locale === l}
              className={`slot${form.locale === l ? ' active' : ''}`} onClick={() => set('locale', l)}>
              {l === 'en' ? 'English' : 'Македонски'}
            </button>
          ))}
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      {saved && !dirty && <p className="saved" role="status">{t.settings.saved}</p>}
      <div className="post-actions">
        <button type="submit" className="primary lg" disabled={saving || !dirty}>{t.settings.save}</button>
      </div>
    </form>
  )
}

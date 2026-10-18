import { useState, type FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { SKOPJE_NEIGHBOURHOODS } from '../neighbourhoods'

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth()
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState({ displayName: '', email: '', password: '', neighbourhood: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else await register({ ...form, phone: form.phone || undefined })
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="auth-brand"><span className="auth-logo">R</span>{t.appName}</div>
        <div>
          <h1>{t.auth.heroTitle}</h1>
          <p>{t.auth.heroSub}</p>
        </div>
        <div />
      </section>

      <section className="auth-panel">
        <button className="auth-lang" onClick={() => setLang(lang === 'en' ? 'mk' : 'en')}>{lang === 'en' ? 'МК' : 'EN'}</button>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-tabs">
            <NavLink to="/login" replace>{t.auth.signIn}</NavLink>
            <NavLink to="/register" replace>{t.auth.createAccount}</NavLink>
          </div>

          {mode === 'register' && (
            <div><label>{t.auth.name}</label><input value={form.displayName} onChange={set('displayName')} autoComplete="name" required /></div>
          )}
          <div><label>{t.auth.email}</label><input type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></div>
          <div>
            <label>{t.auth.password}</label>
            <input type="password" minLength={mode === 'register' ? 8 : undefined} value={form.password} onChange={set('password')}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required />
          </div>
          {mode === 'register' && (
            <>
              <div>
                <label>{t.auth.neighbourhood}</label>
                <input list="neighbourhoods" value={form.neighbourhood} onChange={set('neighbourhood')} placeholder={t.auth.neighbourhoodPlaceholder} required />
                <datalist id="neighbourhoods">{SKOPJE_NEIGHBOURHOODS.map((n) => <option key={n} value={n} />)}</datalist>
                <p className="auth-hint">{t.auth.neighbourhoodHint}</p>
              </div>
              <div>
                <label>{t.auth.phone}</label>
                <input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
                <p className="auth-hint">{t.auth.phoneHint}</p>
              </div>
            </>
          )}

          {error && <p className="error">{error}</p>}
          <button className="primary auth-submit" type="submit" disabled={busy}>{t.auth.continue}</button>
          <p className="auth-terms">{t.auth.terms}</p>
        </form>
      </section>
    </div>
  )
}

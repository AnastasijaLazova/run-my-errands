import { useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { NeighbourhoodInput } from '../components/NeighbourhoodInput'
import type { SignupRole } from '../api/types'

const ROLES: SignupRole[] = ['REQUESTER', 'GIVER', 'BOTH']

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth()
  const { t, lang, setLang } = useI18n()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Set by the landing page: ?role=GIVER preselects the role, ?next= is where to go after (same-site paths only).
  const next = params.get('next')
  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : null
  const query = params.toString() ? `?${params}` : ''
  const [form, setForm] = useState({ displayName: '', email: '', password: '', neighbourhood: '', phone: '' })
  const [role, setRole] = useState<SignupRole>(() => {
    const r = params.get('role') as SignupRole | null
    return r && ROLES.includes(r) ? r : 'REQUESTER'
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        navigate(safeNext ?? '/')
      } else {
        await register({ ...form, phone: form.phone || undefined, role })
        // Givers need categories + prices before anyone can be matched to them.
        navigate(role === 'REQUESTER' ? safeNext ?? '/' : '/giver/onboarding')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth-hero">
        <Link to="/welcome" className="auth-brand"><span className="auth-logo">R</span>{t.appName}</Link>
        <div>
          <h1>{t.auth.heroTitle}</h1>
          <p className="auth-lead">{t.auth.heroLead}</p>
          <p>{t.auth.heroSub}</p>
        </div>
        <div />
      </section>

      <section className="auth-panel">
        <button className="auth-lang" onClick={() => setLang(lang === 'en' ? 'mk' : 'en')}>{lang === 'en' ? 'МК' : 'EN'}</button>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-tabs">
            <NavLink to={`/login${query}`} replace>{t.auth.signIn}</NavLink>
            <NavLink to={`/register${query}`} replace>{t.auth.createAccount}</NavLink>
          </div>

          {mode === 'register' && (
            <fieldset className="role-picker">
              <legend>{t.auth.roleLabel}</legend>
              {ROLES.map((r) => (
                <label key={r} className={`role-option${role === r ? ' active' : ''}`}>
                  <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} />
                  <strong>{t.auth.roles[r].title}</strong>
                  <span>{t.auth.roles[r].hint}</span>
                </label>
              ))}
            </fieldset>
          )}
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
                <NeighbourhoodInput value={form.neighbourhood} onChange={(v) => setForm((f) => ({ ...f, neighbourhood: v }))}
                  placeholder={t.auth.neighbourhoodPlaceholder} ariaLabel={t.auth.neighbourhood} required />
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

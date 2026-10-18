import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

/** Name chip in the header; click opens a small menu with the giver dashboard and log out. */
function UserMenu() {
  const { me, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (!me) return null
  return (
    <div className="user-menu" ref={ref}>
      <button className="user-chip" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="avatar">{initials(me.displayName)}</span>
        {me.displayName.split(' ')[0]}
      </button>
      {open && (
        <div className="menu">
          <Link to="/giver">{t.nav.giverHome}</Link>
          <button onClick={() => { logout(); navigate('/login') }}>{t.nav.logout}</button>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const { me } = useAuth()
  const { t, lang, setLang } = useI18n()

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <NavLink to="/" className="brand"><span className="brand-logo">R</span>{t.appName}</NavLink>
          {me && (
            <nav className="nav">
              <NavLink to="/" end>{t.nav.home}</NavLink>
              <NavLink to="/post">{t.nav.post}</NavLink>
              <NavLink to="/browse">{t.nav.browse}</NavLink>
              <NavLink to="/bookings">{t.nav.bookings}</NavLink>
            </nav>
          )}
          <div className="header-tools">
            <div className="lang-switch">
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
              <button className={lang === 'mk' ? 'active' : ''} onClick={() => setLang('mk')}>MK</button>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="container"><Outlet /></main>
    </>
  )
}

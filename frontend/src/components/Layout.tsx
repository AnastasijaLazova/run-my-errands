import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { useNotifications } from '../notifications/NotificationsContext'

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

/** Name chip in the header; click opens a small menu with the giver dashboard (or giver setup), settings and log out. */
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
        <span className="user-name">{me.displayName.split(' ')[0]}</span>
      </button>
      {open && (
        <div className="menu">
          {me.giver
            ? <Link to="/giver">{t.nav.giverHome}</Link>
            : <Link to="/giver/onboarding">{t.nav.becomeGiver}</Link>}
          <Link to="/settings">{t.nav.settings}</Link>
          <button onClick={() => { logout(); navigate('/welcome') }}>{t.nav.logout}</button>
        </div>
      )}
    </div>
  )
}

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)
const ICONS = {
  home: icon('M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'),
  post: icon('M12 5v14M5 12h14'),
  browse: icon('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.35-4.35'),
  bookings: icon('M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'),
  profile: icon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0'),
  bell: icon('M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0'),
}

/** Header bell with the live unread count; shown on every screen size. */
function Bell() {
  const { me } = useAuth()
  const { t } = useI18n()
  const { unread } = useNotifications()
  if (!me) return null
  const label = unread > 0 ? `${t.notifications.title} (${t.notifications.unread(unread)})` : t.notifications.title
  return (
    <NavLink to="/notifications" className="bell" aria-label={label} title={label}>
      {ICONS.bell}
      {unread > 0 && <span className="bell-badge">{unread > 99 ? '99+' : unread}</span>}
    </NavLink>
  )
}

/** Mobile-only (< 640px, see app.css) replacement for the header nav. */
function TabBar() {
  const { me } = useAuth()
  const { t } = useI18n()
  if (!me) return null
  // Giver-only accounts have no requester home; "/" would just redirect them to their dashboard.
  const home = me.requester ? '/' : '/giver'
  return (
    <nav className="tabbar">
      <NavLink to={home} end>{ICONS.home}<span>{t.nav.home}</span></NavLink>
      {me.requester && <NavLink to="/post">{ICONS.post}<span>{t.nav.postShort}</span></NavLink>}
      {me.giver && <NavLink to="/browse">{ICONS.browse}<span>{t.nav.browseShort}</span></NavLink>}
      <NavLink to="/bookings">{ICONS.bookings}<span>{t.nav.bookingsShort}</span></NavLink>
      <NavLink to="/settings">{ICONS.profile}<span>{t.nav.profile}</span></NavLink>
    </nav>
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
              {me.requester && <NavLink to="/post">{t.nav.post}</NavLink>}
              {me.giver && <NavLink to="/browse">{t.nav.browse}</NavLink>}
              <NavLink to="/bookings">{t.nav.bookings}</NavLink>
            </nav>
          )}
          <div className="header-tools">
            <div className="lang-switch">
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
              <button className={lang === 'mk' ? 'active' : ''} onClick={() => setLang('mk')}>MK</button>
            </div>
            <Bell />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="container"><Outlet /></main>
      <TabBar />
    </>
  )
}

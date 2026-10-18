import { Link } from 'react-router-dom'
import { meApi } from '../api/endpoints'
import type { DashboardRequest } from '../api/types'
import { useAsync } from '../components/useAsync'
import { Async } from '../components/Status'
import { initials } from '../components/Layout'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import type { Dict } from '../i18n/en'
import { categoryColor } from '../categoryColors'

/** 2100 → "2 100" — the space-grouped style used for денари. */
export const formatDen = (n: number | null | undefined) =>
  n == null ? '—' : Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

function greeting(t: Dict) {
  const h = new Date().getHours()
  return h < 12 ? t.dash.morning : h < 18 ? t.dash.afternoon : t.dash.evening
}

export function formatWhen(t: Dict, lang: string, iso: string | null) {
  if (!iso) return t.favor.asap
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `${t.dash.today} ${time}`
  if (d.toDateString() === tomorrow.toDateString()) return `${t.dash.tomorrow} ${time}`
  return d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' }) + ` ${time}`
}

function formatDay(t: Dict, lang: string, iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === new Date().toDateString()) return t.dash.today.toLowerCase()
  if (d.toDateString() === yesterday.toDateString()) return t.dash.yesterday
  return d.toLocaleDateString(lang, { day: 'numeric', month: 'short' })
}

/** Detail line, badge and link target for one request row, derived from the favor + its booking. */
function describe(r: DashboardRequest, t: Dict, lang: string) {
  const when = r.whenType === 'SCHEDULED' ? formatWhen(t, lang, r.whenAt) : t.favor.asap
  const b = r.booking
  if (!b) {
    return { detail: `${when} · ${t.dash.matches(r.matchCount ?? 0)}`, badge: t.dash.live, tone: 'live', to: `/favors/${r.favorId}/matches` }
  }
  const to = `/bookings/${b.id}`
  const name = b.giverName ?? ''
  switch (b.status) {
    case 'REQUESTED': return { detail: `${when} · ${t.dash.waitingFor(name)}`, badge: t.dash.requested, tone: 'outline', to }
    case 'CONFIRMED': return { detail: `${when} · ${t.dash.confirmedWith(name)}`, badge: t.dash.confirmed, tone: 'outline', to }
    default: return b.needsRating
      ? { detail: `${t.dash.completed} ${formatDay(t, lang, b.completedAt)} · ${t.dash.needsRating}`, badge: t.dash.rate, tone: 'solid', to: `/bookings/${b.id}/rate` }
      : { detail: `${t.dash.completed} ${formatDay(t, lang, b.completedAt)}`, badge: t.dash.done, tone: 'grey', to }
  }
}

export default function RequesterDashboard() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const { data, loading, error } = useAsync(() => meApi.requesterDashboard())

  const live = data?.requests.filter((r) => !r.booking && r.favorStatus === 'OPEN').length ?? 0
  const confirmed = data?.requests.filter((r) => r.booking?.status === 'CONFIRMED').length ?? 0
  const firstName = me?.displayName.split(' ')[0] ?? ''

  return (
    <Async loading={loading} error={error}>
      {data && (
        <>
          <section className="card hero-card">
            <div>
              <span className="eyebrow">{t.nav.requester}</span>
              <h1 className="hero-title">{greeting(t)}, {firstName}.</h1>
              <p className="hero-sub">{t.dash.summary(live, confirmed)}</p>
              <div className="btn-row">
                <Link to="/post" className="button primary lg">{t.nav.post}</Link>
                <Link to="/bookings" className="button lg">{t.nav.bookings}</Link>
              </div>
            </div>
            <div className="stat-list">
              <div className="stat"><span>{t.dash.completedCount}</span><strong>{data.stats.completedCount}</strong></div>
              <div className="stat">
                <span>{t.dash.yourRating}</span>
                <strong className="accent">{data.stats.ratingCount > 0 ? data.stats.ratingAvg.toFixed(1) : '—'}</strong>
              </div>
            </div>
          </section>

          <div className="dash-grid">
            <section>
              <h2 className="section-title">{t.dash.yourRequests}</h2>
              {data.requests.length === 0 && <div className="card muted">{t.dash.noRequests}</div>}
              {data.requests.map((r) => {
                const d = describe(r, t, lang)
                const price = r.booking?.price ?? r.budget
                return (
                  <div className="card request-row" key={r.favorId}>
                    <span className="tile" style={{ background: categoryColor(r.categoryKey) }}>{r.title.trim()[0]?.toUpperCase()}</span>
                    <div className="request-text">
                      <strong>{r.title}</strong>
                      <span className="muted">{d.detail}</span>
                    </div>
                    {price != null && <span className="request-price">{formatDen(price)} {t.dash.den}</span>}
                    <span className={`badge ${d.tone}`}>{d.badge}</span>
                    <Link to={d.to} className="button">{t.dash.open}</Link>
                  </div>
                )
              })}
            </section>

            <div className="side-col">
              {me && !me.giver && (
                <aside className="card side-card become-giver">
                  <span className="eyebrow">{t.dash.becomeGiverEyebrow}</span>
                  <h3>{t.dash.becomeGiverTitle}</h3>
                  <p className="muted">{t.dash.becomeGiverText}</p>
                  <Link to="/giver/onboarding" className="button primary block">{t.nav.becomeGiver}</Link>
                </aside>
              )}
              {data.toRate.length > 0 && (
                <aside className="card side-card">
                  <h3>{t.dash.waitingOnRating}</h3>
                  <p className="muted small">{t.dash.ratingTwoWay}</p>
                  {data.toRate.map((r) => (
                    <div key={r.bookingId} className="stack">
                      <div className="person-box">
                        <span className="avatar dark">{initials(r.giverName ?? '')}</span>
                        <div>
                          <strong>{r.giverName}</strong>
                          <div className="muted small">{r.favorTitle} · {formatDay(t, lang, r.completedAt)}</div>
                        </div>
                      </div>
                      <Link to={`/bookings/${r.bookingId}/rate`} className="button primary block">{t.dash.rateName((r.giverName ?? '').split(' ')[0])}</Link>
                    </div>
                  ))}
                </aside>
              )}
            </div>
          </div>
        </>
      )}
    </Async>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi, favorsApi, giversApi, meApi, offersApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { useLiveRefresh } from '../notifications/NotificationsContext'
import { Async } from '../components/Status'
import { initials } from '../components/Layout'
import { useI18n } from '../i18n/I18nContext'
import { neighbourhoodDistanceKm, neighbourhoodLabel } from '../neighbourhoods'
import { useAuth } from '../auth/AuthContext'
import { nameColor } from '../components/avatar'
import type { Dict } from '../i18n/en'
import { categoryColor } from '../categoryColors'
import { formatDen, formatWhen } from './RequesterDashboard'

/** "Maja Angelovska" → "Maja A." */
const shortName = (name: string | null) => {
  const [first = '', last = ''] = (name ?? '').trim().split(/\s+/)
  return last ? `${first} ${last[0]}.` : first
}

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n))

function sentAgo(t: Dict, iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return t.gdash.sent(minutes, 'm')
  if (minutes < 60 * 24) return t.gdash.sent(Math.floor(minutes / 60), 'h')
  return t.gdash.sent(Math.floor(minutes / (60 * 24)), 'd')
}

// A direct request expires 24 hours after it was sent (BookingLifecycleJob.REQUEST_TTL on the backend).
const REQUEST_TTL_MS = 24 * 60 * 60 * 1000

function expiresIn(t: Dict, expiresAt: string | undefined, requestedAt: string) {
  const end = expiresAt ? new Date(expiresAt).getTime() : new Date(requestedAt).getTime() + REQUEST_TTL_MS
  const minutes = Math.floor((end - Date.now()) / 60000)
  if (Number.isNaN(minutes)) return ''
  return minutes < 60 ? t.gdash.expires(minutes, 'm') : t.gdash.expires(Math.floor(minutes / 60), 'h')
}


export default function GiverDashboard() {
  const { t, lang } = useI18n()
  const { me } = useAuth()
  const dash = useAsync(() => meApi.giverDashboard())
  const listing = useAsync(() => (me ? giversApi.get(me.id) : Promise.resolve(null)), [me?.id])
  useLiveRefresh(() => { dash.refresh(); offers.refresh() })
  // Pending offers this giver sent on open favors, with the favor title for context.
  const offers = useAsync(async () => {
    const pending = (await offersApi.mine()).filter((o) => o.status === 'PENDING')
    const favors = await Promise.all(pending.map((o) => favorsApi.get(o.favorId)))
    return pending.map((o, i) => ({ ...o, favorTitle: favors[i].title }))
  })
  const [busy, setBusy] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const respond = async (bookingId: number, accept: boolean) => {
    setBusy(bookingId)
    setActionError(null)
    try {
      await (accept ? bookingsApi.accept(bookingId) : bookingsApi.decline(bookingId))
      dash.reload()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const complete = async (bookingId: number) => {
    setBusy(bookingId)
    setActionError(null)
    try { await bookingsApi.complete(bookingId); dash.reload() }
    catch (err) { setActionError((err as Error).message) }
    finally { setBusy(null) }
  }

  const when = (whenType: 'ASAP' | 'SCHEDULED', whenAt: string | null) =>
    whenType === 'SCHEDULED' ? formatWhen(t, lang, whenAt) : t.favor.asap

  return (
    <Async loading={dash.loading} error={dash.error}>
      {dash.data && (() => {
        const { stats, requests, upcoming, recentRatings } = dash.data
        return (
          <div className="gdash-page">
            <section className="gdash-head">
              <div>
                <span className="eyebrow">{t.gdash.eyebrow}</span>
                <h1 className="gdash-title">{t.gdash.headline(requests.length)}</h1>
                <p className="muted gdash-sub">{t.gdash.sub}</p>
              </div>
              <div className="btn-row">
                <Link to="/giver/onboarding" className="button lg">{t.gdash.editCategories}</Link>
                <Link to="/browse" className="button primary lg">{t.nav.browse}</Link>
              </div>
            </section>

            <div className="gdash-stats">
              <div className="card gdash-stat"><span>{t.gdash.favorsDone}</span><strong>{stats.completedCount}</strong></div>
              <div className="card gdash-stat">
                <span>{t.gdash.avgRating}</span>
                <strong>{stats.ratingCount > 0 ? Number(stats.ratingAvg).toFixed(1) : '—'}</strong>
              </div>
              <div className="card gdash-stat">
                <span>{t.gdash.acceptRate}</span>
                <strong>{stats.acceptRate != null ? `${stats.acceptRate}%` : '—'}</strong>
              </div>
              <div className="card gdash-stat">
                <span>{t.gdash.earned}</span>
                <strong>{formatDen(stats.earnedThisMonth)} <small>{t.dash.den}</small></strong>
              </div>
            </div>

            <div className="dash-grid">
              <div>
                <h2 className="section-title">{t.gdash.requestsForYou}</h2>
                {actionError && <p className="error">{actionError}</p>}
                {requests.length === 0 && <div className="card muted">{t.gdash.noRequests}</div>}
                {requests.map((r) => {
                  const category = lang === 'mk' ? r.categoryNameMk : r.categoryNameEn
                  const km = neighbourhoodDistanceKm(me?.neighbourhood ?? '', r.neighbourhood)
                  return (
                    <article className="card incoming" key={r.bookingId}>
                      <div className="incoming-top">
                        <span className="tile" style={{ background: nameColor(r.requesterName) }}>{initials(r.requesterName ?? '')}</span>
                        <div className="request-text">
                          <strong className="incoming-name">{r.requesterName}</strong>
                          <span className="incoming-meta">
                            <i className="cat-dot" style={{ background: categoryColor(r.categoryKey) }} />
                            {[category, neighbourhoodLabel(r.neighbourhood, lang) + (km != null ? ` (${t.matches.km(km)})` : ''), when(r.whenType, r.whenAt)].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                        <div className="incoming-price">
                          {r.price != null && <strong>{formatDen(r.price)} {t.dash.den}</strong>}
                          <span className="muted small">{expiresIn(t, r.expiresAt, r.requestedAt)}</span>
                          <span className="muted small">{sentAgo(t, r.requestedAt)}</span>
                        </div>
                      </div>
                      {r.note && <p className="incoming-note">{r.note}</p>}
                      <div className="incoming-actions">
                        <button className="primary" disabled={busy === r.bookingId} onClick={() => respond(r.bookingId, true)}>{t.gdash.accept}</button>
                        <button disabled={busy === r.bookingId} onClick={() => respond(r.bookingId, false)}>{t.gdash.decline}</button>
                      </div>
                    </article>
                  )
                })}

                {upcoming.length > 0 && (
                  <>
                    <h2 className="section-title gdash-subsection">{t.gdash.upcoming}</h2>
                    {upcoming.map((u) => (
                      <div className="card request-row" key={u.bookingId}>
                        <div className="request-text">
                          <strong>{u.favorTitle}</strong>
                          <span className="muted">{[u.requesterName, when(u.whenType, u.whenAt)].filter(Boolean).join(' · ')}</span>
                        </div>
                        {u.price != null && <span className="request-price">{formatDen(u.price)} {t.dash.den}</span>}
                        <div className="btn-row">
                          <button className="primary" disabled={busy === u.bookingId} onClick={() => complete(u.bookingId)}>{t.booking.complete}</button>
                          <Link to={`/bookings/${u.bookingId}`} className="button">{t.gdash.open}</Link>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {offers.data && offers.data.length > 0 && (
                  <>
                    <h2 className="section-title gdash-subsection">{t.gdash.yourOffers}</h2>
                    {offers.data.map((o) => (
                      <div className="card request-row" key={o.id}>
                        <div className="request-text">
                          <strong>{o.favorTitle}</strong>
                          {o.message && <span className="muted">{o.message}</span>}
                        </div>
                        {o.proposedPrice != null && <span className="request-price">{formatDen(o.proposedPrice)} {t.dash.den}</span>}
                        <button onClick={async () => { await offersApi.withdraw(o.id); offers.reload() }}>{t.gdash.withdraw}</button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div className="side-col">
              <aside className="card side-card">
                <h3>{t.gdash.recentRatings}</h3>
                {recentRatings.length === 0 && <p className="muted small">{t.gdash.noRatings}</p>}
                {recentRatings.map((r, i) => (
                  <div className="rating-row" key={i}>
                    <span className="avatar" style={{ background: nameColor(r.authorName) }}>{initials(r.authorName ?? '')}</span>
                    <div>
                      <div><strong>{shortName(r.authorName)}</strong> <span className="stars" aria-label={`${r.stars}/5`}>{stars(r.stars)}</span></div>
                      {r.text && <p className="muted small">{r.text}</p>}
                    </div>
                  </div>
                ))}
              </aside>

              {listing.data && (
                <aside className="card listing-card">
                  <span className="eyebrow-text">{t.gdash.listing}</span>
                  <p>{listing.data.categories.length > 0 ? t.gdash.listingSub(listing.data.categories.length) : t.gdash.noListing}</p>
                  {listing.data.categories.map((c) => (
                    <div className="listing-row" key={c.categoryId}>
                      <span>{lang === 'mk' ? c.nameMk : c.nameEn}</span>
                      <strong>{formatDen(c.price)} {t.dash.den}</strong>
                    </div>
                  ))}
                  <Link to="/giver/onboarding" className="button">{t.gdash.editListing}</Link>
                </aside>
              )}
              </div>
            </div>
          </div>
        )
      })()}
    </Async>
  )
}

import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bookingsApi, categoriesApi, favorsApi, giversApi, reviewsApi } from '../api/endpoints'
import type { Favor } from '../api/types'
import { useAsync } from '../components/useAsync'
import { useLiveRefresh } from '../notifications/NotificationsContext'
import { Async, StatusPill } from '../components/Status'
import { avatarColor, initials } from '../components/avatar'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { neighbourhoodDistanceKm, neighbourhoodLabel } from '../neighbourhoods'
import { categoryColor } from '../categoryColors'

const LIVE = ['REQUESTED', 'CONFIRMED']
const REVEALED = ['CONFIRMED', 'COMPLETED', 'CLOSED']
const DONE = ['COMPLETED', 'CLOSED']

export default function BookingDetail() {
  const id = Number(useParams().id)
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const [error, setError] = useState<string | null>(null)
  const booking = useAsync(() => bookingsApi.get(id), [id])
  // Status changes from the other side (accept, decline, done...) show up without a reload.
  useLiveRefresh(booking.refresh, (n) => n.bookingId === id)
  const b = booking.data
  const isGiver = b?.giverId === me?.id
  const revealed = !!b && REVEALED.includes(b.status)

  const favor = useAsync(() => (b ? favorsApi.get(b.favorId) : Promise.resolve(null)), [b?.favorId])
  // The requester sees who they booked; the giver sees the request itself (the requester has no public profile).
  const giver = useAsync(() => (b && !isGiver ? giversApi.get(b.giverId) : Promise.resolve(null)), [b?.giverId, isGiver])
  const categories = useAsync(() => categoriesApi.list(), [])
  const contact = useAsync(() => (revealed ? bookingsApi.contact(id) : Promise.resolve(null)), [id, b?.status])
  const review = useAsync(() => (b && DONE.includes(b.status) ? reviewsApi.status(id) : Promise.resolve(null)), [id, b?.status])

  const act = (fn: () => Promise<unknown>) => async () => {
    setError(null)
    try { await fn(); booking.reload() } catch (e) { setError((e as Error).message) }
  }
  const cancel = () => {
    const reason = window.prompt(t.bdetail.cancelPrompt)
    if (reason === null) return
    act(() => bookingsApi.cancel(id, reason.trim() || undefined))()
  }

  const f = favor.data
  const g = giver.data
  const categoryName = (c: { nameEn: string; nameMk: string }) => (lang === 'mk' ? c.nameMk : c.nameEn)
  const categoryKey = (categoryId: number) => categories.data?.find((c) => c.id === categoryId)?.key ?? ''
  const favorCategory = f ? categoryName({ nameEn: f.categoryNameEn, nameMk: f.categoryNameMk }) : ''
  const km = f && (isGiver ? neighbourhoodDistanceKm(me?.neighbourhood ?? '', f.neighbourhood) : g && neighbourhoodDistanceKm(f.neighbourhood, g.neighbourhood))
  const kmText = km != null ? t.matches.km(km) : null
  const otherName = isGiver ? (contact.data?.displayName ?? t.bdetail.hiddenName) : (g?.displayName ?? '')

  const hint = !b ? '' : b.status === 'REQUESTED' ? (isGiver ? t.bdetail.hint.requestedGiver : t.bdetail.hint.requestedRequester(otherName))
    : b.status === 'CONFIRMED' ? t.bdetail.hint.confirmed
    : b.status === 'COMPLETED' ? (review.data?.mineSubmitted ? t.bdetail.hint.reviewed : t.bdetail.hint.completed)
    : b.status === 'CLOSED' ? t.bdetail.hint.closed : t.bdetail.hint.ended

  return (
    <Async loading={booking.loading} error={booking.error}>
      {b && (
        <div className="booking-page">
          <Link to="/bookings" className="back-link">{t.bdetail.back}</Link>
          <div className="booking-layout">
            <div>
              {!isGiver && g && (
                <>
                  <div className="card profile-card">
                    <div className="profile-top">
                      <div className="profile-avatar" style={{ background: avatarColor(g.userId) }}>{initials(g.displayName)}</div>
                      <div className="profile-id">
                        <div className="profile-name">
                          <h1>{g.displayName}</h1>
                          {g.verified && <span className="verified">{t.matches.verified}</span>}
                        </div>
                        <div className="match-meta">
                          {g.ratingCount > 0
                            ? <><strong>★ {g.ratingAvg.toFixed(1)}</strong><span>{t.matches.ratings(g.ratingCount)}</span></>
                            : <span className="pill grey">{t.matches.newGiver}</span>}
                          <span>{neighbourhoodLabel(g.neighbourhood, lang)}{kmText && ` · ${t.bdetail.away(kmText)}`}</span>
                          {g.completedCount > 0 && <span>{t.matches.done(g.completedCount)}</span>}
                        </div>
                      </div>
                      {b.price != null && (
                        <div className="profile-price">
                          <div className="match-price">{b.price} <span>MKD</span></div>
                          <div className="muted small">{t.bdetail.forCategory(favorCategory)}</div>
                        </div>
                      )}
                    </div>
                    {g.bio && <p className="profile-bio">{g.bio}</p>}
                  </div>

                  <div className="card profile-section">
                    <h2>{t.bdetail.categories}</h2>
                    {g.categories.map((c) => {
                      const cat = categories.data?.find((x) => x.id === c.categoryId)
                      return (
                        <div className={`cat-row${f?.categoryId === c.categoryId ? ' active' : ''}`} key={c.categoryId}>
                          <span className="tile sm" style={{ background: categoryColor(cat?.key ?? '') }}>{categoryName(c)[0]}</span>
                          <strong className="cat-name">{categoryName(c)}</strong>
                          {cat && <span className="muted small">{t.bdetail.trust[cat.trustTier]}</span>}
                          <span className="cat-price">{c.price} MKD</span>
                        </div>
                      )
                    })}
                    <Link to={`/givers/${g.userId}`} className="small">{t.bdetail.profile} →</Link>
                  </div>
                </>
              )}

              {isGiver && f && (
                <div className="card profile-card">
                  <div className="profile-top">
                    <div className="profile-avatar" style={{ background: categoryColor(categoryKey(f.categoryId)) }}>{favorCategory[0]}</div>
                    <div className="profile-id">
                      <div className="eyebrow-text">{t.bdetail.theRequest} · {favorCategory}</div>
                      <h1>{f.title}</h1>
                      <div className="match-meta">
                        <span>{whenText(f, lang, t.bdetail.anyTime)}</span>
                        <span>{neighbourhoodLabel(f.neighbourhood, lang)}{kmText && ` · ${t.bdetail.away(kmText)}`}</span>
                      </div>
                    </div>
                    {b.price != null && <div className="profile-price"><div className="match-price">{b.price} <span>MKD</span></div></div>}
                  </div>
                  {f.description && <p className="profile-bio">{f.description}</p>}
                  {b.note && <div className="note-box"><strong>{t.bdetail.note}</strong><p>{b.note}</p></div>}
                </div>
              )}
            </div>

            <aside className="card booking-side">
              <div className="row">
                <span className="eyebrow-text">{isGiver ? t.bdetail.theRequest : t.bdetail.yourRequest}</span>
                <StatusPill status={b.status} label={t.bdetail.status[b.status]} />
              </div>
              {f && <>
                <h3>{favorCategory}</h3>
                <p className="muted side-sub">{f.title}<br />{whenText(f, lang, t.bdetail.anyTime)} · {neighbourhoodLabel(f.neighbourhood, lang)}</p>
              </>}
              <dl className="price-rows">
                {!isGiver && f?.budget != null && <><dt>{t.bdetail.yourPrice}</dt><dd>{f.budget} MKD</dd></>}
                {b.price != null && <><dt>{isGiver || !g ? t.bdetail.agreed : t.bdetail.asks(g.displayName.split(' ')[0])}</dt><dd>{b.price} MKD</dd></>}
                {kmText && <><dt>{t.bdetail.distance}</dt><dd>{kmText}</dd></>}
              </dl>

              <div className="contact-box">
                <span className="eyebrow-text">{t.booking.contact}</span>
                {revealed && contact.data
                  ? <div><strong>{contact.data.displayName}</strong>
                      {contact.data.phone ? <a className="phone" href={`tel:${contact.data.phone}`}>{contact.data.phone}</a> : <div className="muted">—</div>}
                    </div>
                  : <p className="muted small">{t.booking.contactHidden}</p>}
              </div>

              {error && <p className="error">{error}</p>}
              <div className="side-actions">
                {b.status === 'REQUESTED' && isGiver && <>
                  <button className="primary big" onClick={act(() => bookingsApi.accept(id))}>{t.booking.accept}</button>
                  <button onClick={act(() => bookingsApi.decline(id))}>{t.booking.decline}</button>
                </>}
                {b.status === 'CONFIRMED' && isGiver && <button className="primary big" onClick={act(() => bookingsApi.complete(id))}>{t.booking.complete}</button>}
                {DONE.includes(b.status) && review.data && !review.data.mineSubmitted &&
                  <Link to={`/bookings/${id}/rate`} className="button primary big">{t.booking.rate}</Link>}
                {LIVE.includes(b.status) && <button className="danger" onClick={cancel}>{t.booking.cancel}</button>}
              </div>
              {b.cancelReason && <p className="small"><strong>{t.bdetail.cancelReason}:</strong> {b.cancelReason}</p>}
              <p className="muted small side-hint">{hint}</p>
            </aside>
          </div>
        </div>
      )}
    </Async>
  )
}

function whenText(f: Favor, lang: 'en' | 'mk', asap: string) {
  if (f.whenType === 'ASAP' || !f.whenAt) return asap
  return new Date(f.whenAt).toLocaleString(lang === 'mk' ? 'mk-MK' : 'en-GB',
    { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

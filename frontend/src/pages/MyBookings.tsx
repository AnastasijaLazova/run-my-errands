import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../api/endpoints'
import type { BookingListItem } from '../api/types'
import { useAsync } from '../components/useAsync'
import { useLiveRefresh } from '../notifications/NotificationsContext'
import { Async, StatusPill } from '../components/Status'
import { avatarColor, initials } from '../components/avatar'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import type { Dict } from '../i18n/en'
import { formatDen, formatWhen } from './RequesterDashboard'

const ENDED = ['DECLINED', 'CANCELLED', 'EXPIRED']

/** 1 Sent · 2 Confirmed · 3 Done · 4 Rated (by me). */
function step(b: BookingListItem) {
  if (b.myStars != null || b.status === 'CLOSED') return 4
  if (b.status === 'COMPLETED') return 3
  if (b.status === 'CONFIRMED') return 2
  return 1
}

// Still needs something from someone: not ended, and not yet rated by me.
const isActive = (b: BookingListItem) => !ENDED.includes(b.status) && step(b) < 4

function timeLeft(t: Dict, iso: string | null) {
  const minutes = iso ? Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60000)) : 0
  return t.mybookings.duration(Math.floor(minutes / 60), minutes % 60)
}

const starText = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

export default function MyBookings() {
  const { t, lang } = useI18n()
  const { me } = useAuth()
  const both = !!me?.requester && !!me?.giver
  const [role, setRole] = useState<'requester' | 'giver'>(me && !me.requester ? 'giver' : 'requester')
  const { data, loading, error, refresh, reload } = useAsync(() => bookingsApi.list(role), [role])
  useLiveRefresh(refresh, (n) => n.bookingId != null)
  const [busy, setBusy] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const asGiver = role === 'giver'

  const act = (id: number, fn: () => Promise<unknown>) => async () => {
    setBusy(id)
    setActionError(null)
    try { await fn(); reload() } catch (e) { setActionError((e as Error).message) } finally { setBusy(null) }
  }

  const category = (b: BookingListItem) => (lang === 'mk' ? b.categoryNameMk : b.categoryNameEn)
  const when = (b: BookingListItem) => (b.whenType === 'SCHEDULED' ? formatWhen(t, lang, b.whenAt) : t.favor.asap)
  const firstName = (b: BookingListItem) => (b.otherName ?? t.notifications.someone).split(' ')[0]

  const active = data?.filter(isActive) ?? []
  const past = data?.filter((b) => !isActive(b)) ?? []

  return (
    <div className="mybookings">
      <div className="notif-head">
        <div>
          <h1>{t.booking.title}</h1>
          <p className="sub">{t.mybookings.sub}</p>
        </div>
        {both && (
          <div className="btn-row">
            <button className={`sort-chip${!asGiver ? ' active' : ''}`} onClick={() => setRole('requester')}>{t.booking.asRequester}</button>
            <button className={`sort-chip${asGiver ? ' active' : ''}`} onClick={() => setRole('giver')}>{t.booking.asGiver}</button>
          </div>
        )}
      </div>

      {actionError && <p className="error">{actionError}</p>}
      <Async loading={loading} error={error}>
        {active.length === 0 && <div className="card muted">{t.mybookings.noActive}</div>}
        {active.map((b) => {
          const s = step(b)
          const name = firstName(b)
          return (
            <article className="card track-card" key={b.id}>
              <div className="track-top">
                <span className="track-avatar" style={{ background: avatarColor(b.otherUserId) }}>{initials(b.otherName ?? '')}</span>
                <div className="track-who">
                  <strong>{b.otherName ?? t.notifications.someone}</strong>
                  <span className="muted small">{[category(b), when(b), b.price != null ? `${formatDen(b.price)} ${t.dash.den}` : null].filter(Boolean).join(' · ')}</span>
                </div>
                <span className="badge outline">{t.bdetail.status[b.status]}</span>
                {b.status === 'CONFIRMED' &&
                  <span className={`badge ${b.paymentStatus ? 'grey' : 'amber'}`}>{t.pay.status[b.paymentStatus ?? 'UNPAID']}</span>}
              </div>

              <ol className="steps">
                {t.mybookings.steps.map((label, i) => (
                  <li key={label} className={i < s ? 'done' : ''}><span />{label}</li>
                ))}
              </ol>

              <div className="track-box">
                {b.status === 'REQUESTED' && !asGiver && <>
                  <h3>{t.mybookings.waitingTitle(name)}</h3>
                  <p>{t.mybookings.waitingSub(timeLeft(t, b.expiresAt))}</p>
                  <div className="btn-row center">
                    <Link to={`/bookings/${b.id}`} className="button">{t.mybookings.open}</Link>
                    <button className="danger" disabled={busy === b.id} onClick={act(b.id, () => bookingsApi.cancel(b.id))}>{t.mybookings.cancelRequest}</button>
                  </div>
                </>}
                {b.status === 'REQUESTED' && asGiver && <>
                  <h3>{t.mybookings.incomingTitle(name)}</h3>
                  <p>{t.mybookings.incomingSub(timeLeft(t, b.expiresAt))}</p>
                  <div className="btn-row center">
                    <button className="primary" disabled={busy === b.id} onClick={act(b.id, () => bookingsApi.accept(b.id))}>{t.booking.accept}</button>
                    <button disabled={busy === b.id} onClick={act(b.id, () => bookingsApi.decline(b.id))}>{t.booking.decline}</button>
                  </div>
                </>}
                {b.status === 'CONFIRMED' && <>
                  <h3>{t.mybookings.confirmedTitle}</h3>
                  <p>{asGiver ? t.mybookings.confirmedGiver(name) : t.mybookings.confirmedRequester(name)}</p>
                  {!b.paymentStatus && <p className="small muted">{asGiver ? t.pay.awaitingGiver : t.pay.awaitingRequester}</p>}
                  <div className="btn-row center">
                    {asGiver && <button className="primary" disabled={busy === b.id || !b.paymentStatus} onClick={act(b.id, () => bookingsApi.complete(b.id))}>{t.booking.complete}</button>}
                    {!asGiver && !b.paymentStatus && <Link to={`/bookings/${b.id}`} className="button primary">{t.pay.payShort}</Link>}
                    <Link to={`/bookings/${b.id}`} className="button">{t.mybookings.open}</Link>
                  </div>
                </>}
                {b.status === 'COMPLETED' && <>
                  <h3>{t.mybookings.doneTitle}</h3>
                  <p>{t.mybookings.doneSub(name)}</p>
                  <div className="btn-row center">
                    <Link to={`/bookings/${b.id}/rate`} className="button primary">{t.mybookings.rate}</Link>
                  </div>
                </>}
              </div>
            </article>
          )
        })}

        <h2 className="section-title past-title">{t.mybookings.past}</h2>
        {past.length === 0 && <div className="card muted">{t.mybookings.noPast}</div>}
        {past.map((b) => (
          <Link to={`/bookings/${b.id}`} className="card past-row" key={b.id}>
            <span className="past-avatar" style={{ background: avatarColor(b.otherUserId) }}>{initials(b.otherName ?? '')}</span>
            <span className="track-who">
              <strong>{b.otherName ?? t.notifications.someone}</strong>
              <span className="muted small">{category(b)} · {when(b)}</span>
            </span>
            {b.myStars != null
              ? <span className="stars" aria-label={`${b.myStars}/5`}>{starText(b.myStars)}</span>
              : <StatusPill status={b.status} label={t.bdetail.status[b.status]} />}
            {b.paymentStatus?.includes('REFUNDED') && <span className="badge grey">{t.pay.status[b.paymentStatus]}</span>}
            {b.price != null && <strong className="past-price">{formatDen(b.price)} {t.dash.den}</strong>}
          </Link>
        ))}
      </Async>
    </div>
  )
}

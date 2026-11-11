import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api/endpoints'
import type { AppNotification, NotificationType } from '../api/types'
import { useAsync } from '../components/useAsync'
import { Async } from '../components/Status'
import { useI18n } from '../i18n/I18nContext'
import type { Dict } from '../i18n/en'
import { initials, nameColor } from '../components/avatar'
import { formatDen } from './RequesterDashboard'
import { useLiveRefresh, useNotifications } from '../notifications/NotificationsContext'

/** Where tapping a notification takes you. */
export function notificationTarget(n: AppNotification): string {
  switch (n.type) {
    case 'BOOKING_COMPLETED': return n.bookingId ? `/bookings/${n.bookingId}/rate` : '/bookings'
    case 'OFFER_RECEIVED': return n.favorId ? `/favors/${n.favorId}/matches` : '/'
    case 'OFFER_REJECTED': return '/browse'
    default: return n.bookingId ? `/bookings/${n.bookingId}` : '/bookings'
  }
}

/** The one button on each notification, matching where it leads. */
// Colour family per kind of event (see .notif.tone-* in app.css).
const TONE: Record<NotificationType, 'new' | 'good' | 'review' | 'bad' | 'refund'> = {
  BOOKING_REQUESTED: 'new', OFFER_RECEIVED: 'new',
  BOOKING_ACCEPTED: 'good', BOOKING_COMPLETED: 'good', OFFER_ACCEPTED: 'good', PAYMENT_RECEIVED: 'good', PAYOUT_RELEASED: 'good',
  REVIEW_RECEIVED: 'review',
  BOOKING_DECLINED: 'bad', BOOKING_CANCELLED: 'bad', BOOKING_EXPIRED: 'bad', OFFER_REJECTED: 'bad',
  REFUND_ISSUED: 'refund',
}

function actionLabel(t: Dict, n: AppNotification) {
  switch (n.type) {
    case 'BOOKING_COMPLETED': return t.notifications.action.rate
    case 'OFFER_RECEIVED': return t.notifications.action.offers
    case 'OFFER_REJECTED': return t.notifications.action.browse
    default: return t.notifications.action.view
  }
}

export function timeAgo(t: Dict, iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return t.notifications.ago.now
  if (minutes < 60) return t.notifications.ago.minutes(minutes)
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t.notifications.ago.hours(hours)
  const days = Math.floor(hours / 24)
  return days === 1 ? t.notifications.ago.yesterday : t.notifications.ago.days(days)
}

export default function Notifications() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { unread, refreshUnread } = useNotifications()
  const list = useAsync(() => notificationsApi.list())
  useLiveRefresh(list.refresh)

  const open = async (n: AppNotification) => {
    if (!n.read) {
      try { await notificationsApi.markRead(n.id) } catch { /* still navigate */ }
      refreshUnread()
    }
    navigate(notificationTarget(n))
  }

  const markAll = async () => {
    await notificationsApi.markAllRead()
    refreshUnread()
    list.refresh()
  }

  return (
    <div className="notif-page">
      <div className="notif-head">
        <div>
          <h1>{t.notifications.title}</h1>
          <p className="sub">{t.notifications.sub}{unread > 0 && <> · <strong>{t.notifications.unread(unread)}</strong></>}</p>
        </div>
        {unread > 0 && <button onClick={markAll}>{t.notifications.markAllRead}</button>}
      </div>
      <Async loading={list.loading} error={list.error}>
        {list.data?.length === 0 && <div className="card muted">{t.notifications.empty}</div>}
        <ul className="notif-list">
          {list.data?.map((n) => (
            <li key={n.id} className={`card notif tone-${TONE[n.type] ?? 'new'}${n.read ? '' : ' unread'}`} onClick={() => open(n)}>
              <span className="notif-avatar" style={{ background: nameColor(n.actorName) }}>
                {n.actorName ? initials(n.actorName) : '!'}
              </span>
              <span className="notif-body">
                <span className="notif-text">
                  {t.notifications.text[n.type](n.actorName || t.notifications.someone, n.favorTitle || t.notifications.aFavor,
                    n.amount != null ? `${formatDen(n.amount)} ${t.dash.den}` : '')}
                </span>
                <time className="muted small" dateTime={n.createdAt}
                      title={new Date(n.createdAt).toLocaleString(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}>
                  {timeAgo(t, n.createdAt)}
                </time>
              </span>
              <button className="notif-action" onClick={(e) => { e.stopPropagation(); open(n) }}>{actionLabel(t, n)}</button>
            </li>
          ))}
        </ul>
      </Async>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api/endpoints'
import type { AppNotification } from '../api/types'
import { useAsync } from '../components/useAsync'
import { Async } from '../components/Status'
import { useI18n } from '../i18n/I18nContext'
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
    <>
      <div className="row notif-head">
        <div>
          <h1>{t.notifications.title}</h1>
          {unread > 0 && <p className="sub">{t.notifications.unread(unread)}</p>}
        </div>
        {unread > 0 && <button onClick={markAll}>{t.notifications.markAllRead}</button>}
      </div>
      <Async loading={list.loading} error={list.error}>
        {list.data?.length === 0 && <div className="card muted">{t.notifications.empty}</div>}
        <ul className="notif-list">
          {list.data?.map((n) => (
            <li key={n.id}>
              <button className={`card notif${n.read ? '' : ' unread'}`} onClick={() => open(n)}>
                {!n.read && <span className="notif-dot" aria-hidden="true" />}
                <span className="notif-text">
                  {t.notifications.text[n.type](n.actorName || t.notifications.someone, n.favorTitle || t.notifications.aFavor)}
                </span>
                <time className="muted small" dateTime={n.createdAt}>
                  {new Date(n.createdAt).toLocaleString(lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </time>
              </button>
            </li>
          ))}
        </ul>
      </Async>
    </>
  )
}

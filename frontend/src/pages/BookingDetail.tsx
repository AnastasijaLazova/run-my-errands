import { Link, useParams } from 'react-router-dom'
import { bookingsApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { Async, StatusPill } from '../components/Status'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export default function BookingDetail() {
  const id = Number(useParams().id)
  const { me } = useAuth()
  const { t } = useI18n()
  const booking = useAsync(() => bookingsApi.get(id), [id])
  const b = booking.data
  const revealed = b && ['CONFIRMED', 'COMPLETED', 'CLOSED'].includes(b.status)
  const contact = useAsync(() => (revealed ? bookingsApi.contact(id) : Promise.resolve(null)), [id, b?.status])

  const act = (fn: () => Promise<unknown>) => async () => { await fn(); booking.reload() }
  const isGiver = b?.giverId === me?.id

  return (
    <Async loading={booking.loading} error={booking.error}>
      {b && (
        <>
          <h1>{t.booking.detail} #{b.id} <StatusPill status={b.status} /></h1>
          <div className="card stack">
            <div className="muted">{t.booking.status}: {b.status}</div>
            <h2 style={{ margin: 0 }}>{t.booking.contact}</h2>
            {revealed && contact.data
              ? <div><strong>{contact.data.displayName}</strong> — {contact.data.phone ?? '—'}</div>
              : <p className="muted">{t.booking.contactHidden}</p>}
          </div>
          <div className="btn-row">
            {b.status === 'REQUESTED' && isGiver && <>
              <button className="primary" onClick={act(() => bookingsApi.accept(id))}>{t.booking.accept}</button>
              <button onClick={act(() => bookingsApi.decline(id))}>{t.booking.decline}</button>
            </>}
            {['REQUESTED', 'CONFIRMED'].includes(b.status) && <button className="danger" onClick={act(() => bookingsApi.cancel(id))}>{t.booking.cancel}</button>}
            {b.status === 'CONFIRMED' && isGiver && <button className="primary" onClick={act(() => bookingsApi.complete(id))}>{t.booking.complete}</button>}
            {['COMPLETED', 'CLOSED'].includes(b.status) && <Link to={`/bookings/${id}/rate`}><button className="primary">{t.booking.rate}</button></Link>}
          </div>
        </>
      )}
    </Async>
  )
}

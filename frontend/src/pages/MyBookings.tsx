import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { Async, StatusPill } from '../components/Status'
import { useI18n } from '../i18n/I18nContext'

export default function MyBookings() {
  const { t } = useI18n()
  const [role, setRole] = useState<'requester' | 'giver'>('requester')
  const { data, loading, error } = useAsync(() => bookingsApi.list(role), [role])

  return (
    <>
      <h1>{t.booking.title}</h1>
      <div className="btn-row" style={{ margin: '12px 0' }}>
        <button className={role === 'requester' ? 'primary' : ''} onClick={() => setRole('requester')}>{t.booking.asRequester}</button>
        <button className={role === 'giver' ? 'primary' : ''} onClick={() => setRole('giver')}>{t.booking.asGiver}</button>
      </div>
      <Async loading={loading} error={error} empty={data?.length === 0}>
        {data?.map((b) => (
          <Link to={`/bookings/${b.id}`} key={b.id}>
            <div className="card row"><span>Booking #{b.id} · favor #{b.favorId}</span><StatusPill status={b.status} /></div>
          </Link>
        ))}
      </Async>
    </>
  )
}

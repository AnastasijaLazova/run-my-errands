import { Link } from 'react-router-dom'
import { bookingsApi, offersApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { Async, StatusPill } from '../components/Status'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export default function GiverDashboard() {
  const { me } = useAuth()
  const { t } = useI18n()
  const bookings = useAsync(() => bookingsApi.list('giver'))
  const offers = useAsync(() => offersApi.mine())

  return (
    <>
      <div className="row">
        <h1>{t.giver.dashTitle}</h1>
        <Link to="/giver/onboarding"><button className="primary">{me?.giver ? t.giver.profile : t.giver.onboardingTitle}</button></Link>
      </div>
      <h2>{t.booking.title}</h2>
      <Async loading={bookings.loading} error={bookings.error} empty={bookings.data?.length === 0}>
        {bookings.data?.map((b) => (
          <Link to={`/bookings/${b.id}`} key={b.id}><div className="card row"><span>Booking #{b.id}</span><StatusPill status={b.status} /></div></Link>
        ))}
      </Async>
      <h2>{t.giver.myOffers}</h2>
      <Async loading={offers.loading} error={offers.error} empty={offers.data?.length === 0}>
        {offers.data?.map((o) => (
          <div className="card row" key={o.id}>
            <span>Favor #{o.favorId} · {o.proposedPrice ?? '—'} MKD</span>
            <div className="btn-row"><StatusPill status={o.status} />
              {o.status === 'PENDING' && <button onClick={async () => { await offersApi.withdraw(o.id); offers.reload() }}>{t.common.cancel}</button>}
            </div>
          </div>
        ))}
      </Async>
    </>
  )
}

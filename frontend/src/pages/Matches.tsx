import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingsApi, favorsApi, offersApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { useLiveRefresh } from '../notifications/NotificationsContext'
import { Async } from '../components/Status'
import { useI18n } from '../i18n/I18nContext'
import { useAuth } from '../auth/AuthContext'
import { neighbourhoodLabel } from '../neighbourhoods'

export default function Matches() {
  const id = Number(useParams().id)
  const { t, lang } = useI18n()
  const { me } = useAuth()
  const navigate = useNavigate()
  const [sort, setSort] = useState('rating')
  const [error, setError] = useState<string | null>(null)
  const favor = useAsync(() => favorsApi.get(id), [id])
  const matches = useAsync(() => favorsApi.matches(id, sort), [id, sort])
  const offers = useAsync(() => favorsApi.offers(id), [id])
  useLiveRefresh(() => { offers.refresh(); favor.refresh() }, (n) => n.favorId === id)

  const book = async (giverId: number) => {
    setError(null)
    try { const b = await bookingsApi.create({ favorId: id, giverId }); navigate(`/bookings/${b.id}`) }
    catch (e) { setError((e as Error).message) }
  }

  const cancelFavor = async () => {
    if (!window.confirm(t.favor.cancelConfirm)) return
    setError(null)
    try { await favorsApi.cancel(id); navigate('/') }
    catch (e) { setError((e as Error).message) }
  }
  // Edit/cancel only while nobody has been booked yet (the backend enforces the same rule).
  const canChange = favor.data?.status === 'OPEN' && favor.data.requesterId === me?.id

  return (
    <>
      <h1>{favor.data?.title ?? t.favor.matches}</h1>
      <p className="sub">{t.favor.matches}</p>
      {canChange && (
        <div className="btn-row" style={{ marginBottom: 12 }}>
          <Link to={`/favors/${id}/edit`} className="button">{t.favor.edit}</Link>
          <button className="danger" onClick={cancelFavor}>{t.favor.cancelFavor}</button>
        </div>
      )}
      <div className="btn-row" style={{ marginBottom: 12 }}>
        {[['rating', t.favor.byRating], ['price', t.favor.byPrice]].map(([k, label]) => (
          <button key={k} className={sort === k ? 'primary' : ''} onClick={() => setSort(k)}>{label}</button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <Async loading={matches.loading} error={matches.error} empty={false}>
        {matches.data?.length === 0 && <p className="muted">{t.favor.noMatches}</p>}
        <div className="grid">
          {matches.data?.map((m) => (
            <div className="card stack" key={m.userId}>
              <div className="row">
                <Link to={`/givers/${m.userId}`}><strong>{m.displayName || `#${m.userId}`}</strong></Link>
                <span className="price">{m.price} MKD</span>
              </div>
              <div className="muted">{neighbourhoodLabel(m.neighbourhood, lang) || '—'} · ★ {m.ratingAvg.toFixed(1)} ({m.ratingCount}){m.verified ? ` · ${t.giver.verified}` : ''}</div>
              <button className="primary" onClick={() => book(m.userId)}>{t.favor.book}</button>
            </div>
          ))}
        </div>
      </Async>

      <h2>{t.favor.offers}</h2>
      <Async loading={offers.loading} error={offers.error} empty={offers.data?.length === 0}>
        {offers.data?.map((o) => (
          <div className="card row" key={o.id}>
            <div>
              <Link to={`/givers/${o.giverId}`}>Giver #{o.giverId}</Link> — {o.proposedPrice ? `${o.proposedPrice} MKD` : ''}
              <div className="muted">{o.message}</div>
            </div>
            {o.status === 'PENDING' && (
              <div className="btn-row">
                <button className="primary" onClick={async () => { const b = await offersApi.accept(o.id); navigate(`/bookings/${b.id}`) }}>{t.booking.accept}</button>
                <button onClick={async () => { await offersApi.reject(o.id); offers.reload() }}>{t.booking.decline}</button>
              </div>
            )}
          </div>
        ))}
      </Async>
    </>
  )
}

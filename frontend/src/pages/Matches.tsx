import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { bookingsApi, favorsApi, offersApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { useLiveRefresh } from '../notifications/NotificationsContext'
import { Async } from '../components/Status'
import MatchMap from '../components/MatchMap'
import { avatarColor, initials } from '../components/avatar'
import { useI18n } from '../i18n/I18nContext'
import { useAuth } from '../auth/AuthContext'
import { neighbourhoodDistanceKm, neighbourhoodLabel } from '../neighbourhoods'

type Sort = 'distance' | 'rating' | 'price'


export default function Matches() {
  const id = Number(useParams().id)
  const { t, lang } = useI18n()
  const { me } = useAuth()
  const navigate = useNavigate()
  const [sort, setSort] = useState<Sort>('distance')
  const [hovered, setHovered] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const favor = useAsync(() => favorsApi.get(id), [id])
  // Distance is worked out here from neighbourhoods, so "nearest" fetches by rating and re-sorts.
  const matches = useAsync(() => favorsApi.matches(id, sort === 'price' ? 'price' : undefined), [id, sort === 'price'])
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

  const where = favor.data?.neighbourhood ?? ''
  const rows = (matches.data ?? []).map((m) => ({ ...m, km: neighbourhoodDistanceKm(where, m.neighbourhood) }))
  if (sort === 'distance') rows.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))

  const category = favor.data ? (lang === 'mk' ? favor.data.categoryNameMk : favor.data.categoryNameEn) : ''
  const budget = favor.data?.budget
  const range = budget != null ? t.matches.range(Math.round(budget * 0.75), Math.round(budget * 1.25)) : t.matches.anyPrice
  const sorts: [Sort, string][] = [['distance', t.matches.nearest], ['rating', t.matches.bestRated], ['price', t.matches.cheapest]]

  return (
    <div className="matches-page">
      {favor.data?.status === 'OPEN' && <span className="live-pill"><i />{t.matches.live}</span>}
      <div className="matches-head">
        <div>
          <h1 className="matches-title">{matches.data ? t.matches.title(rows.length, category) : favor.data?.title ?? t.favor.matches}</h1>
          <p className="sub">{favor.data?.title} · {range} · {t.matches.rankedBy[sort]}</p>
        </div>
        <div className="btn-row">
          {sorts.map(([k, label]) => (
            <button key={k} className={`sort-chip${sort === k ? ' active' : ''}`} onClick={() => setSort(k)}>{label}</button>
          ))}
        </div>
      </div>
      {canChange && (
        <div className="btn-row" style={{ marginBottom: 16 }}>
          <Link to={`/favors/${id}/edit`} className="button">{t.favor.edit}</Link>
          <button className="danger" onClick={cancelFavor}>{t.favor.cancelFavor}</button>
        </div>
      )}
      {error && <p className="error">{error}</p>}

      <div className="matches-layout">
        <div>
          <Async loading={matches.loading} error={matches.error} empty={false}>
            {rows.length === 0 && <p className="muted">{t.favor.noMatches}</p>}
            {rows.map((m, i) => (
              <div className={`card match-card${hovered === m.userId ? ' active' : ''}`} key={m.userId}
                   onMouseEnter={() => setHovered(m.userId)} onMouseLeave={() => setHovered(null)}>
                <div className="match-avatar" style={{ background: avatarColor(m.userId) }}>
                  {initials(m.displayName)}
                  <span className="match-num">{i + 1}</span>
                </div>
                <div className="match-body">
                  <div className="match-name">
                    <Link to={`/givers/${m.userId}`}>{m.displayName || `#${m.userId}`}</Link>
                    {m.verified && <span className="verified">{t.matches.verified}</span>}
                  </div>
                  <div className="match-meta">
                    {m.ratingCount > 0
                      ? <><strong>★ {m.ratingAvg.toFixed(1)}</strong><span>{t.matches.ratings(m.ratingCount)}</span></>
                      : <span className="pill grey">{t.matches.newGiver}</span>}
                    <span>{neighbourhoodLabel(m.neighbourhood, lang) || '—'}{m.km != null && ` · ${t.matches.km(m.km)}`}</span>
                    {m.completedCount > 0 && <span>{t.matches.done(m.completedCount)}</span>}
                  </div>
                  {m.bio && <p className="match-bio">{m.bio}</p>}
                </div>
                <div className="match-side">
                  <div className="match-price">{m.price} <span>MKD</span></div>
                  <div className="muted small">{t.matches.asks}</div>
                  <button className="primary" onClick={() => book(m.userId)}>{t.matches.request}</button>
                </div>
              </div>
            ))}
          </Async>
        </div>
        <aside className="matches-map">
          <MatchMap centre={where} active={hovered} onHover={setHovered}
                    pins={rows.map((m, i) => ({ id: m.userId, label: String(i + 1), neighbourhood: m.neighbourhood, distanceKm: m.km }))} />
        </aside>
      </div>

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
    </div>
  )
}

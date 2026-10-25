import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoriesApi, favorsApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { useI18n } from '../i18n/I18nContext'
import type { Dict } from '../i18n/en'
import { useAuth } from '../auth/AuthContext'
import { NeighbourhoodInput } from '../components/NeighbourhoodInput'
import { categoryColor } from '../categoryColors'
import { formatDen } from './RequesterDashboard'

const PRICE_MIN = 100
const PRICE_MAX = 2000
const PRICE_TOLERANCE = 0.25 // must match FavorService.PRICE_TOLERANCE_PCT

type SlotKey = 'now' | 'morning' | 'afternoon' | 'todaySlot' | 'tomorrow' | 'week'
type Slot = { key: SlotKey; label: string; start: Date | null; available: boolean }

const at = (now: Date, dayOffset: number, hour: number) => {
  const d = new Date(now); d.setDate(d.getDate() + dayOffset); d.setHours(hour, 0, 0, 0); return d
}
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`

/**
 * The backend stores ASAP or a single start time, so each hour-period is sent as SCHEDULED with
 * the start of its window (never earlier than the next full hour). Periods already over are disabled.
 */
function buildSlots(t: Dict, now: Date): Slot[] {
  const nextHour = at(now, 0, now.getHours() + 1)
  const later = (a: Date, b: Date) => (a > b ? a : b)
  const slotFrom = Math.min(now.getHours() + 2, 22)
  return [
    { key: 'now', label: t.post.now, start: null, available: true },
    { key: 'morning', label: t.post.morning, start: later(at(now, 0, 8), nextHour), available: nextHour < at(now, 0, 12) },
    { key: 'afternoon', label: t.post.afternoon, start: later(at(now, 0, 12), nextHour), available: nextHour < at(now, 0, 18) },
    { key: 'todaySlot', label: t.post.todaySlot(hh(slotFrom), hh(slotFrom + 2)), start: at(now, 0, slotFrom), available: now.getHours() + 2 <= 22 },
    { key: 'tomorrow', label: t.post.tomorrow, start: at(now, 1, 9), available: true },
    { key: 'week', label: t.post.week, start: at(now, 2, 9), available: true },
  ]
}

export default function PostFavor() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { me } = useAuth()
  const { data: categories } = useAsync(() => categoriesApi.list())

  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [price, setPrice] = useState(450)
  const [slotKey, setSlotKey] = useState<SlotKey>('now')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Prefilled with where the requester lives; editable when the errand is somewhere else.
  const [neighbourhood, setNeighbourhood] = useState(me?.neighbourhood ?? '')
  const [agreed, setAgreed] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const slots = useMemo(() => buildSlots(t, new Date()), [t])
  const selectedCategory = categoryId ?? categories?.[0]?.id ?? null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (selectedCategory == null) return
    const slot = slots.find((s) => s.key === slotKey)!
    setError(null)
    setSaving(true)
    try {
      const favor = await favorsApi.create({
        categoryId: selectedCategory,
        title,
        description: description || undefined,
        budget: price,
        neighbourhood,
        whenType: slot.start ? 'SCHEDULED' : 'ASAP',
        whenAt: slot.start?.toISOString(),
      })
      navigate(`/favors/${favor.id}/matches`) // posting leads straight into Matches
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  const fillPct = ((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100

  return (
    <form className="post-favor" onSubmit={submit}>
      <header className="post-head">
        <h1>{t.post.title} <span className="post-step">{t.post.step}</span></h1>
        <p className="muted">{t.post.sub}</p>
      </header>

      <section className="card post-card">
        <h2>{t.post.category}</h2>
        <div className="chip-row">
          {categories?.map((c) => {
            const name = lang === 'mk' ? c.nameMk : c.nameEn
            const active = c.id === selectedCategory
            return (
              <button type="button" key={c.id} className={`chip${active ? ' active' : ''}`} aria-pressed={active} onClick={() => setCategoryId(c.id)}>
                <span className="chip-tile" style={{ background: categoryColor(c.key) }}>{name.trim()[0]?.toUpperCase()}</span>
                {name}
              </button>
            )
          })}
        </div>
      </section>

      <div className="post-grid">
        <section className="card post-card">
          <h2>{t.post.price}</h2>
          <p className="muted small">{t.post.priceHint}</p>
          <div className="price-big">{formatDen(price)} <span>{t.dash.den}</span></div>
          <input
            type="range" className="slider" min={PRICE_MIN} max={PRICE_MAX} step={10} value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            style={{ background: `linear-gradient(to right, var(--accent) ${fillPct}%, var(--line) ${fillPct}%)` }}
            aria-label={t.post.price}
          />
          <div className="slider-ends muted small"><span>{formatDen(PRICE_MIN)} {t.dash.den}</span><span>{formatDen(PRICE_MAX)} {t.dash.den}</span></div>
          <div className="match-range small">
            {t.post.matchRange} <strong>{formatDen(price * (1 - PRICE_TOLERANCE))} {t.dash.den} – {formatDen(price * (1 + PRICE_TOLERANCE))} {t.dash.den}</strong>
          </div>
        </section>

        <section className="card post-card">
          <h2>{t.post.when}</h2>
          <p className="muted small">{t.post.whenHint}</p>
          <div className="slot-grid">
            {slots.map((s) => (
              <button
                type="button" key={s.key} className={`slot${slotKey === s.key ? ' active' : ''}`}
                disabled={!s.available} aria-pressed={slotKey === s.key} onClick={() => setSlotKey(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="card post-card">
        <h2>{t.post.details}</h2>
        <div className="post-fields">
          <div>
            <label htmlFor="pf-title">{t.post.titleLabel}</label>
            <input id="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.post.titlePlaceholder} required />
          </div>
          <div>
            <label htmlFor="pf-hood">{t.post.neighbourhood}</label>
            <NeighbourhoodInput id="pf-hood" value={neighbourhood} onChange={setNeighbourhood} required />
          </div>
        </div>
        <textarea
          className="post-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder={t.post.descPlaceholder} aria-label={t.post.details}
        />
        <label className="check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
          <span>{t.post.privacy}</span>
        </label>
      </section>

      {error && <p className="error">{error}</p>}
      <div className="post-actions">
        <Link to="/" className="button lg">{t.post.cancel}</Link>
        <button type="submit" className="primary lg" disabled={!categories || saving}>{t.post.submit}</button>
      </div>
    </form>
  )
}

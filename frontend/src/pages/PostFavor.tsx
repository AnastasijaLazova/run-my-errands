import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { categoriesApi, favorsApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { useI18n } from '../i18n/I18nContext'
import type { Dict } from '../i18n/en'
import { useAuth } from '../auth/AuthContext'
import { NeighbourhoodInput } from '../components/NeighbourhoodInput'
import { categoryTile } from '../categoryColors'
import { formatDen, formatWhen } from './RequesterDashboard'

const PRICE_MIN = 100
const PRICE_MAX = 2000
const PRICE_TOLERANCE = 0.25 // must match FavorService.PRICE_TOLERANCE_PCT

// 'current' only exists when editing a scheduled favor: keep the time it already has.
type SlotKey = 'current' | 'now' | 'morning' | 'afternoon' | 'todaySlot' | 'tomorrow' | 'week'
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

/** Posts a new favor, or edits one at /favors/:id/edit (same form; the category is locked once posted). */
export default function PostFavor() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { me } = useAuth()
  const params = useParams()
  const editId = params.id ? Number(params.id) : null
  const { data: categories } = useAsync(() => categoriesApi.list())
  const existing = useAsync(() => (editId ? favorsApi.get(editId) : Promise.resolve(null)), [editId])
  // The landing page's builder sends ?category=<key>&budget=<den>&when=now|tomorrow|week.
  const [prefill] = useSearchParams()
  const prefillBudget = Number(prefill.get('budget'))
  const prefillWhen = prefill.get('when')

  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [price, setPrice] = useState(() =>
    !editId && prefillBudget ? Math.min(PRICE_MAX, Math.max(PRICE_MIN, prefillBudget)) : 450)
  // When editing, only send the price if it was moved, so a budget outside the slider range isn't clamped.
  const [priceTouched, setPriceTouched] = useState(false)
  const [slotKey, setSlotKey] = useState<SlotKey>(() =>
    !editId && (prefillWhen === 'tomorrow' || prefillWhen === 'week') ? prefillWhen : 'now')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // Prefilled with where the requester lives; editable when the errand is somewhere else.
  const [neighbourhood, setNeighbourhood] = useState(me?.neighbourhood ?? '')
  const [agreed, setAgreed] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const key = prefill.get('category')
    const match = !editId && key ? categories?.find((c) => c.key === key) : undefined
    if (match) setCategoryId(match.id)
  }, [categories]) // eslint-disable-line react-hooks/exhaustive-deps

  const favor = existing.data
  useEffect(() => {
    if (!favor) return
    setCategoryId(favor.categoryId)
    setTitle(favor.title)
    setDescription(favor.description ?? '')
    setNeighbourhood(favor.neighbourhood)
    if (favor.budget != null) setPrice(Math.min(PRICE_MAX, Math.max(PRICE_MIN, favor.budget)))
    setSlotKey(favor.whenType === 'SCHEDULED' && favor.whenAt ? 'current' : 'now')
  }, [favor])

  const slots = useMemo(() => {
    const base = buildSlots(t, new Date())
    if (favor?.whenType !== 'SCHEDULED' || !favor.whenAt) return base
    return [{ key: 'current' as const, label: formatWhen(t, lang, favor.whenAt), start: new Date(favor.whenAt), available: true }, ...base]
  }, [t, lang, favor])
  const selectedCategory = categoryId ?? categories?.[0]?.id ?? null
  const visibleCategories = editId ? categories?.filter((c) => c.id === selectedCategory) : categories

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (selectedCategory == null) return
    const slot = slots.find((s) => s.key === slotKey)!
    setError(null)
    setSaving(true)
    try {
      if (editId) {
        await favorsApi.update(editId, {
          title,
          description,
          neighbourhood,
          ...(priceTouched ? { budget: price } : {}),
          ...(slot.key === 'current' ? {} : { whenType: slot.start ? 'SCHEDULED' : 'ASAP', whenAt: slot.start?.toISOString() }),
        })
        navigate(`/favors/${editId}/matches`)
        return
      }
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
        {editId
          ? <h1>{t.post.editTitle}</h1>
          : <h1>{t.post.title} <span className="post-step">{t.post.step}</span></h1>}
        <p className="muted">{t.post.sub}</p>
      </header>
      {existing.error && <p className="error">{existing.error}</p>}
      {favor && favor.status !== 'OPEN' && <p className="error">{t.post.notEditable}</p>}

      <section className="card post-card">
        <h2>{t.post.category}</h2>
        {editId && <p className="muted small">{t.post.categoryLocked}</p>}
        <div className="chip-row">
          {visibleCategories?.map((c) => {
            const name = lang === 'mk' ? c.nameMk : c.nameEn
            const active = c.id === selectedCategory
            return (
              <button type="button" key={c.id} className={`chip${active ? ' active' : ''}`} aria-pressed={active} disabled={editId != null} onClick={() => setCategoryId(c.id)}>
                <span className="chip-tile" style={{ background: categoryTile(c.key)[0], color: categoryTile(c.key)[1] }}>{name.trim()[0]?.toUpperCase()}</span>
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
            onChange={(e) => { setPrice(Number(e.target.value)); setPriceTouched(true) }}
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
            <input id="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.post.titlePlaceholder} maxLength={200} required />
          </div>
          <div>
            <label htmlFor="pf-hood">{t.post.neighbourhood}</label>
            <NeighbourhoodInput id="pf-hood" value={neighbourhood} onChange={setNeighbourhood} required />
          </div>
        </div>
        <textarea
          className="post-desc" rows={4} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder={t.post.descPlaceholder} aria-label={t.post.details}
        />
        <label className="check">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
          <span>{t.post.privacy}</span>
        </label>
      </section>

      {error && <p className="error">{error}</p>}
      <div className="post-actions">
        <Link to={editId ? `/favors/${editId}/matches` : '/'} className="button lg">{t.post.cancel}</Link>
        <button type="submit" className="primary lg" disabled={!categories || saving || (editId != null && favor?.status !== 'OPEN')}>
          {editId ? t.post.saveChanges : t.post.submit}
        </button>
      </div>
    </form>
  )
}

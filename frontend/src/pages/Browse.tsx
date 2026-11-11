import { useEffect, useState } from 'react'
import { categoriesApi, favorsApi } from '../api/endpoints'
import type { Favor } from '../api/types'
import { useAsync } from '../components/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { neighbourhoodLabel } from '../neighbourhoods'
import { categoryTile } from '../categoryColors'
import { formatDen } from './RequesterDashboard'
import { timeAgo } from './Notifications'

export default function Browse() {
  const { t, lang } = useI18n()
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [openFavor, setOpenFavor] = useState<Favor | null>(null)
  const [offer, setOffer] = useState({ message: '', price: '' })
  const [sentTo, setSentTo] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const categories = useAsync(() => categoriesApi.list())
  const favors = useAsync(() => favorsApi.open(categoryId), [categoryId])
  const keyOf = (id: number) => categories.data?.find((c) => c.id === id)?.key ?? ''
  const catName = (f: Favor) => (lang === 'mk' ? f.categoryNameMk : f.categoryNameEn)
  const price = (f: Favor) => (f.budget ? `${formatDen(f.budget)} ${t.dash.den}` : null)

  const close = () => { setOpenFavor(null); setOffer({ message: '', price: '' }); setError(null) }

  useEffect(() => {
    if (!openFavor) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openFavor]) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (favorId: number) => {
    setError(null)
    try {
      await favorsApi.makeOffer(favorId, { message: offer.message || undefined, proposedPrice: offer.price ? Number(offer.price) : undefined })
      setSentTo((ids) => [...ids, favorId])
      setOffer({ message: '', price: '' })
    } catch (e) { setError((e as Error).message) }
  }

  const when = (f: Favor) => f.whenType === 'ASAP' || !f.whenAt ? t.favor.asap
    : new Date(f.whenAt).toLocaleString(lang === 'mk' ? 'mk-MK' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="browse">
      <header className="browse-hero">
        <div>
          <h1>{t.giver.browseTitle}</h1>
          <p>{t.giver.browseSub}</p>
        </div>
        {favors.data && <span className="browse-count">{t.giver.openCount(favors.data.length)}</span>}
      </header>

      <div className="chip-row browse-filter">
        <button type="button" className={`chip${categoryId == null ? ' active' : ''}`} aria-pressed={categoryId == null} onClick={() => setCategoryId(undefined)}>
          <span className="chip-tile" style={{ background: 'var(--accent)' }}>★</span>{t.giver.allCategories}
        </button>
        {categories.data?.map((c) => {
          const name = lang === 'mk' ? c.nameMk : c.nameEn
          const [bg, fg] = categoryTile(c.key)
          return (
            <button type="button" key={c.id} className={`chip${categoryId === c.id ? ' active' : ''}`} aria-pressed={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
              <span className="chip-tile" style={{ background: bg, color: fg }}>{name.trim()[0]?.toUpperCase()}</span>{name}
            </button>
          )
        })}
      </div>

      {favors.loading ? <p className="muted">{t.common.loading}</p>
        : favors.error ? <p className="error">{favors.error}</p>
        : favors.data?.length === 0 ? (
          <div className="browse-empty">
            <span className="browse-empty-icon" aria-hidden="true">✦</span>
            <h2>{t.giver.emptyTitle}</h2>
            <p>{t.giver.emptyText}</p>
          </div>
        ) : (
          <div className="browse-grid">
            {favors.data?.map((f) => {
              const [bg, fg] = categoryTile(keyOf(f.categoryId))
              return (
                <button type="button" className="browse-card" key={f.id} onClick={() => setOpenFavor(f)}>
                  <span className="browse-glyph" style={{ background: bg, color: fg }} title={catName(f)}>{catName(f).trim()[0]?.toUpperCase()}</span>
                  <span className="browse-main">
                    <strong>{f.title}</strong>
                    {f.description && <span className="browse-snippet">{f.description}</span>}
                    <span className="browse-meta">📍 {neighbourhoodLabel(f.neighbourhood, lang)} · 🕒 {when(f)}</span>
                  </span>
                  <span className="browse-side">
                    {price(f) ? <strong className="browse-price">{price(f)}</strong> : <span className="browse-meta">{t.giver.noBudget}</span>}
                    {sentTo.includes(f.id) && <span className="pill">✓</span>}
                  </span>
                </button>
              )
            })}
          </div>
        )}

      {openFavor && (() => {
        const f = openFavor
        const [bg, fg] = categoryTile(keyOf(f.categoryId))
        return (
          <div className="modal-backdrop browse-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
            <div className="card modal browse-detail" role="dialog" aria-modal="true" aria-label={f.title}>
              <div className="browse-detail-head">
                <span className="browse-chip" style={{ background: bg, color: fg }}>{catName(f)}</span>
                <span className="browse-meta">{timeAgo(t, f.createdAt)}</span>
                <button type="button" className="browse-x" onClick={close} aria-label={t.giver.close}>×</button>
              </div>
              <h2>{f.title}</h2>
              <p className="browse-desc">{f.description || t.giver.noDescription}</p>
              <dl className="browse-facts">
                <div><dt>{t.favor.neighbourhood}</dt><dd>📍 {neighbourhoodLabel(f.neighbourhood, lang)}</dd></div>
                <div><dt>{t.favor.when}</dt><dd>🕒 {when(f)}</dd></div>
                <div><dt>{t.giver.theirPrice}</dt><dd className="browse-price">{price(f) ?? t.giver.noBudget}</dd></div>
              </dl>
              {error && <p className="error">{error}</p>}
              {sentTo.includes(f.id) ? <p className="browse-sent">✓ {t.giver.offerSent}</p> : (
                <div className="browse-offer">
                  <input maxLength={1000} placeholder={t.giver.offerMessage} value={offer.message} onChange={(e) => setOffer({ ...offer, message: e.target.value })} />
                  <input type="number" min={0} placeholder={t.giver.offerPrice} value={offer.price} onChange={(e) => setOffer({ ...offer, price: e.target.value })} />
                  <button className="primary" onClick={() => send(f.id)}>{t.giver.makeOffer}</button>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

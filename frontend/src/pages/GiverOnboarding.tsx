import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriesApi, giversApi, meApi } from '../api/endpoints'
import type { Category } from '../api/types'
import { useAsync } from '../components/useAsync'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { NeighbourhoodInput } from '../components/NeighbourhoodInput'
import { categoryColor } from '../categoryColors'

export default function GiverOnboarding() {
  const { t, lang } = useI18n()
  const { me, refreshMe } = useAuth()
  const navigate = useNavigate()
  const categories = useAsync(() => categoriesApi.list())

  // Chosen categories in the order they were added, with the price as typed.
  const [chosen, setChosen] = useState<{ categoryId: number; price: string }[]>([])
  const [bio, setBio] = useState('')
  const [neighbourhood, setNeighbourhood] = useState(me?.neighbourhood ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Editing an existing giver profile: start from what is saved.
  useEffect(() => {
    if (!me?.giver) return
    giversApi.get(me.id).then((p) => {
      setChosen(p.categories.map((c) => ({ categoryId: c.categoryId, price: String(Math.round(Number(c.price))) })))
      setBio(p.bio ?? '')
    }).catch(() => { /* no profile yet — start empty */ })
  }, [me?.id, me?.giver])

  const byId = new Map((categories.data ?? []).map((c) => [c.id, c]))
  const name = (c: Category) => (lang === 'mk' ? c.nameMk : c.nameEn)
  const available = (categories.data ?? []).filter((c) => !chosen.some((x) => x.categoryId === c.id))

  const setPrice = (id: number, price: string) =>
    setChosen(chosen.map((x) => (x.categoryId === id ? { ...x, price } : x)))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (chosen.length === 0) { setError(t.onboard.needCategory); return }
    setSaving(true)
    try {
      if (neighbourhood.trim() && neighbourhood.trim() !== me?.neighbourhood) await meApi.update({ neighbourhood: neighbourhood.trim() })
      await meApi.saveGiverProfile({ bio: bio || undefined, categories: chosen.map((x) => ({ categoryId: x.categoryId, price: Number(x.price) })) })
      await refreshMe()
      navigate('/giver')
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <form className="onboard" onSubmit={submit}>
      <header className="post-head">
        <h1>{t.onboard.title}</h1>
        <p className="muted">{t.onboard.sub}</p>
      </header>

      <section className="card post-card">
        <h2>{t.onboard.yourCategories}</h2>
        {chosen.length === 0 && <p className="muted small">{t.onboard.noneYet}</p>}
        <div className="cat-list">
          {chosen.map((x) => {
            const c = byId.get(x.categoryId)
            if (!c) return null
            return (
              <div className="cat-row" key={c.id}>
                <span className="cat-tile" style={{ background: categoryColor(c.key) }}>{name(c).trim()[0]?.toUpperCase()}</span>
                <strong className="cat-name">{name(c)}</strong>
                <span className="trust-pill">{t.onboard.trust[c.trustTier]}</span>
                <label className="price-input">
                  <input
                    type="number" min={1} step={1} required value={x.price} onChange={(e) => setPrice(c.id, e.target.value)}
                    aria-label={`${name(c)} — ${t.onboard.price}`}
                  />
                  <span>{t.dash.den}</span>
                </label>
                <button type="button" className="cat-remove" aria-label={`${t.onboard.remove} ${name(c)}`}
                  onClick={() => setChosen(chosen.filter((y) => y.categoryId !== c.id))}>×</button>
              </div>
            )
          })}
        </div>

        {available.length > 0 && (
          <>
            <p className="add-label">{t.onboard.addCategory}</p>
            <div className="chip-row">
              {available.map((c) => (
                <button type="button" key={c.id} className="chip add" onClick={() => setChosen([...chosen, { categoryId: c.id, price: '' }])}>
                  <span className="chip-tile" style={{ background: categoryColor(c.key) }}>{name(c).trim()[0]?.toUpperCase()}</span>
                  {name(c)}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="post-grid">
        <section className="card post-card">
          <h2>{t.onboard.whereTitle}</h2>
          <p className="muted small">{t.onboard.whereHint}</p>
          <NeighbourhoodInput className="soft-input" value={neighbourhood} onChange={setNeighbourhood}
            placeholder={t.auth.neighbourhoodPlaceholder} ariaLabel={t.onboard.whereTitle} required />
        </section>

        <section className="card post-card">
          <h2>{t.onboard.aboutTitle}</h2>
          <p className="muted small">{t.onboard.aboutHint}</p>
          <textarea className="soft-input" rows={3} maxLength={2000} value={bio} onChange={(e) => setBio(e.target.value)} aria-label={t.onboard.aboutTitle} />
        </section>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="post-actions">
        <button type="submit" className="primary lg" disabled={saving || !categories.data}>{t.onboard.save}</button>
      </div>
    </form>
  )
}

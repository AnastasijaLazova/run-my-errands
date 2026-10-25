import { useState } from 'react'
import { categoriesApi, favorsApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { Async } from '../components/Status'
import { useI18n } from '../i18n/I18nContext'
import { neighbourhoodLabel } from '../neighbourhoods'

export default function Browse() {
  const { t, lang } = useI18n()
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [offeringOn, setOfferingOn] = useState<number | null>(null)
  const [offer, setOffer] = useState({ message: '', price: '' })
  const [error, setError] = useState<string | null>(null)
  const categories = useAsync(() => categoriesApi.list())
  const favors = useAsync(() => favorsApi.open(categoryId), [categoryId])

  const send = async (favorId: number) => {
    setError(null)
    try {
      await favorsApi.makeOffer(favorId, { message: offer.message || undefined, proposedPrice: offer.price ? Number(offer.price) : undefined })
      setOfferingOn(null); setOffer({ message: '', price: '' })
    } catch (e) { setError((e as Error).message) }
  }

  return (
    <>
      <h1>{t.giver.browseTitle}</h1>
      <select style={{ maxWidth: 300, marginBottom: 12 }} value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}>
        <option value="">—</option>
        {categories.data?.map((c) => <option key={c.id} value={c.id}>{lang === 'mk' ? c.nameMk : c.nameEn}</option>)}
      </select>
      {error && <p className="error">{error}</p>}
      <Async loading={favors.loading} error={favors.error} empty={favors.data?.length === 0}>
        {favors.data?.map((f) => (
          <div className="card stack" key={f.id}>
            <div className="row"><strong>{f.title}</strong><span className="price">{f.budget ? `${f.budget} MKD` : ''}</span></div>
            <div className="muted">{lang === 'mk' ? f.categoryNameMk : f.categoryNameEn} · {neighbourhoodLabel(f.neighbourhood, lang)}</div>
            {offeringOn === f.id ? (
              <div className="stack">
                <input maxLength={1000} placeholder={t.giver.offerMessage} value={offer.message} onChange={(e) => setOffer({ ...offer, message: e.target.value })} />
                <input type="number" min={0} placeholder={t.giver.offerPrice} value={offer.price} onChange={(e) => setOffer({ ...offer, price: e.target.value })} />
                <div className="btn-row"><button className="primary" onClick={() => send(f.id)}>{t.giver.makeOffer}</button><button onClick={() => setOfferingOn(null)}>{t.common.cancel}</button></div>
              </div>
            ) : <button className="primary" onClick={() => setOfferingOn(f.id)}>{t.giver.makeOffer}</button>}
          </div>
        ))}
      </Async>
    </>
  )
}

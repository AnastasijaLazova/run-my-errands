import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriesApi, meApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export default function GiverOnboarding() {
  const { t, lang } = useI18n()
  const { refreshMe } = useAuth()
  const navigate = useNavigate()
  const categories = useAsync(() => categoriesApi.list())
  const [prices, setPrices] = useState<Record<number, string>>({})
  const [bio, setBio] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const chosen = Object.entries(prices).filter(([, v]) => v !== '').map(([id, v]) => ({ categoryId: Number(id), price: Number(v) }))
    try { await meApi.saveGiverProfile({ bio, categories: chosen }); await refreshMe(); navigate('/giver') }
    catch (err) { setError((err as Error).message) }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h1>{t.giver.onboardingTitle}</h1>
      <div><label>{t.giver.bio}</label><textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
      <h2>{t.giver.pickCategories}</h2>
      {categories.data?.map((c) => (
        <div className="row" key={c.id}>
          <span>{lang === 'mk' ? c.nameMk : c.nameEn}</span>
          <input style={{ width: 120 }} type="number" min="0" placeholder="MKD" value={prices[c.id] ?? ''} onChange={(e) => setPrices({ ...prices, [c.id]: e.target.value })} />
        </div>
      ))}
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit">{t.giver.save}</button>
    </form>
  )
}

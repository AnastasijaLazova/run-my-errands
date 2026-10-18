import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { categoriesApi, favorsApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { useAuth } from '../auth/AuthContext'
import { SKOPJE_NEIGHBOURHOODS } from '../neighbourhoods'

export default function PostFavor() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { me } = useAuth()
  const { data: categories } = useAsync(() => categoriesApi.list())
  // Prefilled with where the requester lives; editable when the errand is somewhere else.
  const [form, setForm] = useState({ categoryId: 0, title: '', description: '', budget: '', neighbourhood: me?.neighbourhood ?? '', whenType: 'ASAP' as 'ASAP' | 'SCHEDULED', whenAt: '' })
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const favor = await favorsApi.create({
        categoryId: form.categoryId || categories![0].id,
        title: form.title,
        description: form.description || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        neighbourhood: form.neighbourhood,
        whenType: form.whenType,
        whenAt: form.whenType === 'SCHEDULED' && form.whenAt ? new Date(form.whenAt).toISOString() : undefined,
      })
      navigate(`/favors/${favor.id}/matches`)   // posting leads straight into Matches
    } catch (err) { setError((err as Error).message) }
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <h1>{t.favor.postTitle}</h1>
      <div>
        <label>{t.favor.category}</label>
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
          {categories?.map((c) => <option key={c.id} value={c.id}>{lang === 'mk' ? c.nameMk : c.nameEn}</option>)}
        </select>
      </div>
      <div><label>{t.favor.title}</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div><label>{t.favor.description}</label><textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div><label>{t.favor.budget}</label><input type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
      <div>
        <label>{t.favor.neighbourhood}</label>
        <input list="neighbourhoods" value={form.neighbourhood} onChange={(e) => setForm({ ...form, neighbourhood: e.target.value })} required />
        <datalist id="neighbourhoods">{SKOPJE_NEIGHBOURHOODS.map((n) => <option key={n} value={n} />)}</datalist>
        <p className="muted" style={{ fontSize: 13, margin: '6px 0 0' }}>{t.auth.neighbourhoodHint}</p>
      </div>
      <div>
        <label>{t.favor.when}</label>
        <select value={form.whenType} onChange={(e) => setForm({ ...form, whenType: e.target.value as 'ASAP' | 'SCHEDULED' })}>
          <option value="ASAP">{t.favor.asap}</option>
          <option value="SCHEDULED">{t.favor.scheduled}</option>
        </select>
        {form.whenType === 'SCHEDULED' && <input type="datetime-local" style={{ marginTop: 8 }} value={form.whenAt} onChange={(e) => setForm({ ...form, whenAt: e.target.value })} required />}
      </div>
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit" disabled={!categories}>{t.favor.submit}</button>
    </form>
  )
}

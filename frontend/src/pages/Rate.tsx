import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { reviewsApi } from '../api/endpoints'
import { useI18n } from '../i18n/I18nContext'
import { Modal } from '../components/PaymentDialogs'

export default function Rate() {
  const id = Number(useParams().id)
  const { t } = useI18n()
  const navigate = useNavigate()
  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try { await reviewsApi.submit(id, { stars, text: text || undefined }); setDone(true) }
    catch (err) { setError((err as Error).message) }
  }

  const close = () => navigate('/bookings')

  return (
    <>
    {done && (
      <Modal title={t.rate.doneTitle} onClose={close}>
        <p>{t.rate.done}</p>
        <div className="modal-actions"><button className="primary" onClick={close}>{t.common.back}</button></div>
      </Modal>
    )}
    <form className="card narrow stack" onSubmit={submit}>
      <h1>{t.rate.title}</h1>
      <div className="btn-row">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className={n <= stars ? 'primary' : ''} onClick={() => setStars(n)}>★</button>)}</div>
      <div><label>{t.rate.text}</label><textarea rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} /></div>
      <p className="muted">{t.rate.blind}</p>
      {error && <p className="error">{error}</p>}
      <button className="primary" type="submit" disabled={done}>{t.rate.submit}</button>
    </form>
    </>
  )
}

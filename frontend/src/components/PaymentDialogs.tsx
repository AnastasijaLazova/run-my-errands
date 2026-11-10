import { useState, type FormEvent, type ReactNode } from 'react'
import { bookingsApi, paymentsApi } from '../api/endpoints'
import type { Payment } from '../api/types'
import { useAsync } from './useAsync'
import { useI18n } from '../i18n/I18nContext'
import { formatDen } from '../pages/RequesterDashboard'

/** Feels like a real gateway: the spinner stays up at least this long, even when the server answers instantly. */
const PROCESSING_MS = 1400

export function useMoney() {
  const { t } = useI18n()
  return (n: number | null | undefined) => `${formatDen(n)} ${t.dash.den}`
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function PriceBreakdown({ p }: { p: Payment }) {
  const { t } = useI18n()
  const money = useMoney()
  return (
    <dl className="price-rows pay-rows">
      <dt>{t.pay.price}</dt><dd>{money(p.amount)}</dd>
      <dt>{t.pay.fee}</dt><dd>{money(p.fee)}</dd>
      <dt className="pay-total">{t.pay.total}</dt><dd className="pay-total">{money(p.total)}</dd>
    </dl>
  )
}

const groupCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
const formatExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function CheckoutModal({ bookingId, quote, giverName, onClose, onPaid }: {
  bookingId: number; quote: Payment; giverName: string; onClose: () => void; onPaid: () => void
}) {
  const { t } = useI18n()
  const money = useMoney()
  const [card, setCard] = useState({ cardNumber: '', expiry: '', cvc: '', holderName: '' })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setProcessing(true)
    const [res] = await Promise.allSettled([paymentsApi.pay(bookingId, card), new Promise((r) => setTimeout(r, PROCESSING_MS))])
    setProcessing(false)
    if (res.status === 'fulfilled') onPaid()
    else setError((res.reason as Error).message)
  }

  return (
    <Modal title={t.pay.checkoutTitle} onClose={() => !processing && onClose()}>
      <p className="muted small">{t.pay.checkoutSub(giverName)}</p>
      <PriceBreakdown p={quote} />
      <form className="pay-form" onSubmit={submit}>
        <label>{t.pay.cardNumber}
          <input inputMode="numeric" autoComplete="off" placeholder="4242 4242 4242 4242" required
                 value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: groupCard(e.target.value) })} />
        </label>
        <div className="pay-form-row">
          <label>{t.pay.expiry}
            <input inputMode="numeric" autoComplete="off" placeholder="12/28" required
                   value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} />
          </label>
          <label>{t.pay.cvc}
            <input inputMode="numeric" autoComplete="off" placeholder="123" required maxLength={4}
                   value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '') })} />
          </label>
        </div>
        <label>{t.pay.holder}
          <input autoComplete="off" required value={card.holderName}
                 onChange={(e) => setCard({ ...card, holderName: e.target.value })} />
        </label>
        <details className="pay-policy small">
          <summary>{t.pay.policyTitle}</summary>
          <ul>{t.pay.policy.map((line) => <li key={line}>{line}</li>)}</ul>
        </details>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={processing}>{t.pay.back}</button>
          <button type="submit" className="primary" disabled={processing}>
            {processing ? <><span className="spinner" aria-hidden /> {t.pay.processing}</> : t.pay.payNow(money(quote.total))}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function CancelDialog({ bookingId, isGiver, otherName, onClose, onCancelled }: {
  bookingId: number; isGiver: boolean; otherName: string; onClose: () => void; onCancelled: () => void
}) {
  const { t } = useI18n()
  const money = useMoney()
  const preview = useAsync(() => paymentsApi.cancelPreview(bookingId), [bookingId])
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const p = preview.data

  const confirm = async () => {
    setBusy(true)
    setError(null)
    try { await bookingsApi.cancel(bookingId, reason.trim() || undefined); onCancelled() }
    catch (e) { setError((e as Error).message); setBusy(false) }
  }

  const outcome = !p ? null
    : !p.paid ? t.pay.cancelUnpaid
    : isGiver ? t.pay.cancelGiver(money(p.refund))
    : p.free ? t.pay.cancelFree(money(p.refund))
    : t.pay.cancelLate(money(p.refund), money(p.giverPayout), otherName)

  return (
    <Modal title={t.pay.cancelTitle} onClose={() => !busy && onClose()}>
      {preview.error && <p className="error">{preview.error}</p>}
      {outcome && <p className={`cancel-outcome${p && p.paid && !p.free && !isGiver ? ' late' : ''}`}>{outcome}</p>}
      <label>{t.pay.reason}
        <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="modal-actions">
        <button type="button" onClick={onClose} disabled={busy}>{t.pay.keep}</button>
        <button type="button" className="danger" onClick={confirm} disabled={busy || preview.loading}>{t.pay.confirmCancel}</button>
      </div>
    </Modal>
  )
}

import type { ReactNode } from 'react'
import { useI18n } from '../i18n/I18nContext'

/** Renders loading / error / empty states around a list so every page doesn't repeat them. */
export function Async({ loading, error, empty, children }:
  { loading: boolean; error: string | null; empty?: boolean; children: ReactNode }) {
  const { t } = useI18n()
  if (loading) return <p className="muted">{t.common.loading}</p>
  if (error) return <p className="error">{error}</p>
  if (empty) return <p className="muted">{t.common.empty}</p>
  return <>{children}</>
}

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const cls = ['DECLINED', 'CANCELLED', 'EXPIRED'].includes(status) ? 'red'
    : ['CLOSED', 'COMPLETED', 'REJECTED', 'WITHDRAWN'].includes(status) ? 'grey' : ''
  return <span className={`pill ${cls}`}>{label ?? status}</span>
}

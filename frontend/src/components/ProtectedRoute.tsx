import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export default function ProtectedRoute() {
  const { me, loading } = useAuth()
  const { t } = useI18n()
  if (loading) return <p className="muted">{t.common.loading}</p>
  return me ? <Outlet /> : <Navigate to="/login" replace />
}

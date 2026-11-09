import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export default function ProtectedRoute() {
  const { me, loading } = useAuth()
  const { t } = useI18n()
  const { pathname } = useLocation()
  if (loading) return <p className="muted">{t.common.loading}</p>
  // Visitors opening the site root get the landing page; deep links go to login.
  return me ? <Outlet /> : <Navigate to={pathname === '/' ? '/welcome' : '/login'} replace />
}

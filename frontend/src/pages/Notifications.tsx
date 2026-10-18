import { useI18n } from '../i18n/I18nContext'

// Placeholder — the backend has no notifications table/endpoints yet.
export default function Notifications() {
  const { t } = useI18n()
  return (<><h1>{t.notifications.title}</h1><div className="card muted">{t.notifications.todo}</div></>)
}

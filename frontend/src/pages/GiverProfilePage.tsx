import { useParams } from 'react-router-dom'
import { giversApi } from '../api/endpoints'
import { useAsync } from '../components/useAsync'
import { Async } from '../components/Status'
import { useI18n } from '../i18n/I18nContext'

export default function GiverProfilePage() {
  const id = Number(useParams().id)
  const { t, lang } = useI18n()
  const { data, loading, error } = useAsync(() => giversApi.get(id), [id])

  return (
    <Async loading={loading} error={error}>
      {data && (
        <>
          <h1>{data.displayName} {data.verified && <span className="pill">{t.giver.verified}</span>}</h1>
          <p className="sub">{data.neighbourhood && <>{data.neighbourhood} · </>}★ {data.ratingAvg.toFixed(1)} ({data.ratingCount}) · {data.completedCount} {t.giver.completed}</p>
          {data.bio && <div className="card">{data.bio}</div>}
          {data.categories.map((c) => (
            <div className="card row" key={c.categoryId}>
              <span>{lang === 'mk' ? c.nameMk : c.nameEn}</span><span className="price">{c.price} MKD</span>
            </div>
          ))}
        </>
      )}
    </Async>
  )
}

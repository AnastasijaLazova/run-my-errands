import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoriesApi, publicApi } from '../api/endpoints'
import type { Landing as LandingData } from '../api/types'
import { useAsync } from '../components/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { formatDen } from './RequesterDashboard'
import '../styles/landing.css'

// Landing-only palette: bolder than categoryColors.ts. [background, text]
const TILE: Record<string, [string, string]> = {
  pharmacy: ['#2E7D6F', '#FFFFFF'], shopping: ['#F5B82E', '#10241C'], bill_payment: ['#0F7B55', '#FFFFFF'],
  laundry: ['#DCEFFB', '#10241C'], pet_care: ['#FF7A59', '#10241C'], babysitting: ['#6A5AE0', '#FFFFFF'],
  tutoring: ['#FFD6C9', '#10241C'], housework: ['#D9F27A', '#10241C'], cleaning: ['#8CD3B4', '#10241C'],
  home_cooking: ['#E8DDF9', '#10241C'], yard_work: ['#5F7A3C', '#FFFFFF'], vehicle_repair: ['#10241C', '#FFFFFF'],
  it_fixes: ['#1F5EA8', '#FFFFFF'],
}
const tile = (key: string): [string, string] => TILE[key] ?? ['#0F7B55', '#FFFFFF']
const HERO_KEYS = ['pharmacy', 'shopping', 'pet_care', 'babysitting', 'cleaning', 'it_fixes', 'bill_payment', 'housework']
// Builder time choices → PostFavor slot keys.
const SLOT_KEYS = ['now', 'tomorrow', 'week'] as const
const PRICE_MIN = 100
const PRICE_MAX = 2000
const PRICE_STEP = 50
const DEFAULT_PRICE = 300
const AVATARS = ['#6A5AE0', '#FF7A59', '#0F7B55']
// Drawn into the match-preview illustration until real rated Givers exist.
const SAMPLE_GIVERS: LandingData['givers'] = [
  { name: 'Bojan K.', neighbourhood: 'Karpoš', ratingAvg: 4.9, ratingCount: 12, fromPrice: 450 },
  { name: 'Elena T.', neighbourhood: 'Centar', ratingAvg: 4.8, ratingCount: 9, fromPrice: 400 },
]

const roundPrice = (p: number | null) =>
  p == null ? DEFAULT_PRICE : Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.ceil(p / PRICE_STEP) * PRICE_STEP))
const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n))
/** Signs up first, then lands on the post form with these fields filled in. */
const signupThenPost = (query: string) => `/register?next=${encodeURIComponent(`/post?${query}`)}`

function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" />
    </svg>
  )
}

/** Decorative shapes in the page's side gutters, e.g. 'ring-violet r top' = shape, side, height. */
function Side({ shapes }: { shapes: string[] }) {
  return <>{shapes.map((s) => <span key={s} className={`lp-side ${s.split(' ').map((c) => `lp-side-${c}`).join(' ')}`} aria-hidden="true" />)}</>
}

/** Public home page shown before login. */
export default function Landing() {
  const { t, lang, setLang } = useI18n()
  const L = t.landing
  const navigate = useNavigate()
  // If the landing call fails, still show the categories (without prices) from the plain list.
  const { data } = useAsync(() => publicApi.landing().catch(async (): Promise<LandingData> => ({
    categories: (await categoriesApi.list()).map((c) => ({ ...c, fromPrice: null, giverCount: 0 })),
    stats: { categoryCount: 0, giverCount: 0, completedCount: 0 }, givers: [], reviews: [],
  })))
  const categories = data?.categories ?? []
  const name = (c: { nameEn: string; nameMk: string }) => (lang === 'mk' ? c.nameMk : c.nameEn)

  const [selKey, setSelKey] = useState('pharmacy')
  const [price, setPrice] = useState(DEFAULT_PRICE)
  const [slot, setSlot] = useState(0)
  const selected = categories.find((c) => c.key === selKey)
  // Start the builder at what the default category really costs, once that's known.
  useEffect(() => { if (selected) setPrice(roundPrice(selected.fromPrice)) }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const heroCats = HERO_KEYS.map((k) => categories.find((c) => c.key === k)).filter((c) => c != null)
  const givers = data?.givers.length ? data.givers : SAMPLE_GIVERS
  const stats = data ? [
    { value: data.stats.categoryCount, label: L.statCategories },
    { value: data.stats.giverCount, label: L.statGivers },
    { value: data.stats.completedCount, label: L.statCompleted },
  ].filter((s) => s.value > 0) : []
  const reviews = data?.reviews ?? []
  const den = (n: number) => `${formatDen(n)} ${t.dash.den}`
  const builderQuery = `category=${selKey}&budget=${price}&when=${SLOT_KEYS[slot]}`

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-row">
          <Link to="/welcome" className="lp-brand">
            <span className="lp-logo" aria-hidden="true">R</span>
            <span>run my errands</span>
          </Link>
          <nav aria-label="Main">
            <a href="#categories">{L.navServices}</a>
            <a href="#how">{L.navHow}</a>
            <div className="lp-lang">
              <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-label="English">EN</button>
              <button className={lang === 'mk' ? 'active' : ''} onClick={() => setLang('mk')} aria-label="Македонски">МК</button>
            </div>
            <Link to="/login">{L.navLogin}</Link>
            <Link to="/register?role=GIVER" className="lp-nav-giver">{L.navGiver}</Link>
          </nav>
        </div>
      </header>

      <section id="top" className="lp-hero">
        <div className="lp-deco lp-hero-sun" aria-hidden="true" />
        <div className="lp-deco lp-hero-dots" aria-hidden="true" />
        <div className="lp-wrap lp-hero-row">
          <div className="lp-hero-copy">
            <div className="lp-badge"><span />{L.badge}</div>
            <h1>{L.h1a}<br />{L.h1b} <mark>{L.h1c}</mark></h1>
            <p>{L.sub}</p>
          </div>

          <div className="lp-builder-wrap">
            <div className="lp-deco lp-ring" aria-hidden="true" />
            <div className="lp-builder">
              <p className="lp-sentence">
                {L.bNeed}{' '}
                <span className="lp-sel" style={{ background: tile(selKey)[0], color: tile(selKey)[1] }}>
                  {selected ? name(selected) : '…'}
                </span>{' '}
                {L.bFor}{' '}
                <span className="lp-price">
                  <button onClick={() => setPrice((p) => Math.max(PRICE_MIN, p - PRICE_STEP))} aria-label={L.lowerPrice}>−</button>
                  <span aria-live="polite">{den(price)}</span>
                  <button onClick={() => setPrice((p) => Math.min(PRICE_MAX, p + PRICE_STEP))} aria-label={L.raisePrice}>+</button>
                </span>{' '}
                <button className="lp-slot" onClick={() => setSlot((s) => (s + 1) % SLOT_KEYS.length)} aria-label={`${L.changeTime}: ${L.slots[slot]}`}>
                  {L.slots[slot]} ↻
                </button>
              </p>
              <div className="lp-chips">
                {heroCats.map((c) => (
                  <button key={c.key} aria-pressed={c.key === selKey} className={c.key === selKey ? 'active' : ''}
                    style={{ background: tile(c.key)[0], color: tile(c.key)[1] }}
                    onClick={() => { setSelKey(c.key); setPrice(roundPrice(c.fromPrice)) }}>
                    {name(c)}
                  </button>
                ))}
                {categories.length > heroCats.length && (
                  <a href="#categories" className="lp-chip-more">{L.moreCats(categories.length - heroCats.length)}</a>
                )}
              </div>
              <button className="lp-builder-cta" onClick={() => navigate(signupThenPost(builderQuery))}>
                {L.bCta}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            <div className="lp-deco lp-square" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="categories" className="lp-cats-band lp-has-side">
        <Side shapes={['ring-violet r top', 'square-lime l bottom']} />
        <div className="lp-cats-inner">
          <div className="lp-section-head">
            <div>
              <h2>{L.catTitle(categories.length || 13)}</h2>
              <p>{L.catSub}</p>
            </div>
            {categories.some((c) => c.trustTier === 'HIGH') && (
              <span className="lp-legend"><span />{L.tierHigh}</span>
            )}
          </div>
          <div className="lp-cats">
            {categories.map((c) => (
              <Link key={c.key} to={signupThenPost(`category=${c.key}${c.fromPrice != null ? `&budget=${roundPrice(c.fromPrice)}` : ''}`)}
                className="lp-cat" style={{ background: tile(c.key)[0], color: tile(c.key)[1] }}>
                <div className="lp-cat-top">
                  <span className={`lp-glyph${tile(c.key)[1] === '#FFFFFF' ? ' on-dark' : ''}`} aria-hidden="true">{name(c).trim()[0]?.toUpperCase()}</span>
                  {c.trustTier === 'HIGH' && <span className="lp-id">ID ✓</span>}
                </div>
                <div>
                  <strong>{name(c)}</strong>
                  <span>{c.fromPrice != null ? `${L.from} ${den(c.fromPrice)}` : L.noGivers}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-panel-section lp-has-side">
        <Side shapes={['dots-sun l mid', 'circle-peach r bottom']} />
        <div className="lp-panel">
          <div className="lp-deco lp-panel-blob" aria-hidden="true" />
          <div className="lp-panel-copy">
            <div className="lp-kicker">{L.panelKicker}</div>
            <h2>{L.panelTitle}</h2>
            <p>{L.panelText}</p>
            <Link to="/register" className="lp-btn">{L.panelCta}</Link>
          </div>
          <div className="lp-preview">
            <div className="lp-preview-card">
              <div className="lp-map" aria-hidden="true">
                <span className="lp-road lp-road-a" /><span className="lp-road lp-road-b" />
                <span className="lp-radius" /><span className="lp-you" />
                <span className="lp-pin" style={{ left: '34%', top: '30%', background: '#FF7A59' }}>1</span>
                <span className="lp-pin" style={{ left: '62%', top: '38%', background: '#6A5AE0', color: '#fff' }}>2</span>
                <span className="lp-pin" style={{ left: '44%', top: '70%', background: '#F5B82E' }}>3</span>
              </div>
              <div className="lp-live"><span />{L.live}</div>
              <ul className="lp-givers">
                {givers.map((g, i) => (
                  <li key={g.name}>
                    <span className="lp-avatar" style={{ background: AVATARS[i % AVATARS.length] }}>{initials(g.name)}</span>
                    <div>
                      <strong>{g.name}</strong>
                      <span className="lp-muted">★ {Number(g.ratingAvg).toFixed(1)} · {g.neighbourhood}</span>
                    </div>
                    <strong className="lp-giver-price">{den(g.fromPrice)}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-float">{L.floatTag}</div>
          </div>
        </div>
      </section>

      <section id="how" className="lp-how lp-has-side">
        <Side shapes={['circle-mint l top', 'square-violet r mid']} />
        <div className="lp-wrap">
          <h2>{L.howTitle}</h2>
          <p className="lp-how-sub">{L.howSub}</p>
          <ol className="lp-steps">
            {L.steps.map(([title, text], i) => (
              <li key={title} className={`lp-step lp-step-${i + 1}`}>
                <span className="lp-step-blob" aria-hidden="true" />
                <span className="lp-step-num">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lp-section lp-has-side">
        <Side shapes={['ring-sun l mid', 'dots-green r top']} />
        <div className="lp-wrap lp-roles">
          <div className="lp-role lp-role-req">
            <div className="lp-deco lp-role-ring" aria-hidden="true" />
            <div className="lp-kicker">{L.reqKicker}</div>
            <h2>{L.reqTitle}</h2>
            <ul>{L.reqList.map((li) => <li key={li}><span aria-hidden="true">✓</span>{li}</li>)}</ul>
            <Link to="/register" className="lp-btn lp-btn-dark">{L.reqCta}</Link>
          </div>
          <div id="giver" className="lp-role lp-role-giv">
            <div className="lp-deco lp-role-lines" aria-hidden="true" />
            <div className="lp-kicker">{L.givKicker}</div>
            <h2>{L.givTitle}</h2>
            <ul>{L.givList.map((li) => <li key={li}><span aria-hidden="true">✓</span>{li}</li>)}</ul>
            <Link to="/register?role=GIVER" className="lp-btn lp-btn-mint">{L.givCta}</Link>
          </div>
        </div>
      </section>

      <section className="lp-section lp-trust-section lp-has-side">
        <Side shapes={['square-peach l top', 'circle-sky r mid']} />
        <div className="lp-wrap">
          <h2 className="lp-trust-title">{L.trustTitle}</h2>
          <div className="lp-trust">
            {L.trust.map(([title, text], i) => (
              <div key={title}>
                <div className={`lp-trust-icon lp-trust-${i + 1}`}><ShieldIcon /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {(stats.length > 0 || reviews.length > 0) && (
        <section className="lp-proof">
          <div className="lp-deco lp-proof-blob" aria-hidden="true" />
          <div className="lp-deco lp-proof-dots" aria-hidden="true" />
          <div className="lp-wrap">
            {stats.length > 0 && (
              <div className="lp-stats">
                {stats.map((s) => <div key={s.label}><strong>{compact(s.value)}</strong><span>{s.label}</span></div>)}
              </div>
            )}
            {reviews.length > 0 && (
              <>
                <h2>{L.revTitle}</h2>
                <div className="lp-reviews">
                  {reviews.map((r, i) => (
                    <figure key={i}>
                      <div className="lp-stars" role="img" aria-label={L.starsLabel(r.stars)}>{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
                      <blockquote>{r.text}</blockquote>
                      <figcaption>
                        <span className="lp-avatar" style={{ background: AVATARS[i % AVATARS.length] }}>{initials(r.authorName)}</span>
                        <span><strong>{r.authorName}</strong><span className="lp-muted">{lang === 'mk' ? r.categoryNameMk : r.categoryNameEn}</span></span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <section className="lp-cta">
        <div className="lp-deco lp-cta-a" aria-hidden="true" />
        <div className="lp-deco lp-cta-b" aria-hidden="true" />
        <div className="lp-cta-inner">
          <h2>{L.ctaTitle}</h2>
          <p>{L.ctaSub}</p>
          <div className="lp-cta-buttons">
            <Link to="/register" className="lp-btn">{L.ctaPrimary}</Link>
            <Link to="/register?role=GIVER" className="lp-btn lp-btn-outline">{L.ctaSecondary}</Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-row">
          <div className="lp-footer-about">
            <div className="lp-brand lp-brand-light"><span className="lp-logo" aria-hidden="true">R</span><span>run my errands</span></div>
            <p>{L.footNote}</p>
          </div>
          <div className="lp-footer-cols">
            <div><strong>{L.footCol1}</strong><a href="#categories">{L.navServices}</a><a href="#how">{L.navHow}</a></div>
            <div><strong>{L.footCol2}</strong><Link to="/register?role=GIVER">{L.navGiver}</Link><Link to="/login">{L.navLogin}</Link></div>
          </div>
        </div>
        <div className="lp-wrap lp-copyright">© {new Date().getFullYear()} Run My Errands · Skopje</div>
      </footer>
    </div>
  )
}

import { neighbourhoodCentre } from '../neighbourhoods'
import { useI18n } from '../i18n/I18nContext'

export interface MapPin { id: number; label: string; neighbourhood: string; distanceKm?: number }

const SIZE = 400, MID = SIZE / 2, RING = 150

/**
 * A schematic map, not a real one: the request sits in the middle and each giver is a numbered pin at
 * their neighbourhood's rough centre, scaled so the farthest one lands on the dashed ring. Swapping in
 * a tile map later only needs the same centres.
 */
export default function MatchMap({ centre, pins, active, onHover }: {
  centre: string; pins: MapPin[]; active: number | null; onHover: (id: number | null) => void
}) {
  const { t } = useI18n()
  const origin = neighbourhoodCentre(centre)
  const placed = origin ? pins.filter((p) => neighbourhoodCentre(p.neighbourhood)) : []
  const maxKm = Math.max(0.5, ...placed.map((p) => p.distanceKm ?? 0))
  const scale = RING / maxKm

  // Pins in the same neighbourhood would sit on top of each other, so fan them out around that spot.
  const seen = new Map<string, number>()
  const points = placed.map((p) => {
    const [lat, lng] = neighbourhoodCentre(p.neighbourhood)!
    const kmX = (lng - origin![1]) * 111.32 * Math.cos((origin![0] * Math.PI) / 180)
    const kmY = (lat - origin![0]) * 110.57
    const key = `${lat},${lng}`
    const n = seen.get(key) ?? 0
    seen.set(key, n + 1)
    const nearCentre = Math.hypot(kmX, kmY) * scale < 12
    const spread = n === 0 && !nearCentre ? 0 : 18
    const angle = (n * 2 * Math.PI) / 6 - Math.PI / 2
    return { ...p, x: MID + kmX * scale + spread * Math.cos(angle), y: MID - kmY * scale + spread * Math.sin(angle) }
  })

  return (
    <div className="card map-card">
      <div className="map-head">
        <strong>{t.matches.map}</strong>
        {placed.length > 0 && <span className="muted small">{t.matches.km(maxKm)}</span>}
      </div>
      <svg className="map-canvas" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={t.matches.map}>
        <defs>
          <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="var(--map-grid)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={SIZE} height={SIZE} fill="var(--map-bg)" />
        <rect width={SIZE} height={SIZE} fill="url(#map-grid)" />
        {placed.length > 0 && (
          <circle cx={MID} cy={MID} r={RING} fill="none" stroke="var(--map-ring)" strokeWidth="1.5" strokeDasharray="5 5" />
        )}
        <circle cx={MID} cy={MID} r="7" fill="var(--ink)" stroke="#fff" strokeWidth="2">
          <title>{t.matches.you}</title>
        </circle>
        {points.map((p) => (
          <g key={p.id} className={`map-pin${active === p.id ? ' active' : ''}`}
             onMouseEnter={() => onHover(p.id)} onMouseLeave={() => onHover(null)}>
            <circle cx={p.x} cy={p.y} r={active === p.id ? 15 : 12} fill="var(--accent)" stroke="#fff" strokeWidth="2.5" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">{p.label}</text>
          </g>
        ))}
      </svg>
      <div className="map-foot muted small">
        {t.matches.mapNote}
        {pins.length > points.length && <> {t.matches.noPlace}</>}
      </div>
    </div>
  )
}

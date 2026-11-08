// Suggestions for the neighbourhood field — free text is still allowed, this just keeps spelling consistent.
// The Macedonian name is what gets stored; the English one is only for display.
export const SKOPJE_NEIGHBOURHOODS: { mk: string; en: string }[] = [
  { mk: 'Аеродром', en: 'Aerodrom' }, { mk: 'Автокоманда', en: 'Avtokomanda' }, { mk: 'Бит Пазар', en: 'Bit Pazar' },
  { mk: 'Бутел', en: 'Butel' }, { mk: 'Буњаковец', en: 'Bunjakovec' }, { mk: 'Влае', en: 'Vlae' }, { mk: 'Водно', en: 'Vodno' },
  { mk: 'Гази Баба', en: 'Gazi Baba' }, { mk: 'Дебар Маало', en: 'Debar Maalo' }, { mk: 'Драчево', en: 'Drachevo' },
  { mk: 'Ѓорче Петров', en: 'Gjorche Petrov' }, { mk: 'Железара', en: 'Zhelezara' }, { mk: 'Злокуќани', en: 'Zlokukjani' },
  { mk: 'Јане Сандански', en: 'Jane Sandanski' }, { mk: 'Капиштец', en: 'Kapishtec' },
  { mk: 'Карпош 1', en: 'Karposh 1' }, { mk: 'Карпош 2', en: 'Karposh 2' }, { mk: 'Карпош 3', en: 'Karposh 3' },
  { mk: 'Карпош 4', en: 'Karposh 4' }, { mk: 'Кисела Вода', en: 'Kisela Voda' }, { mk: 'Козле', en: 'Kozle' },
  { mk: 'Лисиче', en: 'Lisiche' }, { mk: 'Маџир Маало', en: 'Madzhir Maalo' }, { mk: 'Ново Лисиче', en: 'Novo Lisiche' },
  { mk: 'Припор', en: 'Pripor' }, { mk: 'Пржино', en: 'Przhino' }, { mk: 'Тафталиџе 1', en: 'Taftalidzhe 1' },
  { mk: 'Тафталиџе 2', en: 'Taftalidzhe 2' }, { mk: 'Топаана', en: 'Topaana' }, { mk: 'Хиподром', en: 'Hipodrom' },
  { mk: 'Центар', en: 'Centar' }, { mk: 'Чаир', en: 'Chair' }, { mk: 'Шуто Оризари', en: 'Shuto Orizari' },
]

/** Loose form for comparing: lower case, no diacritics, and "sh"/"š" both become "s" — so "Karpos", "Karpoš" and "Karposh" match. */
export function normalizeNeighbourhood(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/dzh/g, 'dz').replace(/([szc])h/g, '$1').replace(/([gk])j/g, '$1').replace(/\s+/g, ' ')
}

function find(value: string) {
  const n = normalizeNeighbourhood(value)
  return n ? SKOPJE_NEIGHBOURHOODS.find((x) => normalizeNeighbourhood(x.mk) === n || normalizeNeighbourhood(x.en) === n) : undefined
}

/** The value to store: a known neighbourhood (typed in either language) becomes its Macedonian name; free text is kept. */
export function canonicalNeighbourhood(value: string) {
  return find(value)?.mk ?? value
}

/** A stored neighbourhood in the reader's language; free text is shown as typed. */
export function neighbourhoodLabel(value: string, lang: 'en' | 'mk') {
  const hit = find(value)
  return hit ? hit[lang] : value
}

// Rough centre of each neighbourhood (lat, lng). Good enough for "about 2 km away" and map pins;
// nobody's real address is ever used, which is the point until a booking is confirmed.
const CENTRES: Record<string, [number, number]> = {
  'Аеродром': [41.985, 21.470], 'Автокоманда': [42.003, 21.468], 'Бит Пазар': [42.003, 21.443],
  'Бутел': [42.030, 21.445], 'Буњаковец': [41.996, 21.423], 'Влае': [42.006, 21.375], 'Водно': [41.980, 21.420],
  'Гази Баба': [42.010, 21.470], 'Дебар Маало': [42.000, 21.420], 'Драчево': [41.940, 21.530],
  'Ѓорче Петров': [42.008, 21.360], 'Железара': [41.985, 21.505], 'Злокуќани': [42.003, 21.387],
  'Јане Сандански': [41.983, 21.483], 'Капиштец': [41.992, 21.418],
  'Карпош 1': [42.003, 21.410], 'Карпош 2': [42.005, 21.402], 'Карпош 3': [42.002, 21.398],
  'Карпош 4': [42.006, 21.393], 'Кисела Вода': [41.980, 21.440], 'Козле': [41.996, 21.399],
  'Лисиче': [41.978, 21.487], 'Маџир Маало': [41.990, 21.438], 'Ново Лисиче': [41.970, 21.495],
  'Припор': [41.977, 21.452], 'Пржино': [41.983, 21.455], 'Тафталиџе 1': [41.998, 21.400],
  'Тафталиџе 2': [41.995, 21.392], 'Топаана': [42.005, 21.440], 'Хиподром': [42.000, 21.505],
  'Центар': [41.996, 21.431], 'Чаир': [42.010, 21.445], 'Шуто Оризари': [42.040, 21.425],
}

/** Approximate centre of a known neighbourhood; undefined for free text we can't place. */
export function neighbourhoodCentre(value: string): [number, number] | undefined {
  const hit = find(value)
  return hit ? CENTRES[hit.mk] : undefined
}

/** Straight-line km between two neighbourhood centres, or undefined if either can't be placed. */
export function neighbourhoodDistanceKm(a: string, b: string) {
  const p = neighbourhoodCentre(a), q = neighbourhoodCentre(b)
  if (!p || !q) return undefined
  const rad = Math.PI / 180
  const dLat = (q[0] - p[0]) * rad, dLng = (q[1] - p[1]) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p[0] * rad) * Math.cos(q[0] * rad) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

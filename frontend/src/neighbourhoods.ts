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

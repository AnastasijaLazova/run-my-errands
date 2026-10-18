import { createContext, useContext, useState, type ReactNode } from 'react'
import { en, type Dict } from './en'
import { mk } from './mk'

type Lang = 'en' | 'mk'
interface I18n { lang: Lang; t: Dict; setLang: (l: Lang) => void }

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>((localStorage.getItem('rme_lang') as Lang) || 'en')
  const setLang = (l: Lang) => { localStorage.setItem('rme_lang', l); setLangState(l) }
  return <Ctx.Provider value={{ lang, t: lang === 'mk' ? mk : en, setLang }}>{children}</Ctx.Provider>
}

export function useI18n() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>')
  return v
}

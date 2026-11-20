import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { parseISO, todayISO, diffDays, weekday } from './time'

export type Lang = 'en' | 'ro'
type Ctx = { lang: Lang; setLang: (l: Lang) => void }
const LangCtx = createContext<Ctx>({ lang: 'en', setLang: () => {} })

function initialLang(): Lang {
  try {
    const v = localStorage.getItem('courtal-lang')
    if (v === 'en' || v === 'ro') return v
  } catch {
    /* ignore */
  }
  return 'en'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('courtal-lang', l)
    } catch {
      /* ignore */
    }
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'courtal-lang' && (e.newValue === 'en' || e.newValue === 'ro')) setLangState(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [lang])
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>
}

export function useLang() {
  return useContext(LangCtx)
}

/** t('English', 'Română') */
export function useT() {
  const { lang } = useContext(LangCtx)
  return useCallback((en: string, ro: string) => (lang === 'ro' ? ro : en), [lang])
}
export type T = ReturnType<typeof useT>

const DAYS = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ro: ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'],
}
const DAYS_LONG = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  ro: ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'],
}
const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ro: ['ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.', 'dec.'],
}
const MONTHS_LONG = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ro: ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'],
}

export function dayShort(lang: Lang, wd: number) {
  return DAYS[lang][wd]
}
export function dayLong(lang: Lang, wd: number) {
  return DAYS_LONG[lang][wd]
}
export function monthLong(lang: Lang, m: number) {
  return MONTHS_LONG[lang][m]
}
export function monthShort(lang: Lang, m: number) {
  return MONTHS[lang][m]
}
/** "Tue 3 Nov" */
export function fmtDate(lang: Lang, s: string) {
  const d = parseISO(s)
  return `${DAYS[lang][weekday(s)]} ${d.getDate()} ${MONTHS[lang][d.getMonth()]}`
}
/** "3 Nov" */
export function fmtDM(lang: Lang, s: string) {
  const d = parseISO(s)
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]}`
}
/** "Today" / "Tomorrow" / "Tue" */
export function fmtRel(lang: Lang, s: string) {
  const n = diffDays(s, todayISO())
  if (n === 0) return lang === 'ro' ? 'Azi' : 'Today'
  if (n === 1) return lang === 'ro' ? 'Mâine' : 'Tomorrow'
  if (n === -1) return lang === 'ro' ? 'Ieri' : 'Yesterday'
  if (n > 1 && n < 7) return DAYS[lang][weekday(s)]
  return fmtDate(lang, s)
}
export function fmtMoney(n: number) {
  const r = Math.round(n)
  return `${r.toLocaleString('ro-RO').replace(/\./g, ' ')} lei`
}

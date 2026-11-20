import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { DemoState, Game, Sport } from '../lib/types'
import type { Lang, T } from '../lib/i18n'
import { fmtRel, fmtDate } from '../lib/i18n'
import { bookingOf, court, venue, ME } from '../lib/store'
import { hm } from '../lib/time'
import { cx } from '../ui'

export function formatName(t: T, g: Game, sport: Sport) {
  if (g.format === 'doubles') return t('Doubles', 'Dublu')
  if (g.format === 'singles') return t('Singles', 'Simplu')
  if (sport === 'football') return t('5-a-side', 'Fotbal 5x5')
  if (sport === 'basketball') return t('3x3 basketball', 'Baschet 3x3')
  return t('Volleyball 6x6', 'Volei 6x6')
}

export function gameInfo(s: DemoState, g: Game) {
  const b = bookingOf(s, g.bookingId)!
  const v = venue(s, b.venueId)
  const c = court(v, b.courtId)
  return { b, v, c, sport: c.sport, spotsLeft: g.size - g.players.length }
}

export function levelLabel(t: T, g: Game) {
  if (g.levelMin <= 1 && g.levelMax >= 7) return t('Any level', 'Orice nivel')
  return `${t('Level', 'Nivel')} ${g.levelMin.toFixed(1)}–${g.levelMax.toFixed(1)}`
}

export function gameWhen(lang: Lang, s: DemoState, g: Game, rel = true) {
  const b = bookingOf(s, g.bookingId)!
  return `${rel ? fmtRel(lang, b.date) : fmtDate(lang, b.date)} ${hm(b.start)}`
}

export function myRole(g: Game): 'host' | 'member' | 'requested' | 'guest' {
  if (g.hostId === ME) return 'host'
  if (g.players.includes(ME)) return 'member'
  if (g.requests.some((r) => r.playerId === ME)) return 'requested'
  return 'guest'
}

export function TopBar({ title, back, right, narrow, sub }: { title?: ReactNode; back?: string | number; right?: ReactNode; narrow?: boolean; sub?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className={cx('p-topbar', narrow && 'narrow')}>
      {back !== undefined && (
        <button className="icon-btn" onClick={() => (typeof back === 'number' ? nav(back) : nav(back))} aria-label="Back">
          <ChevronLeft size={28} />
        </button>
      )}
      <div className="grow">
        {title && <h1>{title}</h1>}
        {sub && <div className="muted" style={{ fontSize: 16, marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export function cancelUntil(lang: Lang, t: T, date: string, start: number, hours: number) {
  if (hours === 0) return t('Every booking is final once paid.', 'Rezervarea este finală după plată.')
  const d = new Date(date + 'T00:00:00')
  d.setMinutes(start - hours * 60)
  if (d.getTime() < Date.now())
    return t(`Less than ${hours} h to go, so this booking can't be cancelled for free`, `Mai sunt mai puțin de ${hours} h, așa că rezervarea nu se mai poate anula gratuit`)
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${t('Free cancellation until', 'Anulare gratuită până')} ${fmtDate(lang, iso)}, ${hm(d.getHours() * 60 + d.getMinutes())}`
}

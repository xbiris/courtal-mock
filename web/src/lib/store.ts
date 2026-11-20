import { useSyncExternalStore } from 'react'
import type { Booking, Court, DemoState, Game, Player, Venue } from './types'
import { makeSeed, VERSION, hash, priceFor, uid, ME } from './seed'
import { setClockOffset, todayISO, weekday, nowMin } from './time'

const KEY = 'courtal-demo'

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as DemoState
      if (s.version === VERSION && s.seedDate === todayISO()) return s
    }
  } catch {
    /* ignore */
  }
  return makeSeed()
}

let state: DemoState = load()
setClockOffset(state.clockOffset)
const listeners = new Set<() => void>()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}
save()

function emit() {
  setClockOffset(state.clockOffset)
  listeners.forEach((l) => l())
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) {
      try {
        state = JSON.parse(e.newValue)
        emit()
      } catch {
        /* ignore */
      }
    }
  })
}

export function getState() {
  return state
}

/** mutate a draft copy of the state */
export function update(fn: (s: DemoState) => void) {
  const draft = structuredClone(state)
  fn(draft)
  state = draft
  save()
  emit()
}

export function resetDemo() {
  state = makeSeed()
  save()
  emit()
}

export function useDemo(): DemoState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

/* ---------- lookups ---------- */
export function player(s: DemoState, id: string): Player {
  return s.players.find((p) => p.id === id) ?? { id, first: id, last: '', level: 3, rel: 95, games: 10 }
}
export function venue(s: DemoState, id: string): Venue {
  return s.venues.find((v) => v.id === id)!
}
export function court(v: Venue, id: string): Court {
  return v.courts.find((c) => c.id === id) ?? v.courts[0]
}
export function bookingOf(s: DemoState, id: string) {
  return s.bookings.find((b) => b.id === id)
}
export function gameOf(s: DemoState, id: string) {
  return s.games.find((g) => g.id === id)
}
export function share(s: DemoState, g: Game) {
  const bk = bookingOf(s, g.bookingId)
  return bk ? Math.round(bk.price / g.size) : 0
}
export const me = (s: DemoState) => player(s, ME)

/* ---------- availability ---------- */
export function active(b: Booking) {
  return b.status !== 'cancelled'
}

/** Fake busy pattern for venues that aren't the console venue. */
function fakeBusy(v: Venue, c: Court, date: string, t: number) {
  const hour = Math.floor(t / 60)
  const h = hash(`${v.id}|${c.id}|${date}|${hour}`) % 100
  const p = hour >= 17 ? 55 : hour < 10 ? 25 : 18
  return h < p
}

export function closedFor(v: Venue, date: string) {
  const sp = v.settings.special.find((x) => x.date === date)
  if (sp) return sp.closed ? null : { from: sp.from, to: sp.to }
  const h = v.settings.hours[weekday(date)]
  return h.open ? { from: h.from, to: h.to } : null
}

/** Free in the venue's own schedule (no "now" check) — used by the console */
export function slotFree(s: DemoState, v: Venue, courtId: string, date: string, start: number, dur: number, ignoreId?: string) {
  const hrs = closedFor(v, date)
  if (!hrs || start < hrs.from || start + dur > hrs.to) return false
  return !s.bookings.some(
    (b) => b.id !== ignoreId && b.venueId === v.id && b.courtId === courtId && b.date === date && active(b) && start < b.start + b.dur && b.start < start + dur,
  )
}

export function courtFree(s: DemoState, v: Venue, c: Court, date: string, start: number, dur: number, ignoreId?: string) {
  const hrs = closedFor(v, date)
  if (!hrs || start < hrs.from || start + dur > hrs.to) return false
  if (date === todayISO() && start < nowMin()) return false
  const clash = s.bookings.some(
    (b) => b.id !== ignoreId && b.venueId === v.id && b.courtId === c.id && b.date === date && active(b) && start < b.start + b.dur && b.start < start + dur,
  )
  if (clash) return false
  if (v.id !== 'verde' && !v.id.startsWith('new_')) {
    for (let t = start; t < start + dur; t += 30) if (fakeBusy(v, c, date, t)) return false
  }
  return true
}

export function courtsFor(v: Venue, sport: string) {
  return v.courts.filter((c) => (sport === 'all' || c.sport === sport) && c.bookable)
}

export function freeCourts(s: DemoState, v: Venue, sport: string, date: string, start: number, dur: number) {
  return courtsFor(v, sport).filter((c) => courtFree(s, v, c, date, start, dur))
}

export function freeTimes(s: DemoState, v: Venue, sport: string, date: string, dur: number, from = 0) {
  const hrs = closedFor(v, date)
  if (!hrs) return []
  const out: number[] = []
  for (let t = Math.max(hrs.from, from); t + dur <= hrs.to; t += 30) {
    if (freeCourts(s, v, sport, date, t, dur).length) out.push(t)
  }
  return out
}

export function minPrice(v: Venue, sport: string) {
  const cs = courtsFor(v, sport)
  if (!cs.length) return v.settings.base
  return Math.min(...cs.map((c) => c.price ?? v.settings.base))
}

/* ---------- actions ---------- */
export function addBooking(p: Omit<Booking, 'id' | 'createdAt'> & { id?: string }) {
  const id = p.id ?? uid()
  update((s) => {
    s.bookings.push({ ...p, id, createdAt: Date.now() })
  })
  return id
}

export function patchBooking(id: string, patch: Partial<Booking>) {
  update((s) => {
    const b = s.bookings.find((x) => x.id === id)
    if (b) Object.assign(b, patch)
  })
}

export function cancelBooking(id: string, by: 'venue' | 'player', reason: string) {
  update((s) => {
    const b = s.bookings.find((x) => x.id === id)
    if (!b) return
    b.status = 'cancelled'
    b.cancelledBy = by
    b.cancelReason = reason
    if (b.gameId) {
      const g = s.games.find((x) => x.id === b.gameId)
      if (g) g.closed = true
    }
  })
}

export function repriceBooking(s: DemoState, b: Booking) {
  const v = venue(s, b.venueId)
  return priceFor(v, court(v, b.courtId), b.date, b.start, b.dur)
}

export { ME, uid, priceFor }

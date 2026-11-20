import type { Booking, BlockReason, DemoState, Venue } from '../lib/types'
import type { T } from '../lib/i18n'
import { useDemo, venue, active, closedFor } from '../lib/store'
import { cx } from '../ui'

export function useVenue(): Venue {
  const s = useDemo()
  return venue(s, s.console.venueId) ?? venue(s, 'verde')
}

export function venueBookings(s: DemoState, v: Venue) {
  return s.bookings.filter((b) => b.venueId === v.id)
}

export function dayBookings(s: DemoState, v: Venue, date: string) {
  return s.bookings.filter((b) => b.venueId === v.id && b.date === date && active(b))
}

export function payLabel(t: T, b: Booking) {
  if (b.kind === 'block') return ''
  const src = b.source === 'app' ? t('App', 'Aplicație') : t('Phone', 'Telefon')
  if (b.pay === 'online') return t('Paid online', 'Plătit online')
  if (b.pay === 'venue') return b.seriesId ? `${t('Abonament', 'Abonament')}` : `${src} · ${t('paid at venue', 'plătit la bază')}`
  return `${src} · ${t('unpaid', 'neplătit')}`
}

export function reasonLabel(t: T, r?: BlockReason) {
  return {
    maintenance: t('Maintenance', 'Mentenanță'),
    rain: t('Rain', 'Ploaie'),
    private: t('Private event', 'Eveniment privat'),
    training: t('Club training', 'Antrenament club'),
    other: t('Other', 'Altele'),
  }[r ?? 'other']
}

export function statusLabel(t: T, b: Booking) {
  switch (b.status) {
    case 'checkedin':
      return t('Checked in', 'Prezent')
    case 'noshow':
      return t('No-show', 'Neprezentat')
    case 'cancelled':
      return b.cancelledBy === 'venue' ? t('Cancelled by venue', 'Anulat de bază') : t('Cancelled by player', 'Anulat de jucător')
    case 'played':
      return t('Played', 'Jucat')
    default:
      return t('Booked', 'Rezervat')
  }
}

export function StatusBadge({ t, b }: { t: T; b: Booking }) {
  const cls = b.status === 'cancelled' ? 'danger' : b.status === 'noshow' ? 'amber' : b.status === 'played' || b.status === 'checkedin' ? '' : 'outline'
  return <span className={cx('badge', cls)}>{statusLabel(t, b)}</span>
}

export function openHours(v: Venue, date: string) {
  const h = closedFor(v, date)
  return h ? (h.to - h.from) / 60 : 0
}

export function hoursRange(v: Venue) {
  const open = v.settings.hours.filter((h) => h.open)
  if (!open.length) return { from: 7 * 60, to: 23 * 60 }
  return { from: Math.min(...open.map((h) => h.from)), to: Math.max(...open.map((h) => h.to)) }
}

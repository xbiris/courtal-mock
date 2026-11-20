export const pad = (n: number) => String(n).padStart(2, '0')

export function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export function addDays(s: string, n: number) {
  const d = parseISO(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export function diffDays(a: string, b: string) {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / 86400000)
}
/** 0 = Monday … 6 = Sunday */
export function weekday(s: string) {
  return (parseISO(s).getDay() + 6) % 7
}
export function isWeekend(s: string) {
  return weekday(s) >= 5
}
export function hm(min: number) {
  const m = ((min % 1440) + 1440) % 1440
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}
export function parseHM(s: string) {
  const [h, m] = s.split(':').map(Number)
  return h * 60 + (m || 0)
}
export function todayISO() {
  return iso(new Date())
}
export function mondayOf(s: string) {
  return addDays(s, -weekday(s))
}
export function monthGrid(year: number, month: number) {
  // returns 6 weeks x 7 days of iso strings starting Monday
  const first = new Date(year, month, 1)
  const start = addDays(iso(first), -((first.getDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

let clockOffset = 0
export function setClockOffset(min: number) {
  clockOffset = min
}
/** minutes since midnight, including the presenter's demo clock offset */
export function nowMin() {
  const d = new Date()
  return Math.max(0, Math.min(1439, d.getHours() * 60 + d.getMinutes() + clockOffset))
}

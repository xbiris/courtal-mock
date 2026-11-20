export type Sport = 'tennis' | 'football' | 'basketball' | 'volleyball'
export type Surface = 'clay' | 'hard' | 'carpet' | 'turf' | 'parquet' | 'asphalt'

export interface Court {
  id: string
  name: string
  sport: Sport
  surface: Surface
  indoor: boolean
  lights: boolean
  /** own price per hour, null = uses the venue's price rules */
  price: number | null
  bookable: boolean
  photo?: string
}

export interface DayHours {
  open: boolean
  from: number
  to: number
}

export interface SpecialDay {
  id: string
  date: string
  closed: boolean
  from: number
  to: number
}
export interface SpecialPrice {
  id: string
  from: string
  to: string
  price: number
}
export interface PolicyChange {
  who: string
  at: number
  what: string
}

export interface VenueSettings {
  base: number
  evening: number | null
  eveningFrom: number
  weekend: number | null
  slot: 30 | 60 | 90
  hours: DayHours[]
  special: SpecialDay[]
  specialPrices: SpecialPrice[]
  payment: 'online' | 'both'
  cancel: 24 | 12 | 6 | 0
  window: number
  notice: number
  openGames: boolean
  showInFind: boolean
  rules: string
  history: PolicyChange[]
}

export interface Venue {
  id: string
  name: string
  address: string
  city: string
  km: number
  rating: number
  sports: Sport[]
  cover: string
  photos: string[]
  phone: string
  description: string
  amenities: string[]
  courts: Court[]
  settings: VenueSettings
  status: 'live' | 'review' | 'paused'
  pausedFrom?: string
  pausedTo?: string
  liveSince?: string
}

export type BlockReason = 'maintenance' | 'rain' | 'private' | 'training' | 'other'

export interface Booking {
  id: string
  venueId: string
  courtId: string
  date: string
  start: number
  dur: number
  kind: 'booking' | 'block'
  source: 'app' | 'desk'
  name: string
  playerId?: string
  phone?: string
  /** online = paid in app, venue = paid at the desk, unpaid = to collect, none = blocks */
  pay: 'online' | 'venue' | 'unpaid' | 'none'
  payMethod?: 'cash' | 'card'
  price: number
  status: 'booked' | 'checkedin' | 'noshow' | 'cancelled' | 'played'
  cancelledBy?: 'venue' | 'player'
  cancelReason?: string
  note?: string
  reason?: BlockReason
  seriesId?: string
  gameId?: string
  createdAt: number
  checkedInAt?: number
}

export interface JoinRequest {
  playerId: string
  msg: string
  at: number
  pay: 'online' | 'venue'
}

export interface Game {
  id: string
  bookingId: string
  hostId: string
  format: 'doubles' | 'singles' | 'team'
  size: number
  players: string[]
  requests: JoinRequest[]
  declined: string[]
  levelMin: number
  levelMax: number
  competitive: boolean
  approve: boolean
  payOnline: boolean
  closed: boolean
  createdAt: number
}

export interface Series {
  id: string
  venueId: string
  courtId: string
  name: string
  weekday: number
  start: number
  dur: number
  kind: 'booking' | 'block'
  reason?: BlockReason
  pay: 'session' | 'monthly'
  end?: string
  skipped: string[]
}

export interface Player {
  id: string
  first: string
  last: string
  level: number
  rel: number
  games: number
}

export interface Member {
  id: string
  name: string
  email: string
  role: 'owner' | 'manager' | 'desk'
  pending?: boolean
  you?: boolean
}

export interface Onboarding {
  step: number
  name: string
  phone: string
  street: string
  city: string
  sports: string[]
  courts: { name: string; sport: Sport; surface: Surface; indoor: boolean; lights: boolean }[]
  hours: DayHours[]
  base: string
  evening: string
  weekend: string
  slot: 30 | 60 | 90
  payment: 'online' | 'both'
  cancel: 24 | 12 | 6 | 0
  window: number
  notice: number
  openGames: boolean
  showInFind: boolean
  entity: 'srl' | 'pfa' | 'club'
  company: string
  cui: string
  regAddress: string
  iban: string
  holder: string
  plan: 'fee' | 'sub'
}

export interface DemoState {
  version: number
  seedDate: string
  clockOffset: number
  players: Player[]
  venues: Venue[]
  bookings: Booking[]
  games: Game[]
  series: Series[]
  me: {
    signedIn: boolean
    email: string
    method: 'apple' | 'google' | 'facebook' | 'email' | ''
    permsAsked: boolean
    permStep?: number
    ageOk?: boolean
    sport: Sport | 'all'
    sportPicked: boolean
  }
  console: {
    signedIn: boolean
    venueId: string
    team: Member[]
    notif: Record<string, boolean>
    plan: 'fee' | 'sub'
    planSwitch: boolean
    ibanPending: string
    iban: string
    holder: string
    company: string
    cui: string
    entity: 'srl' | 'pfa' | 'club'
    regAddress: string
    billingEmail: string
    profile: { name: string; email: string; phone: string }
  }
  onboarding: Onboarding | null
}

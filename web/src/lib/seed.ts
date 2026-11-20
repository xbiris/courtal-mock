import type { Booking, Court, DayHours, DemoState, Game, Player, Series, Sport, Venue, VenueSettings } from './types'
import { addDays, todayISO, weekday, isWeekend, parseHM } from './time'

export const ME = 'iarina'
export const CONSOLE_VENUE = 'verde'
export const VERSION = 5

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
export const uid = () => Math.random().toString(36).slice(2, 10)

export const PLAYERS: Player[] = [
  { id: 'iarina', first: 'Iarina', last: 'Ihos', level: 3.3, rel: 98, games: 57 },
  { id: 'david', first: 'David', last: 'Biris', level: 3.1, rel: 96, games: 42 },
  { id: 'marius', first: 'Marius', last: 'Moldovan', level: 3.6, rel: 94, games: 71 },
  { id: 'andrei', first: 'Andrei', last: 'Laslo', level: 3.0, rel: 91, games: 23 },
  { id: 'elena', first: 'Elena', last: 'Stoica', level: 2.9, rel: 99, games: 38 },
  { id: 'radu', first: 'Radu', last: 'Popovici', level: 4.2, rel: 97, games: 112 },
  { id: 'vlad', first: 'Vlad', last: 'Toma', level: 3.8, rel: 93, games: 64 },
  { id: 'ioana', first: 'Ioana', last: 'Georgescu', level: 2.7, rel: 100, games: 15 },
  { id: 'bogdan', first: 'Bogdan', last: 'Stan', level: 4.4, rel: 95, games: 88 },
  { id: 'cristina', first: 'Cristina', last: 'Rusu', level: 3.4, rel: 97, games: 49 },
  { id: 'teodora', first: 'Teodora', last: 'Dinu', level: 3.9, rel: 92, games: 33 },
  { id: 'florin', first: 'Florin', last: 'Neagu', level: 4.6, rel: 98, games: 140 },
  { id: 'diana', first: 'Diana', last: 'Matei', level: 3.2, rel: 96, games: 27 },
  { id: 'sorin', first: 'Sorin', last: 'Lungu', level: 3.5, rel: 90, games: 54 },
  { id: 'gabriel', first: 'Gabriel', last: 'Ene', level: 2.8, rel: 94, games: 19 },
  { id: 'ana', first: 'Ana', last: 'Constantin', level: 2.5, rel: 99, games: 12 },
  { id: 'alexandru', first: 'Alexandru', last: 'Popescu', level: 3.7, rel: 95, games: 76 },
  { id: 'mihaela', first: 'Mihaela', last: 'Ciobanu', level: 3.0, rel: 97, games: 31 },
  { id: 'stefan', first: 'Ștefan', last: 'Iordache', level: 4.1, rel: 93, games: 59 },
  { id: 'roxana', first: 'Roxana', last: 'Pavel', level: 2.6, rel: 100, games: 9 },
  { id: 'cosmin', first: 'Cosmin', last: 'Marin', level: 3.3, rel: 89, games: 45 },
  { id: 'larisa', first: 'Larisa', last: 'Tudor', level: 3.5, rel: 96, games: 37 },
]

const DESK_NAMES = [
  'Ionescu D.', 'Popescu A.', 'Moldovan C.', 'Sandu L.', 'Nistor G.', 'Dobre M.', 'Enache R.', 'Voicu S.', 'Lazăr T.', 'Oprea V.', 'Badea I.', 'Preda O.',
]

function hours(weekFrom: string, weekTo: string, endFrom: string, endTo: string): DayHours[] {
  return Array.from({ length: 7 }, (_, i) =>
    i < 5 ? { open: true, from: parseHM(weekFrom), to: parseHM(weekTo) } : { open: true, from: parseHM(endFrom), to: parseHM(endTo) },
  )
}

export function defaultSettings(base: number, extra: Partial<VenueSettings> = {}): VenueSettings {
  return {
    base,
    evening: null,
    eveningFrom: 17 * 60,
    weekend: null,
    slot: 30,
    hours: hours('07:00', '23:00', '08:00', '22:00'),
    special: [],
    specialPrices: [],
    payment: 'both',
    cancel: 24,
    window: 14,
    notice: 1,
    openGames: true,
    showInFind: true,
    rules: '',
    history: [],
    ...extra,
  }
}

function c(id: string, name: string, sport: Sport, surface: Court['surface'], indoor: boolean, lights = true, price: number | null = null, photo?: string): Court {
  return { id, name, sport, surface, indoor, lights, price, bookable: true, photo }
}

export function makeVenues(today: string): Venue[] {
  const weeksAgo = addDays(today, -23)
  return [
    {
      id: 'verde',
      name: 'Verde Tennis Club',
      address: 'Str. Nordului 41, Sector 1',
      city: 'București',
      km: 2.1,
      rating: 4.6,
      sports: ['tennis'],
      cover: 'verde-cover',
      photos: ['verde-cover', 'clay-1', 'clay-2', 'hard-1'],
      phone: '0721 450 118',
      description: 'Three courts five minutes from Herăstrău: two clay courts under the trees and one indoor hard court for winter evenings.',
      amenities: ['parking', 'showers', 'changing', 'rental', 'lights'],
      courts: [
        c('v1', 'Court 1', 'tennis', 'clay', false, true, null, 'clay-1'),
        c('v2', 'Court 2', 'tennis', 'clay', false, true, null, 'clay-2'),
        c('v3', 'Court 3', 'tennis', 'hard', true, true, 180, 'hard-1'),
      ],
      settings: defaultSettings(120, {
        weekend: 140,
        rules: 'Clay shoes required on courts 1 and 2. Please arrive 10 minutes early.',
        history: [
          { who: 'Mihai', at: Date.now() - 4 * 86400000, what: 'Cancellation: free until 24 h before' },
          { who: 'Mihai', at: Date.now() - 19 * 86400000, what: 'Weekend price: 140 lei/h' },
          { who: 'Mihai', at: Date.now() - 23 * 86400000, what: 'Venue registered' },
        ],
      }),
      status: 'live',
      liveSince: weeksAgo,
    },
    {
      id: 'aurora',
      name: 'Arena Aurora',
      address: 'Bd. Aviatorilor 18, Sector 1',
      city: 'București',
      km: 2.8,
      rating: 4.4,
      sports: ['tennis', 'basketball'],
      cover: 'aurora-cover',
      photos: ['aurora-cover', 'hard-2', 'basket-2'],
      phone: '0744 210 330',
      description: 'Indoor hard courts and a full basketball hall, open late all year.',
      amenities: ['parking', 'showers', 'changing', 'cafe'],
      courts: [
        c('a1', 'Court 1', 'tennis', 'hard', true),
        c('a2', 'Court 2', 'tennis', 'hard', true),
        c('a3', 'Court 3', 'tennis', 'hard', true),
        c('a4', 'Court 4', 'tennis', 'hard', true),
        c('a5', 'Hall', 'basketball', 'parquet', true, true, 200),
      ],
      settings: defaultSettings(120, { hours: hours('07:00', '23:00', '08:00', '23:00') }),
      status: 'live',
    },
    {
      id: 'teilor',
      name: 'Parcul Teilor Tenis',
      address: 'Str. Teilor 7, Sector 2',
      city: 'București',
      km: 3.4,
      rating: 4.8,
      sports: ['tennis'],
      cover: 'teilor-cover',
      photos: ['teilor-cover', 'clay-3', 'tennis-action'],
      phone: '0733 902 415',
      description: 'Six clay courts in a quiet park.',
      amenities: ['parking', 'changing', 'lights'],
      courts: Array.from({ length: 6 }, (_, i) => c(`t${i + 1}`, `Court ${i + 1}`, 'tennis', 'clay', false)),
      settings: defaultSettings(100, { hours: hours('08:00', '22:00', '08:00', '21:00') }),
      status: 'live',
    },
    {
      id: 'orizont',
      name: 'Club Sportiv Orizont',
      address: 'Calea Floreasca 112, Sector 1',
      city: 'București',
      km: 4.2,
      rating: 4.5,
      sports: ['tennis', 'volleyball'],
      cover: 'orizont-cover',
      photos: ['orizont-cover', 'hard-3', 'volley-1'],
      phone: '0722 118 640',
      description: 'Indoor carpet courts and a volleyball hall.',
      amenities: ['showers', 'changing', 'rental'],
      courts: [
        c('o1', 'Court 1', 'tennis', 'carpet', true),
        c('o2', 'Court 2', 'tennis', 'carpet', true),
        c('o3', 'Volley hall', 'volleyball', 'parquet', true, true, 160),
      ],
      settings: defaultSettings(130),
      status: 'live',
    },
    {
      id: 'cotroceni',
      name: 'Grădina Cotroceni Tenis',
      address: 'Str. Dr. Lister 22, Sector 5',
      city: 'București',
      km: 5.6,
      rating: 4.3,
      sports: ['tennis'],
      cover: 'cotroceni-cover',
      photos: ['cotroceni-cover', 'hard-1'],
      phone: '0751 330 271',
      description: 'Three outdoor hard courts behind the garden.',
      amenities: ['lights', 'rental'],
      courts: [c('c1', 'Court 1', 'tennis', 'hard', false), c('c2', 'Court 2', 'tennis', 'hard', false), c('c3', 'Court 3', 'tennis', 'hard', false)],
      settings: defaultSettings(120, { hours: hours('08:00', '22:00', '09:00', '20:00') }),
      status: 'live',
    },
    {
      id: 'lumina',
      name: 'Baza Sportivă Lumina',
      address: 'Str. Luminii 3, Sector 3',
      city: 'București',
      km: 6.1,
      rating: 4.2,
      sports: ['tennis', 'football', 'basketball'],
      cover: 'lumina-cover',
      photos: ['lumina-cover', 'football-2', 'basket-3'],
      phone: '0740 552 903',
      description: 'A neighbourhood base with a turf pitch, clay courts and an outdoor basketball court.',
      amenities: ['parking', 'changing', 'lights'],
      courts: [
        c('l1', 'Court 1', 'tennis', 'clay', false, true, 90),
        c('l2', 'Court 2', 'tennis', 'clay', false, true, 90),
        c('l3', 'Pitch', 'football', 'turf', false, true, 250),
        c('l4', 'Basketball', 'basketball', 'asphalt', false, true, 80),
      ],
      settings: defaultSettings(90),
      status: 'live',
    },
    {
      id: 'gazon',
      name: 'Gazon Club Pipera',
      address: 'Str. Pipera 50, Voluntari',
      city: 'Voluntari',
      km: 7.3,
      rating: 4.7,
      sports: ['football'],
      cover: 'gazon-cover',
      photos: ['gazon-cover', 'football-1', 'football-2'],
      phone: '0765 018 224',
      description: 'Three 5-a-side pitches, one covered for winter.',
      amenities: ['parking', 'showers', 'changing', 'cafe', 'lights'],
      courts: [
        c('g1', 'Pitch 1', 'football', 'turf', false),
        c('g2', 'Pitch 2', 'football', 'turf', false),
        c('g3', 'Pitch 3', 'football', 'turf', true),
      ],
      settings: defaultSettings(280, { hours: hours('09:00', '23:00', '09:00', '23:00') }),
      status: 'live',
    },
    {
      id: 'castanilor',
      name: 'Sala Castanilor',
      address: 'Str. Castanilor 9, Sector 6',
      city: 'București',
      km: 5.0,
      rating: 4.5,
      sports: ['basketball', 'volleyball'],
      cover: 'castanilor-cover',
      photos: ['castanilor-cover', 'basket-1', 'volley-2'],
      phone: '0726 774 019',
      description: 'A school sports hall open to the public in the evenings and at weekends.',
      amenities: ['changing', 'showers'],
      courts: [c('k1', 'Basketball court', 'basketball', 'parquet', true, true, 220), c('k2', 'Volleyball court', 'volleyball', 'parquet', true, true, 200)],
      settings: defaultSettings(200, { hours: hours('16:00', '22:00', '09:00', '21:00') }),
      status: 'live',
    },
    {
      id: 'nisip',
      name: 'Fileu Lacul Tei',
      address: 'Str. Lacul Tei 120, Sector 2',
      city: 'București',
      km: 3.9,
      rating: 4.6,
      sports: ['volleyball'],
      cover: 'nisip-cover',
      photos: ['nisip-cover', 'volley-1'],
      phone: '0731 660 452',
      description: 'Two outdoor volleyball courts by the lake.',
      amenities: ['lights', 'changing'],
      courts: [c('n1', 'Court 1', 'volleyball', 'hard', false), c('n2', 'Court 2', 'volleyball', 'hard', false)],
      settings: defaultSettings(150, { hours: hours('09:00', '22:00', '09:00', '22:00') }),
      status: 'live',
    },
  ]
}

function b(p: Partial<Booking> & Pick<Booking, 'venueId' | 'courtId' | 'date' | 'start' | 'dur' | 'name'>): Booking {
  return {
    id: uid(),
    kind: 'booking',
    source: 'app',
    pay: 'online',
    price: 0,
    status: 'booked',
    createdAt: Date.now() - 86400000 * 3,
    ...p,
  }
}

export function priceFor(v: Venue, court: Court, date: string, start: number, dur: number) {
  const s = v.settings
  let perHour = s.base
  if (court.price != null) perHour = court.price
  else {
    const sp = s.specialPrices.find((x) => date >= x.from && date <= x.to)
    if (sp) perHour = sp.price
    else if (isWeekend(date) && s.weekend) perHour = s.weekend
    else if (s.evening && start >= s.eveningFrom) perHour = s.evening
  }
  return Math.round((perHour * dur) / 60)
}

/** Today's grid at Verde, exactly as in the block-timeslot designs */
function verdeToday(v: Venue, d: string, s: { juniors: string; muresan: string }): Booking[] {
  const p = (courtId: string, start: number, dur: number) => priceFor(v, v.courts.find((x) => x.id === courtId)!, d, start, dur)
  return [
    b({ venueId: 'verde', courtId: 'v1', date: d, start: 8 * 60, dur: 60, name: 'Popescu A.', source: 'desk', pay: 'venue', phone: '0723 118 402', price: p('v1', 480, 60) }),
    b({ venueId: 'verde', courtId: 'v1', date: d, start: 17 * 60, dur: 60, name: 'Club juniors', kind: 'block', reason: 'training', pay: 'none', seriesId: s.juniors, source: 'desk' }),
    b({ id: 'b_iarina', venueId: 'verde', courtId: 'v1', date: d, start: 19 * 60, dur: 60, name: 'Iarina I.', playerId: 'iarina', gameId: 'g_iarina', price: p('v1', 1140, 60) }),
    b({ venueId: 'verde', courtId: 'v1', date: d, start: 21 * 60, dur: 60, name: 'Andrei L.', playerId: 'andrei', price: p('v1', 1260, 60) }),
    b({ venueId: 'verde', courtId: 'v2', date: d, start: 9 * 60, dur: 120, name: 'Maintenance', kind: 'block', reason: 'maintenance', note: 'Resurfacing', pay: 'none', source: 'desk' }),
    b({ venueId: 'verde', courtId: 'v2', date: d, start: 18 * 60, dur: 60, name: 'David B.', playerId: 'david', price: p('v2', 1080, 60) }),
    b({ venueId: 'verde', courtId: 'v2', date: d, start: 19 * 60, dur: 90, name: 'Ionescu D.', source: 'desk', pay: 'unpaid', phone: '0745 220 913', price: p('v2', 1140, 90) }),
    b({ venueId: 'verde', courtId: 'v3', date: d, start: 7 * 60, dur: 90, name: 'Radu P.', playerId: 'radu', price: p('v3', 420, 90) }),
    b({ venueId: 'verde', courtId: 'v3', date: d, start: 12 * 60, dur: 90, name: 'Elena S.', playerId: 'elena', price: p('v3', 720, 90) }),
    b({ venueId: 'verde', courtId: 'v3', date: d, start: 17 * 60, dur: 120, name: 'Fam. Mureșan', source: 'desk', pay: 'venue', seriesId: s.muresan, price: p('v3', 1020, 120) }),
    b({ venueId: 'verde', courtId: 'v3', date: d, start: 20 * 60 + 30, dur: 60, name: 'Vlad T.', playerId: 'vlad', price: p('v3', 1230, 60) }),
  ]
}

function fillDay(v: Venue, d: string, today: string, r: () => number, taken: Booking[]): Booking[] {
  const out: Booking[] = []
  const wd = weekday(d)
  const h = v.settings.hours[wd]
  const past = d < today
  const appPlayers = PLAYERS.filter((p) => p.id !== 'iarina')
  for (const court of v.courts) {
    let t = h.from
    while (t < h.to - 60) {
      const hour = t / 60
      const prob = hour >= 17 ? 0.62 : hour >= 7 && hour < 9 ? 0.35 : 0.2
      const dur = r() < 0.55 ? 60 : 90
      const clash = taken.some((x) => x.courtId === court.id && x.date === d && t < x.start + x.dur && x.start < t + dur)
      if (!clash && t + dur <= h.to && r() < prob) {
        const app = r() < 0.7
        const pl = appPlayers[Math.floor(r() * appPlayers.length)]
        const name = app ? `${pl.first} ${pl.last[0]}.` : DESK_NAMES[Math.floor(r() * DESK_NAMES.length)]
        let status: Booking['status'] = past ? 'played' : 'booked'
        let cancelledBy: Booking['cancelledBy']
        const roll = r()
        if (roll < 0.05) {
          status = 'cancelled'
          cancelledBy = r() < 0.7 ? 'player' : 'venue'
        } else if (past && roll < 0.08) status = 'noshow'
        const pay: Booking['pay'] = app ? (r() < 0.85 ? 'online' : past ? 'venue' : 'unpaid') : past ? 'venue' : r() < 0.6 ? 'unpaid' : 'venue'
        out.push(
          b({
            venueId: v.id,
            courtId: court.id,
            date: d,
            start: t,
            dur,
            name,
            playerId: app ? pl.id : undefined,
            source: app ? 'app' : 'desk',
            pay,
            phone: app ? undefined : `07${Math.floor(20 + r() * 70)} ${Math.floor(100 + r() * 899)} ${Math.floor(100 + r() * 899)}`,
            price: priceFor(v, court, d, t, dur),
            status,
            cancelledBy,
            cancelReason: cancelledBy === 'venue' ? 'Rain' : cancelledBy === 'player' ? 'Player cancelled in the app' : undefined,
            createdAt: Date.now() - Math.floor(r() * 20) * 86400000,
          }),
        )
        t += dur
      } else t += 30
    }
  }
  return out
}

export function makeSeed(): DemoState {
  const today = todayISO()
  const venues = makeVenues(today)
  const verde = venues[0]
  const wdToday = weekday(today)
  const series: Series[] = [
    { id: 's_juniors', venueId: 'verde', courtId: 'v1', name: 'Club juniors', weekday: wdToday, start: 17 * 60, dur: 60, kind: 'block', reason: 'training', pay: 'session', skipped: [] },
    { id: 's_muresan', venueId: 'verde', courtId: 'v3', name: 'Fam. Mureșan', weekday: wdToday, start: 17 * 60, dur: 120, kind: 'booking', pay: 'monthly', skipped: [] },
    { id: 's_corporate', venueId: 'verde', courtId: 'v2', name: 'Stoica & Asociații', weekday: (wdToday + 2) % 7, start: 7 * 60, dur: 90, kind: 'booking', pay: 'monthly', skipped: [] },
  ]
  let bookings: Booking[] = verdeToday(verde, today, { juniors: 's_juniors', muresan: 's_muresan' })
  // series instances on other weeks
  for (let w = -6; w <= 3; w++) {
    for (const s of series) {
      const d = addDays(today, w * 7 + ((s.weekday - wdToday + 7) % 7))
      if (d === today && s.id !== 's_corporate') continue
      const court = verde.courts.find((x) => x.id === s.courtId)!
      bookings.push(
        b({
          venueId: 'verde',
          courtId: s.courtId,
          date: d,
          start: s.start,
          dur: s.dur,
          name: s.name,
          kind: s.kind,
          reason: s.reason,
          source: 'desk',
          pay: s.kind === 'block' ? 'none' : d < today ? 'venue' : 'unpaid',
          seriesId: s.id,
          price: s.kind === 'block' ? 0 : priceFor(verde, court, d, s.start, s.dur),
          status: d < today ? (s.kind === 'block' ? 'booked' : 'played') : 'booked',
        }),
      )
    }
  }
  const r = rng(hash(today))
  for (let i = -42; i <= 14; i++) {
    if (i === 0) continue
    const d = addDays(today, i)
    bookings = bookings.concat(fillDay(verde, d, today, r, bookings))
  }

  // open games across venues
  const games: Game[] = []
  const mk = (
    id: string,
    venueId: string,
    courtId: string,
    dayOff: number,
    start: number,
    dur: number,
    hostId: string,
    g: Partial<Game>,
  ) => {
    const v = venues.find((x) => x.id === venueId)!
    const court = v.courts.find((x) => x.id === courtId)!
    const date = addDays(today, dayOff)
    const host = PLAYERS.find((p) => p.id === hostId)!
    const bid = `b_${id}`
    bookings.push(
      b({ id: bid, venueId, courtId, date, start, dur, name: `${host.first} ${host.last[0]}.`, playerId: hostId, gameId: id, price: priceFor(v, court, date, start, dur) }),
    )
    games.push({
      id,
      bookingId: bid,
      hostId,
      format: 'doubles',
      size: 4,
      players: [hostId],
      requests: [],
      declined: [],
      levelMin: 2.5,
      levelMax: 4.0,
      competitive: true,
      approve: true,
      payOnline: true,
      closed: false,
      createdAt: Date.now() - 3600000 * 5,
      ...g,
    })
  }
  // Iarina's own game (already in Verde's today grid)
  games.push({
    id: 'g_iarina',
    bookingId: 'b_iarina',
    hostId: 'iarina',
    format: 'doubles',
    size: 4,
    players: ['iarina'],
    requests: [{ playerId: 'david', msg: 'Hi! Play doubles every week, happy to bring a friend too if you need.', at: Date.now() - 12 * 60000, pay: 'online' }],
    declined: [],
    levelMin: 2.5,
    levelMax: 4.0,
    competitive: true,
    approve: true,
    payOnline: true,
    closed: false,
    createdAt: Date.now() - 3600000 * 20,
  })
  mk('g_andrei', 'teilor', 't2', 0, 20 * 60 + 30, 60, 'andrei', { format: 'singles', size: 2, levelMin: 1, levelMax: 7, competitive: false, approve: false })
  mk('g_marius', 'aurora', 'a1', 2, 19 * 60, 90, 'marius', {})
  mk('g_bogdan', 'cotroceni', 'c1', 3, 18 * 60, 90, 'bogdan', { players: ['bogdan', 'florin', 'teodora'], levelMin: 4.0, levelMax: 5.0, approve: false })
  mk('g_cristina', 'verde', 'v2', 1, 20 * 60, 90, 'cristina', { players: ['cristina', 'diana'], levelMin: 2.5, levelMax: 3.5, competitive: false })
  mk('g_stefan', 'orizont', 'o1', 1, 18 * 60, 60, 'stefan', { format: 'singles', size: 2, levelMin: 3.5, levelMax: 4.5, approve: false })
  mk('g_sorin', 'gazon', 'g1', 0, 21 * 60, 60, 'sorin', {
    format: 'team',
    size: 10,
    players: ['sorin', 'cosmin', 'alexandru', 'gabriel', 'stefan', 'radu'],
    levelMin: 1,
    levelMax: 7,
    competitive: false,
    approve: false,
  })
  mk('g_gabriel', 'castanilor', 'k1', 1, 19 * 60, 60, 'gabriel', { format: 'team', size: 6, players: ['gabriel', 'cosmin', 'vlad', 'radu'], levelMin: 1, levelMax: 7, approve: false, competitive: false })
  mk('g_ioana', 'nisip', 'n1', 2, 18 * 60, 90, 'ioana', {
    format: 'team',
    size: 12,
    players: ['ioana', 'larisa', 'roxana', 'mihaela', 'ana', 'diana', 'elena', 'cristina'],
    levelMin: 1,
    levelMax: 7,
    approve: true,
    competitive: false,
  })
  // remove generated clashes with the open games at Verde
  const gameBookings = bookings.filter((x) => x.gameId)
  bookings = bookings.filter(
    (x) => x.gameId || !gameBookings.some((g) => g.courtId === x.courtId && g.date === x.date && x.start < g.start + g.dur && g.start < x.start + x.dur),
  )

  return {
    version: VERSION,
    seedDate: today,
    clockOffset: 0,
    players: PLAYERS,
    venues,
    bookings,
    games,
    series,
    me: { signedIn: false, email: '', method: '', permsAsked: false, sport: 'all', sportPicked: false },
    console: {
      signedIn: false,
      venueId: CONSOLE_VENUE,
      team: [
        { id: 'm1', name: 'Mihai Rădulescu', email: 'mihai@verdetennis.ro', role: 'manager', you: true },
        { id: 'm2', name: 'Cristian Verde', email: 'cristian@verdetennis.ro', role: 'owner' },
        { id: 'm3', name: 'Andreea Vasile', email: 'andreea@verdetennis.ro', role: 'desk' },
      ],
      notif: {
        'new.email': true,
        'new.push': true,
        'new.sms': false,
        'cancel.email': true,
        'cancel.push': true,
        'cancel.sms': true,
        'full.email': false,
        'full.push': true,
        'full.sms': false,
        'noshow.email': true,
        'noshow.push': false,
        'noshow.sms': false,
        'summary.email': true,
        'summary.push': false,
        'summary.sms': false,
        'payout.email': true,
        'payout.push': true,
        'payout.sms': false,
      },
      plan: 'fee',
      planSwitch: false,
      ibanPending: '',
      iban: 'RO49 BTRL 0000 1234 5678 7731',
      holder: 'Verde Sport Club SRL',
      company: 'Verde Sport Club SRL',
      cui: 'RO 41207733',
      entity: 'srl',
      regAddress: 'Str. Nordului 41, Sector 1, București',
      billingEmail: 'contabilitate@verdetennis.ro',
      profile: { name: 'Mihai Rădulescu', email: 'mihai@verdetennis.ro', phone: '0722 304 115' },
    },
    onboarding: null,
  }
}

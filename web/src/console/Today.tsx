import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, Plus, Repeat, Check, X, Ban, CircleAlert } from 'lucide-react'
import { useDemo, venue, gameOf, slotFree, patchBooking, court, closedFor } from '../lib/store'
import { fmtDate, fmtMoney, dayShort, useLang, useT } from '../lib/i18n'
import { addDays, hm, mondayOf, nowMin, todayISO, parseISO } from '../lib/time'
import type { Booking, Venue } from '../lib/types'
import { Sheet, courtName, cx, surfaceName, toast, Avatar } from '../ui'
import { BookingSheet, BlockSheet, NewBookingSheet, type BlockInit, type Draft } from './sheets'
import { dayBookings, payLabel, useVenue, hoursRange, openHours } from './util'

type Kind = 'app' | 'desk' | 'open' | 'weekly' | 'block'
function kindsOf(s: ReturnType<typeof useDemo>, b: Booking): Kind[] {
  const k: Kind[] = []
  if (b.kind === 'block') k.push('block')
  else k.push(b.source === 'app' ? 'app' : 'desk')
  if (b.seriesId) k.push('weekly')
  if (b.gameId) {
    const g = gameOf(s, b.gameId)
    if (g && g.players.length < g.size && !g.closed) k.push('open')
  }
  return k
}

export function Today() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const [q, setQ] = useSearchParams()
  const v = useVenue()
  const today = todayISO()
  const [date, setDate] = useState(q.get('d') ?? today)
  const [view, setView] = useState<'day' | 'week'>((q.get('view') as 'day' | 'week') ?? 'day')
  const [sel, setSel] = useState<string | null>(q.get('b'))
  const [draft, setDraft] = useState<Draft | null>(null)
  const [pickDraft, setPickDraft] = useState(false)
  const [block, setBlock] = useState<BlockInit | null>(null)
  const [moving, setMoving] = useState<string | null>(null)
  const [hidden, setHidden] = useState<Kind[]>([])
  const [arrivals, setArrivals] = useState(false)
  const [search, setSearch] = useState('')
  const [weekCourt, setWeekCourt] = useState<string>('all')
  const [, tick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => tick((x) => x + 1), 30000)
    return () => clearInterval(i)
  }, [])
  useEffect(() => {
    if (q.get('b')) {
      setQ({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const bookings = dayBookings(s, v, date)
  const now = nowMin()
  const real = bookings.filter((b) => b.kind === 'booking')
  const bookedH = real.reduce((a, b) => a + b.dur, 0) / 60
  const totalH = openHours(v, date) * v.courts.length
  const revenue = real.reduce((a, b) => a + b.price, 0)
  const online = real.filter((b) => b.pay === 'online').reduce((a, b) => a + b.price, 0)
  const arriving = date === today ? real.filter((b) => b.start >= now && b.start < now + 60) : []
  const openGames = real.filter((b) => b.gameId && kindsOf(s, b).includes('open'))

  const openSlot = (courtId: string, d: string, start: number) => {
    if (moving) {
      const b = s.bookings.find((x) => x.id === moving)!
      if (!slotFree(s, v, courtId, d, start, b.dur, b.id)) return toast(t('That slot is not free', 'Intervalul nu e liber'))
      patchBooking(b.id, { courtId, date: d, start })
      setMoving(null)
      toast(`${t('Moved to', 'Mutat pe')} ${courtName(t, court(v, courtId).name)} · ${hm(start)} · ${t('players emailed', 'jucătorii au primit email')}`)
      return
    }
    setSel(null)
    setBlock(null)
    setPickDraft(false)
    setDraft({ courtId, date: d, start })
  }

  const results = useMemo(() => {
    const qq = search.trim().toLowerCase()
    if (qq.length < 2) return []
    return s.bookings
      .filter((b) => b.venueId === v.id && b.kind === 'booking' && (b.name.toLowerCase().includes(qq) || (b.phone ?? '').replace(/\s/g, '').includes(qq.replace(/\s/g, ''))))
      .sort((a, b) => {
        const fa = a.date >= today ? 0 : 1
        const fb = b.date >= today ? 0 : 1
        if (fa !== fb) return fa - fb
        return fa === 0 ? (a.date + a.start).localeCompare(b.date + b.start) : (b.date + b.start).localeCompare(a.date + a.start)
      })
      .slice(0, 8)
  }, [search, s.bookings, v.id, today])

  const weekStart = mondayOf(date)
  const legend: { k: Kind; label: string; sw: React.ReactNode }[] = [
    { k: 'app', label: t('Booked in the app', 'Rezervat în aplicație'), sw: <span className="sw app" /> },
    { k: 'desk', label: t('Added by you', 'Adăugat de tine'), sw: <span className="sw desk" /> },
    { k: 'open', label: t('Open game · spots free', 'Meci deschis · locuri libere'), sw: <span className="dot" /> },
    { k: 'weekly', label: t('Weekly', 'Săptămânal'), sw: <Repeat size={14} /> },
    { k: 'block', label: t('Blocked', 'Blocat'), sw: <span className="sw block" /> },
  ]

  return (
    <div>
      <div className="c-head">
        <button className="icon-btn outline" onClick={() => setDate(addDays(date, view === 'week' ? -7 : -1))} aria-label="Previous">
          <ChevronLeft size={20} />
        </button>
        <b style={{ fontSize: 22, minWidth: 120, textAlign: 'center' }}>
          {view === 'week' ? `${fmtDate(lang, weekStart).split(' ').slice(1).join(' ')} – ${fmtDate(lang, addDays(weekStart, 6)).split(' ').slice(1).join(' ')}` : fmtDate(lang, date)}
        </b>
        <button className="icon-btn outline" onClick={() => setDate(addDays(date, view === 'week' ? 7 : 1))} aria-label="Next">
          <ChevronRight size={20} />
        </button>
        <button className="btn outline sm" onClick={() => setDate(today)}>
          {t('Today', 'Azi')}
        </button>
        <div className="seg" style={{ border: '1.5px solid var(--line)', background: '#fff' }}>
          <button className={cx(view === 'day' && 'on')} onClick={() => setView('day')}>
            {t('Day', 'Zi')}
          </button>
          <button className={cx(view === 'week' && 'on')} onClick={() => setView('week')}>
            {t('Week', 'Săptămână')}
          </button>
        </div>
        <div className="spacer" />
        <div style={{ position: 'relative' }}>
          <div className="row" style={{ gap: 6, background: '#fff', border: '1.5px solid var(--line)', borderRadius: 999, padding: '0 14px', height: 42 }}>
            <Search size={17} className="muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Name or phone', 'Nume sau telefon')}
              style={{ border: 0, outline: 'none', background: 'none', width: 150, fontSize: 14.5 }}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear">
                <X size={16} />
              </button>
            )}
          </div>
          {search.trim().length >= 2 && (
            <div className="popover" style={{ top: 48, right: 0, width: 330 }}>
              {results.map((b) => (
                <button
                  key={b.id}
                  className="pop-item"
                  onClick={() => {
                    setDate(b.date)
                    setView('day')
                    setSel(b.id)
                    setSearch('')
                  }}
                >
                  <Avatar name={b.name} size="sm" />
                  <span className="grow">
                    <b style={{ display: 'block', fontSize: 14.5 }}>{b.name}</b>
                    <span className="tiny muted">
                      {fmtDate(lang, b.date)} {hm(b.start)} · {courtName(t, court(v, b.courtId).name)}
                    </span>
                  </span>
                </button>
              ))}
              {results.length === 0 && (
                <div className="pop-item muted" style={{ display: 'block' }}>
                  {t('No bookings for', 'Nicio rezervare pentru')} “{search}” ·{' '}
                  <button className="link" onClick={() => nav(`/console/bookings?q=${encodeURIComponent(search)}`)}>
                    {t('Search all bookings', 'Caută în toate rezervările')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          className="btn outline sm"
          onClick={() => {
            setSel(null)
            setDraft(null)
            setBlock({ courtIds: [v.courts[0].id], date, from: 9 * 60, to: 11 * 60 })
          }}
        >
          <Ban size={16} /> {t('Block time', 'Blochează timp')}
        </button>
        <button
          className="btn primary sm"
          onClick={() => {
            setSel(null)
            setBlock(null)
            setPickDraft(true)
            setDraft({ courtId: v.courts[0].id, date, start: Math.max(Math.ceil(now / 30) * 30, 7 * 60) })
          }}
        >
          <Plus size={18} /> {t('New booking', 'Rezervare nouă')}
        </button>
      </div>

      {v.status === 'review' && (
        <div className="note amber" style={{ marginBottom: 14 }}>
          <CircleAlert size={20} style={{ flex: 'none' }} />
          <span>
            {t('Your venue is under review. Fill the schedule with your existing bookings; players see nothing until review ends.', 'Baza ta e în verificare. Completează programul cu rezervările existente; jucătorii nu văd nimic până la final.')}
          </span>
        </div>
      )}
      {v.status === 'paused' && (
        <div className="note amber" style={{ marginBottom: 14 }}>
          <CircleAlert size={20} style={{ flex: 'none' }} />
          <span>
            {t('Paused: hidden from players', 'În pauză: ascunsă jucătorilor')} {v.pausedFrom} – {v.pausedTo}.{' '}
            <button className="link" onClick={() => nav('/console/settings/profile')}>
              {t('Resume', 'Reia')}
            </button>
          </span>
        </div>
      )}

      {view === 'day' && (
        <div className="kpis">
          <button className="kpi" onClick={() => nav(`/console/bookings?range=day&d=${date}`)}>
            <b>
              {Math.round(bookedH * 10) / 10} {t('of', 'din')} {totalH} h
            </b>
            <span>
              {t('booked', 'rezervate')} {date === today ? t('today', 'azi') : ''} · {totalH ? Math.round((bookedH / totalH) * 100) : 0}%
            </span>
          </button>
          <button className="kpi" onClick={() => nav('/console/money')}>
            <b>{fmtMoney(revenue)}</b>
            <span>
              {date === today ? t('today', 'azi') : fmtDate(lang, date)} · {fmtMoney(online).replace(' lei', '')} online
            </span>
          </button>
          <button className="kpi" onClick={() => setArrivals(true)}>
            <b>{arriving.filter((b) => b.status === 'booked').length}</b>
            <span>{t('arriving in the next hour', 'sosesc în următoarea oră')}</span>
          </button>
          <button className="kpi" onClick={() => nav('/console/bookings?open=1')}>
            <b>{openGames.length}</b>
            <span>{t('open games with free spots', 'meciuri deschise cu locuri libere')}</span>
          </button>
        </div>
      )}

      <div className="legend">
        {legend.map((l) => (
          <button key={l.k} className={cx(hidden.includes(l.k) && 'off')} onClick={() => setHidden(hidden.includes(l.k) ? hidden.filter((x) => x !== l.k) : [...hidden, l.k])}>
            {l.sw} {l.label}
          </button>
        ))}
      </div>

      {moving && (
        <div className="movebar">
          <span className="grow">
            {t('Tap an empty slot to move', 'Atinge un interval liber pentru a muta')} <b>{s.bookings.find((b) => b.id === moving)?.name}</b>
          </span>
          <button className="btn sm" style={{ background: '#fff', color: 'var(--ink)' }} onClick={() => setMoving(null)}>
            {t('Cancel', 'Renunță')}
          </button>
        </div>
      )}

      {view === 'week' && (
        <div className="chips" style={{ marginBottom: 12 }}>
          {[{ id: 'all', name: t('All courts', 'Toate terenurile') }, ...v.courts.map((c) => ({ id: c.id, name: courtName(t, c.name) }))].map((c) => (
            <button key={c.id} className={cx('chip sm', weekCourt === c.id && 'on')} onClick={() => setWeekCourt(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {view === 'day' ? (
        <DayGrid
          v={v}
          date={date}
          hidden={hidden}
          sel={sel}
          draft={draft}
          moving={moving}
          onPick={(id, b) => {
            setDraft(null)
            if (b.kind === 'block') {
              setSel(null)
              setBlock({ editId: b.id, courtIds: [b.courtId], date: b.date, from: b.start, to: b.start + b.dur })
            } else {
              setBlock(null)
              setSel(id)
            }
          }}
          onEmpty={(c, start) => openSlot(c, date, start)}
          onContext={(c, start, kind) => {
            if (kind === 'block') {
              setDraft(null)
              setSel(null)
              setBlock({ courtIds: [c], date, from: start, to: start + 60 })
            } else openSlot(c, date, start)
          }}
        />
      ) : (
        <WeekGrid
          v={v}
          start={weekStart}
          courtFilter={weekCourt}
          hidden={hidden}
          onDay={(d) => {
            setDate(d)
            setView('day')
          }}
          onPick={(b) => {
            if (b.kind === 'block') setBlock({ editId: b.id, courtIds: [b.courtId], date: b.date, from: b.start, to: b.start + b.dur })
            else setSel(b.id)
          }}
          onEmpty={(c, d, start) => openSlot(c, d, start)}
        />
      )}

      <BookingSheet id={sel} onClose={() => setSel(null)} onStartMove={(id) => {
        setSel(null)
        setMoving(id)
        if (view === 'week') setView('day')
      }} />
      <NewBookingSheet draft={draft} setDraft={setDraft} onClose={() => { setDraft(null); setPickDraft(false) }} pick={pickDraft} />
      <BlockSheet init={block} onClose={() => setBlock(null)} />
      <Sheet open={arrivals} onClose={() => setArrivals(false)} title={t('Arriving in the next hour', 'Sosesc în următoarea oră')}>
        {arriving.length === 0 && <div className="muted">{t('Nobody is due in the next hour.', 'Nu vine nimeni în următoarea oră.')}</div>}
        <div className="list">
          {arriving.map((b) => (
            <div key={b.id} className="mrow">
              <Avatar name={b.name} />
              <div className="grow">
                <b>{b.name}</b>
                <div className="muted small">
                  {hm(b.start)} · {courtName(t, court(v, b.courtId).name)} · {payLabel(t, b)}
                </div>
              </div>
              {b.status === 'checkedin' ? (
                <span className="badge">
                  <Check size={14} /> {t('Checked in', 'Prezent')}
                </span>
              ) : (
                <button
                  className="btn primary sm"
                  onClick={() => {
                    patchBooking(b.id, { status: 'checkedin', checkedInAt: Date.now() })
                    toast(`${b.name} ${t('checked in', 'marcat prezent')}`)
                  }}
                >
                  {t('Check in', 'Prezent')}
                </button>
              )}
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

function useRowH() {
  const [h, setH] = useState(window.innerWidth < 900 ? 46 : 52)
  useEffect(() => {
    const r = () => setH(window.innerWidth < 900 ? 46 : 52)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])
  return h
}

function BookingBlock({ b, top, height, sel, compact, onClick }: { b: Booking; top: number; height: number; sel?: boolean; compact?: boolean; onClick: () => void }) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const g = b.gameId ? gameOf(s, b.gameId) : undefined
  const k = kindsOf(s, b)
  const cls = k.includes('block') ? 'block' : k.includes('app') ? 'app' : 'desk'
  const title = g ? `${b.name.split(' ')[0]} · ${g.format === 'doubles' ? t('Doubles', 'Dublu') : g.format === 'singles' ? t('Singles', 'Simplu') : t('Open game', 'Meci')}` : b.name
  const sub = b.kind === 'block' ? b.note || '' : g && k.includes('open') ? `${g.size - g.players.length} ${t('spots open', 'locuri libere')}` : b.seriesId ? (b.pay === 'venue' || b.pay === 'unpaid' ? `${t('Abonament', 'Abonament')} · ${dayShort(lang, (parseISO(b.date).getDay() + 6) % 7)}` : '') : payLabel(t, b)
  return (
    <button
      className={cx('bk', cls, b.status === 'noshow' && 'noshow', sel && 'sel', compact && 'compact')}
      style={{ top: top + 2, height: Math.max(height - 4, 18) }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <b>
        {b.status === 'checkedin' && <Check size={12} style={{ verticalAlign: -1, marginRight: 3 }} />}
        {title}
      </b>
      {!compact && (
        <span className="row" style={{ gap: 5 }}>
          {g && k.includes('open') && <span className="dot" style={{ width: 7, height: 7 }} />}
          {b.status === 'noshow' ? t('No-show', 'Neprezentat') : sub}
          {b.seriesId && <Repeat size={11} />}
        </span>
      )}
    </button>
  )
}

function DayGrid({
  v,
  date,
  hidden,
  sel,
  draft,
  moving,
  onPick,
  onEmpty,
  onContext,
}: {
  v: Venue
  date: string
  hidden: Kind[]
  sel: string | null
  draft: Draft | null
  moving: string | null
  onPick: (id: string, b: Booking) => void
  onEmpty: (courtId: string, start: number) => void
  onContext: (courtId: string, start: number, kind: 'booking' | 'block') => void
}) {
  const s = useDemo()
  const t = useT()
  const H = useRowH()
  const range = hoursRange(v)
  const hrs = closedFor(v, date)
  const hours = Array.from({ length: (range.to - range.from) / 60 }, (_, i) => range.from + i * 60)
  const total = ((range.to - range.from) / 60) * H
  const y = (min: number) => ((min - range.from) / 60) * H
  const bookings = dayBookings(s, v, date).filter((b) => !kindsOf(s, b).some((k) => hidden.includes(k)))
  const today = todayISO()
  const now = nowMin()
  const wrap = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; c: string; m: number } | null>(null)
  const press = useRef<number | null>(null)
  useEffect(() => {
    if (wrap.current && date === today) wrap.current.scrollTop = Math.max(0, y(now) - 160)
  }, [date]) // eslint-disable-line react-hooks/exhaustive-deps
  const minAt = (e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const cy = 'touches' in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY
    return range.from + Math.floor(((cy - r.top) / H) * 2) * 30
  }
  return (
    <div className="grid-wrap" ref={wrap} onClick={() => setMenu(null)}>
      <div className="grid" style={{ gridTemplateColumns: `56px repeat(${v.courts.length}, minmax(150px, 1fr))` }}>
        <div className="gh corner" />
        {v.courts.map((c) => (
          <div key={c.id} className="gh">
            <b>{courtName(t, c.name)}</b>
            <div className="muted tiny" style={{ textTransform: 'capitalize' }}>
              {c.indoor ? t('Indoor', 'Interior') + ' ' : ''}
              {surfaceName(t, c.surface)}
              {!c.bookable && ` · ${t('not in app', 'nu apare în app')}`}
            </div>
          </div>
        ))}
        <div className="times" style={{ height: total, position: 'sticky' }}>
          {hours.map((h) => (
            <div key={h} style={{ position: 'absolute', top: y(h), right: 0, left: 0 }}>
              {h > range.from ? hm(h) : ''}
            </div>
          ))}
          {date === today && now >= range.from && now <= range.to && (
            <span className="nowtag" style={{ top: y(now) }}>
              {hm(now)}
            </span>
          )}
        </div>
        {v.courts.map((c) => (
          <div
            key={c.id}
            className="colbody"
            style={{ height: total }}
            onClick={(e) => {
              const m = minAt(e, e.currentTarget)
              onEmpty(c.id, m)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              const r = wrap.current!.getBoundingClientRect()
              setMenu({ x: e.clientX - r.left + wrap.current!.scrollLeft, y: e.clientY - r.top + wrap.current!.scrollTop, c: c.id, m: minAt(e, e.currentTarget) })
            }}
            onTouchStart={(e) => {
              const el = e.currentTarget
              const ev = { touches: [{ clientY: e.touches[0].clientY }] } as unknown as React.TouchEvent
              const cx0 = e.touches[0].clientX
              const cy0 = e.touches[0].clientY
              press.current = window.setTimeout(() => {
                const r = wrap.current!.getBoundingClientRect()
                setMenu({ x: cx0 - r.left + wrap.current!.scrollLeft, y: cy0 - r.top + wrap.current!.scrollTop, c: c.id, m: minAt(ev, el) })
              }, 550)
            }}
            onTouchEnd={() => press.current && clearTimeout(press.current)}
            onTouchMove={() => press.current && clearTimeout(press.current)}
          >
            {hours.map((h) => (
              <div key={h} className="hourline" style={{ top: y(h) }} />
            ))}
            {!hrs ? (
              <div className="closed-band" style={{ top: 0, height: total }} />
            ) : (
              <>
                {hrs.from > range.from && <div className="closed-band" style={{ top: 0, height: y(hrs.from) }} />}
                {hrs.to < range.to && <div className="closed-band" style={{ top: y(hrs.to), height: total - y(hrs.to) }} />}
              </>
            )}
            {bookings
              .filter((b) => b.courtId === c.id)
              .map((b) => (
                <BookingBlock key={b.id} b={b} top={y(b.start)} height={(b.dur / 60) * H} sel={sel === b.id || moving === b.id} onClick={() => onPick(b.id, b)} />
              ))}
            {draft && draft.courtId === c.id && draft.date === date && (
              <div className="bk draft" style={{ top: y(draft.start) + 2, height: H - 4 }}>
                <b>
                  {hm(draft.start)} · 60 min
                </b>
                {t('New booking', 'Rezervare nouă')}
              </div>
            )}
            {date === today && now >= range.from && now <= range.to && <div className="nowline" style={{ top: y(now) }} />}
          </div>
        ))}
      </div>
      {menu && (
        <div className="popover" style={{ top: menu.y, left: Math.min(menu.x, (wrap.current?.scrollWidth ?? 400) - 250) }} onClick={(e) => e.stopPropagation()}>
          <div className="tiny muted" style={{ padding: '6px 14px' }}>
            {courtName(t, court(v, menu.c).name)} · {hm(menu.m)}
          </div>
          <button
            className="pop-item"
            onClick={() => {
              onContext(menu.c, menu.m, 'booking')
              setMenu(null)
            }}
          >
            <Plus size={18} /> {t('New booking', 'Rezervare nouă')}
          </button>
          <button
            className="pop-item"
            onClick={() => {
              onContext(menu.c, menu.m, 'block')
              setMenu(null)
            }}
          >
            <Ban size={18} /> {t('Block time', 'Blochează timp')}
          </button>
        </div>
      )}
    </div>
  )
}

function WeekGrid({
  v,
  start,
  courtFilter,
  hidden,
  onDay,
  onPick,
  onEmpty,
}: {
  v: Venue
  start: string
  courtFilter: string
  hidden: Kind[]
  onDay: (d: string) => void
  onPick: (b: Booking) => void
  onEmpty: (courtId: string, d: string, start: number) => void
}) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const H = 34
  const range = hoursRange(v)
  const hours = Array.from({ length: (range.to - range.from) / 60 }, (_, i) => range.from + i * 60)
  const total = hours.length * H
  const y = (min: number) => ((min - range.from) / 60) * H
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const courts = courtFilter === 'all' ? v.courts : v.courts.filter((c) => c.id === courtFilter)
  const today = todayISO()
  return (
    <div className="grid-wrap">
      <div className="grid" style={{ gridTemplateColumns: `56px repeat(7, minmax(${courts.length > 1 ? 120 : 100}px, 1fr))` }}>
        <div className="gh corner" />
        {days.map((d) => {
          const bs = dayBookings(s, v, d).filter((b) => b.kind === 'booking')
          return (
            <button key={d} className="gh" style={{ textAlign: 'left', background: d === today ? 'var(--green-softer)' : '#fff' }} onClick={() => onDay(d)}>
              <b>{fmtDate(lang, d)}</b>
              <div className="muted tiny">
                {bs.length} {t('bookings', 'rezervări')} · {fmtMoney(bs.reduce((a, b) => a + b.price, 0))}
              </div>
            </button>
          )
        })}
        <div className="times" style={{ height: total }}>
          {hours.map((h) => (
            <div key={h} style={{ position: 'absolute', top: y(h), right: 0, left: 0 }}>
              {h > range.from ? hm(h) : ''}
            </div>
          ))}
        </div>
        {days.map((d) => {
          const bs = dayBookings(s, v, d).filter((b) => courts.some((c) => c.id === b.courtId) && !kindsOf(s, b).some((k) => hidden.includes(k)))
          return (
            <div
              key={d}
              className="colbody"
              style={{ height: total }}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                const idx = Math.min(courts.length - 1, Math.floor(((e.clientX - r.left) / r.width) * courts.length))
                const m = range.from + Math.floor(((e.clientY - r.top) / H) * 2) * 30
                onEmpty(courts[idx].id, d, m)
              }}
            >
              {hours.map((h) => (
                <div key={h} className="hourline" style={{ top: y(h) }} />
              ))}
              {bs.map((b) => {
                const idx = courts.findIndex((c) => c.id === b.courtId)
                const w = 100 / courts.length
                return (
                  <div key={b.id} style={{ position: 'absolute', top: 0, bottom: 0, left: `${idx * w}%`, width: `${w}%`, pointerEvents: 'none' }}>
                    <div style={{ pointerEvents: 'auto' }}>
                      <BookingBlock b={b} top={y(b.start)} height={(b.dur / 60) * H} compact onClick={() => onPick(b)} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { venue }

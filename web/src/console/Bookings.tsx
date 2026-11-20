import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus, Repeat, Search, ChevronRight, X } from 'lucide-react'
import { useDemo, update, court, slotFree, priceFor, uid, gameOf } from '../lib/store'
import { fmtDate, fmtMoney, dayLong, useLang, useT } from '../lib/i18n'
import { addDays, hm, mondayOf, todayISO, weekday, nowMin } from '../lib/time'
import type { Booking, Series } from '../lib/types'
import { Chips, Confirm, Field, Sheet, Empty, courtName, cx, toast } from '../ui'
import { BookingSheet, NewBookingSheet, TIMES, type Draft } from './sheets'
import { StatusBadge, payLabel, useVenue, reasonLabel } from './util'

type Tab = 'upcoming' | 'past' | 'cancelled' | 'recurring'

export function Bookings() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const [q] = useSearchParams()
  const v = useVenue()
  const today = todayISO()
  const [tab, setTab] = useState<Tab>((q.get('tab') as Tab) ?? 'upcoming')
  const [range, setRange] = useState<string>(q.get('range') === 'day' ? 'day' : 'all')
  const [day] = useState(q.get('d') ?? today)
  const [courtF, setCourtF] = useState('all')
  const [source, setSource] = useState('all')
  const [pay, setPay] = useState(q.get('pay') ?? 'all')
  const [openOnly, setOpenOnly] = useState(q.get('open') === '1')
  const [search, setSearch] = useState(q.get('q') ?? '')
  const [sel, setSel] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [exp, setExp] = useState(false)
  const [expRange, setExpRange] = useState('month')
  const [expFmt, setExpFmt] = useState('csv')
  const now = nowMin()

  const list = useMemo(() => {
    let l = s.bookings.filter((b) => b.venueId === v.id && b.kind === 'booking')
    const isPast = (b: Booking) => b.date < today || (b.date === today && b.start + b.dur <= now)
    if (tab === 'upcoming') l = l.filter((b) => b.status !== 'cancelled' && !isPast(b))
    if (tab === 'past') l = l.filter((b) => b.status !== 'cancelled' && isPast(b))
    if (tab === 'cancelled') l = l.filter((b) => b.status === 'cancelled')
    if (range === 'day') l = l.filter((b) => b.date === day)
    if (range === 'today') l = l.filter((b) => b.date === today)
    if (range === 'week') {
      const m = mondayOf(today)
      l = l.filter((b) => b.date >= m && b.date <= addDays(m, 6))
    }
    if (range === 'month') l = l.filter((b) => b.date.slice(0, 7) === today.slice(0, 7))
    if (courtF !== 'all') l = l.filter((b) => b.courtId === courtF)
    if (source !== 'all') l = l.filter((b) => b.source === source)
    if (pay !== 'all') l = l.filter((b) => b.pay === pay)
    if (openOnly) l = l.filter((b) => b.gameId && (gameOf(s, b.gameId)?.players.length ?? 9) < (gameOf(s, b.gameId)?.size ?? 0))
    const qq = search.trim().toLowerCase()
    if (qq) l = l.filter((b) => b.name.toLowerCase().includes(qq) || (b.phone ?? '').replace(/\s/g, '').includes(qq.replace(/\s/g, '')))
    l.sort((a, b) => (tab === 'upcoming' ? (a.date + hm(a.start)).localeCompare(b.date + hm(b.start)) : (b.date + hm(b.start)).localeCompare(a.date + hm(a.start))))
    return l
  }, [s, v.id, tab, range, day, courtF, source, pay, openOnly, search, today, now])

  const unpaid = list.filter((b) => b.pay === 'unpaid')
  const filtered = range !== 'all' || courtF !== 'all' || source !== 'all' || pay !== 'all' || openOnly || search
  const clear = () => {
    setRange('all')
    setCourtF('all')
    setSource('all')
    setPay('all')
    setOpenOnly(false)
    setSearch('')
  }

  return (
    <div>
      <div className="c-head">
        <h1 className="c-title">{t('Bookings', 'Rezervări')}</h1>
        <div className="spacer" />
        <button className="btn outline sm" onClick={() => setExp(true)}>
          <Download size={16} /> {t('Export', 'Exportă')}
        </button>
        <button className="btn primary sm" onClick={() => setDraft({ courtId: v.courts[0].id, date: today, start: Math.max(Math.ceil(now / 30) * 30, 8 * 60) })}>
          <Plus size={18} /> {t('New booking', 'Rezervare nouă')}
        </button>
      </div>
      <div className="tabs">
        {(
          [
            ['upcoming', t('Upcoming', 'Viitoare')],
            ['past', t('Past', 'Trecute')],
            ['cancelled', t('Cancelled', 'Anulate')],
            ['recurring', t('Recurring', 'Recurente')],
          ] as [Tab, string][]
        ).map(([k, l]) => (
          <button key={k} className={cx(tab === k && 'on')} onClick={() => setTab(k)}>
            {k === 'recurring' && <Repeat size={14} style={{ verticalAlign: -2, marginRight: 4 }} />}
            {l}
          </button>
        ))}
      </div>
      {tab === 'recurring' ? (
        <Recurring />
      ) : (
        <>
          <div className="filters" style={{ marginBottom: 14 }}>
            <div className="row" style={{ gap: 6, background: '#fff', border: '1.5px solid var(--line)', borderRadius: 999, padding: '0 12px', height: 38 }}>
              <Search size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Name or phone', 'Nume sau telefon')} style={{ border: 0, outline: 'none', width: 130, fontSize: 14, background: 'none' }} />
            </div>
            <select className="select-sm" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="all">{t('Any date', 'Orice dată')}</option>
              {range === 'day' && <option value="day">{fmtDate(lang, day)}</option>}
              <option value="today">{t('Today', 'Azi')}</option>
              <option value="week">{t('This week', 'Săptămâna aceasta')}</option>
              <option value="month">{t('This month', 'Luna aceasta')}</option>
            </select>
            <select className="select-sm" value={courtF} onChange={(e) => setCourtF(e.target.value)}>
              <option value="all">{t('All courts', 'Toate terenurile')}</option>
              {v.courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {courtName(t, c.name)}
                </option>
              ))}
            </select>
            <select className="select-sm" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="all">{t('Any source', 'Orice sursă')}</option>
              <option value="app">{t('Booked in the app', 'Din aplicație')}</option>
              <option value="desk">{t('Added by you', 'Adăugate de tine')}</option>
            </select>
            <select className="select-sm" value={pay} onChange={(e) => setPay(e.target.value)}>
              <option value="all">{t('Any payment', 'Orice plată')}</option>
              <option value="online">{t('Paid online', 'Plătit online')}</option>
              <option value="venue">{t('Paid at venue', 'Plătit la bază')}</option>
              <option value="unpaid">{t('Unpaid', 'Neplătit')}</option>
            </select>
            <button className={cx('chip sm', openOnly && 'on')} onClick={() => setOpenOnly(!openOnly)}>
              {t('Open games only', 'Doar meciuri deschise')}
            </button>
            {filtered && (
              <button className="link small" onClick={clear}>
                {t('Clear', 'Șterge filtrele')}
              </button>
            )}
          </div>
          <div className="row small" style={{ marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
            <b>
              {list.length} {t('bookings', 'rezervări')}
            </b>
            {unpaid.length > 0 && tab !== 'cancelled' && (
              <>
                · <span>{unpaid.length} {t('unpaid', 'neplătite')}</span> ·{' '}
                <button className="link" onClick={() => setPay('unpaid')}>
                  {fmtMoney(unpaid.reduce((a, b) => a + b.price, 0))} {t('to collect', 'de încasat')}
                </button>
              </>
            )}
          </div>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            {list.length === 0 ? (
              <Empty title={t('No bookings match these filters', 'Nicio rezervare nu se potrivește filtrelor')} action={filtered ? <button className="btn outline sm" onClick={clear}>{t('Clear filters', 'Șterge filtrele')}</button> : undefined} />
            ) : (
              <>
                <table className="table responsive">
                  <thead>
                    <tr>
                      <th>{t('When', 'Când')}</th>
                      <th>{t('Court', 'Teren')}</th>
                      <th>{t('Who', 'Cine')}</th>
                      <th>{t('Source', 'Sursă')}</th>
                      <th>{t('Payment', 'Plată')}</th>
                      <th style={{ textAlign: 'right' }}>{t('Amount', 'Sumă')}</th>
                      <th>{t('Status', 'Stare')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.slice(0, 120).map((b) => {
                      const g = b.gameId ? gameOf(s, b.gameId) : undefined
                      return (
                        <tr key={b.id} className="click" onClick={() => setSel(b.id)}>
                          <td>
                            <b>{fmtDate(lang, b.date)}</b> <span className="muted">{hm(b.start)}–{hm(b.start + b.dur)}</span>
                          </td>
                          <td>{courtName(t, court(v, b.courtId).name)}</td>
                          <td>
                            {b.name}
                            {b.seriesId && <Repeat size={12} style={{ marginLeft: 6, verticalAlign: -1 }} />}
                          </td>
                          <td className="muted">{b.source === 'app' ? t('App', 'Aplicație') : t('Added by you', 'Adăugat de tine')}</td>
                          <td>
                            <span className={cx('badge', b.pay === 'unpaid' ? 'amber' : b.pay === 'online' ? '' : 'outline')}>
                              {b.pay === 'online' ? t('Online', 'Online') : b.pay === 'venue' ? t('At venue', 'La bază') : t('Unpaid', 'Neplătit')}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>{fmtMoney(b.price)}</td>
                          <td>
                            {g ? (
                              <span className="badge outline">
                                <span className="dot" /> {g.players.length}/{g.size}
                              </span>
                            ) : (
                              <StatusBadge t={t} b={b} />
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="mcard" style={{ padding: '0 16px' }}>
                  {list.slice(0, 80).map((b) => (
                    <button key={b.id} className="mrow" onClick={() => setSel(b.id)}>
                      <div className="grow">
                        <b>{b.name}</b>
                        <div className="muted small">
                          {fmtDate(lang, b.date)} {hm(b.start)} · {courtName(t, court(v, b.courtId).name)} · {payLabel(t, b)}
                        </div>
                      </div>
                      <b>{fmtMoney(b.price)}</b>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
                {list.length > 120 && <div className="muted small center" style={{ padding: 12 }}>{t('Showing the first 120 · narrow the filters to see more', 'Se afișează primele 120 · restrânge filtrele ca să vezi mai multe')}</div>}
              </>
            )}
          </div>
        </>
      )}
      <BookingSheet id={sel} onClose={() => setSel(null)} />
      <NewBookingSheet draft={draft} setDraft={setDraft} onClose={() => setDraft(null)} pick />
      <Sheet
        open={exp}
        onClose={() => setExp(false)}
        title={t('Export bookings', 'Exportă rezervările')}
        footer={
          <button
            className="btn primary block lg"
            onClick={() => {
              setExp(false)
              toast(`${t('Saved', 'Salvat')} bookings-${expRange === 'month' ? today.slice(0, 7) : today}.${expFmt}`)
            }}
          >
            <Download size={18} /> {t('Download', 'Descarcă')}
          </button>
        }
      >
        <Field label={t('Range', 'Interval')}>
          <Chips
            options={[
              { v: 'today', label: t('Today', 'Azi') },
              { v: 'week', label: t('This week', 'Săptămâna aceasta') },
              { v: 'month', label: t('This month', 'Luna aceasta') },
            ]}
            value={expRange}
            onChange={setExpRange}
            size="sm"
          />
        </Field>
        <Field label={t('Format', 'Format')}>
          <Chips
            options={[
              { v: 'csv', label: 'CSV (Excel)' },
              { v: 'pdf', label: 'PDF' },
            ]}
            value={expFmt}
            onChange={setExpFmt}
            size="sm"
          />
        </Field>
      </Sheet>
    </div>
  )
}

function Recurring() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const v = useVenue()
  const today = todayISO()
  const series = s.series.filter((x) => x.venueId === v.id && (!x.end || x.end >= today))
  const [sel, setSel] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const cur = series.find((x) => x.id === sel)
  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="muted grow small">{t('Regular customers (abonamente) and weekly blocks such as club training.', 'Clienți fideli (abonamente) și blocări săptămânale, de exemplu antrenamente.')}</span>
        <button className="btn primary sm" onClick={() => setCreating(true)}>
          <Plus size={18} /> {t('New recurring booking', 'Rezervare recurentă nouă')}
        </button>
      </div>
      <div className="panel" style={{ padding: '4px 18px' }}>
        {series.length === 0 && <Empty title={t('No recurring bookings yet', 'Încă nu ai rezervări recurente')} />}
        {series.map((x) => (
          <button key={x.id} className="mrow" onClick={() => setSel(x.id)}>
            <span className="avatar" style={{ background: x.kind === 'block' ? '#eef1ee' : 'var(--green-soft)' }}>
              <Repeat size={18} />
            </span>
            <div className="grow">
              <b>{x.name}</b>
              <div className="muted small">
                {t('Every', 'În fiecare')} {dayLong(lang, x.weekday).toLowerCase()} · {hm(x.start)}–{hm(x.start + x.dur)} · {courtName(t, court(v, x.courtId).name)}
              </div>
            </div>
            <span className={cx('badge', x.kind === 'block' ? 'gray' : 'outline')}>
              {x.kind === 'block' ? `${t('Block', 'Blocare')} · ${reasonLabel(t, x.reason)}` : x.pay === 'monthly' ? t('Paid monthly at the venue', 'Plătit lunar la bază') : t('Paid per session', 'Plătit pe ședință')}
            </span>
            {x.end && <span className="badge amber">{t('Ends', 'Se termină')} {fmtDate(lang, x.end)}</span>}
            <ChevronRight size={18} />
          </button>
        ))}
      </div>
      {cur && <SeriesSheet x={cur} onClose={() => setSel(null)} />}
      {creating && <NewSeriesSheet onClose={() => setCreating(false)} />}
    </>
  )
}

function SeriesSheet({ x, onClose }: { x: Series; onClose: () => void }) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const v = useVenue()
  const today = todayISO()
  const [pick, setPick] = useState<Booking | null>(null)
  const [end, setEnd] = useState(false)
  const [edit, setEdit] = useState(false)
  const [ed, setEd] = useState({ start: x.start, dur: x.dur, courtId: x.courtId })
  const next = s.bookings.filter((b) => b.seriesId === x.id && b.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = next.slice(0, 8)
  const endAfter = upcoming[Math.min(1, upcoming.length - 1)]?.date
  return (
    <>
      <Sheet open onClose={onClose} variant="side" title={x.name} footer={<><button className="btn outline grow" onClick={() => setEdit(true)}>{t('Edit series', 'Editează seria')}</button><button className="btn danger-outline grow" onClick={() => setEnd(true)}>{t('End series', 'Încheie seria')}</button></>}>
        <div className="muted">
          {t('Every', 'În fiecare')} {dayLong(lang, x.weekday).toLowerCase()} · {hm(x.start)}–{hm(x.start + x.dur)} · {courtName(t, court(v, x.courtId).name)}
        </div>
        <Field label={t('Next dates · tap one to skip or open it', 'Următoarele date · atinge una ca s-o sari sau s-o deschizi')}>
          <div className="chips">
            {upcoming.map((b) => (
              <button key={b.id} className={cx('chip sm', b.status === 'cancelled' && 'off')} style={b.status === 'cancelled' ? { textDecoration: 'line-through', opacity: 0.5 } : undefined} onClick={() => setPick(b)}>
                {fmtDate(lang, b.date)}
              </button>
            ))}
            {upcoming.length === 0 && <span className="muted">{t('No upcoming dates.', 'Nicio dată viitoare.')}</span>}
          </div>
        </Field>
        {x.kind === 'booking' && (
          <div className="note plain">
            {x.pay === 'monthly' ? t('Paid monthly at the venue. Mark each month paid from Bookings.', 'Plătit lunar la bază. Marchează fiecare lună plătită din Rezervări.') : t('Paid per session at the venue.', 'Plătit pe ședință, la bază.')}
          </div>
        )}
      </Sheet>
      <Sheet
        open={!!pick}
        onClose={() => setPick(null)}
        title={pick ? fmtDate(lang, pick.date) : ''}
        footer={
          <>
            {pick?.status === 'cancelled' ? (
              <button
                className="btn primary grow"
                onClick={() => {
                  update((d) => {
                    const b = d.bookings.find((y) => y.id === pick!.id)!
                    b.status = 'booked'
                  })
                  setPick(null)
                  toast(t('Date restored', 'Data a fost refăcută'))
                }}
              >
                {t('Restore this date', 'Refă această dată')}
              </button>
            ) : (
              <button
                className="btn outline grow"
                onClick={() => {
                  update((d) => {
                    const b = d.bookings.find((y) => y.id === pick!.id)!
                    b.status = 'cancelled'
                    b.cancelledBy = 'venue'
                    b.cancelReason = 'Skipped'
                  })
                  setPick(null)
                  toast(t('Date skipped · the court is free that day', 'Dată sărită · terenul e liber în acea zi'))
                }}
              >
                {t('Skip this date', 'Sari peste această dată')}
              </button>
            )}
          </>
        }
      >
        <div className="muted">
          {x.name} · {hm(x.start)}–{hm(x.start + x.dur)} · {courtName(t, court(v, x.courtId).name)}
        </div>
      </Sheet>
      <Confirm
        open={end}
        onClose={() => setEnd(false)}
        title={t('End this series?', 'Închei seria?')}
        body={endAfter ? t(`It ends after ${fmtDate(lang, endAfter)}. ${Math.max(0, next.length - 2)} future dates are removed.`, `Se încheie după ${fmtDate(lang, endAfter)}. ${Math.max(0, next.length - 2)} date viitoare se șterg.`) : t('There are no future dates.', 'Nu există date viitoare.')}
        confirm={t('End series', 'Încheie seria')}
        cancel={t('Keep', 'Păstrează')}
        danger
        onConfirm={() => {
          update((d) => {
            const sr = d.series.find((y) => y.id === x.id)!
            sr.end = endAfter ?? today
            d.bookings = d.bookings.filter((b) => !(b.seriesId === x.id && b.date > (endAfter ?? today)))
          })
          onClose()
          toast(t('Series ends after the next date', 'Seria se încheie după următoarea dată'))
        }}
      />
      <Sheet
        open={edit}
        onClose={() => setEdit(false)}
        title={t('Edit series', 'Editează seria')}
        footer={
          <button
            className="btn primary block lg"
            onClick={() => {
              update((d) => {
                const sr = d.series.find((y) => y.id === x.id)!
                Object.assign(sr, ed)
                for (const b of d.bookings) if (b.seriesId === x.id && b.date >= today) Object.assign(b, ed)
              })
              setEdit(false)
              toast(t('Future dates updated', 'Datele viitoare au fost actualizate'))
            }}
          >
            {t('Save · applies to future dates', 'Salvează · pentru datele viitoare')}
          </button>
        }
      >
        <div className="form-grid cols3">
          <Field label={t('Court', 'Teren')}>
            <select className="input" value={ed.courtId} onChange={(e) => setEd({ ...ed, courtId: e.target.value })}>
              {v.courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {courtName(t, c.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Start', 'Început')}>
            <select className="input" value={ed.start} onChange={(e) => setEd({ ...ed, start: Number(e.target.value) })}>
              {TIMES.map((m) => (
                <option key={m} value={m}>
                  {hm(m)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Duration', 'Durată')}>
            <select className="input" value={ed.dur} onChange={(e) => setEd({ ...ed, dur: Number(e.target.value) })}>
              {[60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Sheet>
    </>
  )
}

function NewSeriesSheet({ onClose }: { onClose: () => void }) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const v = useVenue()
  const today = todayISO()
  const [f, setF] = useState({ name: '', courtId: v.courts[0].id, weekday: weekday(today), start: 18 * 60, dur: 60, from: today, weeks: 0, pay: 'monthly' as 'monthly' | 'session' })
  const first = addDays(f.from, (f.weekday - weekday(f.from) + 7) % 7)
  const count = f.weeks || 12
  const dates = Array.from({ length: count }, (_, i) => addDays(first, i * 7))
  const clashes = dates.filter((d) => !slotFree(s, v, f.courtId, d, f.start, f.dur))
  const save = () => {
    if (!f.name.trim()) return toast(t('Add who the booking is for', 'Adaugă pentru cine e rezervarea'))
    const id = uid()
    update((d) => {
      d.series.push({ id, venueId: v.id, courtId: f.courtId, name: f.name, weekday: f.weekday, start: f.start, dur: f.dur, kind: 'booking', pay: f.pay, end: f.weeks ? dates[dates.length - 1] : undefined, skipped: clashes })
      for (const dt of dates) {
        if (clashes.includes(dt)) continue
        d.bookings.push({
          id: uid(),
          venueId: v.id,
          courtId: f.courtId,
          date: dt,
          start: f.start,
          dur: f.dur,
          kind: 'booking',
          source: 'desk',
          name: f.name,
          pay: 'unpaid',
          price: priceFor(v, court(v, f.courtId), dt, f.start, f.dur),
          status: 'booked',
          seriesId: id,
          createdAt: Date.now(),
        })
      }
    })
    toast(t(`Recurring booking saved · ${dates.length - clashes.length} dates`, `Rezervare recurentă salvată · ${dates.length - clashes.length} date`))
    onClose()
  }
  return (
    <Sheet open onClose={onClose} variant="side" title={t('New recurring booking', 'Rezervare recurentă nouă')} footer={<button className="btn primary block lg" onClick={save}>{t('Save', 'Salvează')}</button>}>
      <Field label={t('Who', 'Cine')}>
        <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Fam. Popescu" autoFocus />
      </Field>
      <div className="form-grid cols2">
        <Field label={t('Court', 'Teren')}>
          <select className="input" value={f.courtId} onChange={(e) => setF({ ...f, courtId: e.target.value })}>
            {v.courts.map((c) => (
              <option key={c.id} value={c.id}>
                {courtName(t, c.name)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Day', 'Zi')}>
          <select className="input" value={f.weekday} onChange={(e) => setF({ ...f, weekday: Number(e.target.value) })}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <option key={d} value={d}>
                {dayLong(lang, d)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Start', 'Început')}>
          <select className="input" value={f.start} onChange={(e) => setF({ ...f, start: Number(e.target.value) })}>
            {TIMES.map((m) => (
              <option key={m} value={m}>
                {hm(m)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Duration', 'Durată')}>
          <select className="input" value={f.dur} onChange={(e) => setF({ ...f, dur: Number(e.target.value) })}>
            {[60, 90, 120].map((m) => (
              <option key={m} value={m}>
                {m} min
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Starts', 'Începe')}>
          <input className="input" type="date" value={f.from} min={today} onChange={(e) => setF({ ...f, from: e.target.value })} />
        </Field>
        <Field label={t('Ends', 'Se termină')}>
          <select className="input" value={f.weeks} onChange={(e) => setF({ ...f, weeks: Number(e.target.value) })}>
            <option value={0}>{t('Never', 'Niciodată')}</option>
            <option value={4}>{t('After 4 weeks', 'După 4 săptămâni')}</option>
            <option value={8}>{t('After 8 weeks', 'După 8 săptămâni')}</option>
            <option value={12}>{t('After 12 weeks', 'După 12 săptămâni')}</option>
          </select>
        </Field>
      </div>
      <Field label={t('Payment', 'Plată')}>
        <Chips
          options={[
            { v: 'monthly' as const, label: t('Monthly at the venue', 'Lunar, la bază') },
            { v: 'session' as const, label: t('Per session', 'Pe ședință') },
          ]}
          value={f.pay}
          onChange={(p) => setF({ ...f, pay: p })}
          size="sm"
        />
      </Field>
      {clashes.length > 0 ? (
        <div className="note amber">
          <X size={18} style={{ flex: 'none' }} />
          <div>
            <b>{t('Some dates are already booked and will be skipped:', 'Unele date sunt deja ocupate și vor fi sărite:')}</b>
            <div className="small" style={{ fontWeight: 400 }}>
              {clashes.map((d) => fmtDate(lang, d)).join(', ')}
            </div>
          </div>
        </div>
      ) : (
        <div className="note">{t('All dates are free.', 'Toate datele sunt libere.')}</div>
      )}
    </Sheet>
  )
}

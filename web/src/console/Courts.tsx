import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Eye, Pencil, Clock, Trash2, ImagePlus, X, Lightbulb, Info } from 'lucide-react'
import { useDemo, update, priceFor, uid } from '../lib/store'
import { dayLong, fmtDate, fmtMoney, useLang, useT } from '../lib/i18n'
import { hm, todayISO, nowMin, addDays, weekday } from '../lib/time'
import type { Court, Sport, Surface, VenueSettings } from '../lib/types'
import { Chips, Confirm, Field, Sheet, Toggle, courtName, cx, photoUrl, sportName, surfaceName, toast } from '../ui'
import { reasonLabel, useVenue, venueBookings } from './util'
import { TIMES } from './sheets'

const STOCK = ['clay-1', 'clay-2', 'clay-3', 'hard-1', 'hard-2', 'hard-3', 'football-1', 'football-2', 'basket-1', 'basket-3', 'volley-1', 'volley-2']

export function Courts() {
  const s = useDemo()
  const t = useT()
  const nav = useNavigate()
  const v = useVenue()
  const today = todayISO()
  const [sel, setSel] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [preview, setPreview] = useState(false)
  const st = v.settings
  const blocksToday = venueBookings(s, v).filter((b) => b.kind === 'block' && b.date === today && b.status !== 'cancelled')
  const move = (i: number, d: number) =>
    update((x) => {
      const vv = x.venues.find((y) => y.id === v.id)!
      const j = i + d
      if (j < 0 || j >= vv.courts.length) return
      const [c] = vv.courts.splice(i, 1)
      vv.courts.splice(j, 0, c)
    })
  const hoursSummary = (() => {
    const wk = st.hours[0]
    const we = st.hours[5]
    return `${t('Mon–Fri', 'Lun–Vin')} ${wk.open ? `${hm(wk.from)}–${hm(wk.to)}` : t('closed', 'închis')} · ${t('Sat–Sun', 'Sâm–Dum')} ${we.open ? `${hm(we.from)}–${hm(we.to)}` : t('closed', 'închis')}`
  })()
  return (
    <div>
      <div className="c-head">
        <h1 className="c-title">{t('Courts & prices', 'Terenuri și prețuri')}</h1>
        <div className="spacer" />
        <button className="btn outline sm" onClick={() => setPreview(true)}>
          <Eye size={16} /> {t('See what players see', 'Vezi ce văd jucătorii')}
        </button>
        <button className="btn primary sm" onClick={() => setAdding(true)}>
          <Plus size={18} /> {t('Add court', 'Adaugă teren')}
        </button>
      </div>
      <div className="two-col">
        <div>
          <div className="muted small" style={{ marginBottom: 10 }}>
            {t('Each court is a column in your schedule, in this order.', 'Fiecare teren e o coloană în program, în această ordine.')}
          </div>
          <div className="court-cards">
            {v.courts.map((c, i) => {
              const bl = blocksToday.find((b) => b.courtId === c.id)
              return (
                <div key={c.id} className="court-card">
                  <button className="photo" onClick={() => setSel(c.id)} style={{ display: 'block' }}>
                    <img src={photoUrl(c.photo ?? v.cover)} alt="" />
                  </button>
                  <button style={{ padding: '14px 16px 8px', textAlign: 'left' }} onClick={() => setSel(c.id)}>
                    <div className="row between">
                      <b style={{ fontSize: 17 }}>{courtName(t, c.name)}</b>
                      {!c.bookable ? (
                        <span className="badge gray">{t('Not in the app', 'Nu apare în app')}</span>
                      ) : bl ? (
                        <span className="badge amber">
                          {reasonLabel(t, bl.reason)} {hm(bl.start)}–{hm(bl.start + bl.dur)}
                        </span>
                      ) : (
                        <span className="badge">{t('Open', 'Deschis')}</span>
                      )}
                    </div>
                    <div className="muted small" style={{ marginTop: 4 }}>
                      {sportName(t, c.sport)} · {surfaceName(t, c.surface)} · {c.indoor ? t('indoor', 'interior') : t('outdoor', 'exterior')}
                      {c.lights ? ` · ${t('lights', 'nocturnă')}` : ''}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {c.price != null ? (
                        <>
                          <b>{fmtMoney(c.price)}/h</b> <span className="muted small">{t('own price, all day', 'preț propriu, toată ziua')}</span>
                        </>
                      ) : (
                        <>
                          <b>{fmtMoney(st.base)}/h</b> <span className="muted small">{t('base price', 'preț de bază')}</span>
                        </>
                      )}
                    </div>
                  </button>
                  <div className="row between" style={{ padding: '4px 10px 12px' }}>
                    <div className="row" style={{ gap: 2 }}>
                      <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => move(i, -1)} aria-label={t('Move left', 'Mută la stânga')} disabled={i === 0}>
                        <ChevronLeft size={18} />
                      </button>
                      <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => move(i, 1)} aria-label={t('Move right', 'Mută la dreapta')} disabled={i === v.courts.length - 1}>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <button className="btn ghost sm" onClick={() => setSel(c.id)}>
                      <Pencil size={15} /> {t('Edit', 'Editează')}
                    </button>
                  </div>
                </div>
              )
            })}
            <button className="court-card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 240, border: '1.5px dashed #c9d6c7', background: 'transparent' }} onClick={() => setAdding(true)}>
              <Plus size={28} />
              <b style={{ marginTop: 6 }}>{t('Add court', 'Adaugă teren')}</b>
            </button>
          </div>
        </div>
        <div className="col" style={{ gap: 14 }}>
          <div className="panel col" style={{ gap: 10 }}>
            <h3>{t('Prices', 'Prețuri')}</h3>
            <div className="muted small">
              {t('Base', 'Bază')} {fmtMoney(st.base)}/h
              {st.evening ? ` · ${t('Evening from', 'Seara de la')} ${hm(st.eveningFrom)} ${fmtMoney(st.evening)}/h` : ''}
              {st.weekend ? ` · ${t('Weekend', 'Weekend')} ${fmtMoney(st.weekend)}/h` : ''}
              {v.courts
                .filter((c) => c.price != null)
                .map((c) => ` · ${courtName(t, c.name)} ${fmtMoney(c.price!)}/h ${t('all day', 'toată ziua')}`)
                .join('')}
              {' · '}
              {t('Slot', 'Interval')} {st.slot} min
            </div>
            <button className="btn outline sm" onClick={() => nav('/console/courts/prices')}>
              {t('Edit prices', 'Editează prețurile')}
            </button>
          </div>
          <div className="panel col" style={{ gap: 10 }}>
            <h3>{t('Opening hours', 'Program')}</h3>
            <div className="muted small">{hoursSummary}</div>
            {st.special.length > 0 && (
              <div className="small">
                {st.special.length} {t('special days', 'zile speciale')}
              </div>
            )}
            <button className="btn outline sm" onClick={() => nav('/console/courts/hours')}>
              {t('Edit hours', 'Editează programul')}
            </button>
          </div>
          <div className="panel col" style={{ gap: 8 }}>
            <h3>{t('Closing a court for a day?', 'Închizi un teren pentru o zi?')}</h3>
            <div className="muted small">{t("You don't need to delete it. From the schedule, block the court for rain, maintenance or a private event.", 'Nu trebuie să-l ștergi. Din program, blochează terenul pentru ploaie, mentenanță sau un eveniment privat.')}</div>
            <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/console/today')}>
              {t('Open the schedule', 'Deschide programul')} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      {sel && <CourtSheet id={sel} onClose={() => setSel(null)} />}
      {adding && <CourtSheet onClose={() => setAdding(false)} />}
      <Sheet open={preview} onClose={() => setPreview(false)} title={t('What players see', 'Ce văd jucătorii')}>
        <div className="phone-frame">
          <iframe title="preview" src={`${window.location.pathname}#/app/preview/${v.id}`} />
        </div>
        <div className="muted small center">{t('This is your venue screen in the Courtal app, with your current prices and policies.', 'Acesta e ecranul bazei tale în aplicația Courtal, cu prețurile și regulile actuale.')}</div>
      </Sheet>
    </div>
  )
}

function CourtSheet({ id, onClose }: { id?: string; onClose: () => void }) {
  const s = useDemo()
  const t = useT()
  const v = useVenue()
  const today = todayISO()
  const existing = id ? v.courts.find((c) => c.id === id) : undefined
  const [f, setF] = useState<Court>(
    existing ?? { id: `c_${uid()}`, name: `Court ${v.courts.length + 1}`, sport: v.sports[0] ?? 'tennis', surface: 'clay', indoor: false, lights: true, price: null, bookable: true },
  )
  const [confirmPause, setConfirmPause] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const upcoming = id ? venueBookings(s, v).filter((b) => b.courtId === id && b.kind === 'booking' && b.status === 'booked' && b.date >= today) : []
  const appUpcoming = upcoming.filter((b) => b.source === 'app')
  const save = () => {
    update((d) => {
      const vv = d.venues.find((y) => y.id === v.id)!
      if (existing) Object.assign(vv.courts.find((c) => c.id === id)!, f)
      else {
        vv.courts.push(f)
        if (!vv.sports.includes(f.sport)) vv.sports.push(f.sport)
      }
    })
    toast(existing ? t('Court saved', 'Teren salvat') : t('Court added · it is a new column in your schedule', 'Teren adăugat · e o coloană nouă în program'))
    onClose()
  }
  return (
    <>
      <Sheet
        open
        onClose={onClose}
        variant="side"
        title={existing ? courtName(t, existing.name) : t('Add a court', 'Adaugă un teren')}
        footer={
          <button className="btn primary block lg" onClick={save}>
            {existing ? t('Save', 'Salvează') : t('Add court', 'Adaugă terenul')}
          </button>
        }
      >
        <Field label={t('Name', 'Nume')}>
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label={t('Sport', 'Sport')}>
          <Chips options={(['tennis', 'football', 'basketball', 'volleyball'] as Sport[]).map((x) => ({ v: x, label: sportName(t, x) }))} value={f.sport} onChange={(x) => setF({ ...f, sport: x })} size="sm" />
        </Field>
        <Field label={t('Surface', 'Suprafață')}>
          <Chips options={(['clay', 'hard', 'carpet', 'turf', 'parquet', 'asphalt'] as Surface[]).map((x) => ({ v: x, label: surfaceName(t, x) }))} value={f.surface} onChange={(x) => setF({ ...f, surface: x })} size="sm" />
        </Field>
        <div className="row" style={{ gap: 10 }}>
          <Chips
            options={[
              { v: 'out', label: t('Outdoor', 'Exterior') },
              { v: 'in', label: t('Indoor', 'Interior') },
            ]}
            value={f.indoor ? 'in' : 'out'}
            onChange={(x) => setF({ ...f, indoor: x === 'in' })}
            size="sm"
          />
          <button className={cx('chip sm', f.lights && 'on')} onClick={() => setF({ ...f, lights: !f.lights })}>
            <Lightbulb size={15} /> {t('Has lights', 'Are nocturnă')}
          </button>
        </div>
        <Field label={t('Photo', 'Fotografie')}>
          <div className="row" style={{ gap: 10 }}>
            <div className="photo" style={{ width: 120, height: 80, borderRadius: 14 }}>
              <img src={photoUrl(f.photo ?? v.cover)} alt="" />
            </div>
            <button
              className="btn outline sm"
              onClick={() => {
                const i = STOCK.indexOf(f.photo ?? '')
                setF({ ...f, photo: STOCK[(i + 1) % STOCK.length] })
                toast(t('Photo uploaded', 'Fotografie încărcată'))
              }}
            >
              <ImagePlus size={16} /> {t('Upload photo', 'Încarcă fotografie')}
            </button>
          </div>
        </Field>
        <Field label={t('Price', 'Preț')}>
          <Chips
            options={[
              { v: 'base', label: `${t('Uses the base price', 'Folosește prețul de bază')} · ${fmtMoney(v.settings.base)}/h` },
              { v: 'own', label: t('Own price', 'Preț propriu') },
            ]}
            value={f.price == null ? 'base' : 'own'}
            onChange={(x) => setF({ ...f, price: x === 'base' ? null : f.price ?? v.settings.base + 40 })}
            size="sm"
          />
          {f.price != null && (
            <div className="row" style={{ marginTop: 10 }}>
              <input className="input" type="number" style={{ width: 140 }} value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} />
              <span className="muted">{t('lei / hour, all day', 'lei / oră, toată ziua')}</span>
            </div>
          )}
        </Field>
        {existing && (
          <>
            <div className="row">
              <div className="grow">
                <div className="bold">{t('Bookable in the app', 'Rezervabil în aplicație')}</div>
                <div className="muted small">{t('Off: only you can add bookings on this court', 'Oprit: doar tu poți adăuga rezervări pe acest teren')}</div>
              </div>
              <Toggle on={f.bookable} onChange={(x) => (x ? setF({ ...f, bookable: true }) : setConfirmPause(true))} />
            </div>
            <hr className="divider" />
            <button className="btn danger-outline" onClick={() => setConfirmDel(true)}>
              <Trash2 size={16} /> {t('Delete court', 'Șterge terenul')}
            </button>
          </>
        )}
      </Sheet>
      <Confirm
        open={confirmPause}
        onClose={() => setConfirmPause(false)}
        title={t('Stop showing this court in the app?', 'Oprești afișarea terenului în aplicație?')}
        body={t(`${f.name} stops showing to players. ${appUpcoming.length} upcoming app bookings stay; you can still add bookings yourself.`, `${f.name} nu mai apare jucătorilor. Cele ${appUpcoming.length} rezervări viitoare din aplicație rămân; poți adăuga în continuare rezervări.`)}
        confirm={t('Turn off', 'Oprește')}
        cancel={t('Cancel', 'Renunță')}
        onConfirm={() => setF({ ...f, bookable: false })}
      />
      <Sheet
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title={t('Delete court?', 'Ștergi terenul?')}
        footer={
          upcoming.length ? (
            <button
              className="btn outline block"
              onClick={() => {
                setConfirmDel(false)
                onClose()
                window.location.hash = `#/console/bookings?range=all`
              }}
            >
              {t('View bookings', 'Vezi rezervările')}
            </button>
          ) : (
            <>
              <button className="btn outline grow" onClick={() => setConfirmDel(false)}>
                {t('Keep', 'Păstrează')}
              </button>
              <button
                className="btn danger grow"
                onClick={() => {
                  const removed = existing!
                  update((d) => {
                    const vv = d.venues.find((y) => y.id === v.id)!
                    vv.courts = vv.courts.filter((c) => c.id !== removed.id)
                  })
                  onClose()
                  toast(t('Court deleted', 'Teren șters'), () =>
                    update((d) => {
                      d.venues.find((y) => y.id === v.id)!.courts.push(removed)
                    }),
                  )
                }}
              >
                {t('Delete', 'Șterge')}
              </button>
            </>
          )
        }
      >
        <p className="muted" style={{ fontSize: 16 }}>
          {upcoming.length
            ? t(`${f.name} has ${upcoming.length} upcoming bookings. Move or cancel them first.`, `${f.name} are ${upcoming.length} rezervări viitoare. Mută-le sau anulează-le mai întâi.`)
            : t('The court and its column in the schedule are removed. Past bookings stay in your history.', 'Terenul și coloana lui din program se șterg. Rezervările trecute rămân în istoric.')}
        </p>
      </Sheet>
    </>
  )
}

function useSettingsDraft() {
  const v = useVenue()
  const [d, setD] = useState<VenueSettings>(structuredClone(v.settings))
  const [courts, setCourts] = useState(structuredClone(v.courts))
  const dirty = JSON.stringify({ ...d, history: [] }) !== JSON.stringify({ ...v.settings, history: [] }) || JSON.stringify(courts) !== JSON.stringify(v.courts)
  return { v, d, setD, courts, setCourts, dirty, reset: () => (setD(structuredClone(v.settings)), setCourts(structuredClone(v.courts))) }
}

function SaveBar({ dirty, onDiscard, onSave }: { dirty: boolean; onDiscard: () => void; onSave: () => void }) {
  const t = useT()
  if (!dirty) return null
  return (
    <div className="savebar">
      <span className="grow">{t('Unsaved changes', 'Modificări nesalvate')}</span>
      <button className="btn sm" style={{ color: '#fff' }} onClick={onDiscard}>
        {t('Discard', 'Renunță')}
      </button>
      <button className="btn primary sm" onClick={onSave}>
        {t('Save', 'Salvează')}
      </button>
    </div>
  )
}

export function PriceEditor() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const { v, d, setD, courts, setCourts, dirty, reset } = useSettingsDraft()
  const [confirm, setConfirm] = useState(false)
  const [heatCourt, setHeatCourt] = useState(courts[0]?.id ?? '')
  const [sp, setSp] = useState<null | { from: string; to: string; price: number }>(null)
  const today = todayISO()
  const upcoming = venueBookings(s, v).filter((b) => b.kind === 'booking' && b.status === 'booked' && b.date >= today).length
  const fake = { ...v, settings: d, courts }
  const hc = courts.find((c) => c.id === heatCourt) ?? courts[0]
  const hours = Array.from({ length: 16 }, (_, i) => 7 * 60 + i * 60)
  const monday = addDays(today, -weekday(today))
  const prices = hc ? hours.flatMap((h) => Array.from({ length: 7 }, (_, wd) => priceFor(fake, hc, addDays(monday, wd), h, 60))) : []
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  const shade = (p: number) => (hi === lo ? 'var(--green-soft)' : `rgba(18, 211, 27, ${0.15 + ((p - lo) / (hi - lo)) * 0.6})`)
  const save = () => {
    update((x) => {
      const vv = x.venues.find((y) => y.id === v.id)!
      vv.settings = { ...d, history: [{ who: 'Mihai', at: Date.now(), what: `${t('Prices', 'Prețuri')}: ${t('base', 'bază')} ${d.base} lei/h` }, ...vv.settings.history] }
      vv.courts = courts
    })
    toast(t('Prices saved · applies to new bookings', 'Prețuri salvate · se aplică rezervărilor noi'))
  }
  const num = (k: keyof VenueSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value === '' ? null : Number(e.target.value) })
  return (
    <div>
      <div className="c-head">
        <button className="icon-btn outline" onClick={() => nav('/console/courts')} aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        <h1 className="c-title">{t('Prices', 'Prețuri')}</h1>
      </div>
      <div className="two-col">
        <div className="col" style={{ gap: 14 }}>
          <div className="panel col" style={{ gap: 14 }}>
            <h3>{t('Price per hour', 'Preț pe oră')}</h3>
            <div className="form-grid cols3">
              <Field label={t('Base price', 'Preț de bază')} help={t('Every court, unless it has its own price', 'Toate terenurile, cu excepția celor cu preț propriu')}>
                <input className="input" type="number" value={d.base} onChange={num('base')} />
              </Field>
              <Field label={t('Evening price', 'Preț de seară')} help={t('Leave empty for no evening price', 'Lasă gol pentru fără preț de seară')}>
                <input className="input" type="number" value={d.evening ?? ''} placeholder="—" onChange={num('evening')} />
              </Field>
              <Field label={t('Evening from', 'Seara de la')}>
                <select className="input" value={d.eveningFrom} onChange={(e) => setD({ ...d, eveningFrom: Number(e.target.value) })}>
                  {TIMES.filter((x) => x >= 14 * 60 && x <= 20 * 60 && x % 60 === 0).map((x) => (
                    <option key={x} value={x}>
                      {hm(x)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('Weekend price', 'Preț de weekend')}>
                <input className="input" type="number" value={d.weekend ?? ''} placeholder="—" onChange={num('weekend')} />
              </Field>
            </div>
          </div>
          <div className="panel col" style={{ gap: 10 }}>
            <h3>{t('Per-court prices', 'Prețuri pe teren')}</h3>
            {courts.map((c, i) => (
              <div key={c.id} className="row">
                <span className="grow">{courtName(t, c.name)}</span>
                <Toggle on={c.price != null} onChange={(on) => setCourts(courts.map((x, j) => (j === i ? { ...x, price: on ? d.base + 40 : null } : x)))} />
                {c.price != null ? (
                  <input className="input" style={{ width: 110, height: 42 }} type="number" value={c.price} onChange={(e) => setCourts(courts.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} />
                ) : (
                  <span className="muted small" style={{ width: 110 }}>
                    {t('base rules', 'reguli de bază')}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="panel col" style={{ gap: 10 }}>
            <h3>{t('Slot length', 'Lungimea intervalului')}</h3>
            <div className="muted small">{t('How long one booking lasts by default. Players can book several in a row.', 'Cât durează implicit o rezervare. Jucătorii pot rezerva mai multe la rând.')}</div>
            <Chips options={[30, 60, 90].map((m) => ({ v: m as 30 | 60 | 90, label: `${m} min` }))} value={d.slot} onChange={(m) => setD({ ...d, slot: m })} size="sm" />
          </div>
          <div className="panel col" style={{ gap: 10 }}>
            <div className="row between">
              <h3>{t('Special prices', 'Prețuri speciale')}</h3>
              <button className="btn outline sm" onClick={() => setSp({ from: addDays(today, 30), to: addDays(today, 32), price: d.base + 40 })}>
                <Plus size={16} /> {t('Add special price', 'Adaugă preț special')}
              </button>
            </div>
            {d.specialPrices.length === 0 && <div className="muted small">{t('For holidays or tournaments. Overrides the rules above on those dates.', 'Pentru sărbători sau turnee. Înlocuiește regulile de mai sus în acele zile.')}</div>}
            {d.specialPrices.map((x) => (
              <div key={x.id} className="row">
                <span className="grow">
                  {fmtDate(lang, x.from)} – {fmtDate(lang, x.to)}
                </span>
                <b>{fmtMoney(x.price)}/h</b>
                <button className="icon-btn" onClick={() => setD({ ...d, specialPrices: d.specialPrices.filter((y) => y.id !== x.id) })} aria-label="Remove">
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
          <SaveBar dirty={dirty} onDiscard={reset} onSave={() => setConfirm(true)} />
        </div>
        <div className="panel col" style={{ gap: 12, position: 'sticky', top: 20 }}>
          <h3>{t('Price preview', 'Previzualizare prețuri')}</h3>
          <div className="muted small">{t('What one hour costs, by day and time. Updates as you type.', 'Cât costă o oră, pe zile și ore. Se actualizează pe loc.')}</div>
          <Chips options={courts.map((c) => ({ v: c.id, label: courtName(t, c.name) }))} value={heatCourt} onChange={setHeatCourt} size="sm" />
          <div className="heat" style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}>
            <div />
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="muted">
                {dayLong(lang, i).slice(0, 2)}
              </div>
            ))}
            {hours.map((h, hi2) => (
              <Fragment key={h}>
                <div className="muted" style={{ textAlign: 'right', paddingRight: 4 }}>
                  {hm(h)}
                </div>
                {Array.from({ length: 7 }, (_, wd) => {
                  const p = prices[hi2 * 7 + wd]
                  const closed = !d.hours[wd].open || h < d.hours[wd].from || h >= d.hours[wd].to
                  return (
                    <div key={`${h}-${wd}`} style={{ background: closed ? '#f1f3f1' : shade(p), color: closed ? 'var(--ink-3)' : 'var(--ink)' }}>
                      {closed ? '·' : p}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
          <div className="tiny muted">{t('lei per hour · grey = closed', 'lei pe oră · gri = închis')}</div>
        </div>
      </div>
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('Save new prices?', 'Salvezi prețurile noi?')}
        body={t(`Applies to new bookings. ${upcoming} upcoming bookings keep the price they were booked at.`, `Se aplică rezervărilor noi. Cele ${upcoming} rezervări viitoare își păstrează prețul.`)}
        confirm={t('Save', 'Salvează')}
        cancel={t('Cancel', 'Renunță')}
        onConfirm={save}
      />
      <Sheet
        open={!!sp}
        onClose={() => setSp(null)}
        title={t('Special price', 'Preț special')}
        footer={
          <button
            className="btn primary block lg"
            onClick={() => {
              setD({ ...d, specialPrices: [...d.specialPrices, { id: uid(), ...sp! }] })
              setSp(null)
            }}
          >
            {t('Add', 'Adaugă')}
          </button>
        }
      >
        {sp && (
          <div className="form-grid cols3">
            <Field label={t('From', 'De la')}>
              <input className="input" type="date" value={sp.from} onChange={(e) => setSp({ ...sp, from: e.target.value })} />
            </Field>
            <Field label={t('To', 'Până la')}>
              <input className="input" type="date" value={sp.to} onChange={(e) => setSp({ ...sp, to: e.target.value })} />
            </Field>
            <Field label={t('lei / hour', 'lei / oră')}>
              <input className="input" type="number" value={sp.price} onChange={(e) => setSp({ ...sp, price: Number(e.target.value) })} />
            </Field>
          </div>
        )}
      </Sheet>
    </div>
  )
}

export function HoursEditor() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const { v, d, setD, dirty, reset } = useSettingsDraft()
  const [sd, setSd] = useState<null | { date: string; closed: boolean; from: number; to: number }>(null)
  const today = todayISO()
  void nowMin
  const outside = venueBookings(s, v).filter((b) => {
    if (b.kind !== 'booking' || b.status !== 'booked' || b.date < today) return false
    const sp = d.special.find((x) => x.date === b.date)
    const h = sp ? { open: !sp.closed, from: sp.from, to: sp.to } : d.hours[weekday(b.date)]
    return !h.open || b.start < h.from || b.start + b.dur > h.to
  })
  const save = () => {
    update((x) => {
      const vv = x.venues.find((y) => y.id === v.id)!
      vv.settings = { ...d, history: [{ who: 'Mihai', at: Date.now(), what: t('Opening hours changed', 'Program modificat') }, ...vv.settings.history] }
    })
    toast(t('Opening hours saved', 'Program salvat'))
  }
  const setDay = (i: number, p: Partial<VenueSettings['hours'][number]>) => setD({ ...d, hours: d.hours.map((h, j) => (j === i ? { ...h, ...p } : h)) })
  return (
    <div>
      <div className="c-head">
        <button className="icon-btn outline" onClick={() => nav('/console/courts')} aria-label="Back">
          <ChevronLeft size={20} />
        </button>
        <h1 className="c-title">{t('Opening hours', 'Program')}</h1>
      </div>
      <div className="two-col">
        <div className="col" style={{ gap: 14 }}>
          <div className="panel" style={{ padding: '6px 20px' }}>
            {d.hours.map((h, i) => (
              <div key={i} className="mrow" style={{ flexWrap: 'wrap' }}>
                <b style={{ width: 110 }}>{dayLong(lang, i)}</b>
                <Toggle on={h.open} onChange={(o) => setDay(i, { open: o })} />
                {h.open ? (
                  <div className="row" style={{ gap: 6 }}>
                    <select className="select-sm" value={h.from} onChange={(e) => setDay(i, { from: Number(e.target.value) })}>
                      {TIMES.map((x) => (
                        <option key={x} value={x}>
                          {hm(x)}
                        </option>
                      ))}
                    </select>
                    –
                    <select className="select-sm" value={h.to} onChange={(e) => setDay(i, { to: Number(e.target.value) })}>
                      {TIMES.filter((x) => x > h.from).map((x) => (
                        <option key={x} value={x}>
                          {hm(x)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="muted">{t('Closed', 'Închis')}</span>
                )}
              </div>
            ))}
          </div>
          {outside.length > 0 && (
            <div className="note amber">
              <Info size={20} style={{ flex: 'none' }} />
              <span>
                {outside.length} {t('bookings fall outside the new hours. They stay booked unless you cancel them.', 'rezervări cad în afara noului program. Rămân valabile dacă nu le anulezi.')}{' '}
                <button className="link" onClick={() => nav('/console/bookings')}>
                  {t('View', 'Vezi')}
                </button>
              </span>
            </div>
          )}
          <SaveBar dirty={dirty} onDiscard={reset} onSave={save} />
        </div>
        <div className="panel col" style={{ gap: 10 }}>
          <div className="row between">
            <h3>{t('Special days', 'Zile speciale')}</h3>
            <button className="btn outline sm" onClick={() => setSd({ date: addDays(today, 14), closed: true, from: 8 * 60, to: 16 * 60 })}>
              <Plus size={16} /> {t('Add', 'Adaugă')}
            </button>
          </div>
          {d.special.length === 0 && <div className="muted small">{t('Holidays or short days, e.g. 25 Dec closed, 31 Dec until 16:00.', 'Sărbători sau zile scurte, ex. 25 dec. închis, 31 dec. până la 16:00.')}</div>}
          {d.special.map((x) => (
            <div key={x.id} className="row">
              <Clock size={16} />
              <span className="grow">{fmtDate(lang, x.date)}</span>
              <span className="small">{x.closed ? t('Closed', 'Închis') : `${hm(x.from)}–${hm(x.to)}`}</span>
              <button className="icon-btn" onClick={() => setD({ ...d, special: d.special.filter((y) => y.id !== x.id) })} aria-label="Remove">
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <Sheet
        open={!!sd}
        onClose={() => setSd(null)}
        title={t('Special day', 'Zi specială')}
        footer={
          <button
            className="btn primary block lg"
            onClick={() => {
              setD({ ...d, special: [...d.special, { id: uid(), ...sd! }] })
              setSd(null)
            }}
          >
            {t('Add', 'Adaugă')}
          </button>
        }
      >
        {sd && (
          <>
            <Field label={t('Date', 'Data')}>
              <input className="input" type="date" value={sd.date} onChange={(e) => setSd({ ...sd, date: e.target.value })} />
            </Field>
            <Chips
              options={[
                { v: 'closed', label: t('Closed', 'Închis') },
                { v: 'custom', label: t('Custom hours', 'Program special') },
              ]}
              value={sd.closed ? 'closed' : 'custom'}
              onChange={(x) => setSd({ ...sd, closed: x === 'closed' })}
              size="sm"
            />
            {!sd.closed && (
              <div className="form-grid cols2">
                <Field label={t('From', 'De la')}>
                  <select className="input" value={sd.from} onChange={(e) => setSd({ ...sd, from: Number(e.target.value) })}>
                    {TIMES.map((x) => (
                      <option key={x} value={x}>
                        {hm(x)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('To', 'Până la')}>
                  <select className="input" value={sd.to} onChange={(e) => setSd({ ...sd, to: Number(e.target.value) })}>
                    {TIMES.filter((x) => x > sd.from).map((x) => (
                      <option key={x} value={x}>
                        {hm(x)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </>
        )}
      </Sheet>
    </div>
  )
}

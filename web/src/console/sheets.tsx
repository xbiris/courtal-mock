import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Users, ChevronRight, LayoutGrid, Check, CalendarClock, Info } from 'lucide-react'
import { useDemo, update, bookingOf, court, slotFree, priceFor, uid, player, gameOf, share, patchBooking, cancelBooking, active } from '../lib/store'
import { fmtDate, fmtMoney, useLang, useT } from '../lib/i18n'
import { hm, nowMin, todayISO, weekday, addDays, diffDays } from '../lib/time'
import type { BlockReason, Booking } from '../lib/types'
import { Chips, Sheet, Toggle, Field, Avatar, Confirm, courtName, cx, toast } from '../ui'
import { formatName } from '../player/common'
import { payLabel, reasonLabel, useVenue, statusLabel } from './util'

export const TIMES = Array.from({ length: 37 }, (_, i) => 6 * 60 + i * 30)

function TimeSelect({ value, onChange, from = 0 }: { value: number; onChange: (v: number) => void; from?: number }) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {TIMES.filter((x) => x >= from).map((x) => (
        <option key={x} value={x}>
          {hm(x)}
        </option>
      ))}
    </select>
  )
}

/* ------------------------------------------------------------------ */
/*  Existing booking                                                   */
/* ------------------------------------------------------------------ */
export function BookingSheet({ id, onClose, onStartMove }: { id: string | null; onClose: () => void; onStartMove?: (id: string) => void }) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const v = useVenue()
  const b = id ? bookingOf(s, id) : undefined
  const [sub, setSub] = useState<null | 'call' | 'move' | 'extend' | 'noshow' | 'cancel' | 'paid'>(null)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('Player asked')
  const [paidWith, setPaidWith] = useState<'cash' | 'card'>('cash')
  const [mv, setMv] = useState({ date: '', courtId: '', start: 0 })
  const [callState, setCallState] = useState(0)
  useEffect(() => {
    setNote(b?.note ?? '')
    setSub(null)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (sub !== 'call') return
    setCallState(0)
    const a = setTimeout(() => setCallState(1), 1600)
    const i = setInterval(() => setCallState((x) => (x >= 1 ? x + 1 : x)), 1000)
    return () => {
      clearTimeout(a)
      clearInterval(i)
    }
  }, [sub])
  if (!b) return null
  const c = court(v, b.courtId)
  const g = b.gameId ? gameOf(s, b.gameId) : undefined
  const today = todayISO()
  const past = b.date < today || (b.date === today && b.start + b.dur <= nowMin())
  const canAct = !past && (b.status === 'booked' || b.status === 'checkedin')
  const extFree = slotFree(s, v, c.id, b.date, b.start + b.dur, 30, b.id)
  const noShowFrom = b.start + 15
  const noShowOk = b.date < today || (b.date === today && nowMin() >= noShowFrom)
  const hoursTo = diffDays(b.date, today) * 24 + (b.start - nowMin()) / 60
  const hostP = b.playerId ? player(s, b.playerId) : undefined
  const extra = g ? g.players.filter((p) => p !== g.hostId) : []
  const title = g ? `${formatName(t, g, c.sport)} · ${hm(b.start)}` : b.name
  const extPrice = priceFor(v, c, b.date, b.start + b.dur, 30)

  const moveTimes = mv.date ? TIMES.filter((x) => slotFree(s, v, mv.courtId || b.courtId, mv.date, x, b.dur, b.id) && (mv.date !== today || x >= nowMin() - 30)) : []

  return (
    <>
      <Sheet
        open={!!b}
        onClose={onClose}
        variant="side"
        modeless
        title={title}
        footer={
          canAct && b.date === today ? (
            b.status === 'checkedin' ? (
              <button
                className="btn soft lg block"
                onClick={() => {
                  patchBooking(b.id, { status: 'booked', checkedInAt: undefined })
                  toast(t('Check-in undone', 'Prezență anulată'))
                }}
              >
                <Check size={20} /> {t('Checked in', 'Prezent')} {b.checkedInAt ? hm(new Date(b.checkedInAt).getHours() * 60 + new Date(b.checkedInAt).getMinutes()) : ''}
              </button>
            ) : (
              <button
                className="btn primary lg block"
                onClick={() => {
                  patchBooking(b.id, { status: 'checkedin', checkedInAt: Date.now() })
                  toast(`${b.name} ${t('checked in', 'marcat prezent')}`)
                }}
              >
                <Check size={20} /> {t('Check in', 'Marchează prezent')}
              </button>
            )
          ) : undefined
        }
      >
        <div className="muted">
          {courtName(t, c.name)} · {fmtDate(lang, b.date)} · {hm(b.start)}–{hm(b.start + b.dur)}
        </div>
        <div className="chips">
          <span className={cx('badge', b.pay === 'unpaid' && 'amber')}>
            {payLabel(t, b)} · {fmtMoney(b.price)}
          </span>
          {g && (
            <span className="badge outline">
              <span className="dot" /> {t('Open game', 'Meci deschis')} · {g.players.length} {t('of', 'din')} {g.size}
            </span>
          )}
          {b.seriesId && <span className="badge outline">{t('Weekly', 'Săptămânal')}</span>}
          {b.status !== 'booked' && <span className="badge dark">{statusLabel(t, b)}</span>}
        </div>

        <div>
          <span className="label">{t('Players', 'Jucători')}</span>
          <div className="row">
            <Avatar name={b.name} dark />
            <div className="grow">
              <div className="bold">
                {hostP ? `${hostP.first} ${hostP.last}` : b.name}
                {g && ` · ${t('host', 'gazdă')}`}
              </div>
              <div className="muted small">
                {b.source === 'app' ? t('Booked in the app', 'Rezervat în aplicație') : `${t('Added by you', 'Adăugat de tine')}${b.phone ? ` · ${b.phone}` : ''}`}
                {b.pay === 'online' && ` · ${t('paid online', 'plătit online')}`}
              </div>
            </div>
            <button className="btn outline sm" onClick={() => setSub('call')}>
              <Phone size={16} /> {b.source === 'app' ? t('Call via Courtal', 'Sună prin Courtal') : t('Call', 'Sună')}
            </button>
          </div>
          {g && (
            <div className="row small muted" style={{ marginTop: 12, alignItems: 'flex-start' }}>
              <span className="avatar sm">
                <Users size={16} />
              </span>
              <span>
                {g.size - 1} {t('more players', 'jucători în plus')}: {extra.map((p) => player(s, p).first).join(', ')}
                {extra.length ? ' + ' : ''}
                {g.size - g.players.length} {t('open spots', 'locuri libere')} · {t('guests are shown by first name only', 'invitații apar doar cu prenumele')}
              </span>
            </div>
          )}
          {b.source === 'app' && (
            <div className="tiny muted" style={{ marginTop: 10 }}>
              {t("Contact goes through Courtal; players' phone numbers, level and history are not shared with venues.", 'Contactul se face prin Courtal; numerele de telefon, nivelul și istoricul jucătorilor nu sunt partajate cu bazele.')}
            </div>
          )}
        </div>

        {canAct ? (
          <div className="list">
            <button
              className="action-row"
              onClick={() => {
                setMv({ date: b.date, courtId: b.courtId, start: b.start })
                setSub('move')
              }}
            >
              <div className="grow">
                <div className="t">{t('Move to another slot', 'Mută în alt interval')}</div>
                <div className="s">{onStartMove ? t('Tap a slot on the grid or pick a time', 'Atinge un interval în grilă sau alege o oră') : t('Pick a new day, court or time', 'Alege altă zi, alt teren sau altă oră')}</div>
              </div>
              <ChevronRight size={20} />
            </button>
            <button className={cx('action-row', !extFree && 'disabled')} onClick={() => extFree && setSub('extend')}>
              <div className="grow">
                <div className="t">{t('Extend by 30 min', 'Prelungește cu 30 min')}</div>
                <div className="s">
                  {extFree
                    ? `${hm(b.start + b.dur)}–${hm(b.start + b.dur + 30)} ${t('is free', 'e liber')}`
                    : t('The next 30 min are already booked', 'Următoarele 30 min sunt deja rezervate')}
                </div>
              </div>
              <ChevronRight size={20} />
            </button>
            {b.pay === 'unpaid' && (
              <button className="action-row" onClick={() => setSub('paid')}>
                <div className="grow">
                  <div className="t">{t('Mark paid', 'Marchează plătit')}</div>
                  <div className="s">{t('Cash or card at the desk', 'Numerar sau card la recepție')}</div>
                </div>
                <ChevronRight size={20} />
              </button>
            )}
            <button className={cx('action-row', !noShowOk && 'disabled')} onClick={() => noShowOk && setSub('noshow')} title={noShowOk ? undefined : t('Available 15 min after the start', 'Disponibil la 15 min după început')}>
              <div className="grow">
                <div className="t">{t('Mark no-show', 'Marchează neprezentare')}</div>
                <div className="s">
                  {noShowOk ? t("Affects the players' reliability", 'Afectează seriozitatea jucătorilor') : `${t('Available from', 'Disponibil de la')} ${hm(noShowFrom)} · ${t("affects the players' reliability", 'afectează seriozitatea jucătorilor')}`}
                </div>
              </div>
              <ChevronRight size={20} />
            </button>
            <button className="action-row" onClick={() => setSub('cancel')}>
              <div className="grow">
                <div className="t" style={{ color: 'var(--danger)' }}>
                  {t('Cancel booking', 'Anulează rezervarea')}
                </div>
                <div className="s">
                  {hoursTo < v.settings.cancel ? `${t('Within', 'Sub')} ${v.settings.cancel} h · ` : ''}
                  {t('venue cancellation refunds in full', 'anularea de către bază se rambursează integral')}
                </div>
              </div>
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="note plain">
            <Info size={20} style={{ flex: 'none' }} />
            <div>
              {b.status === 'cancelled' ? `${statusLabel(t, b)}${b.cancelReason ? ` · ${b.cancelReason}` : ''}` : b.status === 'noshow' ? t('Marked as no-show', 'Marcat ca neprezentat') : t('This booking has been played.', 'Această rezervare s-a jucat.')}
              <div>
                <button className="link" onClick={() => nav('/console/money?tab=transactions')}>
                  {t('View in Money', 'Vezi în Bani')}
                </button>
              </div>
            </div>
          </div>
        )}

        <Field label={<b style={{ color: 'var(--ink)' }}>{t('Desk note', 'Notă pentru recepție')}</b>}>
          <textarea
            className="textarea"
            style={{ minHeight: 70 }}
            placeholder={t('e.g. wants court 1 lights on', 'ex. vrea luminile aprinse pe terenul 1')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== (b.note ?? '')) {
                patchBooking(b.id, { note })
                toast(t('Note saved', 'Notă salvată'))
              }
            }}
          />
        </Field>
      </Sheet>

      {/* call */}
      <Sheet open={sub === 'call'} onClose={() => setSub(null)} title={b.source === 'app' ? t('Calling through Courtal', 'Apel prin Courtal') : t('Calling', 'Se apelează')}>
        <div className="col center" style={{ alignItems: 'center', gap: 12, padding: '10px 0 20px' }}>
          <Avatar name={b.name} size="lg" dark />
          <b style={{ fontSize: 20 }}>{hostP ? hostP.first : b.name}</b>
          <div className="muted">{callState === 0 ? t('Ringing…', 'Sună…') : `${t('Connected', 'Conectat')} · 0:${String(callState - 1).padStart(2, '0')}`}</div>
          {b.source === 'app' && <div className="tiny muted">{t('Your number and theirs stay private.', 'Numărul tău și al lor rămân private.')}</div>}
          <button className="btn danger" onClick={() => setSub(null)}>
            {t('End call', 'Închide')}
          </button>
        </div>
      </Sheet>

      {/* move */}
      <Sheet
        open={sub === 'move'}
        onClose={() => setSub(null)}
        title={t('Move booking', 'Mută rezervarea')}
        footer={
          <>
            {onStartMove && (
              <button
                className="btn outline grow"
                onClick={() => {
                  setSub(null)
                  onStartMove(b.id)
                }}
              >
                <LayoutGrid size={18} /> {t('Pick on the grid', 'Alege din grilă')}
              </button>
            )}
            <button
              className={cx('btn primary grow', !moveTimes.includes(mv.start) && 'disabled')}
              onClick={() => {
                const nc = court(v, mv.courtId)
                patchBooking(b.id, { date: mv.date, courtId: mv.courtId, start: mv.start })
                setSub(null)
                toast(`${t('Moved to', 'Mutat pe')} ${courtName(t, nc.name)} · ${fmtDate(lang, mv.date)} ${hm(mv.start)} · ${t('players emailed', 'jucătorii au primit email')}`)
              }}
            >
              {t('Move', 'Mută')}
            </button>
          </>
        }
      >
        <div className="form-grid cols2">
          <Field label={t('Date', 'Data')}>
            <input className="input" type="date" value={mv.date} min={today} onChange={(e) => setMv({ ...mv, date: e.target.value })} />
          </Field>
          <Field label={t('Court', 'Teren')}>
            <select className="input" value={mv.courtId} onChange={(e) => setMv({ ...mv, courtId: e.target.value })}>
              {v.courts.map((x) => (
                <option key={x.id} value={x.id}>
                  {courtName(t, x.name)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={`${t('Free start times', 'Ore de început libere')} · ${b.dur} min`}>
          <div className="chips">
            {moveTimes.length === 0 && <span className="muted">{t('Nothing free on this court that day.', 'Nimic liber pe acest teren în ziua aleasă.')}</span>}
            {moveTimes.map((x) => (
              <button key={x} className={cx('chip sm', mv.start === x && 'on')} onClick={() => setMv({ ...mv, start: x })}>
                {hm(x)}
              </button>
            ))}
          </div>
        </Field>
        <div className="muted small">{t('Players get an email with the new time.', 'Jucătorii primesc un email cu noua oră.')}</div>
      </Sheet>

      <Confirm
        open={sub === 'extend'}
        onClose={() => setSub(null)}
        title={t('Extend by 30 min?', 'Prelungești cu 30 min?')}
        body={
          <>
            {hm(b.start)}–{hm(b.start + b.dur + 30)} · +{fmtMoney(extPrice)}{' '}
            {b.pay === 'online' ? t(`charged to ${hostP?.first ?? b.name}'s card`, `încasați de pe cardul lui ${hostP?.first ?? b.name}`) : t('to collect at the desk', 'de încasat la recepție')}
          </>
        }
        confirm={t('Extend', 'Prelungește')}
        cancel={t('Cancel', 'Renunță')}
        onConfirm={() => {
          patchBooking(b.id, { dur: b.dur + 30, price: b.price + extPrice })
          toast(`${t('Extended until', 'Prelungit până la')} ${hm(b.start + b.dur + 30)}`)
        }}
      />
      <Confirm
        open={sub === 'noshow'}
        onClose={() => setSub(null)}
        title={t('Mark as no-show?', 'Marchezi neprezentarea?')}
        body={t(`This affects ${hostP?.first ?? b.name}'s reliability. The court stays charged.`, `Asta afectează seriozitatea lui ${hostP?.first ?? b.name}. Terenul rămâne plătit.`)}
        confirm={t('Mark no-show', 'Marchează')}
        cancel={t('Cancel', 'Renunță')}
        danger
        onConfirm={() => {
          patchBooking(b.id, { status: 'noshow' })
          toast(t('Marked as no-show', 'Marcat ca neprezentat'))
        }}
      />
      <Sheet
        open={sub === 'paid'}
        onClose={() => setSub(null)}
        title={t('Mark paid', 'Marchează plătit')}
        footer={
          <button
            className="btn primary block lg"
            onClick={() => {
              patchBooking(b.id, { pay: 'venue', payMethod: paidWith })
              setSub(null)
              toast(`${fmtMoney(b.price)} ${t('marked as paid at the venue', 'marcați ca plătiți la bază')}`)
            }}
          >
            {t('Mark', 'Marchează')} {fmtMoney(b.price)} {t('paid', 'plătit')}
          </button>
        }
      >
        <Chips
          options={[
            { v: 'cash' as const, label: t('Cash', 'Numerar') },
            { v: 'card' as const, label: t('Card at the desk', 'Card la recepție') },
          ]}
          value={paidWith}
          onChange={setPaidWith}
        />
        <div className="muted small">{t('At-venue payments stay at your desk and never pass through Courtal.', 'Plățile la bază rămân la recepție și nu trec prin Courtal.')}</div>
      </Sheet>
      <Sheet
        open={sub === 'cancel'}
        onClose={() => setSub(null)}
        title={t('Cancel booking', 'Anulează rezervarea')}
        footer={
          <>
            <button className="btn outline grow" onClick={() => setSub(null)}>
              {t('Keep booking', 'Păstrează')}
            </button>
            <button
              className="btn danger grow"
              onClick={() => {
                const before = { status: b.status, cancelledBy: b.cancelledBy, cancelReason: b.cancelReason }
                cancelBooking(b.id, 'venue', reason)
                setSub(null)
                onClose()
                toast(t('Booking cancelled · players refunded and emailed', 'Rezervare anulată · jucătorii au fost rambursați și anunțați'), () => patchBooking(b.id, before))
              }}
            >
              {t('Cancel booking', 'Anulează')}
            </button>
          </>
        }
      >
        <Field label={t('Reason', 'Motiv')}>
          <Chips
            options={[
              { v: 'Rain', label: t('Rain', 'Ploaie') },
              { v: 'Court closed', label: t('Court closed', 'Teren închis') },
              { v: 'Player asked', label: t('Player asked', 'La cererea jucătorului') },
              { v: 'Other', label: t('Other', 'Altele') },
            ]}
            value={reason}
            onChange={setReason}
            size="sm"
          />
        </Field>
        <div className="note">
          <Info size={20} style={{ flex: 'none' }} />
          <span>
            {b.pay === 'online'
              ? `${t('Full refund', 'Rambursare integrală')} · ${fmtMoney(g ? share(s, g) * (g.players.length || 1) : b.price)} ${t('back to', 'înapoi către')} ${hostP?.first ?? b.name}${g && g.players.length > 1 ? ` ${t('and', 'și')} ${g.players.length - 1} ${t('players', 'jucători')}` : ''}`
              : t('Nothing was paid online, so there is nothing to refund.', 'Nu s-a plătit nimic online, deci nu e nimic de rambursat.')}{' '}
            · {t('everyone is emailed', 'toți primesc email')}
          </span>
        </div>
      </Sheet>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  New booking                                                        */
/* ------------------------------------------------------------------ */
export type Draft = { courtId: string; date: string; start: number }

export function NewBookingSheet({ draft, setDraft, onClose, pick }: { draft: Draft | null; setDraft: (d: Draft) => void; onClose: () => void; pick?: boolean }) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const v = useVenue()
  const [dur, setDur] = useState(60)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [pay, setPay] = useState<'venue' | 'unpaid'>('venue')
  const [editPrice, setEditPrice] = useState(false)
  const [price, setPrice] = useState<number | null>(null)
  useEffect(() => {
    if (!draft) {
      setName('')
      setPhone('')
      setPrice(null)
      setEditPrice(false)
      setDur(60)
    }
  }, [draft])
  if (!draft) return null
  const c = court(v, draft.courtId)
  const auto = priceFor(v, c, draft.date, draft.start, dur)
  const free = slotFree(s, v, draft.courtId, draft.date, draft.start, dur)
  const save = () => {
    if (!name.trim()) return toast(t('Add who is playing', 'Adaugă cine joacă'))
    update((d) => {
      d.bookings.push({
        id: uid(),
        venueId: v.id,
        courtId: draft.courtId,
        date: draft.date,
        start: draft.start,
        dur,
        kind: 'booking',
        source: 'desk',
        name: name.trim(),
        phone,
        pay,
        price: price ?? auto,
        status: 'booked',
        createdAt: Date.now(),
      })
    })
    toast(`${t('Booking saved', 'Rezervare salvată')} · ${courtName(t, c.name)} · ${hm(draft.start)}`)
    onClose()
  }
  return (
    <Sheet
      open
      onClose={onClose}
      variant="side"
      modeless
      title={t('New booking', 'Rezervare nouă')}
      footer={
        <button className={cx('btn primary lg block', !free && 'disabled')} onClick={save}>
          {t('Save booking', 'Salvează rezervarea')}
        </button>
      }
    >
      {pick ? (
        <div className="form-grid cols3">
          <Field label={t('Date', 'Data')}>
            <input className="input" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </Field>
          <Field label={t('Court', 'Teren')}>
            <select className="input" value={draft.courtId} onChange={(e) => setDraft({ ...draft, courtId: e.target.value })}>
              {v.courts.map((x) => (
                <option key={x.id} value={x.id}>
                  {courtName(t, x.name)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Start', 'Început')}>
            <TimeSelect value={draft.start} onChange={(x) => setDraft({ ...draft, start: x })} />
          </Field>
        </div>
      ) : (
        <div className="note">
          <LayoutGrid size={20} style={{ flex: 'none' }} />
          <div>
            <b>
              {courtName(t, c.name)} · {fmtDate(lang, draft.date)} · {hm(draft.start)}
            </b>
            <div className="small" style={{ fontWeight: 400 }}>
              {t('Tap another empty slot to move it', 'Atinge alt interval liber ca să-l muți')}
            </div>
          </div>
        </div>
      )}
      {!free && <div className="note danger">{t('This overlaps another booking or is outside opening hours.', 'Se suprapune cu altă rezervare sau e în afara programului.')}</div>}
      <Field label={t('Duration', 'Durată')}>
        <Chips options={[60, 90, 120].map((m) => ({ v: m, label: `${m} min` }))} value={dur} onChange={setDur} raised />
      </Field>
      <Field label={<b style={{ color: 'var(--ink)' }}>{t('Name', 'Nume')}</b>}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ionescu Dan" autoFocus />
      </Field>
      <Field label={<b style={{ color: 'var(--ink)' }}>{t('Phone', 'Telefon')}</b>} help={t('If they have Courtal, the booking shows in their app', 'Dacă au Courtal, rezervarea le apare în aplicație')}>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07xx xxx xxx" inputMode="tel" />
      </Field>
      <div className="row between">
        <div>
          {editPrice ? (
            <input className="input" style={{ width: 140 }} type="number" value={price ?? auto} onChange={(e) => setPrice(Number(e.target.value))} />
          ) : (
            <b style={{ fontSize: 22 }}>{fmtMoney(price ?? auto)}</b>
          )}
          <div className="muted small">{price == null ? t('Base price · tap to change', 'Preț de bază · atinge ca să-l schimbi') : t('Custom price', 'Preț personalizat')}</div>
        </div>
        <button className="btn outline sm" onClick={() => setEditPrice(!editPrice)}>
          {editPrice ? t('Done', 'Gata') : t('Edit', 'Editează')}
        </button>
      </div>
      <Field label={t('Payment', 'Plată')}>
        <Chips
          options={[
            { v: 'venue' as const, label: t('Paid at the venue', 'Plătit la bază') },
            { v: 'unpaid' as const, label: t('To collect', 'De încasat') },
          ]}
          value={pay}
          onChange={setPay}
          size="sm"
        />
      </Field>
    </Sheet>
  )
}

/* ------------------------------------------------------------------ */
/*  Block time                                                         */
/* ------------------------------------------------------------------ */
export type BlockInit = { editId?: string; courtIds: string[]; date: string; from: number; to: number }

export function BlockSheet({ init, onClose }: { init: BlockInit | null; onClose: () => void }) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const v = useVenue()
  const existing = init?.editId ? bookingOf(s, init.editId) : undefined
  const [courts, setCourts] = useState<string[]>([])
  const [date, setDate] = useState('')
  const [from, setFrom] = useState(9 * 60)
  const [to, setTo] = useState(11 * 60)
  const [reason, setReason] = useState<BlockReason>('maintenance')
  const [repeat, setRepeat] = useState(false)
  const [days, setDays] = useState<number[]>([])
  const [note, setNote] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  useEffect(() => {
    if (!init) return
    setCourts(init.courtIds)
    setDate(init.date)
    setFrom(init.from)
    setTo(init.to)
    setReason(existing?.reason ?? 'maintenance')
    setNote(existing?.note ?? '')
    setRepeat(!!existing?.seriesId)
    setDays([weekday(init.date)])
  }, [init]) // eslint-disable-line react-hooks/exhaustive-deps
  const conflicts = useMemo(() => {
    if (!init || !date) return []
    return s.bookings.filter(
      (b) => b.venueId === v.id && b.kind === 'booking' && active(b) && courts.includes(b.courtId) && b.date === date && b.start < to && from < b.start + b.dur && b.id !== init.editId,
    )
  }, [s.bookings, init, date, courts, from, to, v.id])
  if (!init) return null
  const all = courts.length === v.courts.length
  const toggleCourt = (id: string) => setCourts(courts.includes(id) ? courts.filter((x) => x !== id) : [...courts, id])
  const save = () => {
    if (!courts.length) return toast(t('Pick at least one court', 'Alege cel puțin un teren'))
    update((d) => {
      if (init.editId) d.bookings = d.bookings.filter((b) => b.id !== init.editId)
      for (const cb of conflicts) {
        const x = d.bookings.find((y) => y.id === cb.id)!
        x.status = 'cancelled'
        x.cancelledBy = 'venue'
        x.cancelReason = reasonLabel(t, reason)
      }
      const weeks = repeat ? 8 : 1
      const ds = repeat ? days : [weekday(date)]
      for (const cid of courts) {
        let seriesId: string | undefined
        if (repeat) {
          seriesId = uid()
          for (const wd of ds)
            d.series.push({ id: `${seriesId}_${wd}`, venueId: v.id, courtId: cid, name: reasonLabel(t, reason), weekday: wd, start: from, dur: to - from, kind: 'block', reason, pay: 'session', skipped: [] })
        }
        for (let w = 0; w < weeks; w++) {
          for (const wd of ds) {
            const dd = repeat ? addDays(date, w * 7 + ((wd - weekday(date) + 7) % 7)) : date
            d.bookings.push({
              id: uid(),
              venueId: v.id,
              courtId: cid,
              date: dd,
              start: from,
              dur: to - from,
              kind: 'block',
              source: 'desk',
              name: reasonLabel(t, reason),
              pay: 'none',
              price: 0,
              status: 'booked',
              reason,
              note,
              seriesId: seriesId ? `${seriesId}_${wd}` : undefined,
              createdAt: Date.now(),
            })
          }
        }
      }
    })
    toast(
      conflicts.length
        ? t(`Time blocked · ${conflicts.length} bookings cancelled and refunded`, `Interval blocat · ${conflicts.length} rezervări anulate și rambursate`)
        : t('Time blocked · players see the court as unavailable', 'Interval blocat · jucătorii văd terenul indisponibil'),
    )
    onClose()
  }
  return (
    <>
      <Sheet
        open
        onClose={onClose}
        variant="side"
        modeless
        title={init.editId ? t('Blocked time', 'Interval blocat') : t('Block time', 'Blochează timp')}
        footer={
          <>
            {init.editId && (
              <button className="btn outline grow" onClick={() => setConfirmRemove(true)}>
                {t('Remove block', 'Șterge blocarea')}
              </button>
            )}
            <button className="btn primary grow" onClick={save}>
              {t('Save', 'Salvează')}
            </button>
          </>
        }
      >
        <Field label={t('Courts', 'Terenuri')}>
          <div className="chips">
            {v.courts.map((c) => (
              <button key={c.id} className={cx('chip sm raised', courts.includes(c.id) && 'on')} onClick={() => toggleCourt(c.id)}>
                {courtName(t, c.name)}
              </button>
            ))}
            <button className={cx('chip sm raised', all && 'on')} onClick={() => setCourts(all ? [] : v.courts.map((c) => c.id))}>
              {t('All courts', 'Toate terenurile')}
            </button>
          </div>
        </Field>
        <div className="form-grid cols3">
          <Field label={<b style={{ color: 'var(--ink)' }}>{t('Date', 'Data')}</b>}>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label={<b style={{ color: 'var(--ink)' }}>{t('From', 'De la')}</b>}>
            <TimeSelect value={from} onChange={(x) => (setFrom(x), x >= to && setTo(x + 30))} />
          </Field>
          <Field label={<b style={{ color: 'var(--ink)' }}>{t('To', 'Până la')}</b>}>
            <TimeSelect value={to} onChange={setTo} from={from + 30} />
          </Field>
        </div>
        <Field label={t('Reason · players see the court as unavailable, not why', 'Motiv · jucătorii văd doar că terenul e indisponibil, nu și de ce')}>
          <Chips
            options={(['maintenance', 'rain', 'private', 'training', 'other'] as BlockReason[]).map((r) => ({ v: r, label: reasonLabel(t, r) }))}
            value={reason}
            onChange={setReason}
            size="sm"
            raised
          />
        </Field>
        <div className="row">
          <div className="grow">
            <div className="bold">{t('Repeat weekly', 'Repetă săptămânal')}</div>
            <div className="muted small">{t('Pick days · useful for club training', 'Alege zilele · util pentru antrenamentele clubului')}</div>
          </div>
          <Toggle on={repeat} onChange={setRepeat} />
        </div>
        {repeat && (
          <Chips
            options={[0, 1, 2, 3, 4, 5, 6].map((d) => ({ v: d, label: fmtDate(lang, addDays(date || todayISO(), d - weekday(date || todayISO()))).split(' ')[0] }))}
            value={days}
            onChange={(d) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
            size="sm"
          />
        )}
        {conflicts.length === 0 ? (
          <div className="note">
            <Check size={18} style={{ flex: 'none', marginTop: 2 }} />
            <span>{t('No bookings in this range. If there were, you would cancel them here and the players would be refunded in full.', 'Nicio rezervare în acest interval. Dacă ar fi, le-ai anula de aici, iar jucătorii ar fi rambursați integral.')}</span>
          </div>
        ) : (
          <div className="note amber">
            <CalendarClock size={18} style={{ flex: 'none', marginTop: 2 }} />
            <div>
              <b>
                {conflicts.length} {t('bookings in this range will be cancelled and refunded in full:', 'rezervări din interval vor fi anulate și rambursate integral:')}
              </b>
              {conflicts.map((b) => (
                <div key={b.id} className="small" style={{ fontWeight: 400 }}>
                  {b.name} · {courtName(t, court(v, b.courtId).name)} · {hm(b.start)}–{hm(b.start + b.dur)}
                </div>
              ))}
            </div>
          </div>
        )}
        <Field label={<b style={{ color: 'var(--ink)' }}>{t('Note for the desk', 'Notă pentru recepție')}</b>}>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('e.g. Resurfacing', 'ex. Refacere suprafață')} />
        </Field>
      </Sheet>
      <Confirm
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={t('Remove this block?', 'Ștergi blocarea?')}
        body={existing?.seriesId ? t('Only this date is removed. The weekly block stays on other weeks.', 'Se șterge doar această dată. Blocarea săptămânală rămâne în celelalte săptămâni.') : t('The court becomes bookable again in this range.', 'Terenul devine din nou rezervabil în acest interval.')}
        confirm={t('Remove', 'Șterge')}
        cancel={t('Keep', 'Păstrează')}
        danger
        onConfirm={() => {
          const removed = existing!
          update((d) => {
            d.bookings = d.bookings.filter((b) => b.id !== removed.id)
          })
          onClose()
          toast(t('Block removed', 'Blocare ștearsă'), () =>
            update((d) => {
              d.bookings.push(removed)
            }),
          )
        }}
      />
    </>
  )
}

export function useNewBookingDraft() {
  return useState<Draft | null>(null)
}
export type { Booking }

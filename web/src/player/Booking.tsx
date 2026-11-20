import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Map as MapIcon, SlidersHorizontal, Share, Check, Clock, CreditCard, Smartphone, Plus, Upload, CalendarPlus, Info, Users } from 'lucide-react'
import { useDemo, venue, court, freeTimes, freeCourts, courtFree, priceFor, addBooking, ME, minPrice, courtsFor, update, bookingOf } from '../lib/store'
import { fmtDate, fmtMoney, monthLong, dayShort, useLang, useT } from '../lib/i18n'
import { addDays, hm, monthGrid, nowMin, parseISO, todayISO } from '../lib/time'
import type { Sport, Venue } from '../lib/types'
import { CourtLines, Chips, Sheet, SportIcon, Toggle, courtName, cx, photoUrl, sportName, surfaceName, toast } from '../ui'
import { PlayerShell } from './PlayerApp'
import { TopBar, cancelUntil } from './common'

function nextSlot() {
  return Math.ceil((nowMin() + 1) / 30) * 30
}

function courtSummary(t: ReturnType<typeof useT>, v: Venue, sport: string) {
  const cs = courtsFor(v, sport)
  const kinds = [...new Set(cs.map((c) => `${c.indoor ? t('indoor', 'interior') : t('outdoor', 'exterior')} ${surfaceName(t, c.surface)}`))]
  return `${cs.length} ${cs.length === 1 ? t('court', 'teren') : t('courts', 'terenuri')} · ${kinds.join(' & ')}`
}

export function CourtsList() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const sport = s.me.sport
  const today = todayISO()
  const venues = s.venues.filter((v) => v.status === 'live' && (sport === 'all' || v.sports.includes(sport as Sport))).sort((a, b) => a.km - b.km)
  const title = sport === 'all' ? t('All courts', 'Toate terenurile') : t(`${sportName(t, sport)} courts`, `Terenuri de ${sportName(t, sport).toLowerCase()}`)
  return (
    <PlayerShell tab="search">
      <TopBar
        back="/app/home"
        title={title}
        sub={`${t('Around me', 'În jurul meu')} · ${t('Today', 'Azi')} · ${venues.length} ${t('venues', 'baze sportive')}`}
        right={
          <div className="row" style={{ gap: 10 }}>
            <button className="icon-btn outline" style={{ width: 56, height: 56 }} aria-label="Map">
              <MapIcon size={24} />
            </button>
            <button className="icon-btn dark" style={{ width: 56, height: 56 }} aria-label="Filters">
              <SlidersHorizontal size={24} />
            </button>
          </div>
        }
      />
      <div className="p-page" style={{ paddingTop: 8 }}>
        <div className="venue-grid">
          {venues.map((v) => {
            const dur = 90
            const times = freeTimes(s, v, sport, today, dur, nextSlot()).slice(0, 3)
            let nextFree: { d: string; t: number } | null = null
            if (!times.length) {
              for (let i = 1; i < 7 && !nextFree; i++) {
                const d = addDays(today, i)
                const f = freeTimes(s, v, sport, d, dur)
                if (f.length) nextFree = { d, t: f[0] }
              }
            }
            return (
              <div key={v.id} className="venue-card" role="button" style={{ cursor: 'pointer' }} onClick={() => nav(`/app/venue/${v.id}`)}>
                <div className="photo">
                  <img src={photoUrl(v.cover)} alt="" loading="lazy" />
                  <span className="km-pill">{v.km.toFixed(1).replace('.0', '')} km</span>
                </div>
                <div className="row between" style={{ padding: '0 8px' }}>
                  <h3 style={{ fontSize: 22, fontWeight: 600 }}>{v.name}</h3>
                  <span className="row" style={{ gap: 6, fontSize: 16 }}>
                    <span className="dot" style={{ width: 14, height: 14, border: '1.5px solid var(--ink)' }} />
                    {v.rating.toFixed(1)}
                  </span>
                </div>
                <div className="muted" style={{ padding: '0 8px', fontSize: 15.5 }}>
                  {v.address.split(',')[0]} · {courtSummary(t, v, sport)}
                </div>
                <div className="row between wrap" style={{ padding: '10px 8px 0', gap: 10 }}>
                  {times.length ? (
                    <div className="row" style={{ gap: 8 }}>
                      {times.map((x) => (
                        <button
                          key={x}
                          className="time-chip"
                          onClick={(e) => {
                            e.stopPropagation()
                            nav(`/app/venue/${v.id}?d=${today}&t=${x}&m=${dur}`)
                          }}
                        >
                          {hm(x)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="muted small" style={{ maxWidth: 200 }}>
                      {t('Nothing free today', 'Nimic liber azi')}
                      {nextFree && ` · ${t('next free', 'următorul liber')} ${fmtDate(lang, nextFree.d)} ${hm(nextFree.t)}`}
                    </span>
                  )}
                  <span style={{ fontSize: 16 }}>
                    {t('from', 'de la')} <b style={{ fontSize: 21 }}>{fmtMoney(minPrice(v, sport))}</b>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PlayerShell>
  )
}

export function VenueScreen() {
  const { id } = useParams()
  const [q] = useSearchParams()
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const v = venue(s, id!)
  const today = todayISO()
  const initialSport: Sport = s.me.sport !== 'all' && v.sports.includes(s.me.sport) ? s.me.sport : v.sports[0]
  const [sport, setSport] = useState<Sport>(initialSport)
  const [date, setDate] = useState(q.get('d') ?? today)
  const [dur, setDur] = useState(Number(q.get('m') ?? 90))
  const [time, setTime] = useState<number | null>(q.get('t') ? Number(q.get('t')) : null)
  const [courtId, setCourtId] = useState<string | null>(null)
  const [morning, setMorning] = useState(q.get('t') ? Number(q.get('t')) < 16 * 60 : false)
  const d0 = parseISO(date)
  const [ym, setYm] = useState({ y: d0.getFullYear(), m: d0.getMonth() })
  const last = addDays(today, v.settings.window)
  const hrs = v.settings.hours
  const dayHours = hrs[(parseISO(date).getDay() + 6) % 7]

  const slots = useMemo(() => {
    const out: number[] = []
    if (!dayHours.open) return out
    for (let x = dayHours.from; x + dur <= dayHours.to; x += 30) out.push(x)
    return out
  }, [dayHours, dur])
  const cutoff = 16 * 60
  const visible = slots.filter((x) => morning || x >= cutoff || dayHours.from >= cutoff)
  const free = new Set(freeTimes(s, v, sport, date, dur))
  const courts = time != null ? freeCourts(s, v, sport, date, time, dur) : []
  const selCourt = courts.find((c) => c.id === courtId) ?? (time != null ? courts[0] : undefined)
  const price = selCourt && time != null ? priceFor(v, selCourt, date, time, dur) : 0
  const ok = selCourt && time != null && free.has(time)
  const policy = `${v.settings.payment === 'online' ? t('Pay online', 'Plată online') : t('Pay online or at the venue', 'Plată online sau la bază')} · ${
    v.settings.cancel === 0 ? t('No refunds', 'Fără rambursare') : t(`Free cancellation until ${v.settings.cancel} h before`, `Anulare gratuită cu până la ${v.settings.cancel} h înainte`)
  }`

  const pickTime = (x: number) => {
    setTime(x)
    setCourtId(null)
  }

  return (
    <div style={{ paddingBottom: 120 }}>
      <div className="v-banner">
        <CourtLines sport={sport} style={{ width: 240, height: 140, marginTop: 20 }} />
        <div className="bar" style={{ left: 0, right: 0 }}>
          <button className="icon-btn white" style={{ width: 54, height: 54 }} onClick={() => nav(-1)} aria-label="Back">
            <ChevronLeft size={26} />
          </button>
          <button className="icon-btn white" style={{ width: 54, height: 54 }} aria-label="Share">
            <Share size={22} />
          </button>
        </div>
      </div>
      <div className="p-page" style={{ paddingTop: 18 }}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.4 }}>{v.name}</h1>
            <div className="muted" style={{ marginTop: 4 }}>
              {v.address.split(',')[0]} · {v.km.toFixed(1).replace('.0', '')} km · {dayHours.open ? `${t('open until', 'deschis până la')} ${hm(dayHours.to)}` : t('closed today', 'închis azi')}
            </div>
          </div>
          {v.sports.length === 1 && (
            <span className="badge outline" style={{ height: 40, fontSize: 16, padding: '0 14px' }}>
              <SportIcon sport={sport} size={20} /> {sportName(t, sport)}
            </span>
          )}
        </div>
        {v.sports.length > 1 && (
          <div style={{ marginTop: 14 }}>
            <Chips
              options={v.sports.map((x) => ({ v: x, label: <><SportIcon sport={x} size={20} /> {sportName(t, x)}</> }))}
              value={sport}
              onChange={(x) => {
                setSport(x)
                setTime(null)
              }}
              size="sm"
            />
          </div>
        )}
        <div className="row" style={{ gap: 10, marginTop: 16, overflowX: 'auto' }}>
          {v.photos.slice(0, 4).map((p) => (
            <div key={p} className="photo" style={{ width: 150, height: 96, flex: 'none', borderRadius: 18 }}>
              <img src={photoUrl(p)} alt="" loading="lazy" />
            </div>
          ))}
        </div>

        <div className="v-layout" style={{ marginTop: 22 }}>
          <div className="col" style={{ gap: 22 }}>
            <div className="cal">
              <div className="row between" style={{ marginBottom: 12 }}>
                <button
                  className="icon-btn"
                  style={{ background: 'var(--green-soft)' }}
                  onClick={() => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
                  aria-label="Previous month"
                >
                  <ChevronLeft size={22} />
                </button>
                <b style={{ fontSize: 20, textTransform: 'capitalize' }}>
                  {monthLong(lang, ym.m)} {ym.y}
                </b>
                <button
                  className="icon-btn"
                  style={{ background: 'var(--green-soft)' }}
                  onClick={() => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
                  aria-label="Next month"
                >
                  <ChevronRight size={22} />
                </button>
              </div>
              <div className="cal-grid">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="dow">
                    {dayShort(lang, i)[0]}
                  </div>
                ))}
                {monthGrid(ym.y, ym.m).map((d) => {
                  const inMonth = parseISO(d).getMonth() === ym.m
                  const out = !inMonth || d < today || d > last
                  return (
                    <button
                      key={d}
                      className={cx('cal-day', out && 'out', d === date && 'on', d === today && 'today')}
                      style={!inMonth ? { visibility: 'visible', opacity: 0.6 } : undefined}
                      onClick={() => {
                        setDate(d)
                        setTime(null)
                      }}
                    >
                      {parseISO(d).getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <span className="label">{t('How long', 'Durată')}</span>
              <div className="dur-row">
                {[60, 90, 120].map((m) => (
                  <button key={m} className={cx(dur === m && 'on')} onClick={() => setDur(m)}>
                    {m} min
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 22 }}>
            <div>
              <div className="row between" style={{ marginBottom: 8 }}>
                <span className="label" style={{ margin: 0 }}>
                  {t('Free times', 'Ore libere')} · {fmtDate(lang, date)}
                </span>
                {dayHours.from < cutoff && (
                  <button className="bold small" onClick={() => setMorning(!morning)}>
                    {morning ? t('Hide morning', 'Ascunde dimineața') : t('Show morning', 'Arată dimineața')}
                  </button>
                )}
              </div>
              {visible.length ? (
                <div className="slot-grid">
                  {visible.map((x) => (
                    <button key={x} className={cx('slot', !free.has(x) && 'taken', time === x && 'on')} onClick={() => pickTime(x)}>
                      {hm(x)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="card muted">{t('The venue is closed on this day.', 'Baza este închisă în această zi.')}</div>
              )}
            </div>
            {time != null && (
              <div>
                <span className="label">
                  {t('Courts free at', 'Terenuri libere la')} {hm(time)} · {dur} min
                </span>
                <div className="col" style={{ gap: 10 }}>
                  {courts.map((c) => (
                    <button key={c.id} className={cx('court-opt', selCourt?.id === c.id && 'on')} onClick={() => setCourtId(c.id)}>
                      <div className="grow">
                        <div style={{ fontSize: 19, fontWeight: 500 }}>{courtName(t, c.name)}</div>
                        <div className="muted small">
                          {c.indoor ? t('Indoor', 'Interior') : t('Outdoor', 'Exterior')} · {surfaceName(t, c.surface)}
                          {c.lights && !c.indoor ? ` · ${t('lights', 'nocturnă')}` : ''}
                        </div>
                      </div>
                      <b style={{ fontSize: 19 }}>{fmtMoney(priceFor(v, c, date, time, dur))}</b>
                      {selCourt?.id === c.id && <Check size={22} />}
                    </button>
                  ))}
                  {courts.length === 0 && <div className="card muted">{t('No court is free at this time.', 'Niciun teren liber la această oră.')}</div>}
                </div>
              </div>
            )}
            <div className="note plain">
              <Info size={20} style={{ flex: 'none', marginTop: 1 }} />
              <div>
                {policy}
                {v.settings.rules && <div className="muted small" style={{ marginTop: 6 }}>{v.settings.rules}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bottom-bar">
        <div className="inner">
          <div className="grow">
            {ok ? (
              <>
                <div style={{ fontSize: 21, fontWeight: 600 }}>{fmtMoney(price)}</div>
                <div className="muted small">
                  {fmtDate(lang, date)} · {hm(time!)}–{hm(time! + dur)} · {courtName(t, selCourt!.name)}
                </div>
              </>
            ) : (
              <div className="muted">{time == null ? t('Pick a time to see free courts', 'Alege o oră ca să vezi terenurile libere') : t('Pick a court', 'Alege un teren')}</div>
            )}
          </div>
          <button
            className={cx('btn primary lg', !ok && 'disabled')}
            style={{ minWidth: 170 }}
            onClick={() => nav(`/app/review?v=${v.id}&c=${selCourt!.id}&d=${date}&t=${time}&m=${dur}`)}
          >
            {t('Book court', 'Rezervă terenul')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Review() {
  const [q] = useSearchParams()
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const v = venue(s, q.get('v')!)
  const c = court(v, q.get('c')!)
  const date = q.get('d')!
  const start = Number(q.get('t'))
  const dur = Number(q.get('m'))
  const price = priceFor(v, c, date, start, dur)
  const [method, setMethod] = useState<'visa' | 'apple' | 'venue'>('visa')
  const [openGame, setOpenGame] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ageOpen, setAgeOpen] = useState(false)
  const [dob, setDob] = useState('')
  const needsAge = s.me.method === 'email' && !s.me.ageOk

  const pay = () => {
    if (needsAge) return setAgeOpen(true)
    if (!courtFree(s, v, c, date, start, dur)) {
      toast(t('That time was just taken. Pick another one.', 'Ora tocmai a fost rezervată. Alege alta.'))
      nav(`/app/venue/${v.id}?d=${date}&m=${dur}`)
      return
    }
    setBusy(true)
    setTimeout(() => {
      const id = addBooking({
        venueId: v.id,
        courtId: c.id,
        date,
        start,
        dur,
        kind: 'booking',
        source: 'app',
        name: 'Iarina P.',
        playerId: ME,
        pay: method === 'venue' ? 'unpaid' : 'online',
        price,
        status: 'booked',
      })
      nav(openGame ? `/app/open/${id}?fresh=1` : `/app/booked/${id}`, { replace: true })
    }, 1100)
  }

  return (
    <div style={{ paddingBottom: 120 }}>
      <TopBar back={-1} title={t('Review booking', 'Verifică rezervarea')} narrow />
      <div className="p-page narrow col" style={{ gap: 16, paddingTop: 8 }}>
        <div className="card row" style={{ gap: 18 }}>
          <div className="soft-card" style={{ padding: 16, borderRadius: 18, display: 'flex' }}>
            <SportIcon sport={c.sport} size={30} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {sportName(t, c.sport)} · {courtName(t, c.name)}
            </div>
            <div style={{ fontSize: 18, marginTop: 2 }}>
              {fmtDate(lang, date)}, {hm(start)}–{hm(start + dur)}
            </div>
            <div className="muted small" style={{ marginTop: 2 }}>
              {v.name}
            </div>
          </div>
        </div>
        <div className="card col" style={{ gap: 12, fontSize: 18 }}>
          <div className="row between">
            <span>
              {t('Court', 'Teren')} · {dur} min
            </span>
            <span>{fmtMoney(price)}</span>
          </div>
          <div className="row between muted">
            <span>{t('Service fee', 'Taxă de serviciu')}</span>
            <span>0 lei</span>
          </div>
          <hr className="divider" />
          <div className="row between bold" style={{ fontSize: 20 }}>
            <span>Total</span>
            <span>{fmtMoney(price)}</span>
          </div>
        </div>
        <div className="note">
          <Clock size={22} style={{ flex: 'none' }} />
          <span>
            {cancelUntil(lang, t, date, start, v.settings.cancel)}
            {v.settings.cancel > 0 && !cancelUntil(lang, t, date, start, v.settings.cancel).startsWith(t('Less', 'Mai')) && t('. After that the court is charged in full.', '. După aceea, terenul se plătește integral.')}
          </span>
        </div>
        <span className="label" style={{ margin: '6px 0 -6px' }}>
          {t('Payment', 'Plată')}
        </span>
        <div className="card col" style={{ gap: 4, padding: '10px 22px' }}>
          <button className="row" style={{ padding: '12px 0', fontSize: 19 }} onClick={() => method === 'venue' && setMethod('visa')}>
            <span className={cx('radio', method !== 'venue' && 'on')} /> {t('Pay now', 'Plătește acum')}
          </button>
          {method !== 'venue' && (
            <div className="col" style={{ gap: 0, paddingLeft: 40 }}>
              <button className="row" style={{ padding: '12px 0', fontWeight: method === 'visa' ? 600 : 400, color: method === 'visa' ? 'var(--ink)' : 'var(--ink-2)' }} onClick={() => setMethod('visa')}>
                <CreditCard size={22} /> <span className="grow" style={{ textAlign: 'left' }}>Visa {t('ending', 'terminat în')} 4417</span>
                {method === 'visa' && <Check size={22} />}
              </button>
              <button className="row" style={{ padding: '12px 0', fontWeight: method === 'apple' ? 600 : 400, color: method === 'apple' ? 'var(--ink)' : 'var(--ink-2)' }} onClick={() => setMethod('apple')}>
                <Smartphone size={22} /> <span className="grow" style={{ textAlign: 'left' }}>Apple Pay</span>
                {method === 'apple' && <Check size={22} />}
              </button>
              <button className="row muted" style={{ padding: '12px 0' }}>
                <Plus size={22} /> {t('Add a card', 'Adaugă un card')}
              </button>
            </div>
          )}
          {v.settings.payment === 'both' && (
            <>
              <hr className="divider" />
              <button className="row" style={{ padding: '14px 0', fontSize: 19 }} onClick={() => setMethod('venue')}>
                <span className={cx('radio', method === 'venue' && 'on')} /> {t('Pay at the venue', 'Plătește la bază')}
              </button>
            </>
          )}
        </div>
        <div className="card row">
          <Users size={24} strokeWidth={1.7} />
          <div className="grow">
            <div style={{ fontSize: 17, fontWeight: 500 }}>{t('Open this game to other players', 'Deschide meciul pentru alți jucători')}</div>
            <div className="muted small">{t('You can do it later too', 'O poți face și mai târziu')}</div>
          </div>
          <Toggle on={openGame} onChange={setOpenGame} />
        </div>
      </div>
      <div className="bottom-bar narrow">
        <div className="inner">
          <button className={cx('btn primary lg block', busy && 'disabled')} onClick={pay}>
            {busy
              ? t('Processing…', 'Se procesează…')
              : method === 'venue'
                ? t('Book · pay at the venue', 'Rezervă · plătesc la bază')
                : `${t('Pay', 'Plătește')} ${fmtMoney(price)}`}
          </button>
        </div>
      </div>
      <Sheet
        open={ageOpen}
        onClose={() => setAgeOpen(false)}
        title={t('One last thing', 'Încă un lucru')}
        footer={
          <button
            className={cx('btn primary block lg', !dob && 'disabled')}
            onClick={() => {
              update((d) => {
                d.me.ageOk = true
              })
              setAgeOpen(false)
              toast(t('Thanks, you can pay now', 'Mulțumim, acum poți plăti'))
            }}
          >
            {t('Confirm', 'Confirmă')}
          </button>
        }
      >
        <p className="muted" style={{ fontSize: 16 }}>
          {t('You signed up with email, so we need your date of birth before your first payment. Players must be 16 or older to pay in the app.', 'Te-ai înregistrat cu emailul, așa că avem nevoie de data nașterii înainte de prima plată. Pentru plata în aplicație trebuie să ai cel puțin 16 ani.')}
        </p>
        <input className="input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
      </Sheet>
    </div>
  )
}

export function Booked() {
  const { id } = useParams()
  const [q] = useSearchParams()
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const b = bookingOf(s, id!)
  if (!b) return null
  const v = venue(s, b.venueId)
  const c = court(v, b.courtId)
  const view = q.get('view') === '1'
  const game = b.gameId ? s.games.find((g) => g.id === b.gameId) : undefined
  return (
    <div className="p-page narrow col" style={{ gap: 18, paddingTop: view ? 0 : 50, minHeight: '100dvh' }}>
      {view ? (
        <TopBar back={-1} title={t('Your booking', 'Rezervarea ta')} narrow />
      ) : (
        <>
          <div style={{ width: 96, height: 96, borderRadius: 99, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            <Check size={46} strokeWidth={2.6} />
          </div>
          <h1 className="center" style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>
            {t("You're booked!", 'Ai rezervat!')}
          </h1>
        </>
      )}
      <div className="card col" style={{ gap: 6 }}>
        <div className="row between">
          <b style={{ fontSize: 20 }}>
            {sportName(t, c.sport)} · {courtName(t, c.name)}
          </b>
          <span className={cx('badge', b.pay !== 'online' && 'amber')}>{b.pay === 'online' ? t('Paid', 'Plătit') : t('Pay at the venue', 'Plată la bază')}</span>
        </div>
        <div style={{ fontSize: 18 }}>
          {fmtDate(lang, b.date)}, {hm(b.start)}–{hm(b.start + b.dur)}
        </div>
        <div className="muted small">
          {v.name} · {v.address}
        </div>
      </div>
      {game ? (
        <button className="soft-card row" style={{ textAlign: 'left' }} onClick={() => nav(`/app/game/${game.id}`)}>
          <div className="grow">
            <div className="bold" style={{ fontSize: 19 }}>
              {t('Your game is open', 'Meciul tău e deschis')}
            </div>
            <div style={{ fontSize: 17 }}>
              {game.players.length} {t('of', 'din')} {game.size} {t('players', 'jucători')}
            </div>
          </div>
          <ChevronRight size={22} />
        </button>
      ) : (
        <button className="soft-card row" style={{ textAlign: 'left' }} onClick={() => nav(`/app/open/${b.id}`)}>
          <div className="grow">
            <div className="bold" style={{ fontSize: 19 }}>
              {t('Need players?', 'Ai nevoie de jucători?')}
            </div>
            <div style={{ fontSize: 17 }}>{t('Open your game to others', 'Deschide meciul pentru alții')}</div>
          </div>
          <ChevronRight size={22} />
        </button>
      )}
      <div className="row" style={{ gap: 12 }}>
        <button className="btn soft grow" style={{ height: 56 }}>
          <Upload size={20} /> {t('Invite friends', 'Invită prieteni')}
        </button>
        <button className="btn soft grow" style={{ height: 56 }}>
          <CalendarPlus size={20} /> {t('Add to calendar', 'Adaugă în calendar')}
        </button>
      </div>
      <div className="center muted small">
        {t('Confirmation sent to', 'Confirmare trimisă la')} {(s.me.email || 'iarina@…').replace(/@.*/, '@…')}
      </div>
      <div className="grow" />
      <button className="btn dark block lg" style={{ marginBottom: 24 }} onClick={() => nav('/app/home', { replace: true })}>
        {t('Done', 'Gata')}
      </button>
    </div>
  )
}

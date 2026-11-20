import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Minus, Plus, Navigation, Upload, ChevronRight, MoreHorizontal, Check, CreditCard, Info } from 'lucide-react'
import { useDemo, update, bookingOf, venue, court, player, share, gameOf, ME, uid, getState } from '../lib/store'
import { fmtDate, fmtMoney, useLang, useT } from '../lib/i18n'
import { hm, todayISO, nowMin } from '../lib/time'
import type { DemoState, Game, Sport } from '../lib/types'
import { Avatar, Chips, Sheet, Toggle, courtName, cx, photoUrl, surfaceName, toast } from '../ui'
import { PlayerShell } from './PlayerApp'
import { TopBar, formatName, gameInfo, levelLabel, myRole } from './common'
import { openToMe, joinInstant } from './Home'

const MAX: Record<Sport, number> = { tennis: 4, football: 10, basketball: 6, volleyball: 12 }
const GUEST = '+guest'

function nameOf(s: DemoState, id: string, t: ReturnType<typeof useT>) {
  if (id === GUEST) return t("Iarina's friend", 'Prietenul Iarinei')
  if (id === ME) return t('You', 'Tu')
  return player(s, id).first
}

/* ---------------- host: open the game (3 steps) ---------------- */
export function OpenFlow() {
  const { id } = useParams()
  const [q] = useSearchParams()
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const b = bookingOf(s, id!)!
  const v = venue(s, b.venueId)
  const c = court(v, b.courtId)
  const existing = b.gameId ? gameOf(s, b.gameId) : undefined
  const edit = q.get('edit') === '1' && existing
  const max = MAX[c.sport]
  const [step, setStep] = useState(edit ? 2 : 1)
  const [need, setNeed] = useState(existing ? existing.size - 1 : max - 1)
  const [lo, setLo] = useState(existing?.levelMin ?? 2.5)
  const [hi, setHi] = useState(existing?.levelMax ?? 4.0)
  const [competitive, setCompetitive] = useState(existing?.competitive ?? true)
  const [approve, setApprove] = useState(existing?.approve ?? true)
  const [payOnline, setPayOnline] = useState(existing?.payOnline ?? true)
  const myLevel = player(s, ME).level
  const size = need + 1
  const realSize = c.sport === 'tennis' && size === 3 ? 4 : size
  const each = Math.round(b.price / realSize)
  const format: Game['format'] = c.sport === 'tennis' ? (realSize === 2 ? 'singles' : 'doubles') : 'team'
  const sum = `${fmtDate(lang, b.date)} · ${hm(b.start)}–${hm(b.start + b.dur)} · ${courtName(t, c.name)}`

  const finish = () => {
    let gid = existing?.id
    update((d) => {
      const bk = d.bookings.find((x) => x.id === b.id)!
      const g = existing ? d.games.find((x) => x.id === existing.id)! : undefined
      const fields = { size: realSize, format, levelMin: lo, levelMax: hi, competitive, approve, payOnline }
      if (g) Object.assign(g, fields, { closed: false })
      else {
        gid = `g_${uid()}`
        d.games.push({
          id: gid,
          bookingId: b.id,
          hostId: ME,
          players: c.sport === 'tennis' && size === 3 ? [ME, GUEST] : [ME],
          requests: [],
          declined: [],
          closed: false,
          createdAt: Date.now(),
          ...fields,
        })
        bk.gameId = gid
      }
    })
    toast(edit ? t('Game updated', 'Meci actualizat') : t('Your game is open to players nearby', 'Meciul tău e deschis jucătorilor din apropiere'))
    nav(`/app/game/${gid}`, { replace: true })
  }

  const pct = (x: number) => ((x - 1) / 6) * 100

  return (
    <div style={{ paddingBottom: 120 }}>
      <div className="p-topbar narrow" style={{ justifyContent: 'space-between' }}>
        {step > 1 && !(edit && step === 2) ? (
          <button className="btn ghost sm" onClick={() => setStep(step - 1)}>
            {t('Back', 'Înapoi')}
          </button>
        ) : (
          <button className="btn ghost sm" onClick={() => (edit ? nav(-1) : nav(`/app/booked/${b.id}`, { replace: true }))}>
            {edit ? t('Cancel', 'Renunță') : t('Not now', 'Nu acum')}
          </button>
        )}
        <div className="step-dots">
          {[1, 2, 3].map((i) => (
            <span key={i} className={cx(i <= step && 'on')} />
          ))}
        </div>
        <span style={{ width: 80 }} />
      </div>
      <div className="p-page narrow col" style={{ gap: 20, paddingTop: 10 }}>
        {step === 1 && (
          <>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>{t('How many players do you need?', 'De câți jucători ai nevoie?')}</h1>
              <p className="muted" style={{ marginTop: 8 }}>
                {sum} · {t('up to', 'maxim')} {max} {t('players', 'jucători')}
              </p>
            </div>
            <div className="card col" style={{ alignItems: 'center', gap: 10, padding: 30 }}>
              <div className="stepper">
                <button onClick={() => setNeed(Math.max(1, need - 1))} aria-label="Fewer">
                  <Minus size={26} />
                </button>
                <span className="n">{need}</span>
                <button onClick={() => setNeed(Math.min(max - 1, need + 1))} aria-label="More">
                  <Plus size={26} />
                </button>
              </div>
              <div className="muted">{need === 1 ? t('player', 'jucător') : t('players', 'jucători')}</div>
              <div className="row" style={{ marginTop: 10, gap: 6 }}>
                <Avatar name="I" dark size="sm" />
                {c.sport === 'tennis' && size === 3 && <Avatar name="+" size="sm" />}
                {Array.from({ length: c.sport === 'tennis' && size === 3 ? 2 : need }, (_, i) => (
                  <span key={i} className="avatar sm empty">
                    +
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 17 }}>
                {c.sport === 'tennis' && size === 3
                  ? t('You, a friend + 2 open spots', 'Tu, un prieten + 2 locuri libere')
                  : `${t('You', 'Tu')} + ${need} ${need === 1 ? t('open spot', 'loc liber') : t('open spots', 'locuri libere')}`}
              </div>
            </div>
            <div className="card row between">
              <span>{t('Each player pays their share', 'Fiecare jucător își plătește partea')}</span>
              <b style={{ fontSize: 20 }}>{fmtMoney(each)}</b>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>{t('Who are you looking for?', 'Pe cine cauți?')}</h1>
              <p className="muted" style={{ marginTop: 8 }}>
                {t("Players outside the range can still ask, you'll see their level.", 'Jucătorii din afara intervalului pot cere totuși; le vei vedea nivelul.')}
              </p>
            </div>
            <div className="card col" style={{ gap: 18 }}>
              <div className="row between">
                <span className="bold">{t('Level range', 'Interval de nivel')}</span>
                <b style={{ fontSize: 20 }}>
                  {lo.toFixed(1)} – {hi.toFixed(1)}
                </b>
              </div>
              <div className="range">
                <div className="track" />
                <div className="fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
                <div className="me" style={{ left: `calc(${pct(myLevel)}% - 1px)` }} />
                <input type="range" min={1} max={7} step={0.5} value={lo} onChange={(e) => setLo(Math.min(Number(e.target.value), hi - 0.5))} aria-label="Minimum level" />
                <input type="range" min={1} max={7} step={0.5} value={hi} onChange={(e) => setHi(Math.max(Number(e.target.value), lo + 0.5))} aria-label="Maximum level" />
              </div>
              <div className="row between muted small">
                <span>1.0</span>
                <span style={{ color: 'var(--green-600)', fontWeight: 600 }}>
                  {t('Your level', 'Nivelul tău')} · {myLevel.toFixed(1)}
                </span>
                <span>7.0</span>
              </div>
            </div>
            <span className="label" style={{ marginBottom: -10 }}>
              {t('Match type', 'Tip de meci')}
            </span>
            <div className="row" style={{ gap: 12, alignItems: 'stretch' }}>
              <button className={cx('choice grow', competitive && 'on')} onClick={() => setCompetitive(true)}>
                <div>
                  <h4>{t('Competitive', 'Competitiv')}</h4>
                  <p>{t('Result counts for levels', 'Rezultatul contează pentru nivel')}</p>
                </div>
              </button>
              <button className={cx('choice grow', !competitive && 'on')} onClick={() => setCompetitive(false)}>
                <div>
                  <h4>{t('Casual', 'Relaxat')}</h4>
                  <p>{t('Just for fun, no pressure', 'Doar pentru distracție, fără presiune')}</p>
                </div>
              </button>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: -0.6 }}>{t('How do players join?', 'Cum intră jucătorii?')}</h1>
            <button className={cx('choice', !approve && 'on')} onClick={() => setApprove(false)}>
              <span className={cx('radio', !approve && 'on')} />
              <div>
                <h4>{t('Instantly', 'Instant')}</h4>
                <p>{t('First come, first served. Fills fastest.', 'Primul venit, primul servit. Se umple cel mai repede.')}</p>
              </div>
            </button>
            <button className={cx('choice', approve && 'on')} onClick={() => setApprove(true)}>
              <span className={cx('radio', approve && 'on')} />
              <div>
                <h4>{t('I approve each request', 'Aprob fiecare cerere')}</h4>
                <p>{t('You see their level and reliability first.', 'Le vezi întâi nivelul și seriozitatea.')}</p>
              </div>
            </button>
            <div className="card row">
              <div className="grow">
                <div className="bold">{t('Players pay their share online', 'Jucătorii își plătesc partea online')}</div>
                <div className="muted small">
                  {fmtMoney(each)} {t('each, refunded to you as they join', 'fiecare, returnați ție pe măsură ce intră')}
                </div>
              </div>
              <Toggle on={payOnline} onChange={setPayOnline} />
            </div>
            <div className="soft-card">
              <div className="small muted">{t('Your game', 'Meciul tău')}</div>
              <div className="bold" style={{ fontSize: 17, marginTop: 4 }}>
                {formatName(t, { format } as Game, c.sport)} · {fmtDate(lang, b.date)} {hm(b.start)} · {need} {need === 1 ? t('spot', 'loc') : t('spots', 'locuri')} ·{' '}
                {lo <= 1 && hi >= 7 ? t('Any level', 'Orice nivel') : `${t('Level', 'Nivel')} ${lo.toFixed(1)}–${hi.toFixed(1)}`} · {competitive ? t('Competitive', 'Competitiv') : t('Casual', 'Relaxat')}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="bottom-bar narrow">
        <div className="inner">
          {step < 3 ? (
            <button className="btn primary lg block" onClick={() => setStep(step + 1)}>
              {t('Next', 'Continuă')}
            </button>
          ) : (
            <button className="btn primary lg block" onClick={finish}>
              {edit ? t('Save changes', 'Salvează') : t('Open game', 'Deschide meciul')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- shared bits ---------------- */
function PlayerList({ g, highlightMe }: { g: Game; highlightMe?: boolean }) {
  const s = useDemo()
  const t = useT()
  const rows = [...g.players]
  const req = g.requests.find((r) => r.playerId === ME)
  return (
    <div className="card" style={{ padding: '10px 22px' }}>
      <div className="bold" style={{ padding: '8px 0' }}>
        {t('Players', 'Jucători')} · {g.players.length} {t('of', 'din')} {g.size}
      </div>
      <div className="list">
        {rows.map((id) => {
          const p = id === GUEST ? null : player(s, id)
          const host = id === g.hostId
          return (
            <div key={id} className="player-row">
              <Avatar name={p?.first ?? '+'} dark={host} />
              <div className="grow">
                <div style={{ fontSize: 17, fontWeight: 500 }}>
                  {id === ME ? `${p!.first} · ${t('you', 'tu')}` : nameOf(s, id, t)}
                  {host && ` · ${t('Host', 'Gazdă')}`}
                </div>
                {p && host && (
                  <div className="muted small">
                    {p.rel}% {t('shows up', 'prezență')}
                  </div>
                )}
              </div>
              {p && <span className="badge outline">{p.level.toFixed(1)}</span>}
            </div>
          )
        })}
        {req && highlightMe && (
          <div className="player-row">
            <Avatar name={player(s, ME).first} />
            <div className="grow">
              <div style={{ fontSize: 17, fontWeight: 500 }}>
                {t('You', 'Tu')} · {t('waiting for', 'aștepți răspunsul lui')} {player(s, g.hostId).first}
              </div>
            </div>
            <span className="badge outline">{player(s, ME).level.toFixed(1)}</span>
          </div>
        )}
        {Array.from({ length: Math.max(0, g.size - g.players.length - (req && highlightMe ? 1 : 0)) }, (_, i) => (
          <div key={i} className="player-row">
            <span className="avatar empty">+</span>
            <span className="muted grow">{t('Open spot', 'Loc liber')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function mapsUrl(address: string, city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`
}

function shareGame(t: ReturnType<typeof useT>) {
  const url = window.location.href
  if (navigator.share) navigator.share({ title: 'Courtal', url }).catch(() => {})
  else {
    navigator.clipboard?.writeText(url).catch(() => {})
    toast(t('Link copied', 'Link copiat'))
  }
}

const answerTimers = new Map<string, number>()
function scheduleHostAnswer(gameId: string, t: ReturnType<typeof useT>) {
  if (answerTimers.has(gameId)) return
  const h = window.setTimeout(() => {
    answerTimers.delete(gameId)
    const s = getState()
    const g = gameOf(s, gameId)
    if (!g || !g.requests.some((r) => r.playerId === ME)) return
    update((d) => {
      const x = d.games.find((y) => y.id === gameId)!
      x.requests = x.requests.filter((r) => r.playerId !== ME)
      x.players.push(ME)
    })
    toast(`${player(s, g.hostId).first} ${t('accepted your request. You’re in!', 'ți-a acceptat cererea. Ești în joc!')}`)
  }, 20000)
  answerTimers.set(gameId, h)
}

/* ---------------- game details: host / guest / member ---------------- */
export function GameView() {
  const { id } = useParams()
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const g = gameOf(s, id!)
  const [ask, setAsk] = useState(false)
  const [sent, setSent] = useState(false)
  const [leave, setLeave] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [payMode, setPayMode] = useState<'online' | 'venue'>('online')
  const [msg, setMsg] = useState('')
  if (!g) return null
  const { b, v, c, sport, spotsLeft } = gameInfo(s, g)
  const role = myRole(g)
  const host = player(s, g.hostId)
  const each = share(s, g)
  const me = player(s, ME)
  const inRange = me.level >= g.levelMin && me.level <= g.levelMax
  const full = spotsLeft <= 0
  const hoursBefore = ((new Date(b.date + 'T00:00:00').getTime() + b.start * 60000 - Date.now()) / 3600000) | 0

  const header = `${formatName(t, g, sport)} · ${fmtDate(lang, b.date)}, ${hm(b.start)}`
  const sub = `${hm(b.start)}–${hm(b.start + b.dur)} · ${courtName(t, c.name)} · ${c.indoor ? t('indoor', 'interior') : t('outdoor', 'exterior')} ${surfaceName(t, c.surface)}`

  const chips = (
    <div className="chips">
      <span className="badge">{g.competitive ? t('Competitive', 'Competitiv') : t('Casual', 'Relaxat')}</span>
      <span className="badge outline">
        {levelLabel(t, g)}
        {role !== 'host' && ` · ${t("you're", 'tu ai')} ${me.level.toFixed(1)}`}
      </span>
      <span className="badge outline">{g.approve ? (role === 'host' ? t('You approve', 'Tu aprobi') : t('Host approves', 'Gazda aprobă')) : t('Instant join', 'Intrare instant')}</span>
    </div>
  )

  const venueCard = (
    <div className="card row">
      <div className="photo" style={{ width: 64, height: 64, borderRadius: 16, flex: 'none' }}>
        <img src={photoUrl(v.cover)} alt="" />
      </div>
      <div className="grow">
        <div className="bold">{v.name}</div>
        <div className="muted small">
          {v.address} · {v.km.toFixed(1).replace('.0', '')} km
        </div>
      </div>
      <a className="btn soft sm" style={{ padding: '0 12px' }} href={mapsUrl(v.address, v.city)} target="_blank" rel="noreferrer" aria-label={t('Directions', 'Indicații')}>
        <Navigation size={16} /> <span className="hide-sm">{t('Directions', 'Indicații')}</span>
      </a>
    </div>
  )

  if (role === 'host') {
    const reqs = g.requests
    const paidBack = each * (g.players.length - 1)
    return (
      <div style={{ paddingBottom: 130 }}>
        <TopBar back="/app/home" title={t('Your game', 'Meciul tău')} />
        <div className="p-page g-layout" style={{ paddingTop: 6 }}>
          <div className="col" style={{ gap: 16 }}>
            <div className="card col" style={{ gap: 8 }}>
              <div className="row between">
                <b style={{ fontSize: 20 }}>
                  {formatName(t, g, sport)} · {courtName(t, c.name)}
                </b>
                <span className={cx('badge', g.closed ? 'gray' : full ? 'dark' : '')}>{g.closed ? t('Closed', 'Închis') : full ? t('Full', 'Complet') : t('Open', 'Deschis')}</span>
              </div>
              <div style={{ fontSize: 18 }}>
                {fmtDate(lang, b.date)}, {hm(b.start)}–{hm(b.start + b.dur)}
              </div>
              <div className="muted small">
                {v.name} · {v.address} ·{' '}
                <a className="link" href={mapsUrl(v.address, v.city)} target="_blank" rel="noreferrer">
                  {t('Directions', 'Indicații')}
                </a>
              </div>
              <div style={{ marginTop: 6 }}>{chips}</div>
            </div>
            {reqs.length > 0 && (
              <button className="soft-card row" style={{ textAlign: 'left' }} onClick={() => nav(`/app/game/${g.id}/manage?tab=requests`)}>
                <span className="avatar dark">{reqs.length}</span>
                <div className="grow">
                  <div className="bold">
                    {reqs.length} {reqs.length === 1 ? t('player asked to join', 'jucător a cerut să intre') : t('players asked to join', 'jucători au cerut să intre')}
                  </div>
                  <div className="small">
                    {player(s, reqs[0].playerId).first} · {t('Level', 'Nivel')} {player(s, reqs[0].playerId).level.toFixed(1)} · {player(s, reqs[0].playerId).rel}% {t('shows up', 'prezență')}
                  </div>
                </div>
                <span className="btn dark sm">{t('Manage', 'Gestionează')}</span>
              </button>
            )}
            <PlayerList g={g} />
          </div>
          <div className="col" style={{ gap: 16 }}>
            <div className="card col" style={{ gap: 10 }}>
              <div className="bold">{t('Payment', 'Plată')}</div>
              <div className="row between">
                <span>{b.pay === 'online' ? t('Court · paid by you', 'Teren · plătit de tine') : t('Court · pay at the venue', 'Teren · plată la bază')}</span>
                <b>{fmtMoney(b.price)}</b>
              </div>
              {g.payOnline && (
                <div className="row between muted">
                  <span>
                    {full ? t('Back to you from players', 'Primit înapoi de la jucători') : `${t('Back to you when', 'Îți revin când intră')} ${g.size - 1} ${t('players join', 'jucători')}`}
                  </span>
                  <b>{fmtMoney(full ? paidBack : each * (g.size - 1))}</b>
                </div>
              )}
              {!g.payOnline && <div className="muted small">{t('Players pay their share at the venue.', 'Jucătorii își plătesc partea la bază.')}</div>}
            </div>
            <button className="card row" style={{ textAlign: 'left' }} onClick={() => nav(`/app/game/${g.id}/manage`)}>
              <span className="grow bold">{t('Manage players', 'Gestionează jucătorii')}</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="bottom-bar">
          <div className="inner">
            {full ? (
              <a className="btn primary lg grow" href={mapsUrl(v.address, v.city)} target="_blank" rel="noreferrer">
                <Navigation size={20} /> {t('Directions', 'Indicații')}
              </a>
            ) : (
              <button className="btn primary lg grow" style={{ flexBasis: 0 }} onClick={() => shareGame(t)}>
                <Upload size={20} /> {t('Share game', 'Distribuie meciul')}
              </button>
            )}
            <button
              className="btn outline lg grow"
              style={{ flexBasis: 0 }}
              onClick={() => {
                update((d) => {
                  const x = d.games.find((y) => y.id === g.id)!
                  x.closed = !x.closed
                })
                toast(g.closed ? t('Open to new players again', 'Din nou deschis pentru jucători noi') : t('Closed to new players · requests paused', 'Închis pentru jucători noi · cereri oprite'))
              }}
            >
              {g.closed ? t('Reopen', 'Redeschide') : t('Close to new players', 'Închide pentru alții')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // guest, requested or member
  return (
    <div style={{ paddingBottom: 130 }}>
      <TopBar back={-1} title={header} sub={sub} />
      <div className="p-page g-layout" style={{ paddingTop: 6 }}>
        <div className="col" style={{ gap: 16 }}>
          {chips}
          {role === 'member' && (
            <div className="note">
              <Check size={20} style={{ flex: 'none' }} /> {t("You're in this game. Directions and a reminder come 1 h before.", 'Ești în acest meci. Indicațiile și un memento vin cu 1 h înainte.')}
            </div>
          )}
          {role === 'guest' && !inRange && (
            <div className="note amber">
              <Info size={20} style={{ flex: 'none' }} />
              {t(`Your level (${me.level.toFixed(1)}) is outside the range. You can still ask; ${host.first} will see your level.`, `Nivelul tău (${me.level.toFixed(1)}) e în afara intervalului. Poți cere totuși; ${host.first} îți va vedea nivelul.`)}
            </div>
          )}
          {venueCard}
          <PlayerList g={g} highlightMe />
        </div>
        <div className="col" style={{ gap: 16 }}>
          <div className="card col" style={{ gap: 6 }}>
            <div className="row between">
              <span className="bold" style={{ fontSize: 18 }}>
                {t('Your share', 'Partea ta')}
              </span>
              <b style={{ fontSize: 22 }}>{fmtMoney(each)}</b>
            </div>
            <div className="muted small">
              {t('Pay online or at the venue · leave free up to 6 h before', 'Plătești online sau la bază · poți renunța gratuit cu până la 6 h înainte')}
            </div>
          </div>
        </div>
      </div>
      <div className="bottom-bar">
        <div className="inner">
          {role === 'guest' &&
            (full || g.closed ? (
              <button className="btn outline lg block" onClick={() => nav('/app/players')}>
                {t('That spot just filled · More games', 'Locul tocmai s-a ocupat · Alte meciuri')}
              </button>
            ) : g.approve ? (
              <button className="btn primary lg block" onClick={() => setAsk(true)}>
                {t('Ask to join', 'Cere să intri')} · {fmtMoney(each)}
              </button>
            ) : (
              <button className="btn primary lg block" onClick={() => setJoinOpen(true)}>
                {t('Join game', 'Intră în meci')} · {fmtMoney(each)}
              </button>
            ))}
          {role === 'requested' && (
            <>
              <button
                className="btn outline lg grow"
                onClick={() => {
                  update((d) => {
                    const x = d.games.find((y) => y.id === g.id)!
                    x.requests = x.requests.filter((r) => r.playerId !== ME)
                  })
                  toast(t('Request withdrawn · nothing charged', 'Cerere retrasă · nu s-a încasat nimic'))
                }}
              >
                {t('Withdraw', 'Retrage cererea')}
              </button>
              <button className="btn primary lg grow" onClick={() => nav('/app/players')}>
                {t('More games', 'Alte meciuri')}
              </button>
            </>
          )}
          {role === 'member' && (
            <>
              <a className="btn primary lg grow" href={mapsUrl(v.address, v.city)} target="_blank" rel="noreferrer">
                <Navigation size={20} /> {t('Directions', 'Indicații')}
              </a>
              <button className="btn outline lg" onClick={() => setLeave(true)}>
                {t('Leave game', 'Ieși din meci')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ask to join (S42) */}
      <Sheet
        open={ask}
        onClose={() => setAsk(false)}
        title={t('Ask to join', 'Cere să intri')}
        footer={
          <button
            className="btn primary lg block"
            onClick={() => {
              update((d) => {
                const x = d.games.find((y) => y.id === g.id)!
                if (!x.requests.some((r) => r.playerId === ME)) x.requests.push({ playerId: ME, msg, at: Date.now(), pay: payMode })
              })
              setAsk(false)
              setSent(true)
              scheduleHostAnswer(g.id, t)
            }}
          >
            {t('Send request', 'Trimite cererea')}
          </button>
        }
      >
        <div className="muted">
          {formatName(t, g, sport)} · {fmtDate(lang, b.date)} {hm(b.start)} · {v.name} · {host.first} {t('approves requests', 'aprobă cererile')}
        </div>
        <div className="card row between">
          <span>{t('Your share', 'Partea ta')}</span>
          <b style={{ fontSize: 20 }}>{fmtMoney(each)}</b>
        </div>
        <div className="card col" style={{ gap: 2, padding: '8px 20px' }}>
          <button className="row" style={{ padding: '12px 0' }} onClick={() => setPayMode('online')}>
            <span className={cx('radio', payMode === 'online' && 'on')} />
            <span className="grow" style={{ textAlign: 'left' }}>
              {t('Pay now', 'Plătește acum')} · <CreditCard size={16} style={{ verticalAlign: -3 }} /> Visa 4417
            </span>
            <span className="muted tiny">{t('charged when accepted', 'se încasează la acceptare')}</span>
          </button>
          <hr className="divider" />
          <button className="row" style={{ padding: '12px 0' }} onClick={() => setPayMode('venue')}>
            <span className={cx('radio', payMode === 'venue' && 'on')} /> {t('Pay at the venue', 'Plătește la bază')}
          </button>
        </div>
        <div>
          <span className="label">
            {t('Say hi to', 'Salută-l pe')} {host.first} · {t('optional', 'opțional')}
          </span>
          <textarea className="textarea" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('e.g. I play doubles most weekends', 'ex. joc dublu aproape în fiecare weekend')} />
        </div>
        <div className="muted small">
          {t('Leave free up to 6 h before the game. Later than that counts against your reliability.', 'Poți renunța gratuit cu până la 6 h înainte. Mai târziu, îți afectează seriozitatea.')}
        </div>
      </Sheet>

      {/* Instant join */}
      <Sheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title={t('Join this game', 'Intră în acest meci')}
        footer={
          <button
            className="btn primary lg block"
            onClick={() => {
              joinInstant(g, t)
              setJoinOpen(false)
            }}
          >
            {payMode === 'online' ? `${t('Pay', 'Plătește')} ${fmtMoney(each)} · ${t('join', 'intră')}` : t('Join · pay at the venue', 'Intră · plătesc la bază')}
          </button>
        }
      >
        <div className="muted">
          {formatName(t, g, sport)} · {fmtDate(lang, b.date)} {hm(b.start)} · {v.name}
        </div>
        <div className="card col" style={{ gap: 2, padding: '8px 20px' }}>
          <button className="row" style={{ padding: '12px 0' }} onClick={() => setPayMode('online')}>
            <span className={cx('radio', payMode === 'online' && 'on')} /> {t('Pay now', 'Plătește acum')} · Visa 4417
          </button>
          <hr className="divider" />
          <button className="row" style={{ padding: '12px 0' }} onClick={() => setPayMode('venue')}>
            <span className={cx('radio', payMode === 'venue' && 'on')} /> {t('Pay at the venue', 'Plătește la bază')}
          </button>
        </div>
        <div className="muted small">{t('Leave free up to 6 h before the game.', 'Poți renunța gratuit cu până la 6 h înainte.')}</div>
      </Sheet>

      {/* Request sent (S41b intro) */}
      <Sheet open={sent} onClose={() => setSent(false)} footer={<button className="btn dark lg block" onClick={() => setSent(false)}>OK</button>}>
        <div className="col center" style={{ alignItems: 'center', paddingTop: 20, gap: 14 }}>
          <div style={{ width: 76, height: 76, borderRadius: 99, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={36} strokeWidth={2.6} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 600 }}>
            {t('Request sent to', 'Cerere trimisă către')} {host.first}
          </h2>
          <p className="muted" style={{ fontSize: 16 }}>
            {t(`We'll email you as soon as ${host.first} answers. Nothing is charged until then.`, `Îți trimitem un email imediat ce ${host.first} răspunde. Până atunci nu se încasează nimic.`)}
          </p>
        </div>
      </Sheet>

      {/* Leave game */}
      <Sheet
        open={leave}
        onClose={() => setLeave(false)}
        title={t('Leave game?', 'Ieși din meci?')}
        footer={
          <>
            <button className="btn outline grow" onClick={() => setLeave(false)}>
              {t('Stay', 'Rămân')}
            </button>
            <button
              className="btn danger grow"
              onClick={() => {
                update((d) => {
                  const x = d.games.find((y) => y.id === g.id)!
                  x.players = x.players.filter((p) => p !== ME)
                })
                setLeave(false)
                toast(t('You left the game · host and players emailed', 'Ai ieșit din meci · gazda și jucătorii au primit email'))
                nav('/app/home')
              }}
            >
              {t('Leave game', 'Ieși din meci')}
            </button>
          </>
        }
      >
        <p className="muted" style={{ fontSize: 16 }}>
          {hoursBefore >= 6
            ? t(`It's more than 6 h before the game, so your ${fmtMoney(each)} is refunded in full.`, `Mai sunt peste 6 h până la meci, așa că primești înapoi integral ${fmtMoney(each)}.`)
            : t('It’s less than 6 h before the game. Your share is not refunded and this counts against your reliability.', 'Mai sunt mai puțin de 6 h până la meci. Partea ta nu se returnează și îți afectează seriozitatea.')}
        </p>
      </Sheet>
    </div>
  )
}

/* ---------------- manage players (S44) ---------------- */
export function ManagePlayers() {
  const { id } = useParams()
  const [q] = useSearchParams()
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const g = gameOf(s, id!)
  const [tab, setTab] = useState<'players' | 'requests'>(q.get('tab') === 'requests' || (g && g.requests.length > 0) ? 'requests' : 'players')
  const [remove, setRemove] = useState<string | null>(null)
  if (!g) return null
  const { b, sport } = gameInfo(s, g)
  const each = share(s, g)
  const accept = (pid: string) => {
    const p = player(s, pid)
    const willBeFull = g.players.length + 1 >= g.size
    update((d) => {
      const x = d.games.find((y) => y.id === g.id)!
      x.requests = x.requests.filter((r) => r.playerId !== pid)
      if (!x.players.includes(pid)) x.players.push(pid)
    })
    toast(
      willBeFull
        ? t(`${p.first} joins · game full, everyone emailed`, `${p.first} intră · meci complet, toți au primit email`)
        : t(`${p.first} joins · ${fmtMoney(each)} charged · emails sent`, `${p.first} intră · ${fmtMoney(each)} încasați · emailuri trimise`),
    )
  }
  const decline = (pid: string) => {
    const p = player(s, pid)
    update((d) => {
      const x = d.games.find((y) => y.id === g.id)!
      x.requests = x.requests.filter((r) => r.playerId !== pid)
      x.declined.push(pid)
    })
    toast(t(`${p.first} was emailed · the spot stays open`, `${p.first} a primit email · locul rămâne liber`))
  }
  const mins = (at: number) => Math.max(1, Math.round((Date.now() - at) / 60000))
  return (
    <div style={{ paddingBottom: 60 }}>
      <TopBar
        back={`/app/game/${g.id}`}
        title={t('Manage players', 'Gestionează jucătorii')}
        sub={`${formatName(t, g, sport)} · ${fmtDate(lang, b.date)} ${hm(b.start)} · ${g.players.length} ${t('of', 'din')} ${g.size}`}
        right={
          <button className="btn outline sm" onClick={() => nav(`/app/open/${b.id}?edit=1`)}>
            {t('Edit', 'Editează')}
          </button>
        }
        narrow
      />
      <div className="p-page narrow col" style={{ gap: 16, paddingTop: 8 }}>
        <div className="seg" style={{ alignSelf: 'flex-start' }}>
          <button className={cx(tab === 'players' && 'on')} onClick={() => setTab('players')}>
            {t('Players', 'Jucători')}
          </button>
          <button className={cx(tab === 'requests' && 'on')} onClick={() => setTab('requests')}>
            {t('Requests', 'Cereri')} {g.requests.length > 0 && <span className="badge dark" style={{ height: 22, padding: '0 8px', marginLeft: 4 }}>{g.requests.length}</span>}
          </button>
        </div>
        {tab === 'requests' && (
          <>
            {g.requests.length === 0 && <div className="card muted center">{t('No requests waiting.', 'Nicio cerere în așteptare.')}</div>}
            {g.requests.map((r) => {
              const p = player(s, r.playerId)
              const ok = p.level >= g.levelMin && p.level <= g.levelMax
              return (
                <div key={r.playerId} className="card col" style={{ gap: 14 }}>
                  <div className="row">
                    <Avatar name={p.first} size="lg" />
                    <div className="grow">
                      <div className="bold" style={{ fontSize: 19 }}>
                        {p.first} {p.last[0]}.
                      </div>
                      <div className="muted small">
                        {t('Asked', 'A cerut acum')} {mins(r.at)} min {t('ago', '')} · {r.pay === 'online' ? t('pays online', 'plătește online') : t('pays at the venue', 'plătește la bază')}
                      </div>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <div className="stat">
                      <b>{p.level.toFixed(1)}</b>
                      <span>
                        {t('Level', 'Nivel')} · {ok ? t('in range', 'în interval') : t('outside range', 'în afara intervalului')}
                      </span>
                    </div>
                    <div className="stat">
                      <b>{p.rel}%</b>
                      <span>{t('shows up', 'prezență')}</span>
                    </div>
                    <div className="stat">
                      <b>{p.games}</b>
                      <span>{t('games', 'meciuri')}</span>
                    </div>
                  </div>
                  {r.msg && <div style={{ fontSize: 16, fontStyle: 'italic' }}>“{r.msg}”</div>}
                  <div className="row" style={{ gap: 10 }}>
                    <button className="btn outline grow" onClick={() => decline(r.playerId)}>
                      {t('Decline', 'Refuză')}
                    </button>
                    <button className={cx('btn primary grow', g.players.length >= g.size && 'disabled')} onClick={() => accept(r.playerId)}>
                      {t('Accept', 'Acceptă')}
                    </button>
                  </div>
                </div>
              )
            })}
          </>
        )}
        {tab === 'players' && (
          <div className="card" style={{ padding: '6px 22px' }}>
            <div className="bold" style={{ padding: '10px 0' }}>
              {t('In the game', 'În meci')}
            </div>
            <div className="list">
              {g.players.map((pid) => {
                const p = pid === GUEST ? null : player(s, pid)
                return (
                  <div key={pid} className="player-row">
                    <Avatar name={p?.first ?? '+'} dark={pid === g.hostId} />
                    <div className="grow">
                      <div style={{ fontWeight: 500 }}>
                        {pid === ME ? `${p!.first} · ${t('Host', 'Gazdă')} · ${t('you', 'tu')}` : nameOf(s, pid, t)}
                      </div>
                      <div className="muted small">{pid === g.hostId ? (b.pay === 'online' ? t('paid court', 'a plătit terenul') : t('pays court at venue', 'plătește terenul la bază')) : g.payOnline ? `${t('paid', 'a plătit')} ${fmtMoney(each)}` : t('pays at the venue', 'plătește la bază')}</div>
                    </div>
                    {p && <span className="badge outline">{p.level.toFixed(1)}</span>}
                    {pid !== g.hostId && (
                      <button className="icon-btn" onClick={() => setRemove(pid)} aria-label="More">
                        <MoreHorizontal size={20} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="muted small" style={{ padding: '12px 0' }}>
              {g.size - g.players.length} {t('open spots', 'locuri libere')} · {g.requests.length} {t('request waiting', 'cereri în așteptare')}
            </div>
          </div>
        )}
        <button className="btn primary lg block" onClick={() => shareGame(t)}>
          <Upload size={20} /> {t('Share game', 'Distribuie meciul')}
        </button>
      </div>
      <Sheet
        open={!!remove}
        onClose={() => setRemove(null)}
        title={t('Remove player?', 'Elimini jucătorul?')}
        footer={
          <>
            <button className="btn outline grow" onClick={() => setRemove(null)}>
              {t('Keep', 'Păstrează')}
            </button>
            <button
              className="btn danger grow"
              onClick={() => {
                const pid = remove!
                update((d) => {
                  const x = d.games.find((y) => y.id === g.id)!
                  x.players = x.players.filter((p) => p !== pid)
                })
                setRemove(null)
                toast(t('Player removed · refunded and emailed', 'Jucător eliminat · rambursat și anunțat pe email'))
              }}
            >
              {t('Remove', 'Elimină')}
            </button>
          </>
        }
      >
        <p className="muted" style={{ fontSize: 16 }}>
          {remove && remove !== GUEST
            ? t(`${player(s, remove).first} gets ${fmtMoney(each)} back and an email. The spot opens again.`, `${player(s, remove).first} primește înapoi ${fmtMoney(each)} și un email. Locul se eliberează.`)
            : t('The spot opens again.', 'Locul se eliberează.')}
        </p>
      </Sheet>
    </div>
  )
}

/* ---------------- players needed (S40) ---------------- */
export function PlayersNeeded() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const [f, setF] = useState<'all' | 'today' | 'level' | 'doubles'>('all')
  const sport = s.me.sport
  const me = player(s, ME)
  const today = todayISO()
  let games = openToMe(s, sport)
  if (f === 'today') games = games.filter((g) => bookingOf(s, g.bookingId)!.date === today)
  if (f === 'level') games = games.filter((g) => me.level >= g.levelMin && me.level <= g.levelMax)
  if (f === 'doubles') games = games.filter((g) => g.format === 'doubles')
  void nowMin
  const opts = [
    { v: 'all' as const, label: t('All', 'Toate') },
    { v: 'today' as const, label: t('Today', 'Azi') },
    { v: 'level' as const, label: t('My level', 'Nivelul meu') },
    ...(sport === 'tennis' || sport === 'all' ? [{ v: 'doubles' as const, label: t('Doubles', 'Dublu') }] : []),
  ]
  return (
    <PlayerShell tab="home">
      <TopBar back="/app/home" title={t('Players needed', 'Se caută jucători')} sub={`${t('Near you', 'Lângă tine')} · ${t('this week', 'săptămâna aceasta')}`} />
      <div className="p-page col" style={{ gap: 16, paddingTop: 4 }}>
        <Chips options={opts} value={f} onChange={setF} size="sm" />
        <div className="venue-grid">
          {games.map((g) => {
            const { b, v, sport: sp } = gameInfo(s, g)
            const each = share(s, g)
            return (
              <div key={g.id} className="open-card" role="button" style={{ cursor: 'pointer' }} onClick={() => nav(`/app/game/${g.id}`)}>
                <div className="photo">
                  <img src={photoUrl(v.cover)} alt="" loading="lazy" />
                </div>
                <div className="grow col" style={{ gap: 6 }}>
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <b style={{ fontSize: 18 }}>
                      {formatName(t, g, sp)} · {b.date === today ? t('Today', 'Azi') : fmtDate(lang, b.date).split(' ')[0]} {hm(b.start)}
                    </b>
                    <span className="badge outline">
                      {g.players.length} {t('of', 'din')} {g.size}
                    </span>
                  </div>
                  <div className="muted small">
                    {v.name} · {v.km.toFixed(1).replace('.0', '')} km · {levelLabel(t, g)} · {g.competitive ? t('Competitive', 'Competitiv') : t('Casual', 'Relaxat')}
                  </div>
                  <div className="row between" style={{ marginTop: 'auto' }}>
                    <span>
                      <b>{fmtMoney(each)}</b> <span className="muted small">{t('each', 'de persoană')}</span>
                    </span>
                    <button
                      className="btn primary sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (g.approve) nav(`/app/game/${g.id}`)
                        else joinInstant(g, t)
                      }}
                    >
                      {g.approve ? t('Ask to join', 'Cere să intri') : t('Join', 'Intră')}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {games.length === 0 && <div className="card muted center">{t('No games match this filter.', 'Niciun meci nu se potrivește filtrului.')}</div>}
      </div>
    </PlayerShell>
  )
}

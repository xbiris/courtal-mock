import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, Users, Trophy, GraduationCap } from 'lucide-react'
import { useDemo, update, ME, bookingOf, venue, court } from '../lib/store'
import { fmtDate, fmtMoney, fmtRel, useLang, useT } from '../lib/i18n'
import { addDays, hm, nowMin, todayISO, weekday } from '../lib/time'
import type { DemoState, Game } from '../lib/types'
import { courtName, cx, sportName, toast } from '../ui'
import { PlayerShell } from './PlayerApp'
import { SurfaceTag, formatName, gameInfo, levelLabel, myRole } from './common'

export function upcomingGames(s: DemoState) {
  const today = todayISO()
  const now = nowMin()
  return s.games
    .filter((g) => {
      const b = bookingOf(s, g.bookingId)
      if (!b || b.status === 'cancelled' || g.closed) return false
      if (b.date < today || (b.date === today && b.start < now)) return false
      return true
    })
    .sort((a, b) => {
      const x = bookingOf(s, a.bookingId)!
      const y = bookingOf(s, b.bookingId)!
      return x.date === y.date ? x.start - y.start : x.date < y.date ? -1 : 1
    })
}

export function openToMe(s: DemoState, sport: string) {
  return upcomingGames(s).filter((g) => {
    const { sport: sp, spotsLeft } = gameInfo(s, g)
    return myRole(g) === 'guest' && spotsLeft > 0 && (sport === 'all' || sp === sport)
  })
}

export function joinInstant(g: Game, t: (a: string, b: string) => string) {
  update((d) => {
    const x = d.games.find((y) => y.id === g.id)!
    if (!x.players.includes(ME)) x.players.push(ME)
  })
  toast(t("You're in! The host and players were emailed.", 'Ești în joc! Gazda și jucătorii au primit un email.'))
}

export function Home() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const sport = s.me.sport
  const games = openToMe(s, sport)
  const today = todayISO()
  const tonight = games.filter((g) => bookingOf(s, g.bookingId)!.date === today).length
  const sat = addDays(today, (5 - weekday(today) + 7) % 7 || 7)
  const learn = sport === 'all' ? t('Take a lesson', 'Ia o lecție') : `${t('Learn', 'Învață')} ${sportName(t, sport).toLowerCase()}`

  const mine = [
    ...s.bookings.filter((b) => b.playerId === ME && b.status === 'booked' && (b.date > today || (b.date === today && b.start + b.dur > nowMin()))),
  ]
  const joined = upcomingGames(s).filter((g) => ['member', 'requested'].includes(myRole(g)))

  return (
    <PlayerShell tab="home">
      <div className="p-page">
        <div className="band">
          {!s.me.sportPicked && (
            <button className="band-hint" onClick={() => window.dispatchEvent(new Event('open-sport-picker'))}>
              {t('Pick your sport to see the right courts and games.', 'Alege sportul ca să vezi terenurile și meciurile potrivite.')}
              <ChevronRight size={18} aria-hidden />
            </button>
          )}
          <h1>{t('Find your game!', 'Găsește-ți jocul!')}</h1>
          <button className="btn dark lg" onClick={() => nav('/app/courts')}>
            {t('Book a court', 'Rezervă un teren')} <ArrowRight size={22} />
          </button>
          <div className="meta">
            <span>
              {fmtDate(lang, today)} · {t('Bucharest', 'București')}
            </span>
            <span>
              {games.length} {games.length === 1 ? t('game needs players', 'meci caută jucători') : t('games need players', 'meciuri caută jucători')}
            </span>
          </div>
        </div>

        <div className="home-grid">
          <div>
            {(mine.length > 0 || joined.length > 0) && (
              <>
                <div className="section-title rule-head">
                  <h2>{t('Your games', 'Meciurile tale')}</h2>
                </div>
                <div className="ruled">
                  {mine.map((b) => {
                    const v = venue(s, b.venueId)
                    const c = court(v, b.courtId)
                    const g = b.gameId ? s.games.find((x) => x.id === b.gameId) : undefined
                    const reqs = g?.requests.length ?? 0
                    return (
                      <button key={b.id} className="mine-row" onClick={() => nav(g ? `/app/game/${g.id}` : `/app/booked/${b.id}?view=1`)}>
                        <span className="when">
                          {hm(b.start)}
                          <small>{fmtRel(lang, b.date)}</small>
                        </span>
                        <span>
                          <h3>{g ? formatName(t, g, c.sport) : sportName(t, c.sport)}</h3>
                          <div className="sub">
                            {v.name} · {courtName(t, c.name)}
                            {g && ` · ${g.players.length} ${t('of', 'din')} ${g.size}`}
                          </div>
                        </span>
                        {reqs > 0 ? <span className="badge dark">{reqs} {reqs === 1 ? t('request', 'cerere') : t('requests', 'cereri')}</span> : <ChevronRight size={20} />}
                      </button>
                    )
                  })}
                  {joined.map((g) => {
                    const { b, v, sport: sp } = gameInfo(s, g)
                    const host = s.players.find((p) => p.id === g.hostId)!
                    return (
                      <button key={g.id} className="mine-row" onClick={() => nav(`/app/game/${g.id}`)}>
                        <span className="when">
                          {hm(b.start)}
                          <small>{fmtRel(lang, b.date)}</small>
                        </span>
                        <span>
                          <h3>{formatName(t, g, sp)}</h3>
                          <div className="sub">
                            {v.name} · {t('with', 'cu')} {host.first}
                          </div>
                        </span>
                        {myRole(g) === 'requested' ? <span className="badge amber">{t('Waiting', 'În așteptare')}</span> : <span className="badge">{t("You're in", 'Ești în joc')}</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            <div className="ruled" style={{ marginTop: 28 }}>
              <button className="r-row" onClick={() => nav('/app/players')}>
                <Users size={24} strokeWidth={1.8} />
                <span className="grow">{t('Find a match', 'Găsește un meci')}</span>
                <span className="muted small num">
                  {tonight} {t('tonight', 'diseară')}
                </span>
                <ChevronRight size={20} />
              </button>
              <button className="r-row">
                <Trophy size={24} strokeWidth={1.8} />
                <span className="grow">{t('Join an event', 'Intră la un eveniment')}</span>
                <span className="muted small">{fmtDate(lang, sat)}</span>
                <ChevronRight size={20} />
              </button>
              <button className="r-row">
                <GraduationCap size={24} strokeWidth={1.8} />
                <span className="grow">{learn}</span>
                <span className="muted small">{t('from 80 lei', 'de la 80 lei')}</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="open-col">
            <div className="section-title rule-head">
              <h2>{t('Open games', 'Meciuri deschise')}</h2>
              <button className="bold small" onClick={() => nav('/app/players')}>
                {t('See all', 'Vezi toate')}
              </button>
            </div>
            <div className="ruled">
              {games.slice(0, 4).map((g) => (
                <GameRow key={g.id} g={g} />
              ))}
              {games.length === 0 && <div className="muted" style={{ padding: '18px 0' }}>{t('No open games for this sport right now.', 'Momentan nu sunt meciuri deschise pentru acest sport.')}</div>}
            </div>
          </div>
        </div>
      </div>
      <OsPrompts />
    </PlayerShell>
  )
}

/** One open game as a line of the draw: big start time, then one ruled line per seat. */
export function GameRow({ g }: { g: Game }) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const { b, v, c, sport, spotsLeft } = gameInfo(s, g)
  const kind = g.competitive ? levelLabel(t, g) : t('Casual', 'Relaxat')
  const each = Math.round(b.price / g.size)
  const names = g.players.map((id) => {
    const p = s.players.find((x) => x.id === id)
    return p ? `${p.first} ${p.last[0]}.` : '—'
  })
  const open = () => nav(`/app/game/${g.id}`)
  return (
    <div className="draw-row" role="button" tabIndex={0} onClick={open} onKeyDown={(e) => e.key === 'Enter' && open()}>
      <span className="when">
        {hm(b.start)}
        <small>{fmtRel(lang, b.date)}</small>
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="what">
          <SurfaceTag t={t} surface={c.surface} indoor={c.indoor} />
          <b>{formatName(t, g, sport)}</b>
          <span>
            {v.name} · {courtName(t, c.name)}
          </span>
        </div>
        <div className="seats" aria-label={`${spotsLeft} ${spotsLeft === 1 ? t('spot left', 'loc liber') : t('spots left', 'locuri libere')}`}>
          {names.map((n, i) => (
            <span key={i} className="seat">
              {n}
            </span>
          ))}
          {Array.from({ length: spotsLeft }, (_, i) => (
            <span key={`o${i}`} className={cx('seat open', i === 0 && 'first')}>
              {i === 0 ? t('your name here', 'numele tău aici') : t('open seat', 'loc liber')}
            </span>
          ))}
        </div>
        <div className="foot">
          <span>
            {kind} · <span className="num">{fmtMoney(each)}</span> {t('each', 'de persoană')}
          </span>
          <button
            className="btn dark"
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
}

function OsPrompts() {
  const s = useDemo()
  const t = useT()
  if (s.me.permsAsked) return null
  const step = s.me.permStep ?? 0
  const next = () =>
    update((d) => {
      if ((d.me.permStep ?? 0) >= 1) d.me.permsAsked = true
      else d.me.permStep = 1
    })
  return (
    <>
      <div className="scrim" style={{ zIndex: 79, background: 'rgba(0,0,0,0.35)' }} />
      {step === 0 ? (
        <div className="os-dialog">
          <div className="t">
            <b>{t('Allow “Courtal” to use your location?', 'Permiți aplicației „Courtal” să-ți folosească locația?')}</b>
            {t('Courtal shows courts and open games near you.', 'Courtal îți arată terenuri și meciuri deschise în apropiere.')}
          </div>
          <button onClick={next}>{t('Allow Once', 'Permite o dată')}</button>
          <button onClick={next}>{t('Allow While Using App', 'Permite cât folosesc aplicația')}</button>
          <button onClick={next}>{t('Don’t Allow', 'Nu permite')}</button>
        </div>
      ) : (
        <div className="os-dialog">
          <div className="t">
            <b>{t('“Courtal” Would Like to Send You Notifications', '„Courtal” dorește să-ți trimită notificări')}</b>
            {t('Booking reminders, join requests and game updates.', 'Mementouri, cereri de participare și noutăți despre meciuri.')}
          </div>
          <div style={{ display: 'flex' }}>
            <button onClick={next} style={{ borderRight: '1px solid rgba(60,60,67,0.2)' }}>
              {t('Don’t Allow', 'Nu permite')}
            </button>
            <button onClick={next} style={{ fontWeight: 600 }}>
              {t('Allow', 'Permite')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

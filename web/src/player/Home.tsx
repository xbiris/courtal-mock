import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, Users, Trophy, GraduationCap, CalendarDays } from 'lucide-react'
import { useDemo, update, ME, bookingOf, venue, court } from '../lib/store'
import { fmtDate, fmtRel, useLang, useT } from '../lib/i18n'
import { addDays, hm, nowMin, todayISO, weekday } from '../lib/time'
import type { DemoState, Game } from '../lib/types'
import { CourtLines, courtName, sportName, toast } from '../ui'
import { PlayerShell } from './PlayerApp'
import { formatName, gameInfo, levelLabel, myRole } from './common'

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
        <div className="hero">
          <CourtLines sport={sport === 'all' ? 'tennis' : sport} className="lines-home" />
          <h1>{t('Find your game.', 'Găsește-ți meciul.')}</h1>
          <button className="btn dark lg" onClick={() => nav('/app/courts')}>
            {t('Book a court', 'Rezervă un teren')} <ArrowRight size={22} />
          </button>
        </div>

        <div className="home-grid">
          <div>
            <div className="card quick list" style={{ marginTop: 22, padding: '4px 22px' }}>
              <button className="list-row" onClick={() => nav('/app/players')}>
                <Users size={26} strokeWidth={1.7} />
                <span className="grow">{t('Find a match', 'Găsește un meci')}</span>
                <span className="muted small">
                  {tonight} {t('tonight', 'diseară')}
                </span>
                <ChevronRight size={22} />
              </button>
              <button className="list-row">
                <Trophy size={26} strokeWidth={1.7} />
                <span className="grow">{t('Join an event', 'Intră la un eveniment')}</span>
                <span className="muted small">{fmtDate(lang, sat)}</span>
                <ChevronRight size={22} />
              </button>
              <button className="list-row">
                <GraduationCap size={26} strokeWidth={1.7} />
                <span className="grow">{learn}</span>
                <span className="muted small">{t('from 80 lei', 'de la 80 lei')}</span>
                <ChevronRight size={22} />
              </button>
            </div>

            {(mine.length > 0 || joined.length > 0) && (
              <>
                <div className="section-title">
                  <h2>{t('Your games', 'Meciurile tale')}</h2>
                </div>
                <div className="col">
                  {mine.map((b) => {
                    const v = venue(s, b.venueId)
                    const c = court(v, b.courtId)
                    const g = b.gameId ? s.games.find((x) => x.id === b.gameId) : undefined
                    const reqs = g?.requests.length ?? 0
                    return (
                      <button key={b.id} className="game-card" onClick={() => nav(g ? `/app/game/${g.id}` : `/app/booked/${b.id}?view=1`)}>
                        <CalendarDays size={26} strokeWidth={1.7} />
                        <div className="grow">
                          <h3>
                            {g ? formatName(t, g, c.sport) : sportName(t, c.sport)} · {fmtRel(lang, b.date)} {hm(b.start)}
                          </h3>
                          <div className="sub">
                            {v.name} · {courtName(t, c.name)}
                            {g && ` · ${g.players.length} ${t('of', 'din')} ${g.size}`}
                          </div>
                        </div>
                        {reqs > 0 && <span className="badge dark">{reqs} {reqs === 1 ? t('request', 'cerere') : t('requests', 'cereri')}</span>}
                        <ChevronRight size={22} />
                      </button>
                    )
                  })}
                  {joined.map((g) => {
                    const { b, v, sport: sp } = gameInfo(s, g)
                    const host = s.players.find((p) => p.id === g.hostId)!
                    return (
                      <button key={g.id} className="game-card" onClick={() => nav(`/app/game/${g.id}`)}>
                        <Users size={26} strokeWidth={1.7} />
                        <div className="grow">
                          <h3>
                            {formatName(t, g, sp)} · {fmtRel(lang, b.date)} {hm(b.start)}
                          </h3>
                          <div className="sub">
                            {v.name} · {t('with', 'cu')} {host.first}
                          </div>
                        </div>
                        {myRole(g) === 'requested' ? <span className="badge amber">{t('Waiting', 'În așteptare')}</span> : <span className="badge">{t("You're in", 'Ești în joc')}</span>}
                        <ChevronRight size={22} />
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div>
            <div className="section-title">
              <h2>{t('Games near you', 'Meciuri lângă tine')}</h2>
              <button className="bold" onClick={() => nav('/app/players')}>
                {t('See all', 'Vezi toate')}
              </button>
            </div>
            <div className="col">
              {games.slice(0, 4).map((g) => (
                <GameRow key={g.id} g={g} />
              ))}
              {games.length === 0 && <div className="card muted">{t('No open games for this sport right now.', 'Momentan nu sunt meciuri deschise pentru acest sport.')}</div>}
            </div>
          </div>
        </div>
      </div>
      <OsPrompts />
    </PlayerShell>
  )
}

function GameRow({ g }: { g: Game }) {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const { b, v, sport, spotsLeft } = gameInfo(s, g)
  const kind = g.competitive ? levelLabel(t, g) : t('Casual', 'Relaxat')
  return (
    <div className="game-card" role="button" onClick={() => nav(`/app/game/${g.id}`)} style={{ cursor: 'pointer' }}>
      <div className="grow">
        <h3>
          {formatName(t, g, sport)} · {fmtRel(lang, b.date)} {hm(b.start)}
        </h3>
        <div className="sub">
          {v.name} · {spotsLeft} {spotsLeft === 1 ? t('spot left', 'loc liber') : t('spots left', 'locuri libere')} · {kind}
        </div>
      </div>
      <button
        className="btn primary"
        style={{ height: 52, padding: '0 28px', fontSize: 18 }}
        onClick={(e) => {
          e.stopPropagation()
          if (g.approve) nav(`/app/game/${g.id}`)
          else joinInstant(g, t)
        }}
      >
        {t('Join', 'Intră')}
      </button>
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

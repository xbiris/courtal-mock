import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Check, House, Search, Globe, User } from 'lucide-react'
import './player.css'
import { useDemo, update } from '../lib/store'
import { useT } from '../lib/i18n'
import type { Sport } from '../lib/types'
import { Logo, SportIcon, sportName, cx } from '../ui'
import { presenterTap } from '../Presenter'
import { Welcome, EmailStep, CodeStep, ExistsStep } from './Auth'
import { Home } from './Home'
import { CourtsList, VenueScreen, Review, Booked } from './Booking'
import { OpenFlow, GameView, ManagePlayers, PlayersNeeded } from './Games'

export function PlayerApp() {
  const s = useDemo()
  const signed = s.me.signedIn
  return (
    <div className="p-app">
      <Routes>
        <Route index element={<Navigate to={signed ? 'home' : 'welcome'} replace />} />
        <Route path="welcome" element={<Welcome mode="signup" />} />
        <Route path="login" element={<Welcome mode="login" />} />
        <Route path="email" element={<EmailStep />} />
        <Route path="code" element={<CodeStep />} />
        <Route path="exists" element={<ExistsStep />} />
        <Route path="preview/:id" element={<VenueScreen />} />
        <Route path="*" element={signed ? <SignedIn /> : <Navigate to="/app/welcome" replace />} />
      </Routes>
    </div>
  )
}

function SignedIn() {
  return (
    <Routes>
      <Route path="home" element={<Home />} />
      <Route path="courts" element={<CourtsList />} />
      <Route path="venue/:id" element={<VenueScreen />} />
      <Route path="review" element={<Review />} />
      <Route path="booked/:id" element={<Booked />} />
      <Route path="open/:id" element={<OpenFlow />} />
      <Route path="game/:id" element={<GameView />} />
      <Route path="game/:id/manage" element={<ManagePlayers />} />
      <Route path="players" element={<PlayersNeeded />} />
      <Route path="*" element={<Navigate to="/app/home" replace />} />
    </Routes>
  )
}

export const SPORTS: (Sport | 'all')[] = ['all', 'tennis', 'football', 'basketball', 'volleyball']

export function SportPicker({ coach = true }: { coach?: boolean }) {
  const s = useDemo()
  const t = useT()
  const [open, setOpen] = useState(false)
  const cur = s.me.sport
  useEffect(() => {
    const o = () => setOpen(true)
    window.addEventListener('open-sport-picker', o)
    return () => window.removeEventListener('open-sport-picker', o)
  }, [])
  return (
    <>
      <button className="sport-pill" onClick={() => setOpen(!open)}>
        <SportIcon sport={cur} />
        {sportName(t, cur)}
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {coach && !s.me.sportPicked && !open && (
        <div className="coach" onClick={() => setOpen(true)}>
          {t('Pick your sport to see the right courts and games. You can switch any time.', 'Alege sportul ca să vezi terenurile și meciurile potrivite. Îl poți schimba oricând.')}
        </div>
      )}
      {open && (
        <>
          <div className="scrim blur" style={{ zIndex: 55 }} onClick={() => setOpen(false)} />
          <div className="sport-menu">
            {SPORTS.map((sp) => (
              <button
                key={sp}
                className={cx(cur === sp && 'on')}
                onClick={() => {
                  update((d) => {
                    d.me.sport = sp
                    if (sp !== 'all') d.me.sportPicked = true
                  })
                  setOpen(false)
                }}
              >
                <SportIcon sport={sp} />
                <span className="grow" style={{ textAlign: 'left' }}>
                  {sportName(t, sp)}
                </span>
                {cur === sp && <Check size={22} />}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

/** Header + bottom tabs for the main player screens */
export function PlayerShell({ children, tab }: { children: ReactNode; tab: 'home' | 'search' }) {
  const s = useDemo()
  const t = useT()
  const nav = useNavigate()
  const loc = useLocation()
  void loc
  const initial = s.me.signedIn ? 'I' : 'A'
  return (
    <>
      <div className={cx('p-header', tab === 'home' && 'on-band')}>
        <div className="row" style={{ gap: 28 }}>
          <button onClick={presenterTap} aria-label="Courtal">
            <Logo size={40} />
          </button>
          <nav className="nav hide-sm">
            <button className={cx(tab === 'home' && 'on')} onClick={() => nav('/app/home')}>
              <House size={20} /> {t('Home', 'Acasă')}
            </button>
            <button className={cx(tab === 'search' && 'on')} onClick={() => nav('/app/courts')}>
              <Search size={20} /> {t('Search', 'Caută')}
            </button>
            <button>
              <Globe size={20} /> {t('Explore', 'Explorează')}
            </button>
          </nav>
        </div>
        <div className="sport-slot" style={{ position: 'static' }}>
          <SportPicker coach={tab !== 'home'} />
        </div>
        <button className="avatar" style={{ width: 52, height: 52, fontSize: 19 }} aria-label="Profile">
          {initial}
        </button>
      </div>
      {children}
      <div className="tabbar hide-lg">
        <button className={cx(tab === 'home' && 'on')} onClick={() => nav('/app/home')}>
          <House size={24} strokeWidth={1.8} aria-hidden />
          {t('Home', 'Acasă')}
        </button>
        <button className={cx(tab === 'search' && 'on')} onClick={() => nav('/app/courts')}>
          <Search size={24} strokeWidth={1.8} aria-hidden />
          {t('Search', 'Caută')}
        </button>
        <button>
          <Globe size={24} strokeWidth={1.8} aria-hidden />
          {t('Explore', 'Explorează')}
        </button>
        <button>
          <User size={24} strokeWidth={1.8} aria-hidden />
          {t('Profile', 'Profil')}
        </button>
      </div>
    </>
  )
}

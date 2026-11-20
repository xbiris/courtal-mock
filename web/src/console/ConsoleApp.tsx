import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { CalendarDays, List, LayoutGrid, Shield, Banknote, Settings as SettingsIcon, Menu, Check, Plus, User, Languages, CircleHelp, LogOut, ChevronDown } from 'lucide-react'
import './console.css'
import { useDemo, update } from '../lib/store'
import { useT } from '../lib/i18n'
import { Logo, cx, usePop, toast } from '../ui'
import { presenterTap } from '../Presenter'
import { LangPill } from '../player/Auth'
import { Today } from './Today'
import { Bookings } from './Bookings'
import { Courts, PriceEditor, HoursEditor } from './Courts'
import { Policies } from './Policies'
import { Money } from './Money'
import { Settings } from './Settings'
import { Register, Onboarding, UnderReview } from './Onboarding'
import { useVenue } from './util'

export function ConsoleApp() {
  const s = useDemo()
  return (
    <Routes>
      <Route path="signin" element={<SignIn />} />
      <Route path="register" element={<Register />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="*" element={s.console.signedIn ? <Shell /> : <Navigate to="/console/signin" replace />} />
    </Routes>
  )
}

function Shell() {
  const [drawer, setDrawer] = useState(false)
  const t = useT()
  return (
    <div className="c-app">
      {drawer && <div className="scrim" style={{ zIndex: 65 }} onClick={() => setDrawer(false)} />}
      <Sidebar open={drawer} close={() => setDrawer(false)} />
      <main className="c-main">
        <div className="c-mobilebar">
          <button className="icon-btn outline" onClick={() => setDrawer(true)} aria-label={t('Menu', 'Meniu')}>
            <Menu size={22} />
          </button>
          <button onClick={presenterTap} aria-label="Courtal">
            <Logo size={30} word sub="Manage" />
          </button>
        </div>
        <Routes>
          <Route path="today" element={<Today />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="courts" element={<Courts />} />
          <Route path="courts/prices" element={<PriceEditor />} />
          <Route path="courts/hours" element={<HoursEditor />} />
          <Route path="policies" element={<Policies />} />
          <Route path="money" element={<Money />} />
          <Route path="settings" element={<Navigate to="/console/settings/profile" replace />} />
          <Route path="settings/:section" element={<Settings />} />
          <Route path="review" element={<UnderReview />} />
          <Route path="*" element={<Navigate to="/console/today" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const s = useDemo()
  const t = useT()
  const nav = useNavigate()
  const v = useVenue()
  const vp = usePop()
  const ap = usePop()
  const mine = s.venues.filter((x) => x.id === 'verde' || x.id.startsWith('new_'))
  const items = [
    { to: '/console/today', icon: CalendarDays, label: t('Today', 'Azi') },
    { to: '/console/bookings', icon: List, label: t('Bookings', 'Rezervări') },
    { to: '/console/courts', icon: LayoutGrid, label: t('Courts & prices', 'Terenuri și prețuri') },
    { to: '/console/policies', icon: Shield, label: t('Policies', 'Reguli') },
    { to: '/console/money', icon: Banknote, label: t('Money', 'Bani') },
    { to: '/console/settings', icon: SettingsIcon, label: t('Settings', 'Setări') },
  ]
  const statusLabel = v.status === 'live' ? t('Live', 'Activă') : v.status === 'paused' ? t('Paused', 'În pauză') : t('Under review', 'În verificare')
  return (
    <aside className={cx('c-side', open && 'open')}>
      <button onClick={presenterTap} style={{ alignSelf: 'flex-start', padding: '4px 6px' }} aria-label="Courtal">
        <Logo size={30} word sub="Manage" />
      </button>
      <div ref={vp.ref} style={{ position: 'relative' }}>
        <button className="c-venue" onClick={() => vp.setOpen(!vp.open)}>
          <span className="vlogo">{v.name[0]}</span>
          <span className="grow">
            <b className="ellipsis" style={{ display: 'block', fontSize: 14.5 }}>
              {v.name}
            </b>
            <span className="row tiny muted" style={{ gap: 6 }}>
              <span className={cx('dot', v.status === 'paused' && 'amber', v.status === 'review' && 'gray')} /> {statusLabel} · {v.courts.length} {t('courts', 'terenuri')}
            </span>
          </span>
          <ChevronDown size={16} />
        </button>
        {vp.open && (
          <div className="popover" style={{ top: 66, left: 0, right: 0 }}>
            {mine.map((x) => (
              <button
                key={x.id}
                className={cx('pop-item', x.id === v.id && 'on')}
                onClick={() => {
                  update((d) => {
                    d.console.venueId = x.id
                  })
                  vp.setOpen(false)
                  nav('/console/today')
                }}
              >
                <span className="grow">
                  <b style={{ display: 'block', fontSize: 14.5 }}>{x.name}</b>
                  <span className="tiny muted">
                    {x.status === 'live' ? `${t('Visible to players since', 'Vizibilă pentru jucători din')} ${x.liveSince ?? ''}` : x.status === 'paused' ? t('Paused', 'În pauză') : t('Under review', 'În verificare')}
                  </span>
                </span>
                {x.id === v.id && <Check size={18} />}
              </button>
            ))}
            <hr className="divider" style={{ margin: '6px 0' }} />
            <button className="pop-item" onClick={() => nav('/console/register')}>
              <Plus size={18} /> {t('Add another venue', 'Adaugă altă bază')}
            </button>
          </div>
        )}
      </div>
      <nav className="c-nav" onClick={close}>
        {items.map((i) => (
          <NavLink key={i.to} to={i.to} className={({ isActive }) => cx(isActive && 'active')}>
            <i.icon size={19} strokeWidth={1.8} /> {i.label}
          </NavLink>
        ))}
      </nav>
      <div className="grow" />
      <div ref={ap.ref} style={{ position: 'relative' }}>
        {ap.open && (
          <div className="popover" style={{ bottom: 62, left: 0, right: 0 }}>
            <button
              className="pop-item"
              onClick={() => {
                ap.setOpen(false)
                close()
                nav('/console/settings/me')
              }}
            >
              <User size={18} /> {t('My profile', 'Profilul meu')}
            </button>
            <div className="pop-item" style={{ justifyContent: 'space-between' }}>
              <span className="row" style={{ gap: 12 }}>
                <Languages size={18} /> {t('Language', 'Limbă')}
              </span>
              <LangPill />
            </div>
            <button
              className="pop-item"
              onClick={() => {
                ap.setOpen(false)
                close()
                nav('/console/settings/help')
              }}
            >
              <CircleHelp size={18} /> {t('Help', 'Ajutor')}
            </button>
            <hr className="divider" style={{ margin: '6px 0' }} />
            <button
              className="pop-item"
              onClick={() => {
                update((d) => {
                  d.console.signedIn = false
                })
                toast(t('Logged out', 'Te-ai deconectat'))
                nav('/console/signin')
              }}
            >
              <LogOut size={18} /> {t('Log out', 'Deconectare')}
            </button>
          </div>
        )}
        <button className="row" style={{ width: '100%', padding: '8px 6px', borderRadius: 14, textAlign: 'left' }} onClick={() => ap.setOpen(!ap.open)}>
          <span className="avatar sm">{s.console.profile.name[0]}</span>
          <span className="grow">
            <b style={{ display: 'block', fontSize: 14.5 }}>{s.console.profile.name.split(' ')[0]}</b>
            <span className="tiny muted">{t('Manager', 'Manager')}</span>
          </span>
        </button>
      </div>
    </aside>
  )
}

function SignIn() {
  const t = useT()
  const nav = useNavigate()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('mihai@verdetennis.ro')
  const [code, setCode] = useState('')
  const go = () => {
    update((d) => {
      d.console.signedIn = true
      if (!d.venues.some((v) => v.id === d.console.venueId)) d.console.venueId = 'verde'
    })
    nav('/console/today')
  }
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card col" style={{ width: 'min(440px, 100%)', gap: 18, padding: 32 }}>
        <div className="row between">
          <button onClick={presenterTap} aria-label="Courtal">
            <Logo size={34} word sub="Manage" />
          </button>
          <LangPill />
        </div>
        {step === 'email' ? (
          <>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 600 }}>{t('Sign in to your venue', 'Intră în contul bazei')}</h1>
              <p className="muted" style={{ marginTop: 6 }}>
                {t("We'll email you a 6-digit code. No password.", 'Îți trimitem un cod din 6 cifre pe email. Fără parolă.')}
              </p>
            </div>
            <div>
              <span className="label">Email</span>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setStep('code')} />
            </div>
            <button className="btn primary lg block" onClick={() => setStep('code')}>
              {t('Send code', 'Trimite codul')}
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 600 }}>{t('Check your email', 'Verifică-ți emailul')}</h1>
              <p className="muted" style={{ marginTop: 6 }}>
                {t('We sent a code to', 'Am trimis un cod la')} <b style={{ color: 'var(--ink)' }}>{email}</b>
              </p>
            </div>
            <input
              className="input"
              inputMode="numeric"
              autoFocus
              placeholder="000 000"
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                setCode(v)
                if (v.length === 6) go()
              }}
              style={{ fontSize: 24, letterSpacing: 6, textAlign: 'center', height: 60 }}
            />
            <button className="btn outline block" onClick={() => go()}>
              {t('Paste code from email', 'Lipește codul din email')} · 731 204
            </button>
            <button className="link" style={{ alignSelf: 'center' }} onClick={() => setStep('email')}>
              {t('Use another email', 'Folosește alt email')}
            </button>
          </>
        )}
        <hr className="divider" />
        <div className="center muted">
          {t('New to Courtal?', 'Nou pe Courtal?')}{' '}
          <button className="link" onClick={() => nav('/console/register')}>
            {t('Register my venue', 'Înregistrează-mi baza')}
          </button>
        </div>
      </div>
    </div>
  )
}

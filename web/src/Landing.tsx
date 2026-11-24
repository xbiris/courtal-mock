import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useT } from './lib/i18n'
import { Logo } from './ui'
import { presenterTap } from './Presenter'
import { LangPill } from './player/Auth'

export function Landing() {
  const t = useT()
  const nav = useNavigate()
  const doors = [
    {
      to: '/app',
      title: t('Player app', 'Aplicația pentru jucători'),
      body: t('Sign up in seconds, book a court, open your game to others or join one nearby.', 'Cont în câteva secunde, rezervi un teren, îți deschizi meciul pentru alții sau intri într-unul din apropiere.'),
      go: t('Open the app', 'Deschide aplicația'),
    },
    {
      to: '/console',
      title: t('Venue console', 'Consola pentru baze sportive'),
      body: t('One schedule for app, phone and walk-in bookings, plus prices, policies, money and team.', 'Un singur program pentru rezervări din aplicație, telefon și de la recepție, plus prețuri, reguli, bani și echipă.'),
      go: t('Open Courtal Manage', 'Deschide Courtal Manage'),
    },
    {
      to: '/console/register',
      title: t('Register a venue', 'Înregistrează o bază'),
      body: t('The 10-minute onboarding a venue goes through before going live.', 'Înscrierea de 10 minute prin care trece o bază înainte să apară în aplicație.'),
      go: t('Start onboarding', 'Începe înscrierea'),
    },
  ]
  return (
    <div className="landing">
      <div className="row between">
        <button onClick={presenterTap} aria-label="Courtal">
          <Logo size={40} word />
        </button>
        <LangPill />
      </div>
      <div className="band landing-band">
        <h1>{t('Book courts, find players, play more.', 'Rezervă terenuri, găsește parteneri, joacă mai des.')}</h1>
        <div className="meta">
          <span>{t('One app for players, one console for venues, and the same bookings in both.', 'O aplicație pentru jucători, o consolă pentru baze sportive și aceleași rezervări în ambele.')}</span>
        </div>
      </div>
      <div className="doors">
        {doors.map((d) => (
          <button key={d.to} className="door" onClick={() => nav(d.to)}>
            <span className="door-title">{d.title}</span>
            <span className="muted">{d.body}</span>
            <span className="row bold" style={{ gap: 6 }}>
              {d.go} <ArrowRight size={18} />
            </span>
          </button>
        ))}
      </div>
      <div className="muted small">
        {t('Tip: open the player app and the console side by side. A booking made in one shows up in the other.', 'Sfat: deschide aplicația și consola una lângă alta. O rezervare făcută într-una apare imediat în cealaltă.')}
      </div>
    </div>
  )
}

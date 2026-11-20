import { useNavigate } from 'react-router-dom'
import { Smartphone, LayoutDashboard, ArrowRight, Store } from 'lucide-react'
import { useT } from './lib/i18n'
import { CourtLines, Logo } from './ui'
import { presenterTap } from './Presenter'
import { LangPill } from './player/Auth'

export function Landing() {
  const t = useT()
  const nav = useNavigate()
  return (
    <div style={{ minHeight: '100dvh', padding: '24px 20px 40px', maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 26 }}>
      <div className="row between">
        <button onClick={presenterTap} aria-label="Courtal">
          <Logo size={40} word />
        </button>
        <LangPill />
      </div>
      <div className="hero" style={{ minHeight: 280 }}>
        <CourtLines sport="tennis" style={{ position: 'absolute', right: -40, top: -6, width: '70%', maxWidth: 600, height: '90%' }} />
        <h1>{t('Book courts, find players, play more.', 'Rezervă terenuri, găsește parteneri, joacă mai des.')}</h1>
        <div style={{ position: 'relative', fontSize: 18, fontWeight: 500, maxWidth: 520 }}>
          {t('One app for players, one console for venues, and the same bookings in both.', 'O aplicație pentru jucători, o consolă pentru baze sportive și aceleași rezervări în ambele.')}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <button className="card col" style={{ textAlign: 'left', gap: 14, padding: 28 }} onClick={() => nav('/app')}>
          <span className="avatar lg" style={{ background: 'var(--green)' }}>
            <Smartphone size={26} />
          </span>
          <b style={{ fontSize: 24 }}>{t('Player app', 'Aplicația pentru jucători')}</b>
          <span className="muted" style={{ fontSize: 16 }}>
            {t('Sign up in seconds, book a court, open your game to others or join one nearby.', 'Cont în câteva secunde, rezervi un teren, îți deschizi meciul pentru alții sau intri într-unul din apropiere.')}
          </span>
          <span className="row bold" style={{ gap: 6, marginTop: 'auto' }}>
            {t('Open the app', 'Deschide aplicația')} <ArrowRight size={18} />
          </span>
        </button>
        <button className="card col" style={{ textAlign: 'left', gap: 14, padding: 28 }} onClick={() => nav('/console')}>
          <span className="avatar lg dark">
            <LayoutDashboard size={26} />
          </span>
          <b style={{ fontSize: 24 }}>{t('Venue console', 'Consola pentru baze sportive')}</b>
          <span className="muted" style={{ fontSize: 16 }}>
            {t('One schedule for app, phone and walk-in bookings, plus prices, policies, money and team.', 'Un singur program pentru rezervări din aplicație, telefon și de la recepție, plus prețuri, reguli, bani și echipă.')}
          </span>
          <span className="row bold" style={{ gap: 6, marginTop: 'auto' }}>
            {t('Open Courtal Manage', 'Deschide Courtal Manage')} <ArrowRight size={18} />
          </span>
        </button>
        <button className="card col" style={{ textAlign: 'left', gap: 14, padding: 28 }} onClick={() => nav('/console/register')}>
          <span className="avatar lg">
            <Store size={26} />
          </span>
          <b style={{ fontSize: 24 }}>{t('Register a venue', 'Înregistrează o bază')}</b>
          <span className="muted" style={{ fontSize: 16 }}>
            {t('The 10-minute onboarding a venue goes through before going live.', 'Înscrierea de 10 minute prin care trece o bază înainte să apară în aplicație.')}
          </span>
          <span className="row bold" style={{ gap: 6, marginTop: 'auto' }}>
            {t('Start onboarding', 'Începe înscrierea')} <ArrowRight size={18} />
          </span>
        </button>
      </div>
      <div className="muted small center">
        {t('Tip: open the player app and the console side by side. A booking made in one shows up in the other.', 'Sfat: deschide aplicația și consola una lângă alta. O rezervare făcută într-una apare imediat în cealaltă.')}
      </div>
    </div>
  )
}

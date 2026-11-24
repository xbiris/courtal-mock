import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Mail, Info } from 'lucide-react'
import { useLang, useT } from '../lib/i18n'
import { update, useDemo } from '../lib/store'
import { Logo, Sheet, cx, toast } from '../ui'
import { presenterTap } from '../Presenter'

type Provider = 'apple' | 'google' | 'facebook'

const KNOWN = 'iarina.ihos@gmail.com'
let pendingEmail = ''

function signIn(method: Provider | 'email', email: string) {
  update((s) => {
    s.me.signedIn = true
    s.me.method = method
    s.me.email = email
  })
}

export function LangPill() {
  const { lang, setLang } = useLang()
  return (
    <div className="seg" style={{ background: '#fff', border: '1.5px solid var(--line)' }}>
      {(['en', 'ro'] as const).map((l) => (
        <button key={l} className={cx(lang === l && 'on')} onClick={() => setLang(l)} style={{ height: 32, padding: '0 12px' }}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function ProviderIcon({ p }: { p: Provider }) {
  if (p === 'apple')
    return (
      <svg width="20" height="22" viewBox="0 0 17 20" aria-hidden>
        <path
          fill="#000"
          d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.5-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.4z"
        />
      </svg>
    )
  if (p === 'google')
    return (
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
    )
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path fill="#fff" d="M15.1 12.6l.4-2.7h-2.6V8.2c0-.7.4-1.5 1.5-1.5h1.2V4.4s-1.1-.2-2.1-.2c-2.2 0-3.6 1.3-3.6 3.7v2H7.5v2.7h2.4V19h3V12.6z" />
    </svg>
  )
}

/** System-style account sheet for Apple / Google / Facebook */
function ProviderSheet({ p, onClose, onDone }: { p: Provider | null; onClose: () => void; onDone: () => void }) {
  const t = useT()
  const [busy, setBusy] = useState(false)
  if (!p) return null
  const label = { apple: 'Apple', google: 'Google', facebook: 'Facebook' }[p]
  const go = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      onDone()
    }, 900)
  }
  return (
    <Sheet open onClose={onClose} head={<div className="row grow"><ProviderIcon p={p} /><b style={{ fontSize: 18 }}>{t(`Sign in with ${label}`, `Conectare cu ${label}`)}</b></div>} white>
      <div className="muted">{t('Courtal will receive your name, email and date of birth.', 'Courtal va primi numele, emailul și data nașterii.')}</div>
      <button className="card bordered row" style={{ textAlign: 'left' }} onClick={go}>
        <span className="avatar dark">I</span>
        <div className="grow">
          <div className="bold">Iarina Ihos</div>
          <div className="muted small">{KNOWN}</div>
        </div>
      </button>
      <button className="btn primary block lg" onClick={go} disabled={busy}>
        {busy ? t('Signing in…', 'Se conectează…') : t('Continue as Iarina', 'Continuă ca Iarina')}
      </button>
    </Sheet>
  )
}

export function Welcome({ mode }: { mode: 'signup' | 'login' }) {
  const t = useT()
  const nav = useNavigate()
  const [p, setP] = useState<Provider | null>(null)
  const providers: Provider[] = ['apple', 'google', 'facebook']
  return (
    <div className="auth" style={{ gap: 14 }}>
      <div className="row between">
        <button onClick={presenterTap} aria-label="Courtal">
          <Logo size={40} />
        </button>
        <LangPill />
      </div>
      {mode === 'signup' ? (
        <div className="band auth-band">
          <h1>{t('Find your game!', 'Găsește-ți jocul!')}</h1>
          <div className="meta">
            <span>{t('Book courts, find players, play more.', 'Rezervă terenuri, găsește parteneri, joacă mai des.')}</span>
          </div>
        </div>
      ) : (
        <div style={{ margin: '48px 0 18px' }}>
          <h1>{t('Welcome back', 'Bine ai revenit')}</h1>
          <p className="muted" style={{ fontSize: 18, marginTop: 10 }}>
            {t('Log in the same way you signed up.', 'Conectează-te la fel cum te-ai înregistrat.')}
          </p>
        </div>
      )}
      {providers.map((x) => (
        <button key={x} className="provider" onClick={() => setP(x)}>
          <ProviderIcon p={x} />
          {t('Continue with', 'Continuă cu')} {{ apple: 'Apple', google: 'Google', facebook: 'Facebook' }[x]}
        </button>
      ))}
      <div className="or">{t('or', 'sau')}</div>
      <button className="provider" onClick={() => nav('/app/email')}>
        <Mail size={20} />
        {t('Continue with email', 'Continuă cu emailul')}
      </button>
      <div className="center" style={{ marginTop: 8, fontSize: 16 }}>
        {mode === 'signup' ? (
          <>
            {t('Already have an account?', 'Ai deja cont?')}{' '}
            <button className="link" onClick={() => nav('/app/login')}>
              {t('Log in', 'Conectează-te')}
            </button>
          </>
        ) : (
          <>
            {t('New here?', 'Ești nou?')}{' '}
            <button className="link" onClick={() => nav('/app/welcome')}>
              {t('Create an account', 'Creează un cont')}
            </button>
          </>
        )}
      </div>
      <div className="grow" />
      <p className="tiny faint center">
        {t("By continuing you agree to Courtal's Terms and Privacy Policy.", 'Continuând, accepți Termenii și Politica de confidențialitate Courtal.')}
      </p>
      <ProviderSheet
        p={p}
        onClose={() => setP(null)}
        onDone={() => {
          signIn(p!, KNOWN)
          setP(null)
          nav('/app/home')
        }}
      />
    </div>
  )
}

function AuthTop({ back }: { back: string }) {
  const nav = useNavigate()
  const t = useT()
  return (
    <div className="row between">
      <button className="icon-btn" style={{ marginLeft: -10 }} onClick={() => nav(back)} aria-label="Back">
        <ChevronLeft size={28} />
      </button>
      <span className="small muted">{t('Email login', 'Conectare cu email')}</span>
      <span style={{ width: 44 }} />
    </div>
  )
}

export function EmailStep() {
  const t = useT()
  const nav = useNavigate()
  const [email, setEmail] = useState(pendingEmail)
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
  const send = () => {
    if (!valid) return
    pendingEmail = email.trim().toLowerCase()
    nav(pendingEmail === KNOWN ? '/app/exists' : '/app/code')
  }
  return (
    <div className="auth" style={{ gap: 18 }}>
      <AuthTop back="/app/welcome" />
      <div style={{ marginTop: 26 }}>
        <h1>{t("What's your email?", 'Care e emailul tău?')}</h1>
        <p className="muted" style={{ fontSize: 18, marginTop: 10 }}>
          {t("We'll send you a 6-digit code. No password to remember.", 'Îți trimitem un cod din 6 cifre. Fără parolă de ținut minte.')}
        </p>
      </div>
      <div>
        <span className="label">Email</span>
        <input className="input" type="email" inputMode="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="nume@email.ro" />
      </div>
      <div className="note plain">
        <Info size={20} style={{ flex: 'none', marginTop: 1 }} />
        {t('Same email, same account: this works for new and existing players.', 'Același email, același cont: merge și pentru jucători noi, și pentru cei existenți.')}
      </div>
      <div className="grow" />
      <button className={cx('btn primary block lg', !valid && 'disabled')} onClick={send}>
        {t('Send code', 'Trimite codul')}
      </button>
    </div>
  )
}

export function CodeStep() {
  const t = useT()
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [tries, setTries] = useState(3)
  const [err, setErr] = useState(false)
  const [left, setLeft] = useState(30)
  const [suggest, setSuggest] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const email = pendingEmail || 'iarina@email.ro'
  useEffect(() => {
    const i = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000)
    const s = setTimeout(() => setSuggest(true), 2200)
    return () => {
      clearInterval(i)
      clearTimeout(s)
    }
  }, [])
  const submit = (c = code) => {
    if (c.length < 6) return
    if (c === '000000') {
      const n = tries - 1
      setErr(true)
      setCode('')
      if (n <= 0) {
        toast(t('New code sent', 'Am trimis un cod nou'))
        setTries(3)
      } else setTries(n)
      return
    }
    signIn('email', email)
    nav('/app/home')
  }
  return (
    <div className="auth" style={{ gap: 18 }}>
      <AuthTop back="/app/email" />
      <div style={{ marginTop: 26 }}>
        <h1>{t('Check your email', 'Verifică-ți emailul')}</h1>
        <p className="muted" style={{ fontSize: 18, marginTop: 10 }}>
          {t('We sent a code to', 'Am trimis un cod la')} <b style={{ color: 'var(--ink)' }}>{email}</b>. {t('It expires in 10 minutes.', 'Expiră în 10 minute.')}
        </p>
      </div>
      <div onClick={() => ref.current?.focus()} style={{ position: 'relative' }}>
        <div className={cx('code-boxes', err && 'err')}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={cx(i === code.length && 'cur')}>
              {code[i] ?? ''}
            </div>
          ))}
        </div>
        <input
          ref={ref}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 6)
            setCode(v)
            setErr(false)
            if (v.length === 6) submit(v)
          }}
          style={{ position: 'absolute', inset: 0, opacity: 0 }}
        />
      </div>
      {err && (
        <div className="note danger">
          {t("That code didn't match.", 'Codul nu se potrivește.')} {tries} {t('tries left, then we send a new one.', 'încercări rămase, apoi îți trimitem unul nou.')}
        </div>
      )}
      {suggest && code.length === 0 && (
        <button
          className="card bordered row"
          style={{ textAlign: 'left' }}
          onClick={() => {
            setCode('482913')
            setTimeout(() => submit('482913'), 350)
          }}
        >
          <Mail size={20} />
          <span className="grow">{t('From Mail', 'Din Mail')}</span>
          <b style={{ letterSpacing: 2 }}>482 913</b>
        </button>
      )}
      <div className="row between">
        {left > 0 ? (
          <span className="muted">
            {t('Resend code in', 'Retrimite codul în')} 0:{String(left).padStart(2, '0')}
          </span>
        ) : (
          <button
            className="link"
            onClick={() => {
              setLeft(30)
              toast(t('New code sent', 'Am trimis un cod nou'))
            }}
          >
            {t('Resend code', 'Retrimite codul')}
          </button>
        )}
        <button className="link" onClick={() => nav('/app/email')}>
          {t('Wrong address?', 'Adresă greșită?')}
        </button>
      </div>
      <p className="muted small">
        {t("The code fills in by itself on most phones. Can't find it? Check spam, or try Apple or Google instead.", 'Pe majoritatea telefoanelor codul se completează singur. Nu-l găsești? Verifică spam-ul sau încearcă Apple ori Google.')}
      </p>
      <div className="grow" />
      <button className={cx('btn primary block lg', code.length < 6 && 'disabled')} onClick={() => submit()}>
        {t('Continue', 'Continuă')}
      </button>
    </div>
  )
}

export function ExistsStep() {
  const t = useT()
  const nav = useNavigate()
  const [p, setP] = useState<Provider | null>(null)
  const s = useDemo()
  void s
  return (
    <div className="auth" style={{ gap: 18 }}>
      <AuthTop back="/app/email" />
      <div style={{ marginTop: 26 }}>
        <h1>{t('You already have an account', 'Ai deja un cont')}</h1>
        <p className="muted" style={{ fontSize: 18, marginTop: 10 }}>
          <b style={{ color: 'var(--ink)' }}>{pendingEmail || KNOWN}</b> {t('signed up with Google. Continue with Google, or we can send a code to that email instead.', 's-a înregistrat cu Google. Continuă cu Google sau îți putem trimite un cod pe acest email.')}
        </p>
      </div>
      <button className="provider" onClick={() => setP('google')}>
        <ProviderIcon p="google" /> {t('Continue with Google', 'Continuă cu Google')}
      </button>
      <div className="note plain">
        <Info size={20} style={{ flex: 'none', marginTop: 1 }} />
        {t('Either way you land in the same account, with your bookings and level.', 'Oricum ai alege, ajungi în același cont, cu rezervările și nivelul tău.')}
      </div>
      <div className="grow" />
      <button className="btn outline block lg" onClick={() => nav('/app/code')}>
        {t('Send me a code instead', 'Trimite-mi un cod')}
      </button>
      <ProviderSheet
        p={p}
        onClose={() => setP(null)}
        onDone={() => {
          signIn('google', KNOWN)
          nav('/app/home')
        }}
      />
    </div>
  )
}

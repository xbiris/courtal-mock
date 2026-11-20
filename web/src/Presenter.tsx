import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, RotateCcw, Smartphone, LayoutDashboard, House, Zap, UserPlus } from 'lucide-react'
import { useDemo, update, resetDemo, getState, venue, freeCourts, priceFor, uid, ME } from './lib/store'
import { useLang, useT } from './lib/i18n'
import { hm, nowMin, todayISO } from './lib/time'
import { PLAYERS } from './lib/seed'
import { toast, cx } from './ui'

let openFn: (() => void) | null = null
let taps: number[] = []
/** Three quick taps on any Courtal logo open the presenter tools */
export function presenterTap() {
  const now = Date.now()
  taps = [...taps.filter((x) => now - x < 900), now]
  if (taps.length >= 3) {
    taps = []
    openFn?.()
  }
}

export function Presenter() {
  const [open, setOpen] = useState(false)
  const s = useDemo()
  const t = useT()
  const { lang, setLang } = useLang()
  const nav = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)
  useEffect(() => {
    openFn = () => setOpen(true)
    const k = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) setOpen((o) => !o)
    }
    window.addEventListener('keydown', k)
    return () => {
      openFn = null
      window.removeEventListener('keydown', k)
    }
  }, [])
  if (!open) return null
  const realNow = new Date().getHours() * 60 + new Date().getMinutes()

  const newBooking = () => {
    const st = getState()
    const v = venue(st, 'verde')
    const today = todayISO()
    const pool = PLAYERS.filter((p) => p.id !== ME)
    for (let tm = Math.ceil((nowMin() + 30) / 30) * 30; tm < 22 * 60; tm += 30) {
      const cs = freeCourts(st, v, 'tennis', today, tm, 60)
      if (cs.length) {
        const p = pool[Math.floor(Math.random() * pool.length)]
        update((d) => {
          d.bookings.push({
            id: uid(),
            venueId: 'verde',
            courtId: cs[0].id,
            date: today,
            start: tm,
            dur: 60,
            kind: 'booking',
            source: 'app',
            name: `${p.first} ${p.last[0]}.`,
            playerId: p.id,
            pay: 'online',
            price: priceFor(v, cs[0], today, tm, 60),
            status: 'booked',
            createdAt: Date.now(),
          })
        })
        toast(`${t('New app booking', 'Rezervare nouă din aplicație')}: ${p.first} ${p.last[0]}. · ${cs[0].name} · ${hm(tm)}`)
        return
      }
    }
    toast(t('No free slot left today', 'Nu mai e niciun interval liber azi'))
  }

  const newRequest = () => {
    const st = getState()
    const g = st.games.find((x) => x.hostId === ME && !x.closed && x.players.length < x.size)
    if (!g) return toast(t('Iarina has no open game right now', 'Iarina nu are acum niciun meci deschis'))
    const cand = ['marius', 'cristina', 'vlad', 'teodora', 'andrei', 'larisa'].find((id) => !g.players.includes(id) && !g.requests.some((r) => r.playerId === id))
    if (!cand) return toast(t('Everyone has already asked', 'Toată lumea a cerut deja'))
    update((d) => {
      d.games
        .find((x) => x.id === g.id)!
        .requests.push({ playerId: cand, msg: lang === 'ro' ? 'Salut! Pot să vin și cu rachetă în plus.' : 'Hi! I can bring an extra racket too.', at: Date.now(), pay: 'online' })
    })
    toast(`${PLAYERS.find((p) => p.id === cand)!.first} ${t('asked to join Iarina’s game', 'a cerut să intre în meciul Iarinei')}`)
  }

  return (
    <div className="presenter">
      <div className="row between">
        <b style={{ fontSize: 18 }}>{t('Presenter tools', 'Unelte prezentator')}</b>
        <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => setOpen(false)} aria-label="Close">
          <X size={20} />
        </button>
      </div>
      <div className="tiny muted">{t('Only you see this. Open it with three taps on the logo or Shift+D.', 'Doar tu vezi asta. Se deschide cu trei atingeri pe logo sau Shift+D.')}</div>
      <div className="row" style={{ gap: 8 }}>
        <button className="btn outline sm grow" onClick={() => nav('/app')}>
          <Smartphone size={16} /> {t('Player', 'Jucător')}
        </button>
        <button className="btn outline sm grow" onClick={() => nav('/console')}>
          <LayoutDashboard size={16} /> {t('Venue', 'Bază')}
        </button>
        <button className="btn outline sm" onClick={() => nav('/')} aria-label="Demo menu">
          <House size={16} />
        </button>
      </div>
      <div className="seg" style={{ alignSelf: 'flex-start' }}>
        {(['en', 'ro'] as const).map((l) => (
          <button key={l} className={cx(lang === l && 'on')} onClick={() => setLang(l)}>
            {l === 'en' ? 'English' : 'Română'}
          </button>
        ))}
      </div>
      <div>
        <div className="row between small">
          <span>{t('Demo clock', 'Ceasul demo')}</span>
          <b>
            {hm(nowMin())} {s.clockOffset !== 0 && <span className="muted">({s.clockOffset > 0 ? '+' : ''}{Math.round(s.clockOffset / 60 * 10) / 10} h)</span>}
          </b>
        </div>
        <input
          type="range"
          min={-realNow + 7 * 60}
          max={23 * 60 - realNow}
          step={15}
          value={s.clockOffset}
          onChange={(e) =>
            update((d) => {
              d.clockOffset = Number(e.target.value)
            })
          }
        />
      </div>
      <button className="btn soft sm" onClick={newBooking}>
        <Zap size={16} /> {t('Simulate a new app booking', 'Simulează o rezervare nouă')}
      </button>
      <button className="btn soft sm" onClick={newRequest}>
        <UserPlus size={16} /> {t('Simulate a join request for Iarina', 'Simulează o cerere pentru Iarina')}
      </button>
      {confirmReset ? (
        <div className="row" style={{ gap: 8 }}>
          <button className="btn outline sm grow" onClick={() => setConfirmReset(false)}>
            {t('Cancel', 'Renunță')}
          </button>
          <button
            className="btn danger sm grow"
            onClick={() => {
              resetDemo()
              setConfirmReset(false)
              toast(t('Demo reset', 'Demo resetat'))
              nav('/')
            }}
          >
            {t('Reset everything', 'Resetează tot')}
          </button>
        </div>
      ) : (
        <button className="btn danger-outline sm" onClick={() => setConfirmReset(true)}>
          <RotateCcw size={16} /> {t('Reset demo', 'Resetează demo-ul')}
        </button>
      )}
    </div>
  )
}

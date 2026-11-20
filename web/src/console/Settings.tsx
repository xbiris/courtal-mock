import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Eye, ImagePlus, X, Star, MapPin, Mail, Phone, ChevronDown, MoreHorizontal, Check, PauseCircle, PlayCircle, ShieldCheck, Send } from 'lucide-react'
import { useDemo, update, uid } from '../lib/store'
import { fmtDM, fmtDate, useLang, useT } from '../lib/i18n'
import { addDays, todayISO } from '../lib/time'
import type { Member, Sport } from '../lib/types'
import { Avatar, Chips, Confirm, Field, Sheet, Toggle, cx, photoUrl, sportName, toast } from '../ui'
import { useVenue } from './util'

const SECTIONS = ['profile', 'team', 'notifications', 'billing', 'plan', 'help', 'me'] as const
type Section = (typeof SECTIONS)[number]
const STOCK = ['verde-cover', 'clay-1', 'clay-2', 'clay-3', 'hard-1', 'hard-2', 'hard-3', 'tennis-action', 'aurora-cover', 'teilor-cover']

export function Settings() {
  const t = useT()
  const { section } = useParams()
  const sec = (SECTIONS.includes(section as Section) ? section : 'profile') as Section
  const labels: Record<Section, string> = {
    profile: t('Venue profile', 'Profilul bazei'),
    team: t('Team & access', 'Echipă și acces'),
    notifications: t('Notifications', 'Notificări'),
    billing: t('Payouts & billing', 'Plăți și facturare'),
    plan: t('Plan', 'Abonament'),
    help: t('Help & support', 'Ajutor'),
    me: t('My profile', 'Profilul meu'),
  }
  return (
    <div>
      <div className="c-head">
        <h1 className="c-title">{t('Settings', 'Setări')}</h1>
      </div>
      <div className="set-layout">
        <nav className="set-nav">
          {SECTIONS.map((x) => (
            <NavLink key={x} to={`/console/settings/${x}`} className={({ isActive }) => cx(isActive && 'active')}>
              {labels[x]}
            </NavLink>
          ))}
        </nav>
        <div style={{ minWidth: 0 }}>
          {sec === 'profile' && <Profile />}
          {sec === 'team' && <Team />}
          {sec === 'notifications' && <Notifications />}
          {sec === 'billing' && <Billing />}
          {sec === 'plan' && <Plan />}
          {sec === 'help' && <Help />}
          {sec === 'me' && <Me />}
        </div>
      </div>
    </div>
  )
}

/* ---------------- C61 venue profile ---------------- */
function Profile() {
  const t = useT()
  const { lang } = useLang()
  const v = useVenue()
  const today = todayISO()
  const [f, setF] = useState({ name: v.name, phone: v.phone, address: v.address, description: v.description, sports: v.sports, amenities: v.amenities, photos: v.photos, cover: v.cover })
  const [pin, setPin] = useState({ x: 52, y: 46 })
  const [preview, setPreview] = useState(false)
  const [pause, setPause] = useState(false)
  const [pf, setPf] = useState({ from: addDays(today, 32), to: addDays(today, 44), reason: 'holiday' })
  const [resume, setResume] = useState(false)
  const dirty = JSON.stringify(f) !== JSON.stringify({ name: v.name, phone: v.phone, address: v.address, description: v.description, sports: v.sports, amenities: v.amenities, photos: v.photos, cover: v.cover })
  const AMEN: [string, string, string][] = [
    ['parking', 'Parking', 'Parcare'],
    ['showers', 'Showers', 'Dușuri'],
    ['changing', 'Changing rooms', 'Vestiare'],
    ['rental', 'Racket rental', 'Închiriere rachete'],
    ['lights', 'Lights', 'Nocturnă'],
    ['cafe', 'Café', 'Cafenea'],
  ]
  const toggle = <X,>(arr: X[], x: X) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x])
  const save = () => {
    update((d) => {
      Object.assign(d.venues.find((y) => y.id === v.id)!, f)
    })
    toast(t('Venue profile saved', 'Profil salvat'))
  }
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="panel col" style={{ gap: 14 }}>
        <div className="row between wrap">
          <h3>{t('Venue profile', 'Profilul bazei')}</h3>
          <button className="btn outline sm" onClick={() => setPreview(true)}>
            <Eye size={16} /> {t('View as player', 'Vezi ca jucător')}
          </button>
        </div>
        <div className="form-grid cols2">
          <Field label={t('Venue name', 'Numele bazei')}>
            <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label={t('Phone for players', 'Telefon pentru jucători')}>
            <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </Field>
        </div>
        <Field label={t('Address', 'Adresă')} help={t('Drag the pin to the entrance.', 'Mută pinul la intrare.')}>
          <input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          <div
            className="map-box"
            style={{ marginTop: 10 }}
            onPointerDown={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              setPin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
            }}
            onPointerMove={(e) => {
              if (e.buttons !== 1) return
              const r = e.currentTarget.getBoundingClientRect()
              setPin({ x: Math.max(3, Math.min(97, ((e.clientX - r.left) / r.width) * 100)), y: Math.max(8, Math.min(95, ((e.clientY - r.top) / r.height) * 100)) })
            }}
          >
            <MapPin size={34} fill="#12d31b" color="#0f2b28" style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }} />
          </div>
        </Field>
        <Field label={t('Sports offered', 'Sporturi')}>
          <Chips options={(['tennis', 'football', 'basketball', 'volleyball'] as Sport[]).map((x) => ({ v: x, label: sportName(t, x) }))} value={f.sports} onChange={(x) => setF({ ...f, sports: toggle(f.sports, x) })} size="sm" />
        </Field>
        <Field label={t('Description', 'Descriere')}>
          <textarea className="textarea" rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Field label={t('Amenities', 'Facilități')}>
          <Chips options={AMEN.map(([k, en, ro]) => ({ v: k, label: t(en, ro) }))} value={f.amenities} onChange={(x) => setF({ ...f, amenities: toggle(f.amenities, x) })} size="sm" />
        </Field>
        <Field label={t('Photos', 'Fotografii')} help={t('The star marks the cover. Tap a photo to make it the cover.', 'Steaua marchează coperta. Apasă o fotografie ca s-o faci copertă.')}>
          <div className="row wrap" style={{ gap: 10 }}>
            {f.photos.map((p) => (
              <div key={p} className="photo" style={{ width: 120, height: 84, borderRadius: 14, position: 'relative', outline: p === f.cover ? '3px solid var(--green)' : undefined }}>
                <button style={{ display: 'block', width: '100%', height: '100%' }} onClick={() => setF({ ...f, cover: p })} aria-label={t('Make cover', 'Fă copertă')}>
                  <img src={photoUrl(p)} alt="" />
                </button>
                {p === f.cover && (
                  <span className="badge" style={{ position: 'absolute', left: 6, top: 6, height: 24, padding: '0 8px' }}>
                    <Star size={13} fill="currentColor" /> {t('Cover', 'Copertă')}
                  </span>
                )}
                <button
                  className="icon-btn"
                  style={{ position: 'absolute', right: 4, top: 4, width: 28, height: 28, background: '#fff' }}
                  onClick={() => {
                    const photos = f.photos.filter((x) => x !== p)
                    setF({ ...f, photos, cover: p === f.cover ? photos[0] ?? f.cover : f.cover })
                  }}
                  aria-label={t('Delete photo', 'Șterge fotografia')}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            <button
              className="photo"
              style={{ width: 120, height: 84, borderRadius: 14, border: '1.5px dashed #c9d6c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, background: '#fff' }}
              onClick={() => {
                const next = STOCK.find((x) => !f.photos.includes(x))
                if (next) setF({ ...f, photos: [...f.photos, next] })
                toast(t('Photo uploaded', 'Fotografie încărcată'))
              }}
            >
              <ImagePlus size={22} />
              <span className="small">{t('Upload', 'Încarcă')}</span>
            </button>
          </div>
        </Field>
        {dirty && (
          <div className="savebar">
            <span className="grow">{t('Unsaved changes', 'Modificări nesalvate')}</span>
            <button className="btn sm" style={{ color: '#fff' }} onClick={() => setF({ name: v.name, phone: v.phone, address: v.address, description: v.description, sports: v.sports, amenities: v.amenities, photos: v.photos, cover: v.cover })}>
              {t('Discard', 'Renunță')}
            </button>
            <button className="btn primary sm" onClick={save}>
              {t('Save', 'Salvează')}
            </button>
          </div>
        )}
      </div>
      <div className="panel col" style={{ gap: 10, borderColor: '#f3d0d0' }}>
        <h3>{t('Venue status', 'Starea bazei')}</h3>
        {v.status === 'paused' ? (
          <>
            <div className="note amber">
              <PauseCircle size={20} style={{ flex: 'none' }} />
              <span>
                {t('Paused', 'În pauză')} {v.pausedFrom && `${fmtDM(lang, v.pausedFrom)} – ${fmtDM(lang, v.pausedTo!)}`} · {t('hidden from players, existing bookings stay', 'ascunsă pentru jucători, rezervările existente rămân')}
              </span>
            </div>
            <button className="btn primary sm" style={{ alignSelf: 'flex-start' }} onClick={() => setResume(true)}>
              <PlayCircle size={16} /> {t('Resume venue', 'Reactivează baza')}
            </button>
          </>
        ) : (
          <>
            <div className="muted small">{t('Going on holiday or renovating? Pause the venue so players can’t book. Existing bookings stay.', 'Pleci în concediu sau renovezi? Pune baza pe pauză ca jucătorii să nu poată rezerva. Rezervările existente rămân.')}</div>
            <button className="btn danger-outline sm" style={{ alignSelf: 'flex-start' }} onClick={() => setPause(true)} disabled={v.status === 'review'}>
              <PauseCircle size={16} /> {t('Pause venue', 'Pune baza pe pauză')}
            </button>
          </>
        )}
      </div>
      <Sheet open={preview} onClose={() => setPreview(false)} title={t('What players see', 'Ce văd jucătorii')}>
        <div className="phone-frame">
          <iframe title="preview" src={`${window.location.pathname}#/app/preview/${v.id}`} />
        </div>
      </Sheet>
      <Sheet
        open={pause}
        onClose={() => setPause(false)}
        title={t('Pause venue', 'Pune baza pe pauză')}
        footer={
          <button
            className="btn danger block lg"
            onClick={() => {
              update((d) => {
                const vv = d.venues.find((y) => y.id === v.id)!
                vv.status = 'paused'
                vv.pausedFrom = pf.from
                vv.pausedTo = pf.to
              })
              setPause(false)
              toast(t(`Hidden from players ${fmtDM('en', pf.from)} – ${fmtDM('en', pf.to)}`, `Ascunsă pentru jucători ${fmtDM('ro', pf.from)} – ${fmtDM('ro', pf.to)}`))
            }}
          >
            {t('Pause venue', 'Pune pe pauză')}
          </button>
        }
      >
        <div className="form-grid cols2">
          <Field label={t('From', 'De la')}>
            <input className="input" type="date" value={pf.from} onChange={(e) => setPf({ ...pf, from: e.target.value })} />
          </Field>
          <Field label={t('Until', 'Până la')}>
            <input className="input" type="date" value={pf.to} min={pf.from} onChange={(e) => setPf({ ...pf, to: e.target.value })} />
          </Field>
        </div>
        <Field label={t('Reason', 'Motiv')}>
          <Chips
            options={[
              { v: 'holiday', label: t('Holiday', 'Concediu') },
              { v: 'renovation', label: t('Renovation', 'Renovare') },
              { v: 'other', label: t('Other', 'Altul') },
            ]}
            value={pf.reason}
            onChange={(x) => setPf({ ...pf, reason: x })}
            size="sm"
          />
        </Field>
        <div className="note plain">
          {t(`Hidden from players ${fmtDate('en', pf.from)} – ${fmtDate('en', pf.to)}. Existing bookings stay.`, `Ascunsă pentru jucători ${fmtDate('ro', pf.from)} – ${fmtDate('ro', pf.to)}. Rezervările existente rămân.`)}
        </div>
      </Sheet>
      <Confirm
        open={resume}
        onClose={() => setResume(false)}
        title={t('Resume venue?', 'Reactivezi baza?')}
        body={t('Players can find and book your courts again right away.', 'Jucătorii îți pot găsi și rezerva terenurile din nou imediat.')}
        confirm={t('Resume', 'Reactivează')}
        cancel={t('Cancel', 'Renunță')}
        onConfirm={() => {
          update((d) => {
            const vv = d.venues.find((y) => y.id === v.id)!
            vv.status = 'live'
            vv.pausedFrom = vv.pausedTo = undefined
          })
          toast(t('Venue is live again', 'Baza e din nou activă'))
        }}
      />
    </div>
  )
}

/* ---------------- C62 team ---------------- */
function roleName(t: ReturnType<typeof useT>, r: Member['role']) {
  return { owner: t('Owner', 'Proprietar'), manager: t('Manager', 'Manager'), desk: t('Desk', 'Recepție') }[r]
}
function Team() {
  const s = useDemo()
  const t = useT()
  const [invite, setInvite] = useState(false)
  const [inv, setInv] = useState<{ email: string; role: Member['role'] }>({ email: '', role: 'desk' })
  const [menu, setMenu] = useState<string | null>(null)
  const [role, setRole] = useState<Member | null>(null)
  const [remove, setRemove] = useState<Member | null>(null)
  const team = s.console.team
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="panel" style={{ padding: '6px 20px' }}>
        <div className="row between" style={{ padding: '12px 0 4px' }}>
          <h3>{t('Team', 'Echipă')}</h3>
          <button className="btn primary sm" onClick={() => setInvite(true)}>
            <Send size={15} /> {t('Invite member', 'Invită un membru')}
          </button>
        </div>
        {team.map((m) => (
          <div key={m.id} className="mrow">
            <Avatar name={m.name} dark={!m.pending} />
            <div className="grow" style={{ minWidth: 0 }}>
              <b>
                {m.name}
                {m.you && <span className="muted"> · {t('you', 'tu')}</span>}
              </b>
              <div className="muted small ellipsis">{m.pending ? t('Pending · invite sent', 'În așteptare · invitație trimisă') : m.email}</div>
            </div>
            <span className={cx('badge', m.role !== 'owner' && 'outline')}>{roleName(t, m.role)}</span>
            {!m.you && (
              <div style={{ position: 'relative' }}>
                <button className="icon-btn" onClick={() => setMenu(menu === m.id ? null : m.id)} aria-label={t('More', 'Mai mult')}>
                  <MoreHorizontal size={20} />
                </button>
                {menu === m.id && (
                  <MemberMenu
                    m={m}
                    close={() => setMenu(null)}
                    onRole={() => setRole(m)}
                    onRemove={() => setRemove(m)}
                    onResend={() => toast(t(`Invite sent again to ${m.email}`, `Invitație retrimisă la ${m.email}`))}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="panel col" style={{ gap: 10 }}>
        <h3>{t('What each role can do', 'Ce poate face fiecare rol')}</h3>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <ShieldCheck size={18} style={{ flex: 'none', marginTop: 2 }} />
          <span>
            <b>{roleName(t, 'owner')}</b> · <span className="muted">{t('everything', 'tot')}</span>
          </span>
        </div>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <ShieldCheck size={18} style={{ flex: 'none', marginTop: 2 }} />
          <span>
            <b>{roleName(t, 'manager')}</b> · <span className="muted">{t('everything except payouts and the plan', 'tot, în afară de plăți și abonament')}</span>
          </span>
        </div>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <ShieldCheck size={18} style={{ flex: 'none', marginTop: 2 }} />
          <span>
            <b>{roleName(t, 'desk')}</b> · <span className="muted">{t('Today and Bookings only, no Money', 'doar Azi și Rezervări, fără Bani')}</span>
          </span>
        </div>
      </div>
      <Sheet
        open={invite}
        onClose={() => setInvite(false)}
        title={t('Invite member', 'Invită un membru')}
        footer={
          <button
            className="btn primary block lg"
            disabled={!/^\S+@\S+\.\S+$/.test(inv.email)}
            onClick={() => {
              const email = inv.email.trim()
              update((d) => {
                d.console.team.push({ id: uid(), name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), email, role: inv.role, pending: true })
              })
              setInvite(false)
              setInv({ email: '', role: 'desk' })
              toast(t(`Invite sent to ${email}`, `Invitație trimisă la ${email}`))
            }}
          >
            {t('Send invite', 'Trimite invitația')}
          </button>
        }
      >
        <Field label={t('Email', 'Email')}>
          <input className="input" type="email" placeholder="nume@exemplu.ro" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} />
        </Field>
        <Field label={t('Role', 'Rol')}>
          <Chips options={(['manager', 'desk'] as Member['role'][]).map((r) => ({ v: r, label: roleName(t, r) }))} value={inv.role} onChange={(r) => setInv({ ...inv, role: r })} size="sm" />
        </Field>
      </Sheet>
      <Sheet open={!!role} onClose={() => setRole(null)} title={role ? `${t('Change role', 'Schimbă rolul')} · ${role.name}` : ''}>
        {role && (
          <div className="col" style={{ gap: 8 }}>
            {(['owner', 'manager', 'desk'] as Member['role'][]).map((r) => (
              <button
                key={r}
                className="soft-card row"
                style={{ padding: '14px 16px', gap: 12, textAlign: 'left', width: '100%' }}
                onClick={() => {
                  update((d) => {
                    d.console.team.find((x) => x.id === role.id)!.role = r
                  })
                  setRole(null)
                  toast(t(`${role.name} is now ${roleName(t, r)}`, `${role.name} are acum rolul ${roleName(t, r)}`))
                }}
              >
                <span className={cx('radio', role.role === r && 'on')} />
                <b>{roleName(t, r)}</b>
              </button>
            ))}
          </div>
        )}
      </Sheet>
      <Confirm
        open={!!remove}
        onClose={() => setRemove(null)}
        title={remove?.pending ? t('Cancel invite?', 'Anulezi invitația?') : t(`Remove ${remove?.name ?? ''}?`, `Elimini pe ${remove?.name ?? ''}?`)}
        body={remove?.pending ? t('The invite link stops working.', 'Linkul de invitație nu mai funcționează.') : t('They lose access to this venue right away.', 'Își pierde accesul la bază imediat.')}
        confirm={remove?.pending ? t('Cancel invite', 'Anulează invitația') : t('Remove', 'Elimină')}
        cancel={t('Keep', 'Păstrează')}
        danger
        onConfirm={() => {
          const m = remove!
          update((d) => {
            d.console.team = d.console.team.filter((x) => x.id !== m.id)
          })
          toast(m.pending ? t('Invite cancelled', 'Invitație anulată') : t(`${m.name} removed`, `${m.name} eliminat`), () =>
            update((d) => {
              d.console.team.push(m)
            }),
          )
        }}
      />
    </div>
  )
}

function MemberMenu({ m, close, onRole, onRemove, onResend }: { m: Member; close: () => void; onRole: () => void; onRemove: () => void; onResend: () => void }) {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const id = setTimeout(() => document.addEventListener('click', h), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', h)
    }
  }, [close])
  return (
    <div ref={ref} className="popover" style={{ right: 0, top: 44, minWidth: 200 }}>
      {m.pending ? (
        <>
          <button className="pop-item" onClick={() => (close(), onResend())}>
            {t('Resend invite', 'Retrimite invitația')}
          </button>
          <button className="pop-item" style={{ color: 'var(--danger)' }} onClick={() => (close(), onRemove())}>
            {t('Cancel invite', 'Anulează invitația')}
          </button>
        </>
      ) : (
        <>
          <button className="pop-item" onClick={() => (close(), onRole())}>
            {t('Change role', 'Schimbă rolul')}
          </button>
          <button className="pop-item" style={{ color: 'var(--danger)' }} onClick={() => (close(), onRemove())}>
            {t('Remove', 'Elimină')}
          </button>
        </>
      )}
    </div>
  )
}

/* ---------------- C63 notifications ---------------- */
function Notifications() {
  const s = useDemo()
  const t = useT()
  const [saved, setSaved] = useState<string | null>(null)
  const events: [string, string, string][] = [
    ['new', 'New app booking', 'Rezervare nouă din aplicație'],
    ['cancel', 'Cancellation', 'Anulare'],
    ['full', 'Open game filled', 'Joc deschis complet'],
    ['noshow', 'Player no-show', 'Jucător neprezentat'],
    ['summary', 'Daily summary at 07:00', 'Rezumat zilnic la 07:00'],
    ['payout', 'Payout sent', 'Plată trimisă'],
  ]
  const ch: [string, string][] = [
    ['email', 'Email'],
    ['sms', 'SMS'],
    ['push', 'Push'],
  ]
  return (
    <div className="panel" style={{ padding: '6px 20px' }}>
      <div className="mrow" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
        <span className="grow">{t('Send me…', 'Trimite-mi…')}</span>
        {ch.map(([k, l]) => (
          <span key={k} style={{ width: 54, textAlign: 'center' }}>
            {l}
          </span>
        ))}
      </div>
      {events.map(([k, en, ro]) => (
        <div key={k} className="mrow">
          <span className="grow" style={{ minWidth: 0 }}>
            {t(en, ro)}
            {saved === k && (
              <span className="small" style={{ color: 'var(--green-600)', marginLeft: 8 }}>
                <Check size={14} style={{ verticalAlign: -2 }} /> {t('Saved', 'Salvat')}
              </span>
            )}
          </span>
          {ch.map(([c]) => (
            <span key={c} style={{ width: 54, display: 'flex', justifyContent: 'center' }}>
              <Toggle
                on={!!s.console.notif[`${k}.${c}`]}
                onChange={(x) => {
                  update((d) => {
                    d.console.notif[`${k}.${c}`] = x
                  })
                  setSaved(k)
                  setTimeout(() => setSaved((p) => (p === k ? null : p)), 1500)
                }}
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ---------------- C64 payouts & billing ---------------- */
function Billing() {
  const s = useDemo()
  const t = useT()
  const c = s.console
  const [change, setChange] = useState(false)
  const [ni, setNi] = useState({ iban: '', holder: c.holder })
  const [email, setEmail] = useState(c.billingEmail)
  const mask = (x: string) => `${x.slice(0, 4)} •••• •••• •••• ${x.replace(/\s/g, '').slice(-4)}`
  const entity = { srl: t('Company (SRL / SA)', 'Firmă (SRL / SA)'), pfa: t('Sole trader (PFA / II)', 'PFA / II'), club: t('Sports club / association', 'Club sportiv / asociație') }[c.entity]
  const ok = ni.iban.replace(/\s/g, '').length >= 20 && /^RO/i.test(ni.iban.trim())
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="panel col" style={{ gap: 12 }}>
        <h3>{t('Payouts', 'Plăți către tine')}</h3>
        {c.ibanPending ? (
          <div className="note amber">
            <ShieldCheck size={20} style={{ flex: 'none' }} />
            <span>
              <b>{t('Change pending', 'Schimbare în așteptare')}</b> · {t(`new account ${mask(c.ibanPending)}. Courtal will confirm by phone before the next payout. Until then, payouts go to the old account.`, `cont nou ${mask(c.ibanPending)}. Courtal confirmă telefonic înainte de următoarea plată. Până atunci, plățile merg în contul vechi.`)}{' '}
              <button
                className="link"
                onClick={() => {
                  update((d) => {
                    d.console.ibanPending = ''
                  })
                  toast(t('IBAN change cancelled', 'Schimbarea IBAN anulată'))
                }}
              >
                {t('Cancel change', 'Anulează schimbarea')}
              </button>
            </span>
          </div>
        ) : null}
        <div className="row between wrap">
          <div>
            <div className="muted small">IBAN</div>
            <b>{mask(c.iban)}</b>
            <div className="muted small">{c.holder}</div>
          </div>
          <button className="btn outline sm" onClick={() => setChange(true)} disabled={!!c.ibanPending}>
            {t('Change IBAN', 'Schimbă IBAN')}
          </button>
        </div>
        <div className="muted small">{t('Paid every Monday for the previous week’s app payments, minus the Courtal fee.', 'Plătit în fiecare luni pentru plățile din aplicație din săptămâna anterioară, minus comisionul Courtal.')}</div>
      </div>
      <div className="panel col" style={{ gap: 12 }}>
        <h3>{t('Legal details', 'Date juridice')}</h3>
        <div className="form-grid cols2">
          <Field label={t('Legal entity', 'Formă juridică')}>
            <div className="input row">{entity}</div>
          </Field>
          <Field label={t('Company name', 'Denumire')}>
            <div className="input row">{c.company}</div>
          </Field>
          <Field label="CUI">
            <div className="input row">{c.cui}</div>
          </Field>
          <Field label={t('Registered address', 'Sediu social')}>
            <div className="input row ellipsis">{c.regAddress}</div>
          </Field>
        </div>
        <div className="muted small">
          {t('To change legal details, ', 'Pentru a schimba datele juridice, ')}
          <NavLink to="/console/settings/help?topic=billing" className="link">
            {t('contact Courtal', 'contactează Courtal')}
          </NavLink>
          .
        </div>
      </div>
      <div className="panel col" style={{ gap: 12 }}>
        <h3>{t('Invoices', 'Facturi')}</h3>
        <Field label={t('Billing email for invoices', 'Email pentru facturi')}>
          <div className="row" style={{ gap: 8 }}>
            <input className="input grow" value={email} onChange={(e) => setEmail(e.target.value)} />
            {email !== c.billingEmail && (
              <button
                className="btn primary sm"
                onClick={() => {
                  update((d) => {
                    d.console.billingEmail = email
                  })
                  toast(t('Billing email saved', 'Email de facturare salvat'))
                }}
              >
                {t('Save', 'Salvează')}
              </button>
            )}
          </div>
        </Field>
      </div>
      <Sheet
        open={change}
        onClose={() => setChange(false)}
        title={t('Change IBAN', 'Schimbă IBAN')}
        footer={
          <button
            className="btn primary block lg"
            disabled={!ok}
            onClick={() => {
              update((d) => {
                d.console.ibanPending = ni.iban.toUpperCase()
              })
              setChange(false)
              toast(t('Change requested · Courtal will call to confirm', 'Schimbare cerută · Courtal te sună pentru confirmare'))
            }}
          >
            {t('Request change', 'Cere schimbarea')}
          </button>
        }
      >
        <Field label={t('New IBAN', 'IBAN nou')}>
          <input className="input" placeholder="RO.. .... .... .... .... ...." value={ni.iban} onChange={(e) => setNi({ ...ni, iban: e.target.value })} />
        </Field>
        <Field label={t('Account holder', 'Titular cont')}>
          <input className="input" value={ni.holder} onChange={(e) => setNi({ ...ni, holder: e.target.value })} />
        </Field>
        <div className="note plain">
          <Phone size={18} style={{ flex: 'none' }} />
          <span>{t('For your safety, Courtal will confirm by phone before the next payout. Until then, payouts go to the old account.', 'Pentru siguranța ta, Courtal confirmă telefonic înainte de următoarea plată. Până atunci, plățile merg în contul vechi.')}</span>
        </div>
      </Sheet>
    </div>
  )
}

/* ---------------- C65 plan ---------------- */
function Plan() {
  const s = useDemo()
  const t = useT()
  const [confirm, setConfirm] = useState(false)
  const c = s.console
  const fee = c.plan === 'fee'
  const Card = ({ on, title, price, lines }: { on: boolean; title: string; price: string; lines: string[] }) => (
    <div className="panel col" style={{ gap: 10, border: on ? '2px solid var(--ink)' : undefined }}>
      <div className="row between">
        <h3>{title}</h3>
        {on && <span className="badge">{t('Current plan', 'Abonament curent')}</span>}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600 }}>{price}</div>
      {lines.map((l) => (
        <div key={l} className="row small" style={{ gap: 8 }}>
          <Check size={16} color="#0fb817" /> {l}
        </div>
      ))}
    </div>
  )
  return (
    <div className="col" style={{ gap: 14 }}>
      {c.planSwitch && (
        <div className="note amber">
          <span className="grow">
            {t('Switching to', 'Treci la')} {fee ? t('Monthly subscription', 'Abonament lunar') : t('Fee per booking', 'Comision pe rezervare')} {t('on 1 Dec', 'pe 1 dec.')}
          </span>
          <button
            className="link"
            onClick={() => {
              update((d) => {
                d.console.planSwitch = false
              })
              toast(t('Switch cancelled', 'Schimbare anulată'))
            }}
          >
            {t('Cancel switch', 'Anulează schimbarea')}
          </button>
        </div>
      )}
      <div className="form-grid cols2">
        <Card on={fee} title={t('Fee per booking', 'Comision pe rezervare')} price="10%" lines={[t('of app-paid bookings', 'din rezervările plătite în aplicație'), t('No fee on at-venue payments', 'Fără comision la plățile la bază'), t('No monthly cost', 'Fără cost lunar')]} />
        <Card on={!fee} title={t('Monthly subscription', 'Abonament lunar')} price={t('490 lei / month', '490 lei / lună')} lines={[t('0% fee on every booking', '0% comision la orice rezervare'), t('Best above ~5 000 lei a month in app payments', 'Avantajos peste ~5 000 lei pe lună plăți în aplicație'), t('Cancel any month', 'Anulezi oricând')]} />
      </div>
      {!c.planSwitch && (
        <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={() => setConfirm(true)}>
          {fee ? t('Switch to monthly subscription', 'Treci la abonament lunar') : t('Switch to fee per booking', 'Treci la comision pe rezervare')}
        </button>
      )}
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('Switch plan?', 'Schimbi abonamentul?')}
        body={t('The new plan starts on 1 Dec. Until then, nothing changes.', 'Noul abonament începe pe 1 dec. Până atunci, nu se schimbă nimic.')}
        confirm={t('Switch on 1 Dec', 'Schimbă pe 1 dec.')}
        cancel={t('Cancel', 'Renunță')}
        onConfirm={() => {
          update((d) => {
            d.console.planSwitch = true
          })
          toast(t('Plan switches on 1 Dec', 'Abonamentul se schimbă pe 1 dec.'))
        }}
      />
    </div>
  )
}

/* ---------------- C66 help ---------------- */
function Help() {
  const s = useDemo()
  const t = useT()
  const [q] = useSearchParams()
  const topicParam = q.get('topic')
  const [contact, setContact] = useState(!!topicParam)
  const [call, setCall] = useState(false)
  const [topic, setTopic] = useState(topicParam === 'payout' ? 'payouts' : topicParam === 'billing' ? 'billing' : 'bookings')
  const [msg, setMsg] = useState(topicParam === 'payout' ? t(`About the payout of ${q.get('ref') ?? ''}: `, `Despre plata din ${q.get('ref') ?? ''}: `) : '')
  const [open, setOpen] = useState<number | null>(0)
  const faq: [string, string, string, string][] = [
    ['When do I get paid?', 'Când primesc banii?', 'Every Monday, for the app payments of the previous week (Mon–Sun), minus the Courtal fee. Money paid at the venue stays with you.', 'În fiecare luni, pentru plățile din aplicație din săptămâna anterioară (lun–dum), minus comisionul Courtal. Banii plătiți la bază rămân la tine.'],
    ['How do refunds work?', 'Cum funcționează rambursările?', 'If you cancel a booking, the player gets a full refund automatically. If a player cancels in time, they are refunded under your cancellation policy.', 'Dacă anulezi o rezervare, jucătorul primește automat banii înapoi. Dacă jucătorul anulează la timp, e rambursat conform regulilor tale de anulare.'],
    ['What happens with no-shows?', 'Ce se întâmplă cu neprezentările?', 'Mark the booking as no-show from the schedule. App-paid bookings stay paid; the player’s reliability score goes down.', 'Marchează rezervarea ca neprezentare din program. Rezervările plătite în aplicație rămân plătite; scorul de seriozitate al jucătorului scade.'],
    ['What are open games?', 'Ce sunt jocurile deschise?', 'A player can open their booking so others can join and split the price. You still see one booking, with all the players on it.', 'Un jucător își poate deschide rezervarea ca alții să se alăture și să împartă prețul. Tu vezi tot o rezervare, cu toți jucătorii.'],
    ['How do I close a court for a day?', 'Cum închid un teren pentru o zi?', 'In the schedule, tap Block time, pick the court, the hours and a reason. Players can’t book it during that time.', 'În program, apasă Blochează, alege terenul, orele și un motiv. Jucătorii nu îl pot rezerva în acel interval.'],
    ['How do I add staff?', 'Cum adaug personal?', 'Settings → Team & access → Invite member. Desk staff see only Today and Bookings.', 'Setări → Echipă și acces → Invită un membru. Recepția vede doar Azi și Rezervări.'],
  ]
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="form-grid cols2">
        <button className="panel col" style={{ gap: 6, textAlign: 'left' }} onClick={() => setContact(true)}>
          <Mail size={22} />
          <b>venues@courtal.ro</b>
          <span className="muted small">{t('We answer the same day', 'Răspundem în aceeași zi')}</span>
        </button>
        <button className="panel col" style={{ gap: 6, textAlign: 'left' }} onClick={() => setCall(true)}>
          <Phone size={22} />
          <b>{t('Call Courtal', 'Sună la Courtal')}</b>
          <span className="muted small">{t('Mon–Sat, 08:00–22:00', 'Lun–Sâm, 08:00–22:00')}</span>
        </button>
      </div>
      <div className="panel" style={{ padding: '4px 20px' }}>
        <h3 style={{ padding: '14px 0 4px' }}>{t('Frequent questions', 'Întrebări frecvente')}</h3>
        {faq.map(([qe, qr, ae, ar], i) => (
          <div key={i} style={{ borderBottom: i < faq.length - 1 ? '1px solid var(--line)' : 0 }}>
            <button className="row between" style={{ width: '100%', padding: '14px 0', textAlign: 'left' }} onClick={() => setOpen(open === i ? null : i)}>
              <b>{t(qe, qr)}</b>
              <ChevronDown size={18} style={{ transform: open === i ? 'rotate(180deg)' : undefined, transition: 'transform .15s', flex: 'none' }} />
            </button>
            {open === i && <div className="muted" style={{ paddingBottom: 14 }}>{t(ae, ar)}</div>}
          </div>
        ))}
      </div>
      <Sheet
        open={contact}
        onClose={() => setContact(false)}
        title={t('Write to Courtal', 'Scrie-ne')}
        footer={
          <button
            className="btn primary block lg"
            disabled={!msg.trim()}
            onClick={() => {
              setContact(false)
              setMsg('')
              toast(t(`Sent · we'll reply to ${s.console.profile.email}`, `Trimis · îți răspundem la ${s.console.profile.email}`))
            }}
          >
            <Send size={17} /> {t('Send', 'Trimite')}
          </button>
        }
      >
        <Field label={t('Topic', 'Subiect')}>
          <Chips
            options={[
              { v: 'bookings', label: t('Bookings', 'Rezervări') },
              { v: 'payouts', label: t('Payouts', 'Plăți') },
              { v: 'billing', label: t('Billing', 'Facturare') },
              { v: 'app', label: t('The app', 'Aplicația') },
              { v: 'other', label: t('Other', 'Altceva') },
            ]}
            value={topic}
            onChange={setTopic}
            size="sm"
          />
        </Field>
        <Field label={t('Message', 'Mesaj')}>
          <textarea className="textarea" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t('How can we help?', 'Cu ce te putem ajuta?')} />
        </Field>
      </Sheet>
      <Sheet open={call} onClose={() => setCall(false)} title={t('Call Courtal', 'Sună la Courtal')} footer={<a className="btn primary block lg" href="tel:+40312290410"><Phone size={18} /> 031 229 0410</a>}>
        <div className="muted">{t('Venue support · Mon–Sat, 08:00–22:00. Have your venue name ready.', 'Suport pentru baze · Lun–Sâm, 08:00–22:00. Spune-ne numele bazei.')}</div>
      </Sheet>
    </div>
  )
}

/* ---------------- C67 my profile ---------------- */
function Me() {
  const s = useDemo()
  const t = useT()
  const { lang, setLang } = useLang()
  const nav = useNavigate()
  const p = s.console.profile
  const [f, setF] = useState(p)
  const [all, setAll] = useState(false)
  const dirty = JSON.stringify(f) !== JSON.stringify(p)
  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="panel col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 14 }}>
          <Avatar name={f.name} dark size="lg" />
          <div>
            <b style={{ fontSize: 18 }}>{p.name}</b>
            <div className="muted small">{t('Manager', 'Manager')} · {useVenue().name}</div>
          </div>
        </div>
        <div className="form-grid cols2">
          <Field label={t('Name', 'Nume')}>
            <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label={t('Phone', 'Telefon')}>
            <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </Field>
          <Field label={t('Email', 'Email')}>
            <input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
          <Field label={t('Language', 'Limba')}>
            <Chips
              options={[
                { v: 'en', label: 'English' },
                { v: 'ro', label: 'Română' },
              ]}
              value={lang}
              onChange={(x) => setLang(x as 'en' | 'ro')}
              size="sm"
            />
          </Field>
        </div>
        {dirty && (
          <button
            className="btn primary"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => {
              update((d) => {
                d.console.profile = f
                const m = d.console.team.find((x) => x.you)
                if (m) {
                  m.name = f.name
                  m.email = f.email
                }
              })
              toast(t('Profile saved', 'Profil salvat'))
            }}
          >
            {t('Save', 'Salvează')}
          </button>
        )}
      </div>
      <div className="panel col" style={{ gap: 10 }}>
        <h3>{t('Security', 'Securitate')}</h3>
        <div className="muted small">{t('Signed in on this browser and on 1 phone.', 'Conectat în acest browser și pe 1 telefon.')}</div>
        <button className="btn danger-outline sm" style={{ alignSelf: 'flex-start' }} onClick={() => setAll(true)}>
          {t('Log out of all devices', 'Deconectează-te de pe toate dispozitivele')}
        </button>
      </div>
      <Confirm
        open={all}
        onClose={() => setAll(false)}
        title={t('Log out everywhere?', 'Te deconectezi peste tot?')}
        body={t('You will need to sign in again with a code sent to your email.', 'Va trebui să te conectezi din nou cu un cod primit pe email.')}
        confirm={t('Log out', 'Deconectează')}
        cancel={t('Cancel', 'Renunță')}
        danger
        onConfirm={() => {
          update((d) => {
            d.console.signedIn = false
          })
          nav('/console/signin')
        }}
      />
    </div>
  )
}

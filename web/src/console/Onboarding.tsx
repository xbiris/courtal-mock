import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, SlidersHorizontal, Banknote, ArrowRight, Check, ImagePlus, MapPin, Lightbulb, Pencil, Trash2, Search, Phone, Eye, Mail, Plus } from 'lucide-react'
import { useDemo, update, uid } from '../lib/store'
import { defaultSettings } from '../lib/seed'
import { dayLong, fmtMoney, useLang, useT } from '../lib/i18n'
import { hm, todayISO } from '../lib/time'
import type { Onboarding as Onb, Sport, Surface, Venue } from '../lib/types'
import { Chips, Field, Logo, Sheet, Toggle, cx, photoUrl, sportName, surfaceName, toast } from '../ui'
import { presenterTap } from '../Presenter'
import { LangPill } from '../player/Auth'
import { TIMES } from './sheets'
import { useVenue } from './util'

const blank = (): Onb => ({
  step: 1,
  name: '',
  phone: '',
  street: '',
  city: 'București',
  sports: [],
  courts: [],
  hours: Array.from({ length: 7 }, (_, i) => ({ open: true, from: i < 5 ? 7 * 60 : 8 * 60, to: i < 5 ? 23 * 60 : 22 * 60 })),
  base: '',
  evening: '',
  weekend: '',
  slot: 60,
  payment: 'online',
  cancel: 24,
  window: 14,
  notice: 1,
  openGames: true,
  showInFind: true,
  entity: 'srl',
  company: '',
  cui: '',
  regAddress: '',
  iban: '',
  holder: '',
  plan: 'fee',
})

function TopBar({ onExit }: { onExit?: () => void }) {
  const t = useT()
  const nav = useNavigate()
  return (
    <div className="onb-top">
      <button onClick={presenterTap} aria-label="Courtal">
        <span className="hide-sm">
          <Logo size={30} word sub={t('for venues', 'pentru baze')} />
        </span>
        <span className="hide-lg">
          <Logo size={30} />
        </span>
      </button>
      <div className="row" style={{ gap: 10 }}>
        <LangPill />
        {onExit ? (
          <button className="btn outline sm" onClick={onExit}>
            <span className="hide-sm">{t('Save and exit', 'Salvează și ieși')}</span>
            <span className="hide-lg">{t('Save & exit', 'Salvează')}</span>
          </button>
        ) : (
          <button className="btn ghost sm hide-sm" onClick={() => nav('/')}>
            {t('Demo menu', 'Meniu demo')}
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------------- A0 welcome ---------------- */
export function Register() {
  const s = useDemo()
  const t = useT()
  const nav = useNavigate()
  const resume = s.onboarding
  const start = (fresh: boolean) => {
    update((d) => {
      if (fresh || !d.onboarding) d.onboarding = blank()
    })
    nav('/console/onboarding')
  }
  const Point = ({ icon, title, body }: { icon: ReactNode; title: string; body: string }) => (
    <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
      <span className="icon-btn" style={{ background: 'var(--green-soft)', flex: 'none' }}>
        {icon}
      </span>
      <div>
        <b style={{ fontSize: 17 }}>{title}</b>
        <div className="muted">{body}</div>
      </div>
    </div>
  )
  return (
    <div className="onb">
      <TopBar />
      <div className="onb-body">
        <div className="col" style={{ gap: 22 }}>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 46px)', lineHeight: 1.08, margin: 0, letterSpacing: -0.8 }}>{t('Put your courts on Courtal.', 'Pune-ți terenurile pe Courtal.')}</h1>
          <p className="muted" style={{ fontSize: 18, margin: 0, maxWidth: 560 }}>
            {t('Players find you, book and pay in the app. You run everything from one schedule, on your laptop or your phone.', 'Jucătorii te găsesc, rezervă și plătesc în aplicație. Tu gestionezi totul dintr-un singur program, pe laptop sau pe telefon.')}
          </p>
          <div className="col" style={{ gap: 18 }}>
            <Point icon={<CalendarDays size={20} />} title={t('One calendar', 'Un singur calendar')} body={t('App bookings, phone bookings and walk-ins in the same grid. Players only see slots that are really free.', 'Rezervări din aplicație, telefonice și walk-in în aceeași grilă. Jucătorii văd doar intervalele cu adevărat libere.')} />
            <Point icon={<SlidersHorizontal size={20} />} title={t('Your prices, your rules', 'Prețurile și regulile tale')} body={t('Hours, prices per court, payment method and cancellation policy are yours to set.', 'Programul, prețurile pe teren, metoda de plată și regulile de anulare le stabilești tu.')} />
            <Point icon={<Banknote size={20} />} title={t('Paid out weekly', 'Plătit săptămânal')} body={t('App payments land in your IBAN every Monday. At-venue payments stay at the desk.', 'Plățile din aplicație ajung în IBAN-ul tău în fiecare luni. Plățile la bază rămân la recepție.')} />
          </div>
          <div className="row wrap" style={{ gap: 12 }}>
            {resume ? (
              <>
                <button className="btn primary lg" onClick={() => start(false)}>
                  {t('Continue where you left off', 'Continuă de unde ai rămas')} <ArrowRight size={18} />
                </button>
                <button className="btn outline lg" onClick={() => start(true)}>
                  {t('Start over', 'Începe din nou')}
                </button>
              </>
            ) : (
              <button className="btn primary lg" onClick={() => start(true)}>
                {t('Register my venue', 'Înscrie-mi baza')} <ArrowRight size={18} />
              </button>
            )}
            <button className="btn ghost lg" onClick={() => nav('/console/signin')}>
              {t('Already registered? Sign in', 'Ai deja cont? Conectează-te')}
            </button>
          </div>
        </div>
        <div className="col" style={{ gap: 14 }}>
          <div className="photo" style={{ height: 200, borderRadius: 24 }}>
            <img src={photoUrl('clay-2')} alt="" />
          </div>
          <div className="panel col" style={{ gap: 6 }}>
            <b>{t("What you'll need · about 10 minutes", 'De ce ai nevoie · cam 10 minute')}</b>
            <div className="muted small">{t('Your court list (sport, surface, indoor or outdoor). Opening hours and prices. Company details: CUI and IBAN for payouts. Photos help, but you can add them later.', 'Lista terenurilor (sport, suprafață, interior sau exterior). Program și prețuri. Datele firmei: CUI și IBAN pentru plăți. Fotografiile ajută, dar le poți adăuga și mai târziu.')}</div>
          </div>
          <div className="panel col" style={{ gap: 6 }}>
            <b>{t('Review', 'Verificare')}</b>
            <div className="muted small">{t('Courtal checks the address and calls you within 2 working days. Until then you can already fill the schedule with your existing bookings.', 'Courtal verifică adresa și te sună în 2 zile lucrătoare. Până atunci poți deja completa programul cu rezervările existente.')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- A1–A5 ---------------- */
export function Onboarding() {
  const s = useDemo()
  const t = useT()
  const nav = useNavigate()
  const o = s.onboarding ?? blank()
  const set = (p: Partial<Onb>) =>
    update((d) => {
      d.onboarding = { ...(d.onboarding ?? blank()), ...p }
    })
  const steps = [t('Details', 'Detalii'), t('Courts', 'Terenuri'), t('Hours & prices', 'Program și prețuri'), t('Policies', 'Reguli'), t('Payouts', 'Plăți')]
  const go = (n: number) => {
    set({ step: n })
    window.scrollTo(0, 0)
  }
  const can = [
    !!o.name.trim() && !!o.street.trim() && o.sports.length > 0,
    o.courts.length > 0,
    Number(o.base) > 0 && o.hours.some((h) => h.open),
    true,
    !!o.company.trim() && !!o.cui.trim() && o.iban.replace(/\s/g, '').length >= 20,
  ][o.step - 1]
  const missing = [t('Add a name, a street and at least one sport', 'Adaugă un nume, o stradă și cel puțin un sport'), t('Add at least one court', 'Adaugă cel puțin un teren'), t('Set a base price', 'Setează un preț de bază'), '', t('Fill in company name, CUI and IBAN', 'Completează denumirea, CUI-ul și IBAN-ul')][o.step - 1]
  const exit = () => {
    toast(t('Saved · continue any time', 'Salvat · continuă oricând'))
    nav('/console/register')
  }
  const submit = () => {
    const id = `new_${uid()}`
    const sports = (o.sports.length ? o.sports : ['tennis']) as Sport[]
    const v: Venue = {
      id,
      name: o.name.trim(),
      address: `${o.street.trim()}, ${o.city.trim()}`,
      city: o.city.trim(),
      km: 3.1,
      rating: 0,
      sports,
      cover: o.courts[0]?.surface === 'hard' ? 'hard-1' : o.courts[0]?.sport === 'football' ? 'football-1' : 'clay-1',
      photos: ['clay-1'],
      phone: o.phone,
      description: '',
      amenities: [],
      courts: o.courts.map((c, i) => ({ id: `c${i + 1}`, ...c, price: null, bookable: true })),
      settings: defaultSettings(Number(o.base) || 100, {
        evening: o.evening ? Number(o.evening) : null,
        weekend: o.weekend ? Number(o.weekend) : null,
        slot: o.slot,
        hours: o.hours,
        payment: o.payment,
        cancel: o.cancel,
        window: o.window,
        notice: o.notice,
        openGames: o.openGames,
        showInFind: o.showInFind,
        history: [{ who: 'Mihai', at: Date.now(), what: t('Venue registered', 'Bază înscrisă') }],
      }),
      status: 'review',
    }
    update((d) => {
      d.venues.push(v)
      d.console.venueId = id
      d.console.signedIn = true
      d.onboarding = null
    })
    nav('/console/review')
  }

  return (
    <div className="onb">
      <TopBar onExit={exit} />
      <div className="onb-steps">
        {steps.map((x, i) => (
          <span key={x} className={cx(o.step === i + 1 && 'on', o.step > i + 1 && 'done')} onClick={() => i + 1 < o.step && go(i + 1)} style={{ cursor: i + 1 < o.step ? 'pointer' : undefined }}>
            {o.step > i + 1 && <Check size={13} style={{ verticalAlign: -2, marginRight: 4 }} />}
            {i + 1}. {x}
          </span>
        ))}
      </div>
      {o.step === 1 && <Details o={o} set={set} />}
      {o.step === 2 && <Courts o={o} set={set} />}
      {o.step === 3 && <HoursPrices o={o} set={set} />}
      {o.step === 4 && <PoliciesStep o={o} set={set} />}
      {o.step === 5 && <Payouts o={o} set={set} />}
      <div className="onb-foot">
        <div className="inner">
          <button className="btn outline" onClick={() => (o.step === 1 ? nav('/console/register') : go(o.step - 1))}>
            {t('Back', 'Înapoi')}
          </button>
          <div className="row" style={{ gap: 12 }}>
            {!can && <span className="muted small hide-sm">{missing}</span>}
            {o.step < 5 ? (
              <button className="btn primary" disabled={!can} onClick={() => go(o.step + 1)}>
                {t('Continue', 'Continuă')}
                <span className="hide-sm"> · {steps[o.step]}</span> <ArrowRight size={17} />
              </button>
            ) : (
              <button className="btn primary" disabled={!can} onClick={submit}>
                {t('Submit for review', 'Trimite spre verificare')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

type StepProps = { o: Onb; set: (p: Partial<Onb>) => void }

function Side({ items }: { items: [string, string][] }) {
  return (
    <div className="col" style={{ gap: 12 }}>
      {items.map(([a, b]) => (
        <div key={a} className="panel col" style={{ gap: 6 }}>
          <b>{a}</b>
          <div className="muted small">{b}</div>
        </div>
      ))}
    </div>
  )
}

function Details({ o, set }: StepProps) {
  const t = useT()
  const [pin, setPin] = useState({ x: 50, y: 50 })
  const [photos, setPhotos] = useState<string[]>([])
  const toggle = (x: string) => set({ sports: o.sports.includes(x) ? o.sports.filter((y) => y !== x) : [...o.sports, x] })
  return (
    <div className="onb-body">
      <div className="col" style={{ gap: 18 }}>
        <div>
          <h1 className="c-title">{t('Tell players about your venue', 'Spune-le jucătorilor despre baza ta')}</h1>
          <div className="muted">{t('This is what they see on the venue card and the court screen.', 'Asta văd pe cardul bazei și pe ecranul terenului.')}</div>
        </div>
        <div className="panel col" style={{ gap: 14 }}>
          <div className="form-grid cols2">
            <Field label={t('Venue name', 'Numele bazei')}>
              <input className="input" value={o.name} placeholder={t('e.g. Pădurea Tennis Club', 'ex. Pădurea Tennis Club')} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label={t('Phone for players', 'Telefon pentru jucători')}>
              <input className="input" value={o.phone} placeholder="07xx xxx xxx" onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label={t('Street and number', 'Strada și numărul')}>
              <input className="input" value={o.street} placeholder={t('e.g. Str. Zăgazului 4', 'ex. Str. Zăgazului 4')} onChange={(e) => set({ street: e.target.value })} />
            </Field>
            <Field label={t('City', 'Oraș')}>
              <input className="input" value={o.city} onChange={(e) => set({ city: e.target.value })} />
            </Field>
          </div>
          <div>
            <div
              className="map-box"
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
              {o.street.trim() ? (
                <MapPin size={34} fill="#12d31b" color="#0f2b28" style={{ position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -100%)' }} />
              ) : (
                <span className="muted small row" style={{ position: 'absolute', inset: 0, justifyContent: 'center', gap: 6 }}>
                  <Search size={16} /> {t('Type the address to drop the pin', 'Scrie adresa ca să apară pinul')}
                </span>
              )}
            </div>
            <div className="help">{t('Pin dropped from the address. Drag it if the entrance is somewhere else.', 'Pinul e pus după adresă. Mută-l dacă intrarea e în altă parte.')}</div>
          </div>
          <Field label={t('Sports you offer', 'Sporturile oferite')} help={t('Players pick a sport on their home screen; you only appear for the ones you tick.', 'Jucătorii aleg un sport pe ecranul principal; apari doar la cele bifate.')}>
            <Chips options={(['tennis', 'football', 'basketball', 'volleyball'] as Sport[]).map((x) => ({ v: x, label: sportName(t, x) }))} value={o.sports as Sport[]} onChange={toggle} size="sm" />
          </Field>
          <Field label={t('Photos', 'Fotografii')} help={t('A cover photo doubles bookings from new players. You can add these after review too.', 'O fotografie de copertă dublează rezervările de la jucători noi. Le poți adăuga și după verificare.')}>
            <div className="row wrap" style={{ gap: 10 }}>
              {photos.map((p) => (
                <div key={p} className="photo" style={{ width: 110, height: 76, borderRadius: 14 }}>
                  <img src={photoUrl(p)} alt="" />
                </div>
              ))}
              <button
                className="photo"
                style={{ width: 110, height: 76, borderRadius: 14, border: '1.5px dashed #c9d6c7', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => {
                  const pool = ['clay-3', 'hard-2', 'tennis-action', 'clay-1']
                  const n = pool.find((x) => !photos.includes(x))
                  if (n) setPhotos([...photos, n])
                  toast(t('Photo uploaded', 'Fotografie încărcată'))
                }}
              >
                <ImagePlus size={20} />
                <span className="small">{t('Add photo', 'Adaugă')}</span>
              </button>
            </div>
          </Field>
        </div>
      </div>
      <Side
        items={[
          [t('Shown to players', 'Ce văd jucătorii'), t('Name, distance, sports, cover photo, price from, and your rating once you have bookings.', 'Numele, distanța, sporturile, coperta, prețul de la și ratingul, după primele rezervări.')],
          [t('Change later', 'Poți schimba oricând'), t('Everything here is editable from Settings once you are live.', 'Totul se poate edita din Setări după ce ești activ.')],
        ]}
      />
    </div>
  )
}

type CourtDraft = Onb['courts'][number]

function Courts({ o, set }: StepProps) {
  const t = useT()
  const blankCourt = (): CourtDraft => ({ name: `Court ${o.courts.length + 1}`, sport: (o.sports[0] as Sport) ?? 'tennis', surface: 'clay', indoor: false, lights: true })
  const [f, setF] = useState<CourtDraft>(blankCourt())
  const [edit, setEdit] = useState<number | null>(null)
  const [ef, setEf] = useState<CourtDraft | null>(null)
  const add = () => {
    set({ courts: [...o.courts, f] })
    toast(t(`${f.name} added`, `${f.name} adăugat`))
    setF({ ...f, name: `Court ${o.courts.length + 2}` })
  }
  const form = (c: CourtDraft, setC: (c: CourtDraft) => void) => (
    <div className="col" style={{ gap: 12 }}>
      <div className="form-grid cols3">
        <Field label={t('Name', 'Nume')}>
          <input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        </Field>
        <Field label={t('Sport', 'Sport')}>
          <select className="input" value={c.sport} onChange={(e) => setC({ ...c, sport: e.target.value as Sport })}>
            {(['tennis', 'football', 'basketball', 'volleyball'] as Sport[]).map((x) => (
              <option key={x} value={x}>
                {sportName(t, x)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('Surface', 'Suprafață')}>
          <select className="input" value={c.surface} onChange={(e) => setC({ ...c, surface: e.target.value as Surface })}>
            {(['clay', 'hard', 'carpet', 'turf', 'parquet', 'asphalt'] as Surface[]).map((x) => (
              <option key={x} value={x}>
                {surfaceName(t, x).replace(/^./, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="row wrap" style={{ gap: 10 }}>
        <Chips
          options={[
            { v: 'out', label: t('Outdoor', 'Exterior') },
            { v: 'in', label: t('Indoor', 'Interior') },
          ]}
          value={c.indoor ? 'in' : 'out'}
          onChange={(x) => setC({ ...c, indoor: x === 'in' })}
          size="sm"
        />
        <button className={cx('chip sm', c.lights && 'on')} onClick={() => setC({ ...c, lights: !c.lights })}>
          <Lightbulb size={15} /> {t('Has lights', 'Are nocturnă')}
        </button>
      </div>
    </div>
  )
  const desc = (c: CourtDraft) => [sportName(t, c.sport), surfaceName(t, c.surface), c.indoor ? t('Indoor', 'Interior') : t('Outdoor', 'Exterior'), c.lights ? t('Lights', 'Nocturnă') : ''].filter(Boolean).join(' · ')
  return (
    <div className="onb-body">
      <div className="col" style={{ gap: 18 }}>
        <div>
          <h1 className="c-title">{t('Your courts', 'Terenurile tale')}</h1>
          <div className="muted">{t('Each court is a column in your schedule. Add every court, even the ones you only rent in summer.', 'Fiecare teren e o coloană în program. Adaugă toate terenurile, chiar și pe cele închiriate doar vara.')}</div>
        </div>
        {o.courts.length > 0 && (
          <div className="panel" style={{ padding: '4px 20px' }}>
            <div className="muted small" style={{ padding: '12px 0 2px' }}>
              {o.courts.length} {t('courts · tap a court to edit', 'terenuri · apasă pe un teren ca să-l editezi')}
            </div>
            {o.courts.map((c, i) => (
              <button key={i} className="mrow" onClick={() => (setEdit(i), setEf(c))}>
                <div className="grow">
                  <b>{c.name}</b>
                  <div className="muted small">{desc(c)}</div>
                </div>
                <Pencil size={16} />
              </button>
            ))}
          </div>
        )}
        <div className="panel col" style={{ gap: 14 }}>
          <h3>{t('Add a court', 'Adaugă un teren')}</h3>
          {form(f, setF)}
          <button className="btn dark" style={{ alignSelf: 'flex-start' }} onClick={add} disabled={!f.name.trim()}>
            <Plus size={17} /> {t('Add court', 'Adaugă terenul')}
          </button>
        </div>
      </div>
      <Side
        items={[
          [t('Closing a court for a day', 'Închizi un teren pentru o zi'), t("You don't need to delete it. From the schedule, block the court for rain, maintenance or a private event.", 'Nu trebuie să-l ștergi. Din program, blochează terenul pentru ploaie, mentenanță sau un eveniment privat.')],
          [t('Different prices per court', 'Prețuri diferite pe teren'), t('Set a base price on the next step, then override single courts (e.g. indoor costs more).', 'Setezi un preț de bază la pasul următor, apoi poți schimba prețul pe terenuri (ex. interiorul costă mai mult).')],
        ]}
      />
      <Sheet
        open={edit != null}
        onClose={() => setEdit(null)}
        title={t('Edit court', 'Editează terenul')}
        footer={
          <>
            <button
              className="btn danger-outline"
              onClick={() => {
                set({ courts: o.courts.filter((_, j) => j !== edit) })
                setEdit(null)
              }}
            >
              <Trash2 size={16} /> {t('Remove', 'Șterge')}
            </button>
            <button
              className="btn primary grow"
              onClick={() => {
                set({ courts: o.courts.map((c, j) => (j === edit ? ef! : c)) })
                setEdit(null)
              }}
            >
              {t('Save', 'Salvează')}
            </button>
          </>
        }
      >
        {ef && form(ef, setEf)}
      </Sheet>
    </div>
  )
}

function HoursPrices({ o, set }: StepProps) {
  const t = useT()
  const { lang } = useLang()
  const setDay = (i: number, p: Partial<Onb['hours'][number]>) => set({ hours: o.hours.map((h, j) => (j === i ? { ...h, ...p } : h)) })
  const indoor = o.courts.find((c) => c.indoor)
  return (
    <div className="onb-body">
      <div className="col" style={{ gap: 18 }}>
        <div>
          <h1 className="c-title">{t('Hours and prices', 'Program și prețuri')}</h1>
          <div className="muted">{t('When players can book, and what they pay.', 'Când pot rezerva jucătorii și cât plătesc.')}</div>
        </div>
        <div className="panel" style={{ padding: '6px 20px' }}>
          <div className="row between" style={{ padding: '12px 0 2px' }}>
            <h3>{t('Opening hours', 'Program')}</h3>
            <button className="btn ghost sm" onClick={() => set({ hours: o.hours.map(() => ({ ...o.hours[0] })) })}>
              {t('Copy Monday to every day', 'Copiază lunea pe toate zilele')}
            </button>
          </div>
          {o.hours.map((h, i) => (
            <div key={i} className="mrow" style={{ flexWrap: 'wrap' }}>
              <b style={{ width: 100 }}>{dayLong(lang, i)}</b>
              <Toggle on={h.open} onChange={(x) => setDay(i, { open: x })} />
              {h.open ? (
                <div className="row" style={{ gap: 6 }}>
                  <select className="select-sm" value={h.from} onChange={(e) => setDay(i, { from: Number(e.target.value) })}>
                    {TIMES.map((x) => (
                      <option key={x} value={x}>
                        {hm(x)}
                      </option>
                    ))}
                  </select>
                  –
                  <select className="select-sm" value={h.to} onChange={(e) => setDay(i, { to: Number(e.target.value) })}>
                    {TIMES.filter((x) => x > h.from).map((x) => (
                      <option key={x} value={x}>
                        {hm(x)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="muted">{t('Closed', 'Închis')}</span>
              )}
            </div>
          ))}
        </div>
        <div className="panel col" style={{ gap: 14 }}>
          <h3>{t('Prices per hour', 'Prețuri pe oră')}</h3>
          <div className="muted small">{t("Base price for every court. Players see the price before they pick a slot; it's charged per hour booked.", 'Preț de bază pentru fiecare teren. Jucătorii văd prețul înainte să aleagă intervalul; se plătește pe oră rezervată.')}</div>
          <div className="form-grid cols3">
            <Field label={t('Base price (lei)', 'Preț de bază (lei)')}>
              <input className="input" type="number" value={o.base} placeholder="120" onChange={(e) => set({ base: e.target.value })} />
            </Field>
            <Field label={t('Evening, from 17:00', 'Seara, de la 17:00')} help={t('Leave empty for no evening price', 'Lasă gol pentru fără preț de seară')}>
              <input className="input" type="number" value={o.evening} placeholder="—" onChange={(e) => set({ evening: e.target.value })} />
            </Field>
            <Field label={t('Weekend', 'Weekend')}>
              <input className="input" type="number" value={o.weekend} placeholder="—" onChange={(e) => set({ weekend: e.target.value })} />
            </Field>
          </div>
          {indoor && (
            <div className="note plain">
              {t(`${indoor.name} (indoor) can have its own price. Set it in Courts & prices after review.`, `${indoor.name} (interior) poate avea preț propriu. Îl setezi în Terenuri și prețuri după verificare.`)}
            </div>
          )}
          <Field label={t('Slot length', 'Lungimea intervalului')} help={t('How long one booking lasts by default. Players can book several in a row.', 'Cât durează implicit o rezervare. Jucătorii pot rezerva mai multe la rând.')}>
            <Chips options={[30, 60, 90].map((m) => ({ v: m as 30 | 60 | 90, label: `${m} min` }))} value={o.slot} onChange={(m) => set({ slot: m })} size="sm" />
          </Field>
        </div>
      </div>
      <Side
        items={[
          [t('Price shown in the app', 'Prețul din aplicație'), t(`Players see "from ${o.base || 120} lei" on your venue card and the exact price on each slot.`, `Jucătorii văd „de la ${o.base || 120} lei” pe cardul bazei și prețul exact la fiecare interval.`)],
          [t('Holidays', 'Sărbători'), t("Set special hours for a single day from the schedule: block the hours you're closed.", 'Setezi un program special pentru o zi din program: blochezi orele în care ești închis.')],
        ]}
      />
    </div>
  )
}

function Opt({ on, onClick, title, sub, rec }: { on: boolean; onClick: () => void; title: string; sub?: string; rec?: string }) {
  return (
    <button className="soft-card row" style={{ textAlign: 'left', gap: 12, padding: '14px 16px', border: on ? '1.5px solid var(--ink)' : '1.5px solid transparent', width: '100%', alignItems: 'flex-start' }} onClick={onClick}>
      <span className={cx('radio', on && 'on')} style={{ marginTop: 2 }} />
      <span className="grow">
        <b>{title}</b>
        {rec && <span className="badge" style={{ marginLeft: 8, height: 24 }}>{rec}</span>}
        {sub && <div className="muted small">{sub}</div>}
      </span>
    </button>
  )
}

function PoliciesStep({ o, set }: StepProps) {
  const t = useT()
  const shown = `${o.payment === 'online' ? t('Pay online', 'Plată online') : t('Pay online or at the venue', 'Plată online sau la bază')} · ${o.cancel ? t(`Free cancellation until ${o.cancel} h before`, `Anulare gratuită cu până la ${o.cancel} h înainte`) : t('No refunds', 'Fără rambursare')}`
  return (
    <div className="onb-body">
      <div className="col" style={{ gap: 18 }}>
        <div>
          <h1 className="c-title">{t('Your policies', 'Regulile tale')}</h1>
          <div className="muted">{t('These show on the court screen before a player pays, so nobody is surprised.', 'Apar pe ecranul terenului înainte ca jucătorul să plătească, ca nimeni să nu fie surprins.')}</div>
        </div>
        <div className="panel col" style={{ gap: 10 }}>
          <h3>{t('Payment', 'Plată')}</h3>
          <Opt on={o.payment === 'online'} onClick={() => set({ payment: 'online' })} rec={t('Recommended', 'Recomandat')} title={t('Online only', 'Doar online')} sub={t('Players pay in the app when they book. No unpaid slots, no no-shows on your money.', 'Jucătorii plătesc în aplicație la rezervare. Fără intervale neplătite, fără pierderi din neprezentări.')} />
          <Opt on={o.payment === 'both'} onClick={() => set({ payment: 'both' })} title={t('Online or at the venue', 'Online sau la bază')} sub={t('Players may choose to pay at reception. You mark it paid at check-in; unpaid no-shows are on you.', 'Jucătorii pot alege să plătească la recepție. Marchezi plata la sosire; neprezentările neplătite sunt pe riscul tău.')} />
        </div>
        <div className="panel col" style={{ gap: 10 }}>
          <h3>{t('Cancellation', 'Anulare')}</h3>
          <div className="form-grid cols2">
            <Opt on={o.cancel === 24} onClick={() => set({ cancel: 24 })} title={t('Free until 24 h before', 'Gratuit cu 24 h înainte')} sub={t('Later than that, the player is charged in full and you receive the payout.', 'Mai târziu, jucătorul plătește integral și tu primești banii.')} />
            <Opt on={o.cancel === 12} onClick={() => set({ cancel: 12 })} title={t('Free until 12 h before', 'Gratuit cu 12 h înainte')} sub={t('Friendlier for players, more empty courts for you.', 'Mai prietenos pentru jucători, mai multe terenuri goale pentru tine.')} />
            <Opt on={o.cancel === 6} onClick={() => set({ cancel: 6 })} title={t('Free until 6 h before', 'Gratuit cu 6 h înainte')} />
            <Opt on={o.cancel === 0} onClick={() => set({ cancel: 0 })} title={t('No refunds', 'Fără rambursare')} sub={t('Every booking is final once paid.', 'Orice rezervare e finală după plată.')} />
          </div>
          <div className="muted small">{t('Rain or a court you had to close: you cancel from the schedule and the player is always refunded in full.', 'Ploaie sau un teren închis: anulezi din program și jucătorul primește mereu banii înapoi integral.')}</div>
        </div>
        <div className="panel col" style={{ gap: 12 }}>
          <div className="form-grid cols2">
            <Field label={t('Players can book up to', 'Jucătorii pot rezerva cu până la')}>
              <select className="input" value={o.window} onChange={(e) => set({ window: Number(e.target.value) })}>
                {[7, 14, 30, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} {t('days ahead', 'zile înainte')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('Minimum notice', 'Preaviz minim')}>
              <select className="input" value={o.notice} onChange={(e) => set({ notice: Number(e.target.value) })}>
                {[0, 1, 2, 24].map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? t('None', 'Fără') : `${n} h`}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div className="panel col" style={{ gap: 14 }}>
          <h3>{t('Open games', 'Jocuri deschise')}</h3>
          <div className="row">
            <div className="grow">
              <b>{t('Players may open their booking to the community', 'Jucătorii își pot deschide rezervarea comunității')}</b>
              <div className="muted small">{t('A player who booked alone can invite others to fill the spots. Your court stays booked and paid either way.', 'Un jucător care a rezervat singur poate invita alții să completeze locurile. Terenul rămâne rezervat și plătit oricum.')}</div>
            </div>
            <Toggle on={o.openGames} onChange={(x) => set({ openGames: x, showInFind: x && o.showInFind })} />
          </div>
          <div className="row" style={{ opacity: o.openGames ? 1 : 0.45 }}>
            <div className="grow">
              <b>{t("Show open games from your venue in the app's Find a match", 'Arată jocurile deschise de la tine în Găsește un meci')}</b>
              <div className="muted small">{t('Brings new players to your courts.', 'Aduce jucători noi pe terenurile tale.')}</div>
            </div>
            <Toggle on={o.showInFind} onChange={(x) => o.openGames && set({ showInFind: x })} />
          </div>
        </div>
      </div>
      <Side
        items={[
          [t('Shown to players', 'Ce văd jucătorii'), t(`"${shown}" appears under the price on your court screen.`, `„${shown}” apare sub preț pe ecranul terenului.`)],
          [t('You can change this', 'Poți schimba oricând'), t('Policies apply to new bookings only; existing ones keep the policy they were booked under.', 'Regulile se aplică doar rezervărilor noi; cele existente le păstrează pe cele de la momentul rezervării.')],
        ]}
      />
    </div>
  )
}

function Payouts({ o, set }: StepProps) {
  const t = useT()
  return (
    <div className="onb-body">
      <div className="col" style={{ gap: 18 }}>
        <div>
          <h1 className="c-title">{t('Payouts', 'Plăți')}</h1>
          <div className="muted">{t('Where app payments go. At-venue payments never pass through Courtal.', 'Unde ajung plățile din aplicație. Plățile la bază nu trec niciodată prin Courtal.')}</div>
        </div>
        <div className="panel col" style={{ gap: 14 }}>
          <Field label={t('Legal entity', 'Formă juridică')}>
            <Chips
              options={[
                { v: 'srl' as const, label: 'SRL' },
                { v: 'pfa' as const, label: 'PFA' },
                { v: 'club' as const, label: t('Association / club', 'Asociație / club') },
              ]}
              value={o.entity}
              onChange={(x) => set({ entity: x })}
              size="sm"
            />
          </Field>
          <div className="form-grid cols2">
            <Field label={t('Company name', 'Denumire')}>
              <input className="input" value={o.company} placeholder={o.name ? `${o.name} SRL` : ''} onChange={(e) => set({ company: e.target.value })} />
            </Field>
            <Field label="CUI">
              <input className="input" value={o.cui} placeholder="RO 12345678" onChange={(e) => set({ cui: e.target.value })} />
            </Field>
          </div>
          <Field label={t('Registered address', 'Sediu social')}>
            <input className="input" value={o.regAddress} onChange={(e) => set({ regAddress: e.target.value })} />
          </Field>
        </div>
        <div className="panel col" style={{ gap: 14 }}>
          <h3>{t('Bank account', 'Cont bancar')}</h3>
          <div className="form-grid cols2">
            <Field label="IBAN">
              <input className="input" value={o.iban} placeholder="RO49 AAAA 1B31 0075 9384 0000" onChange={(e) => set({ iban: e.target.value })} />
            </Field>
            <Field label={t('Account holder', 'Titular cont')}>
              <input className="input" value={o.holder} placeholder={o.company} onChange={(e) => set({ holder: e.target.value })} />
            </Field>
          </div>
          <div className="muted small">{t('Paid out every Monday for the previous week. Invoice generated automatically.', 'Plătit în fiecare luni pentru săptămâna anterioară. Factura se generează automat.')}</div>
        </div>
        <div className="panel col" style={{ gap: 8 }}>
          <h3>{t('Courtal fee', 'Comisionul Courtal')}</h3>
          <div className="row between">
            <span>{t('App-paid bookings', 'Rezervări plătite în aplicație')}</span>
            <b>{t('10% per booking', '10% pe rezervare')}</b>
          </div>
          <div className="row between">
            <span>{t('Paid at the venue', 'Plătite la bază')}</span>
            <b>{t('No fee', 'Fără comision')}</b>
          </div>
          <div className="row between">
            <span>{t('Monthly subscription', 'Abonament lunar')}</span>
            <b>{t('None', 'Niciunul')}</b>
          </div>
          <div className="soft-card" style={{ padding: '10px 14px', marginTop: 6 }}>
            {t('Example at 10%:', 'Exemplu la 10%:')} <b>{fmtMoney(120)}</b> {t('booking', 'rezervare')} → <b>{fmtMoney(108)}</b> {t('to you', 'la tine')}
          </div>
        </div>
      </div>
      <Side
        items={[
          [t('Why we ask', 'De ce cerem asta'), t('Payouts to a company account need CUI and IBAN by law. Courtal issues the invoice for its fee each month.', 'Plățile într-un cont de firmă necesită prin lege CUI și IBAN. Courtal emite lunar factura pentru comision.')],
          [t('Submit', 'Trimite'), t('After this step we review your venue. Nothing is charged until your first app-paid booking.', 'După acest pas îți verificăm baza. Nu se percepe nimic până la prima rezervare plătită în aplicație.')],
        ]}
      />
    </div>
  )
}

/* ---------------- A6 under review ---------------- */
export function UnderReview() {
  const t = useT()
  const nav = useNavigate()
  const v = useVenue()
  void todayISO
  const Step = ({ n, title, body, on }: { n: number; title: string; body: string; on?: boolean }) => (
    <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
      <span className="icon-btn" style={{ background: on ? 'var(--ink)' : 'var(--green-soft)', color: on ? '#fff' : undefined, flex: 'none', fontWeight: 600 }}>
        {n}
      </span>
      <div>
        <b>{title}</b>
        <div className="muted small">{body}</div>
      </div>
    </div>
  )
  return (
    <div className="two-col">
      <div className="col" style={{ gap: 18 }}>
        <div>
          <span className="badge amber" style={{ marginBottom: 12 }}>
            {t('Under review', 'În verificare')}
          </span>
          <h1 className="c-title">{t(`Thanks. ${v.name} is under review.`, `Mulțumim. ${v.name} e în verificare.`)}</h1>
          <div className="muted" style={{ fontSize: 16 }}>
            {t('We check the address and call the number you gave us. Most venues are live within 2 working days.', 'Verificăm adresa și sunăm la numărul dat. Majoritatea bazelor sunt active în 2 zile lucrătoare.')}
          </div>
        </div>
        <div className="panel col" style={{ gap: 16 }}>
          <Step n={1} on title={t('Review', 'Verificare')} body={t('Address check and a call from Courtal · within 2 working days', 'Verificarea adresei și un telefon de la Courtal · în 2 zile lucrătoare')} />
          <Step n={2} title={t('Visible to players', 'Vizibil pentru jucători')} body={t('Your venue appears in the app after review', 'Baza apare în aplicație după verificare')} />
          <Step n={3} title={t('First payout', 'Prima plată')} body={t('The Monday after your first app-paid booking', 'Lunea de după prima rezervare plătită în aplicație')} />
        </div>
        <div className="panel col" style={{ gap: 10 }}>
          <h3>{t('Meanwhile, fill your schedule', 'Între timp, completează programul')}</h3>
          <div className="muted small">{t('Add the bookings you already have so the calendar is right on day one. Nothing is visible to players until review ends.', 'Adaugă rezervările pe care le ai deja, ca programul să fie corect din prima zi. Nimic nu e vizibil jucătorilor până la finalul verificării.')}</div>
          <div className="row wrap" style={{ gap: 10 }}>
            <button className="btn primary" onClick={() => nav('/console/today')}>
              {t('Open the schedule', 'Deschide programul')} <ArrowRight size={17} />
            </button>
            <button className="btn outline" onClick={() => nav('/console/courts')}>
              <Eye size={16} /> {t('Check your courts', 'Verifică terenurile')}
            </button>
          </div>
        </div>
      </div>
      <div className="col" style={{ gap: 14 }}>
        <div className="panel col" style={{ gap: 6 }}>
          <b>{t('Need to change something?', 'Vrei să schimbi ceva?')}</b>
          <div className="muted small">{t('Everything you entered is editable under Settings while we review.', 'Tot ce ai introdus se poate edita din Setări cât timp verificăm.')}</div>
          <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/console/settings/profile')}>
            {t('Open Settings', 'Deschide Setări')}
          </button>
        </div>
        <div className="panel col" style={{ gap: 6 }}>
          <b>{t('Questions', 'Întrebări')}</b>
          <div className="muted small">{t('venues@courtal.ro · we answer the same day.', 'venues@courtal.ro · răspundem în aceeași zi.')}</div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn ghost sm" onClick={() => nav('/console/settings/help?topic=other')}>
              <Mail size={15} /> {t('Write to us', 'Scrie-ne')}
            </button>
            <a className="btn ghost sm" href="tel:+40312290410">
              <Phone size={15} /> 031 229 0410
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

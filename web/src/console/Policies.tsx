import { useState } from 'react'
import { History, Smartphone } from 'lucide-react'
import { useDemo, update } from '../lib/store'
import { useLang, useT } from '../lib/i18n'
import { todayISO } from '../lib/time'
import type { VenueSettings } from '../lib/types'
import { Chips, Confirm, Sheet, Toggle, cx, toast } from '../ui'
import { useVenue, venueBookings } from './util'

const RULE_CHIPS: [string, string][] = [
  ['Clay shoes required', 'Încălțăminte pentru zgură obligatorie'],
  ['Arrive 10 min early', 'Vino cu 10 min mai devreme'],
  ['Max 4 players per court', 'Maximum 4 jucători pe teren'],
  ['Changing rooms close 15 min after the last slot', 'Vestiarele se închid la 15 min după ultimul interval'],
]

export function whenText(lang: string, at: number) {
  const d = new Date(at)
  return d.toLocaleString(lang === 'ro' ? 'ro-RO' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function policySummary(t: ReturnType<typeof useT>, d: VenueSettings) {
  const pay = d.payment === 'online' ? t('Pay online in the app', 'Plată online în aplicație') : t('Pay online or at the venue', 'Plată online sau la bază')
  const cancel = d.cancel === 0 ? t('No refunds after booking', 'Fără rambursare după rezervare') : t(`Free cancellation until ${d.cancel} h before`, `Anulare gratuită cu până la ${d.cancel} h înainte`)
  return `${pay} · ${cancel}`
}

export function Policies() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const v = useVenue()
  const [d, setD] = useState<VenueSettings>(structuredClone(v.settings))
  const [confirm, setConfirm] = useState(false)
  const [hist, setHist] = useState(false)
  const dirty = JSON.stringify({ ...d, history: [] }) !== JSON.stringify({ ...v.settings, history: [] })
  const upcoming = venueBookings(s, v).filter((b) => b.kind === 'booking' && b.status === 'booked' && b.date >= todayISO()).length
  const last = v.settings.history[0]

  const changes = () => {
    const o = v.settings
    const out: string[] = []
    if (o.payment !== d.payment) out.push(t('Payment', 'Plată') + ': ' + (d.payment === 'online' ? t('online only', 'doar online') : t('online or at the venue', 'online sau la bază')))
    if (o.cancel !== d.cancel) out.push(t('Cancellation', 'Anulare') + ': ' + (d.cancel ? `${d.cancel} h` : t('no refunds', 'fără rambursare')))
    if (o.window !== d.window) out.push(t('Booking window', 'Rezervări în avans') + `: ${d.window} ${t('days', 'zile')}`)
    if (o.notice !== d.notice) out.push(t('Minimum notice', 'Preaviz minim') + `: ${d.notice} h`)
    if (o.openGames !== d.openGames || o.showInFind !== d.showInFind) out.push(t('Open games', 'Jocuri deschise'))
    if (o.rules !== d.rules) out.push(t('House rules', 'Regulile casei'))
    return out.join(' · ') || t('Policies', 'Reguli')
  }
  const save = () => {
    const what = changes()
    update((x) => {
      const vv = x.venues.find((y) => y.id === v.id)!
      vv.settings = { ...d, history: [{ who: 'Mihai', at: Date.now(), what }, ...v.settings.history] }
    })
    toast(t('Policies saved · applies to new bookings', 'Reguli salvate · se aplică rezervărilor noi'))
  }

  const Option = ({ on, onClick, title, sub, rec }: { on: boolean; onClick: () => void; title: string; sub?: string; rec?: boolean }) => (
    <button className={cx('soft-card row', on && 'on')} style={{ textAlign: 'left', gap: 12, padding: '14px 16px', border: on ? '1.5px solid var(--ink)' : '1.5px solid transparent', width: '100%' }} onClick={onClick}>
      <span className={cx('radio', on && 'on')} />
      <span className="grow">
        <b>{title}</b>
        {rec && <span className="badge" style={{ marginLeft: 8, height: 24 }}>{t('Recommended', 'Recomandat')}</span>}
        {sub && <div className="muted small">{sub}</div>}
      </span>
    </button>
  )

  return (
    <div>
      <div className="c-head">
        <h1 className="c-title">{t('Policies', 'Reguli')}</h1>
        <div className="spacer" />
        <button className="btn ghost sm" onClick={() => setHist(true)}>
          <History size={16} /> {t('History', 'Istoric')}
        </button>
      </div>
      <div className="two-col">
        <div className="col" style={{ gap: 14 }}>
          <div className="panel col" style={{ gap: 10 }}>
            <h3>{t('Payment', 'Plată')}</h3>
            <Option on={d.payment === 'online'} onClick={() => setD({ ...d, payment: 'online' })} rec title={t('Online only', 'Doar online')} sub={t('Players pay in the app when they book. Fewer no-shows.', 'Jucătorii plătesc în aplicație la rezervare. Mai puține neprezentări.')} />
            <Option on={d.payment === 'both'} onClick={() => setD({ ...d, payment: 'both' })} title={t('Online or at the venue', 'Online sau la bază')} sub={t('Players choose. At-venue payments stay at your desk.', 'Jucătorii aleg. Plățile la bază rămân la recepție.')} />
          </div>
          <div className="panel col" style={{ gap: 10 }}>
            <h3>{t('Cancellation', 'Anulare')}</h3>
            <div className="muted small">{t('Until when players can cancel for a full refund.', 'Până când pot anula jucătorii cu rambursare integrală.')}</div>
            <Chips
              options={[
                { v: 24 as const, label: t('24 h before', '24 h înainte') },
                { v: 12 as const, label: t('12 h before', '12 h înainte') },
                { v: 6 as const, label: t('6 h before', '6 h înainte') },
                { v: 0 as const, label: t('No refunds', 'Fără rambursare') },
              ]}
              value={d.cancel}
              onChange={(x) => setD({ ...d, cancel: x })}
              size="sm"
            />
          </div>
          <div className="panel col" style={{ gap: 10 }}>
            <h3>{t('Booking window', 'Rezervări în avans')}</h3>
            <div className="muted small">{t('How far ahead players can book.', 'Cu cât timp înainte pot rezerva jucătorii.')}</div>
            <Chips options={[7, 14, 30, 60].map((n) => ({ v: n, label: `${n} ${t('days', 'zile')}` }))} value={d.window} onChange={(x) => setD({ ...d, window: x })} size="sm" />
            <h3 style={{ marginTop: 10 }}>{t('Minimum notice', 'Preaviz minim')}</h3>
            <div className="muted small">{t('The latest a player can book before the start.', 'Cel mai târziu cu cât timp înainte de start poate rezerva un jucător.')}</div>
            <Chips
              options={[0, 1, 2, 24].map((n) => ({ v: n, label: n === 0 ? t('None', 'Fără') : `${n} h` }))}
              value={d.notice}
              onChange={(x) => setD({ ...d, notice: x })}
              size="sm"
            />
          </div>
          <div className="panel col" style={{ gap: 14 }}>
            <h3>{t('Open games', 'Jocuri deschise')}</h3>
            <div className="row">
              <div className="grow">
                <b>{t('Players may open their booking to the community', 'Jucătorii își pot deschide rezervarea comunității')}</b>
                <div className="muted small">{t('Others can join and split the price. More full courts, same booking.', 'Alții se pot alătura și împart prețul. Terenuri mai pline, aceeași rezervare.')}</div>
              </div>
              <Toggle on={d.openGames} onChange={(x) => setD({ ...d, openGames: x, showInFind: x ? d.showInFind : false })} />
            </div>
            <div className="row" style={{ opacity: d.openGames ? 1 : 0.45 }}>
              <div className="grow">
                <b>{t('Show open games from your venue in Find a match', 'Arată jocurile deschise de la tine în Găsește un meci')}</b>
              </div>
              <Toggle on={d.showInFind} onChange={(x) => d.openGames && setD({ ...d, showInFind: x })} />
            </div>
          </div>
          <div className="panel col" style={{ gap: 10 }}>
            <h3>{t('House rules', 'Regulile casei')}</h3>
            <div className="muted small">{t('Shown on your venue screen, under the price.', 'Apar pe ecranul bazei, sub preț.')}</div>
            <div className="chips">
              {RULE_CHIPS.map(([en, ro]) => {
                const txt = t(en, ro)
                return (
                  <button
                    key={en}
                    className="chip sm"
                    onClick={() => !d.rules.includes(txt) && setD({ ...d, rules: d.rules ? `${d.rules.replace(/\.?\s*$/, '')}. ${txt}.` : `${txt}.` })}
                  >
                    + {txt}
                  </button>
                )
              })}
            </div>
            <textarea className="textarea" rows={4} value={d.rules} onChange={(e) => setD({ ...d, rules: e.target.value })} placeholder={t('e.g. Clay shoes required.', 'ex. Încălțăminte pentru zgură obligatorie.')} />
          </div>
          {last && (
            <button className="link muted small" style={{ alignSelf: 'flex-start' }} onClick={() => setHist(true)}>
              {t('Last changed by', 'Ultima modificare:')} {last.who} · {whenText(lang, last.at)}
            </button>
          )}
          {dirty && (
            <div className="savebar">
              <span className="grow">{t('Unsaved changes', 'Modificări nesalvate')}</span>
              <button className="btn sm" style={{ color: '#fff' }} onClick={() => setD(structuredClone(v.settings))}>
                {t('Discard', 'Renunță')}
              </button>
              <button className="btn primary sm" onClick={() => setConfirm(true)}>
                {t('Save', 'Salvează')}
              </button>
            </div>
          )}
        </div>
        <div className="col" style={{ gap: 14, position: 'sticky', top: 20 }}>
          <div className="panel col" style={{ gap: 12 }}>
            <div className="row" style={{ gap: 8 }}>
              <Smartphone size={18} />
              <h3>{t('Shown to players', 'Ce văd jucătorii')}</h3>
            </div>
            <div className="soft-card col" style={{ gap: 8, padding: 16 }}>
              <b>{v.name}</b>
              <div className="small">{policySummary(t, d)}</div>
              <div className="muted small">
                {t(`Book up to ${d.window} days ahead`, `Rezervări cu până la ${d.window} zile înainte`)}
                {d.notice ? ` · ${t(`at least ${d.notice} h before`, `cu minimum ${d.notice} h înainte`)}` : ''}
              </div>
              {d.openGames && <div className="muted small">{t('You can open your booking to other players', 'Îți poți deschide rezervarea altor jucători')}</div>}
              {d.rules && (
                <div className="small" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
                  {d.rules}
                </div>
              )}
            </div>
            <div className="tiny muted">{t('Updates as you change things on the left.', 'Se actualizează pe măsură ce modifici.')}</div>
          </div>
        </div>
      </div>
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('Save policies?', 'Salvezi regulile?')}
        body={t(`Applies to new bookings only. ${upcoming} upcoming bookings keep the policy they were booked under.`, `Se aplică doar rezervărilor noi. Cele ${upcoming} rezervări viitoare își păstrează regulile de la momentul rezervării.`)}
        confirm={t('Save', 'Salvează')}
        cancel={t('Cancel', 'Renunță')}
        onConfirm={save}
      />
      <Sheet open={hist} onClose={() => setHist(false)} title={t('Change history', 'Istoric modificări')}>
        <div className="list">
          {v.settings.history.map((h, i) => (
            <div key={i} className="list-row" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <b>{h.what}</b>
                <div className="muted small">
                  {h.who} · {whenText(lang, h.at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

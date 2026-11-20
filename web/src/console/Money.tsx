import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Download, Search, ChevronRight, CircleCheck, Clock, Info, FileText } from 'lucide-react'
import { useDemo } from '../lib/store'
import { dayShort, fmtDM, fmtDate, fmtMoney, monthLong, monthShort, useLang, useT } from '../lib/i18n'
import { addDays, hm, mondayOf, parseISO, todayISO, weekday, nowMin, iso } from '../lib/time'
import type { Booking, DemoState, Venue } from '../lib/types'
import { Chips, Field, Sheet, courtName, cx, toast } from '../ui'
import { court } from '../lib/store'
import { useVenue } from './util'
import { BookingSheet } from './sheets'

const FEE = 0.1
type Tab = 'payouts' | 'transactions' | 'invoices'

const money = (s: DemoState, v: Venue) => s.bookings.filter((b) => b.venueId === v.id && b.kind === 'booking')
const happened = (b: Booking, today: string, now: number) => b.date < today || (b.date === today && b.start <= now)

function sums(list: Booking[]) {
  let online = 0
  let venue = 0
  let unpaid = 0
  let refunds = 0
  for (const b of list) {
    if (b.status === 'cancelled') {
      if (b.pay === 'online') refunds += b.price
      continue
    }
    if (b.status === 'noshow' && b.pay === 'unpaid') continue
    if (b.pay === 'online') online += b.price
    else if (b.pay === 'venue') venue += b.price
    else if (b.pay === 'unpaid') unpaid += b.price
  }
  return { online, venue, unpaid, refunds, earned: online + venue }
}

export type Payout = { id: string; date: string; from: string; to: string; gross: number; fee: number; refunds: number; net: number; paid: boolean; items: Booking[] }

function payouts(s: DemoState, v: Venue, today: string): Payout[] {
  const all = money(s, v)
  const out: Payout[] = []
  const thisMon = mondayOf(today)
  for (let w = 1; w >= -5; w--) {
    const from = addDays(thisMon, (w - 1) * 7)
    const to = addDays(from, 6)
    const date = addDays(to, 1)
    const items = all.filter((b) => b.date >= from && b.date <= to && b.pay === 'online')
    const live = items.filter((b) => b.status !== 'cancelled' && (date <= today || happened(b, today, nowMin())))
    const gross = live.reduce((a, b) => a + b.price, 0)
    const refunds = items.filter((b) => b.status === 'cancelled' && b.cancelledBy === 'venue').reduce((a, b) => a + b.price, 0)
    const fee = Math.round(gross * FEE)
    out.push({ id: date, date, from, to, gross, fee, refunds: 0, net: gross - fee, paid: date <= today, items: live })
    void refunds
  }
  return out
}

export function nextPayout(s: DemoState, v: Venue) {
  const today = todayISO()
  return payouts(s, v, today).find((p) => !p.paid)!
}

export function Money() {
  const s = useDemo()
  const t = useT()
  const { lang } = useLang()
  const nav = useNavigate()
  const v = useVenue()
  const [q] = useSearchParams()
  const today = todayISO()
  const now = nowMin()
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('week')
  const [custom, setCustom] = useState({ from: addDays(today, -13), to: today })
  const [customOpen, setCustomOpen] = useState(false)
  const [tab, setTab] = useState<Tab>((q.get('tab') as Tab) || 'payouts')
  const [dayF, setDayF] = useState<string | null>(null)
  const [payout, setPayout] = useState<Payout | null>(null)
  const [sel, setSel] = useState<string | null>(null)
  const [exp, setExp] = useState(false)
  const [expMonth, setExpMonth] = useState(0)
  const [expFmt, setExpFmt] = useState<'csv' | 'pdf'>('pdf')
  const [typeF, setTypeF] = useState('all')
  const [search, setSearch] = useState('')

  const range = useMemo(() => {
    if (period === 'today') return { from: today, to: today }
    if (period === 'week') return { from: mondayOf(today), to: addDays(mondayOf(today), 6) }
    if (period === 'month') return { from: today.slice(0, 8) + '01', to: iso(new Date(parseISO(today).getFullYear(), parseISO(today).getMonth() + 1, 0)) }
    return custom
  }, [period, custom, today])

  const all = money(s, v)
  const inRange = all.filter((b) => b.date >= range.from && b.date <= range.to && happened(b, today, now))
  const k = sums(inRange)
  const toCollect = sums(all.filter((b) => b.date <= today)).unpaid
  const pays = payouts(s, v, today)
  const next = pays.find((p) => !p.paid)!

  const chartDays = useMemo(() => {
    let from = range.from
    let to = range.to
    if (period === 'today') {
      from = addDays(today, -6)
      to = today
    }
    const n = Math.min(62, Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 864e5) + 1)
    return Array.from({ length: n }, (_, i) => addDays(from, i))
  }, [range, period, today])
  const bars = chartDays.map((d) => {
    const x = sums(all.filter((b) => b.date === d && happened(b, today, now)))
    return { d, online: x.online, venue: x.venue }
  })
  const maxBar = Math.max(1, ...bars.map((b) => b.online + b.venue))

  type Tx = { id: string; b: Booking; type: 'online' | 'venue' | 'refund' | 'share'; amount: number }
  const txs: Tx[] = useMemo(() => {
    const out: Tx[] = []
    for (const b of all) {
      if (b.date > today || b.date < addDays(today, -42)) continue
      if (b.status === 'cancelled') {
        if (b.pay === 'online') out.push({ id: b.id + 'r', b, type: 'refund', amount: -b.price })
        continue
      }
      if (!happened(b, today, now) && b.pay !== 'online') continue
      if (b.pay === 'online') out.push({ id: b.id, b, type: b.gameId ? 'share' : 'online', amount: b.price })
      else if (b.pay === 'venue') out.push({ id: b.id, b, type: 'venue', amount: b.price })
    }
    return out.sort((a, b) => (b.b.date + hm(b.b.start)).localeCompare(a.b.date + hm(a.b.start)))
  }, [all, today, now])
  const txList = txs.filter((x) => (typeF === 'all' || x.type === typeF) && (!dayF || x.b.date === dayF) && (!search || x.b.name.toLowerCase().includes(search.toLowerCase())))
  const txLabel = (x: Tx['type']) =>
    ({ online: t('Payment online', 'Plată online'), venue: t('Paid at venue', 'Plătit la bază'), refund: t('Refund', 'Rambursare'), share: t('Open-game share', 'Parte din joc deschis') })[x]

  const months = Array.from({ length: 4 }, (_, i) => {
    const d = parseISO(today)
    return new Date(d.getFullYear(), d.getMonth() - i - 1, 1)
  })
  const invoiceFor = (m: Date) => {
    const pre = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
    const online = all.filter((b) => b.date.startsWith(pre) && b.pay === 'online' && b.status !== 'cancelled').reduce((a, b) => a + b.price, 0)
    return Math.round(online * FEE) || 640 + ((m.getMonth() * 37) % 120)
  }
  const ibanMask = (x: string) => `${x.slice(0, 4)} •••• ${x.replace(/\s/g, '').slice(-4)}`
  const periodLabel = { today: t('Today', 'Azi'), week: t('This week', 'Săptămâna asta'), month: t('This month', 'Luna asta'), custom: t('Custom', 'Personalizat') }

  return (
    <div>
      <div className="c-head">
        <h1 className="c-title">{t('Money', 'Bani')}</h1>
        <div className="spacer" />
        <button className="btn outline sm" onClick={() => setExp(true)}>
          <Download size={16} /> {t('Export for accountant', 'Export pentru contabil')}
        </button>
      </div>
      <div className="row wrap" style={{ marginBottom: 14, gap: 10 }}>
        <Chips
          options={(['today', 'week', 'month', 'custom'] as const).map((p) => ({ v: p, label: p === 'custom' && period === 'custom' ? `${fmtDM(lang, custom.from)} – ${fmtDM(lang, custom.to)}` : periodLabel[p] }))}
          value={period}
          onChange={(p) => (p === 'custom' ? setCustomOpen(true) : setPeriod(p))}
          size="sm"
        />
      </div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))' }}>
        <button className="kpi" onClick={() => setTab('transactions')}>
          <span>{t('Earned', 'Încasat')}</span>
          <b>{fmtMoney(k.earned)}</b>
          <span>{periodLabel[period].toLowerCase()}</span>
        </button>
        <button className="kpi" onClick={() => (setTab('transactions'), setTypeF('online'))}>
          <span>{t('Online', 'Online')}</span>
          <b>{fmtMoney(k.online)}</b>
          <span>{t('paid out on Mondays', 'virat lunea')}</span>
        </button>
        <button className="kpi" onClick={() => (setTab('transactions'), setTypeF('venue'))}>
          <span>{t('At the venue', 'La bază')}</span>
          <b>{fmtMoney(k.venue)}</b>
          <span>{t('stays at your desk', 'rămâne la recepție')}</span>
        </button>
        <button className="kpi" onClick={() => nav('/console/bookings?pay=unpaid')}>
          <span>{t('To collect', 'De încasat')}</span>
          <b style={{ color: toCollect ? '#b45309' : undefined }}>{fmtMoney(toCollect)}</b>
          <span>{t('unpaid phone bookings', 'rezervări telefonice neplătite')}</span>
        </button>
        <button className="kpi" onClick={() => setPayout(next)}>
          <span>{t('Next payout', 'Următoarea plată')}</span>
          <b>~{fmtMoney(next.net)}</b>
          <span>{fmtDate(lang, next.date)}</span>
        </button>
      </div>
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="row between wrap">
          <h3>{t('Revenue per day', 'Încasări pe zi')}</h3>
          <div className="row small" style={{ gap: 14 }}>
            <span className="row" style={{ gap: 6 }}>
              <span className="dot" style={{ background: 'var(--green)' }} /> {t('Online', 'Online')}
            </span>
            <span className="row" style={{ gap: 6 }}>
              <span className="dot" style={{ background: 'var(--ink)' }} /> {t('At the venue', 'La bază')}
            </span>
          </div>
        </div>
        <div className="scroll-x">
          <div className="bars" style={{ minWidth: bars.length * 22 }}>
            {bars.map((b) => (
              <button
                key={b.d}
                onClick={() => {
                  setDayF(b.d)
                  setTab('transactions')
                  setTypeF('all')
                }}
                title={`${fmtDate(lang, b.d)} · ${fmtMoney(b.online + b.venue)}`}
                style={{ opacity: dayF && dayF !== b.d ? 0.45 : 1 }}
              >
                {b.venue > 0 && <span className="seg-venue" style={{ height: `${(b.venue / maxBar) * 130}px` }} />}
                {b.online > 0 && <span className="seg-online" style={{ height: `${(b.online / maxBar) * 130}px`, order: -1 }} />}
                <small>{bars.length <= 7 ? dayShort(lang, weekday(b.d)) : parseISO(b.d).getDate()}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tabs">
        {(
          [
            ['payouts', t('Payouts', 'Plăți către tine')],
            ['transactions', t('Transactions', 'Tranzacții')],
            ['invoices', t('Invoices', 'Facturi')],
          ] as [Tab, string][]
        ).map(([k2, l]) => (
          <button key={k2} className={cx(tab === k2 && 'on')} onClick={() => setTab(k2)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'payouts' && (
        <div className="panel" style={{ padding: '4px 20px' }}>
          {pays.map((p) => (
            <button key={p.id} className="mrow" onClick={() => setPayout(p)}>
              <div className="grow">
                <b>{fmtDate(lang, p.date)}</b>
                <div className="muted small">
                  {fmtDM(lang, p.from)} – {fmtDM(lang, p.to)} · {t('to', 'în')} {ibanMask(s.console.iban)}
                </div>
              </div>
              <b>{fmtMoney(p.net)}</b>
              {p.paid ? (
                <span className="badge">
                  <CircleCheck size={14} /> {t('Paid', 'Plătit')}
                </span>
              ) : (
                <span className="badge outline">
                  <Clock size={14} /> {t('Scheduled', 'Programat')}
                </span>
              )}
              <ChevronRight size={18} className="hide-sm" />
            </button>
          ))}
        </div>
      )}

      {tab === 'transactions' && (
        <>
          <div className="row wrap" style={{ gap: 10, marginBottom: 12 }}>
            <div className="input row" style={{ maxWidth: 260, gap: 8, padding: '0 14px' }}>
              <Search size={17} />
              <input style={{ border: 0, outline: 0, background: 'transparent', flex: 1, minWidth: 0, font: 'inherit' }} placeholder={t('Search by name', 'Caută după nume')} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Chips
              options={[
                { v: 'all', label: t('All', 'Toate') },
                { v: 'online', label: txLabel('online') },
                { v: 'venue', label: txLabel('venue') },
                { v: 'refund', label: txLabel('refund') },
                { v: 'share', label: txLabel('share') },
              ]}
              value={typeF}
              onChange={setTypeF}
              size="sm"
            />
            {dayF && (
              <button className="chip sm on" onClick={() => setDayF(null)}>
                {fmtDate(lang, dayF)} ✕
              </button>
            )}
          </div>
          <div className="note plain" style={{ marginBottom: 12 }}>
            <Info size={18} style={{ flex: 'none' }} />
            <span>
              {t('Refunds happen when you cancel a booking.', 'Rambursările se fac când anulezi o rezervare.')}{' '}
              <button className="link" onClick={() => nav('/console/bookings')}>
                {t('Go to Bookings', 'Mergi la Rezervări')}
              </button>
            </span>
          </div>
          <div className="panel" style={{ padding: '4px 20px' }}>
            {txList.length === 0 && <div className="muted" style={{ padding: 20 }}>{t('No transactions for this filter.', 'Nicio tranzacție pentru acest filtru.')}</div>}
            {txList.slice(0, 120).map((x) => (
              <button key={x.id} className="mrow" onClick={() => setSel(x.b.id)}>
                <div className="grow">
                  <b>{x.b.name}</b>
                  <div className="muted small">
                    {txLabel(x.type)} · {fmtDate(lang, x.b.date)} {hm(x.b.start)} · {courtName(t, court(v, x.b.courtId).name)}
                    {x.type === 'venue' && x.b.payMethod ? ` · ${x.b.payMethod === 'cash' ? t('cash', 'numerar') : t('card', 'card')}` : ''}
                  </div>
                </div>
                <b style={{ color: x.amount < 0 ? 'var(--danger)' : undefined }}>
                  {x.amount < 0 ? '−' : ''}
                  {fmtMoney(Math.abs(x.amount))}
                </b>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'invoices' && (
        <>
          <div className="panel" style={{ padding: '4px 20px' }}>
            {months.map((m) => (
              <button key={m.toISOString()} className="mrow" onClick={() => toast(t(`courtal-invoice-${monthShort('en', m.getMonth()).toLowerCase()}-${m.getFullYear()}.pdf downloaded`, `courtal-factura-${monthShort('ro', m.getMonth()).replace('.', '')}-${m.getFullYear()}.pdf descărcată`))}>
                <FileText size={20} />
                <div className="grow">
                  <b>
                    {monthLong(lang, m.getMonth())} {m.getFullYear()}
                  </b>
                  <div className="muted small">
                    {t('Courtal fee', 'Comision Courtal')} · {t('issued', 'emisă')} 1 {monthShort(lang, (m.getMonth() + 1) % 12)}
                  </div>
                </div>
                <b>{fmtMoney(invoiceFor(m))}</b>
                <Download size={18} />
              </button>
            ))}
          </div>
          <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={() => nav('/console/settings/billing')}>
            {t('Billing details', 'Date de facturare')} <ChevronRight size={16} />
          </button>
        </>
      )}

      <Sheet
        open={!!payout}
        onClose={() => setPayout(null)}
        variant="side"
        title={payout ? `${t('Payout', 'Plată')} · ${fmtDate(lang, payout.date)}` : ''}
        footer={
          <>
            <button className="btn outline grow" onClick={() => (setPayout(null), nav('/console/settings/help?topic=payout&ref=' + payout?.date))}>
              {t("Something's wrong?", 'Ceva nu e în regulă?')}
            </button>
            <button className="btn primary grow" onClick={() => toast(t('Statement downloaded', 'Extras descărcat'))}>
              <Download size={16} /> {t('Statement', 'Extras')}
            </button>
          </>
        }
      >
        {payout && (
          <>
            <div className="muted">
              {fmtDM(lang, payout.from)} – {fmtDM(lang, payout.to)} · {payout.paid ? t('Paid to', 'Plătit în') : t('Will be paid to', 'Va fi plătit în')} {ibanMask(s.console.iban)}
            </div>
            <div className="soft-card col" style={{ gap: 8, padding: 16 }}>
              <div className="row between">
                <span>{t('App-paid bookings', 'Rezervări plătite în app')}</span>
                <b>{fmtMoney(payout.gross)}</b>
              </div>
              <div className="row between">
                <span>{t('Courtal fee (10%)', 'Comision Courtal (10%)')}</span>
                <span>−{fmtMoney(payout.fee)}</span>
              </div>
              {payout.refunds > 0 && (
                <div className="row between">
                  <span>{t('Refunds', 'Rambursări')}</span>
                  <span>−{fmtMoney(payout.refunds)}</span>
                </div>
              )}
              <hr className="divider" />
              <div className="row between" style={{ fontSize: 18 }}>
                <b>{t('To your account', 'În contul tău')}</b>
                <b>{fmtMoney(payout.net)}</b>
              </div>
            </div>
            {!payout.paid && <div className="muted small">{t('Bookings later this week are added until Sunday night.', 'Rezervările din restul săptămânii se adaugă până duminică noaptea.')}</div>}
            <h3>
              {payout.items.length} {t('bookings', 'rezervări')}
            </h3>
            <div className="list">
              {payout.items
                .slice()
                .sort((a, b) => (a.date + hm(a.start)).localeCompare(b.date + hm(b.start)))
                .map((b) => (
                  <button key={b.id} className="list-row" style={{ padding: '12px 0' }} onClick={() => setSel(b.id)}>
                    <div className="grow">
                      <b>{b.name}</b>
                      <div className="muted small">
                        {fmtDate(lang, b.date)} {hm(b.start)} · {courtName(t, court(v, b.courtId).name)}
                      </div>
                    </div>
                    <span>{fmtMoney(b.price)}</span>
                  </button>
                ))}
            </div>
          </>
        )}
      </Sheet>

      <Sheet
        open={exp}
        onClose={() => setExp(false)}
        title={t('Export for accountant', 'Export pentru contabil')}
        footer={
          <button
            className="btn primary block lg"
            onClick={() => {
              const m = months[expMonth]
              setExp(false)
              toast(`courtal-${monthShort('en', m.getMonth()).toLowerCase()}-${m.getFullYear()}.${expFmt} ${t('saved', 'salvat')}`)
            }}
          >
            <Download size={18} /> {t('Export', 'Exportă')}
          </button>
        }
      >
        <Field label={t('Month', 'Luna')}>
          <Chips options={months.map((m, i) => ({ v: i, label: `${monthLong(lang, m.getMonth())} ${m.getFullYear()}` }))} value={expMonth} onChange={setExpMonth} size="sm" />
        </Field>
        <Field label={t('Format', 'Format')}>
          <Chips
            options={[
              { v: 'pdf' as const, label: 'PDF' },
              { v: 'csv' as const, label: 'CSV (Excel)' },
            ]}
            value={expFmt}
            onChange={setExpFmt}
            size="sm"
          />
        </Field>
        <div className="muted small">{t('Includes every booking, payment, refund, payout and the Courtal fee invoice for the month.', 'Include toate rezervările, plățile, rambursările, plățile către tine și factura de comision pentru lună.')}</div>
      </Sheet>

      <Sheet
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        title={t('Custom period', 'Perioadă personalizată')}
        footer={
          <button className="btn primary block lg" onClick={() => (setPeriod('custom'), setCustomOpen(false))}>
            {t('Show', 'Arată')}
          </button>
        }
      >
        <div className="form-grid cols2">
          <Field label={t('From', 'De la')}>
            <input className="input" type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
          </Field>
          <Field label={t('To', 'Până la')}>
            <input className="input" type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          </Field>
        </div>
      </Sheet>
      <BookingSheet id={sel} onClose={() => setSel(null)} />
    </div>
  )
}

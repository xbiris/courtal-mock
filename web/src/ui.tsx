import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { X, Check } from 'lucide-react'
import type { Sport, Surface } from './lib/types'
import type { T } from './lib/i18n'

export const photoUrl = (name: string) => `${import.meta.env.BASE_URL}photos/${name}.jpg`

export function cx(...a: (string | false | null | undefined)[]) {
  return a.filter(Boolean).join(' ')
}

/* ---------- toast ---------- */
type ToastItem = { id: number; msg: string; undo?: () => void }
let toastListeners: ((t: ToastItem[]) => void)[] = []
let toasts: ToastItem[] = []
let tid = 1
export function toast(msg: string, undo?: () => void) {
  const item = { id: tid++, msg, undo }
  toasts = [...toasts, item].slice(-3)
  toastListeners.forEach((l) => l(toasts))
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== item.id)
    toastListeners.forEach((l) => l(toasts))
  }, undo ? 5000 : 3200)
}
export function Toasts({ undoLabel }: { undoLabel: string }) {
  const [list, setList] = useState<ToastItem[]>(toasts)
  useEffect(() => {
    toastListeners.push(setList)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setList)
    }
  }, [])
  return createPortal(
    <div className="toast-wrap">
      {list.map((t) => (
        <div key={t.id} className="toast">
          <Check size={18} color="#12d31b" />
          <span>{t.msg}</span>
          {t.undo && (
            <button
              onClick={() => {
                t.undo!()
                toasts = toasts.filter((x) => x.id !== t.id)
                toastListeners.forEach((l) => l(toasts))
              }}
            >
              {undoLabel}
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body,
  )
}

/* ---------- sheet ---------- */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  variant = 'center',
  head,
  white,
  modeless,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  variant?: 'center' | 'side'
  head?: ReactNode
  white?: boolean
  modeless?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <>
      {!modeless && <div className="scrim" onClick={onClose} />}
      <div className={cx('sheet', variant, white && 'white')} role="dialog">
        <div className="sheet-grab" />
        {(title || head) && (
          <div className="sheet-head">
            {head ?? <h2>{title}</h2>}
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={22} />
            </button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </>,
    document.body,
  )
}

export function Confirm({
  open,
  onClose,
  title,
  body,
  confirm,
  onConfirm,
  danger,
  cancel,
}: {
  open: boolean
  onClose: () => void
  title: string
  body: ReactNode
  confirm: string
  onConfirm: () => void
  danger?: boolean
  cancel: string
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn outline grow" onClick={onClose}>
            {cancel}
          </button>
          <button
            className={cx('btn grow', danger ? 'danger' : 'primary')}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirm}
          </button>
        </>
      }
    >
      <div className="muted" style={{ fontSize: 16, lineHeight: 1.5 }}>
        {body}
      </div>
    </Sheet>
  )
}

/* ---------- popover ---------- */
export function usePop() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    setTimeout(() => document.addEventListener('click', h), 0)
    return () => document.removeEventListener('click', h)
  }, [open])
  return { open, setOpen, ref }
}

/* ---------- controls ---------- */
export function Chips<V extends string | number>({
  options,
  value,
  onChange,
  size,
  raised,
}: {
  options: { v: V; label: ReactNode }[]
  value: V | V[]
  onChange: (v: V) => void
  size?: 'sm'
  raised?: boolean
}) {
  const on = (v: V) => (Array.isArray(value) ? value.includes(v) : value === v)
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={String(o.v)} className={cx('chip', size, raised && 'raised', on(o.v) && 'on')} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <button className={cx('toggle', on && 'on')} onClick={() => onChange(!on)} aria-pressed={on} aria-label={label} />
}

export function CheckBox({ on }: { on: boolean }) {
  return <span className={cx('check', on && 'on')}>{on && <Check size={16} strokeWidth={3} />}</span>
}

export function Field({ label, children, help, strong }: { label: ReactNode; children: ReactNode; help?: ReactNode; strong?: boolean }) {
  return (
    <div>
      <span className={cx('label', strong && 'strong')}>{label}</span>
      {children}
      {help && <div className="help">{help}</div>}
    </div>
  )
}

export function Avatar({ name, dark, size, style }: { name: string; dark?: boolean; size?: 'sm' | 'lg'; style?: CSSProperties }) {
  return (
    <span className={cx('avatar', dark && 'dark', size)} style={style}>
      {name.replace(/^Fam\. /, '').trim()[0]?.toUpperCase()}
    </span>
  )
}

export function Logo({ size = 36, word, sub }: { size?: number; word?: boolean; sub?: string }) {
  return (
    <span className="row" style={{ gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <path d="M30 8.5A15 15 0 1 0 30 31.5" fill="none" stroke="#0f2b28" strokeWidth="7" strokeLinecap="round" />
        <circle cx="21" cy="20" r="7.5" fill="#12d31b" stroke="#0f2b28" strokeWidth="3" />
      </svg>
      {word && (
        <span style={{ fontWeight: 600, fontSize: size * 0.55, letterSpacing: -0.2 }}>
          Courtal{sub && <span style={{ fontWeight: 400, color: 'var(--ink-2)' }}> {sub}</span>}
        </span>
      )}
    </span>
  )
}

export function SportIcon({ sport, size = 26 }: { sport: Sport | 'all'; size?: number }) {
  const s = { width: size, height: size }
  const stroke = '#0f2b28'
  if (sport === 'tennis' || sport === 'all')
    return (
      <svg {...s} viewBox="0 0 28 28" aria-hidden>
        <circle cx="14" cy="14" r="12" fill={sport === 'all' ? '#dcf6d8' : '#12d31b'} stroke={stroke} strokeWidth="2" />
        <path d="M6 5.5c4 3 4 14 0 17M22 5.5c-4 3-4 14 0 17" fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    )
  if (sport === 'football')
    return (
      <svg {...s} viewBox="0 0 28 28" aria-hidden>
        <circle cx="14" cy="14" r="12" fill="#dcf6d8" stroke={stroke} strokeWidth="2" />
        <path d="M14 8.5l4.7 3.4-1.8 5.6h-5.8l-1.8-5.6z" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 8.5V3M18.7 11.9l5.2-1.7M16.9 17.5l3.2 4.4M11.1 17.5l-3.2 4.4M9.3 11.9L4.1 10.2" stroke={stroke} strokeWidth="1.8" />
      </svg>
    )
  if (sport === 'basketball')
    return (
      <svg {...s} viewBox="0 0 28 28" aria-hidden>
        <circle cx="14" cy="14" r="12" fill="#dcf6d8" stroke={stroke} strokeWidth="2" />
        <path d="M2 14h24M14 2v24M5.5 5.5c4 4 4 13 0 17M22.5 5.5c-4 4-4 13 0 17" fill="none" stroke={stroke} strokeWidth="1.8" />
      </svg>
    )
  return (
    <svg {...s} viewBox="0 0 28 28" aria-hidden>
      <circle cx="14" cy="14" r="12" fill="#dcf6d8" stroke={stroke} strokeWidth="2" />
      <path d="M14 2c0 6 4 9 11 9M14 14c-5 3-6 8-4 11.5M14 14c5 0 9 3 10.5 7M14 14c0-5-3-9-8.5-10" fill="none" stroke={stroke} strokeWidth="1.8" />
    </svg>
  )
}

/** White court lines on green, like the hero in the designs */
export function CourtLines({ sport, style, className }: { sport: Sport | 'all'; style?: CSSProperties; className?: string }) {
  const p = { fill: 'none', stroke: '#fff', strokeWidth: 3.5 }
  return (
    <svg viewBox="0 0 300 200" style={style} className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {sport === 'football' ? (
        <g {...p}>
          <rect x="8" y="8" width="284" height="184" rx="2" />
          <path d="M150 8v184" />
          <circle cx="150" cy="100" r="32" />
          <rect x="8" y="55" width="40" height="90" />
          <rect x="252" y="55" width="40" height="90" />
        </g>
      ) : sport === 'basketball' ? (
        <g {...p}>
          <rect x="8" y="8" width="284" height="184" />
          <path d="M150 8v184" />
          <circle cx="150" cy="100" r="26" />
          <rect x="8" y="68" width="60" height="64" />
          <rect x="232" y="68" width="60" height="64" />
          <path d="M8 22a90 80 0 0 1 0 156M292 22a90 80 0 0 0 0 156" />
        </g>
      ) : sport === 'volleyball' ? (
        <g {...p}>
          <rect x="8" y="8" width="284" height="184" />
          <path d="M150 8v184" strokeWidth="6" />
          <path d="M105 8v184M195 8v184" />
        </g>
      ) : (
        <g {...p}>
          <rect x="8" y="8" width="284" height="184" />
          <path d="M8 30h284M8 170h284M80 30v140M220 30v140M80 100h140M150 8v184" />
        </g>
      )}
    </svg>
  )
}

export function surfaceName(t: T, s: Surface) {
  return {
    clay: t('clay', 'zgură'),
    hard: t('hard', 'hard'),
    carpet: t('carpet', 'mochetă'),
    turf: t('turf', 'gazon sintetic'),
    parquet: t('parquet', 'parchet'),
    asphalt: t('asphalt', 'asfalt'),
  }[s]
}
export function sportName(t: T, s: Sport | 'all') {
  return {
    all: t('All sports', 'Toate sporturile'),
    tennis: t('Tennis', 'Tenis'),
    football: t('Football', 'Fotbal'),
    basketball: t('Basketball', 'Baschet'),
    volleyball: t('Volleyball', 'Volei'),
  }[s]
}
export function courtName(t: T, name: string) {
  // translate the generic parts of seeded court names
  if (t('a', 'b') === 'a') return name
  return name
    .replace(/^Court (\d+)/, 'Teren $1')
    .replace(/^Pitch (\d+)/, 'Teren $1')
    .replace(/^Pitch$/, 'Teren fotbal')
    .replace('Hall', 'Sală')
    .replace('Volley hall', 'Sală volei')
    .replace('Basketball court', 'Teren baschet')
    .replace('Volleyball court', 'Teren volei')
    .replace(/^Basketball$/, 'Baschet')
}

export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="col center" style={{ alignItems: 'center', padding: '40px 16px', gap: 10 }}>
      {icon && <div style={{ color: 'var(--ink-3)' }}>{icon}</div>}
      <div className="bold" style={{ fontSize: 18 }}>
        {title}
      </div>
      {body && <div className="muted" style={{ maxWidth: 380 }}>{body}</div>}
      {action}
    </div>
  )
}

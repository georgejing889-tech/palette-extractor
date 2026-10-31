import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { useToasts } from '../hooks/useToast'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 ' +
  'disabled:cursor-not-allowed disabled:opacity-45 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[var(--bg)]'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[#6C5CE7] text-white shadow-sm hover:bg-[#5A4BD6] hover:shadow-md active:scale-[0.98]',
  secondary:
    'border border-[var(--border)] bg-[var(--bg-elev)] text-[var(--text)] hover:border-[#6C5CE7]/60 hover:bg-[#6C5CE7]/5 active:scale-[0.98]',
  ghost: 'text-[var(--text-sub)] hover:bg-[var(--text)]/6 hover:text-[var(--text)]',
  danger:
    'border border-red-300 bg-[var(--bg-elev)] text-red-600 hover:bg-red-50 active:scale-[0.98]',
}

const SIZES = {
  sm: 'px-3 py-1.5',
  md: 'px-4 py-2.5',
  lg: 'px-6 py-3.5 text-base',
} as const

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: keyof typeof SIZES
  children: ReactNode
}

export function Button({ variant = 'secondary', size = 'md', className = '', children, ...rest }: Props) {
  return (
    <button className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export interface Option<T extends string | number> {
  value: T
  label: string
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  size = 'md',
}: {
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
  label?: string
  size?: 'sm' | 'md'
}) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`${pad} rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] ${
              active
                ? 'bg-[#6C5CE7] text-white shadow-sm'
                : 'text-[var(--text-sub)] hover:bg-[var(--text)]/6 hover:text-[var(--text)]'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--text-sub)] uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

export function Input({
  className = '',
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--text)] outline-none transition-all focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/25 ${className}`}
      {...rest}
    />
  )
}

export function Toaster() {
  const list = useToasts()
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {list.map((t) => (
        <div
          key={t.id}
          className={`animate-toast pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            t.kind === 'error' ? 'bg-red-600' : t.kind === 'info' ? 'bg-[#171717]' : 'bg-[#16A34A]'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function Badge({
  ok,
  children,
  className = '',
}: {
  ok?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        ok
          ? 'bg-[#16A34A]/12 text-[#16A34A]'
          : 'bg-red-500/12 text-red-600'
      } ${className}`}
    >
      {children}
    </span>
  )
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-[var(--text-sub)]">{sub}</p>}
    </div>
  )
}

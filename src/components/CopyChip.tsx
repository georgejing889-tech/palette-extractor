import { useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/exporters'

interface Props {
  value: string
  label?: string
  onCopied?: () => void
  copiedText: string
  className?: string
  mono?: boolean
}

export function CopyChip({
  value,
  label,
  onCopied,
  copiedText,
  className = '',
  mono = true,
}: Props) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await copyText(value)
    if (ok) {
      setCopied(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1400)
      onCopied?.()
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`${value} · ${copiedText}`}
      aria-label={`${label ? label + ' ' : ''}${value}`}
      className={`group inline-flex w-full items-center justify-between gap-2 rounded-lg border border-transparent px-2 py-1 text-left transition-colors hover:border-[var(--border)] hover:bg-[var(--text)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] ${className}`}
    >
      <span className={`truncate text-xs ${mono ? 'font-mono' : ''} text-[var(--text-sub)]`}>
        {label && <span className="mr-1.5 font-sans font-medium opacity-70">{label}</span>}
        {value}
      </span>
      <span className="shrink-0 text-[10px] font-semibold text-[#6C5CE7] opacity-0 transition-opacity group-hover:opacity-100">
        {copied ? copiedText : '⧉'}
      </span>
    </button>
  )
}

export function CopyRow({
  items,
  copiedText,
  onCopied,
}: {
  items: { label: string; value: string }[]
  copiedText: string
  onCopied?: () => void
}) {
  return (
    <div className="space-y-0.5">
      {items.map((i) => (
        <CopyChip key={i.label + i.value} label={i.label} value={i.value} copiedText={copiedText} onCopied={onCopied} />
      ))}
    </div>
  )
}

import { useState } from 'react'
import type { Swatch } from '../lib/color'
import { rgbToHex, fmtRgb, fmtHsl, readableText, contrastRatio } from '../lib/color'
import { CopyChip } from './CopyChip'

interface Props {
  swatch: Swatch
  index: number
  t: (k: string) => string
  lang: 'zh' | 'en'
  dragging: boolean
  onDragStart: () => void
  onDragEnter: () => void
  onDragEnd: () => void
  onOpen: () => void
  onToggleLock: () => void
  onDelete: () => void
}

export function ColorCard({
  swatch: s,
  index,
  t,
  lang,
  dragging,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onOpen,
  onToggleLock,
  onDelete,
}: Props) {
  const [hover, setHover] = useState(false)
  const hex = rgbToHex(s.rgb)
  const { color: textColor, contrast } = readableText(s.rgb)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`animate-fade-up group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] shadow-sm transition-all duration-300 hover:shadow-md ${
        dragging ? 'scale-95 opacity-50' : 'hover:-translate-y-0.5'
      }`}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      {/* 色块主体 */}
      <button
        onClick={onOpen}
        aria-label={`${t('details')} · ${s.name}`}
        className="relative block h-28 w-full cursor-pointer overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6C5CE7] sm:h-32"
        style={{ background: hex }}
      >
        <span
          className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5"
          style={{ color: rgbToHex(textColor) }}
        >
          <span className="truncate text-[13px] font-bold">{s.name}</span>
          {s.locked && (
            <span className="shrink-0 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm">
              🔒
            </span>
          )}
        </span>
        <span
          className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2.5"
          style={{ color: rgbToHex(textColor) }}
        >
          <span className="font-mono text-[11px] opacity-90">{hex}</span>
          <span className="text-[11px] font-semibold opacity-90">{(s.ratio * 100).toFixed(1)}%</span>
        </span>
        <span
          className={`absolute inset-0 grid place-items-center bg-black/25 text-xs font-semibold text-white transition-opacity duration-200 ${
            hover ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {t('details')}
        </span>
      </button>

      {/* 值区 */}
      <div className="space-y-0.5 p-2">
        <CopyChip value={hex} copiedText={t('copied')} />
        <CopyChip value={fmtRgb(s.rgb)} copiedText={t('copied')} />
        <CopyChip value={fmtHsl(s.rgb)} copiedText={t('copied')} />
      </div>

      {/* 底部元信息 + 操作 */}
      <div className="flex items-center justify-between gap-1 border-t border-[var(--border)] px-2 py-1.5">
        <span
          className="rounded-md bg-[var(--text)]/6 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-sub)]"
          title={`${t('contrastBadge')} ${contrast.toFixed(2)}:1`}
        >
          {contrast.toFixed(1)}:1
        </span>
        <span className="flex items-center gap-0.5">
          <IconBtn
            label={s.locked ? t('unlock') : t('lock')}
            active={s.locked}
            onClick={onToggleLock}
          >
            {s.locked ? '🔒' : '🔓'}
          </IconBtn>
          <IconBtn label={t('delete')} danger onClick={onDelete}>
            ✕
          </IconBtn>
        </span>
      </div>
      <span className="sr-only">
        {lang === 'zh' ? `对比度 ${contrastRatio(s.rgb, textColor).toFixed(2)}` : ''}
      </span>
    </div>
  )
}

function IconBtn({
  label,
  children,
  onClick,
  active,
  danger,
}: {
  label: string
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      aria-label={label}
      title={label}
      className={`grid h-6 w-6 place-items-center rounded-md text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] ${
        active
          ? 'bg-[#6C5CE7]/15 text-[#6C5CE7]'
          : danger
            ? 'text-[var(--text-sub)] hover:bg-red-500/10 hover:text-red-600'
            : 'text-[var(--text-sub)] hover:bg-[var(--text)]/8 hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  )
}

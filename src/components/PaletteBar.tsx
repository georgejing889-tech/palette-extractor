import type { Swatch } from '../lib/color'
import { rgbToHex, fmtRgb, fmtHsl, readableText } from '../lib/color'
import { CopyChip } from './CopyChip'

interface Props {
  swatches: Swatch[]
  seamless: boolean
  onSelect: (s: Swatch) => void
  t: (k: string) => string
}

export function PaletteBar({ swatches, seamless, onSelect, t }: Props) {
  if (!swatches.length) return null
  const gapPx = seamless ? 0 : 6

  return (
    <div
      className={`flex h-24 w-full overflow-hidden rounded-2xl sm:h-28 ${seamless ? '' : 'bg-[var(--bg)] p-1.5'} border border-[var(--border)]`}
      style={{ gap: gapPx }}
      role="list"
      aria-label={t('palette')}
    >
      {swatches.map((s, i) => {
        const { color } = readableText(s.rgb)
        return (
          <button
            key={s.id}
            role="listitem"
            onClick={() => onSelect(s)}
            className="group relative h-full min-w-0 flex-1 overflow-hidden text-left transition-all duration-300 first:rounded-l-xl last:rounded-r-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-inset palette-bar-in"
            style={{
              background: rgbToHex(s.rgb),
              flexGrow: Math.max(0.6, s.ratio),
              animationDelay: `${i * 55}ms`,
              borderRadius: seamless ? 0 : 8,
            }}
            title={s.name}
          >
            <span
              className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ color: rgbToHex(color) }}
            >
              <span className="truncate text-[11px] font-bold">{s.name}</span>
              <span className="truncate font-mono text-[10px] opacity-90">{rgbToHex(s.rgb)}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function PaletteMeta({ swatches, t }: { swatches: Swatch[]; t: (k: string) => string }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {swatches.map((s) => (
        <div key={s.id} className="rounded-xl border border-[var(--border)] p-2">
          <div className="flex items-center gap-2">
            <span
              className="h-5 w-5 shrink-0 rounded-md border border-black/10"
              style={{ background: rgbToHex(s.rgb) }}
            />
            <span className="truncate text-xs font-semibold text-[var(--text)]">{s.name}</span>
          </div>
          <CopyChip value={rgbToHex(s.rgb)} copiedText={t('copied')} className="mt-1 px-0" />
          <CopyChip value={fmtRgb(s.rgb)} copiedText={t('copied')} className="px-0" />
          <CopyChip value={fmtHsl(s.rgb)} copiedText={t('copied')} className="px-0" />
        </div>
      ))}
    </div>
  )
}

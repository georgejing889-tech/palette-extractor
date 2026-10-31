import { useState } from 'react'
import type { Swatch } from '../lib/color'
import { rgbToHex, fmtRgb, fmtHsl, fmtCmyk, rgbToCmyk, generateShades, readableText, wcag, parseColorInput, brightnessValue } from '../lib/color'
import type { RGB } from '../lib/color'
import { Button, Field, Input } from './ui'
import { CopyChip } from './CopyChip'

interface Props {
  swatch: Swatch
  open: boolean
  onClose: () => void
  t: (k: string) => string
  lang: 'zh' | 'en'
  onChangeColor: (rgb: RGB) => void
  onChangeName: (name: string) => void
  onToggleLock: () => void
  onDelete: () => void
  isMobile: boolean
}

export function ColorDetail({
  swatch: s,
  open,
  onClose,
  t,
  onChangeColor,
  onChangeName,
  onToggleLock,
  onDelete,
}: Props) {
  if (!open) return null

  const hex = rgbToHex(s.rgb)
  const cmyk = rgbToCmyk(s.rgb)
  const shades = generateShades(s.rgb)
  const { color: recText, contrast } = readableText(s.rgb)
  const whiteRes = wcag(s.rgb, { r: 255, g: 255, b: 255 })
  const blackRes = wcag(s.rgb, { r: 0, g: 0, b: 0 })
  const prefersWhite = rgbToHex(recText) === '#FFFFFF'

  const WcagRow = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-2.5 py-1.5">
      <span className="text-xs text-[var(--text-sub)]">{label}</span>
      <span className={`text-xs font-bold ${ok ? 'text-[#16A34A]' : 'text-red-500'}`}>
        {ok ? `✓ ${t('pass')}` : `✕ ${t('fail')}`}
      </span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label={t('detailTitle')}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <aside className="animate-fade-up relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-elev)] shadow-2xl">
        {/* 大预览 */}
        <div
          className="relative flex h-40 shrink-0 items-end justify-between p-4"
          style={{ background: hex }}
        >
          <div style={{ color: rgbToHex(recText) }}>
            <p className="text-xl font-bold">{s.name}</p>
            <p className="font-mono text-sm opacity-90">{hex}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('closeDetails')}
            className="rounded-lg bg-black/20 px-2.5 py-1 text-sm text-white backdrop-blur-sm hover:bg-black/35"
            style={{ color: rgbToHex(recText) }}
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-4 pb-24">
          {/* 名称 */}
          <Field label={t('colorName')}>
            <Input value={s.name} onChange={(e) => onChangeName(e.target.value)} />
          </Field>

          {/* 各格式 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <EditableColor label={t('hexLabel')} value={hex} onCommit={onChangeColor} />
            <EditableColor label={t('rgbLabel')} value={fmtRgb(s.rgb)} onCommit={onChangeColor} />
            <EditableColor label={t('hslLabel')} value={fmtHsl(s.rgb)} onCommit={onChangeColor} />
            <Field label={t('cmykLabel')}>
              <Input value={fmtCmyk(s.rgb)} readOnly />
            </Field>
          </div>

          {/* 占比 / 明暗 / 建议 */}
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('share')} value={`${(s.ratio * 100).toFixed(1)}%`} />
            <Stat label={t('brightness')} value={`${brightnessValue(s.rgb)}`} />
            <Stat label={t('contrastBadge')} value={`${contrast.toFixed(2)}:1`} />
            <Stat label="CMYK" value={`${cmyk.c}/${cmyk.m}/${cmyk.y}/${cmyk.k}`} />
          </div>

          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-xs font-semibold text-[var(--text)]">
              {prefersWhite ? t('recommendsWhite') : t('recommendsBlack')}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <WcagRow label={`${t('recommendsWhite')}`} ok={whiteRes.aaNormal} />
              <WcagRow label={`${t('recommendsBlack')}`} ok={blackRes.aaNormal} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <WcagRow label={t('aaNormal')} ok={whiteRes.aaNormal || blackRes.aaNormal} />
              <WcagRow label={t('aaLarge')} ok={whiteRes.aaLarge || blackRes.aaLarge} />
              <WcagRow label={t('aaaNormal')} ok={whiteRes.aaaNormal || blackRes.aaaNormal} />
              <WcagRow label={t('aaaLarge')} ok={whiteRes.aaaLarge || blackRes.aaaLarge} />
            </div>
          </div>

          {/* 色阶 */}
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-[var(--text-sub)] uppercase">
              {t('shades')}
            </p>
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              {shades.map((sh) => (
                <div key={sh.step} className="flex items-center">
                  <button
                    onClick={() => onChangeColor(sh.rgb)}
                    className="h-8 flex-1 transition-opacity hover:opacity-85"
                    style={{ background: sh.hex }}
                    aria-label={`${sh.step} ${sh.hex}`}
                    title={sh.hex}
                  />
                  <span className="w-12 shrink-0 px-2 text-right font-mono text-[10px] text-[var(--text-sub)]">
                    {sh.step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-0.5">
            <CopyChip label={t('hexLabel')} value={hex} copiedText={t('copied')} />
            <CopyChip label={t('rgbLabel')} value={fmtRgb(s.rgb)} copiedText={t('copied')} />
            <CopyChip label={t('hslLabel')} value={fmtHsl(s.rgb)} copiedText={t('copied')} />
          </div>
        </div>

        {/* 底部操作 */}
        <div className="sticky bottom-0 flex gap-2 border-t border-[var(--border)] bg-[var(--bg-elev)] p-3">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onToggleLock}
            aria-label={s.locked ? t('unlock') : t('lock')}
          >
            {s.locked ? `🔒 ${t('unlock')}` : `🔓 ${t('lock')}`}
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={onDelete}>
            {t('delete')}
          </Button>
        </div>
      </aside>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] px-3 py-2">
      <p className="text-[10px] tracking-wide text-[var(--text-sub)] uppercase">{label}</p>
      <p className="font-mono text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  )
}

function EditableColor({
  label,
  value,
  onCommit,
}: {
  label: string
  value: string
  onCommit: (rgb: RGB) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const current = draft ?? value

  const commit = () => {
    const parsed = parseColorInput(current)
    if (parsed) onCommit(parsed)
    setDraft(null)
  }

  return (
    <Field label={label}>
      <Input
        value={current}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setDraft(null)
        }}
      />
    </Field>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { Swatch } from '../lib/color'
import { rgbToHex } from '../lib/color'
import {
  cssVars,
  hexList,
  rgbList,
  hslList,
  tailwindConfig,
  jsonPayload,
  copyText,
  downloadText,
  renderPalettePng,
  downloadBlob,
  SIZES,
  type SizeKey,
} from '../lib/exporters'
import { toast } from '../hooks/useToast'
import { Button, Field } from './ui'
import type { Lang } from '../lib/i18n'

type Format = 'hex' | 'rgb' | 'hsl' | 'css' | 'tailwind' | 'json'

const FORMATS: { value: Format; zh: string; en: string }[] = [
  { value: 'hex', zh: 'HEX 列表', en: 'HEX list' },
  { value: 'rgb', zh: 'RGB 列表', en: 'RGB list' },
  { value: 'hsl', zh: 'HSL 列表', en: 'HSL list' },
  { value: 'css', zh: 'CSS 变量', en: 'CSS variables' },
  { value: 'tailwind', zh: 'Tailwind 配置', en: 'Tailwind config' },
  { value: 'json', zh: 'JSON', en: 'JSON' },
]

interface Props {
  swatches: Swatch[]
  sourceName: string
  thumb: HTMLImageElement | null
  t: (k: string) => string
  lang: Lang
  variant?: 'primary' | 'secondary'
}

export function ExportPanel({
  swatches,
  sourceName,
  thumb,
  t,
  lang,
  variant = 'primary',
}: Props) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<Format>('hex')
  const [size, setSize] = useState<SizeKey>('1200x800')
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!swatches.length) return null

  const textOf = (f: Format): string => {
    switch (f) {
      case 'hex':
        return hexList(swatches)
      case 'rgb':
        return rgbList(swatches)
      case 'hsl':
        return hslList(swatches)
      case 'css':
        return cssVars(swatches)
      case 'tailwind':
        return tailwindConfig(swatches)
      case 'json':
        return jsonPayload(swatches, sourceName)
    }
  }

  const doCopy = async (payload: string) => {
    const ok = await copyText(payload)
    toast(ok ? t('copiedClipboard') : 'Copy failed', ok ? 'success' : 'error')
  }

  const handlePng = async () => {
    setBusy(true)
    try {
      const blob = await renderPalettePng({ list: swatches, sourceName, thumb, size })
      downloadBlob(blob, `palette-${Date.now()}.png`)
      toast(t('pngStarted'), 'success')
      setOpen(false)
    } catch {
      toast('PNG export failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const currentLabel = FORMATS.find((f) => f.value === format)?.[lang] ?? ''

  return (
    <div className="relative" ref={wrapRef}>
      <Button variant={variant} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        ⬇ {t('exportBtn')}
      </Button>

      {open && (
        <div className="animate-fade-up absolute right-0 bottom-full z-50 mb-2 max-h-[70vh] w-[min(92vw,420px)] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 shadow-xl">
          <p className="mb-3 text-sm font-semibold text-[var(--text)]">{t('exportPanel')}</p>

          <div className="grid gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void doCopy(cssVars(swatches))
              }}
            >
              {'{ }'} {t('copyCss')}
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={handlePng}>
              {busy ? t('extracting') : `🖼 ${t('downloadPng')}`}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                downloadText(jsonPayload(swatches, sourceName), `palette-${Date.now()}.json`)
                toast(t('jsonExported'), 'success')
              }}
            >
              {'{ }'} {t('exportJson')}
            </Button>
          </div>

          <div className="my-3 border-t border-[var(--border)]" />

          <Field label={t('pngSize')}>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as SizeKey)}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#6C5CE7]"
            >
              {(Object.keys(SIZES) as SizeKey[]).map((k) => (
                <option key={k} value={k}>
                  {SIZES[k].label}
                </option>
              ))}
            </select>
          </Field>

          <div className="mt-3">
            <p className="mb-1.5 block text-xs font-medium tracking-wide text-[var(--text-sub)] uppercase">
              {t('format')}
            </p>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
              className="mb-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[#6C5CE7]"
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f[lang]}
                </option>
              ))}
            </select>
            <textarea
              readOnly
              value={textOf(format)}
              rows={5}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-[11px] leading-relaxed text-[var(--text-sub)] outline-none"
            />
            <Button
              variant="primary"
              size="sm"
              className="mt-2 w-full"
              onClick={() => {
                void doCopy(textOf(format))
              }}
            >
              {t('copy')} · {currentLabel}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-3">
            {swatches.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  void doCopy(rgbToHex(s.rgb))
                }}
                title={rgbToHex(s.rgb)}
                aria-label={rgbToHex(s.rgb)}
                className="h-7 w-7 rounded-lg border border-black/10 transition-transform hover:scale-110"
                style={{ background: rgbToHex(s.rgb) }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

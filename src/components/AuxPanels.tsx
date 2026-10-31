import { useMemo, useState, type ReactNode } from 'react'
import type { Lang } from '../lib/i18n'
import type { CvdKind } from '../lib/cvd'
import type { RGB, SchemeKind, Swatch } from '../lib/color'
import {
  SCHEME_LABELS,
  buildScheme,
  fmtRgb,
  hslToRgb,
  nameOfColor,
  parseColorInput,
  rgbToHex,
  rgbToHsl,
  wcag,
} from '../lib/color'
import { CVD_LABELS, simulate } from '../lib/cvd'
import { copyText } from '../lib/exporters'
import { toast } from '../hooks/useToast'

/** 主 UI 传入的翻译函数：输入 key，返回当前语言文案 */
export type TFn = (key: string) => string

/* ---------- 共享样式 / 文案工具 ---------- */

const CARD = 'rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-sm'
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7]'
const TAB_BASE =
  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#6C5CE7]/10'

const pick = (lang: Lang, zh: string, en: string): string => (lang === 'zh' ? zh : en)

const SCHEME_ORDER: readonly SchemeKind[] = [
  'complementary',
  'analogous',
  'triadic',
  'splitComplementary',
  'monochromatic',
] as const

const CVD_ORDER: readonly CvdKind[] = [
  'protanopia',
  'deuteranopia',
  'tritanopia',
  'achromatopsia',
] as const

const CVD_DESC: Record<CvdKind, { zh: string; en: string }> = {
  protanopia: {
    zh: '红色视锥缺失，红色会变暗并偏向黄褐，红与绿很难区分。',
    en: 'Missing red cones: reds look darker and browner, red vs. green is hard to tell apart.',
  },
  deuteranopia: {
    zh: '绿色视锥缺失，最常见的一种，红、橙、绿、棕容易混在一起。',
    en: 'Missing green cones, the most common type — red, orange, green and brown blend together.',
  },
  tritanopia: {
    zh: '蓝色视锥缺失，蓝与黄难以区分，蓝色会偏绿、黄色会偏粉。',
    en: 'Missing blue cones: blue vs. yellow is hard to tell; blues shift green, yellows shift pink.',
  },
  achromatopsia: {
    zh: '几乎无法感知色彩，世界呈灰阶，因此务必用明度而非颜色传递信息。',
    en: 'Almost no color perception — the world looks grayscale, so rely on lightness, not hue.',
  },
}

/* ---------- 1. 灵感配色 ---------- */

export function InspirationPanel(props: { t: TFn; lang: Lang; swatches: Swatch[] }) {
  const { t, lang, swatches } = props
  const [baseIndex, setBaseIndex] = useState(0)
  const [kind, setKind] = useState<SchemeKind>('complementary')
  const [hueShift, setHueShift] = useState(0)

  const index = swatches.length > 0 ? Math.min(baseIndex, swatches.length - 1) : -1
  const baseRgb: RGB | undefined = index >= 0 ? swatches[index].rgb : undefined

  const shiftedBase = useMemo<RGB | null>(() => {
    if (!baseRgb) return null
    if (hueShift === 0) return baseRgb
    const { h, s, l } = rgbToHsl(baseRgb)
    return hslToRgb({ h: h + hueShift, s, l })
  }, [baseRgb, hueShift])

  // 名称计算放在 memo 里，避免每次渲染重复调用 nameOfColor 造成重名后缀
  const colors = useMemo(() => {
    if (!shiftedBase) return []
    return buildScheme(shiftedBase, kind).map((rgb) => ({
      rgb,
      hex: rgbToHex(rgb),
      name: nameOfColor(rgb, lang),
    }))
  }, [shiftedBase, kind, lang])

  const handleCopy = (text: string) => {
    void copyText(text).then((ok) => {
      toast(ok ? t('copied') : pick(lang, '复制失败', 'Copy failed'), ok ? 'success' : 'error')
    })
  }

  const shuffle = () => {
    const dir = Math.random() < 0.5 ? -1 : 1
    const delta = dir * (15 + Math.random() * 30)
    const next = Math.round(hueShift + delta)
    setHueShift(((next % 360) + 360) % 360)
  }

  const empty = swatches.length === 0

  return (
    <section
      className={CARD}
      aria-label={pick(lang, '灵感配色面板', 'Palette inspiration panel')}
    >
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{t('inspiration')}</h2>
        <p className="text-sm text-[var(--text-sub)]">
          {pick(lang, '基于色板生成和谐的配色方案', 'Harmonious schemes built from your palette')}
        </p>
      </header>

      {empty ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--text-sub)]">
          {pick(lang, '上传图片后即可生成灵感配色', 'Generate inspiration from your palette')}
        </p>
      ) : (
        <>
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-[var(--text-sub)]">{t('baseColor')}</p>
            <div className="flex flex-wrap gap-2">
              {swatches.map((s, i) => {
                const selected = i === index
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setBaseIndex(i)
                      setHueShift(0)
                    }}
                    title={`${s.name} ${rgbToHex(s.rgb)}`}
                    aria-label={`${t('baseColor')}: ${s.name} ${rgbToHex(s.rgb)}`}
                    aria-pressed={selected}
                    className={`h-8 w-8 rounded-lg border border-[var(--border)] transition-transform hover:scale-110 ${FOCUS} ${
                      selected ? 'ring-2 ring-[#6C5CE7] ring-offset-2 ring-offset-[var(--bg-elev)]' : ''
                    }`}
                    style={{ backgroundColor: rgbToHex(s.rgb) }}
                  />
                )
              })}
            </div>
          </div>

          <div
            role="tablist"
            aria-label={pick(lang, '配色方案类型', 'Scheme type')}
            className="mb-4 flex flex-wrap gap-2"
          >
            {SCHEME_ORDER.map((k) => {
              const selected = k === kind
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setKind(k)}
                  className={`${TAB_BASE} ${FOCUS} ${
                    selected ? 'bg-[#6C5CE7] text-white hover:bg-[#6C5CE7]' : 'text-[var(--text-sub)]'
                  }`}
                >
                  {schemeLabel(k, lang)}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {colors.map((c, i) => (
              <div
                key={`${c.hex}-${i}`}
                className="overflow-hidden rounded-xl border border-[var(--border)]"
              >
                <div className="h-16 w-full" style={{ backgroundColor: c.hex }} />
                <div className="space-y-1 p-2">
                  <p className="truncate text-xs font-medium" title={c.name}>
                    {c.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(c.hex)}
                    aria-label={`${t('copy')} ${c.hex}`}
                    className={`block w-full truncate rounded-md px-1 py-0.5 text-left font-mono text-xs text-[var(--text-sub)] transition-colors hover:bg-[#6C5CE7]/10 hover:text-[#6C5CE7] ${FOCUS}`}
                  >
                    {c.hex}
                  </button>
                  <p className="truncate font-mono text-[10px] text-[var(--text-sub)]">
                    {fmtRgb(c.rgb)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={shuffle}
            aria-label={t('regenerate')}
            className={`mt-4 w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[#6C5CE7] hover:text-[#6C5CE7] ${FOCUS}`}
          >
            {t('regenerate')}
          </button>
        </>
      )}
    </section>
  )
}

/** SCHEME_LABELS 中缺少某项时的兜底展示 */
function schemeLabel(k: SchemeKind, lang: Lang): string {
  const label = SCHEME_LABELS[k]
  if (!label) return k
  return lang === 'zh' ? label.zh : label.en
}

/* ---------- 2. 色盲模拟 ---------- */

export function CvdPanel(props: { t: TFn; lang: Lang; swatches: Swatch[] }) {
  const { t, lang, swatches } = props
  const [kind, setKind] = useState<CvdKind>('protanopia')

  const rows = useMemo(() => {
    return swatches.map((s) => {
      const sim = simulate(s.rgb, kind)
      return { id: s.id, name: s.name, original: s.rgb, simulated: sim }
    })
  }, [swatches, kind])

  return (
    <section className={CARD} aria-label={pick(lang, '色盲模拟面板', 'Color blindness panel')}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{t('cvdTitle')}</h2>
        <p className="text-sm text-[var(--text-sub)]">
          {pick(lang, '预览你的色板在不同色觉下的样子', 'Preview your palette under different color vision')}
        </p>
      </header>

      {swatches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--text-sub)]">
          {pick(lang, '上传图片后即可预览色盲模拟', 'Preview simulations from your palette')}
        </p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label={t('cvdTitle')}
            className="mb-4 flex flex-wrap gap-2"
          >
            {CVD_ORDER.map((k) => {
              const selected = k === kind
              return (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setKind(k)}
                  className={`${TAB_BASE} ${FOCUS} ${
                    selected ? 'bg-[#6C5CE7] text-white hover:bg-[#6C5CE7]' : 'text-[var(--text-sub)]'
                  }`}
                >
                  {CVD_LABELS[k][lang]}
                </button>
              )
            })}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3 text-xs font-medium text-[var(--text-sub)]">
            <p>{pick(lang, '原色', 'Original')}</p>
            <p>{pick(lang, '模拟色', 'Simulated')}</p>
          </div>

          <div className="space-y-3">
            {rows.map((row) => {
              const oHex = rgbToHex(row.original)
              const sHex = rgbToHex(row.simulated)
              return (
                <div key={row.id} className="space-y-1">
                  <p className="truncate text-xs text-[var(--text-sub)]" title={row.name}>
                    {row.name}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                      <div className="h-14 w-full" style={{ backgroundColor: oHex }} />
                      <p className="px-2 py-1 text-center font-mono text-[10px] text-[var(--text-sub)]">
                        {oHex}
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                      <div className="h-14 w-full" style={{ backgroundColor: sHex }} />
                      <p className="px-2 py-1 text-center font-mono text-[10px] text-[var(--text-sub)]">
                        {sHex}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="mt-4 rounded-xl bg-[#6C5CE7]/5 px-3 py-2 text-xs leading-relaxed text-[var(--text-sub)]">
            {CVD_DESC[kind][lang]}
          </p>
        </>
      )}
    </section>
  )
}

/* ---------- 3. 对比度检测 ---------- */

export function ContrastPanel(props: { t: TFn; lang: Lang }) {
  const { t, lang } = props
  const [fg, setFg] = useState<RGB>({ r: 23, g: 23, b: 23 })
  const [bg, setBg] = useState<RGB>({ r: 255, g: 255, b: 255 })
  const [fgText, setFgText] = useState<string>(rgbToHex(fg))
  const [bgText, setBgText] = useState<string>(rgbToHex(bg))

  const result = wcag(fg, bg)
  const fgHex = rgbToHex(fg)
  const bgHex = rgbToHex(bg)

  const commit = (which: 'fg' | 'bg', raw: string) => {
    const parsed = parseColorInput(raw)
    if (!parsed) {
      toast(pick(lang, '格式不正确', 'Invalid color'), 'error')
      if (which === 'fg') setFgText(fgHex)
      else setBgText(bgHex)
      return
    }
    if (which === 'fg') {
      setFg(parsed)
      setFgText(rgbToHex(parsed))
    } else {
      setBg(parsed)
      setBgText(rgbToHex(parsed))
    }
  }

  const onColorInput = (which: 'fg' | 'bg', value: string) => {
    const parsed = parseColorInput(value)
    if (!parsed) return
    if (which === 'fg') {
      setFg(parsed)
      setFgText(rgbToHex(parsed))
    } else {
      setBg(parsed)
      setBgText(rgbToHex(parsed))
    }
  }

  const swap = () => {
    setFg(bg)
    setBg(fg)
    setFgText(bgHex)
    setBgText(fgHex)
  }

  const badges: { label: string; ok: boolean }[] = [
    { label: t('aaNormal'), ok: result.aaNormal },
    { label: t('aaLarge'), ok: result.aaLarge },
    { label: t('aaaNormal'), ok: result.aaaNormal },
    { label: t('aaaLarge'), ok: result.aaaLarge },
  ]

  return (
    <section className={CARD} aria-label={pick(lang, '对比度检测面板', 'Contrast checker panel')}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{t('contrastTitle')}</h2>
        <p className="text-sm text-[var(--text-sub)]">
          {pick(lang, '输入前景与背景色，实时检查 WCAG 可读性', 'Check WCAG readability between any two colors')}
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-sub)]">{t('fg')}</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fgHex}
              onChange={(e) => onColorInput('fg', e.target.value)}
              aria-label={`${t('fg')} ${fgHex}`}
              className={`h-9 w-12 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent p-0.5 transition-opacity hover:opacity-80 ${FOCUS}`}
            />
            <input
              type="text"
              value={fgText}
              onChange={(e) => setFgText(e.target.value)}
              onBlur={() => commit('fg', fgText)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit('fg', fgText)
              }}
              spellCheck={false}
              aria-label={`${t('fg')} ${pick(lang, '颜色值', 'color value')}`}
              placeholder="#171717"
              className={`min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-sm transition-colors hover:border-[#6C5CE7]/60 ${FOCUS}`}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-sub)]">{t('bg')}</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgHex}
              onChange={(e) => onColorInput('bg', e.target.value)}
              aria-label={`${t('bg')} ${bgHex}`}
              className={`h-9 w-12 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent p-0.5 transition-opacity hover:opacity-80 ${FOCUS}`}
            />
            <input
              type="text"
              value={bgText}
              onChange={(e) => setBgText(e.target.value)}
              onBlur={() => commit('bg', bgText)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit('bg', bgText)
              }}
              spellCheck={false}
              aria-label={`${t('bg')} ${pick(lang, '颜色值', 'color value')}`}
              placeholder="#FFFFFF"
              className={`min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 font-mono text-sm transition-colors hover:border-[#6C5CE7]/60 ${FOCUS}`}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <div>
          <p className="text-xs text-[var(--text-sub)]">{pick(lang, '对比度', 'Contrast ratio')}</p>
          <p className="text-4xl font-bold leading-tight">{result.ratio.toFixed(2)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                b.ok
                  ? 'border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]'
                  : 'border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]'
              }`}
            >
              {b.label} · {b.ok ? t('pass') : t('fail')}
            </span>
          ))}
        </div>
      </div>

      <div
        className="mt-5 rounded-xl border border-[var(--border)] p-5"
        style={{ backgroundColor: bgHex, color: fgHex }}
      >
        <h3 className="mb-2 text-2xl font-bold">{pick(lang, '大标题预览', 'Large heading preview')}</h3>
        <p className="text-sm leading-relaxed">
          {pick(
            lang,
            '这是一段用于检查可读性的正文示例文字，看看在你的配色下阅读是否轻松。',
            'This is a body-text sample for checking readability under your color pair.',
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={swap}
        aria-label={t('swap')}
        className={`mt-4 w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[#6C5CE7] hover:text-[#6C5CE7] ${FOCUS}`}
      >
        {t('swap')}
      </button>
    </section>
  )
}

/* ---------- 4. 容器 ---------- */

export function AuxPanels(props: { t: TFn; lang: Lang; swatches: Swatch[] }) {
  const { t, lang, swatches } = props
  return (
    <section id="aux" className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <InspirationPanel t={t} lang={lang} swatches={swatches} />
        <CvdPanel t={t} lang={lang} swatches={swatches} />
        <div className="lg:col-span-2">
          <ContrastPanel t={t} lang={lang} />
        </div>
      </div>
    </section>
  )
}

/* 供独立功能页使用：单面板 + 顶部说明。 */

export function PageShell(props: {
  title: string
  desc: string
  children: ReactNode
}) {
  const { title, desc, children } = props
  return (
    <section className="mx-auto max-w-3xl px-4 pt-10 pb-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-[var(--text-sub)] sm:text-base">{desc}</p>
      </header>
      {children}
    </section>
  )
}

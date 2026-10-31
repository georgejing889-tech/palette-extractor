import type { Swatch } from './color'
import { fmtRgb, fmtHsl, rgbToHex } from './color'

export type SizeKey = '1200x800' | '1920x1080' | '1080x1080'

export const SIZES: Record<SizeKey, { w: number; h: number; label: string }> = {
  '1200x800': { w: 1200, h: 800, label: '1200 × 800' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080' },
  '1080x1080': { w: 1080, h: 1080, label: '正方形 1080 × 1080' },
}

/* ---------- 文本格式 ---------- */

export function cssVars(list: Swatch[]): string {
  const body = list.map((s, i) => `  --color-${i + 1}: ${rgbToHex(s.rgb)};`).join('\n')
  return `:root {\n${body}\n}`
}

export function tailwindConfig(list: Swatch[]): string {
  const body = list
    .map((s, i) => `        '${i + 1}': '${rgbToHex(s.rgb)}',`)
    .join('\n')
  return [
    '// tailwind.config.js',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
    '      colors: {',
    '        palette: {',
    body,
    '        },',
    '      },',
    '    },',
    '  },',
    '}',
  ].join('\n')
}

export function hexList(list: Swatch[]) {
  return list.map((s) => rgbToHex(s.rgb)).join('\n')
}
export function rgbList(list: Swatch[]) {
  return list.map((s) => fmtRgb(s.rgb)).join('\n')
}
export function hslList(list: Swatch[]) {
  return list.map((s) => fmtHsl(s.rgb)).join('\n')
}

export function jsonPayload(list: Swatch[], source: string): string {
  const payload = {
    source,
    generatedAt: new Date().toISOString(),
    count: list.length,
    colors: list.map((s) => ({
      name: s.name,
      hex: rgbToHex(s.rgb),
      rgb: fmtRgb(s.rgb),
      hsl: fmtHsl(s.rgb),
      percentage: +(s.ratio * 100).toFixed(1),
    })),
  }
  return JSON.stringify(payload, null, 2)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 降级方案：临时 textarea
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadText(text: string, filename: string, type = 'application/json') {
  downloadBlob(new Blob([text], { type }), filename)
}

/* ---------- PNG 色板 ---------- */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function readable(bg: [number, number, number]) {
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  return lum(bg) > 0.42 ? '#171717' : '#FFFFFF'
}

export interface PngOptions {
  list: Swatch[]
  sourceName: string
  thumb?: HTMLImageElement | null
  size: SizeKey
  title?: string
}

export async function renderPalettePng(opts: PngOptions): Promise<Blob> {
  const { list, sourceName, thumb, size } = opts
  const { w, h } = SIZES[size]
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const pad = Math.round(Math.min(w, h) * 0.055)
  const scale = Math.min(w, h) / 800

  ctx.fillStyle = '#F7F7F8'
  ctx.fillRect(0, 0, w, h)

  // 顶部细装饰条
  const grad = ctx.createLinearGradient(0, 0, w, 0)
  list.forEach((s, i) => {
    grad.addColorStop(i / list.length, rgbToHex(s.rgb))
    grad.addColorStop((i + 1) / list.length, rgbToHex(s.rgb))
  })
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, 8 * scale)

  const fontFamily =
    "Inter, 'Noto Sans SC', -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

  // 标题
  ctx.fillStyle = '#171717'
  ctx.font = `700 ${Math.round(30 * scale)}px ${fontFamily}`
  ctx.fillText('Image Color Palette', pad, pad + 30 * scale)
  ctx.fillStyle = '#6B7280'
  ctx.font = `500 ${Math.round(16 * scale)}px ${fontFamily}`
  ctx.fillText('图片配色提取器 · 由图片自动生成', pad, pad + 56 * scale)

  // 日期 + 来源
  ctx.textAlign = 'right'
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `500 ${Math.round(14 * scale)}px ${fontFamily}`
  ctx.fillText(new Date().toLocaleDateString('zh-CN'), w - pad, pad + 30 * scale)
  ctx.fillText(sourceName.slice(0, 42), w - pad, pad + 54 * scale)
  ctx.textAlign = 'left'

  const barH = Math.round(h * 0.14)
  const barY = pad + 78 * scale

  // 横向色带
  let x = pad
  list.forEach((s, i) => {
    const bw = i === list.length - 1 ? w - pad - x : (w - pad * 2) * s.ratio
    ctx.fillStyle = rgbToHex(s.rgb)
    ctx.fillRect(x, barY, Math.max(4, bw), barH)
    x += Math.max(4, bw)
  })

  // 缩略图 + 卡片区
  const thumbW = Math.round(w * 0.22)
  const thumbH = h - (barY + barH) - pad * 2 - 26 * scale
  const thumbX = pad
  const thumbY = barY + barH + pad

  if (thumb) {
    ctx.save()
    roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 16 * scale)
    ctx.clip()
    ctx.fillStyle = '#E5E7EB'
    ctx.fillRect(thumbX, thumbY, thumbW, thumbH)
    const sRatio = Math.max(thumbW / thumb.width, thumbH / thumb.height)
    const dw = thumb.width * sRatio
    const dh = thumb.height * sRatio
    ctx.drawImage(thumb, thumbX + (thumbW - dw) / 2, thumbY + (thumbH - dh) / 2, dw, dh)
    ctx.restore()
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 2 * scale
    roundRect(ctx, thumbX, thumbY, thumbW, thumbH, 16 * scale)
    ctx.stroke()
  }

  // 色卡网格
  const gridX = thumbX + thumbW + pad
  const gridW = w - gridX - pad
  const cols = list.length > 6 ? 3 : 2
  const rows = Math.ceil(list.length / cols)
  const gap = Math.round(14 * scale)
  const cw = (gridW - gap * (cols - 1)) / cols
  const ch = (thumbH - gap * (rows - 1)) / rows

  list.forEach((s, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = gridX + col * (cw + gap)
    const cy = thumbY + row * (ch + gap)
    const hex = rgbToHex(s.rgb)

    ctx.save()
    roundRect(ctx, cx, cy, cw, ch, 14 * scale)
    ctx.clip()
    ctx.fillStyle = hex
    ctx.fillRect(cx, cy, cw, ch)
    ctx.restore()

    const fg = readable([s.rgb.r, s.rgb.g, s.rgb.b])
    const fs = Math.round(15 * scale)
    ctx.fillStyle = fg
    ctx.font = `700 ${fs}px ${fontFamily}`
    ctx.fillText(s.name, cx + 16 * scale, cy + ch - 46 * scale)
    ctx.font = `500 ${Math.round(13 * scale)}px ${fontFamily}`
    ctx.globalAlpha = 0.85
    ctx.fillText(hex, cx + 16 * scale, cy + ch - 28 * scale)
    ctx.fillText(fmtRgb(s.rgb), cx + 16 * scale, cy + ch - 12 * scale)
    ctx.globalAlpha = 1

    ctx.textAlign = 'right'
    ctx.font = `700 ${Math.round(13 * scale)}px ${fontFamily}`
    ctx.fillText(`${(s.ratio * 100).toFixed(1)}%`, cx + cw - 16 * scale, cy + 26 * scale)
    ctx.textAlign = 'left'
  })

  // 页脚
  ctx.fillStyle = '#9CA3AF'
  ctx.font = `500 ${Math.round(13 * scale)}px ${fontFamily}`
  ctx.fillText(
    'Generated locally in browser · image never uploaded',
    pad,
    h - pad * 0.55,
  )

  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b ?? new Blob()), 'image/png')
  })
}

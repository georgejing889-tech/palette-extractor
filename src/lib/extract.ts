import { nanoid } from './id'
import type { Swatch } from './color'
import { rgbToHsl, nameOfColor, resetNamePool } from './color'

export type ExtractMode = 'balanced' | 'vivid' | 'muted' | 'dark'

export const MODE_LABELS: Record<ExtractMode, { en: string; zh: string; desc: string }> = {
  balanced: { en: 'Balanced', zh: '平衡模式', desc: '按实际占比与视觉层次均衡取色' },
  vivid: { en: 'Vivid', zh: '鲜艳模式', desc: '优先高饱和、醒目的颜色' },
  muted: { en: 'Muted', zh: '柔和模式', desc: '优先低饱和、柔和的颜色' },
  dark: { en: 'Dark', zh: '深色模式', desc: '优先暗部与深色调' },
}

export const MIN_COLORS = 5
export const MAX_COLORS = 10
export const COLOR_COUNTS = [5, 6, 7, 8, 9, 10]

interface Cluster {
  r: number
  g: number
  b: number
  n: number
}

/** 采样步长：限制总像素数，保证大图也能秒出 */
const MAX_SAMPLES = 48000

export interface SampleResult {
  clusters: Cluster[]
  total: number
  distinct: number
  samplePoints: { x: number; y: number; rgb: [number, number, number] }[]
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('IMAGE_DECODE_FAILED'))
    }
    img.src = url
  })
}

/** SVG 需要先光栅化才能取色 */
export function svgToPngBlob(file: File, size = 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = size / Math.max(img.width || 1, img.height || 1)
        const w = Math.max(1, Math.round((img.width || size) * (img.width > img.height ? scale : scale)))
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('CANVAS_UNAVAILABLE'))
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(img, 0, 0, w, w > size ? size : w)
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('RASTER_FAILED'))), 'image/png')
      }
      img.onerror = () => reject(new Error('IMAGE_DECODE_FAILED'))
      img.src = String(reader.result)
    }
    reader.onerror = () => reject(new Error('READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

/** 读取 imageData 并按网格采样，做 5-bit 量化聚类 */
export function sampleAndCluster(img: HTMLImageElement): {
  clusters: Cluster[]
  total: number
  distinct: number
  samplePoints: { x: number; y: number; rgb: [number, number, number] }[]
} {
  const W = img.naturalWidth || img.width
  const H = img.naturalHeight || img.height
  const canvas = document.createElement('canvas')
  // 降采样到可控尺寸
  const scale = Math.min(1, Math.sqrt(MAX_SAMPLES / Math.max(1, W * H)))
  const w = Math.max(1, Math.round(W * scale))
  const h = Math.max(1, Math.round(H * scale))
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { clusters: [], total: 0, distinct: 0, samplePoints: [] }
  ctx.drawImage(img, 0, 0, w, h)
  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, w, h).data
  } catch {
    return { clusters: [], total: 0, distinct: 0, samplePoints: [] }
  }

  // 量化到 5 bit/通道 -> key
  const map = new Map<number, Cluster>()
  const seen = new Set<number>()
  let total = 0
  const stepPx = Math.max(1, Math.floor(Math.sqrt((w * h) / MAX_SAMPLES)))

  for (let y = 0; y < h; y += stepPx) {
    for (let x = 0; x < w; x += stepPx) {
      const i = (y * w + x) * 4
      const a = data[i + 3]
      if (a < 125) continue // 跳过透明像素
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
      const c = map.get(key)
      if (c) {
        c.r += r
        c.g += g
        c.b += b
        c.n++
      } else {
        map.set(key, { r, g, b, n: 1 })
      }
      seen.add(key)
      total++
    }
  }

  const clusters = Array.from(map.values()).map((c) => ({
    r: Math.round(c.r / c.n),
    g: Math.round(c.g / c.n),
    b: Math.round(c.b / c.n),
    n: c.n,
  }))

  // 采样点（用于「显示取色采样点」）
  const samplePoints: { x: number; y: number; rgb: [number, number, number] }[] = []
  const gridN = 9
  for (let gy = 1; gy < gridN; gy++) {
    for (let gx = 1; gx < gridN; gx++) {
      const x = Math.round((w * gx) / gridN)
      const y = Math.round((h * gy) / gridN)
      const i = (y * w + x) * 4
      if (data[i + 3] < 125) continue
      samplePoints.push({ x: gx / gridN, y: gy / gridN, rgb: [data[i], data[i + 1], data[i + 2]] })
    }
  }

  return { clusters, total, distinct: seen.size, samplePoints }
}

function scoreOf(c: { r: number; g: number; b: number }, n: number, total: number, mode: ExtractMode) {
  const { s, l } = rgbToHsl(c)
  const share = n / Math.max(1, total)
  switch (mode) {
    case 'vivid':
      return share * 1.1 + (s / 100) * 2.0 + (1 - Math.abs(l - 55) / 55) * 1.1
    case 'muted':
      return share * 1.0 + (1 - s / 100) * 1.9 + (1 - Math.abs(l - 62) / 62) * 0.9
    case 'dark':
      return share * 1.0 + (1 - l / 100) * 2.2
    default:
      return share * 1.6 + (s / 100) * 1.0 + (1 - Math.abs(l - 50) / 50) * 0.8
  }
}

/** 在 Lab-ish 距离上合并过近的候选色 */
function tooClose(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }, thr: number) {
  const rm = (a.r + b.r) / 2
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  const d = Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db)
  return d < thr
}

export interface ExtractOptions {
  file?: File
  blob: Blob
  count: number
  mode: ExtractMode
  locked?: Swatch[]
}

export interface ExtractResult {
  swatches: Swatch[]
  distinct: number
  total: number
  samplePoints: { x: number; y: number; rgb: [number, number, number] }[]
}

export async function extractPalette(opts: ExtractOptions): Promise<ExtractResult> {
  const { blob, count, mode, locked = [] } = opts
  const img = await loadImageFromBlob(blob)
  const { clusters, total, distinct, samplePoints } = sampleAndCluster(img)
  if (!total) return { swatches: [], distinct: 0, total: 0, samplePoints: [] }

  // 距离阈值随目标数量收放
  const baseThr = 190 - count * 12

  const scored = clusters
    .map((c) => ({ c, score: scoreOf(c, c.n, total, mode) }))
    .sort((a, b) => b.score - a.score)

  const picked: { r: number; g: number; b: number; n: number }[] = []
  for (const { c } of scored) {
    if (picked.length >= count) break
    if (picked.some((p) => tooClose(p, c, baseThr))) continue
    picked.push({ r: c.r, g: c.g, b: c.b, n: c.n })
  }

  // 若去重后不足，逐步放宽阈值补齐
  let thr = baseThr
  while (picked.length < count && thr > 12) {
    thr *= 0.72
    for (const { c } of scored) {
      if (picked.length >= count) break
      if (picked.some((p) => p.r === c.r && p.g === c.g && p.b === c.b)) continue
      if (picked.some((p) => tooClose(p, c, thr))) continue
      picked.push({ r: c.r, g: c.g, b: c.b, n: c.n })
    }
  }

  resetNamePool()
  const used = new Set(locked.map((l) => `${l.rgb.r},${l.rgb.g},${l.rgb.b}`))
  locked.forEach((l) => used.add(`${l.rgb.r},${l.rgb.g},${l.rgb.b}`))

  const fresh: Swatch[] = picked
    .filter((p) => !used.has(`${p.r},${p.g},${p.b}`))
    .slice(0, Math.max(0, count - locked.length))
    .map((p) => ({
      id: nanoid(),
      rgb: { r: p.r, g: p.g, b: p.b },
      count: p.n,
      ratio: 0,
      name: nameOfColor({ r: p.r, g: p.g, b: p.b }),
      locked: false,
    }))

  const all = [...locked, ...fresh]
  normalizeRatios(all)

  // 按占比降序；锁定色保持在前但同样重新计算占比
  const sorted = [...all].sort((a, b) => b.ratio - a.ratio)
  return { swatches: sorted, distinct, total, samplePoints }
}

export function normalizeRatios(list: Swatch[]) {
  const sum = list.reduce((acc, s) => acc + Math.max(1, s.count), 0)
  list.forEach((s) => {
    s.ratio = Math.max(1, s.count) / sum
  })
}

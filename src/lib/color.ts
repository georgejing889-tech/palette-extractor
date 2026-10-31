export type RGB = { r: number; g: number; b: number }
export type HSL = { h: number; s: number; l: number }
export type CMYK = { c: number; m: number; y: number; k: number }

export interface Swatch {
  id: string
  rgb: RGB
  count: number // sampled pixel count (原始占比权重，可能被手动编辑覆盖)
  ratio: number // 当前占比 0-1（归一化后）
  name: string
  locked: boolean
  edited?: boolean
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function clamp255(v: number) {
  return clamp(Math.round(v), 0, 255)
}

/* ---------- 转换 ---------- */

export function rgbToHex({ r, g, b }: RGB): string {
  const h = (v: number) => clamp255(v).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}

export function hexToRgb(hex: string): RGB | null {
  let s = hex.trim().replace(/^#/, '')
  if (s.length === 3)
    s = s
      .split('')
      .map((c) => c + c)
      .join('')
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null
  return {
    r: parseInt(s.slice(0, 2), 16),
    g: parseInt(s.slice(2, 4), 16),
    b: parseInt(s.slice(4, 6), 16),
  }
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      default:
        h = (rn - gn) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const hh = ((h % 360) + 360) % 360
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ln - c / 2
  const seg = Math.floor(hh / 60) % 6
  const table: RGB[] = [
    { r: c, g: x, b: 0 },
    { r: x, g: c, b: 0 },
    { r: 0, g: c, b: x },
    { r: 0, g: x, b: c },
    { r: x, g: 0, b: c },
    { r: c, g: 0, b: x },
  ]
  const t = table[seg]
  return {
    r: clamp255((t.r + m) * 255),
    g: clamp255((t.g + m) * 255),
    b: clamp255((t.b + m) * 255),
  }
}

export function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  }
}

export function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cn = clamp(c, 0, 100) / 100
  const mn = clamp(m, 0, 100) / 100
  const yn = clamp(y, 0, 100) / 100
  const kn = clamp(k, 0, 100) / 100
  return {
    r: clamp255(255 * (1 - cn) * (1 - kn)),
    g: clamp255(255 * (1 - mn) * (1 - kn)),
    b: clamp255(255 * (1 - yn) * (1 - kn)),
  }
}

export function parseRgbString(str: string): RGB | null {
  const m = str.match(/(-?\d+)[,\s]+(-?\d+)[,\s]+(-?\d+)/)
  if (!m) return null
  return { r: clamp255(+m[1]), g: clamp255(+m[2]), b: clamp255(+m[3]) }
}

export function parseHslString(str: string): HSL | null {
  const m = str.match(/(-?\d+(?:\.\d+)?)[,\s%]+(-?\d+(?:\.\d+)?)%?[,\s%]+(-?\d+(?:\.\d+)?)%?/)
  if (!m) return null
  return {
    h: ((Math.round(+m[1]) % 360) + 360) % 360,
    s: clamp(Math.round(+m[2]), 0, 100),
    l: clamp(Math.round(+m[3]), 0, 100),
  }
}

export function parseColorInput(str: string): RGB | null {
  const s = str.trim()
  if (!s) return null
  if (s.startsWith('#') || /^[0-9a-fA-F]{6}$/.test(s)) return hexToRgb(s)
  if (/^hsl/i.test(s)) {
    const hsl = parseHslString(s.replace(/^hsla?\(?/i, '').replace(/\)/, ''))
    return hsl ? hslToRgb(hsl) : null
  }
  return parseRgbString(s.replace(/^rgba?\(?/i, '').replace(/\)/, ''))
}

export const fmtRgb = (c: RGB) => `rgb(${c.r}, ${c.g}, ${c.b})`
export const fmtHsl = (c: RGB) => {
  const { h, s, l } = rgbToHsl(c)
  return `hsl(${h}, ${s}%, ${l}%)`
}
export const fmtCmyk = (c: RGB) => {
  const { c: cc, m, y, k } = rgbToCmyk(c)
  return `cmyk(${cc}%, ${m}%, ${y}%, ${k}%)`
}

/* ---------- 感知亮度 / 对比度 ---------- */

export function luminance({ r, g, b }: RGB): number {
  const f = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export const WHITE: RGB = { r: 255, g: 255, b: 255 }
export const BLACK: RGB = { r: 0, g: 0, b: 0 }

export function readableText(bg: RGB): { color: RGB; contrast: number } {
  const cw = contrastRatio(bg, WHITE)
  const cb = contrastRatio(bg, BLACK)
  return cw >= cb ? { color: WHITE, contrast: cw } : { color: BLACK, contrast: cb }
}

export interface WcagResult {
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
}
export function wcag(a: RGB, b: RGB): WcagResult {
  const ratio = contrastRatio(a, b)
  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  }
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: clamp255(a.r + (b.r - a.r) * t),
    g: clamp255(a.g + (b.g - a.g) * t),
    b: clamp255(a.b + (b.b - a.b) * t),
  }
}

/** 明暗度 (0-100)，按感知亮度近似 */
export function brightnessValue(c: RGB): number {
  return Math.round(luminance(c) * 100)
}

/* ---------- 颜色命名 ---------- */

interface NamedColor {
  name: string
  cn: string
  hex: string
}

// 覆盖常见色域的基础名册（英文 + 中文）
const NAMED: NamedColor[] = [
  { name: 'Black', cn: '纯黑', hex: '#000000' },
  { name: 'Charcoal', cn: '炭灰', hex: '#333333' },
  { name: 'Slate Gray', cn: '石板灰', hex: '#5A6470' },
  { name: 'Cool Gray', cn: '冷灰', hex: '#8C92A0' },
  { name: 'Silver', cn: '银灰', hex: '#C4C8CF' },
  { name: 'White Smoke', cn: '烟白', hex: '#F2F3F5' },
  { name: 'White', cn: '纯白', hex: '#FFFFFF' },
  { name: 'Ivory', cn: '象牙白', hex: '#FFFDF2' },
  { name: 'Cream', cn: '奶油白', hex: '#FBF3D5' },
  { name: 'Beige', cn: '米色', hex: '#E8DCC0' },
  { name: 'Warm Sand', cn: '暖沙', hex: '#DCC48E' },
  { name: 'Khaki', cn: '卡其', hex: '#BFA55A' },
  { name: 'Tan', cn: '棕褐', hex: '#C19A6B' },
  { name: 'Camel', cn: '驼色', hex: '#B08A4A' },
  { name: 'Copper', cn: '古铜', hex: '#B26B3D' },
  { name: 'Terracotta', cn: '陶土红', hex: '#C1654B' },
  { name: 'Rust', cn: '铁锈红', hex: '#8A3B23' },
  { name: 'Brick Red', cn: '砖红', hex: '#A63A2F' },
  { name: 'Coral Red', cn: '珊瑚红', hex: '#FF5B4A' },
  { name: 'Salmon', cn: '三文鱼粉', hex: '#FF8C7A' },
  { name: 'Peach', cn: '蜜桃', hex: '#FFC9A3' },
  { name: 'Apricot', cn: '杏色', hex: '#FFB27A' },
  { name: 'Orange', cn: '橙', hex: '#F98B2B' },
  { name: 'Tangerine', cn: '柑橘橙', hex: '#FF9F1C' },
  { name: 'Amber', cn: '琥珀', hex: '#F7A81B' },
  { name: 'Goldenrod', cn: '金黄', hex: '#E2A927' },
  { name: 'Mustard', cn: '芥末黄', hex: '#D3A017' },
  { name: 'Honey', cn: '蜂蜜黄', hex: '#F3C13A' },
  { name: 'Lemon', cn: '柠檬黄', hex: '#F7E33A' },
  { name: 'Yellow', cn: '明黄', hex: '#FFD400' },
  { name: 'Olive', cn: '橄榄绿', hex: '#7C8431' },
  { name: 'Moss Green', cn: '苔藓绿', hex: '#6B7B3A' },
  { name: 'Sage', cn: '鼠尾草绿', hex: '#A3B18A' },
  { name: 'Fern', cn: '蕨绿', hex: '#63A35A' },
  { name: 'Forest Green', cn: '森林绿', hex: '#1E6B45' },
  { name: 'Emerald', cn: '祖母绿', hex: '#0F9B6C' },
  { name: 'Jade', cn: '翡翠绿', hex: '#2FA37C' },
  { name: 'Mint', cn: '薄荷绿', hex: '#8FE3C0' },
  { name: 'Seafoam', cn: '海沫绿', hex: '#9FE2D0' },
  { name: 'Teal', cn: '青绿', hex: '#1F8A8A' },
  { name: 'Turquoise', cn: '绿松石', hex: '#3FC1C9' },
  { name: 'Sky Blue', cn: '天蓝', hex: '#5FB8E8' },
  { name: 'Cerulean', cn: '蔚蓝', hex: '#2A7FBF' },
  { name: 'Azure', cn: '湛蓝', hex: '#1E7BE0' },
  { name: 'Ocean Blue', cn: '海蓝', hex: '#0F5E9C' },
  { name: 'Cobalt', cn: '钴蓝', hex: '#2C4FB3' },
  { name: 'Royal Blue', cn: '宝蓝', hex: '#2B4FD8' },
  { name: 'Sapphire', cn: '蓝宝石', hex: '#1B3A8F' },
  { name: 'Navy', cn: '藏青', hex: '#17275B' },
  { name: 'Midnight Blue', cn: '午夜蓝', hex: '#141E4C' },
  { name: 'Indigo', cn: '靛蓝', hex: '#3F3FA8' },
  { name: 'Violet', cn: '紫罗兰', hex: '#7B4FD8' },
  { name: 'Lavender', cn: '薰衣草紫', hex: '#B69BE0' },
  { name: 'Purple', cn: '紫', hex: '#7A28B8' },
  { name: 'Plum', cn: '梅紫', hex: '#6B2A63' },
  { name: 'Mauve', cn: '藕荷紫', hex: '#9A7290' },
  { name: 'Orchid', cn: '兰花紫', hex: '#C07BD0' },
  { name: 'Magenta', cn: '洋红', hex: '#D03080' },
  { name: 'Fuchsia', cn: '紫红', hex: '#C2208C' },
  { name: 'Rose', cn: '玫瑰红', hex: '#E75480' },
  { name: 'Blush Pink', cn: '腮红粉', hex: '#F7B6C2' },
  { name: 'Baby Pink', cn: '浅粉', hex: '#F9D3DA' },
  { name: 'Hot Pink', cn: '亮粉', hex: '#FF4FA3' },
  { name: 'Crimson', cn: '绯红', hex: '#C21F49' },
  { name: 'Burgundy', cn: '酒红', hex: '#6E122B' },
  { name: 'Chocolate', cn: '巧克力棕', hex: '#4A2A1B' },
  { name: 'Coffee', cn: '咖啡棕', hex: '#6F4E37' },
  { name: 'Mocha', cn: '摩卡棕', hex: '#8A6A4F' },
  { name: 'Taupe', cn: '灰褐', hex: '#8E7C6B' },
  { name: 'Ash Brown', cn: '灰棕', hex: '#6E5B4D' },
  { name: 'Bronze', cn: '青铜', hex: '#CD7F32' },
]

const NAMED_RGB = NAMED.map((n) => ({ ...n, rgb: hexToRgb(n.hex)! }))

// 在 Oklab 风格加权空间里找最近色名，避免 hue 误判
function perceptualDist(a: RGB, b: RGB): number {
  const rm = (a.r + b.r) / 2
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(
    (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db,
  )
}

let usedNames = new Set<string>()

export function resetNamePool() {
  usedNames = new Set<string>()
}

/** 依据 Hue / Sat / Light 生成修饰词，区分同族颜色 */
function modifierOf({ s, l }: HSL, picked: Set<string>): string[] {
  const mods: string[] = []
  if (l >= 88) mods.push('Pale', 'Light', 'Off')
  else if (l >= 70) mods.push('Light', 'Soft')
  else if (l <= 12) mods.push('Deep', 'Dark', 'Rich')
  else if (l <= 28) mods.push('Dark', 'Deep')
  if (s <= 12) mods.push('Muted', 'Dusty', 'Grayish')
  else if (s >= 80 && l >= 40 && l <= 70) mods.push('Vivid', 'Bright', 'Vibrant')
  const named = ['Warm', 'Cool', 'Soft', 'Bold', 'Classic', 'Studio', 'Modern']
  return [...mods, ...named].filter((m) => !picked.has(m))
}

export function nameOfColor(rgb: RGB, lang: 'en' | 'zh' = 'en'): string {
  const hsl = rgbToHsl(rgb)
  let best = NAMED_RGB[0]
  let bestD = Infinity
  for (const n of NAMED_RGB) {
    const d = perceptualDist(rgb, n.rgb)
    if (d < bestD) {
      bestD = d
      best = n
    }
  }
  let base = lang === 'zh' ? best.cn : best.name
  if (bestD > 34) {
    const mods = modifierOf(hsl, usedNames)
    const prefix = mods[0] ?? 'Soft'
    base = lang === 'zh' ? `${prefix}${base}` : `${prefix} ${base}`
  }
  let finalName = base
  let i = 1
  while (usedNames.has(finalName) && i < 12) {
    finalName = lang === 'zh' ? `${base}${i + 1}` : `${base} ${i + 1}`
    i++
  }
  usedNames.add(finalName)
  return finalName
}

/* ---------- 色阶 ---------- */

export const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const

/**
 * 以原色为锚点生成 50–900 色阶：
 * 500 阶梯尽量贴近原色，浅色端向 97% 亮度过渡，深色端向 8% 过渡。
 * 这样无论原色本身多亮/多暗，阶梯始终保持单调，不会出现 600 比 500 更浅的情况。
 */
export function generateShades(rgb: RGB): { step: number; rgb: RGB; hex: string }[] {
  const base = rgbToHsl(rgb)
  // 极端明度必须留余量：L=100 的原色无法同时满足「500 等于原色」且「50 比 500 更浅」。
  // 因此把锚点夹进 [12,88]，常规中间色（绝大多数情况）500 仍精确等于原色。
  const anchorL = clamp(base.l, 12, 88)

  return SHADE_STEPS.map((step) => {
    let target: number
    if (step <= 500) {
      // 50 -> 97，500 -> anchorL
      const t = (500 - step) / 450
      target = anchorL + (97 - anchorL) * t
    } else {
      // 500 -> anchorL，900 -> 8
      const t = (step - 500) / 400
      target = anchorL + (8 - anchorL) * t
    }
    target = clamp(Math.round(target), 3, 99)
    const out = hslToRgb({ h: base.h, s: base.s, l: target })
    return { step, rgb: out, hex: rgbToHex(out) }
  })
}

/* ---------- 配色关系 ---------- */

export type SchemeKind =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'splitComplementary'
  | 'monochromatic'

export const SCHEME_LABELS: Record<SchemeKind, { en: string; zh: string }> = {
  complementary: { en: 'Complementary', zh: '互补色' },
  analogous: { en: 'Analogous', zh: '类似色' },
  triadic: { en: 'Triadic', zh: '三角色' },
  splitComplementary: { en: 'Split Complementary', zh: '分裂互补色' },
  monochromatic: { en: 'Monochromatic', zh: '单色配色' },
}

export function buildScheme(base: RGB, kind: SchemeKind): RGB[] {
  const { h, s, l } = rgbToHsl(base)
  const rot = (deg: number, sl?: number, ll?: number) =>
    hslToRgb({ h: h + deg, s: sl ?? s, l: ll ?? l })
  switch (kind) {
    case 'complementary':
      return [base, rot(180)]
    case 'analogous':
      return [rot(-30), base, rot(30)]
    case 'triadic':
      return [base, rot(120), rot(240)]
    case 'splitComplementary':
      return [base, rot(150), rot(210)]
    case 'monochromatic': {
      const ls = [Math.max(12, l - 30), Math.max(6, l - 15), l, Math.min(94, l + 15), Math.min(96, l + 30)]
      return Array.from(new Set(ls)).map((ll) => hslToRgb({ h, s, l: ll }))
    }
  }
}

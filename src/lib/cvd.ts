import type { RGB } from './color'
import { clamp255 } from './color'

export type CvdKind = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

export const CVD_LABELS: Record<CvdKind, { en: string; zh: string }> = {
  protanopia: { en: 'Protanopia (red-blind)', zh: '红绿色盲' },
  deuteranopia: { en: 'Deuteranopia (green-blind)', zh: '绿色盲' },
  tritanopia: { en: 'Tritanopia (blue-blind)', zh: '蓝黄色盲' },
  achromatopsia: { en: 'Achromatopsia (monochrome)', zh: '全色盲' },
}

// Brettel/Viénot 风格的线性 RGB 模拟矩阵
const MATRICES: Record<CvdKind, number[]> = {
  protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
  deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
  tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  achromatopsia: [0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
}

export function simulate(c: RGB, kind: CvdKind): RGB {
  const m = MATRICES[kind]
  const apply = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
  const unapply = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055)

  const lr = apply(c.r / 255)
  const lg = apply(c.g / 255)
  const lb = apply(c.b / 255)

  const outL = [
    m[0] * lr + m[1] * lg + m[2] * lb,
    m[3] * lr + m[4] * lg + m[5] * lb,
    m[6] * lr + m[7] * lg + m[8] * lb,
  ]

  return {
    r: clamp255(unapply(outL[0]) * 255),
    g: clamp255(unapply(outL[1]) * 255),
    b: clamp255(unapply(outL[2]) * 255),
  }
}

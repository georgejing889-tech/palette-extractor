import type { Swatch } from './color'
import { hexToRgb } from './color'

const KEY = 'palette-extractor:v1'

export interface StoredState {
  swatches: Swatch[]
  imageDataUrl?: string
  fileName?: string
  fileSize?: number
  width?: number
  height?: number
  count: number
  mode: string
  savedAt: number
}

export function saveState(state: StoredState) {
  try {
    const slim: StoredState = {
      ...state,
      imageDataUrl: state.imageDataUrl?.slice(0, 4_000_000),
    }
    localStorage.setItem(KEY, JSON.stringify(slim))
  } catch {
    /* quota exceeded — ignore, we keep working in memory */
  }
}

export function loadState(): StoredState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredState
    if (!parsed?.swatches?.length) return null
    parsed.swatches = parsed.swatches
      .filter((s) => s?.rgb && typeof s.rgb.r === 'number')
      .map((s) => ({ ...s, locked: !!s.locked }))
    if (!parsed.swatches.length) return null
    return parsed
  } catch {
    return null
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

/** 从 hex 快速构造 Swatch（恢复 / 新增色用） */
export function swatchFromHex(hex: string, ratio = 0.1): Swatch | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return {
    id: `k${Math.random().toString(36).slice(2, 9)}`,
    rgb,
    count: Math.round(ratio * 1000),
    ratio,
    name: 'Custom',
    locked: true,
    edited: true,
  }
}

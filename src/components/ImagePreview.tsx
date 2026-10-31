import { useEffect, useRef, useState } from 'react'

interface Props {
  src: string
  points?: { x: number; y: number; rgb: [number, number, number] }[]
  showPoints: boolean
  lang: 'zh' | 'en'
}

export function ImagePreview({ src, points = [], showPoints, lang }: Props) {
  const [zoom, setZoom] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!zoom) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

  return (
    <>
      <div
        ref={wrapRef}
        className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)]"
      >
        <img
          src={src}
          alt=""
          onClick={() => setZoom(true)}
          className="block max-h-[420px] w-full cursor-zoom-in object-contain transition-opacity"
          draggable={false}
        />
        {showPoints &&
          points.map((p, i) => {
            const hex = `#${p.rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`
            return (
              <span
                key={i}
                title={hex}
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y * 100}%`,
                  background: hex,
                }}
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/20"
              />
            )
          })}
        <button
          onClick={() => setZoom(true)}
          className="absolute right-2 bottom-2 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          {lang === 'zh' ? '放大' : 'Zoom'}
        </button>
      </div>

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="image zoom"
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <img src={src} alt="" className="max-h-full max-w-full rounded-xl shadow-2xl" />
          <button
            onClick={() => setZoom(false)}
            aria-label="close"
            className="absolute top-4 right-4 rounded-lg bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}

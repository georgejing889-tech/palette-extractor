import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from './ui'

export const MAX_BYTES = 20 * 1024 * 1024
export const ACCEPT_EXT = ['jpg', 'jpeg', 'png', 'webp', 'svg']

interface Props {
  t: (k: string) => string
  onPick: (file: File) => void
  compact?: boolean
  error?: string | null
}

export function Uploader({ t, onPick, compact = false, error }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = useCallback(
    (file: File | undefined | null) => {
      if (file) onPick(file)
    },
    [onPick],
  )

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
      accept(item?.getAsFile())
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [accept])

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={t('dropTitle')}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          accept(e.dataTransfer.files?.[0])
        }}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] ${
          compact ? 'px-6 py-8' : 'px-6 py-16 sm:py-20'
        } ${
          dragOver
            ? 'scale-[1.01] border-[#6C5CE7] bg-[#6C5CE7]/8'
            : 'border-[var(--border)] bg-[var(--bg-elev)] hover:border-[#6C5CE7]/60 hover:bg-[#6C5CE7]/4'
        }`}
      >
        <div
          className={`grid place-items-center rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#635BFF] text-white shadow-md transition-transform duration-300 group-hover:scale-110 ${
            compact ? 'h-10 w-10' : 'h-14 w-14'
          }`}
        >
          <svg
            width={compact ? 20 : 26}
            height={compact ? 20 : 26}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4m0 0L8 8m4-4 4 4" />
            <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
        </div>

        <p className={`mt-4 font-semibold text-[var(--text)] ${compact ? 'text-sm' : 'text-lg'}`}>
          {t('dropTitle')}
        </p>
        <p className="mt-1 text-sm text-[var(--text-sub)]">{t('dropSub')}</p>
        <p className="mt-3 text-xs text-[var(--text-sub)]">{t('dropHint')}</p>
        {!compact && <p className="mt-1 text-xs text-[var(--text-sub)] opacity-70">{t('pasteOk')}</p>}

        {!compact && (
          <Button
            variant="primary"
            className="mt-6"
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
          >
            {t('ctaUpload')}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml,.jpg,.jpeg,.png,.webp,.svg"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-center text-sm font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}

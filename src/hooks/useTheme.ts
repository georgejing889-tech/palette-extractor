import { useCallback, useEffect, useState } from 'react'

function getInitial(): boolean {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('palette-extractor:theme')
  if (saved) return saved === 'dark'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function useTheme() {
  const [dark, setDark] = useState<boolean>(getInitial)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', dark)
    localStorage.setItem('palette-extractor:theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = useCallback(() => setDark((d) => !d), [])
  return { dark, toggle }
}

import { useEffect, useState } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  text: string
  kind: ToastKind
}

let seq = 0
let pushFn: ((t: Toast) => void) | null = null

export function toast(text: string, kind: ToastKind = 'success') {
  seq += 1
  pushFn?.({ id: seq, text, kind })
}

export function useToasts() {
  const [list, setList] = useState<Toast[]>([])

  useEffect(() => {
    pushFn = (t) => {
      setList((prev) => [...prev.slice(-3), t])
      setTimeout(() => {
        setList((prev) => prev.filter((x) => x.id !== t.id))
      }, 2200)
    }
    return () => {
      pushFn = null
    }
  }, [])

  return list
}

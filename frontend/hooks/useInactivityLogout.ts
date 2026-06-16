import { useEffect, useRef } from 'react'

const EVENTS: (keyof WindowEventMap)[] = [
  'mousemove', 'keydown', 'click', 'scroll', 'touchstart',
]

export function useInactivityLogout(logout: () => void, timeoutMs: number, active: boolean) {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!active) return

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(logout, timeoutMs)
    }

    const onActivity = () => {
      if (throttleRef.current) return
      throttleRef.current = setTimeout(() => { throttleRef.current = null }, 1000)
      resetTimer()
    }

    resetTimer()
    EVENTS.forEach((e) => window.addEventListener(e, onActivity))

    return () => {
      if (timerRef.current)    clearTimeout(timerRef.current)
      if (throttleRef.current) clearTimeout(throttleRef.current)
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
    }
  }, [logout, timeoutMs, active])
}

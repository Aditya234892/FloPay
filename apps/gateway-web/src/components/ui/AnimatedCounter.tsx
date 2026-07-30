import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

export interface AnimatedCounterProps {
  value: number
  /** Turns the tweened number into its display string (currency, percent, …). */
  format?: (value: number) => string
  durationMs?: number
  className?: string
}

function easeOutExpo(t: number): number {
  // Mirrors the design system's EASE_OUT_EXPO with a closed-form curve, so the
  // number ramps fast then settles instead of running linearly.
  return t === 1 ? 1 : 1 - 2 ** (-10 * t)
}

/**
 * Counts up to `value` when the element is first revealed, then tweens to any
 * later change.
 *
 * The displayed number is initialised to the real value and only ever *animates*
 * away from it. That ordering matters: the count-up is a decoration, so if it
 * never runs — reduced-motion, a background tab, print, or an environment where
 * IntersectionObserver doesn't report — the tile still shows the correct figure
 * rather than a stale zero. An earlier version started at 0 and rendered `₹0.00`
 * next to a caption reading "1 captured" whenever the observer stayed silent.
 */
export function AnimatedCounter({
  value,
  format = (v) => v.toLocaleString('en-IN'),
  durationMs = 1100,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()

  const [display, setDisplay] = useState(value)
  /** Value the last completed animation landed on; null until one has run. */
  const settledAt = useRef<number | null>(null)

  useEffect(() => {
    if (reduceMotion || !inView) {
      // No animation is going to run — show the truth.
      setDisplay(value)
      settledAt.current = value
      return
    }

    // First reveal counts up from zero; subsequent updates tween from wherever
    // the previous animation finished.
    const from = settledAt.current ?? 0
    if (from === value) {
      setDisplay(value)
      return
    }

    const delta = value - from
    const start = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min((now - start) / durationMs, 1)
      setDisplay(from + delta * easeOutExpo(progress))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        settledAt.current = value
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [inView, value, durationMs, reduceMotion])

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {format(display)}
    </span>
  )
}

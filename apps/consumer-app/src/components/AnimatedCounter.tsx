import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

export function AnimatedCounter({ value, format }: { value: number; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const controls = animate(display, value, {
      duration: 0.7,
      ease: 'easeOut',
      onUpdate: setDisplay,
    })
    return () => controls.stop()
    // Deliberately animates FROM the currently displayed value, not from 0 —
    // only `value` should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <>{format(display)}</>
}

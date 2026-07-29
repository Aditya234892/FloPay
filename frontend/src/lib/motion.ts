import type { Transition, Variants } from 'framer-motion'

/**
 * Shared motion vocabulary. Centralised so every surface eases identically —
 * inconsistent curves are the fastest way to make an interface feel cheap.
 */

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const

export const springSoft: Transition = { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }
export const springSnappy: Transition = { type: 'spring', stiffness: 460, damping: 34 }

/** Page-level enter/exit used by the route transition wrapper. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: EASE_OUT_EXPO },
  },
  exit: { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.2 } },
}

/** Parent that staggers its children in. Pair with `staggerItem`. */
export function staggerContainer(stagger = 0.06, delayChildren = 0.04): Variants {
  return {
    initial: {},
    animate: { transition: { staggerChildren: stagger, delayChildren } },
  }
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
}

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

/** Modal/dialog surface — scales up slightly so it reads as coming forward. */
export const dialogVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springSoft },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } },
}

/** Collapse/expand for accordion panels; height is animated by the caller. */
export const collapseVariants: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1 },
}

export const toastVariants: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: springSnappy },
  exit: { opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.18 } },
}

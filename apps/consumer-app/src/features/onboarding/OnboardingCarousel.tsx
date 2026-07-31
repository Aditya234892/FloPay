import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, ScanLine, Send } from 'lucide-react'
import { FloMark } from '@/components/FloMark'
import { Button } from '@/components/Button'
import { cn } from '@/lib/utils'

interface Slide {
  icon: typeof Send
  title: string
  description: string
  gradient: string
}

const SLIDES: Slide[] = [
  {
    icon: Send,
    title: 'Send money in seconds',
    description: 'Pay anyone with just their FloPay ID — no card numbers, no account details, no waiting.',
    gradient: 'from-brand-500 to-brand-600',
  },
  {
    icon: ScanLine,
    title: 'Scan. Pay. Done.',
    description: 'Point your camera at any FloPay QR code and the payment is ready before you blink.',
    gradient: 'from-secondary-500 to-brand-500',
  },
  {
    icon: Activity,
    title: 'Track every rupee',
    description: 'A clean timeline of everything that moved, so you always know where your money went.',
    gradient: 'from-accent-500 to-accent-600',
  },
]

export function OnboardingCarousel({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1
  const slide = SLIDES[index]

  const advance = () => {
    if (isLast) {
      onDone()
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (!slide) return null

  return (
    <div className="phone-shell px-6 pt-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          <FloMark className="h-6 w-6" />
          <span className="font-display text-sm font-bold">FloPay</span>
        </span>
        {!isLast && (
          <button type="button" onClick={onDone} className="tap-target text-sm font-medium text-fg-muted">
            Skip
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <span
              className={cn(
                'grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br text-white shadow-xl',
                slide.gradient,
              )}
            >
              <slide.icon className="h-11 w-11" />
            </span>
            <h1 className="mt-8 font-display text-2xl font-bold tracking-tight text-fg">{slide.title}</h1>
            <p className="mt-3 max-w-[19rem] text-sm text-fg-muted">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mb-3 flex items-center justify-center gap-2">
        {SLIDES.map((s, i) => (
          <span
            key={s.title}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === index ? 'w-6 bg-brand-500' : 'w-1.5 bg-line',
            )}
          />
        ))}
      </div>

      <div className="pb-8">
        <Button onClick={advance}>{isLast ? 'Get started' : 'Next'}</Button>
      </div>
    </div>
  )
}

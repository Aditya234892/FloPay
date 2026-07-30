import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { EASE_OUT_EXPO, staggerContainer, staggerItem } from '@/lib/motion'

const HIGHLIGHTS = [
  {
    icon: <Zap className="h-4 w-4" />,
    title: 'Sub-second capture',
    body: 'Deterministic sandbox authorization so your integration tests never flake.',
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: 'Signed everything',
    body: 'HMAC payment signatures and signed webhooks, verifiable end to end.',
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    title: 'One integration',
    body: 'Cards, UPI and netbanking behind a single Orders API.',
  },
]

/**
 * Split-screen auth chrome: marketing rail on the left (desktop only), form on
 * the right. Shared by login, signup and password recovery.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Brand rail */}
      <div className="relative hidden overflow-hidden border-r border-line lg:block">
        <div className="grid-lines absolute inset-0 opacity-[0.35]" aria-hidden />
        <div
          className="absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, var(--glow-brand), transparent 65%)',
          }}
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="inline-flex w-fit">
            <Logo animate className="text-fg" />
          </Link>

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              className="font-display text-[2.75rem] leading-[1.05] font-extrabold tracking-tight"
            >
              Payment infrastructure that keeps money{' '}
              <span className="gradient-text">in motion</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
              className="mt-4 text-base text-fg-muted"
            >
              One API for every way your customers want to pay — with the observability to prove
              each rupee moved.
            </motion.p>

            <motion.ul
              variants={staggerContainer(0.09, 0.35)}
              initial="initial"
              animate="animate"
              className="mt-10 space-y-5"
            >
              {HIGHLIGHTS.map((item) => (
                <motion.li key={item.title} variants={staggerItem} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/20 ring-inset">
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-fg">{item.title}</p>
                    <p className="mt-0.5 text-sm text-fg-muted">{item.body}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <p className="text-xs text-fg-subtle">
            Sandbox environment · No real funds are moved at any point.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
          className="w-full max-w-[26rem]"
        >
          <div className="mb-8 lg:hidden">
            <Link to="/" className="inline-flex">
              <Logo />
            </Link>
          </div>

          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-fg-subtle transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to store
          </Link>

          <h2 className="font-display text-[1.75rem] leading-tight font-bold tracking-tight">
            {title}
          </h2>
          <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-fg-muted">{footer}</div>}
        </motion.div>
      </div>
    </div>
  )
}

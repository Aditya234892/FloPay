import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Store, X } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { pageVariants } from '@/lib/motion'
import { Sidebar, SidebarContent } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

/** Animated route wrapper — keyed on pathname so each page enters and exits. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Lock scroll while the drawer covers the page.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-90 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="glass-strong absolute inset-y-0 left-0 w-[16.5rem] shadow-float"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close navigation"
              className="absolute top-4 right-3 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            <SidebarContent onNavigate={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenNav}
          aria-label="Open navigation"
          className="lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </Button>

        <Link to="/dashboard" className="lg:hidden">
          <Logo markOnly />
        </Link>

        <Badge tone="warning" pulse className="hidden sm:inline-flex">
          Sandbox
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Store className="h-3.5 w-3.5" />}
            onClick={() => window.open('/store', '_blank', 'noopener,noreferrer')}
            className="hidden sm:inline-flex"
          >
            Storefront
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

/** Authenticated application chrome: rail + topbar + animated content area. */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="relative flex min-h-svh">
      <Sidebar />
      <MobileDrawer open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="relative z-1 flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setNavOpen(true)} />
        <main className="mx-auto w-full max-w-[84rem] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}

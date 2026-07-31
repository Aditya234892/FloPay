import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Home, ScanLine, User, Wallet } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

interface TabItemProps {
  to: string
  icon: ComponentType<{ className?: string }>
  label: string
}

function TabItem({ to, icon: Icon, label }: TabItemProps) {
  return (
    <NavLink to={to} className="tap-target relative flex flex-1 flex-col items-center justify-center gap-1">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="bottom-nav-active"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="absolute top-0.5 h-1 w-5 rounded-full bg-brand-500"
            />
          )}
          <Icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-brand-500' : 'text-fg-subtle')} />
          <span
            className={cn(
              'text-[0.625rem] font-medium transition-colors',
              isActive ? 'text-brand-500' : 'text-fg-subtle',
            )}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

function ScanTabItem() {
  return (
    <NavLink to="/scan" className="relative flex flex-1 flex-col items-center justify-center">
      {({ isActive }) => (
        <>
          <motion.span
            whileTap={{ scale: 0.92 }}
            className={cn(
              '-mt-8 grid h-14 w-14 place-items-center rounded-full text-white ring-[5px] ring-bg',
              'bg-gradient-to-br from-brand-500 to-secondary-500 shadow-lg shadow-brand-500/35',
            )}
          >
            <ScanLine className="h-6 w-6" />
          </motion.span>
          <span
            className={cn(
              'mt-1 text-[0.625rem] font-medium transition-colors',
              isActive ? 'text-brand-500' : 'text-fg-subtle',
            )}
          >
            Scan
          </span>
        </>
      )}
    </NavLink>
  )
}

/** Native-app style tab bar. Scan is the prominent, raised center action. */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-[26rem] items-stretch px-1 pt-2 pb-1.5">
        <TabItem to="/home" icon={Home} label="Home" />
        <TabItem to="/payments" icon={Wallet} label="Payments" />
        <ScanTabItem />
        <TabItem to="/activity" icon={Activity} label="Activity" />
        <TabItem to="/profile" icon={User} label="Profile" />
      </div>
    </nav>
  )
}

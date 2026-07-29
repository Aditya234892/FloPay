import { NavLink, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { NAV_SECTIONS, STOREFRONT_ITEM, type NavItem } from './navigation'

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium',
          'transition-colors duration-200',
          isActive ? 'text-fg' : 'text-fg-muted hover:bg-surface-hover/60 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute inset-0 -z-10 rounded-xl bg-brand-500/12 ring-1 ring-brand-500/25 ring-inset"
            />
          )}
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              isActive ? 'text-brand-500' : 'text-fg-subtle group-hover:text-fg-muted',
            )}
          />
          <span className="truncate">{item.label}</span>
          {item.badge && (
            <Badge tone="brand" className="ml-auto">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { merchant, logout, hasRole } = useAuth()

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5">
        <Link to="/dashboard" onClick={onNavigate} className="inline-flex">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => {
          const visible = section.items.filter(
            (item) => !item.roles || hasRole(...item.roles),
          )
          if (visible.length === 0) return null

          return (
            <div key={section.title}>
              <p className="mb-1.5 px-3 text-[0.625rem] font-bold tracking-[0.12em] text-fg-subtle uppercase">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {visible.map((item) => (
                  <NavRow key={item.to} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          )
        })}

        <div className="border-t border-line pt-4">
          <NavRow item={STOREFRONT_ITEM} onNavigate={onNavigate} />
        </div>
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full gradient-brand text-xs font-bold text-white">
            {merchant?.name?.charAt(0).toUpperCase() ?? '?'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-fg">{merchant?.name}</p>
            <p className="truncate text-[0.6875rem] text-fg-subtle">{merchant?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="shrink-0 rounded-lg p-1.5 text-fg-subtle transition-colors hover:bg-rose-500/10 hover:text-rose-500"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Fixed desktop rail. The mobile drawer reuses `SidebarContent`. */
export function Sidebar() {
  return (
    <aside className="hidden w-[15.5rem] shrink-0 border-r border-line bg-bg-elevated/40 backdrop-blur-xl lg:block">
      <div className="sticky top-0 h-svh">
        <SidebarContent />
      </div>
    </aside>
  )
}

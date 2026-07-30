import { ArrowLeftRight, KeyRound, LayoutDashboard, Store, Webhook } from 'lucide-react'
import type { ComponentType } from 'react'
import type { Role } from '@/features/auth/AuthContext'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  /** Exact match only — for index routes that would otherwise stay highlighted. */
  end?: boolean
  /** Restrict visibility; omitted means visible to every signed-in role. */
  roles?: Role[]
  badge?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Single navigation manifest, consumed by both the desktop sidebar and the mobile
 * drawer so the two can never drift apart.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Developers',
    items: [
      { to: '/dashboard/keys', label: 'API keys', icon: KeyRound },
      { to: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
    ],
  },
]

export const STOREFRONT_ITEM: NavItem = { to: '/store', label: 'Demo storefront', icon: Store }

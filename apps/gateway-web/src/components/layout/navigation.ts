import {
  ArrowLeftRight,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Store,
  Users,
  Wallet,
  Webhook,
} from 'lucide-react'
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
      { to: '/dashboard/wallet-payments', label: 'Wallet payments', icon: Wallet },
    ],
  },
  {
    title: 'Developers',
    items: [
      { to: '/dashboard/keys', label: 'API keys', icon: KeyRound },
      { to: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        to: '/dashboard/admin/topup-requests',
        label: 'Top-up requests',
        icon: ShieldCheck,
        roles: ['admin'],
      },
      {
        to: '/dashboard/admin/audit-logs',
        label: 'System logs',
        icon: ScrollText,
        roles: ['admin'],
      },
      {
        to: '/dashboard/admin/users',
        label: 'Users',
        icon: Users,
        roles: ['admin'],
      },
      {
        to: '/dashboard/admin/merchants',
        label: 'Merchants',
        icon: Store,
        roles: ['admin'],
      },
      {
        to: '/dashboard/admin/wallet-health',
        label: 'Wallet health',
        icon: ShieldCheck,
        roles: ['admin'],
      },
      {
        to: '/dashboard/admin/fraud-signals',
        label: 'Fraud signals',
        icon: ShieldAlert,
        roles: ['admin'],
      },
      {
        to: '/dashboard/admin/support-tickets',
        label: 'Support tickets',
        icon: LifeBuoy,
        roles: ['admin'],
      },
    ],
  },
]

export const STOREFRONT_ITEM: NavItem = { to: '/store', label: 'Demo storefront', icon: Store }

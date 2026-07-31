import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, ChevronRight, Gift, HandCoins, Inbox, Link2, QrCode, ScanLine, Send, Users } from 'lucide-react'
import { requestApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { cn } from '@/lib/utils'

interface ActionTile {
  to: string
  label: string
  description: string
  icon: typeof Send
  gradient: string
}

const TILES: ActionTile[] = [
  {
    to: '/send',
    label: 'Send money',
    description: 'Pay any FloPay VPA',
    icon: Send,
    gradient: 'from-brand-500 to-brand-600',
  },
  {
    to: '/scan',
    label: 'Scan & pay',
    description: 'Point your camera at a QR',
    icon: ScanLine,
    gradient: 'from-secondary-500 to-brand-500',
  },
  {
    to: '/receive',
    label: 'Receive',
    description: 'Show your FloPay QR',
    icon: QrCode,
    gradient: 'from-accent-500 to-accent-600',
  },
  {
    to: '/request',
    label: 'Request money',
    description: 'Ask someone to pay you',
    icon: HandCoins,
    gradient: 'from-amber-500 to-rose-500',
  },
  {
    to: '/split',
    label: 'Split a bill',
    description: 'Divide it evenly, request the rest',
    icon: Users,
    gradient: 'from-secondary-500 to-brand-600',
  },
  {
    to: '/rewards',
    label: 'Rewards',
    description: '1% cashback on money you send',
    icon: Gift,
    gradient: 'from-amber-400 to-amber-600',
  },
  {
    to: '/scheduled-transfers',
    label: 'Scheduled',
    description: 'One-time or recurring transfers',
    icon: CalendarClock,
    gradient: 'from-slate-500 to-slate-700',
  },
  {
    to: '/payment-links',
    label: 'Payment links',
    description: 'Get paid without sharing your VPA',
    icon: Link2,
    gradient: 'from-brand-600 to-secondary-600',
  },
]

export function PaymentsScreen() {
  const navigate = useNavigate()
  const pendingRequests = useAsyncResource(requestApi.incomingPendingCount, [])

  return (
    <div className="phone-shell px-5 pt-6" style={{ paddingBottom: '7rem' }}>
      <h1 className="font-display text-xl font-bold tracking-tight">Payments</h1>
      <p className="mt-1 text-sm text-fg-muted">Everything you need to move money.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {TILES.map((tile, i) => (
          <motion.button
            key={tile.to}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(tile.to)}
            className="flex flex-col items-start gap-3 rounded-3xl bg-surface-raised p-4 text-left shadow-sm"
          >
            <span
              className={cn(
                'grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white',
                tile.gradient,
              )}
            >
              <tile.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-fg">{tile.label}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">{tile.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate('/requests')}
        className="tap-target mt-4 flex w-full items-center gap-3 rounded-2xl bg-surface-raised p-4 text-left shadow-sm active:bg-line/40"
      >
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-line/60 text-fg-muted">
          <Inbox className="h-5 w-5" />
          {!!pendingRequests.data && pendingRequests.data > 0 && (
            <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[0.625rem] font-bold text-white">
              {pendingRequests.data}
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">Requests</p>
          <p className="mt-0.5 text-xs text-fg-subtle">Incoming and outgoing money requests</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" />
      </button>
    </div>
  )
}

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownLeft, ArrowLeft, Bell, HandCoins, PlusCircle, XCircle } from 'lucide-react'
import { notificationApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NotificationResponse, NotificationType } from '@flopay/api-types'

const ICONS: Record<NotificationType, typeof Bell> = {
  MONEY_RECEIVED: ArrowDownLeft,
  REQUEST_RECEIVED: HandCoins,
  REQUEST_DECLINED: XCircle,
  TOPUP_APPROVED: PlusCircle,
  TOPUP_REJECTED: XCircle,
}

const TONES: Record<NotificationType, string> = {
  MONEY_RECEIVED: 'bg-accent-500/12 text-accent-600',
  REQUEST_RECEIVED: 'bg-amber-500/12 text-amber-600',
  REQUEST_DECLINED: 'bg-rose-500/12 text-rose-500',
  TOPUP_APPROVED: 'bg-accent-500/12 text-accent-600',
  TOPUP_REJECTED: 'bg-rose-500/12 text-rose-500',
}

function NotificationRow({ n }: { n: NotificationResponse }) {
  const Icon = ICONS[n.type]
  return (
    <div className="flex items-start gap-3 border-b border-line px-1 py-3.5 last:border-0">
      <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', TONES[n.type])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-fg">{n.title}</p>
          {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
        </div>
        <p className="mt-0.5 text-xs text-fg-muted">{n.body}</p>
        <p className="mt-0.5 text-[0.6875rem] text-fg-subtle">{formatRelative(n.createdAt)}</p>
      </div>
    </div>
  )
}

export function NotificationsScreen() {
  const navigate = useNavigate()
  const notifications = useAsyncResource(notificationApi.list, [])

  useEffect(() => {
    void notificationApi.markRead()
  }, [])

  return (
    <div className="phone-shell px-5 pt-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="tap-target -ml-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">Notifications</h1>

      <div className="mt-5">
        {notifications.loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-line/60" />
            ))}
          </div>
        ) : notifications.error ? (
          <p className="text-sm font-medium text-rose-500">{notifications.error}</p>
        ) : notifications.data && notifications.data.length > 0 ? (
          <div className="rounded-2xl bg-surface-raised px-4 shadow-sm">
            {notifications.data.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-16 text-center shadow-sm">
            <Bell className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg">No notifications yet</p>
            <p className="text-xs text-fg-subtle">You'll see activity on your wallet here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

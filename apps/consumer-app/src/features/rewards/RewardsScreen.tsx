import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Award, Check, Copy, Flame, Gift, Lock, Sparkles, Users } from 'lucide-react'
import { badgesApi, referralApi, rewardsApi, streakApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { formatMoney, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

export function RewardsScreen() {
  const navigate = useNavigate()
  const balance = useAsyncResource(rewardsApi.balance, [])
  const history = useAsyncResource(rewardsApi.history, [])
  const streak = useAsyncResource(streakApi.status, [])
  const referral = useAsyncResource(referralApi.summary, [])
  const badges = useAsyncResource(badgesApi.list, [])

  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCheckIn = async () => {
    setCheckInError(null)
    setCheckingIn(true)
    try {
      await streakApi.checkIn()
      await Promise.all([streak.refetch(), balance.refetch(), history.refetch()])
    } catch (err) {
      setCheckInError(extractErrorMessage(err))
    } finally {
      setCheckingIn(false)
    }
  }

  const handleCopyReferralCode = async () => {
    if (!referral.data) return
    try {
      await navigator.clipboard.writeText(referral.data.referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard access denied — the code is still visible on screen */
    }
  }

  return (
    <div className="phone-shell px-6 pt-6" style={{ paddingBottom: '7rem' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="tap-target -ml-2 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-fg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-rose-500 p-6 text-white shadow-xl shadow-amber-500/25"
      >
        <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
          <Gift className="h-5 w-5" />
        </span>
        <p className="mt-4 text-xs font-semibold tracking-wide text-white/80 uppercase">Rewards balance</p>
        {balance.loading ? (
          <div className="mt-1.5 h-9 w-32 animate-pulse rounded-lg bg-white/20" />
        ) : (
          <p className="mt-1 font-display text-3xl font-extrabold tracking-tight tabular-nums">
            {formatMoney(balance.data?.balanceMinor ?? 0, balance.data?.currency ?? 'INR')}
          </p>
        )}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-white/75">
          <Sparkles className="h-3.5 w-3.5" />
          1% back every time you send money
        </p>
      </motion.div>

      <div className="mt-6 rounded-3xl bg-surface-raised p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/12 text-orange-500">
              <Flame className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-fg">
                {streak.data?.currentStreak ?? 0}-day streak
              </p>
              <p className="text-xs text-fg-subtle">Longest: {streak.data?.longestStreak ?? 0} days</p>
            </div>
          </div>
          {streak.data?.checkedInToday ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-500/12 px-3 py-1.5 text-xs font-semibold text-accent-600">
              <Check className="h-3.5 w-3.5" />
              Checked in
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void handleCheckIn()}
              disabled={checkingIn || streak.loading}
              className="tap-target rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white active:bg-brand-600 disabled:opacity-60"
            >
              {checkingIn ? 'Claiming…' : `Claim ${formatMoney(streak.data?.nextBonusMinor ?? 500)}`}
            </button>
          )}
        </div>
        {checkInError && <p className="mt-2.5 text-xs font-medium text-rose-500">{checkInError}</p>}
      </div>

      <div className="mt-6 rounded-3xl bg-surface-raised p-5 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-500">
            <Users className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-fg">Invite friends</p>
            <p className="text-xs text-fg-subtle">
              {formatMoney(referral.data?.bonusMinorPerReferral ?? 2500)} for each of you, after their first payment
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleCopyReferralCode()}
          disabled={!referral.data}
          className="tap-target mt-3.5 flex w-full items-center gap-2 rounded-xl bg-line/40 px-3 py-2.5 text-left disabled:opacity-50"
        >
          <span className="min-w-0 flex-1 truncate font-mono text-sm font-semibold tracking-wide text-fg">
            {referral.data?.referralCode ?? '——————'}
          </span>
          {copied ? (
            <Check className="h-4 w-4 shrink-0 text-accent-500" />
          ) : (
            <Copy className="h-4 w-4 shrink-0 text-fg-subtle" />
          )}
        </button>
        {referral.data && referral.data.totalReferred > 0 && (
          <p className="mt-2.5 text-xs text-fg-subtle">
            {referral.data.rewardedCount} of {referral.data.totalReferred} friend
            {referral.data.totalReferred === 1 ? '' : 's'} rewarded
          </p>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-2.5 text-sm font-semibold text-fg">Badges</h2>
        {badges.loading ? (
          <div className="grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-line/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {(badges.data ?? []).map((badge) => (
              <div
                key={badge.type}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl bg-surface-raised p-3 text-center shadow-sm',
                  !badge.earned && 'opacity-45',
                )}
              >
                <span
                  className={cn(
                    'grid h-11 w-11 place-items-center rounded-full',
                    badge.earned ? 'bg-amber-500/15 text-amber-600' : 'bg-line/60 text-fg-subtle',
                  )}
                >
                  {badge.earned ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </span>
                <p className="text-[0.6875rem] leading-tight font-semibold text-fg">{badge.title}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-2.5 text-sm font-semibold text-fg">History</h2>
        {history.loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-line/60" />
            ))}
          </div>
        ) : history.error ? (
          <p className="text-sm font-medium text-rose-500">{history.error}</p>
        ) : history.data && history.data.length > 0 ? (
          <div className="rounded-2xl bg-surface-raised px-4 shadow-sm">
            {history.data.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-line px-1 py-3.5 last:border-0"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/12 text-amber-600">
                  <Gift className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{entry.note ?? 'Cashback'}</p>
                  <p className="truncate text-xs text-fg-subtle">{formatRelative(entry.createdAt)}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-accent-600 tabular-nums">
                  +{formatMoney(entry.amountMinor)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-raised px-6 py-12 text-center shadow-sm">
            <Gift className="h-8 w-8 text-fg-subtle" />
            <p className="text-sm font-medium text-fg">No cashback yet</p>
            <p className="text-xs text-fg-subtle">Send money to start earning 1% back.</p>
          </div>
        )}
      </div>
    </div>
  )
}

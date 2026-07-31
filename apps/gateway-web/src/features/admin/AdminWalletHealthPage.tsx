import { AlertTriangle, Banknote, Gift, Landmark, RefreshCw, ShieldCheck, Snowflake, Users } from 'lucide-react'
import { Badge, Button, StatCard } from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatMoney } from '@/lib/format'
import { adminApi } from '@/api/endpoints'
import { useAsyncResource } from '@/hooks/useAsyncResource'

export function AdminWalletHealthPage() {
  const { data, loading, error, refetch } = useAsyncResource(adminApi.walletHealth, [])

  return (
    <>
      <PageHeader
        title="Wallet health"
        description="Ledger-wide balances. Every account kind together must net to exactly zero — that's the double-entry guarantee, not an approximation."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            loading={loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-500/25 ring-inset dark:text-rose-400"
        >
          {error}
        </div>
      )}

      {data && (
        <div className="mb-5">
          <Badge tone={data.reconciles ? 'success' : 'danger'} icon={data.reconciles ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}>
            {data.reconciles ? 'Ledger reconciles' : `Ledger imbalance: net ${formatMoney(data.netMinor)}`}
          </Badge>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="User wallets"
          value={data?.totalWalletMinor ?? 0}
          format={(v) => formatMoney(v)}
          icon={<Banknote />}
          caption="Total spendable balance across every consumer"
        />
        <StatCard
          label="Rewards balance"
          value={data?.totalRewardsMinor ?? 0}
          format={(v) => formatMoney(v)}
          icon={<Gift />}
          caption="Outstanding cashback not yet spent"
        />
        <StatCard
          label="Settlement pending"
          value={data?.totalSettlementPendingMinor ?? 0}
          format={(v) => formatMoney(v)}
          icon={<Landmark />}
          caption="Captured payments still in the settlement hold"
        />
        <StatCard
          label="Settled"
          value={data?.totalSettledMinor ?? 0}
          format={(v) => formatMoney(v)}
          icon={<Landmark />}
          caption="Available to merchants"
        />
        <StatCard
          label="Total users"
          value={data?.userCount ?? 0}
          icon={<Users />}
          caption={`${data?.frozenUserCount ?? 0} frozen`}
        />
        <StatCard
          label="Frozen accounts"
          value={data?.frozenUserCount ?? 0}
          icon={<Snowflake />}
          higherIsBetter={false}
          caption="Blocked from sending money"
        />
      </div>
    </>
  )
}

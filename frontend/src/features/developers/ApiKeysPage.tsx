import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KeyRound, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CopyField,
  DataTable,
  EmptyState,
  Modal,
  useToast,
  type Column,
} from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { merchantApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { formatDateTime, formatRelative } from '@/lib/format'
import type { ApiKeyCreatedResponse, ApiKeySummaryResponse } from '@/api/types'

export function ApiKeysPage() {
  const keys = useAsyncResource(merchantApi.listKeys, [])
  const toast = useToast()

  const [creating, setCreating] = useState(false)
  const [justCreated, setJustCreated] = useState<ApiKeyCreatedResponse | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<ApiKeySummaryResponse | null>(null)
  const [revoking, setRevoking] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      const created = await merchantApi.createKey()
      setJustCreated(created)
      await keys.refetch()
    } catch (error) {
      toast.error('Could not issue key', extractErrorMessage(error))
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await merchantApi.revokeKey(revokeTarget.keyId)
      toast.success('Key revoked', `${revokeTarget.keyId} can no longer authenticate.`)
      setRevokeTarget(null)
      await keys.refetch()
    } catch (error) {
      toast.error('Could not revoke key', extractErrorMessage(error))
    } finally {
      setRevoking(false)
    }
  }

  const columns: Column<ApiKeySummaryResponse>[] = [
    {
      id: 'keyId',
      header: 'Key ID',
      sortValue: (row) => row.keyId,
      cell: (row) => <span className="font-mono text-xs font-medium">{row.keyId}</span>,
    },
    {
      id: 'active',
      header: 'Status',
      sortValue: (row) => String(row.active),
      cell: (row) =>
        row.active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Revoked</Badge>,
    },
    {
      id: 'createdAt',
      header: 'Created',
      hideOnMobile: true,
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => (
        <div>
          <p className="text-xs text-fg">{formatRelative(row.createdAt)}</p>
          <p className="text-[0.6875rem] text-fg-subtle">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) =>
        row.active ? (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => setRevokeTarget(row)}
            className="text-rose-500 hover:bg-rose-500/10"
          >
            Revoke
          </Button>
        ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="API keys"
        description="Authenticate server-to-server calls to /api/v1/* with HTTP Basic auth using a key ID and secret."
        actions={
          <Button
            size="sm"
            onClick={handleCreate}
            loading={creating}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Generate key
          </Button>
        }
      />

      <AnimatePresence>
        {justCreated && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <Card solid className="border-brand-500/30 p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/12 text-brand-500 ring-1 ring-brand-500/25 ring-inset">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold">
                    Copy your secret now — it is shown only once
                  </p>
                  <p className="mt-1 text-xs text-fg-muted">
                    FloPay stores only a BCrypt hash of the secret. If you lose it, revoke the key and
                    issue a new one.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <CopyField label="key_id" value={justCreated.keyId} />
                    <CopyField label="key_secret" value={justCreated.keySecret} secret />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => setJustCreated(null)}
                  >
                    I've saved it
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {keys.error && (
        <div
          role="alert"
          className="mb-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-500/25 ring-inset dark:text-rose-400"
        >
          {keys.error}
        </div>
      )}

      <DataTable
        rows={keys.data ?? []}
        columns={columns}
        rowKey={(row) => row.keyId}
        loading={keys.loading}
        defaultSort={{ id: 'createdAt', direction: 'desc' }}
        empty={
          <EmptyState
            inline
            icon={<KeyRound />}
            title="No API keys yet"
            description="Generate a key pair to start creating orders and payments from your server."
            action={
              <Button size="sm" onClick={handleCreate} loading={creating}>
                Generate your first key
              </Button>
            }
          />
        }
      />

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Using your keys</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-fg-muted">
            Send the pair as HTTP Basic credentials. Never ship the secret to a browser or mobile
            client — it authorises money movement.
          </p>
          <pre className="overflow-x-auto rounded-xl bg-slate-950/80 p-4 font-mono text-[0.75rem] leading-relaxed text-slate-200">
            <code>{`curl https://api.flopay.dev/api/v1/orders \\
  -u "<key_id>:<key_secret>" \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 249900, "currency": "INR", "receipt": "rcpt_001"}'`}</code>
          </pre>
        </CardContent>
      </Card>

      <Modal
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        title="Revoke this API key?"
        description={
          revokeTarget
            ? `${revokeTarget.keyId} will stop authenticating immediately. Any integration using it will start receiving 401s.`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevokeTarget(null)} disabled={revoking}>
              Cancel
            </Button>
            <Button variant="danger" loading={revoking} onClick={handleRevoke}>
              Revoke key
            </Button>
          </>
        }
      />
    </>
  )
}

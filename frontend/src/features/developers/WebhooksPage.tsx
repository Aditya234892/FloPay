import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, RefreshCw, Save, Webhook, XCircle } from 'lucide-react'
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
  Input,
  useToast,
  type Column,
} from '@/components/ui'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAsyncResource } from '@/hooks/useAsyncResource'
import { webhookApi } from '@/api/endpoints'
import { extractErrorMessage } from '@/api/client'
import { formatDateTime, formatRelative, humanizeToken } from '@/lib/format'
import type { WebhookLogResponse } from '@/api/types'

const endpointSchema = z.object({
  url: z
    .string()
    .min(1, 'Enter an endpoint URL')
    .url('Enter a valid absolute URL, including the scheme')
    .refine((value) => value.startsWith('http://') || value.startsWith('https://'), {
      message: 'Only http:// and https:// endpoints are supported',
    }),
})

type EndpointValues = z.infer<typeof endpointSchema>

const EVENTS = [
  { name: 'payment_captured', description: 'Authorization succeeded and funds were captured.' },
  { name: 'payment_failed', description: 'The instrument was declined or the attempt errored.' },
  { name: 'refund_processed', description: 'A full or partial refund completed.' },
] as const

export function WebhooksPage() {
  const config = useAsyncResource(webhookApi.get, [])
  const logs = useAsyncResource(webhookApi.logs, [])
  const toast = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EndpointValues>({
    resolver: zodResolver(endpointSchema),
    defaultValues: { url: '' },
  })

  // Seed the form once the current config arrives.
  useEffect(() => {
    if (config.data?.url) reset({ url: config.data.url })
  }, [config.data?.url, reset])

  const onSubmit = async (values: EndpointValues) => {
    try {
      await webhookApi.configure(values.url)
      toast.success('Endpoint saved', 'Future events will be delivered to this URL.')
      reset(values)
      await config.refetch()
    } catch (error) {
      toast.error('Could not save endpoint', extractErrorMessage(error))
    }
  }

  const columns: Column<WebhookLogResponse>[] = [
    {
      id: 'eventType',
      header: 'Event',
      sortValue: (row) => row.eventType,
      cell: (row) => (
        <span className="font-mono text-xs font-medium">{row.eventType.toLowerCase()}</span>
      ),
    },
    {
      id: 'delivered',
      header: 'Delivery',
      sortValue: (row) => String(row.delivered),
      cell: (row) =>
        row.delivered ? (
          <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>
            Delivered
          </Badge>
        ) : (
          <Badge tone="danger" icon={<XCircle className="h-3 w-3" />}>
            Failed
          </Badge>
        ),
    },
    {
      id: 'attempts',
      header: 'Attempts',
      align: 'center',
      hideOnMobile: true,
      sortValue: (row) => row.attempts,
      cell: (row) => <span className="text-xs tabular-nums">{row.attempts}</span>,
    },
    {
      id: 'status',
      header: 'Response',
      align: 'center',
      hideOnMobile: true,
      sortValue: (row) => row.lastResponseStatus ?? 0,
      cell: (row) => (
        <span className="font-mono text-xs tabular-nums">{row.lastResponseStatus ?? '—'}</span>
      ),
    },
    {
      id: 'createdAt',
      header: 'When',
      align: 'right',
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => (
        <div>
          <p className="text-xs text-fg">{formatRelative(row.createdAt)}</p>
          <p className="text-[0.6875rem] text-fg-subtle">{formatDateTime(row.createdAt)}</p>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="FloPay posts signed JSON events to your endpoint on capture, failure and refund, retrying up to three times."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void logs.refetch()}
            loading={logs.loading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh log
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Endpoint</CardTitle>
              <p className="mt-1 text-xs text-fg-subtle">
                Must be reachable from the FloPay backend. Respond 2xx to acknowledge.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
              <Input
                {...register('url')}
                label="Delivery URL"
                type="url"
                mono
                placeholder="https://your-app.com/webhooks/flopay"
                error={errors.url?.message}
              />
              <Button
                type="submit"
                size="sm"
                loading={isSubmitting}
                disabled={!isDirty}
                leftIcon={<Save className="h-3.5 w-3.5" />}
              >
                Save endpoint
              </Button>
            </form>

            {config.data?.secret && (
              <div className="mt-5 border-t border-line pt-4">
                <CopyField label="Signing secret" value={config.data.secret} secret />
                <p className="mt-2 text-xs text-fg-subtle">
                  Every delivery carries{' '}
                  <code className="font-mono text-fg-muted">X-FloPay-Signature</code>, the
                  hex HMAC-SHA256 of the raw request body keyed with this secret. Verify it before
                  parsing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EVENTS.map((event) => (
              <div key={event.name}>
                <code className="font-mono text-xs font-semibold text-brand-500">{event.name}</code>
                <p className="mt-0.5 text-xs text-fg-muted">{event.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5">
        <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">Delivery log</h2>
        <DataTable
          rows={logs.data ?? []}
          columns={columns}
          rowKey={(row) => String(row.id)}
          loading={logs.loading}
          defaultSort={{ id: 'createdAt', direction: 'desc' }}
          empty={
            <EmptyState
              inline
              icon={<Webhook />}
              title="No deliveries yet"
              description={
                config.data?.url
                  ? 'Complete a payment and the first event will land here.'
                  : 'Save an endpoint above, then run a payment to see deliveries.'
              }
            />
          }
        />
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Verifying a signature</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl bg-slate-950/80 p-4 font-mono text-[0.75rem] leading-relaxed text-slate-200">
            <code>{`import crypto from 'node:crypto'

// Compute over the RAW body, before any JSON parsing.
const expected = crypto
  .createHmac('sha256', FLOPAY_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')

const signature = req.headers['x-flopay-signature']
if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
  return res.sendStatus(400)
}`}</code>
          </pre>
          <p className="mt-3 text-xs text-fg-subtle">
            Use a timing-safe comparison — a plain <code className="font-mono">!==</code> leaks
            information about the expected digest. Events for {humanizeToken('REFUND_PROCESSED')} and
            the two payment events all share this scheme.
          </p>
        </CardContent>
      </Card>
    </>
  )
}

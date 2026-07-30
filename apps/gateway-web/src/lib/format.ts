/**
 * Formatting helpers. Every monetary value crossing the API is an integer in the
 * currency's minor unit (paise for INR), so all conversion to a human string
 * happens here — previously this logic was copy-pasted into three page files.
 */

const CURRENCY_FRACTION_DIGITS: Record<string, number> = {
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
}

function minorUnitDivisor(currency: string): number {
  return 10 ** (CURRENCY_FRACTION_DIGITS[currency] ?? 2)
}

/** `249900, "INR"` → `"₹2,499.00"` */
export function formatMoney(minorUnits: number, currency = 'INR'): string {
  const digits = CURRENCY_FRACTION_DIGITS[currency] ?? 2
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(minorUnits / minorUnitDivisor(currency))
}

/** Compact form for metric tiles: `249900, "INR"` → `"₹2.5K"` */
export function formatMoneyCompact(minorUnits: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(minorUnits / minorUnitDivisor(currency))
}

/** Major-unit number → minor units, for turning form input into an API amount. */
export function toMinorUnits(majorAmount: number, currency = 'INR'): number {
  return Math.round(majorAmount * minorUnitDivisor(currency))
}

export function fromMinorUnits(minorUnits: number, currency = 'INR'): number {
  return minorUnits / minorUnitDivisor(currency)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso))
}

const RELATIVE_THRESHOLDS: { limit: number; unit: Intl.RelativeTimeFormatUnit; per: number }[] = [
  { limit: 60, unit: 'second', per: 1 },
  { limit: 3600, unit: 'minute', per: 60 },
  { limit: 86_400, unit: 'hour', per: 3600 },
  { limit: 604_800, unit: 'day', per: 86_400 },
  { limit: 2_629_800, unit: 'week', per: 604_800 },
  { limit: 31_557_600, unit: 'month', per: 2_629_800 },
]

/** `"just now"`, `"3 minutes ago"`, `"2 days ago"` … */
export function formatRelative(iso: string, now = Date.now()): string {
  const seconds = (now - new Date(iso).getTime()) / 1000
  if (seconds < 10) return 'just now'

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const { limit, unit, per } of RELATIVE_THRESHOLDS) {
    if (seconds < limit) return formatter.format(-Math.floor(seconds / per), unit)
  }
  return formatter.format(-Math.floor(seconds / 31_557_600), 'year')
}

/** Mask a secret for display, keeping enough of the head to be recognisable. */
export function maskSecret(secret: string, visible = 8): string {
  if (secret.length <= visible) return '•'.repeat(secret.length)
  return `${secret.slice(0, visible)}${'•'.repeat(Math.min(secret.length - visible, 24))}`
}

/** Convert an enum-ish token (`PARTIALLY_REFUNDED`) into a label (`Partially refunded`). */
export function humanizeToken(token: string): string {
  const lower = token.toLowerCase().replace(/_/g, ' ')
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

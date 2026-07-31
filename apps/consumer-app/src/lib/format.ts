/** Money is always an integer in the currency's minor unit on the wire. */
export function formatMoney(minorUnits: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100)
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export function formatRelative(iso: string, now = Date.now()): string {
  const seconds = (now - new Date(iso).getTime()) / 1000
  if (seconds < 10) return 'just now'

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const thresholds: [number, Intl.RelativeTimeFormatUnit, number][] = [
    [60, 'second', 1],
    [3600, 'minute', 60],
    [86_400, 'hour', 3600],
    [604_800, 'day', 86_400],
  ]
  for (const [limit, unit, per] of thresholds) {
    if (seconds < limit) return formatter.format(-Math.floor(seconds / per), unit)
  }
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(iso))
}

/**
 * crypto.randomUUID() only exists in secure contexts (https:// or
 * localhost) — a LAN IP over plain http:// doesn't qualify, so this exists
 * to keep idempotency-key generation working there too. Not used for
 * anything security-sensitive, just a client-side dedupe key for retries,
 * so the lower-quality fallback randomness is fine.
 */
export function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

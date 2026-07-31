import type { WalletTransaction } from '@flopay/api-types'

export interface RecentPerson {
  vpa: string
  name: string
}

/** Derived from real transaction history — there's no contacts backend, and this doesn't need one. */
export function recentPeopleFrom(transactions: WalletTransaction[], limit = 8): RecentPerson[] {
  const seen = new Set<string>()
  const people: RecentPerson[] = []
  for (const tx of transactions) {
    if (!tx.counterpartyVpa || seen.has(tx.counterpartyVpa)) continue
    seen.add(tx.counterpartyVpa)
    people.push({ vpa: tx.counterpartyVpa, name: tx.counterpartyName ?? tx.counterpartyVpa })
    if (people.length >= limit) break
  }
  return people
}

/** Same source data, ranked by how often each VPA appears rather than recency. */
export function frequentPeopleFrom(transactions: WalletTransaction[], limit = 8): RecentPerson[] {
  const counts = new Map<string, { name: string; count: number }>()
  for (const tx of transactions) {
    if (!tx.counterpartyVpa) continue
    const existing = counts.get(tx.counterpartyVpa)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(tx.counterpartyVpa, { name: tx.counterpartyName ?? tx.counterpartyVpa, count: 1 })
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([vpa, { name }]) => ({ vpa, name }))
}

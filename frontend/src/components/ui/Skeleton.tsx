import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('shimmer rounded-lg bg-surface-hover/60', className)}
      {...props}
    />
  )
}

/** Metric-tile placeholder matching StatCard's footprint, so layout doesn't jump. */
export function SkeletonStatCard() {
  return (
    <div className="glass sheen rounded-2xl p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-2.5 h-3 w-20" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass sheen overflow-hidden rounded-2xl shadow-soft" aria-busy="true">
      <div className="flex gap-4 border-b border-line px-5 py-3.5">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4 border-b border-line/60 px-5 py-4 last:border-0">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton
              key={colIndex}
              className="h-3.5 flex-1"
              style={{ opacity: 1 - rowIndex * 0.12 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('glass sheen rounded-2xl p-6 shadow-soft', className)} aria-busy="true">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="mt-2 h-3 w-24" />
      <div className="mt-8 flex h-48 items-end gap-2.5">
        {[38, 62, 45, 78, 55, 88, 70, 92, 60, 80, 48, 72].map((height, index) => (
          <Skeleton key={index} className="flex-1 rounded-t-md" style={{ height: `${height}%` }} />
        ))}
      </div>
    </div>
  )
}

import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { staggerContainer, staggerItem } from '@/lib/motion'
import { EmptyState } from './EmptyState'
import { SkeletonTable } from './Skeleton'

export interface Column<T> {
  /** Stable key; also the sort key when `sortable` is set. */
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  /** Value used for sorting; required to make the column sortable. */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  /** Hide below the `sm` breakpoint to keep mobile tables readable. */
  hideOnMobile?: boolean
  width?: string
}

export interface DataTableProps<T> {
  rows: readonly T[]
  columns: readonly Column<T>[]
  rowKey: (row: T) => string
  loading?: boolean
  empty?: ReactNode
  /** Column id to sort by initially. */
  defaultSort?: { id: string; direction: 'asc' | 'desc' }
  onRowClick?: (row: T) => void
  className?: string
}

type SortState = { id: string; direction: 'asc' | 'desc' } | null

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading = false,
  empty,
  defaultSort,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(defaultSort ?? null)

  const sortedRows = useMemo(() => {
    if (!sort) return rows
    const column = columns.find((c) => c.id === sort.id)
    if (!column?.sortValue) return rows

    const factor = sort.direction === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a)
      const right = column.sortValue!(b)
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor
      return String(left).localeCompare(String(right)) * factor
    })
  }, [rows, columns, sort])

  const toggleSort = (id: string) => {
    setSort((current) => {
      if (current?.id !== id) return { id, direction: 'desc' }
      if (current.direction === 'desc') return { id, direction: 'asc' }
      return null
    })
  }

  if (loading) {
    return <SkeletonTable rows={5} columns={Math.min(columns.length, 6)} />
  }

  return (
    <div className={cn('glass sheen overflow-hidden rounded-2xl shadow-soft', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line">
              {columns.map((column) => {
                const isSorted = sort?.id === column.id
                const sortable = Boolean(column.sortValue)
                return (
                  <th
                    key={column.id}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={
                      isSorted
                        ? sort!.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : sortable
                          ? 'none'
                          : undefined
                    }
                    className={cn(
                      'bg-surface-hover/40 px-4 py-3 text-[0.6875rem] font-semibold tracking-wider text-fg-muted uppercase',
                      ALIGN[column.align ?? 'left'],
                      column.hideOnMobile && 'hidden sm:table-cell',
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded transition-colors hover:text-fg',
                          column.align === 'right' && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        {isSorted ? (
                          sort!.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" aria-hidden />
                          ) : (
                            <ArrowDown className="h-3 w-3" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          {sortedRows.length > 0 && (
            <motion.tbody variants={staggerContainer(0.035)} initial="initial" animate="animate">
              {sortedRows.map((row) => (
                <motion.tr
                  key={rowKey(row)}
                  variants={staggerItem}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-line/50 last:border-0',
                    'transition-colors duration-150 hover:bg-surface-hover/50',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        'px-4 py-3.5 align-middle',
                        ALIGN[column.align ?? 'left'],
                        column.hideOnMobile && 'hidden sm:table-cell',
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </motion.tbody>
          )}
        </table>
      </div>

      {sortedRows.length === 0 &&
        (empty ?? <EmptyState inline title="Nothing here yet" description="Data will appear once activity starts." />)}
    </div>
  )
}

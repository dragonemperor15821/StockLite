'use client'

import { useEffect, useMemo, useState } from 'react'
import { Transaction, TransactionType, Warehouse } from '@/lib/types'

const TYPE_LABELS: Record<TransactionType, string> = {
  IN: 'Stock in',
  OUT: 'Stock out',
  TRANSFER_OUT: 'Transfer out',
  TRANSFER_IN: 'Transfer in',
}

const TRANSACTION_TYPES = Object.keys(TYPE_LABELS) as TransactionType[]

type TypeFilter = TransactionType | 'all'

function toTypeFilter(value: string): TypeFilter {
  return TRANSACTION_TYPES.find((type) => type === value) ?? 'all'
}

export default function TransactionTable({
  transactions,
  warehouses,
}: {
  transactions: Transaction[]
  warehouses: Warehouse[]
}) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')

  // Timestamps are formatted in the browser's locale/timezone only after
  // mount, so the server-rendered HTML and the first client render match.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const visibleTransactions = useMemo(() => {
    return transactions
      .map((t, index) => ({ t, index }))
      .filter(({ t }) => typeFilter === 'all' || t.type === typeFilter)
      .filter(
        ({ t }) => warehouseFilter === 'all' || t.warehouseId === warehouseFilter,
      )
      .sort(
        (a, b) =>
          Date.parse(b.t.timestamp) - Date.parse(a.t.timestamp) ||
          // Equal timestamps (e.g. a linked transfer pair): newest insertion first.
          b.index - a.index,
      )
      .map(({ t }) => t)
  }, [transactions, typeFilter, warehouseFilter])

  return (
    <>
      <div className="filter-bar">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(toTypeFilter(e.target.value))}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          {TRANSACTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABELS[type]}
            </option>
          ))}
        </select>

        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          aria-label="Filter by warehouse"
        >
          <option value="all">All warehouses</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      <div className="panel table-panel">
        {visibleTransactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions match the current filters</h3>
            <p>Try a different type or warehouse.</p>
          </div>
        ) : (
          <div className="table-scroll" tabIndex={0} aria-label="Transaction history table">
            <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.productName}</td>
                  <td>{t.warehouseName}</td>
                  <td>{TYPE_LABELS[t.type]}</td>
                  <td>{t.quantity}</td>
                  <td>
                    <time dateTime={t.timestamp}>
                      {mounted ? new Date(t.timestamp).toLocaleString() : '—'}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

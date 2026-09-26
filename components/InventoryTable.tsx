'use client'

import { useMemo, useState } from 'react'
import {
  Product,
  Warehouse,
  getStockStatus,
  getStockStatusLabel,
  isLowStock,
} from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

export default function InventoryTable({
  products,
  warehouses,
}: {
  products: Product[]
  warehouses: Warehouse[]
}) {
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products],
  )
  const warehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name ?? id

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory)
        return false
      if (lowStockOnly && !isLowStock(p)) return false
      return true
    })
  }, [products, selectedCategory, lowStockOnly])

  return (
    <>
      <div className="summary-strip">
        <div className="summary-tile">
          <div className="value">{products.length}</div>
          <div className="label">Total SKUs tracked</div>
        </div>
        <div className="summary-tile">
          <div className="value">{warehouses.length}</div>
          <div className="label">Warehouses</div>
        </div>
        <div className="summary-tile">
          <div className="value">{categories.length}</div>
          <div className="label">Categories</div>
        </div>
        <div className="summary-tile">
          <div className="value">
            {products.reduce((sum, p) => sum + p.currentStock, 0)}
          </div>
          <div className="label">Units on hand</div>
        </div>
      </div>

      <div className="filter-bar">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={lowStockOnly ? 'low' : 'all'}
          onChange={(e) => setLowStockOnly(e.target.value === 'low')}
          aria-label="Filter by stock level"
        >
          <option value="all">All Stock</option>
          <option value="low">Low Stock Only</option>
        </select>
      </div>

      <div className="panel table-panel">
        {visibleProducts.length === 0 ? (
          <div className="empty-state">
            <h3>No inventory items match the current filters</h3>
            <p>Try a different category or switch back to All Stock.</p>
          </div>
        ) : (
          <div className="table-scroll" tabIndex={0} aria-label="Inventory table">
            <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Warehouse</th>
                <th>Current stock</th>
                <th>Reorder threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const status = getStockStatus(product)
                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{warehouseName(product.warehouseId)}</td>
                    <td>{product.currentStock}</td>
                    <td>{product.reorderThreshold}</td>
                    <td>
                      <StatusBadge
                        status={status}
                        label={getStockStatusLabel(status)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

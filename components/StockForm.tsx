'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Warehouse, parseQuantityInput } from '@/lib/types'

export default function StockForm({
  products: initialProducts,
  warehouses,
}: {
  products: Product[]
  warehouses: Warehouse[]
}) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)

  // A product is identified by name; each warehouse holds its own row for it.
  const productNames = useMemo(
    () => Array.from(new Set(products.map((p) => p.name))).sort(),
    [products],
  )
  const rowFor = (name: string, whId: string) =>
    products.find((p) => p.name === name && p.warehouseId === whId)

  const [productName, setProductName] = useState(productNames[0] ?? '')
  const [warehouseId, setWarehouseId] = useState(
    () =>
      warehouses.find((w) => rowFor(productNames[0] ?? '', w.id))?.id ??
      warehouses[0]?.id ??
      '',
  )
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedProduct = rowFor(productName, warehouseId)
  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId)

  function handleProductChange(name: string) {
    setProductName(name)
    setError('')
    setSuccess('')
    // Keep the chosen warehouse if the product is stocked there.
    if (!rowFor(name, warehouseId)) {
      const firstStocked = warehouses.find((w) => rowFor(name, w.id))
      if (firstStocked) setWarehouseId(firstStocked.id)
    }
  }

  async function submitMovement(direction: 'IN' | 'OUT') {
    setError('')
    setSuccess('')

    if (!selectedProduct || !selectedWarehouse) {
      setError('Select a product stocked at the chosen warehouse.')
      return
    }
    const parsedQuantity = parseQuantityInput(quantity)
    if (parsedQuantity === null) {
      setError('Enter a whole number greater than 0.')
      return
    }
    if (direction === 'OUT' && parsedQuantity > selectedProduct.currentStock) {
      setError(
        `Only ${selectedProduct.currentStock} in stock at ${selectedWarehouse.name} — cannot stock out more than that.`,
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stock',
          productId: selectedProduct.id,
          warehouseId: selectedWarehouse.id,
          quantity: parsedQuantity,
          direction,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }
      const updated: Product = data.product
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setSuccess(
        `${direction === 'IN' ? 'Stocked in' : 'Stocked out'} ${parsedQuantity} unit${parsedQuantity === 1 ? '' : 's'} of ${updated.name} at ${selectedWarehouse.name}. New stock: ${updated.currentStock}.`,
      )
      setQuantity('')
      // Drop cached server-rendered pages so Inventory and History show the
      // new stock level and transaction on the next visit.
      router.refresh()
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel form-panel">
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-field">
          <label htmlFor="product">Product</label>
          <select
            id="product"
            value={productName}
            onChange={(e) => handleProductChange(e.target.value)}
          >
            {productNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="warehouse">Warehouse</label>
          <select
            id="warehouse"
            value={warehouseId}
            onChange={(e) => {
              setWarehouseId(e.target.value)
              setError('')
              setSuccess('')
            }}
          >
            {warehouses.map((w) => {
              const row = rowFor(productName, w.id)
              return (
                <option key={w.id} value={w.id} disabled={!row}>
                  {w.name} {row ? `(${row.currentStock} on hand)` : '(not stocked)'}
                </option>
              )
            })}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min={1}
            step={1}
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <div className="form-error">{error}</div>
        {!error && success && (
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--moss-dark)',
              margin: '-10px 0 12px',
            }}
          >
            {success}
          </p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting}
            onClick={() => submitMovement('IN')}
          >
            Stock in
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={submitting}
            onClick={() => submitMovement('OUT')}
          >
            Stock out
          </button>
        </div>
      </form>
    </div>
  )
}

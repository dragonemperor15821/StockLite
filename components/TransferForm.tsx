'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product, Warehouse, parseQuantityInput } from '@/lib/types'

export default function TransferForm({
  products: initialProducts,
  warehouses,
}: {
  products: Product[]
  warehouses: Warehouse[]
}) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [sourceWarehouseId, setSourceWarehouseId] = useState(
    warehouses[0]?.id ?? '',
  )
  const [destWarehouseId, setDestWarehouseId] = useState(
    warehouses[1]?.id ?? '',
  )

  const sourceProducts = useMemo(
    () => products.filter((p) => p.warehouseId === sourceWarehouseId),
    [products, sourceWarehouseId],
  )
  const [productId, setProductId] = useState(sourceProducts[0]?.id ?? '')
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSourceChange(id: string) {
    setSourceWarehouseId(id)
    const firstAtSource = products.find((p) => p.warehouseId === id)
    setProductId(firstAtSource?.id ?? '')
    if (id === destWarehouseId) {
      const alt = warehouses.find((w) => w.id !== id)
      if (alt) setDestWarehouseId(alt.id)
    }
  }

  const selectedProduct = products.find((p) => p.id === productId)
  const warehouseName = (id: string) =>
    warehouses.find((w) => w.id === id)?.name ?? id

  // These checks give quick feedback; the API re-validates everything.
  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!sourceWarehouseId || !destWarehouseId) {
      setError('Choose both a source and a destination warehouse.')
      return
    }
    if (sourceWarehouseId === destWarehouseId) {
      setError('Source and destination warehouses must be different.')
      return
    }
    if (!selectedProduct || selectedProduct.warehouseId !== sourceWarehouseId) {
      setError('Select a product at the source warehouse.')
      return
    }
    const parsedQuantity = parseQuantityInput(quantity)
    if (parsedQuantity === null) {
      setError('Enter a whole number greater than 0.')
      return
    }
    if (parsedQuantity > selectedProduct.currentStock) {
      setError(
        `Only ${selectedProduct.currentStock} in stock at ${warehouseName(sourceWarehouseId)} — cannot transfer more than that.`,
      )
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          productId: selectedProduct.id,
          sourceWarehouseId,
          destWarehouseId,
          quantity: parsedQuantity,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        return
      }

      const source: Product = data.source
      const destination: Product = data.destination
      setProducts((prev) => {
        const next = prev.map((p) =>
          p.id === source.id ? source : p.id === destination.id ? destination : p,
        )
        return next.some((p) => p.id === destination.id)
          ? next
          : [...next, destination]
      })
      setSuccess(
        `Transferred ${parsedQuantity} unit${parsedQuantity === 1 ? '' : 's'} of ${source.name} from ${warehouseName(source.warehouseId)} (now ${source.currentStock}) to ${warehouseName(destination.warehouseId)} (now ${destination.currentStock}).`,
      )
      setQuantity('')
      // Drop cached server-rendered pages so Inventory and History show the
      // transfer on the next visit.
      router.refresh()
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel form-panel">
      <form onSubmit={handleTransfer} noValidate>
        <div className="form-field">
          <label htmlFor="source">Source warehouse</label>
          <select
            id="source"
            value={sourceWarehouseId}
            onChange={(e) => handleSourceChange(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="t-product">Product</label>
          <select
            id="t-product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={sourceProducts.length === 0}
          >
            {sourceProducts.length === 0 ? (
              <option value="">No products at this warehouse</option>
            ) : (
              sourceProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentStock} on hand)
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="dest">Destination warehouse</label>
          <select
            id="dest"
            value={destWarehouseId}
            onChange={(e) => setDestWarehouseId(e.target.value)}
          >
            {warehouses
              .filter((w) => w.id !== sourceWarehouseId)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="t-quantity">Quantity</label>
          <input
            id="t-quantity"
            type="number"
            min={1}
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
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
          >
            Transfer stock
          </button>
        </div>
      </form>
    </div>
  )
}

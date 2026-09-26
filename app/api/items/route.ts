import { NextResponse } from 'next/server'
import {
  StockError,
  applyStockMovement,
  applyTransfer,
  products,
} from '@/lib/seed-data'

export async function GET() {
  return NextResponse.json({ products })
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const action = body.action

  try {
    if (action === 'stock') {
      const { productId, warehouseId, quantity, direction } = body
      if (typeof productId !== 'string' || typeof warehouseId !== 'string') {
        return NextResponse.json(
          { error: 'productId and warehouseId are required' },
          { status: 400 },
        )
      }
      if (direction !== 'IN' && direction !== 'OUT') {
        return NextResponse.json(
          { error: 'direction must be IN or OUT' },
          { status: 400 },
        )
      }
      // quantity is passed through untouched: applyStockMovement validates the
      // raw value, so coercions like Number('') === 0 can't sneak through.
      const { product, transaction } = applyStockMovement(
        productId,
        warehouseId,
        quantity,
        direction,
      )
      return NextResponse.json({ product, transaction, products })
    }

    if (action === 'transfer') {
      const { productId, destWarehouseId, quantity } = body as {
        productId: string
        destWarehouseId: string
        quantity: number
      }
      const { source, destination } = applyTransfer(
        productId,
        destWarehouseId,
        Number(quantity),
      )
      return NextResponse.json({ source, destination, products })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed'
    const status = err instanceof StockError ? err.status : 400
    return NextResponse.json({ error: message }, { status })
  }
}

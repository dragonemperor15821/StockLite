import {
  Product,
  Transaction,
  TransactionType,
  Warehouse,
  isValidQuantity,
} from './types'

export const warehouses: Warehouse[] = [
  {
    id: 'wh-north',
    name: 'North Distribution Center',
    location: 'Elkridge, MD',
  },
  { id: 'wh-south', name: 'South Fulfillment Hub', location: 'Waco, TX' },
]

export const products: Product[] = [
  {
    id: 'p-001',
    name: 'Corrugated Shipping Box (M)',
    category: 'Packaging',
    warehouseId: 'wh-north',
    currentStock: 420,
    reorderThreshold: 100,
  },
  {
    id: 'p-002',
    name: 'Corrugated Shipping Box (M)',
    category: 'Packaging',
    warehouseId: 'wh-south',
    currentStock: 38,
    reorderThreshold: 100,
  },
  {
    id: 'p-003',
    name: 'Stretch Wrap Film 18in',
    category: 'Packaging',
    warehouseId: 'wh-north',
    currentStock: 64,
    reorderThreshold: 60,
  },
  {
    id: 'p-004',
    name: 'Stretch Wrap Film 18in',
    category: 'Packaging',
    warehouseId: 'wh-south',
    currentStock: 15,
    reorderThreshold: 60,
  },
  {
    id: 'p-005',
    name: 'Packing Tape, Clear 48mm',
    category: 'Packaging',
    warehouseId: 'wh-north',
    currentStock: 210,
    reorderThreshold: 80,
  },
  {
    id: 'p-006',
    name: 'Heavy-Duty Pallet Jack',
    category: 'Equipment',
    warehouseId: 'wh-south',
    currentStock: 6,
    reorderThreshold: 5,
  },
  {
    id: 'p-007',
    name: 'Heavy-Duty Pallet Jack',
    category: 'Equipment',
    warehouseId: 'wh-north',
    currentStock: 3,
    reorderThreshold: 5,
  },
  {
    id: 'p-008',
    name: 'Steel Shelving Unit 5-Tier',
    category: 'Equipment',
    warehouseId: 'wh-north',
    currentStock: 12,
    reorderThreshold: 4,
  },
  {
    id: 'p-009',
    name: 'Forklift Safety Vest',
    category: 'Safety',
    warehouseId: 'wh-south',
    currentStock: 25,
    reorderThreshold: 20,
  },
  {
    id: 'p-010',
    name: 'Forklift Safety Vest',
    category: 'Safety',
    warehouseId: 'wh-north',
    currentStock: 20,
    reorderThreshold: 20,
  },
  {
    id: 'p-011',
    name: 'Nitrile Gloves (Box of 100)',
    category: 'Safety',
    warehouseId: 'wh-north',
    currentStock: 140,
    reorderThreshold: 50,
  },
  {
    id: 'p-012',
    name: 'Nitrile Gloves (Box of 100)',
    category: 'Safety',
    warehouseId: 'wh-south',
    currentStock: 9,
    reorderThreshold: 50,
  },
  {
    id: 'p-013',
    name: 'First Aid Kit, Wall-Mount',
    category: 'Safety',
    warehouseId: 'wh-south',
    currentStock: 8,
    reorderThreshold: 8,
  },
  {
    id: 'p-014',
    name: 'Handheld Barcode Scanner',
    category: 'Electronics',
    warehouseId: 'wh-north',
    currentStock: 18,
    reorderThreshold: 6,
  },
  {
    id: 'p-015',
    name: 'Handheld Barcode Scanner',
    category: 'Electronics',
    warehouseId: 'wh-south',
    currentStock: 4,
    reorderThreshold: 6,
  },
  {
    id: 'p-016',
    name: 'Label Printer, Thermal',
    category: 'Electronics',
    warehouseId: 'wh-north',
    currentStock: 9,
    reorderThreshold: 3,
  },
  {
    id: 'p-017',
    name: 'Warehouse Radio, Two-Way',
    category: 'Electronics',
    warehouseId: 'wh-south',
    currentStock: 11,
    reorderThreshold: 10,
  },
  {
    id: 'p-018',
    name: 'Wooden Pallet, Standard',
    category: 'Materials',
    warehouseId: 'wh-north',
    currentStock: 320,
    reorderThreshold: 150,
  },
  {
    id: 'p-019',
    name: 'Wooden Pallet, Standard',
    category: 'Materials',
    warehouseId: 'wh-south',
    currentStock: 132,
    reorderThreshold: 150,
  },
  {
    id: 'p-020',
    name: 'Cardboard Dunnage Sheets',
    category: 'Materials',
    warehouseId: 'wh-south',
    currentStock: 55,
    reorderThreshold: 55,
  },
]

// A few sample transactions so the History page isn't empty on first load.
export const transactions: Transaction[] = [
  {
    id: 't-001',
    productId: 'p-002',
    productName: 'Corrugated Shipping Box (M)',
    warehouseId: 'wh-south',
    warehouseName: 'South Fulfillment Hub',
    type: 'OUT',
    quantity: 62,
    timestamp: '2026-09-15T14:32:00Z',
  },
  {
    id: 't-002',
    productId: 'p-018',
    productName: 'Wooden Pallet, Standard',
    warehouseId: 'wh-north',
    warehouseName: 'North Distribution Center',
    type: 'IN',
    quantity: 100,
    timestamp: '2026-09-16T09:05:00Z',
  },
  {
    id: 't-003',
    productId: 'p-011',
    productName: 'Nitrile Gloves (Box of 100)',
    warehouseId: 'wh-north',
    warehouseName: 'North Distribution Center',
    type: 'TRANSFER_OUT',
    quantity: 40,
    timestamp: '2026-09-17T11:20:00Z',
    linkedTransactionId: 't-004',
  },
  {
    id: 't-004',
    productId: 'p-012',
    productName: 'Nitrile Gloves (Box of 100)',
    warehouseId: 'wh-south',
    warehouseName: 'South Fulfillment Hub',
    type: 'TRANSFER_IN',
    quantity: 40,
    timestamp: '2026-09-17T11:20:00Z',
    linkedTransactionId: 't-003',
  },
]

let nextTransactionSeq = transactions.length + 1

function warehouseName(id: string) {
  return warehouses.find((w) => w.id === id)?.name ?? id
}

export function findProduct(id: string) {
  return products.find((p) => p.id === id)
}

export function recordTransaction(input: {
  productId: string
  productName: string
  warehouseId: string
  type: TransactionType
  quantity: number
  linkedTransactionId?: string
}): Transaction {
  const tx: Transaction = {
    id: `t-${String(nextTransactionSeq++).padStart(3, '0')}`,
    productId: input.productId,
    productName: input.productName,
    warehouseId: input.warehouseId,
    warehouseName: warehouseName(input.warehouseId),
    type: input.type,
    quantity: input.quantity,
    timestamp: new Date().toISOString(),
    linkedTransactionId: input.linkedTransactionId,
  }
  transactions.push(tx)
  return tx
}

// An expected, user-facing failure, carrying the HTTP status to respond with.
export class StockError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'StockError'
    this.status = status
  }
}

// -------------------------------------------------------------------------
// TASK 2 — Stock In / Stock Out
// -------------------------------------------------------------------------
// Every check runs before anything is written, so a rejected movement leaves
// both the stock level and the transaction log untouched. On success the
// stock update and its IN/OUT transaction are applied together.
export function applyStockMovement(
  productId: string,
  warehouseId: string,
  quantity: unknown,
  direction: 'IN' | 'OUT',
): { product: Product; transaction: Transaction } {
  if (!isValidQuantity(quantity)) {
    throw new StockError('Quantity must be a whole number greater than 0.', 400)
  }

  const warehouse = warehouses.find((w) => w.id === warehouseId)
  if (!warehouse) throw new StockError('Warehouse not found.', 404)

  const product = findProduct(productId)
  if (!product) throw new StockError('Product not found.', 404)

  // Each product row belongs to exactly one warehouse; refuse to touch a row
  // that doesn't belong to the requested warehouse.
  if (product.warehouseId !== warehouse.id) {
    throw new StockError(
      `${product.name} is not stocked at ${warehouse.name}.`,
      400,
    )
  }

  if (direction === 'OUT' && quantity > product.currentStock) {
    throw new StockError(
      `Only ${product.currentStock} in stock at ${warehouse.name} — cannot stock out ${quantity}.`,
      409,
    )
  }

  const nextStock =
    direction === 'IN'
      ? product.currentStock + quantity
      : product.currentStock - quantity
  if (!Number.isSafeInteger(nextStock)) {
    throw new StockError('Quantity is too large.', 400)
  }

  const transaction = recordTransaction({
    productId: product.id,
    productName: product.name,
    warehouseId: warehouse.id,
    type: direction,
    quantity,
  })
  product.currentStock = nextStock

  return { product, transaction }
}

// -------------------------------------------------------------------------
// TASK 3 — Warehouse Transfer
// -------------------------------------------------------------------------
// This is intentionally incomplete AND buggy. Right now it:
//   - does NOT validate source/destination warehouses, or check stock
//   - only decrements the SOURCE product — it never adds the quantity to
//     the destination warehouse (this is one of the Task 5 bugs: "a transfer
//     that only updates one warehouse")
//   - does NOT create a destination product row if one doesn't exist yet
//   - does NOT log any transactions (no linked TRANSFER_OUT / TRANSFER_IN)
//
// Participants must:
//   1. Validate source !== destination
//   2. Validate quantity is positive and <= source.currentStock
//   3. Deduct from source AND add to destination
//   4. Create a destination product row if the product doesn't exist there yet
//   5. Apply fully or not at all (no partial writes if validation fails)
//   6. Record a linked TRANSFER_OUT / TRANSFER_IN pair via recordTransaction
export function applyTransfer(
  productId: string,
  destWarehouseId: string,
  quantity: number,
): { source: Product; destination: Product } {
  const source = findProduct(productId)
  if (!source) throw new Error('Source product not found')

  // TODO: validate destWarehouseId !== source.warehouseId
  // TODO: validate quantity (positive, finite, <= source.currentStock)

  source.currentStock -= quantity

  // BUG: destination is never found/created/incremented.
  // TODO: find or create the destination product row, then add quantity to it
  // TODO: record linked TRANSFER_OUT / TRANSFER_IN transactions

  return { source, destination: source }
}

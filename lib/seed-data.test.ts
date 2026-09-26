// Run with `npm test` (Node's built-in test runner, no extra dependencies).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  StockError,
  applyStockMovement,
  applyTransfer,
  findProduct,
  products,
  transactions,
  warehouses,
} from './seed-data'
import {
  Product,
  getStockStatus,
  isLowStock,
  summarizeLowStock,
} from './types'

// p-001 / p-002 are the same product in North / South.
const NORTH_ROW = 'p-001'
const SOUTH_ROW = 'p-002'

const stockOf = (id: string) => findProduct(id)!.currentStock
const snapshot = () => JSON.stringify({ products, transactions })

function assertRejected(run: () => unknown, status: number) {
  const before = snapshot()
  assert.throws(run, (err: unknown) => {
    assert.ok(err instanceof StockError)
    assert.equal(err.status, status)
    return true
  })
  assert.equal(snapshot(), before, 'a rejected movement must change nothing')
}

test('stock in increases only the selected warehouse and logs one IN', () => {
  const north = stockOf(NORTH_ROW)
  const south = stockOf(SOUTH_ROW)
  const txCount = transactions.length

  const { product, transaction } = applyStockMovement(SOUTH_ROW, 'wh-south', 10, 'IN')

  assert.equal(product.currentStock, south + 10)
  assert.equal(stockOf(SOUTH_ROW), south + 10)
  assert.equal(stockOf(NORTH_ROW), north)
  assert.equal(transactions.length, txCount + 1)
  assert.equal(transactions[transactions.length - 1], transaction)
  assert.equal(transaction.type, 'IN')
  assert.equal(transaction.productId, SOUTH_ROW)
  assert.equal(transaction.warehouseId, 'wh-south')
  assert.equal(transaction.warehouseName, 'South Fulfillment Hub')
  assert.equal(transaction.quantity, 10)
  assert.ok(Math.abs(Date.parse(transaction.timestamp) - Date.now()) < 5000)
})

test('repeated stock in adds exactly each amount, one transaction each', () => {
  const start = stockOf(NORTH_ROW)
  const txCount = transactions.length
  applyStockMovement(NORTH_ROW, 'wh-north', 5, 'IN')
  applyStockMovement(NORTH_ROW, 'wh-north', 7, 'IN')
  assert.equal(stockOf(NORTH_ROW), start + 12)
  assert.equal(transactions.length, txCount + 2)
})

test('stock out decreases only the selected warehouse and logs one OUT', () => {
  const north = stockOf(NORTH_ROW)
  const south = stockOf(SOUTH_ROW)
  const txCount = transactions.length

  const { transaction } = applyStockMovement(NORTH_ROW, 'wh-north', 10, 'OUT')

  assert.equal(stockOf(NORTH_ROW), north - 10)
  assert.equal(stockOf(SOUTH_ROW), south)
  assert.equal(transactions.length, txCount + 1)
  assert.equal(transaction.type, 'OUT')
  assert.equal(transaction.warehouseId, 'wh-north')
  assert.equal(transaction.quantity, 10)
})

test('stock out of exactly the current stock leaves 0', () => {
  applyStockMovement(SOUTH_ROW, 'wh-south', stockOf(SOUTH_ROW), 'OUT')
  assert.equal(stockOf(SOUTH_ROW), 0)
})

test('stock out beyond current stock is rejected with 409', () => {
  assertRejected(
    () => applyStockMovement(NORTH_ROW, 'wh-north', stockOf(NORTH_ROW) + 1, 'OUT'),
    409,
  )
  assertRejected(() => applyStockMovement(SOUTH_ROW, 'wh-south', 1, 'OUT'), 409)
})

test('invalid quantities are rejected with 400 for both directions', () => {
  const invalid: unknown[] = [
    0, -10, 1.5, NaN, Infinity, -Infinity, 2 ** 53,
    '10', '', 'abc', null, undefined, true, [5], {},
  ]
  for (const direction of ['IN', 'OUT'] as const) {
    for (const quantity of invalid) {
      assertRejected(
        () => applyStockMovement(NORTH_ROW, 'wh-north', quantity, direction),
        400,
      )
    }
  }
})

test('a product row cannot be moved through the other warehouse', () => {
  assertRejected(() => applyStockMovement(NORTH_ROW, 'wh-south', 1, 'IN'), 400)
  assertRejected(() => applyStockMovement(SOUTH_ROW, 'wh-north', 1, 'IN'), 400)
})

test('unknown product or warehouse is rejected with 404', () => {
  assertRejected(() => applyStockMovement('p-999', 'wh-north', 1, 'IN'), 404)
  assertRejected(() => applyStockMovement(NORTH_ROW, 'wh-east', 1, 'IN'), 404)
})

// p-011 / p-012 are Nitrile Gloves in North / South.
const GLOVES_NORTH = 'p-011'
const GLOVES_SOUTH = 'p-012'

test('transfer moves stock between warehouses and logs a linked pair', () => {
  const north = stockOf(GLOVES_NORTH)
  const south = stockOf(GLOVES_SOUTH)
  const rowCount = products.length
  const txCount = transactions.length

  const { source, destination, transactions: pair } = applyTransfer(
    GLOVES_NORTH,
    'wh-north',
    'wh-south',
    30,
  )

  assert.equal(source.id, GLOVES_NORTH)
  assert.equal(destination.id, GLOVES_SOUTH)
  assert.equal(stockOf(GLOVES_NORTH), north - 30)
  assert.equal(stockOf(GLOVES_SOUTH), south + 30)
  assert.equal(products.length, rowCount, 'no row is created when one exists')

  const [out, into] = pair
  assert.equal(transactions.length, txCount + 2)
  assert.deepEqual(transactions.slice(-2), [out, into])
  assert.equal(out.type, 'TRANSFER_OUT')
  assert.equal(out.productId, GLOVES_NORTH)
  assert.equal(out.warehouseId, 'wh-north')
  assert.equal(into.type, 'TRANSFER_IN')
  assert.equal(into.productId, GLOVES_SOUTH)
  assert.equal(into.warehouseId, 'wh-south')
  assert.equal(out.quantity, 30)
  assert.equal(into.quantity, 30)
  assert.equal(out.linkedTransactionId, into.id)
  assert.equal(into.linkedTransactionId, out.id)
})

test('transfer back the other way works too', () => {
  const north = stockOf(GLOVES_NORTH)
  const south = stockOf(GLOVES_SOUTH)
  applyTransfer(GLOVES_SOUTH, 'wh-south', 'wh-north', 5)
  assert.equal(stockOf(GLOVES_SOUTH), south - 5)
  assert.equal(stockOf(GLOVES_NORTH), north + 5)
})

test('transfer creates the destination row when the product is new there', () => {
  // Packing Tape (p-005) is only stocked in North.
  const tape = findProduct('p-005')!
  const before = tape.currentStock
  assert.equal(
    products.some((p) => p.name === tape.name && p.warehouseId === 'wh-south'),
    false,
  )

  const { destination } = applyTransfer('p-005', 'wh-north', 'wh-south', 25)

  assert.equal(tape.currentStock, before - 25)
  assert.equal(destination.warehouseId, 'wh-south')
  assert.equal(destination.name, tape.name)
  assert.equal(destination.category, tape.category)
  assert.equal(destination.reorderThreshold, tape.reorderThreshold)
  assert.equal(destination.currentStock, 25)
  assert.equal(findProduct(destination.id), destination)
  assert.equal(new Set(products.map((p) => p.id)).size, products.length)

  // A second transfer reuses the new row instead of creating another.
  const rowCount = products.length
  applyTransfer('p-005', 'wh-north', 'wh-south', 5)
  assert.equal(products.length, rowCount)
  assert.equal(destination.currentStock, 30)
})

test('transfer of the entire source stock leaves the source at 0', () => {
  applyTransfer(GLOVES_SOUTH, 'wh-south', 'wh-north', stockOf(GLOVES_SOUTH))
  assert.equal(stockOf(GLOVES_SOUTH), 0)
})

test('rejected transfers change nothing', () => {
  // insufficient stock
  assertRejected(
    () => applyTransfer(GLOVES_NORTH, 'wh-north', 'wh-south', stockOf(GLOVES_NORTH) + 1),
    409,
  )
  assertRejected(() => applyTransfer(GLOVES_SOUTH, 'wh-south', 'wh-north', 1), 409)
  // same warehouse
  assertRejected(() => applyTransfer(GLOVES_NORTH, 'wh-north', 'wh-north', 1), 400)
  // product not at the stated source
  assertRejected(() => applyTransfer(GLOVES_NORTH, 'wh-south', 'wh-north', 1), 400)
  // unknown warehouses / product
  assertRejected(() => applyTransfer(GLOVES_NORTH, 'wh-east', 'wh-south', 1), 404)
  assertRejected(() => applyTransfer(GLOVES_NORTH, 'wh-north', 'wh-east', 1), 404)
  assertRejected(() => applyTransfer('p-999', 'wh-north', 'wh-south', 1), 404)
  // invalid quantities
  for (const quantity of [0, -5, 2.5, NaN, Infinity, '5', '', null, undefined, true]) {
    assertRejected(
      () => applyTransfer(GLOVES_NORTH, 'wh-north', 'wh-south', quantity),
      400,
    )
  }
})

// ---------------------------------------------------------------------------
// Task 5 regression tests
// ---------------------------------------------------------------------------

const totalUnits = () => products.reduce((sum, p) => sum + p.currentStock, 0)
const lowCounts = () =>
  Object.fromEntries(
    summarizeLowStock(products, warehouses).map((s) => [
      s.warehouse.id,
      s.lowStockCount,
    ]),
  )
const row = (stock: number, threshold: number, warehouseId = 'wh-a'): Product => ({
  id: `x-${warehouseId}-${stock}-${threshold}`,
  name: 'Widget',
  category: 'Test',
  warehouseId,
  currentStock: stock,
  reorderThreshold: threshold,
})

test('low stock rule: below and at threshold are low, above is not', () => {
  assert.equal(isLowStock(row(4, 5)), true)
  assert.equal(isLowStock(row(5, 5)), true, 'stock === threshold is low stock')
  assert.equal(isLowStock(row(6, 5)), false)
  assert.equal(isLowStock(row(0, 0)), true)

  // The status badge agrees with the rule: only "ok" is not low stock.
  assert.equal(getStockStatus(row(4, 5)), 'critical')
  assert.equal(getStockStatus(row(5, 5)), 'low')
  assert.equal(getStockStatus(row(6, 5)), 'ok')
})

test('low stock summary counts each warehouse separately', () => {
  const whs = [
    { id: 'wh-a', name: 'A', location: '' },
    { id: 'wh-b', name: 'B', location: '' },
    { id: 'wh-c', name: 'C', location: '' },
  ]
  const summary = summarizeLowStock(
    [
      // Same product in two warehouses: low in A, fine in B.
      row(2, 5, 'wh-a'),
      row(9, 5, 'wh-b'),
      row(5, 5, 'wh-a'), // at threshold counts
      row(6, 5, 'wh-a'), // above threshold doesn't
      row(1, 5, 'wh-unknown'), // belongs to no listed warehouse
    ],
    whs,
  )
  assert.deepEqual(
    summary.map((s) => [s.warehouse.id, s.lowStockCount, s.productCount]),
    [
      ['wh-a', 2, 3],
      ['wh-b', 0, 1],
      ['wh-c', 0, 0], // listed even with no products
    ],
  )
})

test('low stock summary follows stock operations in the right warehouse', () => {
  // Stretch Wrap: p-003 North 64 / threshold 60, p-004 South 15 / threshold 60.
  const start = lowCounts()

  applyStockMovement('p-003', 'wh-north', 4, 'OUT') // 60 → at threshold
  assert.deepEqual(lowCounts(), {
    ...start,
    'wh-north': start['wh-north'] + 1,
  })

  applyStockMovement('p-003', 'wh-north', 1, 'IN') // 61 → above threshold
  assert.deepEqual(lowCounts(), start)

  // Transfer 50 North → South: North drops to 11 (low), South rises to 65 (ok).
  applyTransfer('p-003', 'wh-north', 'wh-south', 50)
  assert.deepEqual(lowCounts(), {
    'wh-north': start['wh-north'] + 1,
    'wh-south': start['wh-south'] - 1,
  })
})

test('stock totals change by exactly the moved quantity', () => {
  let total = totalUnits()
  applyStockMovement('p-018', 'wh-north', 30, 'IN')
  assert.equal(totalUnits(), total + 30)
  total = totalUnits()
  applyStockMovement('p-018', 'wh-north', 12, 'OUT')
  assert.equal(totalUnits(), total - 12)

  // A transfer moves stock without creating or destroying units.
  total = totalUnits()
  applyTransfer('p-018', 'wh-north', 'wh-south', 40)
  assert.equal(totalUnits(), total)

  // Rejected operations leave the total alone.
  assertRejected(() => applyStockMovement('p-018', 'wh-north', -5, 'IN'), 400)
  assertRejected(
    () => applyTransfer('p-019', 'wh-south', 'wh-north', stockOf('p-019') + 1),
    409,
  )
  assert.equal(totalUnits(), total)
})

test('inventory never goes negative', () => {
  // Drain a row completely, then try to go below zero both ways.
  applyStockMovement('p-020', 'wh-south', stockOf('p-020'), 'OUT')
  assert.equal(stockOf('p-020'), 0)
  assertRejected(() => applyStockMovement('p-020', 'wh-south', 1, 'OUT'), 409)
  assertRejected(() => applyTransfer('p-020', 'wh-south', 'wh-north', 1), 409)
  assert.ok(products.every((p) => p.currentStock >= 0))
})

test('a rejected transfer to a new warehouse creates no destination row', () => {
  // Label Printer (p-016, 9 units) is only stocked in North.
  const rowCount = products.length
  assertRejected(() => applyTransfer('p-016', 'wh-north', 'wh-south', 10), 409)
  assertRejected(() => applyTransfer('p-016', 'wh-north', 'wh-south', 0), 400)
  assert.equal(products.length, rowCount)
  assert.equal(stockOf('p-016'), 9)
})

test('seeded transactions are left intact', () => {
  assert.deepEqual(
    transactions.slice(0, 4).map((t) => t.id),
    ['t-001', 't-002', 't-003', 't-004'],
  )
})

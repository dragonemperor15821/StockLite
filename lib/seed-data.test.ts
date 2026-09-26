// Run with `npm test` (Node's built-in test runner, no extra dependencies).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  StockError,
  applyStockMovement,
  findProduct,
  products,
  transactions,
} from './seed-data'

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

test('seeded transactions are left intact', () => {
  assert.deepEqual(
    transactions.slice(0, 4).map((t) => t.id),
    ['t-001', 't-002', 't-003', 't-004'],
  )
})

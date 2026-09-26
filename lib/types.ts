// Shared types used across the StockLite app.

export type Warehouse = {
  id: string
  name: string
  location: string
}

export type Product = {
  id: string
  name: string
  category: string
  warehouseId: string
  currentStock: number
  reorderThreshold: number
}

export type TransactionType = 'IN' | 'OUT' | 'TRANSFER_OUT' | 'TRANSFER_IN'

export type Transaction = {
  id: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  type: TransactionType
  quantity: number
  timestamp: string // ISO string
  linkedTransactionId?: string // pairs TRANSFER_OUT with TRANSFER_IN
}

export type StaffUser = {
  id: string
  name: string
  role: 'staff'
}

// Low-stock status shared by the inventory table and status badge.
export type StockStatus = 'ok' | 'low' | 'critical'

// The single low-stock rule: current stock at or below the reorder threshold.
export function isLowStock(product: Product): boolean {
  return product.currentStock <= product.reorderThreshold
}

export function getStockStatus(product: Product): StockStatus {
  if (!isLowStock(product)) return 'ok'
  if (product.currentStock < product.reorderThreshold) return 'critical'
  return 'low'
}

export function getStockStatusLabel(status: StockStatus): string {
  if (status === 'critical') return 'Below threshold'
  if (status === 'low') return 'At threshold'
  return 'In stock'
}

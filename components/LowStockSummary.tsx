import { Product, Warehouse, summarizeLowStock } from '@/lib/types'

export default function LowStockSummary({
  products,
  warehouses,
}: {
  products: Product[]
  warehouses: Warehouse[]
}) {
  return (
    <section className="low-stock-summary" aria-label="Low stock summary">
      <h2>Needs replenishment</h2>
      <div className="low-stock-grid">
        {summarizeLowStock(products, warehouses).map(
          ({ warehouse, lowStockCount, productCount }) => (
            <div className="summary-tile" key={warehouse.id}>
              <div className={lowStockCount > 0 ? 'value value-alert' : 'value'}>
                {lowStockCount}
              </div>
              <div className="label">
                {warehouse.name} — of {productCount} product
                {productCount === 1 ? '' : 's'} at or below reorder threshold
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  )
}

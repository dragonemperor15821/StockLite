import DashboardShell from '@/components/DashboardShell'
import StockForm from '@/components/StockForm'
import { products, warehouses } from '@/lib/seed-data'

export const dynamic = 'force-dynamic'

export default function StockPage() {
  return (
    <DashboardShell>
      <div className="page-header">
        <div>
          <h1>Stock In / Stock Out</h1>
          <p>Record incoming or outgoing stock for a single warehouse.</p>
        </div>
      </div>
      <StockForm products={products} warehouses={warehouses} />
    </DashboardShell>
  )
}

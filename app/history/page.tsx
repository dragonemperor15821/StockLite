import DashboardShell from '@/components/DashboardShell'
import TransactionTable from '@/components/TransactionTable'
import { transactions, warehouses } from '@/lib/seed-data'

export const dynamic = 'force-dynamic'

export default function HistoryPage() {
  return (
    <DashboardShell>
      <div className="page-header">
        <div>
          <h1>Transaction History</h1>
          <p>A record of every stock movement across warehouses.</p>
        </div>
      </div>
      <TransactionTable transactions={transactions} warehouses={warehouses} />
    </DashboardShell>
  )
}

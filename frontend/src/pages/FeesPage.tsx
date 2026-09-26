import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PaymentForm from '../components/PaymentForm'
import { Card, Empty, ErrorBox, Field, Input, Loading, PageHeader, Select, StatCard, StatusBadge } from '../components/ui'
import { api } from '../lib/api'
import { currentMonth, money, monthLabel, whatsappLink } from '../lib/format'
import type { FeeRow, FeeStatus } from '../lib/types'

export default function FeesPage() {
  const [month, setMonth] = useState(currentMonth())
  const [batchId, setBatchId] = useState<number | undefined>()
  const [filter, setFilter] = useState<'ALL' | FeeStatus>('ALL')
  const [paying, setPaying] = useState<FeeRow | null>(null)

  const batches = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const fees = useQuery({
    queryKey: ['fees', month, batchId],
    queryFn: () => api.fees(month, batchId),
    placeholderData: (prev) => prev,
  })

  const rows = (fees.data?.rows ?? []).filter((r) => filter === 'ALL' || r.status === filter)

  return (
    <>
      <PageHeader title="Fees" subtitle={monthLabel(month)} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Field label="Month">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value || currentMonth())} />
        </Field>
        <Field label="Batch">
          <Select value={batchId ?? ''} onChange={(e) => setBatchId(e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">All batches</option>
            {batches.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </Field>
        <Field label="Show">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as 'ALL' | FeeStatus)}>
            <option value="ALL">Everyone</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
          </Select>
        </Field>
      </div>

      {fees.data && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatCard label="Expected" value={money(fees.data.expected)} />
          <StatCard label="Collected" value={money(fees.data.collected)} tone="green" />
          <StatCard label="Pending" value={money(fees.data.pending)} tone="red" />
        </div>
      )}

      {fees.isLoading && <Loading />}
      {fees.error && <ErrorBox error={fees.error} />}
      {fees.data && rows.length === 0 && <Empty title="Nobody to show for this filter" />}

      {rows.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">Fee</th>
                <th className="hidden px-4 py-3 text-right sm:table-cell">Paid</th>
                <th className="px-4 py-3 text-right">Due</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.studentId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/students/${r.studentId}`} className="font-medium text-slate-800 hover:text-indigo-600">{r.studentName}</Link>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="text-xs text-slate-500">{r.batchName ?? 'No batch'}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-right sm:table-cell">{money(r.fee)}</td>
                  <td className="hidden px-4 py-3 text-right text-emerald-700 sm:table-cell">{money(r.paid)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${r.due > 0 ? 'text-red-600' : 'text-slate-400'}`}>{money(r.due)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-3">
                      {r.due > 0 && (
                        <button onClick={() => setPaying(r)} className="text-sm font-medium text-indigo-600 hover:underline">Collect</button>
                      )}
                      {r.due > 0 && r.parentPhone && (
                        <a
                          target="_blank" rel="noreferrer" className="text-sm font-medium text-emerald-700 hover:underline"
                          href={whatsappLink(r.parentPhone, `Hello, this is a gentle reminder that ${r.studentName}'s fee of ${money(r.due)} for ${monthLabel(month)} is pending. Thank you!`)}
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {paying && (
        <PaymentForm
          studentId={paying.studentId} studentName={paying.studentName} month={month}
          suggestedAmount={paying.due} onClose={() => setPaying(null)}
        />
      )}
    </>
  )
}

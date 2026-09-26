import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, ErrorBox, Loading, PageHeader, StatCard, StatusBadge } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { money, monthLabel, whatsappLink } from '../lib/format'

export default function DashboardPage() {
  const { teacher } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: api.dashboard })

  if (isLoading) return <Loading />
  if (error || !data) return <ErrorBox error={error} />

  const collectedPct = data.feesExpected > 0 ? Math.round((data.feesCollected / data.feesExpected) * 100) : 0

  return (
    <>
      <PageHeader title={`Hello, ${teacher?.name.split(' ')[0]}`} subtitle={`Overview for ${monthLabel(data.month)}`} />

      {data.activeBatches === 0 && (
        <Card className="mb-6 border-indigo-200 bg-indigo-50 p-5">
          <p className="font-medium text-indigo-900">Get started in 2 steps</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-indigo-800">
            <li><Link to="/batches" className="underline">Create your first batch</Link> with its monthly fee</li>
            <li><Link to="/students" className="underline">Add students</Link> to that batch</li>
          </ol>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active students" value={data.activeStudents} />
        <StatCard label="Batches" value={data.activeBatches} />
        <StatCard label="Collected this month" value={money(data.feesCollected)} tone="green" />
        <StatCard label="Pending this month" value={money(data.feesPending)} tone="red" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold">Fee collection</h2>
          <p className="mt-1 text-sm text-slate-500">{money(data.feesCollected)} of {money(data.feesExpected)}</p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${collectedPct}%` }} />
          </div>
          <p className="mt-2 text-sm font-medium text-slate-700">{collectedPct}% collected</p>

          <h2 className="mt-6 font-semibold">Today's attendance</h2>
          {data.todayMarked === 0 ? (
            <p className="mt-1 text-sm text-slate-500">Not marked yet. <Link to="/attendance" className="font-medium text-indigo-600">Mark now</Link></p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">{data.todayPresent} present out of {data.todayMarked} marked</p>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Highest dues this month</h2>
            <Link to="/fees" className="text-sm font-medium text-indigo-600">See all</Link>
          </div>
          {data.topDues.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No pending fees. Well done!</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {data.topDues.map((r) => (
                <li key={r.studentId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/students/${r.studentId}`} className="font-medium text-slate-800 hover:text-indigo-600">{r.studentName}</Link>
                    <p className="text-xs text-slate-500">{r.batchName ?? 'No batch'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    <span className="w-20 text-right font-semibold text-red-600">{money(r.due)}</span>
                    {r.parentPhone && (
                      <a
                        className="text-xs font-medium text-emerald-700 hover:underline"
                        target="_blank" rel="noreferrer"
                        href={whatsappLink(r.parentPhone, `Hello, this is a gentle reminder that ${r.studentName}'s fee of ${money(r.due)} for ${monthLabel(data.month)} is pending. Thank you!`)}
                      >
                        Remind
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

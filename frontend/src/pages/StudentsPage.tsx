import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import StudentForm from '../components/StudentForm'
import { Button, Card, Empty, ErrorBox, Input, Loading, PageHeader, Select } from '../components/ui'
import { api } from '../lib/api'
import { money } from '../lib/format'

export default function StudentsPage() {
  const [params, setParams] = useSearchParams()
  const batchId = params.get('batchId') ? Number(params.get('batchId')) : undefined
  const [q, setQ] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [adding, setAdding] = useState(false)

  const batches = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const students = useQuery({
    queryKey: ['students', { batchId, q, showInactive }],
    queryFn: () => api.students({ batchId, q, includeInactive: showInactive }),
    placeholderData: (prev) => prev,
  })

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={students.data ? `${students.data.length} shown` : undefined}
        action={<Button onClick={() => setAdding(true)}>+ Add student</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select
          className="max-w-xs"
          value={batchId ?? ''}
          onChange={(e) => (e.target.value ? setParams({ batchId: e.target.value }) : setParams({}))}
        >
          <option value="">All batches</option>
          {batches.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      {students.isLoading && <Loading />}
      {students.error && <ErrorBox error={students.error} />}
      {students.data && students.data.length === 0 && (
        <Empty title="No students found">Add your first student with the button above.</Empty>
      )}

      {students.data && students.data.length > 0 && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="hidden px-4 py-3 sm:table-cell">Batch</th>
                <th className="hidden px-4 py-3 md:table-cell">Parent phone</th>
                <th className="px-4 py-3 text-right">Fee / month</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.data.map((s) => (
                <tr key={s.id} className={`hover:bg-slate-50 ${s.active ? '' : 'text-slate-400'}`}>
                  <td className="px-4 py-3">
                    <Link to={`/students/${s.id}`} className="font-medium text-slate-800 hover:text-indigo-600">{s.name}</Link>
                    {!s.active && <span className="ml-2 text-xs">(inactive)</span>}
                    <p className="text-xs text-slate-500 sm:hidden">{s.batchName ?? 'No batch'}</p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">{s.batchName ?? '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{s.parentPhone ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{money(s.effectiveFee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {adding && <StudentForm student={null} defaultBatchId={batchId} onClose={() => setAdding(false)} />}
    </>
  )
}

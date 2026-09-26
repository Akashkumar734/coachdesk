import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Empty, ErrorBox, Field, Input, Loading, PageHeader, Select } from '../components/ui'
import { api } from '../lib/api'
import { dateLabel, todayISO } from '../lib/format'

export default function AttendancePage() {
  const qc = useQueryClient()
  const batches = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const activeBatches = batches.data?.filter((b) => b.active) ?? []
  const [batchId, setBatchId] = useState<number | null>(null)
  const [date, setDate] = useState(todayISO())
  const [marks, setMarks] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState(false)

  // pick the first batch automatically
  useEffect(() => {
    if (batchId === null && activeBatches.length > 0) setBatchId(activeBatches[0].id)
  }, [batchId, activeBatches])

  const day = useQuery({
    queryKey: ['attendance', batchId, date],
    queryFn: () => api.attendance(batchId!, date),
    enabled: batchId !== null,
  })

  // load what is already saved; unmarked students default to present
  useEffect(() => {
    if (!day.data) return
    const m: Record<number, boolean> = {}
    day.data.rows.forEach((r) => { m[r.studentId] = r.present ?? true })
    setMarks(m)
  }, [day.data])

  useEffect(() => setSaved(false), [batchId, date])

  const save = useMutation({
    mutationFn: () => api.markAttendance(date, Object.entries(marks).map(([id, present]) => ({ studentId: Number(id), present }))),
    onSuccess: () => {
      setSaved(true)
      qc.invalidateQueries({ queryKey: ['attendance', batchId, date] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['studentAttendance'] })
    },
  })

  const rows = day.data?.rows ?? []
  const presentCount = rows.filter((r) => marks[r.studentId]).length
  const alreadyMarked = rows.some((r) => r.present !== null)
  const setAll = (value: boolean) => setMarks(Object.fromEntries(rows.map((r) => [r.studentId, value])))

  if (batches.isLoading) return <Loading />
  if (batches.error) return <ErrorBox error={batches.error} />
  if (activeBatches.length === 0) {
    return (
      <>
        <PageHeader title="Attendance" />
        <Empty title="No active batches">
          <Link to="/batches" className="font-medium text-indigo-600">Create a batch</Link> first, then add students.
        </Empty>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Attendance" subtitle="Tap a student to switch between present and absent" />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <Field label="Batch">
          <Select value={batchId ?? ''} onChange={(e) => setBatchId(Number(e.target.value))}>
            {activeBatches.map((b) => <option key={b.id} value={b.id}>{b.name}{b.timing ? ` (${b.timing})` : ''}</option>)}
          </Select>
        </Field>
        <Field label="Date">
          <Input type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value || todayISO())} />
        </Field>
      </div>

      {day.isLoading && <Loading />}
      {day.error && <ErrorBox error={day.error} />}
      {day.data && rows.length === 0 && (
        <Empty title="No students in this batch">
          <Link to={`/students?batchId=${batchId}`} className="font-medium text-indigo-600">Add students</Link> to this batch.
        </Empty>
      )}

      {rows.length > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{presentCount}</span> of {rows.length} present · {dateLabel(date)}
              {alreadyMarked && <span className="ml-2 rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">Already saved, editing</span>}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setAll(true)}>All present</Button>
              <Button variant="secondary" onClick={() => setAll(false)}>All absent</Button>
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const present = marks[r.studentId]
              return (
                <li key={r.studentId}>
                  <button
                    onClick={() => { setMarks({ ...marks, [r.studentId]: !present }); setSaved(false) }}
                    className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition
                      ${present ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}
                  >
                    <span className="font-medium">{r.studentName}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${present ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                      {present ? 'P' : 'A'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex items-center justify-end gap-3">
            {save.error && <span className="text-sm text-red-600">{(save.error as Error).message}</span>}
            {saved && <span className="text-sm font-medium text-emerald-700">Saved ✓</span>}
            <Button onClick={() => save.mutate()} loading={save.isPending}>Save attendance</Button>
          </div>
        </Card>
      )}
    </>
  )
}

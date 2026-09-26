import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PaymentForm from '../components/PaymentForm'
import StudentForm from '../components/StudentForm'
import { Button, Card, ErrorBox, Input, Loading, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { currentMonth, dateLabel, money, monthLabel } from '../lib/format'

export default function StudentDetailPage() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [month, setMonth] = useState(currentMonth())
  const [editing, setEditing] = useState(false)
  const [paying, setPaying] = useState(false)

  const student = useQuery({ queryKey: ['student', id], queryFn: () => api.student(id) })
  const attendance = useQuery({ queryKey: ['studentAttendance', id, month], queryFn: () => api.studentAttendance(id, month) })
  const payments = useQuery({ queryKey: ['payments', id], queryFn: () => api.payments(id) })

  const removeStudent = useMutation({
    mutationFn: () => api.deleteStudent(id),
    onSuccess: () => {
      qc.invalidateQueries()
      navigate('/students')
    },
  })
  const removePayment = useMutation({
    mutationFn: api.deletePayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments', id] })
      qc.invalidateQueries({ queryKey: ['fees'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  if (student.isLoading) return <Loading />
  if (student.error || !student.data) return <ErrorBox error={student.error} />
  const s = student.data

  return (
    <>
      <Link to="/students" className="text-sm text-indigo-600">← All students</Link>
      <PageHeader
        title={s.name}
        subtitle={`${s.batchName ?? 'No batch'} · Joined ${dateLabel(s.joinDate)} · ${money(s.effectiveFee)}/month${s.active ? '' : ' · Inactive'}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
            <Button onClick={() => setPaying(true)}>Record payment</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-slate-500">Parent</dt><dd>{s.parentName ?? '—'}</dd></div>
            <div><dt className="text-slate-500">Parent phone</dt><dd>{s.parentPhone ? <a className="text-indigo-600" href={`tel:${s.parentPhone}`}>{s.parentPhone}</a> : '—'}</dd></div>
            <div><dt className="text-slate-500">Student phone</dt><dd>{s.phone ?? '—'}</dd></div>
            {s.notes && <div><dt className="text-slate-500">Notes</dt><dd className="whitespace-pre-line">{s.notes}</dd></div>}
          </dl>
          <Button
            variant="ghost" className="mt-6 px-0 text-red-600" loading={removeStudent.isPending}
            onClick={() => confirm(`Delete ${s.name}? Their attendance and payments will also be deleted. Tip: mark them inactive instead to keep history.`) && removeStudent.mutate()}
          >
            Delete student
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Attendance</h2>
            <Input type="month" className="w-40" value={month} onChange={(e) => setMonth(e.target.value || currentMonth())} />
          </div>
          {attendance.data && (
            <>
              <p className="mt-3 text-3xl font-semibold text-indigo-600">{attendance.data.percentage}%</p>
              <p className="text-sm text-slate-500">
                {attendance.data.presentDays} present · {attendance.data.absentDays} absent in {monthLabel(month)}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {attendance.data.days.map((d) => (
                  <span
                    key={d.date}
                    title={`${dateLabel(d.date)}: ${d.present ? 'Present' : 'Absent'}`}
                    className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium
                      ${d.present ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {Number(d.date.slice(8))}
                  </span>
                ))}
                {attendance.data.days.length === 0 && <p className="text-sm text-slate-500">No attendance marked this month.</p>}
              </div>
            </>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Payments</h2>
          {payments.data?.length === 0 && <p className="mt-3 text-sm text-slate-500">No payments yet.</p>}
          <ul className="mt-2 divide-y divide-slate-100">
            {payments.data?.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium">{money(p.amount)} <span className="font-normal text-slate-500">for {monthLabel(p.month)}</span></p>
                  <p className="text-xs text-slate-500">{dateLabel(p.paidOn)} · {p.mode}{p.note ? ` · ${p.note}` : ''}</p>
                </div>
                <button
                  className="text-xs text-slate-400 hover:text-red-600"
                  onClick={() => confirm('Delete this payment?') && removePayment.mutate(p.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {editing && <StudentForm student={s} onClose={() => setEditing(false)} />}
      {paying && (
        <PaymentForm studentId={s.id} studentName={s.name} month={currentMonth()} suggestedAmount={s.effectiveFee} onClose={() => setPaying(false)} />
      )}
    </>
  )
}

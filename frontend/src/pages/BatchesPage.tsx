import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { money } from '../lib/format'
import type { Batch } from '../lib/types'

export default function BatchesPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const [editing, setEditing] = useState<Batch | 'new' | null>(null)

  return (
    <>
      <PageHeader
        title="Batches"
        subtitle="Groups of students who study together, each with a monthly fee"
        action={<Button onClick={() => setEditing('new')}>+ New batch</Button>}
      />
      {isLoading && <Loading />}
      {error && <ErrorBox error={error} />}
      {data && data.length === 0 && (
        <Empty title="No batches yet">Create a batch like “Class 10 Maths, 5–6 PM” to get started.</Empty>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((b) => (
          <Card key={b.id} className={`p-5 ${b.active ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{b.name}</h3>
                <p className="text-sm text-slate-500">{[b.subject, b.timing].filter(Boolean).join(' · ') || '—'}</p>
              </div>
              {!b.active && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">Inactive</span>}
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-lg font-semibold">{money(b.monthlyFee)}<span className="text-sm font-normal text-slate-500"> /month</span></p>
                <Link to={`/students?batchId=${b.id}`} className="text-sm text-indigo-600 hover:underline">{b.studentCount} students</Link>
              </div>
              <Button variant="secondary" onClick={() => setEditing(b)}>Edit</Button>
            </div>
          </Card>
        ))}
      </div>
      {editing && <BatchForm batch={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function BatchForm({ batch, onClose }: { batch: Batch | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: batch?.name ?? '',
    subject: batch?.subject ?? '',
    timing: batch?.timing ?? '',
    monthlyFee: batch ? String(batch.monthlyFee) : '',
    active: batch?.active ?? true,
  })

  const done = () => {
    qc.invalidateQueries({ queryKey: ['batches'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
    qc.invalidateQueries({ queryKey: ['students'] })
    onClose()
  }
  const save = useMutation({
    mutationFn: () => {
      const body = { ...form, monthlyFee: Number(form.monthlyFee || 0) }
      return batch ? api.updateBatch(batch.id, body) : api.createBatch(body)
    },
    onSuccess: done,
  })
  const remove = useMutation({ mutationFn: () => api.deleteBatch(batch!.id), onSuccess: done })
  const errs = save.error instanceof ApiError ? save.error.errors : {}

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <Modal open title={batch ? 'Edit batch' : 'New batch'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {(save.error || remove.error) && <ErrorBox error={save.error ?? remove.error} />}
        <Field label="Batch name" error={errs.name}>
          <Input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Class 10 Maths" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject">
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Maths" />
          </Field>
          <Field label="Timing">
            <Input value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })} placeholder="Mon–Fri, 5–6 PM" />
          </Field>
        </div>
        <Field label="Monthly fee (₹)" error={errs.monthlyFee}>
          <Input type="number" min={0} step="1" required inputMode="numeric" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} />
        </Field>
        {batch && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Batch is active
          </label>
        )}
        <div className="flex items-center justify-between gap-2 pt-2">
          {batch ? (
            <Button
              type="button" variant="ghost" className="text-red-600" loading={remove.isPending}
              onClick={() => confirm('Delete this batch? Students stay, but will have no batch.') && remove.mutate()}
            >
              Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={save.isPending}>Save</Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorBox, Field, Input, Modal, Select } from './ui'
import { api, ApiError } from '../lib/api'
import { money, todayISO } from '../lib/format'
import type { Student } from '../lib/types'

export default function StudentForm({ student, defaultBatchId, onClose, onSaved }:
  { student: Student | null; defaultBatchId?: number; onClose: () => void; onSaved?: (s: Student) => void }) {
  const qc = useQueryClient()
  const batches = useQuery({ queryKey: ['batches'], queryFn: api.batches })
  const [form, setForm] = useState({
    name: student?.name ?? '',
    phone: student?.phone ?? '',
    parentName: student?.parentName ?? '',
    parentPhone: student?.parentPhone ?? '',
    batchId: student?.batchId ?? defaultBatchId ?? '',
    joinDate: student?.joinDate ?? todayISO(),
    monthlyFee: student?.monthlyFee != null ? String(student.monthlyFee) : '',
    active: student?.active ?? true,
    notes: student?.notes ?? '',
  })
  const set = (k: keyof typeof form, v: string | boolean | number) => setForm((f) => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...form,
        batchId: form.batchId === '' ? null : Number(form.batchId),
        monthlyFee: form.monthlyFee === '' ? null : Number(form.monthlyFee),
      }
      return student ? api.updateStudent(student.id, body) : api.createStudent(body)
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['student', s.id] })
      qc.invalidateQueries({ queryKey: ['batches'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['fees'] })
      onSaved?.(s)
      onClose()
    },
  })
  const errs = save.error instanceof ApiError ? save.error.errors : {}
  const selectedBatch = batches.data?.find((b) => b.id === Number(form.batchId))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <Modal open title={student ? 'Edit student' : 'Add student'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {save.error && <ErrorBox error={save.error} />}
        <Field label="Student name" error={errs.name}>
          <Input required autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Batch">
            <Select value={form.batchId} onChange={(e) => set('batchId', e.target.value)}>
              <option value="">No batch</option>
              {batches.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          <Field label="Join date">
            <Input type="date" required value={form.joinDate} onChange={(e) => set('joinDate', e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Parent name">
            <Input value={form.parentName} onChange={(e) => set('parentName', e.target.value)} />
          </Field>
          <Field label="Parent phone" hint="Used for WhatsApp fee reminders">
            <Input type="tel" value={form.parentPhone} onChange={(e) => set('parentPhone', e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Student phone">
            <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field
            label="Personal monthly fee (₹)" error={errs.monthlyFee}
            hint={selectedBatch ? `Leave empty to use batch fee (${money(selectedBatch.monthlyFee)})` : 'Leave empty to use the batch fee'}
          >
            <Input type="number" min={0} inputMode="numeric" value={form.monthlyFee} onChange={(e) => set('monthlyFee', e.target.value)} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
        {student && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Student is active (inactive students are not charged fees)
          </label>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={save.isPending}>Save</Button>
        </div>
      </form>
    </Modal>
  )
}

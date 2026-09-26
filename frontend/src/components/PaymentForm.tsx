import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorBox, Field, Input, Modal, Select } from './ui'
import { api, ApiError } from '../lib/api'
import { monthLabel, todayISO } from '../lib/format'
import type { PaymentMode } from '../lib/types'

export default function PaymentForm({ studentId, studentName, month, suggestedAmount, onClose }:
  { studentId: number; studentName: string; month: string; suggestedAmount?: number; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    month,
    amount: suggestedAmount && suggestedAmount > 0 ? String(suggestedAmount) : '',
    paidOn: todayISO(),
    mode: 'UPI' as PaymentMode,
    note: '',
  })

  const save = useMutation({
    mutationFn: () => api.recordPayment({ ...form, studentId, amount: Number(form.amount) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] })
      qc.invalidateQueries({ queryKey: ['payments', studentId] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
  })
  const errs = save.error instanceof ApiError ? save.error.errors : {}

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate()
  }

  return (
    <Modal open title={`Record payment · ${studentName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {save.error && <ErrorBox error={save.error} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fee for month" error={errs.month} hint={form.month ? monthLabel(form.month) : undefined}>
            <Input type="month" required value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
          </Field>
          <Field label="Amount (₹)" error={errs.amount}>
            <Input type="number" min={1} step="1" required autoFocus inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Paid on">
            <Input type="date" required value={form.paidOn} onChange={(e) => setForm({ ...form, paidOn: e.target.value })} />
          </Field>
          <Field label="Mode">
            <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as PaymentMode })}>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
              <option value="BANK">Bank transfer</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
        </div>
        <Field label="Note">
          <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional, e.g. UPI ref no." />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={save.isPending}>Save payment</Button>
        </div>
      </form>
    </Modal>
  )
}

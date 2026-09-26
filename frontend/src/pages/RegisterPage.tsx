import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import AuthShell from '../components/AuthShell'
import { Button, ErrorBox, Field, Input } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function RegisterPage() {
  const { signIn } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', instituteName: '', phone: '' })
  const register = useMutation({ mutationFn: api.register, onSuccess: signIn })
  const fieldErrors = register.error instanceof ApiError ? register.error.errors : {}

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    register.mutate(form)
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to start. No card needed."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-indigo-600">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {register.error && <ErrorBox error={register.error} />}
        <Field label="Your name" error={fieldErrors.name}>
          <Input required value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Tuition / institute name" hint="Optional, shown in the app header">
          <Input value={form.instituteName} onChange={set('instituteName')} placeholder="e.g. Sharma Classes" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" error={fieldErrors.email}>
            <Input type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Phone" error={fieldErrors.phone}>
            <Input type="tel" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>
        <Field label="Password" error={fieldErrors.password} hint="At least 8 characters">
          <Input type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
        </Field>
        <Button type="submit" className="w-full" loading={register.isPending}>Create account</Button>
      </form>
    </AuthShell>
  )
}

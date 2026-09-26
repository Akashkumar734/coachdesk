import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import AuthShell from '../components/AuthShell'
import { Button, ErrorBox, Field, Input } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useMutation({ mutationFn: api.login, onSuccess: signIn })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your classes"
      footer={<>New here? <Link to="/register" className="font-medium text-indigo-600">Create a free account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        {login.error && <ErrorBox error={login.error} />}
        <Field label="Email">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full" loading={login.isPending}>Log in</Button>
      </form>
    </AuthShell>
  )
}

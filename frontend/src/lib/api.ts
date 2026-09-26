import type {
  AuthResponse, Batch, BatchInput, Dashboard, DayAttendance, MonthSummary,
  Payment, PaymentInput, Student, StudentInput, StudentMonth, Teacher,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '')
  ?? 'http://localhost:8080'

const TOKEN_KEY = 'coachdesk.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  errors: Record<string, string>
  constructor(status: number, message: string, errors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

/** Called when the server says the token is invalid or expired. */
let onUnauthorized: () => void = () => {}
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. If it was sleeping, wait 30 seconds and try again.')
  }

  if (res.status === 401 && token) {
    onUnauthorized()
  }
  if (res.status === 204) return undefined as T

  const text = await res.text()
  const data = text ? JSON.parse(text) : undefined
  if (!res.ok) {
    throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`, data?.errors ?? {})
  }
  return data as T
}

const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v))
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const api = {
  // auth
  register: (b: { name: string; email: string; password: string; instituteName?: string; phone?: string }) =>
    request<AuthResponse>('POST', '/api/auth/register', b),
  login: (b: { email: string; password: string }) => request<AuthResponse>('POST', '/api/auth/login', b),
  me: () => request<Teacher>('GET', '/api/auth/me'),

  // dashboard
  dashboard: () => request<Dashboard>('GET', '/api/dashboard'),

  // batches
  batches: () => request<Batch[]>('GET', '/api/batches'),
  createBatch: (b: BatchInput) => request<Batch>('POST', '/api/batches', b),
  updateBatch: (id: number, b: BatchInput) => request<Batch>('PUT', `/api/batches/${id}`, b),
  deleteBatch: (id: number) => request<void>('DELETE', `/api/batches/${id}`),

  // students
  students: (p: { batchId?: number; q?: string; includeInactive?: boolean } = {}) =>
    request<Student[]>('GET', `/api/students${qs(p)}`),
  student: (id: number) => request<Student>('GET', `/api/students/${id}`),
  createStudent: (b: StudentInput) => request<Student>('POST', '/api/students', b),
  updateStudent: (id: number, b: StudentInput) => request<Student>('PUT', `/api/students/${id}`, b),
  deleteStudent: (id: number) => request<void>('DELETE', `/api/students/${id}`),

  // attendance
  attendance: (batchId: number, date: string) =>
    request<DayAttendance>('GET', `/api/attendance${qs({ batchId, date })}`),
  markAttendance: (date: string, entries: { studentId: number; present: boolean }[]) =>
    request<void>('PUT', '/api/attendance', { date, entries }),
  studentAttendance: (studentId: number, month: string) =>
    request<StudentMonth>('GET', `/api/attendance/student/${studentId}${qs({ month })}`),

  // fees
  fees: (month: string, batchId?: number) => request<MonthSummary>('GET', `/api/fees${qs({ month, batchId })}`),
  recordPayment: (b: PaymentInput) => request<Payment>('POST', '/api/fees/payments', b),
  payments: (studentId: number) => request<Payment[]>('GET', `/api/fees/payments${qs({ studentId })}`),
  deletePayment: (id: number) => request<void>('DELETE', `/api/fees/payments/${id}`),
}

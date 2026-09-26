export interface Teacher {
  id: number
  name: string
  email: string
  instituteName: string | null
  phone: string | null
}

export interface AuthResponse {
  token: string
  teacher: Teacher
}

export interface Batch {
  id: number
  name: string
  subject: string | null
  timing: string | null
  monthlyFee: number
  active: boolean
  studentCount: number
}

export interface BatchInput {
  name: string
  subject?: string
  timing?: string
  monthlyFee: number
  active?: boolean
}

export interface Student {
  id: number
  name: string
  phone: string | null
  parentName: string | null
  parentPhone: string | null
  batchId: number | null
  batchName: string | null
  joinDate: string
  monthlyFee: number | null
  effectiveFee: number
  active: boolean
  notes: string | null
}

export interface StudentInput {
  name: string
  phone?: string
  parentName?: string
  parentPhone?: string
  batchId?: number | null
  joinDate?: string
  monthlyFee?: number | null
  active?: boolean
  notes?: string
}

export interface AttendanceRow {
  studentId: number
  studentName: string
  present: boolean | null
}

export interface DayAttendance {
  batchId: number
  date: string
  rows: AttendanceRow[]
}

export interface StudentMonth {
  studentId: number
  month: string
  presentDays: number
  absentDays: number
  percentage: number
  days: { date: string; present: boolean }[]
}

export type FeeStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'NO_FEE'
export type PaymentMode = 'CASH' | 'UPI' | 'BANK' | 'OTHER'

export interface FeeRow {
  studentId: number
  studentName: string
  batchId: number | null
  batchName: string | null
  parentPhone: string | null
  fee: number
  paid: number
  due: number
  status: FeeStatus
}

export interface MonthSummary {
  month: string
  expected: number
  collected: number
  pending: number
  rows: FeeRow[]
}

export interface Payment {
  id: number
  studentId: number
  month: string
  amount: number
  paidOn: string
  mode: PaymentMode
  note: string | null
}

export interface PaymentInput {
  studentId: number
  month: string
  amount: number
  paidOn?: string
  mode: PaymentMode
  note?: string
}

export interface Dashboard {
  activeStudents: number
  activeBatches: number
  month: string
  feesExpected: number
  feesCollected: number
  feesPending: number
  todayMarked: number
  todayPresent: number
  topDues: FeeRow[]
}

export interface BankInfo {
  bankName: string
  bankAccount: string
}

export interface Company {
  _id: string
  name: string
  registrationNumber: string
  banks: BankInfo[]
  contactPerson: string
  contactInfo: string
  createdAt: string
}

export interface Transaction {
  _id: string
  companyId: Company
  amount: number
  transactionDate: string
  bankName: string
  bankAccount: string
  contactInfo: string
  notes: string
  paymentStatus: 'paid' | 'unpaid'
  createdAt: string
}

export interface CompanyReportEntry {
  name: string
  total: number
  count: number
  paidTotal: number
  unpaidTotal: number
  paidCount: number
  unpaidCount: number
}

export interface ReportData {
  type: string
  startDate: string
  endDate: string
  totalAmount: number
  transactionCount: number
  paidTotal: number
  unpaidTotal: number
  paidCount: number
  unpaidCount: number
  transactions: Transaction[]
  groupedByDate: Record<string, { transactions: Transaction[], total: number }>
  groupedByCompany: CompanyReportEntry[]
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

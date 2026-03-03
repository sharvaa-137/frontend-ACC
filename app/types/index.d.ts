export interface Company {
  _id: string
  name: string
  registrationNumber: string
  bankName: string
  bankAccount: string
  contactPerson: string
  contactInfo: string
  createdAt: string
}

export interface Transaction {
  _id: string
  companyId: Company
  amount: number
  transactionDate: string
  contactInfo: string
  notes: string
  createdAt: string
}

export interface ReportData {
  type: string
  startDate: string
  endDate: string
  totalAmount: number
  transactionCount: number
  transactions: Transaction[]
  groupedByDate: Record<string, { transactions: Transaction[], total: number }>
  groupedByCompany: { name: string, total: number, count: number }[]
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

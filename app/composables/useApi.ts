import type { Company, ReportData, Transaction } from '~/types'

const getApiBase = () => useRuntimeConfig().public.apiBase as string

// Companies API
export const useCompanies = () => {
  const searchCompanies = async (query: string): Promise<Company[]> => {
    return await $fetch<Company[]>(`${getApiBase()}/companies`, {
      query: { q: query }
    })
  }

  const getAllCompanies = async (): Promise<Company[]> => {
    return await $fetch<Company[]>(`${getApiBase()}/companies`)
  }

  const createCompany = async (company: Partial<Company>): Promise<Company> => {
    return await $fetch<Company>(`${getApiBase()}/companies`, {
      method: 'POST',
      body: company
    })
  }

  const updateCompany = async (id: string, company: Partial<Company>): Promise<Company> => {
    return await $fetch<Company>(`${getApiBase()}/companies/${id}`, {
      method: 'PUT',
      body: company
    })
  }

  const deleteCompany = async (id: string): Promise<void> => {
    await $fetch(`${getApiBase()}/companies/${id}`, {
      method: 'DELETE'
    })
  }

  return { searchCompanies, getAllCompanies, createCompany, updateCompany, deleteCompany }
}

// Transactions API
export const useTransactions = () => {
  const getTransactions = async (params: { date?: string, year?: number, month?: number } = {}): Promise<Transaction[]> => {
    const query: Record<string, string> = {}
    if (params.date) query.date = params.date
    if (params.year) query.year = String(params.year)
    if (params.month) query.month = String(params.month)
    return await $fetch<Transaction[]>(`${getApiBase()}/transactions`, { params: query })
  }

  const createTransaction = async (transaction: {
    companyId: string
    amount: number
    transactionDate: string
    bankName?: string
    bankAccount?: string
    contactInfo?: string
    notes?: string
    paymentStatus?: 'paid' | 'unpaid'
  }): Promise<Transaction> => {
    return await $fetch<Transaction>(`${getApiBase()}/transactions`, {
      method: 'POST',
      body: transaction
    })
  }

  const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
    return await $fetch<Transaction>(`${getApiBase()}/transactions/${id}`, {
      method: 'PUT',
      body: transaction
    })
  }

  const deleteTransaction = async (id: string): Promise<void> => {
    await $fetch(`${getApiBase()}/transactions/${id}`, {
      method: 'DELETE'
    })
  }

  return { getTransactions, createTransaction, updateTransaction, deleteTransaction }
}

// Reports API
export const useReports = () => {
  const getReport = async (params: Record<string, string>): Promise<ReportData> => {
    return await $fetch<ReportData>(`${getApiBase()}/reports`, { params })
  }

  return { getReport }
}

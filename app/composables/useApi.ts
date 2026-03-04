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
  const getTransactions = async (date?: string): Promise<Transaction[]> => {
    const params: Record<string, string> = {}
    if (date) params.date = date
    return await $fetch<Transaction[]>(`${getApiBase()}/transactions`, { params })
  }

  const createTransaction = async (transaction: { companyId: string, amount: number, transactionDate: string, bankName?: string, bankAccount?: string, contactInfo?: string, notes?: string }): Promise<Transaction> => {
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

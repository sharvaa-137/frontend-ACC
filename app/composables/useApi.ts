import type { Company, Transaction, ReportData } from '~/types'

const getApiBase = () => useRuntimeConfig().public.apiBase as string

// Companies API
export const useCompanies = () => {
    const searchCompanies = async (query: string): Promise<Company[]> => {
        const data = await $fetch<Company[]>(`${getApiBase()}/companies`, {
            params: { q: query }
        })
        return data
    }

    const getAllCompanies = async (): Promise<Company[]> => {
        const data = await $fetch<Company[]>(`${getApiBase()}/companies`)
        return data
    }

    const createCompany = async (company: Partial<Company>): Promise<Company> => {
        const data = await $fetch<Company>(`${getApiBase()}/companies`, {
            method: 'POST',
            body: company
        })
        return data
    }

    const updateCompany = async (id: string, company: Partial<Company>): Promise<Company> => {
        const data = await $fetch<Company>(`${getApiBase()}/companies/${id}`, {
            method: 'PUT',
            body: company
        })
        return data
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
        const data = await $fetch<Transaction[]>(`${getApiBase()}/transactions`, { params })
        return data
    }

    const createTransaction = async (transaction: { companyId: string, amount: number, transactionDate: string, contactInfo?: string, notes?: string }): Promise<Transaction> => {
        const data = await $fetch<Transaction>(`${getApiBase()}/transactions`, {
            method: 'POST',
            body: transaction
        })
        return data
    }

    const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
        const data = await $fetch<Transaction>(`${getApiBase()}/transactions/${id}`, {
            method: 'PUT',
            body: transaction
        })
        return data
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
        const data = await $fetch<ReportData>(`${getApiBase()}/reports`, { params })
        return data
    }

    return { getReport }
}

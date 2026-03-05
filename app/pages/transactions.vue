<script setup lang="ts">
import type { Company, Transaction } from '~/types'

const { searchCompanies } = useCompanies()
const { getTransactions, createTransaction, updateTransaction, deleteTransaction } = useTransactions()
const toast = useToast()

// ── Month / Day selection ──
const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)
const selectedDay = ref<number | null>(now.getDate())

const years = Array.from({ length: 10 }, (_, i) => {
  const y = now.getFullYear() - i
  return { label: `${y} он`, value: y }
})

const months = [
  { label: '1-р сар', value: 1 }, { label: '2-р сар', value: 2 },
  { label: '3-р сар', value: 3 }, { label: '4-р сар', value: 4 },
  { label: '5-р сар', value: 5 }, { label: '6-р сар', value: 6 },
  { label: '7-р сар', value: 7 }, { label: '8-р сар', value: 8 },
  { label: '9-р сар', value: 9 }, { label: '10-р сар', value: 10 },
  { label: '11-р сар', value: 11 }, { label: '12-р сар', value: 12 }
]

const daysInMonth = computed(() => new Date(selectedYear.value, selectedMonth.value, 0).getDate())

const dayNames = ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя']
const getDayName = (day: number) => {
  const d = new Date(selectedYear.value, selectedMonth.value - 1, day)
  return dayNames[d.getDay()]
}

const isToday = (day: number) => {
  const t = new Date()
  return t.getFullYear() === selectedYear.value && t.getMonth() + 1 === selectedMonth.value && t.getDate() === day
}

const isWeekend = (day: number) => {
  const d = new Date(selectedYear.value, selectedMonth.value - 1, day)
  const dow = d.getDay()
  return dow === 0 || dow === 6
}

const selectedDateStr = computed(() => {
  if (!selectedDay.value) return null
  return `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(selectedDay.value).padStart(2, '0')}`
})

const displayDate = computed(() => {
  if (!selectedDay.value) return ''
  return `${selectedYear.value}.${String(selectedMonth.value).padStart(2, '0')}.${String(selectedDay.value).padStart(2, '0')}`
})

// ── Company search ──
const companySearch = ref('')
const companyResults = ref<Company[]>([])
const selectedCompany = ref<Company | null>(null)
const searchLoading = ref(false)
const showDropdown = ref(false)

// ── Transaction form ──
const amount = ref<number | null>(null)
const contactInfo = ref('')
const notes = ref('')
const paymentStatus = ref<'paid' | 'unpaid'>('unpaid')

// ── Bank selection ──
const selectedBankIndex = ref<number | null>(null)
const customBankName = ref('')
const customBankAccount = ref('')
const showBankDropdown = ref(false)
const bankMode = ref<'select' | 'custom'>('select')

const bankOptions = computed(() => {
  if (!selectedCompany.value) return []
  const opts: { label: string, bankName: string, bankAccount: string }[] = []
  opts.push({ label: 'Бэлэнээр', bankName: 'Бэлэнээр', bankAccount: '' })
  for (const b of selectedCompany.value.banks || []) {
    if (b.bankName || b.bankAccount) {
      opts.push({
        label: `${b.bankName || ''} - ${b.bankAccount || ''}`,
        bankName: b.bankName || '',
        bankAccount: b.bankAccount || ''
      })
    }
  }
  return opts
})

const selectedBankLabel = computed(() => {
  if (bankMode.value === 'custom') {
    return customBankName.value || customBankAccount.value
      ? `${customBankName.value} - ${customBankAccount.value}`
      : 'Шинэ данс оруулах'
  }
  if (selectedBankIndex.value !== null && bankOptions.value[selectedBankIndex.value]) {
    return bankOptions.value[selectedBankIndex.value]!.label
  }
  return 'Банк / Бэлэнээр сонгох'
})

// ── All transactions for the month ──
const allMonthTransactions = ref<Transaction[]>([])
const tableLoading = ref(true)

// Parse day from ISO date string without timezone issues
const getDayFromDateStr = (dateStr: string): number => {
  // transactionDate comes as "2026-03-05T00:00:00.000Z" or "2026-03-05"
  const datePart = dateStr.split('T')[0] ?? dateStr
  const dayPart = datePart.split('-')[2] ?? '1'
  return parseInt(dayPart, 10)
}

// Computed: transactions for selected day (filtered client-side for instant UX)
const transactions = computed(() => {
  if (!selectedDay.value || !selectedDateStr.value) return []
  const targetDate = selectedDateStr.value
  return allMonthTransactions.value.filter(t => {
    return t.transactionDate.split('T')[0] === targetDate
  })
})

// Per-day transaction count for dot indicators on the day strip
const dayTransactionCounts = computed(() => {
  const counts: Record<number, number> = {}
  for (const t of allMonthTransactions.value) {
    const d = getDayFromDateStr(t.transactionDate)
    counts[d] = (counts[d] || 0) + 1
  }
  return counts
})

// Per-day total amount for day strip hover info
const dayTotals = computed(() => {
  const totals: Record<number, number> = {}
  for (const t of allMonthTransactions.value) {
    const d = getDayFromDateStr(t.transactionDate)
    totals[d] = (totals[d] || 0) + t.amount
  }
  return totals
})

// Month summary stats
const monthTotalAmount = computed(() => allMonthTransactions.value.reduce((sum, t) => sum + t.amount, 0))
const monthPaidAmount = computed(() => allMonthTransactions.value.filter(t => t.paymentStatus === 'paid').reduce((sum, t) => sum + t.amount, 0))
const monthUnpaidAmount = computed(() => allMonthTransactions.value.filter(t => t.paymentStatus !== 'paid').reduce((sum, t) => sum + t.amount, 0))

const formatMoney = (value: number) => new Intl.NumberFormat('mn-MN').format(value) + '₮'
const formatMoneyShort = (value: number) => {
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'сая'
  if (value >= 1000) return (value / 1000).toFixed(0) + 'мян'
  return String(value)
}

const totalAmount = computed(() => transactions.value.reduce((sum, t) => sum + t.amount, 0))
const paidAmount = computed(() => transactions.value.filter(t => t.paymentStatus === 'paid').reduce((sum, t) => sum + t.amount, 0))
const unpaidAmount = computed(() => transactions.value.filter(t => t.paymentStatus !== 'paid').reduce((sum, t) => sum + t.amount, 0))

// ── Debounced company search ──
let searchTimeout: ReturnType<typeof setTimeout>
const closeDropdownDelayed = () => {
  window.setTimeout(() => { showDropdown.value = false }, 200)
}
const closeBankDropdownDelayed = () => {
  window.setTimeout(() => { showBankDropdown.value = false }, 200)
}
const onCompanySearch = (value: string) => {
  companySearch.value = value
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!value || value.length < 1) {
    companyResults.value = []
    showDropdown.value = false
    return
  }
  searchLoading.value = true
  searchTimeout = setTimeout(async () => {
    try {
      companyResults.value = await searchCompanies(value)
      showDropdown.value = companyResults.value.length > 0
    } catch { /* noop */ } finally {
      searchLoading.value = false
    }
  }, 300)
}

const selectCompany = (company: Company) => {
  selectedCompany.value = company
  companySearch.value = company.name
  showDropdown.value = false
  selectedBankIndex.value = null
  customBankName.value = ''
  customBankAccount.value = ''
  bankMode.value = 'select'
  if (company.banks && company.banks.length > 0) selectedBankIndex.value = 1
  if (company.contactPerson) {
    contactInfo.value = company.contactInfo
      ? `${company.contactPerson} - ${company.contactInfo}`
      : company.contactPerson
  }
}

const selectBank = (index: number) => {
  selectedBankIndex.value = index
  bankMode.value = 'select'
  showBankDropdown.value = false
}
const switchToCustomBank = () => {
  bankMode.value = 'custom'
  selectedBankIndex.value = null
  showBankDropdown.value = false
}

const clearSelection = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchLoading.value = false
  selectedCompany.value = null
  companySearch.value = ''
  companyResults.value = []
  showDropdown.value = false
  amount.value = null
  contactInfo.value = ''
  notes.value = ''
  paymentStatus.value = 'unpaid'
  selectedBankIndex.value = null
  customBankName.value = ''
  customBankAccount.value = ''
  bankMode.value = 'select'
}

// ── Edit mode ──
const editingTransaction = ref<Transaction | null>(null)
const editAmount = ref<number | null>(null)
const editNotes = ref('')
const editPaymentStatus = ref<'paid' | 'unpaid'>('unpaid')
const editContactInfo = ref('')

const editModalOpen = computed({
  get: () => !!editingTransaction.value,
  set: (val: boolean) => { if (!val) editingTransaction.value = null }
})

const startEdit = (tx: Transaction) => {
  editingTransaction.value = tx
  editAmount.value = tx.amount
  editNotes.value = tx.notes || ''
  editPaymentStatus.value = tx.paymentStatus || 'unpaid'
  editContactInfo.value = tx.contactInfo || ''
}

const cancelEdit = () => {
  editingTransaction.value = null
}

const saveEdit = async () => {
  if (!editingTransaction.value || !editAmount.value) return
  try {
    await updateTransaction(editingTransaction.value._id, {
      amount: editAmount.value,
      notes: editNotes.value || undefined,
      paymentStatus: editPaymentStatus.value,
      contactInfo: editContactInfo.value || undefined
    } as any)
    toast.add({ title: 'Амжилттай', description: 'Гүйлгээ засагдлаа', color: 'success' })
    editingTransaction.value = null
    await loadMonthTransactions()
  } catch (error: any) {
    toast.add({ title: 'Алдаа', description: error.message || 'Засахад алдаа гарлаа', color: 'error' })
  }
}

const togglePaymentStatus = async (tx: Transaction) => {
  const newStatus = tx.paymentStatus === 'paid' ? 'unpaid' : 'paid'
  try {
    await updateTransaction(tx._id, { paymentStatus: newStatus } as any)
    const idx = allMonthTransactions.value.findIndex(t => t._id === tx._id)
    if (idx !== -1) allMonthTransactions.value[idx]!.paymentStatus = newStatus
    toast.add({
      title: newStatus === 'paid' ? 'Төлсөн' : 'Төлөөгүй',
      description: 'Төлбөрийн төлөв шинэчлэгдлээ',
      color: newStatus === 'paid' ? 'success' : 'warning'
    })
  } catch {
    toast.add({ title: 'Алдаа', description: 'Төлөв өөрчлөхөд алдаа гарлаа', color: 'error' })
  }
}

// ── Submit & Delete ──
const submitTransaction = async () => {
  if (!selectedCompany.value || !amount.value || !selectedDateStr.value) {
    toast.add({ title: 'Алдаа', description: 'Компани, өдөр сонгож, мөнгөн дүн оруулна уу', color: 'error' })
    return
  }
  let txBankName = '', txBankAccount = ''
  if (bankMode.value === 'custom') {
    txBankName = customBankName.value
    txBankAccount = customBankAccount.value
  } else if (selectedBankIndex.value !== null && bankOptions.value[selectedBankIndex.value]) {
    txBankName = bankOptions.value[selectedBankIndex.value]!.bankName
    txBankAccount = bankOptions.value[selectedBankIndex.value]!.bankAccount
  }
  try {
    await createTransaction({
      companyId: selectedCompany.value._id,
      amount: amount.value,
      transactionDate: selectedDateStr.value,
      bankName: txBankName || undefined,
      bankAccount: txBankAccount || undefined,
      contactInfo: contactInfo.value || undefined,
      notes: notes.value || undefined,
      paymentStatus: paymentStatus.value
    })
    toast.add({ title: 'Амжилттай', description: 'Гүйлгээ бүртгэгдлээ', color: 'success' })
    clearSelection()
    await loadMonthTransactions()
  } catch (error: any) {
    toast.add({ title: 'Алдаа', description: error.message || 'Бүртгэхэд алдаа гарлаа', color: 'error' })
  }
}

const removeTransaction = async (id: string) => {
  try {
    await deleteTransaction(id)
    toast.add({ title: 'Устгагдлаа', description: 'Гүйлгээ устгагдлаа', color: 'success' })
    allMonthTransactions.value = allMonthTransactions.value.filter(t => t._id !== id)
  } catch {
    toast.add({ title: 'Алдаа', description: 'Устгахад алдаа гарлаа', color: 'error' })
  }
}

// ── Data loading ──
const loadMonthTransactions = async () => {
  tableLoading.value = true
  // Clear old data immediately so stale data from a different month never persists
  allMonthTransactions.value = []
  try {
    allMonthTransactions.value = await getTransactions({
      year: selectedYear.value,
      month: selectedMonth.value
    })
  } catch {
    allMonthTransactions.value = []
  } finally {
    tableLoading.value = false
  }
}

// Reload when month/year changes
watch([selectedYear, selectedMonth], () => {
  if (selectedDay.value && selectedDay.value > daysInMonth.value) {
    selectedDay.value = daysInMonth.value
  }
  loadMonthTransactions()
})

onMounted(() => {
  loadMonthTransactions()
})
</script>

<template>
  <UDashboardPanel id="transactions">
    <template #header>
      <UDashboardNavbar title="Гүйлгээ бүртгэх">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UFieldGroup>
              <UButton
                icon="i-lucide-chevron-left"
                color="primary"
                variant="outline"
                size="sm"
                @click="selectedMonth > 1 ? selectedMonth-- : (selectedYear--, selectedMonth = 12)"
              />
              <UButton
                color="primary"
                variant="subtle"
                size="sm"
                class="min-w-30 justify-center font-bold pointer-events-none"
              >
                {{ selectedYear }}.{{ String(selectedMonth).padStart(2, '0') }}
              </UButton>
              <UButton
                icon="i-lucide-chevron-right"
                color="primary"
                variant="outline"
                size="sm"
                @click="selectedMonth < 12 ? selectedMonth++ : (selectedYear++, selectedMonth = 1)"
              />
            </UFieldGroup>
            <USelect
              v-model.number="selectedYear"
              :items="years"
              variant="outline"
              size="sm"
              class="w-24"
            />
            <USelect
              v-model.number="selectedMonth"
              :items="months"
              variant="outline"
              size="sm"
              class="w-28"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full">

        <!-- Month Summary Bar -->
        <div class="border-b border-default bg-elevated/20 px-5 py-2.5 flex items-center justify-between gap-4 text-sm">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5 text-muted">
              <UIcon name="i-lucide-receipt" class="size-4" />
              <strong class="text-default">{{ allMonthTransactions.length }}</strong> гүйлгээ
            </span>
            <span class="hidden sm:flex items-center gap-1.5 text-muted">
              <UIcon name="i-lucide-banknote" class="size-4" />
              Нийт: <strong class="text-primary">{{ formatMoney(monthTotalAmount) }}</strong>
            </span>
          </div>
          <div class="flex items-center gap-3">
            <UBadge color="success" variant="subtle" size="sm" class="gap-1">
              <UIcon name="i-lucide-circle-check" class="size-3" />
              Төлсөн: {{ formatMoney(monthPaidAmount) }}
            </UBadge>
            <UBadge color="warning" variant="subtle" size="sm" class="gap-1">
              <UIcon name="i-lucide-clock" class="size-3" />
              Төлөөгүй: {{ formatMoney(monthUnpaidAmount) }}
            </UBadge>
          </div>
        </div>

        <!-- Day Strip -->
        <div class="border-b border-default bg-elevated/10 px-2 py-1.5">
          <div class="flex">
            <button
              v-for="day in daysInMonth"
              :key="day"
              class="flex-1 flex flex-col items-center py-1 rounded-lg transition-all duration-150 relative cursor-pointer"
              :class="[
                selectedDay === day
                  ? 'bg-primary text-white shadow-sm'
                  : isToday(day)
                    ? 'bg-primary/10 text-primary'
                    : isWeekend(day)
                      ? 'text-red-400 hover:bg-red-500/5'
                      : 'text-muted hover:bg-elevated/60 hover:text-default'
              ]"
              @click="selectedDay = selectedDay === day ? null : day"
            >
              <span class="text-[8px] leading-none uppercase" :class="selectedDay === day ? 'opacity-70' : 'opacity-40'">{{ getDayName(day) }}</span>
              <span class="text-[13px] font-bold leading-snug">{{ day }}</span>
              <!-- Activity dot -->
              <span
                v-if="dayTransactionCounts[day]"
                class="size-1.5 rounded-full mt-px"
                :class="selectedDay === day ? 'bg-white/80' : 'bg-primary'"
              />
            </button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">

          <!-- No day selected state -->
          <div v-if="!selectedDay" class="flex flex-col items-center justify-center py-24 text-muted">
            <div class="rounded-3xl bg-elevated/50 p-8 mb-6">
              <UIcon name="i-lucide-calendar-days" class="size-16 opacity-30" />
            </div>
            <p class="text-xl font-semibold text-default mb-1">Өдөр сонгоно уу</p>
            <p class="text-sm max-w-xs text-center">Дээрх өдрүүдээс сонгон тухайн өдрийн гүйлгээг харах, нэмэх, засах боломжтой</p>
          </div>

          <template v-else>
            <!-- Add Transaction Card -->
            <div class="rounded-2xl border border-default bg-default/50 shadow-sm overflow-hidden">
              <div class="px-6 py-4 border-b border-default bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
                <h3 class="text-base font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide-plus-circle" class="size-5 text-primary" />
                  Шинэ гүйлгээ
                </h3>
                <UBadge color="primary" variant="subtle" size="sm">{{ displayDate }}</UBadge>
              </div>

              <div class="p-6">
                <div class="flex flex-col gap-5">

                  <!-- Step 1: Company Search -->
                  <div class="flex flex-col gap-2.5">
                    <div class="flex items-center gap-2">
                      <span class="flex items-center justify-center size-6 rounded-full bg-primary text-white text-[10px] font-bold shrink-0">1</span>
                      <span class="text-sm font-semibold text-default">Компани сонгох</span>
                    </div>
                    <div class="relative">
                      <UInput
                        :model-value="companySearch"
                        placeholder="Нэр, регистрийн дугаар, данс, холбоо барих хүнээр хайх..."
                        icon="i-lucide-search"
                        size="xl"
                        class="w-full max-w-xl"
                        :loading="searchLoading"
                        @update:model-value="onCompanySearch"
                        @focus="showDropdown = companyResults.length > 0"
                        @blur="closeDropdownDelayed"
                      />
                      <div
                        v-if="showDropdown && companyResults.length > 0"
                        class="absolute z-50 top-full mt-1 w-full rounded-xl border border-default bg-default shadow-2xl max-h-72 overflow-y-auto"
                      >
                        <button
                          v-for="company in companyResults"
                          :key="company._id"
                          class="w-full text-left px-4 py-3 hover:bg-elevated/50 transition-colors border-b border-default last:border-b-0"
                          @mousedown.prevent="selectCompany(company)"
                        >
                          <div class="font-semibold text-sm">{{ company.name }}</div>
                          <div class="text-xs text-muted flex flex-wrap gap-3 mt-0.5">
                            <span v-if="company.registrationNumber" class="flex items-center gap-1">
                              <UIcon name="i-lucide-hash" class="size-3" /> {{ company.registrationNumber }}
                            </span>
                            <span v-if="company.banks && company.banks.length > 0" class="flex items-center gap-1">
                              <UIcon name="i-lucide-landmark" class="size-3" />
                              <span v-for="(b, bi) in company.banks" :key="bi">
                                {{ b.bankName }} - {{ b.bankAccount }}<span v-if="bi < company.banks.length - 1"> | </span>
                              </span>
                            </span>
                            <span v-if="company.contactPerson" class="flex items-center gap-1">
                              <UIcon name="i-lucide-user" class="size-3" /> {{ company.contactPerson }}
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    <!-- Selected Company Card -->
                    <div v-if="selectedCompany" class="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                      <div class="flex items-start justify-between gap-3">
                        <div class="space-y-1 min-w-0">
                          <h4 class="font-bold text-sm text-primary flex items-center gap-1.5">
                            <UIcon name="i-lucide-building-2" class="size-4 shrink-0" />
                            {{ selectedCompany.name }}
                          </h4>
                          <div class="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-muted">
                            <span v-if="selectedCompany.registrationNumber">
                              Регистр: <strong class="text-default">{{ selectedCompany.registrationNumber }}</strong>
                            </span>
                            <span v-if="selectedCompany.banks && selectedCompany.banks.length > 0">
                              Банк:
                              <strong v-for="(b, bi) in selectedCompany.banks" :key="bi" class="text-default">
                                {{ b.bankName }} - {{ b.bankAccount }}<span v-if="bi < selectedCompany.banks.length - 1" class="text-muted"> | </span>
                              </strong>
                            </span>
                            <span v-if="selectedCompany.contactPerson">
                              ХТ: <strong class="text-default">{{ selectedCompany.contactPerson }}</strong>
                            </span>
                          </div>
                        </div>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" class="shrink-0" @click="clearSelection" />
                      </div>
                    </div>
                  </div>

                  <USeparator />

                  <!-- Step 2: Transaction Details -->
                  <div class="flex flex-col gap-2.5">
                    <div class="flex items-center gap-2">
                      <span class="flex items-center justify-center size-6 rounded-full bg-primary text-white text-[10px] font-bold shrink-0">2</span>
                      <span class="text-sm font-semibold text-default">Гүйлгээний мэдээлэл</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-muted">
                          Мөнгөн дүн <span class="text-error">*</span>
                        </label>
                        <UInput v-model.number="amount" type="number" placeholder="0" size="lg" icon="i-lucide-banknote" />
                      </div>

                      <!-- Bank Selector -->
                      <div class="relative flex flex-col gap-1">
                        <label class="text-xs font-medium text-muted">Банк / Данс</label>
                        <button
                          type="button"
                          class="w-full text-left px-3 py-2.5 rounded-lg border border-default bg-default/50 text-sm flex items-center justify-between gap-2 hover:bg-elevated/30 transition-colors"
                          @click="showBankDropdown = !showBankDropdown"
                          @blur="closeBankDropdownDelayed"
                        >
                          <span class="flex items-center gap-1.5 truncate text-xs">
                            <UIcon name="i-lucide-landmark" class="size-3.5 text-muted shrink-0" />
                            <span :class="selectedBankIndex !== null || bankMode === 'custom' ? '' : 'text-muted'">{{ selectedBankLabel }}</span>
                          </span>
                          <UIcon name="i-lucide-chevron-down" class="size-3.5 text-muted shrink-0" />
                        </button>
                        <div
                          v-if="showBankDropdown && bankOptions.length > 0"
                          class="absolute z-50 top-full mt-1 w-full rounded-lg border border-default bg-default shadow-2xl max-h-48 overflow-y-auto"
                        >
                          <button
                            v-for="(opt, idx) in bankOptions"
                            :key="idx"
                            class="w-full text-left px-4 py-2.5 hover:bg-elevated/50 transition-colors border-b border-default last:border-b-0 text-xs flex items-center gap-2"
                            @mousedown.prevent="selectBank(idx)"
                          >
                            <UIcon :name="idx === 0 ? 'i-lucide-banknote' : 'i-lucide-landmark'" class="size-3.5 text-primary shrink-0" />
                            {{ opt.label }}
                          </button>
                          <button
                            class="w-full text-left px-4 py-2.5 hover:bg-elevated/50 transition-colors text-xs flex items-center gap-2 text-primary"
                            @mousedown.prevent="switchToCustomBank"
                          >
                            <UIcon name="i-lucide-plus" class="size-3.5 shrink-0" />
                            Шинэ данс оруулах
                          </button>
                        </div>
                      </div>

                      <!-- Custom Bank Fields -->
                      <template v-if="bankMode === 'custom'">
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-medium text-muted">Банкны нэр</label>
                          <UInput v-model="customBankName" placeholder="Жнь: Хаан банк" size="lg" icon="i-lucide-landmark" />
                        </div>
                        <div class="flex flex-col gap-1">
                          <label class="text-xs font-medium text-muted">Дансны дугаар</label>
                          <UInput v-model="customBankAccount" placeholder="Дансны дугаар" size="lg" icon="i-lucide-hash" />
                        </div>
                      </template>

                      <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-muted">ХТ (Холбоо барих)</label>
                        <UInput v-model="contactInfo" placeholder="Нэр - утасны дугаар" icon="i-lucide-contact" size="lg" />
                      </div>

                      <div class="flex flex-col gap-1">
                        <label class="text-xs font-medium text-muted">
                          Тэмдэглэл <span class="text-[10px] font-normal opacity-50">(заавал биш)</span>
                        </label>
                        <UInput v-model="notes" placeholder="Нэмэлт тэмдэглэл..." icon="i-lucide-file-text" size="lg" />
                      </div>
                    </div>
                  </div>

                  <USeparator />

                  <!-- Step 3: Payment Status -->
                  <div class="flex flex-col gap-2.5">
                    <div class="flex items-center gap-2">
                      <span class="flex items-center justify-center size-6 rounded-full bg-primary text-white text-[10px] font-bold shrink-0">3</span>
                      <span class="text-sm font-semibold text-default">Төлбөрийн төлөв</span>
                    </div>
                    <div class="flex gap-3">
                      <button
                        type="button"
                        class="flex-1 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        :class="paymentStatus === 'paid'
                          ? 'border-green-500 bg-green-500/10 text-green-600 shadow-sm shadow-green-500/10'
                          : 'border-default hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950/20 text-muted'"
                        @click="paymentStatus = 'paid'"
                      >
                        <UIcon name="i-lucide-circle-check" class="size-5" />
                        Төлсөн
                      </button>
                      <button
                        type="button"
                        class="flex-1 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        :class="paymentStatus === 'unpaid'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-600 shadow-sm shadow-amber-500/10'
                          : 'border-default hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-muted'"
                        @click="paymentStatus = 'unpaid'"
                      >
                        <UIcon name="i-lucide-clock" class="size-5" />
                        Төлөөгүй
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit Bar -->
              <div class="px-6 py-3 border-t border-default bg-elevated/20 flex items-center justify-between gap-4">
                <p class="text-xs text-muted">
                  <span v-if="!selectedCompany" class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-info" class="size-3.5" />
                    Компани сонгоод мөнгөн дүнг оруулна уу
                  </span>
                  <span v-else-if="!amount" class="flex items-center gap-1.5">
                    <UIcon name="i-lucide-info" class="size-3.5" />
                    Мөнгөн дүнг оруулна уу
                  </span>
                  <span v-else class="flex items-center gap-1.5 text-success">
                    <UIcon name="i-lucide-circle-check" class="size-3.5" />
                    Бүртгэхэд бэлэн
                  </span>
                </p>
                <UButton
                  label="Гүйлгээ бүртгэх"
                  icon="i-lucide-check"
                  size="lg"
                  class="px-6"
                  :disabled="!selectedCompany || !amount"
                  @click="submitTransaction"
                />
              </div>
            </div>

            <!-- Transactions Table -->
            <div class="rounded-2xl border border-default bg-default/50 overflow-hidden shadow-sm">
              <div class="px-5 py-3.5 border-b border-default flex items-center justify-between">
                <h3 class="text-base font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide-list" class="size-4 text-muted" />
                  {{ displayDate }} гүйлгээнүүд
                </h3>
                <div class="flex items-center gap-2">
                  <UBadge color="neutral" variant="subtle" size="xs">{{ transactions.length }} гүйлгээ</UBadge>
                  <UBadge v-if="transactions.length > 0" color="success" variant="subtle" size="xs" class="gap-0.5">
                    <UIcon name="i-lucide-circle-check" class="size-2.5" />
                    {{ formatMoney(paidAmount) }}
                  </UBadge>
                  <UBadge v-if="transactions.length > 0" color="warning" variant="subtle" size="xs" class="gap-0.5">
                    <UIcon name="i-lucide-clock" class="size-2.5" />
                    {{ formatMoney(unpaidAmount) }}
                  </UBadge>
                </div>
              </div>

              <div v-if="tableLoading" class="flex items-center justify-center py-16">
                <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
              </div>

              <div v-else-if="transactions.length === 0" class="py-14 text-center text-muted">
                <UIcon name="i-lucide-inbox" class="size-12 mb-2 mx-auto opacity-30" />
                <p class="text-sm font-medium">Энэ өдөр гүйлгээ бүртгэгдээгүй байна</p>
                <p class="text-xs mt-0.5 opacity-70">Дээрх маягтыг ашиглан шинэ гүйлгээ нэмнэ үү</p>
              </div>

              <UTable
                v-else
                :data="transactions"
                :columns="[
                  { accessorKey: 'index', header: '№' },
                  { accessorFn: (row: any) => row.companyId?.name || '-', header: 'Хүлээн авагч', id: 'companyName' },
                  { accessorFn: (row: any) => row.companyId?.registrationNumber || '-', header: 'Регистр', id: 'regNumber' },
                  { accessorFn: (row: any) => row.bankName ? (row.bankAccount ? `${row.bankName} - ${row.bankAccount}` : row.bankName) : '-', header: 'Банк, данс', id: 'bankInfo' },
                  { accessorKey: 'amount', header: 'Мөнгөн дүн' },
                  { accessorFn: (row: any) => row.contactInfo || (row.companyId?.contactPerson ? `${row.companyId.contactPerson}${row.companyId.contactInfo ? ' - ' + row.companyId.contactInfo : ''}` : '-'), header: 'ХТ', id: 'contact' },
                  { accessorKey: 'paymentStatus', header: 'Төлөв' },
                  { accessorKey: 'actions', header: '' }
                ]"
              >
                <template #index-cell="{ row }">
                  {{ transactions.indexOf(row.original) + 1 }}
                </template>
                <template #amount-cell="{ row }">
                  <span class="font-bold text-primary">{{ formatMoney(row.original.amount) }}</span>
                </template>
                <template #paymentStatus-cell="{ row }">
                  <button
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 cursor-pointer"
                    :class="row.original.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'"
                    @click="togglePaymentStatus(row.original)"
                  >
                    <UIcon :name="row.original.paymentStatus === 'paid' ? 'i-lucide-circle-check' : 'i-lucide-clock'" class="size-3" />
                    {{ row.original.paymentStatus === 'paid' ? 'Төлсөн' : 'Төлөөгүй' }}
                  </button>
                </template>
                <template #actions-cell="{ row }">
                  <div class="flex items-center gap-0.5">
                    <UButton
                      icon="i-lucide-pencil"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      @click="startEdit(row.original)"
                    />
                    <UButton
                      icon="i-lucide-trash-2"
                      color="error"
                      variant="ghost"
                      size="xs"
                      @click="removeTransaction(row.original._id)"
                    />
                  </div>
                </template>
              </UTable>

              <!-- Total -->
              <div v-if="transactions.length > 0" class="px-5 py-3 border-t-2 border-primary/20 flex justify-between items-center bg-primary/5">
                <span class="font-semibold text-sm">Өдрийн нийт дүн</span>
                <span class="text-xl font-bold text-primary">{{ formatMoney(totalAmount) }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Edit Dialog -->
      <UModal v-model:open="editModalOpen">
        <template #content>
          <div v-if="editingTransaction" class="p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Гүйлгээ засах</h3>
              <UBadge color="primary" variant="subtle" size="xs">{{ editingTransaction.companyId?.name }}</UBadge>
            </div>

            <div class="space-y-3">
              <div>
                <label class="text-xs font-medium text-muted mb-1 block">Мөнгөн дүн</label>
                <UInput v-model.number="editAmount" type="number" placeholder="0" size="lg" icon="i-lucide-banknote" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs font-medium text-muted mb-1 block">ХТ</label>
                  <UInput v-model="editContactInfo" placeholder="Холбоо барих" icon="i-lucide-contact" />
                </div>
                <div>
                  <label class="text-xs font-medium text-muted mb-1 block">Тэмдэглэл</label>
                  <UInput v-model="editNotes" placeholder="Тэмдэглэл..." icon="i-lucide-file-text" />
                </div>
              </div>

              <div>
                <label class="text-xs font-medium text-muted mb-1.5 block">Төлбөрийн төлөв</label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="flex-1 px-3 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
                    :class="editPaymentStatus === 'paid'
                      ? 'border-green-500 bg-green-500/10 text-green-600'
                      : 'border-default hover:bg-elevated/30 text-muted'"
                    @click="editPaymentStatus = 'paid'"
                  >
                    <UIcon name="i-lucide-circle-check" class="size-4" />
                    Төлсөн
                  </button>
                  <button
                    type="button"
                    class="flex-1 px-3 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
                    :class="editPaymentStatus === 'unpaid'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                      : 'border-default hover:bg-elevated/30 text-muted'"
                    @click="editPaymentStatus = 'unpaid'"
                  >
                    <UIcon name="i-lucide-clock" class="size-4" />
                    Төлөөгүй
                  </button>
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-1">
              <UButton label="Болих" color="neutral" variant="outline" class="flex-1" @click="cancelEdit" />
              <UButton label="Хадгалах" icon="i-lucide-check" class="flex-1" :disabled="!editAmount" @click="saveEdit" />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

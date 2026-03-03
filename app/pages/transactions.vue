<script setup lang="ts">
import type { Company, Transaction } from '~/types'
import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date'

const { searchCompanies } = useCompanies()
const { getTransactions, createTransaction, deleteTransaction } = useTransactions()
const toast = useToast()

// Date selection
const now = new Date()
const calendarDate = ref(new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate()))
const calendarOpen = ref(false)

const selectedDate = computed(() => {
  const d = calendarDate.value
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
})

const displayDate = computed(() => {
  const d = calendarDate.value
  return `${d.year}.${String(d.month).padStart(2, '0')}.${String(d.day).padStart(2, '0')}`
})

// Company search
const companySearch = ref('')
const companyResults = ref<Company[]>([])
const selectedCompany = ref<Company | null>(null)
const searchLoading = ref(false)
const showDropdown = ref(false)

// Transaction form
const amount = ref<number | null>(null)
const contactInfo = ref('')
const notes = ref('')

// Contact info suggestions from selected company
const contactSuggestions = ref<string[]>([])
const showContactDropdown = ref(false)
const contactSearch = ref('')

// Transactions list
const transactions = ref<Transaction[]>([])
const tableLoading = ref(true)

const closeDropdownDelayed = () => {
  globalThis.setTimeout(() => { showDropdown.value = false }, 200)
}
const closeContactDropdownDelayed = () => {
  globalThis.setTimeout(() => { showContactDropdown.value = false }, 200)
}

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('mn-MN').format(value) + '₮'
}

const totalAmount = computed(() => {
  return transactions.value.reduce((sum, t) => sum + t.amount, 0)
})

// Filter contact suggestions
const filteredContactSuggestions = computed(() => {
  if (!contactSearch.value) return contactSuggestions.value
  const q = contactSearch.value.toLowerCase()
  return contactSuggestions.value.filter(s => s.toLowerCase().includes(q))
})

// Debounced company search
let searchTimeout: ReturnType<typeof setTimeout>
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
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      searchLoading.value = false
    }
  }, 300)
}

const selectCompany = (company: Company) => {
  selectedCompany.value = company
  companySearch.value = company.name
  showDropdown.value = false

  // Build contact suggestions from company data
  const suggestions: string[] = []
  if (company.contactPerson) {
    const base = company.contactPerson
    if (company.contactInfo) {
      suggestions.push(`${base} - ${company.contactInfo}`)
    }
    suggestions.push(base)
  }
  if (company.contactInfo && !suggestions.some(s => s === company.contactInfo)) {
    suggestions.push(company.contactInfo)
  }
  contactSuggestions.value = suggestions

  // Auto-fill contactInfo with company's default
  if (company.contactPerson) {
    contactInfo.value = company.contactInfo
      ? `${company.contactPerson} - ${company.contactInfo}`
      : company.contactPerson
  }
}

const selectContactSuggestion = (suggestion: string) => {
  contactInfo.value = suggestion
  showContactDropdown.value = false
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
  contactSuggestions.value = []
  notes.value = ''
}

const submitTransaction = async () => {
  if (!selectedCompany.value || !amount.value) {
    toast.add({
      title: 'Алдаа',
      description: 'Компани сонгож, мөнгөн дүн оруулна уу',
      color: 'error'
    })
    return
  }

  try {
    await createTransaction({
      companyId: selectedCompany.value._id,
      amount: amount.value,
      transactionDate: selectedDate.value,
      contactInfo: contactInfo.value || undefined,
      notes: notes.value || undefined
    })

    toast.add({
      title: 'Амжилттай',
      description: 'Гүйлгээ амжилттай бүртгэгдлээ',
      color: 'success'
    })

    clearSelection()
    await loadTransactions()
  } catch (error: any) {
    toast.add({
      title: 'Алдаа',
      description: error.message || 'Гүйлгээ бүртгэхэд алдаа гарлаа',
      color: 'error'
    })
  }
}

const removeTransaction = async (id: string) => {
  try {
    await deleteTransaction(id)
    toast.add({
      title: 'Устгагдлаа',
      description: 'Гүйлгээ амжилттай устгагдлаа',
      color: 'success'
    })
    await loadTransactions()
  } catch (error: any) {
    toast.add({
      title: 'Алдаа',
      description: 'Устгахад алдаа гарлаа',
      color: 'error'
    })
  }
}

const loadTransactions = async () => {
  tableLoading.value = true
  try {
    transactions.value = await getTransactions(selectedDate.value)
  } catch (error) {
    console.error('Failed to load transactions:', error)
  } finally {
    tableLoading.value = false
  }
}

watch(selectedDate, () => {
  loadTransactions()
})

onMounted(() => {
  loadTransactions()
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
          <UPopover v-model:open="calendarOpen">
            <UButton
              icon="i-lucide-calendar"
              :label="displayDate"
              color="neutral"
              variant="outline"
              size="md"
            />
            <template #content>
              <UCalendar
                v-model="calendarDate"
                @update:model-value="calendarOpen = false"
              />
            </template>
          </UPopover>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-8">
        <div class="rounded-2xl border border-default bg-default/50 shadow-sm overflow-hidden">

          <!-- Form Header -->
          <div class="px-8 py-5 border-b border-default bg-elevated/30">
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-plus-circle" class="size-5 text-primary" />
              Шинэ гүйлгээ нэмэх
            </h3>
          </div>

          <div class="p-8">
            <div class="flex flex-col gap-6">

              <!-- Step 1: Company Search -->
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2">
                  <span class="flex items-center justify-center size-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">1</span>
                  <span class="text-sm font-semibold text-default">Компани сонгох</span>
                </div>
                <div class="relative">
                  <UInput
                    :model-value="companySearch"
                    placeholder="Нэр, регистрийн дугаар, данс, холбоо барих хүнээр хайх..."
                    icon="i-lucide-search"
                    size="xl"
                    :loading="searchLoading"
                    @update:model-value="onCompanySearch"
                    @focus="showDropdown = companyResults.length > 0"
                    @blur="setTimeout(() => showDropdown = false, 200)"
                  />
                  <div
                    v-if="showDropdown && companyResults.length > 0"
                    class="absolute z-50 top-full mt-1 w-full rounded-xl border border-default bg-default shadow-2xl max-h-72 overflow-y-auto"
                  >
                    <button
                      v-for="company in companyResults"
                      :key="company._id"
                      class="w-full text-left px-5 py-4 hover:bg-elevated/50 transition-colors border-b border-default last:border-b-0"
                      @mousedown.prevent="selectCompany(company)"
                    >
                      <div class="font-semibold text-base">{{ company.name }}</div>
                      <div class="text-sm text-muted flex flex-wrap gap-4 mt-1">
                        <span v-if="company.registrationNumber" class="flex items-center gap-1">
                      <UIcon name="i-lucide-hash" class="size-3" /> {{ company.registrationNumber }}
                        </span>
                        <span v-if="company.bankAccount" class="flex items-center gap-1">
                      <UIcon name="i-lucide-landmark" class="size-3" /> {{ company.bankName }} - {{ company.bankAccount }}
                    </span>
                        <span v-if="company.contactPerson" class="flex items-center gap-1">
                      <UIcon name="i-lucide-user" class="size-3" /> {{ company.contactPerson }}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Selected Company Card -->
                <div v-if="selectedCompany" class="rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-4">
                  <div class="flex items-start justify-between gap-4">
                    <div class="space-y-2 min-w-0">
                      <h4 class="font-bold text-primary flex items-center gap-2">
                        <UIcon name="i-lucide-building-2" class="size-4 shrink-0" />
                        {{ selectedCompany.name }}
                      </h4>
                      <div class="flex flex-wrap gap-x-8 gap-y-1 text-sm">
                        <div v-if="selectedCompany.registrationNumber">
                          <span class="text-muted">Регистр:</span>
                          <span class="font-semibold ml-1">{{ selectedCompany.registrationNumber }}</span>
                        </div>
                        <div v-if="selectedCompany.bankAccount">
                          <span class="text-muted">Банк:</span>
                          <span class="font-semibold ml-1">{{ selectedCompany.bankName }} - {{ selectedCompany.bankAccount }}</span>
                        </div>
                        <div v-if="selectedCompany.contactPerson">
                          <span class="text-muted">ХТ:</span>
                          <span class="font-semibold ml-1">{{ selectedCompany.contactPerson }}</span>
                        </div>
                      </div>
                    </div>
                    <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="sm" class="shrink-0" @click="clearSelection" />
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="border-t border-dashed border-default" />

              <!-- Step 2: Transaction Details -->
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2">
                  <span class="flex items-center justify-center size-6 rounded-full bg-primary text-white text-xs font-bold shrink-0">2</span>
                  <span class="text-sm font-semibold text-default">Гүйлгээний мэдээлэл</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <!-- Amount -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-muted">
                      Мөнгөн дүн <span class="text-error">*</span>
                    </label>
                    <UInput
                      v-model.number="amount"
                      type="number"
                      placeholder="0"
                      size="xl"
                      icon="i-lucide-banknote"
                    />
                  </div>

                  <!-- Contact Info -->
                  <div class="relative flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-muted">ХТ (Холбоо барих)</label>
                    <UInput
                      v-model="contactInfo"
                      placeholder="Нэр - утасны дугаар"
                      icon="i-lucide-contact"
                      size="xl"
                      @focus="showContactDropdown = contactSuggestions.length > 0"
                      @blur="setTimeout(() => showContactDropdown = false, 200)"
                      @input="contactSearch = ($event.target as HTMLInputElement).value"
                    />
                    <div
                      v-if="showContactDropdown && filteredContactSuggestions.length > 0"
                      class="absolute z-50 top-full mt-1 w-full rounded-xl border border-default bg-default shadow-2xl max-h-52 overflow-y-auto"
                    >
                      <div class="px-4 py-2 text-xs font-semibold text-muted border-b border-default bg-elevated/30">
                        Компанийн мэдээллээс сонгох
                      </div>
                      <button
                        v-for="(suggestion, idx) in filteredContactSuggestions"
                        :key="idx"
                        class="w-full text-left px-5 py-3 hover:bg-elevated/50 transition-colors border-b border-default last:border-b-0 text-sm"
                        @mousedown.prevent="selectContactSuggestion(suggestion)"
                      >
                        <UIcon name="i-lucide-user-check" class="size-4 inline mr-2 text-primary" />
                        {{ suggestion }}
                      </button>
                    </div>
                  </div>

                  <!-- Notes -->
                  <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-medium text-muted">
                      Тэмдэглэл <span class="text-xs font-normal opacity-60">(заавал биш)</span>
                    </label>
                    <UInput
                      v-model="notes"
                      placeholder="Нэмэлт тэмдэглэл..."
                      icon="i-lucide-file-text"
                      size="xl"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Submit Bar -->
          <div class="px-8 py-5 border-t border-default bg-elevated/20 flex items-center justify-between gap-4">
            <p class="text-sm text-muted">
          <span v-if="!selectedCompany" class="flex items-center gap-1.5">
            <UIcon name="i-lucide-info" class="size-4" />
            Компани сонгоод мөнгөн дүнг оруулна уу
          </span>
              <span v-else-if="!amount" class="flex items-center gap-1.5">
            <UIcon name="i-lucide-info" class="size-4" />
            Мөнгөн дүнг оруулна уу
          </span>
              <span v-else class="flex items-center gap-1.5 text-success">
            <UIcon name="i-lucide-circle-check" class="size-4" />
            Бүртгэхэд бэлэн
          </span>
            </p>
            <UButton
              label="Гүйлгээ бүртгэх"
              icon="i-lucide-check"
              size="xl"
              class="px-8"
              :disabled="!selectedCompany || !amount"
              @click="submitTransaction"
            />
          </div>

        </div>

        <!-- Transactions Table -->
        <div class="rounded-2xl border border-default bg-default/50 overflow-hidden shadow-sm">
          <div class="px-6 py-5 border-b border-default flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ selectedDate }} өдрийн гүйлгээнүүд
            </h3>
            <span class="text-sm text-muted bg-elevated/50 px-3 py-1 rounded-full">{{ transactions.length }} гүйлгээ</span>
          </div>

          <div v-if="tableLoading" class="flex items-center justify-center py-16">
            <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
          </div>

          <div v-else-if="transactions.length === 0" class="py-16 text-center text-muted">
            <UIcon name="i-lucide-inbox" class="size-14 mb-3 mx-auto opacity-40" />
            <p class="text-lg">Энэ өдөр гүйлгээ бүртгэгдээгүй байна</p>
            <p class="text-sm mt-1">Дээрх маягтыг ашиглан шинэ гүйлгээ нэмнэ үү</p>
          </div>

          <UTable
            v-else
            :data="transactions"
            :columns="[
          { accessorKey: 'index', header: '№' },
          { accessorFn: (row: any) => row.companyId?.name || '-', header: 'Хүлээн авагч', id: 'companyName' },
          { accessorFn: (row: any) => row.companyId?.registrationNumber || '-', header: 'Регистрийн дугаар', id: 'regNumber' },
          { accessorFn: (row: any) => row.companyId?.bankName && row.companyId?.bankAccount ? `${row.companyId.bankName} - ${row.companyId.bankAccount}` : '-', header: 'Банкны нэр болон данс', id: 'bankInfo' },
          { accessorKey: 'amount', header: 'Мөнгөн дүн' },
          { accessorFn: (row: any) => row.contactInfo || (row.companyId?.contactPerson ? `${row.companyId.contactPerson}${row.companyId.contactInfo ? ' - ' + row.companyId.contactInfo : ''}` : '-'), header: 'ХТ', id: 'contact' },
          { accessorKey: 'actions', header: '' }
        ]"
          >
            <template #index-cell="{ row }">
              {{ transactions.indexOf(row.original) + 1 }}
            </template>
            <template #amount-cell="{ row }">
              <span class="font-bold text-primary text-base">{{ formatMoney(row.original.amount) }}</span>
            </template>
            <template #actions-cell="{ row }">
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                @click="removeTransaction(row.original._id)"
              />
            </template>
          </UTable>

          <!-- Total -->
          <div v-if="transactions.length > 0" class="px-6 py-4 border-t-2 border-primary/20 flex justify-between items-center bg-primary/5">
        <span class="font-semibold text-base">
          {{ selectedDate }}-ны өдрийн бараа шилжүүлгийн зарлагын нийт дүн
        </span>
            <span class="text-2xl font-bold text-primary">{{ formatMoney(totalAmount) }}</span>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

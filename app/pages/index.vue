<script setup lang="ts">
import type { Company, Transaction } from '~/types'

const { getAllCompanies } = useCompanies()
const { getTransactions } = useTransactions()

const todayStr = new Date().toISOString().split('T')[0]

const stats = ref({
  todayTotal: 0,
  todayCount: 0,
  companyCount: 0,
  recentTransactions: [] as Transaction[]
})

const loading = ref(true)

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('mn-MN').format(value) + '₮'
}
const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  try {
    const [companies, todayTransactions] = await Promise.all([
      getAllCompanies(),
      getTransactions(todayStr)
    ])

    stats.value.companyCount = companies.length
    stats.value.todayCount = todayTransactions.length
    stats.value.todayTotal = todayTransactions.reduce((sum, t) => sum + t.amount, 0)
    stats.value.recentTransactions = todayTransactions.slice(0, 10)
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Нүүр хуудас">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            icon="i-lucide-plus"
            label="Шинэ гүйлгээ"
            size="md"
            to="/transactions"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex items-center justify-center py-20">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
      </div>

      <div v-else class="p-6 space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="rounded-xl border border-default bg-default/50 p-5 space-y-2">
            <div class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-calendar-check" class="size-5" />
              <span class="text-sm font-medium">Өнөөдрийн нийт</span>
            </div>
            <p class="text-3xl font-bold text-primary">{{ formatMoney(stats.todayTotal) }}</p>
            <p class="text-xs text-muted">{{ stats.todayCount }} гүйлгээ</p>
          </div>

          <div class="rounded-xl border border-default bg-default/50 p-5 space-y-2">
            <div class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-building-2" class="size-5" />
              <span class="text-sm font-medium">Бүртгэлтэй компани</span>
            </div>
            <p class="text-3xl font-bold">{{ stats.companyCount }}</p>
            <p class="text-xs text-muted">Нийт компаниуд</p>
          </div>

          <div class="rounded-xl border border-default bg-default/50 p-5 space-y-2">
            <div class="flex items-center gap-2 text-muted">
              <UIcon name="i-lucide-receipt" class="size-5" />
              <span class="text-sm font-medium">Өнөөдрийн гүйлгээ</span>
            </div>
            <p class="text-3xl font-bold">{{ stats.todayCount }}</p>
            <p class="text-xs text-muted">{{ todayStr }}</p>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="rounded-xl border border-default bg-default/50 overflow-hidden">
          <div class="px-5 py-4 border-b border-default">
            <h3 class="font-semibold">Өнөөдрийн гүйлгээнүүд</h3>
          </div>

          <div v-if="stats.recentTransactions.length === 0" class="p-8 text-center text-muted">
            <UIcon name="i-lucide-inbox" class="size-10 mb-2 mx-auto" />
            <p>Өнөөдөр гүйлгээ бүртгэгдээгүй байна</p>
            <UButton label="Гүйлгээ нэмэх" to="/transactions" class="mt-3" variant="soft" />
          </div>

          <UTable
            v-else
            :data="stats.recentTransactions"
            :columns="[
              { accessorKey: 'index', header: '№' },
              { accessorFn: (row: any) => formatDateTime(row.createdAt), header: 'Огноо, цаг', id: 'datetime' },
              { accessorFn: (row: any) => row.companyId?.name || '-', header: 'Хүлээн авагч', id: 'companyName' },
              { accessorFn: (row: any) => row.companyId?.registrationNumber || '-', header: 'Регистрийн дугаар', id: 'regNumber' },
              { accessorFn: (row: any) => row.companyId?.bankName && row.companyId?.bankAccount ? `${row.companyId.bankName} - ${row.companyId.bankAccount}` : '-', header: 'Банк, данс', id: 'bankInfo' },
              { accessorKey: 'amount', header: 'Мөнгөн дүн' },
              { accessorFn: (row: any) => row.contactInfo || (row.companyId?.contactPerson ? `${row.companyId.contactPerson}${row.companyId.contactInfo ? ' - ' + row.companyId.contactInfo : ''}` : '-'), header: 'ХТ', id: 'contact' }
            ]"
          >
            <template #index-cell="{ row }">
              {{ stats.recentTransactions.indexOf(row.original) + 1 }}
            </template>
            <template #amount-cell="{ row }">
              <span class="font-semibold text-primary">{{ formatMoney(row.original.amount) }}</span>
            </template>
          </UTable>

          <div v-if="stats.recentTransactions.length > 0" class="px-5 py-3 border-t border-default flex justify-between items-center bg-elevated/30">
            <span class="font-semibold">Нийт дүн:</span>
            <span class="text-lg font-bold text-primary">{{ formatMoney(stats.todayTotal) }}</span>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

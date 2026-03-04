<script setup lang="ts">
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import type { ReportData, Transaction } from '~/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const { getReport } = useReports()
const colorMode = useColorMode()

const reportType = ref<'day' | 'month' | 'quarter' | 'year'>('day')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedQuarter = ref(Math.ceil((new Date().getMonth() + 1) / 3))

const report = ref<ReportData | null>(null)
const loading = ref(false)

const formatMoney = (value: number) => new Intl.NumberFormat('mn-MN').format(value) + '₮'
const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('mn-MN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const reportTypes = [
  { label: 'Өдөр', value: 'day' as const, icon: 'i-lucide-calendar' },
  { label: 'Сар', value: 'month' as const, icon: 'i-lucide-calendar-days' },
  { label: 'Улирал', value: 'quarter' as const, icon: 'i-lucide-calendar-range' },
  { label: 'Жил', value: 'year' as const, icon: 'i-lucide-calendar-clock' }
]

const months = [
  { label: '1-р сар', value: 1 }, { label: '2-р сар', value: 2 },
  { label: '3-р сар', value: 3 }, { label: '4-р сар', value: 4 },
  { label: '5-р сар', value: 5 }, { label: '6-р сар', value: 6 },
  { label: '7-р сар', value: 7 }, { label: '8-р сар', value: 8 },
  { label: '9-р сар', value: 9 }, { label: '10-р сар', value: 10 },
  { label: '11-р сар', value: 11 }, { label: '12-р сар', value: 12 }
]

const quarters = [
  { label: '1-р улирал (1-3 сар)', value: 1 },
  { label: '2-р улирал (4-6 сар)', value: 2 },
  { label: '3-р улирал (7-9 сар)', value: 3 },
  { label: '4-р улирал (10-12 сар)', value: 4 }
]

const years = Array.from({ length: 10 }, (_, i) => {
  const y = new Date().getFullYear() - i
  return { label: `${y}`, value: y }
})

// Chart colors
const chartColors = [
  '#2563EB', '#06B6D4', '#16A34A', '#F59E0B', '#DC2626',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'
]

// Company distribution chart data
const companyChartData = computed(() => {
  if (!report.value || !report.value.groupedByCompany.length) return null
  const sorted = [...report.value.groupedByCompany].sort((a, b) => b.total - a.total).slice(0, 10)
  return {
    labels: sorted.map(c => c.name),
    datasets: [{
      data: sorted.map(c => c.total),
      backgroundColor: chartColors.slice(0, sorted.length),
      borderWidth: 0
    }]
  }
})

// Daily breakdown bar chart (for month/quarter/year)
const dailyBarChartData = computed(() => {
  if (!report.value || !report.value.groupedByDate) return null
  const entries = Object.entries(report.value.groupedByDate).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length < 2) return null
  return {
    labels: entries.map(([date]) => date),
    datasets: [{
      label: 'Нийт дүн',
      data: entries.map(([, data]) => data.total),
      backgroundColor: '#2563EB',
      borderRadius: 6,
      borderSkipped: false
    }]
  }
})

// Cumulative line chart
const cumulativeChartData = computed(() => {
  if (!report.value || !report.value.groupedByDate) return null
  const entries = Object.entries(report.value.groupedByDate).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length < 2) return null
  let cumSum = 0
  const cumulative = entries.map(([, data]) => {
    cumSum += data.total
    return cumSum
  })
  return {
    labels: entries.map(([date]) => date),
    datasets: [{
      label: 'Хуримтлагдсан дүн',
      data: cumulative,
      borderColor: '#06B6D4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#06B6D4'
    }]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => formatMoney(ctx.parsed.y ?? ctx.parsed ?? ctx.raw)
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: (value: any) => new Intl.NumberFormat('mn-MN', { notation: 'compact' }).format(value) + '₮',
        color: colorMode.value === 'dark' ? '#94A3B8' : '#64748B'
      },
      grid: { color: colorMode.value === 'dark' ? '#334155' : '#E2E8F0' }
    },
    x: {
      ticks: { color: colorMode.value === 'dark' ? '#94A3B8' : '#64748B' },
      grid: { display: false }
    }
  }
}))

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: colorMode.value === 'dark' ? '#CBD5E1' : '#334155',
        padding: 12,
        usePointStyle: true
      }
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.label}: ${formatMoney(ctx.raw)}`
      }
    }
  }
}))

const loadReport = async () => {
  loading.value = true
  try {
    const params: Record<string, string> = { type: reportType.value }
    switch (reportType.value) {
      case 'day': params.date = selectedDate.value || ''; break
      case 'month': params.year = String(selectedYear.value); params.month = String(selectedMonth.value); break
      case 'quarter': params.year = String(selectedYear.value); params.quarter = String(selectedQuarter.value); break
      case 'year': params.year = String(selectedYear.value); break
    }
    report.value = await getReport(params)
  } catch (error) {
    console.error('Failed to load report:', error)
  } finally {
    loading.value = false
  }
}

const exportCSV = () => {
  if (!report.value || !report.value.transactions.length) return
  const headers = ['№', 'Огноо', 'Цаг', 'Хүлээн авагч', 'Регистр', 'Банк, данс', 'Мөнгөн дүн', 'ХТ']
  const rows = report.value.transactions.map((t: Transaction, i: number) => [
    i + 1,
    formatDate(t.transactionDate),
    formatDateTime(t.createdAt),
    t.companyId?.name || '',
    t.companyId?.registrationNumber || '',
    t.bankName && t.bankAccount ? `${t.bankName} - ${t.bankAccount}` : '',
    t.amount,
    t.contactInfo || t.companyId?.contactPerson || ''
  ])
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any[]) => r.map(v => `"${v}"`).join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `тайлан_${reportType.value}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

watch([reportType, selectedDate, selectedYear, selectedMonth, selectedQuarter], () => loadReport())
onMounted(() => loadReport())
</script>

<template>
  <UDashboardPanel id="reports">
    <template #header>
      <UDashboardNavbar title="Тайлан">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            v-if="report && report.transactions.length"
            icon="i-lucide-download"
            label="CSV татах"
            color="neutral"
            variant="outline"
            @click="exportCSV"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center gap-4 rounded-xl border border-default bg-default/50 p-4">
          <div class="flex rounded-lg border border-default overflow-hidden">
            <button
              v-for="rt in reportTypes"
              :key="rt.value"
              class="px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5"
              :class="reportType === rt.value ? 'bg-primary text-white' : 'hover:bg-elevated/50'"
              @click="reportType = rt.value"
            >
              <UIcon :name="rt.icon" class="size-4" />
              {{ rt.label }}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-if="reportType === 'day'"
              v-model="selectedDate"
              type="date"
              class="bg-transparent border border-default rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >

            <template v-if="reportType === 'month' || reportType === 'quarter' || reportType === 'year'">
              <select
                v-model.number="selectedYear"
                class="bg-transparent border border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option v-for="y in years" :key="y.value" :value="y.value">{{ y.label }}</option>
              </select>
            </template>

            <select
              v-if="reportType === 'month'"
              v-model.number="selectedMonth"
              class="bg-transparent border border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>

            <select
              v-if="reportType === 'quarter'"
              v-model.number="selectedQuarter"
              class="bg-transparent border border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option v-for="q in quarters" :key="q.value" :value="q.value">{{ q.label }}</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
        </div>

        <template v-else-if="report">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="rounded-xl border border-default bg-default/50 p-5 space-y-1">
              <div class="text-sm text-muted font-medium flex items-center gap-1.5">
                <UIcon name="i-lucide-banknote" class="size-4 text-primary" />
                Нийт дүн
              </div>
              <p class="text-2xl font-bold text-primary">{{ formatMoney(report.totalAmount) }}</p>
            </div>
            <div class="rounded-xl border border-default bg-default/50 p-5 space-y-1">
              <div class="text-sm text-muted font-medium flex items-center gap-1.5">
                <UIcon name="i-lucide-receipt" class="size-4 text-cyan-500" />
                Гүйлгээний тоо
              </div>
              <p class="text-2xl font-bold">{{ report.transactionCount }}</p>
            </div>
            <div class="rounded-xl border border-default bg-default/50 p-5 space-y-1">
              <div class="text-sm text-muted font-medium flex items-center gap-1.5">
                <UIcon name="i-lucide-building-2" class="size-4 text-green-500" />
                Компаниудын тоо
              </div>
              <p class="text-2xl font-bold">{{ report.groupedByCompany.length }}</p>
            </div>
            <div class="rounded-xl border border-default bg-default/50 p-5 space-y-1">
              <div class="text-sm text-muted font-medium flex items-center gap-1.5">
                <UIcon name="i-lucide-trending-up" class="size-4 text-amber-500" />
                Дундаж дүн
              </div>
              <p class="text-2xl font-bold">{{ report.transactionCount ? formatMoney(Math.round(report.totalAmount / report.transactionCount)) : '0₮' }}</p>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-if="report.transactions.length > 0">
            <!-- Daily Bar Chart -->
            <div v-if="dailyBarChartData" class="rounded-xl border border-default bg-default/50 p-5">
              <h4 class="font-semibold mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-bar-chart-3" class="size-5 text-primary" />
                Өдрөөр задалсан дүн
              </h4>
              <div class="h-64">
                <Bar :data="dailyBarChartData" :options="chartOptions" />
              </div>
            </div>

            <!-- Cumulative Line Chart -->
            <div v-if="cumulativeChartData" class="rounded-xl border border-default bg-default/50 p-5">
              <h4 class="font-semibold mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-trending-up" class="size-5 text-cyan-500" />
                Хуримтлагдсан дүн
              </h4>
              <div class="h-64">
                <Line :data="cumulativeChartData" :options="chartOptions" />
              </div>
            </div>

            <!-- Company Distribution Doughnut -->
            <div v-if="companyChartData" class="rounded-xl border border-default bg-default/50 p-5">
              <h4 class="font-semibold mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-pie-chart" class="size-5 text-green-500" />
                Компаниар хуваарилалт
              </h4>
              <div class="h-64">
                <Doughnut :data="companyChartData" :options="doughnutOptions" />
              </div>
            </div>

            <!-- Company Summary Table -->
            <div v-if="report.groupedByCompany.length > 0" class="rounded-xl border border-default bg-default/50 overflow-hidden">
              <div class="px-5 py-4 border-b border-default flex items-center gap-2">
                <UIcon name="i-lucide-list" class="size-5 text-amber-500" />
                <h4 class="font-semibold">Компаниар нэгтгэсэн</h4>
              </div>
              <UTable
                :data="[...report.groupedByCompany].sort((a, b) => b.total - a.total)"
                :columns="[
                  { accessorKey: 'index', header: '№' },
                  { accessorKey: 'name', header: 'Компани' },
                  { accessorKey: 'count', header: 'Тоо' },
                  { accessorKey: 'total', header: 'Нийт дүн' }
                ]"
              >
                <template #index-cell="{ row }">
                  {{ [...report!.groupedByCompany].sort((a, b) => b.total - a.total).indexOf(row.original) + 1 }}
                </template>
                <template #total-cell="{ row }">
                  <span class="font-semibold text-primary">{{ formatMoney(row.original.total) }}</span>
                </template>
              </UTable>
            </div>
          </div>

          <!-- Full Transactions Table -->
          <div v-if="report.transactions.length > 0" class="rounded-xl border border-default bg-default/50 overflow-hidden">
            <div class="px-5 py-4 border-b border-default flex items-center justify-between">
              <h4 class="font-semibold flex items-center gap-2">
                <UIcon name="i-lucide-table" class="size-5" />
                Бүх гүйлгээнүүд
              </h4>
              <span class="text-sm text-muted bg-elevated/50 px-3 py-1 rounded-full">{{ report.transactionCount }} гүйлгээ</span>
            </div>
            <UTable
              :data="report.transactions"
              :columns="[
                { accessorKey: 'index', header: '№' },
                { accessorFn: (row: any) => formatDateTime(row.createdAt), header: 'Огноо, цаг', id: 'datetime' },
                { accessorFn: (row: any) => row.companyId?.name || '-', header: 'Хүлээн авагч', id: 'companyName' },
                { accessorFn: (row: any) => row.companyId?.registrationNumber || '-', header: 'Регистр', id: 'regNum' },
                { accessorFn: (row: any) => row.bankName && row.bankAccount ? `${row.bankName} - ${row.bankAccount}` : '-', header: 'Банк, данс', id: 'bankInfo' },
                { accessorKey: 'amount', header: 'Мөнгөн дүн' },
                { accessorFn: (row: any) => row.contactInfo || (row.companyId?.contactPerson ? `${row.companyId.contactPerson}${row.companyId.contactInfo ? ' - ' + row.companyId.contactInfo : ''}` : '-'), header: 'ХТ', id: 'contact' }
              ]"
            >
              <template #index-cell="{ row }">
                {{ report!.transactions.indexOf(row.original) + 1 }}
              </template>
              <template #amount-cell="{ row }">
                <span class="font-bold text-primary">{{ formatMoney(row.original.amount) }}</span>
              </template>
            </UTable>

            <div class="px-6 py-4 border-t-2 border-primary/20 flex justify-between items-center bg-primary/5">
              <span class="font-semibold">Нийт дүн:</span>
              <span class="text-2xl font-bold text-primary">{{ formatMoney(report.totalAmount) }}</span>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="report.transactions.length === 0" class="text-center py-16 text-muted">
            <UIcon name="i-lucide-file-search" class="size-14 mb-3 mx-auto opacity-40" />
            <p class="text-lg">Энэ хугацаанд гүйлгээ олдсонгүй</p>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>

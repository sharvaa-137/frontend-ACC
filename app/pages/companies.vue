<script setup lang="ts">
import type { Company } from '~/types'

const { getAllCompanies, createCompany, updateCompany, deleteCompany } = useCompanies()
const toast = useToast()

const companies = ref<Company[]>([])
const loading = ref(true)
const showModal = ref(false)
const editingCompany = ref<Company | null>(null)
const searchQuery = ref('')

const form = ref({
  name: '',
  registrationNumber: '',
  bankName: '',
  bankAccount: '',
  contactPerson: '',
  contactInfo: ''
})

const filteredCompanies = computed(() => {
  if (!searchQuery.value) return companies.value
  const q = searchQuery.value.toLowerCase()
  return companies.value.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.registrationNumber && c.registrationNumber.includes(q)) ||
    (c.bankAccount && c.bankAccount.includes(q))
  )
})

const loadCompanies = async () => {
  loading.value = true
  try {
    companies.value = await getAllCompanies()
  } catch (error) {
    console.error('Failed to load companies:', error)
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editingCompany.value = null
  form.value = {
    name: '',
    registrationNumber: '',
    bankName: '',
    bankAccount: '',
    contactPerson: '',
    contactInfo: ''
  }
  showModal.value = true
}

const openEdit = (company: Company) => {
  editingCompany.value = company
  form.value = {
    name: company.name,
    registrationNumber: company.registrationNumber || '',
    bankName: company.bankName || '',
    bankAccount: company.bankAccount || '',
    contactPerson: company.contactPerson || '',
    contactInfo: company.contactInfo || ''
  }
  showModal.value = true
}

const saveCompany = async () => {
  try {
    if (editingCompany.value) {
      await updateCompany(editingCompany.value._id, form.value)
      toast.add({ title: 'Амжилттай', description: 'Компани шинэчлэгдлээ', color: 'success' })
    } else {
      await createCompany(form.value)
      toast.add({ title: 'Амжилттай', description: 'Компани нэмэгдлээ', color: 'success' })
    }
    showModal.value = false
    await loadCompanies()
  } catch (error: any) {
    toast.add({ title: 'Алдаа', description: error.message || 'Алдаа гарлаа', color: 'error' })
  }
}

const removeCompany = async (company: Company) => {
  if (!confirm(`"${company.name}" компанийг устгахдаа итгэлтэй байна уу?`)) return

  try {
    await deleteCompany(company._id)
    toast.add({ title: 'Устгагдлаа', description: 'Компани устгагдлаа', color: 'success' })
    await loadCompanies()
  } catch (error: any) {
    toast.add({ title: 'Алдаа', description: 'Устгахад алдаа гарлаа', color: 'error' })
  }
}

onMounted(() => {
  loadCompanies()
})
</script>

<template>
  <UDashboardPanel id="companies">
    <template #header>
      <UDashboardNavbar title="Компаниуд">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UInput
            v-model="searchQuery"
            placeholder="Хайх..."
            icon="i-lucide-search"
            class="w-64"
          />
          <UButton
            icon="i-lucide-plus"
            label="Компани нэмэх"
            @click="openCreate"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div v-if="loading" class="flex items-center justify-center py-20">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
        </div>

        <div v-else-if="filteredCompanies.length === 0" class="text-center py-20 text-muted">
          <UIcon name="i-lucide-building-2" class="size-12 mb-3 mx-auto" />
          <p class="text-lg">Компани бүртгэгдээгүй байна</p>
          <UButton label="Эхний компанийг нэмэх" class="mt-3" @click="openCreate" />
        </div>

        <div v-else class="rounded-xl border border-default bg-default/50 overflow-hidden">
          <UTable
            :data="filteredCompanies"
            :columns="[
              { accessorKey: 'index', header: '№' },
              { accessorKey: 'name', header: 'Компанийн нэр' },
              { accessorKey: 'registrationNumber', header: 'Регистрийн дугаар' },
              { accessorFn: (row: any) => row.bankName && row.bankAccount ? `${row.bankName} - ${row.bankAccount}` : '-', header: 'Банк, данс', id: 'bankInfo' },
              { accessorFn: (row: any) => row.contactPerson ? `${row.contactPerson}${row.contactInfo ? ' - ' + row.contactInfo : ''}` : '-', header: 'ХТ', id: 'contact' },
              { accessorKey: 'actions', header: 'Үйлдэл' }
            ]"
          >
            <template #index-cell="{ row }">
              {{ filteredCompanies.indexOf(row.original) + 1 }}
            </template>
            <template #actions-cell="{ row }">
              <div class="flex gap-1">
                <UButton
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="openEdit(row.original)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  @click="removeCompany(row.original)"
                />
              </div>
            </template>
          </UTable>

          <div class="px-5 py-3 border-t border-default bg-elevated/30 text-sm text-muted">
            Нийт: {{ filteredCompanies.length }} компани
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <UModal v-model:open="showModal">
        <template #content>
          <div class="p-6 space-y-4">
            <h3 class="text-lg font-semibold">
              {{ editingCompany ? 'Компани засах' : 'Шинэ компани нэмэх' }}
            </h3>

            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-muted mb-1 block">Компанийн нэр *</label>
                <UInput v-model="form.name" placeholder="Компанийн нэр" size="lg" />
              </div>
              <div>
                <label class="text-sm font-medium text-muted mb-1 block">Регистрийн дугаар</label>
                <UInput v-model="form.registrationNumber" placeholder="Регистрийн дугаар" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium text-muted mb-1 block">Банкны нэр</label>
                  <UInput v-model="form.bankName" placeholder="Жнь: Хаан" />
                </div>
                <div>
                  <label class="text-sm font-medium text-muted mb-1 block">Дансны дугаар</label>
                  <UInput v-model="form.bankAccount" placeholder="Дансны дугаар" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm font-medium text-muted mb-1 block">Холбоо барих хүн</label>
                  <UInput v-model="form.contactPerson" placeholder="Нэр" />
                </div>
                <div>
                  <label class="text-sm font-medium text-muted mb-1 block">Утас/Мэдээлэл</label>
                  <UInput v-model="form.contactInfo" placeholder="Утасны дугаар" />
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <UButton label="Цуцлах" color="neutral" variant="outline" @click="showModal = false" />
              <UButton
                :label="editingCompany ? 'Хадгалах' : 'Нэмэх'"
                :disabled="!form.name"
                @click="saveCompany"
              />
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>

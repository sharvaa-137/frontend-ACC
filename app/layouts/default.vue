<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const colorMode = useColorMode()

const open = ref(false)

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val: boolean) => {
    colorMode.preference = val ? 'dark' : 'light'
  }
})

const logout = () => {
  const cookie = useCookie('auth-token')
  cookie.value = null
  navigateTo('/login')
}

const links = [[{
  label: 'Нүүр',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Гүйлгээ',
  icon: 'i-lucide-receipt',
  to: '/transactions',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Компаниуд',
  icon: 'i-lucide-building-2',
  to: '/companies',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Тайлан',
  icon: 'i-lucide-bar-chart-3',
  to: '/reports',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Цэс',
  items: links.flat()
}])
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 p-2 relative h-10">
          <img src="/logo.svg" alt="Balance" class="size-7 shrink-0 object-contain drop-shadow-md" />
          <span v-if="!collapsed" class="font-extrabold text-xl tracking-tighter bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent drop-shadow-sm ml-1">Balance</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex items-center gap-2 p-2" :class="collapsed ? 'justify-center' : 'justify-between'">
          <span v-if="!collapsed" class="text-xs text-muted font-medium">
            {{ isDark ? 'Харанхуй' : 'Гэрэлтэй' }}
          </span>
          <div class="flex items-center gap-1">
            <UTooltip :text="isDark ? 'Гэрэлтэй горим' : 'Харанхуй горим'">
              <button
                class="flex items-center justify-center size-8 rounded-md transition-colors hover:bg-elevated"
                @click="isDark = !isDark"
              >
                <UIcon
                  :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
                  class="size-4"
                />
              </button>
            </UTooltip>
            <UTooltip text="Гарах">
              <button
                class="flex items-center justify-center size-8 rounded-md transition-colors hover:bg-elevated text-red-500"
                @click="logout"
              >
                <UIcon name="i-lucide-log-out" class="size-4" />
              </button>
            </UTooltip>
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>

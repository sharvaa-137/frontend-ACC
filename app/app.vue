<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'mn'
  }
})

const title = 'НЯ-БО Бүртгэл'
const description = 'Худалдан авалтын гүйлгээний мэдээлэл бүртгэх систем'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

const { isBackendDown, checking, checkHealth } = useBackendHealth()
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <!-- Backend Down Overlay -->
    <div v-if="isBackendDown" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-900 p-6">
      <div class="text-center space-y-6 max-w-md">
        <div class="flex items-center justify-center size-20 rounded-full bg-red-500/10 border border-red-500/20 mx-auto">
          <UIcon name="i-lucide-server-off" class="size-10 text-red-400" />
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-white">Сервер холбогдсонгүй</h1>
          <p class="text-sm text-slate-400 leading-relaxed">
            Серверт холбогдох боломжгүй байна. Сервер ажиллаж байгаа эсэхийг шалгана уу.
          </p>
        </div>
        <UButton
          label="Дахин оролдох"
          icon="i-lucide-refresh-cw"
          size="lg"
          color="neutral"
          variant="outline"
          :loading="checking"
          @click="checkHealth"
        />
      </div>
    </div>

    <!-- Normal App -->
    <template v-else>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </template>
  </UApp>
</template>


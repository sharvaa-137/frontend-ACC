<script setup lang="ts">
definePageMeta({
  layout: false
})

const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (val: boolean) => {
    colorMode.preference = val ? 'dark' : 'light'
  }
})

onMounted(() => {
  colorMode.preference = 'light'
})

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const login = async () => {
  error.value = ''

  if (!username.value.trim()) {
    error.value = 'Нэвтрэх нэрээ оруулна уу'
    return
  }
  if (!password.value.trim()) {
    error.value = 'Нууц үгээ оруулна уу'
    return
  }

  loading.value = true
  await new Promise(resolve => setTimeout(resolve, 600))

  if (username.value === 'acc137' && password.value === 'copenhagen1926') {
    const cookie = useCookie('auth-token', { maxAge: 60 * 60 * 24 * 30 })
    cookie.value = btoa(`${username.value}:${password.value}`)
    await navigateTo('/')
  } else {
    error.value = 'Нэвтрэх нэр эсвэл нууц үг буруу байна'
  }

  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 transition-colors duration-300">
    <!-- Card Container -->
    <div class="relative w-full max-w-225 grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-200 dark:border-white/10 transition-colors duration-300">
      <!-- Theme Toggle -->
      <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          class="flex items-center justify-center size-10 rounded-full bg-slate-50 dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          @click="isDark = !isDark"
        >
          <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="size-5" />
        </button>
      </div>
      <!-- Left: Image Panel -->
      <div class="relative hidden lg:flex flex-col justify-between overflow-hidden" style="min-height: 560px;">
        <img
          src="/login-bg.png"
          alt=""
          style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;"
        >
        <div class="absolute inset-0 bg-linear-to-t from-white/20 via-white/40 to-transparent dark:from-slate-900 dark:via-slate-900/40 dark:to-transparent transition-colors duration-300" />
      </div>

      <!-- Right: Form Panel -->
      <div class="flex flex-col justify-center px-8 sm:px-12 py-12">
        <div class="flex flex-col items-center sm:items-start gap-4 mb-10">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center size-12 rounded-2xl bg-linear-to-br from-primary-500/10 to-primary-400/10 border border-slate-200 dark:border-primary-500/20 p-2 shadow-lg shadow-primary-500/10 dark:shadow-none">
              <img src="/logo.svg" alt="Balance" class="size-full object-contain drop-shadow-md">
            </div>
            <span class="font-extrabold text-3xl tracking-tighter bg-linear-to-r from-slate-800 via-primary-600 to-primary-500 dark:from-white dark:via-primary-100 dark:to-primary-300 bg-clip-text text-transparent drop-shadow-sm">Balance</span>
          </div>
        </div>

        <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-8 text-center sm:text-left transition-colors">
          Нэвтрэх
        </h2>

        <!-- Error -->
        <div
          v-if="error"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm mb-5 transition-colors"
        >
          <UIcon name="i-lucide-alert-circle" class="size-4 shrink-0" />
          {{ error }}
        </div>

        <!-- Form -->
        <form class="flex flex-col gap-4" @submit.prevent="login">
          <!-- Username -->
          <input
            v-model="username"
            type="text"
            placeholder="Нэвтрэх нэр"
            autofocus
            class="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all"
          >

          <!-- Password -->
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Нууц үг"
              class="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all pr-12"
            >
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
              @click="showPassword = !showPassword"
            >
              <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="size-4" />
            </button>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <UIcon v-if="loading" name="i-lucide-loader-2" class="size-4 animate-spin" />
            <UIcon v-else name="i-lucide-log-in" class="size-4" />
            Нэвтрэх
          </button>
        </form>

        <p class="text-center text-xs text-slate-400 dark:text-white/20 mt-8 transition-colors">
          © {{ new Date().getFullYear() }}
        </p>
      </div>
    </div>
  </div>
</template>

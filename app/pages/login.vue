<script setup lang="ts">
definePageMeta({
  layout: false
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
  <div class="min-h-screen flex items-center justify-center bg-[#1a1625] p-4 sm:p-8">
    <!-- Card Container -->
    <div class="w-full max-w-225 grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden bg-[#221e2e] shadow-2xl shadow-black/40 border border-white/6">
      <!-- Left: Image Panel -->
      <div class="relative hidden lg:flex flex-col justify-between overflow-hidden" style="min-height: 560px;">
        <img
          src="/login-bg.png"
          alt=""
          style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;"
        >
        <div class="absolute inset-0" style="background: linear-gradient(to top, #221e2e 0%, rgba(34,30,46,0.3) 50%, rgba(34,30,46,0.5) 100%);" />

        <!-- Logo overlay -->
        <!--        <div class="relative z-10 p-6 flex items-center gap-2"> -->
        <!--          <div class="flex items-center justify-center size-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10"> -->
        <!--            <UIcon name="i-lucide-calculator" class="size-5 text-purple-300" /> -->
        <!--          </div> -->
        <!--        </div> -->
      </div>

      <!-- Right: Form Panel -->
      <div class="flex flex-col justify-center px-8 sm:px-12 py-12">
        <!-- Mobile logo -->
        <div class="flex items-center gap-2 mb-6 lg:hidden">
          <div class="flex items-center justify-center size-9 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <UIcon name="i-lucide-calculator" class="size-5 text-purple-400" />
          </div>
          <span class="text-white/90 font-bold text-sm">НЯ-БО</span>
        </div>

        <h2 class="text-2xl font-bold text-white mb-8">
          Нэвтрэх
        </h2>

        <!-- Error -->
        <div
          v-if="error"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5"
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
            class="w-full px-4 py-3.5 rounded-xl bg-white/6 border border-white/8 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
          >

          <!-- Password -->
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Нууц үг"
              class="w-full px-4 py-3.5 rounded-xl bg-white/6 border border-white/8 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all pr-12"
            >
            <button
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              @click="showPassword = !showPassword"
            >
              <UIcon :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="size-4" />
            </button>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full mt-2 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <UIcon v-if="loading" name="i-lucide-loader-2" class="size-4 animate-spin" />
            <UIcon v-else name="i-lucide-log-in" class="size-4" />
            Нэвтрэх
          </button>
        </form>

        <p class="text-center text-xs text-white/20 mt-8">
          © {{ new Date().getFullYear() }}
        </p>
      </div>
    </div>
  </div>
</template>

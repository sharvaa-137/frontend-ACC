import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const router = useRouter()

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-t': () => router.push('/transactions'),
    'g-c': () => router.push('/companies'),
    'g-r': () => router.push('/reports')
  })

  return {}
}

export const useDashboard = createSharedComposable(_useDashboard)

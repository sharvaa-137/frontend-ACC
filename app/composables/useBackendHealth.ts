export const useBackendHealth = () => {
  const isBackendDown = useState<boolean>('backend-down', () => false)
  const checking = useState<boolean>('backend-checking', () => false)

  const checkHealth = async () => {
    checking.value = true
    try {
      const apiBase = useRuntimeConfig().public.apiBase as string
      await $fetch(`${apiBase}/health`, { timeout: 5000 })
      isBackendDown.value = false
    } catch {
      isBackendDown.value = true
    } finally {
      checking.value = false
    }
  }

  return { isBackendDown, checking, checkHealth }
}

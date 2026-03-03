export default defineNuxtPlugin(async () => {
    // Only run on client side
    if (import.meta.server) return

    const { checkHealth } = useBackendHealth()
    await checkHealth()
})

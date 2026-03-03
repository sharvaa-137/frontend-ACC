export default defineNuxtRouteMiddleware((to) => {
    if (to.path === '/login') return

    const cookie = useCookie('auth-token')
    if (!cookie.value) {
        return navigateTo('/login')
    }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'gysd-demo-auth'

/** 演示登录态：无真实认证接口，退出后需在演示入口手动恢复会话。 */
export const useSessionStore = defineStore('session', () => {
  const loggedIn = ref(sessionStorage.getItem(KEY) !== 'out')
  function logout() { loggedIn.value = false; sessionStorage.setItem(KEY, 'out') }
  function resume() { loggedIn.value = true; sessionStorage.setItem(KEY, 'in') }
  return { loggedIn, logout, resume }
})

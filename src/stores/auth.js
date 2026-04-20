import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roleHomeMap } from '@/config/roleMenus.js'

const DUMMY_USERS = [
  { email: 'hq@stockit.com',        password: 'hq1234',    role: 'hq',        name: '본사 관리자' },
  { email: 'store@stockit.com',     password: 'store1234', role: 'store',     name: '매장 관리자' },
  { email: 'warehouse@stockit.com', password: 'wh1234',    role: 'warehouse', name: '창고 관리자' },
]

const STORAGE_KEY = 'stockit_auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  const isAuthenticated = computed(() => user.value !== null)

  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) user.value = JSON.parse(saved)
    } catch {
      user.value = null
    }
  }

  function login(email, password) {
    const found = DUMMY_USERS.find(u => u.email === email && u.password === password)
    if (!found) return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }

    user.value = { email: found.email, name: found.name, role: found.role }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
    return { success: true, redirectTo: roleHomeMap[found.role] }
  }

  function logout() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  init()

  return { user, isAuthenticated, login, logout }
})

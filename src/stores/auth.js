import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roleHomeMap } from '@/config/roleMenus.js'
import { authApi } from '@/api/user/auth.js'
import { extractErrorMessage } from '@/api/axios.js'

// HttpOnly Cookie 방식이라 토큰은 JS에서 접근 불가.
// localStorage 에는 사용자 정보(UI 표시용)만 저장.
const STORAGE_KEY = 'stockit_user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = computed(() => user.value !== null)

  /** 새로고침 시 localStorage 에서 사용자 정보 복원 */
  function init() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) user.value = JSON.parse(saved)
    } catch {
      user.value = null
    }
  }

  /**
   * 로그인 — BE 호출 단일 경로 (employeeCode + password).
   * 응답 쿠키(Atoken/Rtoken) 는 axios 가 자동 처리.
   */
  async function login(employeeCode, password) {
    try {
      const result = await authApi.login({ employeeCode, password })

      // BE role(HQ/STORE/WAREHOUSE) → FE role(hq/store/warehouse)
      const role = (result.role ?? '').toLowerCase()

      user.value = {
        employeeCode: result.employeeCode,
        name: result.name,
        role,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
      sessionStorage.removeItem('stockit:openTopMenus')

      return { success: true, redirectTo: roleHomeMap[role] ?? '/dev-login' }
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, '사원번호 또는 비밀번호가 올바르지 않습니다.'),
      }
    }
  }

  /**
   * 로그아웃 — 클라이언트 상태를 먼저 비우고, BE 쿠키 만료는 fire-and-forget.
   */
  function logout() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem('stockit:openTopMenus')

    authApi.logout().catch(() => {
      // 쿠키 만료/네트워크 에러는 무시 — 클라이언트 상태는 이미 비웠음
    })
  }

  init()

  return { user, isAuthenticated, login, logout }
})

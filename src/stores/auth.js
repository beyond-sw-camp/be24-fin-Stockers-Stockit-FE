import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roleHomeMap } from '@/config/roleMenus.js'
import { authApi } from '@/api/auth.js'

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
   * 로그인 — BE 의 POST /api/auth/login 호출.
   * 성공 시 BE 가 HttpOnly Cookie(Atoken) 로 JWT 발급.
   * Body 응답에는 토큰이 없고 사용자 정보만 들어옴.
   * @param {string} employeeCode
   * @param {string} password
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
        message: err?.message ?? '사원번호 또는 비밀번호가 올바르지 않습니다.',
      }
    }
  }

  /**
   * 로그아웃 — 클라이언트 상태를 먼저 비우고, BE 쿠키 만료는 fire-and-forget.
   *
   * 클라이언트 정리를 먼저 하는 이유:
   *   - router guard 가 isAuthenticated 를 즉시 false 로 인식해야
   *     handleLogout 의 router.push('/login') 이 첫 클릭에 동작.
   *   - BE 호출은 백그라운드로 보내고 응답을 기다리지 않음
   *     (브라우저는 SPA 라우팅 후에도 진행 중인 fetch 를 유지).
   */
  function logout() {
    // 1. 클라이언트 상태 즉시 정리 → router guard 통과
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem('stockit:openTopMenus')

    // 2. BE 쿠키 만료 요청 (응답 안 기다림)
    authApi.logout().catch(() => {
      // 네트워크 실패해도 무시 — 어차피 만료 짧음
    })
  }

  init()

  return { user, isAuthenticated, login, logout }
})

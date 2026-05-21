import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roleHomeMap } from '@/config/roleMenus.js'
import { authApi } from '@/api/user/auth.js'
import { extractErrorMessage } from '@/api/axios.js'
import { useNotificationStore } from '@/stores/notification.js'
import { useCircularStockSaleStore } from '@/stores/hq/circularStock/circularStockSale.js'

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
        locationCode: result.locationCode ?? '',     // 스토어/매장/창고/본사 코드 (예: ST-SL-0001)
        locationName: result.locationName ?? '',     // 매장명/지점명 (예: 강남 플래그십점)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
      sessionStorage.removeItem('stockit:openTopMenus')

      // 알림 store — 로그인 직후 초기 로드 + SSE 구독
      try {
        await useNotificationStore().init()
      } catch (e) {
        console.warn('[auth.login] notification init failed:', e)
      }

      return { success: true, redirectTo: roleHomeMap[role] ?? '/dev-login' }
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, '사원번호 또는 비밀번호가 올바르지 않습니다.'),
      }
    }
  }

  /**
   * 로그아웃 — BE 호출(쿠키 만료 + Rtoken DB 삭제)을 기다린 뒤 클라이언트 상태 정리.
   * 외부에서는 직접 호출하지 말고 useLogout() composable 을 사용.
   */
  async function logout() {
    try {
      await authApi.logout()
    } catch (err) {
      // 네트워크 / 401 / 만료 토큰 등 — 클라이언트 정리는 무조건 진행
      console.warn('[auth.logout] BE call failed, clearing client state anyway:', err)
    } finally {
      // 로그아웃 시 순환재고 판매 등록 draft/워크플로우 상태를 즉시 초기화한다.
      try {
        useCircularStockSaleStore().clearDraft()
      } catch (e) {
        console.warn('[auth.logout] circularStock draft clear failed:', e)
      }
      user.value = null
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem('stockit:openTopMenus')
      // 알림 store — SSE close + 상태 비우기
      try {
        useNotificationStore().dispose()
      } catch (e) {
        console.warn('[auth.logout] notification dispose failed:', e)
      }
    }
  }

  init()

  return { user, isAuthenticated, login, logout }
})

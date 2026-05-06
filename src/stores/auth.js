import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roleHomeMap } from '@/config/roleMenus.js'
import { authApi } from '@/api/user/auth.js'
import { extractErrorMessage } from '@/api/axios.js'

// HttpOnly Cookie 방식이라 토큰은 JS에서 접근 불가.
// localStorage 에는 사용자 정보(UI 표시용)만 저장.
const STORAGE_KEY = 'stockit_user'

// 팀 테스트용 더미 계정 (LoginView 데모 계정 클릭 시 사용).
// BE 연동 완료 후에는 제거 예정. DevLoginView 는 실제 BE 호출 사용.
const DUMMY_USERS = [
  {
    email: 'hq@stockit.com',
    password: 'hq1234',
    role: 'hq',
    name: '본사 관리자',
    employeeCode: 'hq0001'
  },
  {
    email: 'store@stockit.com',
    password: 'store1234',
    role: 'store',
    name: '매장 관리자',
    employeeCode: 'st0001',
    storeCode: 'ST-0001',
    storeLocationId: 2,
  },
  {
    email: 'warehouse@stockit.com',
    password: 'wh1234',
    role: 'warehouse',
    name: '창고 관리자',
    employeeCode: 'wh0001'
  },
]

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
   * 로그인 — 하이브리드 방식.
   *  1) 더미 계정 (LoginView 데모 계정) 매칭 시 → 즉시 로컬 로그인 (BE 호출 X)
   *  2) 그 외 → BE 호출 (DevLoginView 의 사원코드 로그인)
   *
   * 두 경로 모두 동일한 user 형태를 만들어 라우팅/메뉴 호환.
   * BE 연동 완료 후 더미 분기는 제거 예정.
   */
  async function login(idOrEmail, password) {
    // 1) 더미 계정 우선 매칭
    const dummy = DUMMY_USERS.find(u => u.email === idOrEmail && u.password === password)
    if (dummy) {
      user.value = {
        employeeCode: dummy.employeeCode,
        name: dummy.name,
        role: dummy.role,
        storeCode: dummy.storeCode,
        storeLocationId: dummy.storeLocationId,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
      sessionStorage.removeItem('stockit:openTopMenus')
      return { success: true, redirectTo: roleHomeMap[dummy.role] ?? '/login' }
    }

    // 2) 실제 BE 호출 (employeeCode + password)
    try {
      const result = await authApi.login({ employeeCode: idOrEmail, password })

      // BE role(HQ/STORE/WAREHOUSE) → FE role(hq/store/warehouse)
      const role = (result.role ?? '').toLowerCase()

      user.value = {
        employeeCode: result.employeeCode,
        name: result.name,
        role,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user.value))
      sessionStorage.removeItem('stockit:openTopMenus')

      return { success: true, redirectTo: roleHomeMap[role] ?? '/login' }
    } catch (err) {
      return {
        success: false,
        message: extractErrorMessage(err, '사원번호 또는 비밀번호가 올바르지 않습니다.'),
      }
    }
  }

  /**
   * 로그아웃 — 클라이언트 상태를 먼저 비우고, BE 쿠키 만료는 fire-and-forget.
   * 더미 계정 사용자도 같은 방식으로 처리 (BE 호출은 무해, 쿠키 없으면 그냥 무시).
   */
  function logout() {
    user.value = null
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem('stockit:openTopMenus')

    authApi.logout().catch(() => {
      // 더미 로그인이었으면 BE 호출 실패해도 무시
    })
  }

  init()

  return { user, isAuthenticated, login, logout }
})

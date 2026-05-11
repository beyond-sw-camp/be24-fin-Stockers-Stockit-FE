/**
 * useLogout — 로그아웃 단일 진입점
 *
 * 사용 예:
 *   const logout = useLogout()
 *   <button @click="logout">로그아웃</button>
 *
 * 동작:
 *   1. BE /api/user/logout 호출 (await — DB Rtoken 삭제 + 쿠키 만료 보장)
 *   2. 클라이언트 상태 정리 (Pinia store + localStorage + sessionStorage)
 *   3. /dev-login 라우팅
 *
 * 호출 위치 단일화 — 이 composable 외부에서 직접 auth.logout() 을 부르지 말 것.
 */

import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

export function useLogout() {
  const router = useRouter()
  const auth = useAuthStore()

  return async () => {
    await auth.logout()
    router.push('/dev-login')
  }
}

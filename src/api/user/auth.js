/**
 * auth.js — 인증 BE 연동
 *
 * BE 엔드포인트:
 *   POST /api/user/login    — 사원코드/비밀번호 인증 → Atoken/Rtoken 쿠키 발급
 *   POST /api/user/refresh  — Rtoken 쿠키로 새 Atoken 발급 (Phase 4 자동 갱신)
 *   POST /api/user/logout   — Atoken/Rtoken 쿠키 즉시 만료 + DB 의 Rtoken 삭제
 *
 * BE 로그인 응답 (BaseResponse<LoginRes>):
 *   result = {
 *     employeeCode: "hq0001",
 *     name: "홍길동",
 *     role: "HQ" | "STORE" | "WAREHOUSE"   // 대문자
 *   }
 *   // 토큰은 Body 가 아닌 Set-Cookie 헤더로 내려옴 (HttpOnly)
 *
 * NOTE: refresh 는 axios 인터셉터(axios.js)에서 401 발생 시 자동 호출되며,
 *       명시적 수동 호출이 필요한 케이스(예: 진단/테스트)에 한해 authApi.refresh() 사용.
 */

import { apiClient, unwrap } from '../axios.js'

export const authApi = {
  /**
   * 로그인
   * @param {{ employeeCode: string, password: string }} req
   * @returns {Promise<{ employeeCode: string, name: string, role: string }>}
   */
  login: (req) => apiClient.post('/api/user/login', req).then(unwrap),

  /**
   * Access Token 수동 재발급. 일반적으로는 axios 인터셉터가 자동 호출하므로
   * 직접 사용할 일은 없음. result 는 null (BE 가 쿠키로만 응답).
   */
  refresh: () => apiClient.post('/api/user/refresh').then(unwrap),

  /**
   * 로그아웃 — BE가 Atoken/Rtoken 쿠키 즉시 만료 + DB Rtoken 삭제.
   */
  logout: () => apiClient.post('/api/user/logout').then(unwrap),
}

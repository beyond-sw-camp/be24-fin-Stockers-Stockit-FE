/**
 * auth.js — 인증 BE 연동
 *
 * BE 엔드포인트:
 *   POST /api/user/login   — 사원코드/비밀번호 인증 → JWT 발급 (HttpOnly Cookie)
 *   POST /api/user/logout  — Atoken 쿠키 즉시 만료
 *
 * BE 로그인 응답 (BaseResponse<LoginRes>):
 *   result = {
 *     employeeCode: "hq0001",
 *     name: "홍길동",
 *     role: "HQ" | "STORE" | "WAREHOUSE"   // 대문자
 *   }
 *   // 토큰은 Body 가 아닌 Set-Cookie 헤더로 내려옴 (HttpOnly)
 */

import { apiClient, unwrap } from './axios.js'

export const authApi = {
  /**
   * 로그인
   * @param {{ employeeCode: string, password: string }} req
   * @returns {Promise<{ employeeCode: string, name: string, role: string }>}
   */
  login: (req) => apiClient.post('/api/user/login', req).then(unwrap),

  /**
   * 로그아웃 — BE가 Atoken 쿠키 즉시 만료시킴.
   */
  logout: () => apiClient.post('/api/user/logout').then(unwrap),
}

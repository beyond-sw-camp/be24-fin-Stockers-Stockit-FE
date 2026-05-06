/**
 * account.js — 회원가입 + 본사 관리자 회원 관리 BE 연동
 *
 * BE 엔드포인트:
 *   POST   /api/user/signup                          (회원가입 신청, 누구나)
 *   GET    /api/hq/account                           (전체 회원 목록, HQ)
 *   GET    /api/hq/account/pending                   (대기 회원 목록, HQ)
 *   POST   /api/hq/account/{id}/approve              (가입 승인, HQ)
 *   POST   /api/hq/account/{id}/reject               (가입 거절, HQ)
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출.
 */

import { apiClient, unwrap } from './axios.js'

export const accountApi = {
  /**
   * 회원가입 신청
   * @param {{
   *   name: string,
   *   email: string,
   *   password: string,
   *   phoneNumber: string,
   *   locationCode: string,
   *   locationName: string,
   *   applicationReason: string,
   *   role: 'HQ' | 'STORE' | 'WAREHOUSE'
   * }} req
   */
  signup: (req) => apiClient.post('/api/user/signup', req).then(unwrap),

  /** 전체 회원 목록 조회 (PENDING/APPROVED/REJECTED) */
  listAll: () => apiClient.get('/api/hq/account').then(unwrap),

  /** 대기 회원 목록 조회 */
  listPending: () => apiClient.get('/api/hq/account/pending').then(unwrap),

  /** 가입 신청 승인 (사원코드 자동 채번) */
  approve: (id) => apiClient.post(`/api/hq/account/${id}/approve`).then(unwrap),

  /** 가입 신청 거절 */
  reject: (id) => apiClient.post(`/api/hq/account/${id}/reject`).then(unwrap),
}

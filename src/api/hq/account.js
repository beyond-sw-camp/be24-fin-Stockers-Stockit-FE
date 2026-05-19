/**
 * account.js — 본사 관리자 회원 관리 BE 연동
 *
 * BE 엔드포인트:
 *   GET    /api/hq/account?keyword=&role=&status=&page=0&size=20   (전체, 페이징)
 *   GET    /api/hq/account/pending?keyword=&page=0&size=20         (대기, 페이징)
 *   POST   /api/hq/account/{id}/approve              (가입 승인, HQ)
 *   POST   /api/hq/account/{id}/reject               (가입 거절, HQ)
 *   POST   /api/hq/account/{id}/withdraw             (탈퇴 처리, HQ)
 *
 * 응답: BaseResponse<Page<T>>. unwrap() 후 { content, totalElements, totalPages, number, size, ... } 구조.
 *
 * NOTE: 회원가입(signup)은 user 도메인이므로 src/api/user/user.js 로 이동됨.
 */

import { apiClient, unwrap } from '../axios.js'

export const accountApi = {
  /**
   * 전체 회원 목록 조회 (PENDING/APPROVED/REJECTED/WITHDRAWN) — 페이징·검색·필터 지원
   *
   * @param {{
   *   page?: number,     // 0-based 페이지 번호 (기본 0)
   *   size?: number,     // 페이지 크기 (기본 20, 최대 100)
   *   keyword?: string,  // 이름/이메일/사원코드 LIKE 검색
   *   role?: 'HQ' | 'STORE' | 'WAREHOUSE',
   *   status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN',
   * }} params
   * @returns {Promise<{
   *   content: Array,
   *   totalElements: number,
   *   totalPages: number,
   *   number: number,
   *   size: number,
   *   first: boolean,
   *   last: boolean,
   *   empty: boolean,
   * }>}
   */
  listAll: ({ page = 0, size = 20, keyword, role, status } = {}) =>
    apiClient.get('/api/hq/account', {
      params: {
        page,
        size,
        keyword: keyword || undefined,   // 빈 문자열은 보내지 않음 (BE 가 null 처리)
        role: role || undefined,
        status: status || undefined,
      },
    }).then(unwrap),

  /**
   * 대기 회원 목록 조회 (PENDING 만) — 페이징·검색 지원
   *
   * @param {{ page?: number, size?: number, keyword?: string }} params
   */
  listPending: ({ page = 0, size = 20, keyword } = {}) =>
    apiClient.get('/api/hq/account/pending', {
      params: {
        page,
        size,
        keyword: keyword || undefined,
      },
    }).then(unwrap),

  /** 가입 신청 승인 (사원코드 자동 채번) */
  approve: (id) => apiClient.post(`/api/hq/account/${id}/approve`).then(unwrap),

  /** 가입 신청 거절 */
  reject: (id) => apiClient.post(`/api/hq/account/${id}/reject`).then(unwrap),

  /**
   * 본사 관리자가 사용자 계정을 탈퇴 처리.
   * 승인된(APPROVED) 사용자만 탈퇴 가능.
   * BE 가 RefreshToken 모두 삭제 → 즉시 강제 로그아웃 효과.
   */
  withdraw: (id) => apiClient.post(`/api/hq/account/${id}/withdraw`).then(unwrap),
}

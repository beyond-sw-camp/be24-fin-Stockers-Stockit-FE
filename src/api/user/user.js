/**
 * user.js — 사용자(user) 도메인 BE 연동
 *
 * BE 엔드포인트:
 *   POST  /api/user/signup            (회원가입 신청, 누구나)
 *   GET   /api/user/mypage            (현재 로그인 사용자 본인 정보, 인증 필수)
 *   PATCH /api/user/mypage/phone      (전화번호 수정)
 *   PATCH /api/user/mypage/password   (비밀번호 변경 — 성공 시 BE 가 모든 RT 삭제)
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출.
 */

import { apiClient, unwrap } from '../axios.js'

export const userApi = {
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

  /**
   * 마이페이지 정보 조회 — 현재 로그인한 사용자 본인의 프로필 정보.
   * BE 가 SecurityContext 의 employeeCode 로 본인 row 조회 후 반환.
   *
   * @returns {Promise<{
   *   id: number,
   *   employeeCode: string,
   *   name: string,
   *   email: string,
   *   phoneNumber: string,
   *   locationCode: string,
   *   locationName: string,
   *   role: 'HQ' | 'STORE' | 'WAREHOUSE',
   *   status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
   * }>}
   */
  getMypage: () => apiClient.get('/api/user/mypage').then(unwrap),

  /**
   * 전화번호 수정.
   * @param {string} phoneNumber - 하이픈(-) 없이 숫자만, 예: "01012345678"
   * @returns 수정된 마이페이지 정보 (MypageRes 동일 형태)
   */
  updatePhone: (phoneNumber) =>
    apiClient.patch('/api/user/mypage/phone', { phoneNumber }).then(unwrap),

  /**
   * 비밀번호 변경.
   * 성공 시 BE 가 본인 포함 모든 Refresh Token 을 삭제하므로
   * 호출 후 클라이언트는 즉시 로그아웃 처리하고 /login 으로 이동시켜야 함.
   *
   * @param {{ currentPassword: string, newPassword: string }} req
   * @returns null (BaseResponse.result = null)
   */
  updatePassword: (req) =>
    apiClient.patch('/api/user/mypage/password', req).then(unwrap),
}

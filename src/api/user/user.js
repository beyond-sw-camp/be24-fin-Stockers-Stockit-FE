/**
 * user.js — 사용자(user) 도메인 BE 연동
 *
 * BE 엔드포인트:
 *   POST /api/user/signup   (회원가입 신청, 누구나)
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
}

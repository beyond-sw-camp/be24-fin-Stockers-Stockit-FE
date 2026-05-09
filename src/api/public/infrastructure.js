/**
 * public/infrastructure.js — 비로그인 공개 인프라 조회 (회원가입용)
 *
 * BE 엔드포인트:
 *   GET /api/public/infrastructures        — 매장/창고 목록 (active만), type+region 필터
 *
 * 응답 (BaseResponse<List<PublicRes>>):
 *   result = [
 *     { code: 'WH-SL-0001', locationType: 'WAREHOUSE', name: '서울 도심 풀필먼트 허브', region: '서울' },
 *     ...
 *   ]
 *
 * 사용처:
 *   - SignupView.vue : 권역 선택 후 매장/창고 dropdown 동적 로드
 */

import { apiClient, unwrap } from '../axios.js'

export const publicInfrastructureApi = {
  /**
   * 비로그인 인프라 목록 조회.
   * @param {{ type?: 'STORE'|'WAREHOUSE', region?: string }} opts
   *   - type   : 'STORE' | 'WAREHOUSE' (HQ 는 BE 미정의, 호출 안 함)
   *   - region : 권역 한글명 (예: '서울', '경기' …) — DB region 컬럼과 매칭
   * @returns {Promise<Array<{ code: string, locationType: string, name: string, region: string }>>}
   */
  list: ({ type, region } = {}) =>
    apiClient
      .get('/api/public/infrastructures', { params: { type, region } })
      .then(unwrap),
}

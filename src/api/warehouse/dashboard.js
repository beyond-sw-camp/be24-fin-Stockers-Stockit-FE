/**
 * dashboard.js — BE 연동 (WHS-001 창고 관리자 대시보드)
 *
 * BE 엔드포인트:
 *   GET  /api/warehouse/dashboard/inbound-progress?from=&to=
 *
 * 응답: BaseResponse<InboundProgressRes>.
 *   result.kpi: { scheduledCount, completedCount, totalCount, progressRate, avgProcessingHours }
 *     - progressRate: 0~1 double
 *     - avgProcessingHours: createdAt → COMPLETED 평균 시간. 0건이면 null
 *     - totalCount: CANCELLED 제외 전체 (입고 파이프라인 분모)
 *   result.statusBreakdown: 7상태 모두 노출
 *
 * 자기 창고 데이터 격리는 BE 가 @AuthenticationPrincipal 의 locationCode 로 자동 처리 —
 * FE 는 warehouseId 박지 않음.
 */

import { apiClient, unwrap } from '../axios.js'

const BASE = '/api/warehouse/dashboard'

export const dashboardApi = {
  /**
   * @param {{from?: string, to?: string}} params
   */
  getInboundProgress: (params = {}) => {
    const query = {}
    if (params.from) query.from = params.from
    if (params.to) query.to = params.to
    return apiClient.get(`${BASE}/inbound-progress`, { params: query }).then(unwrap)
  },
}

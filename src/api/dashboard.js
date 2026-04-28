/**
 * dashboard.js — BE 연동 (WHS-001 창고 관리자 대시보드)
 *
 * BE 엔드포인트:
 *   GET  /api/warehouse/dashboard/inbound-progress?warehouseId=&from=&to=
 *
 * 응답: BaseResponse<InboundProgressRes>.
 *   result.kpi: { scheduledCount, completedCount, totalCount, progressRate, avgProcessingHours }
 *     - progressRate: 0~1 double
 *     - avgProcessingHours: createdAt → COMPLETED 평균 시간. 0건이면 null
 *     - totalCount: REJECTED 제외 전체 (입고 파이프라인 분모)
 *   result.statusBreakdown: { PENDING, APPROVED, SHIPPING, COMPLETED, REJECTED } 5키 모두 노출
 *
 * 인증 도입(ADR-011) 전 임시: warehouseId 는 옵셔널 query 파라미터.
 */

import { apiClient, unwrap } from './axios.js'

const BASE = '/api/warehouse/dashboard'

export const dashboardApi = {
  /**
   * @param {{warehouseId?: string, from?: string, to?: string}} params
   */
  getInboundProgress: (params = {}) => {
    const query = {}
    if (params.warehouseId) query.warehouseId = params.warehouseId
    if (params.from) query.from = params.from
    if (params.to) query.to = params.to
    return apiClient.get(`${BASE}/inbound-progress`, { params: query }).then(unwrap)
  },
}

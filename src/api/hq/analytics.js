/**
 * analytics.js — 본사 정산/통계 BE 연동
 *
 * BE 엔드포인트:
 *   GET /api/hq/analytics/sales       — 판매량 통계
 *   GET /api/hq/analytics/turnover    — 재고 회전율 (예정)
 *   GET /api/hq/analytics/order-stats — 발주량 (예정)
 *   GET /api/hq/analytics/vendors     — 순환재고 거래처 (예정)
 *   GET /api/hq/analytics/dashboard   — 통합 KPI (예정)
 */

import { apiClient, unwrap } from '../axios.js'

export const salesAnalyticsApi = {
  /**
   * 판매량 통계 조회.
   * @param {{ period: 'DAY'|'WEEK'|'MONTH'|'QUARTER'|'YEAR',
   *           from: string,            // 'YYYY-MM-DD'
   *           to: string,              // 'YYYY-MM-DD'
   *           storeCode?: string|null, // 'ST-SL-0001' 미지정 시 전사 통합
   *           mainCategory?: string|null }} params
   * @returns {Promise<object>} BE result (kpi/trend/categorySummary/...)
   */
  get: ({ period, from, to, storeCode = null, mainCategory = null } = {}) => {
    const params = { period, from, to }
    if (storeCode) params.storeCode = storeCode
    if (mainCategory) params.mainCategory = mainCategory
    return apiClient
      .get('/api/hq/analytics/sales', { params })
      .then(unwrap)
  },
}

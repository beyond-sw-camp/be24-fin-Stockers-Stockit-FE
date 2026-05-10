/**
 * analytics.js — 본사 정산/통계 BE 연동
 *
 * BE 엔드포인트:
 *   GET /api/hq/analytics/sales       — 판매량 통계
 *   GET /api/hq/analytics/order-stats — 발주량 통계
 *   GET /api/hq/analytics/turnover    — 재고 회전율 통계
 *   GET /api/hq/analytics/vendor      — 순환재고 거래처 통계
 *   GET /api/hq/analytics/dashboard   — 통합 KPI 대시보드
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

export const orderStatsAnalyticsApi = {
  /**
   * 발주량 통계 조회.
   * @param {{ period: 'MONTH'|'QUARTER'|'YEAR',
   *           from: string,           // 'YYYY-MM-DD'
   *           to: string,              // 'YYYY-MM-DD'
   *           category?: string|null }} params  // '상의'|'바지'|'치마'|'아우터' 또는 null(=전체)
   * @returns {Promise<object>} BE result (kpi/warehouseOrders/orderCycleData/productOrderData/monthlyTrend)
   */
  get: ({ period, from, to, category = null } = {}) => {
    const params = { period, from, to }
    if (category) params.category = category
    return apiClient
      .get('/api/hq/analytics/order-stats', { params })
      .then(unwrap)
  },
}

export const turnoverAnalyticsApi = {
  /**
   * 재고 회전율 통계 조회.
   * @param {{ period: 'DAY'|'MONTH'|'YEAR',
   *           from: string,
   *           to: string,
   *           scope?: 'ALL'|'STORE'|'WAREHOUSE',
   *           locationCode?: string|null }} params  // 특정 위치 한정 (예: 'ST-SL-0001')
   * @returns {Promise<object>} BE result (locationStats/inventoryHealth)
   */
  get: ({ period, from, to, scope = 'ALL', locationCode = null } = {}) => {
    const params = { period, from, to, scope }
    if (locationCode) params.locationCode = locationCode
    return apiClient
      .get('/api/hq/analytics/turnover', { params })
      .then(unwrap)
  },
}

export const vendorAnalyticsApi = {
  /**
   * 순환재고 거래처 통계 조회.
   * @param {{ period: 'MONTH'|'HALF_YEAR'|'YEAR',
   *           from: string,   // 'YYYY-MM-DD'
   *           to: string }} params
   * @returns {Promise<object>} BE result (kpi/vendors/circularMaterials)
   */
  get: ({ period, from, to } = {}) => {
    const params = { period, from, to }
    return apiClient
      .get('/api/hq/analytics/vendor', { params })
      .then(unwrap)
  },
}

export const dashboardAnalyticsApi = {
  /**
   * 통합 KPI 대시보드 조회.
   * @param {{ period: 'DAY'|'MONTH'|'YEAR',
   *           from: string,   // 'YYYY-MM-DD'
   *           to: string }} params
   * @returns {Promise<object>} BE result (fromDate/toDate/period/kpi/trendCurrent)
   */
  get: ({ period = 'YEAR', from, to } = {}) => {
    return apiClient
      .get('/api/hq/analytics/dashboard', { params: { period, from, to } })
      .then(unwrap)
  },
}

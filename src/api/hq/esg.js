/**
 * esg.js — 본사 ESG 도메인 BE 연동
 *
 * BE 엔드포인트:
 *   GET /api/hq/esg/carbon-price/latest   (KAU25 최신 시세 1건)
 *   GET /api/hq/esg/carbon-price/trend    (최근 2주 일별 시계열)
 *
 * 응답 형태(Snapshot):
 *   {
 *     pricePerTon: number,   // 원/톤
 *     symbol:      string,   // 'KAU25' (정상) 또는 'FALLBACK'
 *     basDt:       string,   // 'YYYYMMDD'
 *     fltRt:       string,   // 등락률(%)
 *     fallback:    boolean   // true 면 외부 API 실패 → 폴백값
 *   }
 */

import { apiClient, unwrap } from '../axios.js'

export const carbonPriceApi = {
  /**
   * 가장 최근 거래일의 KAU 종가 1건 (KPI 카드용).
   * @returns {Promise<{ pricePerTon: number, symbol: string, basDt: string, fltRt: string, fallback: boolean }>}
   */
  getLatest: () => apiClient.get('/api/hq/esg/carbon-price/latest').then(unwrap),

  /**
   * KAU25 일별 시세 시계열 (차트용).
   *  - SEVEN_DAYS: 최근 7거래일
   *  - ONE_MONTH:  최근 1개월
   *  - SIX_MONTHS: 최근 6개월 (KAU25 거래 활성 기간 거의 전체)
   *
   * @param {'SEVEN_DAYS'|'ONE_MONTH'|'SIX_MONTHS'} period
   */
  getTrend: (period = 'SEVEN_DAYS') =>
    apiClient.get('/api/hq/esg/carbon-price/trend', { params: { period } }).then(unwrap),
}

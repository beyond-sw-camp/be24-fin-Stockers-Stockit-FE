/**
 * esg.js — 본사 ESG 도메인 BE 연동
 *
 * BE 엔드포인트:
 *   GET  /api/hq/esg/carbon-price/latest   (KAU25 최신 시세 1건)
 *   GET  /api/hq/esg/carbon-price/trend    (최근 2주 일별 시계열)
 *   GET  /api/hq/esg/quota                 (자발적 탄소중립 — 할당/YTD/경고 임계 조회)
 *   PUT  /api/hq/esg/quota                 (할당/YTD/경고 임계 수기 저장)
 *
 * 응답 형태(Snapshot — carbon-price):
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

/**
 * 탄소중립 관리 (할당량 + 12개월 실효 배출 + 경고 임계)
 *
 * 응답 형태(Response):
 *   {
 *     fiscalYear:         number,
 *     yearlyAllocation:   number,
 *     monthlyEmissions:   (number|null)[12],   // 1월~12월, null = 미입력
 *     quarterlyEmissions: number[4],           // Q1~Q4 자동 합계
 *     ytdEmissions:       number,              // 12개월 합계 (자동)
 *     warnThresholdPct:   number,
 *     remaining:          number,              // 잔여 한도 = allocation - ytd
 *     utilizationPct:     number,              // 사용률 % = ytd / allocation × 100
 *     warning:            boolean,             // utilizationPct ≥ warnThresholdPct
 *     updatedBy:          string | null,
 *     updatedAt:          string               // ISO-8601
 *   }
 */
export const emissionQuotaApi = {
  /**
   * 회계연도별 할당량/월별 실적/경고 임계 조회.
   * BE 가 row 없으면 자동으로 기본값(0/null/75) 으로 새 row 생성 후 응답.
   * @param {number} [year] — 미지정 시 BE 가 현재 연도 자동 사용
   */
  get: (year) =>
    apiClient
      .get('/api/hq/esg/quota', { params: year ? { year } : {} })
      .then(unwrap),

  /**
   * 본사 관리자 수기 입력 — 수정 버튼 → 저장.
   * @param {number} [year]
   * @param {{ yearlyAllocation: number, monthlyEmissions: (number|null)[], warnThresholdPct: number }} payload
   */
  update: (year, payload) =>
    apiClient
      .put('/api/hq/esg/quota', payload, { params: year ? { year } : {} })
      .then(unwrap),
}

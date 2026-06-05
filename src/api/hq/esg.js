/**
 * esg.js — 본사 ESG 도메인 BE 연동
 *
 * BE 엔드포인트:
 *   GET  /api/hq/esg/carbon-price/latest   (KOC25-30 최신 시세 1건)
 *   GET  /api/hq/esg/carbon-price/trend    (최근 2주 일별 시계열)
 *   GET  /api/hq/esg/quota                 (자발적 탄소중립 — 할당/YTD/경고 임계 조회)
 *   PUT  /api/hq/esg/quota                 (할당/YTD/경고 임계 수기 저장)
 *
 * 응답 형태(Snapshot — carbon-price):
 *   {
 *     pricePerTon: number,   // 원/톤
 *     symbol:      string,   // 'KOC25-30' (정상) 또는 'FALLBACK'
 *     basDt:       string,   // 'YYYYMMDD'
 *     fltRt:       string,   // 등락률(%)
 *     fallback:    boolean   // true 면 외부 API 실패 → 폴백값
 *   }
 */

import { apiClient, unwrap } from '../axios.js'

export const carbonPriceApi = {
  /**
   * 가장 최근 거래일의 배출권 종가 1건 (KPI 카드용). 현재 target-symbol = KOC25-30.
   * @returns {Promise<{ pricePerTon: number, symbol: string, basDt: string, fltRt: string, fallback: boolean }>}
   */
  getLatest: () => apiClient.get('/api/hq/esg/carbon-price/latest').then(unwrap),

  /**
   * KOC25-30 일별 시세 시계열 (차트용).
   *  - SEVEN_DAYS: 최근 7거래일
   *  - ONE_MONTH:  최근 1개월
   *  - SIX_MONTHS: 최근 6개월
   *
   * @param {'SEVEN_DAYS'|'ONE_MONTH'|'SIX_MONTHS'} period
   */
  getTrend: (period = 'SEVEN_DAYS') =>
    apiClient.get('/api/hq/esg/carbon-price/trend', { params: { period } }).then(unwrap),

  /**
   * 월별 집계 시세 — 최근 N개월의 월말 종가 (BE 가 일별 응답을 월별로 group-by).
   *  - KOC25-30 처럼 거래일 드문 종목의 장기 트렌드 가시화에 적합
   *  - basDt 는 그 달의 가장 늦은 거래일 (YYYYMMDD)
   * @param {number} [months=12] — 최근 몇 개월치 (기본 12개월)
   */
  getMonthlyTrend: (months = 12) =>
    apiClient.get('/api/hq/esg/carbon-price/trend/monthly', { params: { months } }).then(unwrap),
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

/**
 * 순환재고 월별 판매 수익 — ESG 대시보드 "월별 판매 수익" 카드.
 *
 * 응답 형태:
 *   {
 *     year: 2026,
 *     monthly: [{ month, revenue, count }, ...12],
 *     totalRevenue: number,
 *     totalCount: number,
 *     monthsWithData: number,
 *     avgMonthly: number
 *   }
 */
export const circularRevenueApi = {
  /**
   * 지정 연도의 12개월 수익/거래 건수 집계 조회.
   * @param {number} [year] — 미지정 시 BE 가 현재 연도 사용
   */
  get: (year) =>
    apiClient
      .get('/api/hq/esg/circular-revenue', { params: year ? { year } : {} })
      .then(unwrap),
}

/**
 * 친환경 나무 키우기 점수 — 연간 sale 거래 이벤트 + 통계/차트 풀세트 (Phase 3 A''-1).
 *
 * 응답 형태:
 *   {
 *     year: 2026,
 *     events: [ // 페이지 슬라이스 (필터 적용 후)
 *       { id, date, type:'sale', buyer, material, weightKg,
 *         isNewBuyer, isLocalPartner, mainMaterialCode, mainMaterialRatio,
 *         saleExecution, carbon, newBuyer, localPartner, total, scoreValid }, ...
 *     ],
 *     summary:           { totalScore, saleExecutionSum, carbonSum, newBuyerSum, localPartnerSum,
 *                          totalEventCount, validEventCount, totalKg, avgScore },
 *     monthlyBreakdown:  [{ month: 1, score: ... }, ... 12개 고정 (필터 적용 후)],
 *     categoryBreakdown: { saleExecution, carbon, newBuyer, localPartner },
 *     page, size, totalElements, totalPages
 *   }
 *
 * 통계(summary/monthly/category)는 "필터 적용 후 전체" 기준 → 페이지 이동 시에도 차트/KPI 유지.
 */
export const scoreEventsApi = {
  /**
   * @param {object} [params]
   * @param {number} [params.year]
   * @param {number} [params.page=0]    — 0-based 페이지 번호
   * @param {number} [params.size=20]   — 페이지 크기 (서버에서 1~200 클램프)
   * @param {string} [params.dateFrom]  — 'yyyy-MM-dd'
   * @param {string} [params.dateTo]    — 'yyyy-MM-dd'
   * @param {'ALL'|'saleExecution'|'carbon'|'newBuyer'|'localPartner'} [params.category='ALL']
   */
  get: (params = {}) => {
    // 빈 값/undefined 는 url 에 포함하지 않도록 정리 — BE 가 defaultValue 로 처리
    const query = {}
    if (params.year != null)               query.year     = params.year
    if (params.page != null)               query.page     = params.page
    if (params.size != null)               query.size     = params.size
    if (params.dateFrom)                   query.dateFrom = params.dateFrom
    if (params.dateTo)                     query.dateTo   = params.dateTo
    if (params.category && params.category !== 'ALL') query.category = params.category
    return apiClient.get('/api/hq/esg/score-events', { params: query }).then(unwrap)
  },
}

/**
 * 소재 환산 계수 마스터 (Phase 1 BE 이관).
 *  - FE 가 ESG 페이지 진입 시 1회 호출 → esgStore.materialFactors 캐싱
 *  - 본사 운영자가 material.carbon_factor 만 갱신해도 FE 재배포 없이 즉시 반영
 *  - 자체 산정 계수 (2026-05-27 재조정)
 *
 * 응답 형태:
 *   {
 *     factors: [
 *       { code: 'COTTON', label: '면', group: 'NATURAL_SINGLE', factor: 1.800 },
 *       { code: 'POLYESTER', label: '폴리에스터', group: 'SYNTHETIC', factor: 2.300 },
 *       { code: 'BLEND', label: '혼방', group: 'BLEND', factor: 2.000 },
 *       ...
 *     ]
 *   }
 */
export const materialFactorsApi = {
  get: () => apiClient.get('/api/hq/esg/material-factors').then(unwrap),
}

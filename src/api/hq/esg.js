/**
 * esg.js — BE 연동 지점 주석 스텁
 *
 * BE에서 ESG/배출권 관련 Controller/Service가 완성되면
 * 이 파일의 각 함수를 실제 axios 호출로 채우고,
 * stores/esg.js의 fetchKauPrice action에서 import하여 호출하도록 교체한다.
 *
 * 기본 axios 인스턴스: src/api/axios.js (BE 연동 시 신설 예정)
 * baseURL: http://localhost:8080
 */

// ─────────────────────────────────────────────
// 배출권(KAU) 시세 관련 API
// ─────────────────────────────────────────────

/**
 * KAU(Korean Allowance Unit) 최신 시세 조회
 * GET /api/v1/esg/kau-price
 *
 * BE는 KRX 배출권 시장(ets.krx.co.kr) 또는 공공데이터포털 배출권 시세 정보 API에서
 * 가져온 최신 시세를 일/시간 단위로 캐싱하여 응답한다.
 *
 * @returns {Promise<{ price: number, updatedAt: string, source: string }>}
 *   price     - tCO₂당 원화 가격 (KRW)
 *   updatedAt - ISO8601 (시세 기준 시각)
 *   source    - 'KRX' | 'data.go.kr' | 기타
 */
// export async function getKauPrice() {
//   const res = await axios.get('/api/v1/esg/kau-price')
//   return res.data.result
// }

/**
 * KAU 시세 이력 조회 (월별/일별 추이용)
 * GET /api/v1/esg/kau-price/history?from=&to=&interval=
 *
 * @param {{ from: string, to: string, interval?: 'day'|'month' }} params
 * @returns {Promise<Array<{ date: string, price: number }>>}
 */
// export async function getKauPriceHistory(params = {}) {
//   const res = await axios.get('/api/v1/esg/kau-price/history', { params })
//   return res.data.result
// }

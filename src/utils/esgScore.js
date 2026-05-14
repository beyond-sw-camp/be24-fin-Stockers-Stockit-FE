/**
 * esgScore.js — ESG 점수 계산 공용 로직.
 *
 * 사용처:
 *   - EsgTreeScoreView : 친환경 나무 키우기 점수 상세 페이지 (5종 카테고리/이벤트 분해)
 *   - esgStore         : ESG 대시보드 헤더 누적 ESG 점수 동기화 (fetchTotalPoints)
 *
 * 데이터 소스:
 *   - sale events     : BE 연동 (GET /api/hq/esg/score-events)
 *   - donation events : BE 도메인 미구현 → MOCK_DONATION_EVENTS 머지
 *
 * 룰 마스터 (FE 단일 진실 원본):
 *   - 향후 BE 이관 시 GET /api/hq/esg/score-rules 로 fetch 가능
 */

// ─────────── 점수 룰 ───────────
export const SCORE_RULES = {
  saleBase: 100,              // 판매 1건 기본 점수
  donationBase: 80,           // 기부 1건 기본 점수
  minWeightKg: 10,            // 최소 중량 (이하면 점수 부여 X)
  newBuyerBonus: 150,         // 신규 거래처 첫 거래 보너스
  localPartnerBonus: 150,     // 지역 파트너 보너스 (월 3건 cap, FE 미적용)
}

// 탄소 점수 스케일링 (다른 점수 요소와의 비중 균형)
export const CARBON_SCALE = 0.5

// ─────────── 소재 계수 (kgCO₂/kg) ───────────
//   - circular_material_price_policy 시드와 정합
//   - 향후 BE GET /api/hq/esg/material-factors 로 교체 가능
export const MATERIAL_FACTORS = {
  COTTON:     { label: '면',         group: 'NATURAL_SINGLE', factor: 1.8 },
  WOOL:       { label: '울',         group: 'NATURAL_SINGLE', factor: 2.5 },
  CASHMERE:   { label: '캐시미어',   group: 'NATURAL_SINGLE', factor: 5.8 },
  SILK:       { label: '실크',       group: 'NATURAL_SINGLE', factor: 3.2 },
  LINEN:      { label: '린넨',       group: 'NATURAL_SINGLE', factor: 1.1 },
  POLYESTER:  { label: '폴리에스터', group: 'SYNTHETIC',      factor: 2.3 },
  ACRYLIC:    { label: '아크릴',     group: 'SYNTHETIC',      factor: 2.2 },
  POLYAMIDE:  { label: '나일론',     group: 'SYNTHETIC',      factor: 2.1 },
  NYLON:      { label: '나일론',     group: 'SYNTHETIC',      factor: 2.1 },
  ELASTANE:   { label: '스판덱스',   group: 'SYNTHETIC',      factor: 2.5 },
  BLEND:      { label: '혼방',       group: 'BLEND',          factor: 2.0 },
}

// ─────────── Mock 기부 이벤트 (BE 도메인 미구현 — 향후 donation_history 테이블로 교체) ───────────
export const MOCK_DONATION_EVENTS = [
  { id: 'd-1', date: '2026-04-28', type: 'donation', buyer: '재해구호본부',  material: 'COTTON',    weightKg:  95, isNewBuyer: false, isLocalPartner: false, donationType: 'DISASTER',  method: null },
  { id: 'd-2', date: '2026-04-22', type: 'donation', buyer: '사회복지시설',  material: 'COTTON',    weightKg:  80, isNewBuyer: false, isLocalPartner: false, donationType: 'VULNERABLE',method: null },
  { id: 'd-3', date: '2026-04-14', type: 'donation', buyer: '해외구호단체',  material: 'POLYESTER', weightKg:  50, isNewBuyer: false, isLocalPartner: false, donationType: 'OVERSEAS',  method: null },
  { id: 'd-4', date: '2026-04-05', type: 'donation', buyer: '직업학교',      material: 'BLEND',     weightKg:  30, isNewBuyer: false, isLocalPartner: false, donationType: 'EDU',       method: null },
  { id: 'd-5', date: '2026-03-12', type: 'donation', buyer: '재해구호본부',  material: 'COTTON',    weightKg:  60, isNewBuyer: false, isLocalPartner: false, donationType: 'DISASTER',  method: null },
  { id: 'd-6', date: '2026-01-12', type: 'donation', buyer: '직업학교',      material: 'BLEND',     weightKg:  40, isNewBuyer: false, isLocalPartner: false, donationType: 'EDU',       method: null },
]

/**
 * BE 응답 sale event 를 FE event 형태로 정규화.
 *   - Jackson+Lombok 직렬화 quirk 대응 (isNewBuyer → newBuyer)
 */
export function normalizeSaleEvent(e) {
  return {
    id: e.id,
    date: e.date,
    type: 'sale',
    buyer: e.buyer,
    material: e.material,
    weightKg: e.weightKg,
    isNewBuyer: e.isNewBuyer ?? e.newBuyer ?? false,
    isLocalPartner: e.isLocalPartner ?? e.localPartner ?? false,
    donationType: null,
    method: null,
  }
}

/**
 * 이벤트 1건 → 5종 점수 분해.
 *   - 무게 10kg 미만은 점수 부여 X (어뷰징 방지)
 *   - 탄소 점수 = weight × material_factor × CARBON_SCALE
 */
export function calcEventScore(e) {
  const valid = e.weightKg >= SCORE_RULES.minWeightKg
  const factor = MATERIAL_FACTORS[e.material]?.factor ?? 0
  if (e.type === 'sale') {
    if (!valid) return { saleExecution: 0, carbon: 0, newBuyer: 0, localPartner: 0, donationExecution: 0, total: 0, valid: false }
    const saleExecution = SCORE_RULES.saleBase
    const carbon = Math.round(e.weightKg * factor * CARBON_SCALE)
    const newBuyer = e.isNewBuyer ? SCORE_RULES.newBuyerBonus : 0
    const localPartner = e.isLocalPartner ? SCORE_RULES.localPartnerBonus : 0
    const total = saleExecution + carbon + newBuyer + localPartner
    return { saleExecution, carbon, newBuyer, localPartner, donationExecution: 0, total, valid: true }
  }
  // donation
  if (!valid) return { saleExecution: 0, carbon: 0, newBuyer: 0, localPartner: 0, donationExecution: 0, total: 0, valid: false }
  const donationExecution = SCORE_RULES.donationBase
  const carbon = Math.round(e.weightKg * factor * CARBON_SCALE)
  return { saleExecution: 0, carbon, newBuyer: 0, localPartner: 0, donationExecution, total: donationExecution + carbon, valid: true }
}

/** events 배열 → 누적 ESG 점수 (5종 합산) */
export function computeTotalScore(events) {
  let total = 0
  for (const e of events ?? []) {
    total += calcEventScore(e).total
  }
  return total
}

/**
 * 실제 탄소 배출 절감량 (kg CO₂) — 점수용 CARBON_SCALE 미적용.
 *   - 각 이벤트의 weight × material_factor 합산
 *   - 의미: 폐기·소각되지 않고 순환재고로 회피한 실제 탄소량
 */
export function computeCarbonReductionKg(events) {
  let total = 0
  for (const e of events ?? []) {
    const factor = MATERIAL_FACTORS[e.material]?.factor ?? 0
    total += Math.round((Number(e.weightKg) || 0) * factor)
  }
  return total
}

/** events 배열 → 1~12월 탄소 절감량 (kg CO₂) 12개 버킷 */
export function computeMonthlyCarbonReduction(events) {
  const buckets = Array(12).fill(0)
  for (const e of events ?? []) {
    const d = new Date(e.date)
    if (Number.isNaN(d.getTime())) continue
    const m = d.getMonth()
    const factor = MATERIAL_FACTORS[e.material]?.factor ?? 0
    buckets[m] += Math.round((Number(e.weightKg) || 0) * factor)
  }
  return buckets
}

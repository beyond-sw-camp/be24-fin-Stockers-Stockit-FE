/**
 * esgScore.js — ESG 점수 계산 공용 로직.
 *
 * Phase 2 BE 이관 완료 후 구조:
 *   - 점수 산식의 SSOT 는 BE (ScoreEventsService) — saleExecution / carbon / newBuyer / localPartner / total / scoreValid
 *     모두 BE 응답값을 그대로 사용
 *   - FE 의 carbon 절감량 계산 함수들 (computeCarbonReductionByMaterial 등) 은
 *     ESG 대시보드 "순환 활동 탄소 감축 현황" 막대 그래프 / 월별 추이 표시용으로 유지
 *     → effective factor 룩업은 store 의 materialFactors (BE 마스터) 우선, 폴백 FE 상수
 *
 * 사용처:
 *   - EsgTreeScoreView : 친환경 나무 키우기 점수 상세 페이지 (4종 카테고리/이벤트 분해)
 *   - esgStore         : ESG 대시보드 헤더 누적 ESG 점수 동기화 (fetchTotalPoints)
 *
 * 데이터 소스:
 *   - sale events       : BE 연동 (GET /api/hq/esg/score-events) — 점수 4종 포함
 *   - material factors  : BE 연동 (GET /api/hq/esg/material-factors) — Phase 1 이관 완료
 */

// ─────────── 점수 룰 (FE fallback / 디스플레이용 — BE 산식과 동일) ───────────
export const SCORE_RULES = {
  saleBase: 100,              // 판매 1건 기본 점수
  minWeightKg: 10,            // 최소 중량 (이하면 점수 부여 X)
  newBuyerBonus: 150,         // 신규 거래처 첫 거래 보너스
  localPartnerBonus: 150,     // 지역 파트너 보너스
}

// 탄소 점수 스케일링 — Phase 2: 0.5 → 0.1 (Higg MSI 표준값 적용에 따른 균형)
export const CARBON_SCALE = 0.1

// ─────────── 소재 계수 (kgCO₂e/kg) — Phase 1 BE 이관 후 fallback ───────────
//   - 정상 동작 시 esgStore.materialFactors (BE 응답) 사용
//   - BE 응답 실패 / 신규 진입 직후 짧은 순간만 본 상수가 사용됨
//   - 값은 Phase 1 옵션 B (Higg MSI v3 / EU PEF 표준 + cap) 와 동일하게 동기화
export const MATERIAL_FACTORS = {
  COTTON:     { label: '면',         group: 'NATURAL_SINGLE', factor: 6.0 },
  WOOL:       { label: '울',         group: 'NATURAL_SINGLE', factor: 5.0 },
  CASHMERE:   { label: '캐시미어',   group: 'NATURAL_SINGLE', factor: 8.0 },
  SILK:       { label: '실크',       group: 'NATURAL_SINGLE', factor: 5.0 },
  LINEN:      { label: '린넨',       group: 'NATURAL_SINGLE', factor: 1.8 },
  POLYESTER:  { label: '폴리에스터', group: 'SYNTHETIC',      factor: 6.5 },
  ACRYLIC:    { label: '아크릴',     group: 'SYNTHETIC',      factor: 5.7 },
  POLYAMIDE:  { label: '나일론',     group: 'SYNTHETIC',      factor: 8.0 },
  NYLON:      { label: '나일론',     group: 'SYNTHETIC',      factor: 8.0 },
  ELASTANE:   { label: '스판덱스',   group: 'SYNTHETIC',      factor: 12.0 },
  RAYON:      { label: '레이온',     group: 'SYNTHETIC',      factor: 4.5 },
  BLEND:      { label: '혼방',       group: 'BLEND',          factor: 5.5 },
}

// 소재별 고정 색 매핑 — ESG 대시보드 "순환 활동 탄소 감축 현황" 카드 +
//   순환재고 판매 통계 페이지(HqAnalyticsVendorView)의 도넛/막대 차트 공유
//   동일 소재가 두 페이지에서 항상 같은 색으로 표시되도록 보장
export const MATERIAL_COLORS = {
  COTTON:    '#059669',  // emerald-600  (면)
  WOOL:      '#0ea5e9',  // sky-500      (울)
  CASHMERE:  '#f59e0b',  // amber-500    (캐시미어)
  SILK:      '#a855f7',  // purple-500   (실크)
  LINEN:     '#ef4444',  // red-500      (린넨)
  POLYESTER: '#10b981',  // emerald-500  (폴리에스터)
  ACRYLIC:   '#3b82f6',  // blue-500     (아크릴)
  POLYAMIDE: '#eab308',  // yellow-500   (나일론)
  NYLON:     '#eab308',  // yellow-500   (나일론)
  ELASTANE:  '#c084fc',  // purple-400   (스판덱스)
  RAYON:     '#0d9488',  // teal-600     (레이온 — 셀룰로스 재생 섬유, 자연-인조 중간 톤)
  BLEND:     '#f87171',  // red-400      (혼방)
}
export const MATERIAL_COLOR_FALLBACK = '#94a3b8'  // slate-400 (미매핑 소재용)

/**
 * BE 응답 sale event 를 FE event 형태로 정규화.
 *   - Jackson+Lombok 직렬화 quirk 대응 (isNewBuyer → newBuyer)
 *   - Phase 2: BE 가 계산한 점수 4종(saleExecution/carbon/newBuyer/localPartner/total/scoreValid)
 *     + 혼방 메타(mainMaterialCode/mainMaterialRatio) 도 보존
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
    // Phase 2: 혼방 거래 70% 주 소재 메타 (단일 거래는 null)
    mainMaterialCode: e.mainMaterialCode ?? null,
    mainMaterialRatio: e.mainMaterialRatio != null ? Number(e.mainMaterialRatio) : null,
    // Phase 2: BE 가 계산한 거래별 점수 4종 + total + scoreValid
    //   BE 응답이 항상 채워지지만 fallback 으로 nullish 체크 후 0 사용
    saleExecution: e.saleExecution ?? null,
    carbon: e.carbon ?? null,
    newBuyerScore: e.newBuyer ?? null,
    localPartnerScore: e.localPartner ?? null,
    total: e.total ?? null,
    scoreValid: e.scoreValid ?? null,
  }
}

/**
 * 거래의 effective carbon factor 산출 (kgCO₂e/kg).
 *   - 혼방 (material='BLEND' + mainMaterialCode 존재): mainFactor × mainRatio (0.7)
 *   - 단일 (또는 main 누락된 BLEND): 자기 material 의 factor
 *
 * @param {object} e          거래 이벤트 (normalizeSaleEvent 결과)
 * @param {object} [factors]  factor 룩업 맵 (BE 응답 또는 FE 상수). { CODE: { factor, ... } }
 */
export function resolveEffectiveFactor(e, factors = MATERIAL_FACTORS) {
  if (!e) return 0
  if (e.material === 'BLEND' && e.mainMaterialCode && e.mainMaterialRatio != null) {
    const mainFactor = Number(factors?.[e.mainMaterialCode]?.factor) || 0
    return mainFactor * Number(e.mainMaterialRatio)
  }
  return Number(factors?.[e.material]?.factor) || 0
}

/**
 * 이벤트 1건 → 4종 점수 분해 (판매 전용).
 *   - Phase 2: BE 응답 점수값을 우선 사용 (event.saleExecution / carbon / ... / total / scoreValid)
 *   - BE 미응답 시 FE 자체 계산 (fallback)
 */
export function calcEventScore(e, factors = MATERIAL_FACTORS) {
  // ── Phase 2 우선: BE 응답값 그대로 사용 ──
  if (e?.total != null && e?.scoreValid != null) {
    return {
      saleExecution: e.saleExecution ?? 0,
      carbon: e.carbon ?? 0,
      newBuyer: e.newBuyerScore ?? 0,
      localPartner: e.localPartnerScore ?? 0,
      total: e.total ?? 0,
      valid: e.scoreValid === true,
    }
  }
  // ── Fallback: FE 자체 계산 (BE 산식과 동일 — Higg MSI factor × CARBON_SCALE 0.1) ──
  const valid = e?.weightKg >= SCORE_RULES.minWeightKg
  if (!valid) return { saleExecution: 0, carbon: 0, newBuyer: 0, localPartner: 0, total: 0, valid: false }
  const factor = resolveEffectiveFactor(e, factors)
  const saleExecution = SCORE_RULES.saleBase
  const carbon = Math.round(e.weightKg * factor * CARBON_SCALE)
  const newBuyer = e.isNewBuyer ? SCORE_RULES.newBuyerBonus : 0
  const localPartner = e.isLocalPartner ? SCORE_RULES.localPartnerBonus : 0
  const total = saleExecution + carbon + newBuyer + localPartner
  return { saleExecution, carbon, newBuyer, localPartner, total, valid: true }
}

/** events 배열 → 누적 ESG 점수 (4종 합산) */
export function computeTotalScore(events, factors = MATERIAL_FACTORS) {
  let total = 0
  for (const e of events ?? []) {
    total += calcEventScore(e, factors).total
  }
  return total
}

/**
 * 실제 탄소 배출 절감량 (kg CO₂) — 점수용 CARBON_SCALE 미적용.
 *   - Phase 2: 혼방은 mainFactor × ratio 가중 적용
 *   - 의미: 폐기·소각되지 않고 순환재고로 회피한 실제 탄소량
 */
export function computeCarbonReductionKg(events, factors = MATERIAL_FACTORS) {
  let total = 0
  for (const e of events ?? []) {
    const factor = resolveEffectiveFactor(e, factors)
    total += Math.round((Number(e.weightKg) || 0) * factor)
  }
  return total
}

/**
 * events 배열 → 개별 소재별 탄소 절감량 (kg CO₂) 버킷
 *   - 모든 factors 키에 대해 합산
 *   - 의미: ESG 대시보드 "순환 활동 탄소 감축 현황" 카드의 막대 게이지용 (소재 전체)
 *   - Phase 2 정책: 혼방 거래의 weight 는 BLEND 막대에 누적 (별도 카테고리 유지)
 *     단, factor 는 mainFactor × ratio 가중 적용 → 막대 길이가 합리적으로 표시됨
 */
export function computeCarbonReductionByMaterial(events, factors = MATERIAL_FACTORS) {
  const buckets = {}
  for (const key of Object.keys(factors)) buckets[key] = 0
  for (const e of events ?? []) {
    if (!factors[e?.material]) continue
    const factor = resolveEffectiveFactor(e, factors)
    const reduction = Math.round((Number(e.weightKg) || 0) * factor)
    if (buckets[e.material] != null) buckets[e.material] += reduction
  }
  return buckets
}

/**
 * events 배열 → 소재 그룹별 탄소 절감량 (kg CO₂) 버킷
 *   - NATURAL_SINGLE: 면(COTTON), 울, 실크, 캐시미어, 린넨
 *   - SYNTHETIC: 폴리에스터, 아크릴, 나일론, 스판덱스, 레이온
 *   - BLEND: 혼방 (mainFactor × 0.7 가중치 적용된 effective factor 사용)
 */
export function computeCarbonReductionByGroup(events, factors = MATERIAL_FACTORS) {
  const buckets = { NATURAL_SINGLE: 0, SYNTHETIC: 0, BLEND: 0 }
  for (const e of events ?? []) {
    const info = factors[e?.material]
    if (!info) continue
    const factor = resolveEffectiveFactor(e, factors)
    const reduction = Math.round((Number(e.weightKg) || 0) * factor)
    if (buckets[info.group] != null) buckets[info.group] += reduction
  }
  return buckets
}

/** events 배열 → 1~12월 탄소 절감량 (kg CO₂) 12개 버킷 */
export function computeMonthlyCarbonReduction(events, factors = MATERIAL_FACTORS) {
  const buckets = Array(12).fill(0)
  for (const e of events ?? []) {
    const d = new Date(e.date)
    if (Number.isNaN(d.getTime())) continue
    const m = d.getMonth()
    const factor = resolveEffectiveFactor(e, factors)
    buckets[m] += Math.round((Number(e.weightKg) || 0) * factor)
  }
  return buckets
}

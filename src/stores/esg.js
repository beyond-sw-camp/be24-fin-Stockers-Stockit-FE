import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { carbonPriceApi, scoreEventsApi, materialFactorsApi } from '@/api/hq/esg.js'
// Phase 3 B 이관 후: 점수 합산/카본 분포는 BE 응답을 그대로 사용 → 계산 함수 import 폐기.
// MATERIAL_FACTORS 만 시드 fallback 용으로 유지.
import { MATERIAL_FACTORS } from '@/utils/esgScore.js'

// ESG 나무 단계 임계값 (Curved 곡선, 게임화 자연스러움)
//  - Lv.1 ~ Lv.10 까지 10단계
//  - Lv.10 도달 = 1,500,000 pt (만점)
//  - 초반엔 빠르게 진급 (동기부여), 후반엔 천천히 (도전감)
//  - 산식: pts >= STAGE_THRESHOLDS[i] 인 가장 큰 i 가 (i+1) 단계
const STAGE_THRESHOLDS = [
  0,         // Lv.1 — 씨앗 (시작)
  5000,      // Lv.2
  20000,     // Lv.3
  50000,     // Lv.4
  100000,    // Lv.5
  200000,    // Lv.6
  350000,    // Lv.7
  600000,    // Lv.8
  1000000,   // Lv.9
  1500000,   // Lv.10 — 결실의 나무 (만점)
]
const MAX_STAGE = STAGE_THRESHOLDS.length   // 10
// Lv.10 만점 임계값 — 1,500,000pt 도달 시 결실의 나무 완성 (Lv.10 표시)
const MAX_LEVEL_POINTS = STAGE_THRESHOLDS[MAX_STAGE - 1]   // 1,500,000
// 사이클 한 바퀴 = 1그루 완성 — 만점 1,500,000 + 결실 익는 보너스 500,000 = 2,000,000pt
// 매 사이클마다 그루 +1 + Lv.1 씨앗으로 리셋
const FULL_TREE_POINTS = 2_000_000

// BE 응답 실패 시 폴백 가격 (BE 의 esg.carbon-api.fallback-price 와 동기화: 13,000 — KOC25-30 최근 종가)
// NOTE: 변수명은 옵션 A 정책으로 kau 유지 (DB 스냅샷 필드 kocPriceAtSale 호환). 실제 값은 KOC25-30 시세 기준.
const KOC_FALLBACK_PRICE = 13000

export const useEsgStore = defineStore('esg', () => {
  // 초기 0 → fetchTotalPoints() 호출 시 BE sale events 기반으로 자동 계산
  const totalPoints = ref(0)
  const totalPointsLoading = ref(false)
  const totalPointsError = ref(null)

  // 순환재고 총 판매량 (kg) — TreeScore stats.totalKg 와 동일 값
  // fetchTotalPoints 시 자동 갱신 + TreeScore 페이지 watcher 로도 sync
  const totalSalesKg = ref(0)

  // 실제 탄소 배출 절감량 (kg CO₂) — SUM(weight × material_factor), 별도 보정계수 없음
  // ESG 대시보드 KPI "탄소 배출 절감" + 탄소중립 "절감한 탄소 배출량" 카드 공유
  const totalCarbonReductionKg = ref(0)
  // 월별 탄소 절감량 (kg CO₂) 12개 — 전월 대비 변동률 계산용
  const carbonReductionMonthly = ref(Array(12).fill(0))

  // 소재 그룹별 탄소 절감량 (kg CO₂)
  const carbonReductionByGroupKg = ref({ NATURAL_SINGLE: 0, SYNTHETIC: 0, BLEND: 0 })

  // 개별 소재별 탄소 절감량 (kg CO₂) — "순환 활동 탄소 감축 현황" 카드용
  // 키: COTTON / WOOL / CASHMERE / SILK / LINEN / POLYESTER / ACRYLIC / NYLON / POLYAMIDE / ELASTANE / BLEND
  const carbonReductionByMaterialKg = ref({})

  const kocPrice = ref(KOC_FALLBACK_PRICE)
  const kocPriceUpdatedAt = ref(null)
  const kocPriceLoading = ref(false)
  const kocPriceError = ref(null)

  // Phase 1: 소재 환산 계수 마스터 (BE 응답 캐싱)
  //  - shape: { COTTON: { label, group, factor }, ... } — FE esgScore.js 의 MATERIAL_FACTORS 와 동일 키 구조
  //  - 초기값은 FE 상수로 시드 → BE 응답 도착 후 덮어씀 → 첫 페이지 로드 짧은 순간에도 산식 작동
  const materialFactors = ref({ ...MATERIAL_FACTORS })
  const materialFactorsLoaded = ref(false)
  const materialFactorsLoading = ref(false)
  const materialFactorsError = ref(null)

  // 탄소 배출 절감량 (tCO₂) — 보기 쉬운 단위
  const totalCarbonReductionTon = computed(() => totalCarbonReductionKg.value / 1000)

  // 전월 대비 탄소 절감 변동률 (%) — 데이터 있는 가장 최근 월 vs 그 전월
  // 양쪽 다 0 이면 0% 반환
  const carbonReductionDeltaPct = computed(() => {
    const arr = carbonReductionMonthly.value
    // 가장 최근 데이터 있는 월 인덱스
    let lastIdx = -1
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] > 0) { lastIdx = i; break }
    }
    if (lastIdx <= 0) return 0
    const curr = arr[lastIdx]
    const prev = arr[lastIdx - 1]
    if (prev === 0) return 0
    return Number((((curr - prev) / prev) * 100).toFixed(1))
  })

  // 키운 나무 그루 수 — 매 사이클 (2,000,000pt) 완료마다 +1
  // 예: totalPoints=4,500,000 → 2그루 + 사이클 내 500,000pt (Lv.7)
  const treeCount = computed(() => Math.floor(totalPoints.value / FULL_TREE_POINTS))

  // 사이클 내 점수 — 0 ~ 1,999,999 사이 (2,000,000 도달 시 0 으로 리셋, 그루+1)
  const cyclePoints = computed(() => totalPoints.value % FULL_TREE_POINTS)

  // 현재 단계 — cyclePoints 기준으로 Lv.1~10 매칭
  //  - cyclePoints < 1,500,000 : STAGE_THRESHOLDS 기준 Lv.1~Lv.9
  //  - cyclePoints >= 1,500,000 : Lv.10 만점 (결실 익는 보너스 구간)
  const stage = computed(() => {
    const pts = cyclePoints.value
    for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
      if (pts >= STAGE_THRESHOLDS[i]) return i + 1
    }
    return 1
  })

  // 현재 단계 내 진행률 (%)
  //  - Lv.10 : "결실 익는 진행률" = (cyclePoints - 1,500,000) / 500,000
  //  - 그 외 : 다음 단계 임계값까지의 비율
  const stageProgress = computed(() => {
    if (stage.value >= MAX_STAGE) {
      // Lv.10 결실 익는 구간 — cyclePoints 1,500,000~1,999,999 → 0~100%
      return Math.min(100, ((cyclePoints.value - MAX_LEVEL_POINTS) / (FULL_TREE_POINTS - MAX_LEVEL_POINTS)) * 100)
    }
    const curr = STAGE_THRESHOLDS[stage.value - 1]
    const next = STAGE_THRESHOLDS[stage.value]
    if (next <= curr) return 100  // 안전 폴백 (배열 오류 대비)
    return Math.min(100, ((cyclePoints.value - curr) / (next - curr)) * 100)
  })

  // 다음 단계까지 남은 점수
  //  - Lv.10 : 그루+1 (다음 사이클 시작) 까지 남은 점수
  //  - 그 외 : 다음 단계 임계값까지 남은 점수
  const pointsToNext = computed(() => {
    if (stage.value >= MAX_STAGE) {
      return Math.max(0, FULL_TREE_POINTS - cyclePoints.value)
    }
    return Math.max(0, STAGE_THRESHOLDS[stage.value] - cyclePoints.value)
  })

  /**
   * 배출권 최신 종가를 BE 에서 조회 (현재 target-symbol = KOC25-30).
   *  - 정상: carbonPriceApi.getLatest() 응답으로 kocPrice 갱신
   *  - 폴백/실패: kocPrice 는 직전값(또는 KOC_FALLBACK_PRICE)을 유지하고 에러만 기록
   */
  async function fetchKocPrice() {
    kocPriceLoading.value = true
    kocPriceError.value = null
    try {
      const res = await carbonPriceApi.getLatest()
      if (res?.pricePerTon != null) {
        kocPrice.value = Number(res.pricePerTon)
      }
      kocPriceUpdatedAt.value = new Date().toISOString()
      return res
    } catch (e) {
      kocPriceError.value = e?.message ?? '시세 조회 실패'
    } finally {
      kocPriceLoading.value = false
    }
  }

  function setKocPrice(price, updatedAt = new Date().toISOString()) {
    kocPrice.value = price
    kocPriceUpdatedAt.value = updatedAt
  }

  /**
   * 소재 환산 계수 마스터를 BE 에서 1회 조회 (Phase 1 BE 이관).
   *  - 이미 로드되어 있으면 재요청 X (캐싱)
   *  - 응답: { factors: [{ code, label, group, factor }, ...] }
   *  - 내부 shape 으로 변환: { CODE: { label, group, factor } }
   *
   * @param {boolean} [force=false] true 이면 캐싱 무시하고 재조회
   */
  // BE material.material_group 어휘 → FE MATERIAL_FACTORS group 키 정규화 매핑.
  //  - BE 는 ProductMasterService.MATERIAL_GROUP_NATURAL='NATURAL' 상수 호환을 위해 'NATURAL' 사용
  //  - FE 는 'NATURAL_SINGLE' 키로 통일 (esgScore.js MATERIAL_FACTORS / computeCarbonReductionByGroup)
  //  - 미매핑 그룹은 그대로 통과 (SYNTHETIC, BLEND)
  const GROUP_NORMALIZATION = {
    NATURAL: 'NATURAL_SINGLE',
  }

  async function fetchMaterialFactors(force = false) {
    if (materialFactorsLoaded.value && !force) return materialFactors.value
    materialFactorsLoading.value = true
    materialFactorsError.value = null
    try {
      const res = await materialFactorsApi.get()
      const map = {}
      for (const it of res?.factors ?? []) {
        if (!it?.code) continue
        map[it.code] = {
          label: it.label,
          // BE 의 'NATURAL' 을 FE 의 'NATURAL_SINGLE' 로 정규화 (어휘 통일)
          group: GROUP_NORMALIZATION[it.group] ?? it.group,
          factor: Number(it.factor) || 0,
        }
      }
      // BE 응답 키와 FE 상수 키가 다를 경우 FE 의 NYLON alias (POLYAMIDE 와 동일 label) 같은 호환성은 유지.
      // 누락된 키는 FE 상수에서 보강해서 막대 그래프 등 다른 의존부 깨지지 않도록 함.
      materialFactors.value = { ...MATERIAL_FACTORS, ...map }
      materialFactorsLoaded.value = true
      return materialFactors.value
    } catch (e) {
      materialFactorsError.value = e?.message ?? '소재 계수 조회 실패'
      // 실패해도 FE 상수가 fallback 으로 작동
      return materialFactors.value
    } finally {
      materialFactorsLoading.value = false
    }
  }

  /**
   * BE sale events + 통계 + 카본 분포를 한 번에 받아서 store 갱신 (Phase 3 B).
   *  - 점수 산식 SSOT: BE (summary.totalScore)
   *  - 카본 분포 SSOT: BE (carbonReduction.{byMaterial,byGroup,monthly,total}) — Phase 3 B 이관
   *  - 페이지 슬라이스 (events) 는 store 에서 사용하지 않음. 통계/분포 묶음만 사용.
   *  - 그래서 size=1 로 호출해서 events 페이로드 최소화 + 통계 그대로 받음.
   *    (BE 가 통계는 "필터 적용 후 전체" 기준이라 페이지 size 와 무관하게 동일 값 반환)
   */
  async function fetchTotalPoints(year) {
    totalPointsLoading.value = true
    totalPointsError.value = null
    try {
      const targetYear = year ?? new Date().getFullYear()
      // 소재 마스터 선로딩 (다른 화면에서 라벨/group 표시용으로도 사용)
      await fetchMaterialFactors()
      // size=1 → 통계는 받되 events 페이로드는 1건만 (대시보드는 events 불필요)
      const res = await scoreEventsApi.get({ year: targetYear, size: 1 })

      // 점수/판매량 — BE summary 직접 사용 (FE 자체 합산 폐기)
      totalPoints.value  = Number(res?.summary?.totalScore || 0)
      totalSalesKg.value = Number(res?.summary?.totalKg || 0)

      // 카본 분포 — BE carbonReduction 직접 할당
      const cr = res?.carbonReduction
      carbonReductionByMaterialKg.value = cr?.byMaterial ?? {}
      carbonReductionByGroupKg.value    = cr?.byGroup ?? { NATURAL_SINGLE: 0, SYNTHETIC: 0, BLEND: 0 }
      carbonReductionMonthly.value      = Array.isArray(cr?.monthly) && cr.monthly.length === 12
                                          ? cr.monthly
                                          : Array(12).fill(0)
      // "연간 총 탄소 감축량" = BE 가 직접 계산한 total (= Σ byMaterial 과 일치)
      totalCarbonReductionKg.value      = Number(cr?.total || 0)
      return totalPoints.value
    } catch (e) {
      totalPointsError.value = e?.message ?? '점수 조회 실패'
    } finally {
      totalPointsLoading.value = false
    }
  }

  /** 외부에서 계산한 totalPoints 를 강제 주입 (TreeScore 페이지 등에서 실시간 sync 용) */
  function setTotalPoints(value) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      totalPoints.value = value
    }
  }

  /** 외부에서 계산한 총 판매량(kg) 를 주입 (TreeScore stats.totalKg sync 용) */
  function setTotalSalesKg(value) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      totalSalesKg.value = value
    }
  }

  return {
    totalPoints,
    totalPointsLoading,
    totalPointsError,
    totalSalesKg,
    totalCarbonReductionKg,
    totalCarbonReductionTon,
    carbonReductionMonthly,
    carbonReductionByGroupKg,
    carbonReductionByMaterialKg,
    carbonReductionDeltaPct,
    stage,
    stageProgress,
    pointsToNext,
    treeCount,
    // Curved 단계 정책 노출 — EsgTreeWidget 등에서 진척도 표시용
    stageThresholds: STAGE_THRESHOLDS,
    maxStage: MAX_STAGE,
    kocPrice,
    kocPriceUpdatedAt,
    kocPriceLoading,
    kocPriceError,
    fetchKocPrice,
    setKocPrice,
    fetchTotalPoints,
    setTotalPoints,
    setTotalSalesKg,
    // Phase 1: 소재 환산 계수 마스터 (BE 응답 캐싱)
    materialFactors,
    materialFactorsLoaded,
    materialFactorsLoading,
    materialFactorsError,
    fetchMaterialFactors,
  }
})

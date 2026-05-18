import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { carbonPriceApi, scoreEventsApi } from '@/api/hq/esg.js'
import {
  MOCK_DONATION_EVENTS,
  computeTotalScore,
  computeCarbonReductionKg,
  computeMonthlyCarbonReduction,
  normalizeSaleEvent,
} from '@/utils/esgScore.js'

const POINTS_PER_STAGE = 1500
const MAX_STAGE = 10

// BE 응답 실패 시 폴백 가격 (BE 의 esg.carbon-api.fallback-price 와 동기화: 9,200)
const KAU_FALLBACK_PRICE = 9200

export const useEsgStore = defineStore('esg', () => {
  // 초기 0 → fetchTotalPoints() 호출 시 BE sale events + MOCK_DONATION_EVENTS 기반으로 자동 계산
  const totalPoints = ref(0)
  const totalPointsLoading = ref(false)
  const totalPointsError = ref(null)

  // 순환재고 총 판매량 (kg) — TreeScore stats.totalKg 와 동일 값
  // fetchTotalPoints 시 자동 갱신 + TreeScore 페이지 watcher 로도 sync
  const totalSalesKg = ref(0)

  // 실제 탄소 배출 절감량 (kg CO₂) — SUM(weight × material_factor), CARBON_SCALE 미적용
  // ESG 대시보드 KPI "탄소 배출 절감" + 탄소중립 "절감한 탄소 배출량" 카드 공유
  const totalCarbonReductionKg = ref(0)
  // 월별 탄소 절감량 (kg CO₂) 12개 — 전월 대비 변동률 계산용
  const carbonReductionMonthly = ref(Array(12).fill(0))

  const kauPrice = ref(KAU_FALLBACK_PRICE)
  const kauPriceUpdatedAt = ref(null)
  const kauPriceLoading = ref(false)
  const kauPriceError = ref(null)

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

  const stage = computed(() => {
    const s = Math.floor(totalPoints.value / POINTS_PER_STAGE) + 1
    return Math.min(Math.max(s, 1), MAX_STAGE)
  })

  const stageProgress = computed(() => {
    if (stage.value >= MAX_STAGE) return 100
    const stageStart = (stage.value - 1) * POINTS_PER_STAGE
    return Math.min(100, ((totalPoints.value - stageStart) / POINTS_PER_STAGE) * 100)
  })

  const pointsToNext = computed(() => {
    if (stage.value >= MAX_STAGE) return 0
    return stage.value * POINTS_PER_STAGE - totalPoints.value
  })

  /**
   * KAU25 최신 종가를 BE 에서 조회.
   *  - 정상: carbonPriceApi.getLatest() 응답으로 kauPrice 갱신
   *  - 폴백/실패: kauPrice 는 직전값(또는 KAU_FALLBACK_PRICE)을 유지하고 에러만 기록
   */
  async function fetchKauPrice() {
    kauPriceLoading.value = true
    kauPriceError.value = null
    try {
      const res = await carbonPriceApi.getLatest()
      if (res?.pricePerTon != null) {
        kauPrice.value = Number(res.pricePerTon)
      }
      kauPriceUpdatedAt.value = new Date().toISOString()
      return res
    } catch (e) {
      kauPriceError.value = e?.message ?? '시세 조회 실패'
    } finally {
      kauPriceLoading.value = false
    }
  }

  function setKauPrice(price, updatedAt = new Date().toISOString()) {
    kauPrice.value = price
    kauPriceUpdatedAt.value = updatedAt
  }

  /**
   * BE sale events + mock donation events 를 합쳐 누적 ESG 점수 계산 후 totalPoints 갱신.
   *  - ESG 대시보드 헤더 / TreeScore 페이지가 같은 값 공유
   *  - 점수 룰 변경 시 utils/esgScore.js 만 수정하면 양쪽 자동 반영
   */
  async function fetchTotalPoints(year) {
    totalPointsLoading.value = true
    totalPointsError.value = null
    try {
      const targetYear = year ?? new Date().getFullYear()
      const res = await scoreEventsApi.get(targetYear)
      const saleEvents = (res?.events ?? []).map(normalizeSaleEvent)
      const allEvents = [...saleEvents, ...MOCK_DONATION_EVENTS]
      totalPoints.value = computeTotalScore(allEvents)
      totalSalesKg.value = allEvents.reduce((s, e) => s + (Number(e.weightKg) || 0), 0)
      totalCarbonReductionKg.value = computeCarbonReductionKg(allEvents)
      carbonReductionMonthly.value = computeMonthlyCarbonReduction(allEvents)
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
    carbonReductionDeltaPct,
    stage,
    stageProgress,
    pointsToNext,
    pointsPerStage: POINTS_PER_STAGE,
    maxStage: MAX_STAGE,
    kauPrice,
    kauPriceUpdatedAt,
    kauPriceLoading,
    kauPriceError,
    fetchKauPrice,
    setKauPrice,
    fetchTotalPoints,
    setTotalPoints,
    setTotalSalesKg,
  }
})

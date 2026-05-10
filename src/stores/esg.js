import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
// import { getKauPrice } from '@/api/hq/esg.js'  // BE 연동 시 활성화

const POINTS_PER_STAGE = 1500
const MAX_STAGE = 10

const KAU_DEFAULT_PRICE = 9840

export const useEsgStore = defineStore('esg', () => {
  // scoreCategories 합계와 정합 (탄소 ×0.5 스케일 적용 후): 400+1436+150+150+320 = 2,456
  const totalPoints = ref(2456)

  const kauPrice = ref(KAU_DEFAULT_PRICE)
  const kauPriceUpdatedAt = ref(null)
  const kauPriceLoading = ref(false)
  const kauPriceError = ref(null)

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

  async function fetchKauPrice() {
    kauPriceLoading.value = true
    kauPriceError.value = null
    try {
      // BE 연동 시 src/api/esg.js의 getKauPrice()로 교체
      // const { price, updatedAt } = await getKauPrice()
      // kauPrice.value = price
      // kauPriceUpdatedAt.value = updatedAt
      kauPriceUpdatedAt.value = new Date().toISOString()
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

  return {
    totalPoints,
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
  }
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// 창고관리자가 담당하는 단일 창고 메타 + 카테고리별 보관량 시드
// (WHS-003 공간 점유율 — 본사 창고 비교는 HqWarehouseInventoryComparisonView 영역)
const SPACE_DATA = {
  warehouseId: 'WH-001',
  warehouseName: '서울 1센터',
  maxCapacity: 50000,
  byCategory: [
    { name: '의류', used: 14000, color: 'bg-blue-400' },
    { name: '잡화', used: 9000, color: 'bg-emerald-500' },
    { name: '신발', used: 5000, color: 'bg-amber-400' },
    { name: '가전', used: 3480, color: 'bg-rose-400' },
  ],
}

export const useWarehouseSpaceStore = defineStore('warehouseSpace', () => {
  const warehouseId = ref(SPACE_DATA.warehouseId)
  const warehouseName = ref(SPACE_DATA.warehouseName)
  const maxCapacity = ref(SPACE_DATA.maxCapacity)
  const byCategory = ref(SPACE_DATA.byCategory)

  const totalUsed = computed(() =>
    byCategory.value.reduce((sum, c) => sum + c.used, 0),
  )

  const percent = computed(() => {
    if (maxCapacity.value === 0) return 0
    return Math.round((totalUsed.value / maxCapacity.value) * 1000) / 10
  })

  const threshold = computed(() => {
    if (percent.value >= 90) return 'critical'
    if (percent.value >= 80) return 'warning'
    return 'normal'
  })

  const categoryWithPct = computed(() =>
    byCategory.value.map((c) => ({
      ...c,
      pct:
        maxCapacity.value === 0
          ? 0
          : Math.round((c.used / maxCapacity.value) * 1000) / 10,
    })),
  )

  return {
    warehouseId,
    warehouseName,
    maxCapacity,
    byCategory,
    totalUsed,
    percent,
    threshold,
    categoryWithPct,
  }
})

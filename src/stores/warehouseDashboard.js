import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { dashboardApi } from '@/api/dashboard.js'
import { inboundApi } from '@/api/inbound.js'

/**
 * WHS-001 창고 관리자 대시보드 입고 진행률 store.
 * BE: GET /api/warehouse/dashboard/inbound-progress (집계) + GET /api/warehouse/inbound?status=SHIPPING (예정 발주 목록).
 * 두 호출은 fetchInboundProgress 액션에서 병렬 처리.
 *
 * 단일 진실 원천(ADR-015) — 대시보드는 자체 BE 호출만으로 동작. purchaseOrder/inbound store 의존 금지.
 */
export const useWarehouseDashboardStore = defineStore('warehouseDashboard', () => {
  const progress = ref(null) // { kpi, statusBreakdown } | null
  const shippingOrders = ref([]) // [{ id, vendorName, warehouseName, createdAt, itemCount, totalPrice }]
  const isLoading = ref(false)
  const error = ref(null)

  // ─── getters ───────────────────────────────────────────────────────────────
  const kpi = computed(() => progress.value?.kpi ?? {})
  const statusBreakdown = computed(() => progress.value?.statusBreakdown ?? {})

  const progressPercent = computed(() => {
    const r = kpi.value.progressRate
    if (r === null || r === undefined) return null
    return Math.round(r * 100)
  })

  const shippingCount = computed(() => statusBreakdown.value.SHIPPING ?? 0)
  const completedCount = computed(() => statusBreakdown.value.COMPLETED ?? 0)
  const stageTotal = computed(() => shippingCount.value + completedCount.value)

  const shippingPct = computed(() => {
    if (stageTotal.value === 0) return 0
    return Math.round((shippingCount.value / stageTotal.value) * 100)
  })
  const completedPct = computed(() => {
    if (stageTotal.value === 0) return 0
    return 100 - shippingPct.value
  })

  // ─── actions ──────────────────────────────────────────────────────────────
  /**
   * @param {{warehouseId?: string, from?: string, to?: string}} params
   */
  async function fetchInboundProgress(params = {}) {
    isLoading.value = true
    error.value = null
    try {
      const [progressRes, listRes] = await Promise.all([
        dashboardApi.getInboundProgress(params),
        // 입고 예정 = DELIVERED(배송완료, 도착됨) — SHIPPING 은 거래처 단계라 창고 화면 미노출
        inboundApi.list({ ...params, status: 'DELIVERED' }),
      ])
      progress.value = progressRes
      // 입고 예정 테이블 — 도착 임박 (오래된 순) 노출 위해 createdAt asc 로 재정렬
      const mapped = listRes.map((o) => ({
        id: o.code,
        vendorName: o.vendorName,
        warehouseName: o.warehouseName,
        createdAt: o.createdAt,
        itemCount: o.itemCount,
        totalPrice: o.totalAmount,
      }))
      mapped.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      shippingOrders.value = mapped
    } catch (e) {
      error.value = e?.message ?? '대시보드 데이터를 불러오지 못했습니다.'
      progress.value = null
      shippingOrders.value = []
    } finally {
      isLoading.value = false
    }
  }

  return {
    // state
    progress,
    shippingOrders,
    isLoading,
    error,
    // getters
    kpi,
    statusBreakdown,
    progressPercent,
    shippingCount,
    completedCount,
    stageTotal,
    shippingPct,
    completedPct,
    // actions
    fetchInboundProgress,
  }
})

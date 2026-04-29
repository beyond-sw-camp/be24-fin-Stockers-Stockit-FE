import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePurchaseOrderStore } from './purchaseOrder.js'
import { inboundApi } from '@/api/inbound.js'

export const useInboundStore = defineStore('inbound', () => {
  const poStore = usePurchaseOrderStore()

  // --- view state (입고 화면 전용) ---
  // 'DELIVERED' = 배송완료(도착됨, 입고 확정 대기) / 'COMPLETED' = 입고완료
  // SHIPPING(배송중) 은 거래처 단계라 창고 화면에 노출 안 함 (BE InboundService 도 차단)
  const activeStatusTab = ref('DELIVERED')
  const selectedOrderId = ref(null)
  const searchKeyword = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const sortBy = ref('latest') // 'latest' | 'oldest' | 'priceAsc' | 'priceDesc'

  // --- getters ---
  const selectedOrder = computed(
    () => poStore.purchaseOrders.find((o) => o.id === selectedOrderId.value) ?? null,
  )

  const inboundList = computed(() => {
    let list = poStore.purchaseOrders.filter((o) => o.status === activeStatusTab.value)

    if (searchKeyword.value.trim()) {
      const k = searchKeyword.value.trim().toLowerCase()
      list = list.filter(
        (o) => o.id.toLowerCase().includes(k) || o.vendorName.toLowerCase().includes(k),
      )
    }

    if (dateFrom.value) {
      list = list.filter((o) => o.createdAt.slice(0, 10) >= dateFrom.value)
    }
    if (dateTo.value) {
      list = list.filter((o) => o.createdAt.slice(0, 10) <= dateTo.value)
    }

    const sorted = [...list]
    switch (sortBy.value) {
      case 'oldest':
        sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        break
      case 'priceAsc':
        sorted.sort((a, b) => a.totalPrice - b.totalPrice)
        break
      case 'priceDesc':
        sorted.sort((a, b) => b.totalPrice - a.totalPrice)
        break
      default:
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
    return sorted
  })

  // 탭 카운트는 항상 전체 기준 (검색·기간 무관)
  const counts = computed(() => ({
    DELIVERED: poStore.purchaseOrders.filter((o) => o.status === 'DELIVERED').length,
    COMPLETED: poStore.purchaseOrders.filter((o) => o.status === 'COMPLETED').length,
  }))

  // --- actions ---
  // 발주 선택 — items/statusHistory 가 비어있으면(list 시점) detail 자동 fetch.
  // purchaseOrder store 의 selectOrder 와 같은 패턴 — 단일 진실 원천(ADR-015).
  function selectOrder(id) {
    selectedOrderId.value = id
    if (id) {
      const order = poStore.purchaseOrders.find((o) => o.id === id)
      if (order && (order.items.length === 0 || order.statusHistory.length === 0)) {
        poStore.fetchDetail(id).catch(() => {
          // fetchDetail 안에서 이미 처리
        })
      }
    }
  }

  // 입고 확정 (WHS-007) — 창고 권한군 entry-point 로 갈아끼움.
  // BE: POST /api/warehouse/inbound/{code}/confirm → 내부적으로 PurchaseOrderService.complete
  // (SHIPPING→COMPLETED 검증 + statusHistory append).
  // 단일 진실 원천(ADR-015) 정합을 위해 confirm 후 poStore.fetchDetail 로 단건 갱신.
  async function confirmInbound(id) {
    await inboundApi.confirm(id)
    return poStore.fetchDetail(id)
  }

  return {
    // state
    activeStatusTab,
    selectedOrderId,
    searchKeyword,
    dateFrom,
    dateTo,
    sortBy,
    // getters
    selectedOrder,
    inboundList,
    counts,
    // actions
    selectOrder,
    confirmInbound,
  }
})

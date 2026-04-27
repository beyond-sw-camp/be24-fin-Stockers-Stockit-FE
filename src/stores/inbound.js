import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePurchaseOrderStore } from './purchaseOrder.js'

export const useInboundStore = defineStore('inbound', () => {
  const poStore = usePurchaseOrderStore()

  // --- view state (입고 화면 전용) ---
  const activeStatusTab = ref('SHIPPING') // 'SHIPPING' | 'COMPLETED'
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
    SHIPPING: poStore.purchaseOrders.filter((o) => o.status === 'SHIPPING').length,
    COMPLETED: poStore.purchaseOrders.filter((o) => o.status === 'COMPLETED').length,
  }))

  // --- actions ---
  function selectOrder(id) {
    selectedOrderId.value = id
  }

  // 입고 확정 — purchaseOrder store 의 markCompleted 위임
  // (statusHistory push 는 markCompleted 안에서 자동 처리)
  function confirmInbound(id) {
    poStore.markCompleted(id)
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

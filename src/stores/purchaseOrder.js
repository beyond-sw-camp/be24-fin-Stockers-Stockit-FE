import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { purchaseOrderApi } from '@/api/purchaseOrder.js'

// 창고 더미 목록 (창고 BE 미구현 — logical reference)
const WAREHOUSES = [
  { id: 'WH-001', name: '서울 1센터' },
  { id: 'WH-002', name: '인천 제1센터' },
  { id: 'WH-003', name: '경기 남부센터' },
  { id: 'WH-004', name: '부산 물류센터' },
  { id: 'WH-005', name: '대구 통합센터' },
]

// ─── BE ↔ FE 매핑 헬퍼 ─────────────────────────────────────────────────────
// BE (PurchaseOrder DetailRes/ListRes) ↔ FE store 형식 변환.
// 매핑:
//   BE code               → FE id
//   BE vendorCode         → FE vendorId
//   BE totalAmount        → FE totalPrice
//   BE items[].vendorProductCode → FE items[].productId
//   BE statusHistory[].changedAt    → FE statusHistory[].at
//   BE statusHistory[].changedByName → FE statusHistory[].byName
// 그 외 필드는 동일 이름 그대로.

function toFeOrder(beOrder) {
  if (!beOrder) return null
  return {
    id: beOrder.code,
    warehouseId: beOrder.warehouseId ?? '',
    warehouseName: beOrder.warehouseName ?? '',
    vendorId: beOrder.vendorCode,
    vendorName: beOrder.vendorName ?? '',
    memberId: beOrder.memberId ?? '',
    memberName: beOrder.memberName ?? '',
    status: beOrder.status,
    totalPrice: beOrder.totalAmount ?? 0,
    cancelReason: beOrder.cancelReason ?? '',
    createdAt: beOrder.createdAt ?? '',
    updatedAt: beOrder.updatedAt ?? '',
    items: Array.isArray(beOrder.items) ? beOrder.items.map(toFeItem) : [],
    statusHistory: Array.isArray(beOrder.statusHistory)
      ? beOrder.statusHistory.map(toFeHistory)
      : [],
  }
}

function toFeItem(beItem) {
  return {
    productId: beItem.vendorProductCode,
    productCode: beItem.productCode,
    productName: beItem.productName,
    quantity: beItem.quantity,
    unitPrice: beItem.unitPrice,
    subtotal: beItem.subtotal,
  }
}

function toFeHistory(beHistory) {
  return {
    status: beHistory.status,
    at: beHistory.changedAt ?? '',
    byName: beHistory.changedByName ?? '',
    note: beHistory.note ?? '',
  }
}

// FE createOrder/updateOrder payload → BE 요청 변환
function toBeCreateReq({ vendorId, warehouseId, warehouseName, memberId, memberName, items }) {
  return {
    vendorCode: vendorId,
    warehouseId: warehouseId ?? '',
    warehouseName: warehouseName ?? '',
    memberId: memberId ?? '',
    memberName: memberName ?? '',
    items: items.map((item) => ({
      vendorProductCode: item.productId,
      quantity: item.quantity,
    })),
  }
}

function toBeUpdateReq({ warehouseId, warehouseName, items }) {
  return {
    warehouseId: warehouseId ?? '',
    warehouseName: warehouseName ?? '',
    items: items.map((item) => ({
      vendorProductCode: item.productId,
      quantity: item.quantity,
    })),
  }
}

export const usePurchaseOrderStore = defineStore('purchaseOrder', () => {
  // --- 상태(state) ---
  const purchaseOrders = ref([])
  const selectedOrderId = ref(null)
  const activeStatusTab = ref('전체')
  const searchKeyword = ref('')
  const vendorFilter = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const sortBy = ref('latest') // 'latest' | 'oldest' | 'priceAsc' | 'priceDesc'
  const loading = ref(false)
  const error = ref(null)

  // --- 게터(getters) ---
  const selectedOrder = computed(
    () => purchaseOrders.value.find((o) => o.id === selectedOrderId.value) ?? null,
  )

  const filteredOrders = computed(() => {
    let list = purchaseOrders.value

    if (activeStatusTab.value !== '전체') {
      list = list.filter((o) => o.status === activeStatusTab.value)
    }

    if (searchKeyword.value.trim()) {
      const kw = searchKeyword.value.trim().toLowerCase()
      list = list.filter(
        (o) => o.id.toLowerCase().includes(kw) || o.vendorName.toLowerCase().includes(kw),
      )
    }

    if (vendorFilter.value) {
      list = list.filter((o) => o.vendorId === vendorFilter.value)
    }

    if (dateFrom.value) {
      list = list.filter((o) => (o.createdAt || '').slice(0, 10) >= dateFrom.value)
    }
    if (dateTo.value) {
      list = list.filter((o) => (o.createdAt || '').slice(0, 10) <= dateTo.value)
    }

    const sorted = [...list]
    switch (sortBy.value) {
      case 'oldest':
        sorted.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
        break
      case 'priceAsc':
        sorted.sort((a, b) => a.totalPrice - b.totalPrice)
        break
      case 'priceDesc':
        sorted.sort((a, b) => b.totalPrice - a.totalPrice)
        break
      default:
        sorted.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    }
    return sorted
  })

  const statusCounts = computed(() => {
    const all = purchaseOrders.value
    return {
      전체: all.length,
      PENDING: all.filter((o) => o.status === 'PENDING').length,
      APPROVED: all.filter((o) => o.status === 'APPROVED').length,
      SHIPPING: all.filter((o) => o.status === 'SHIPPING').length,
      COMPLETED: all.filter((o) => o.status === 'COMPLETED').length,
      REJECTED: all.filter((o) => o.status === 'REJECTED').length,
    }
  })

  const vendorOptions = computed(() => {
    const seen = new Map()
    for (const o of purchaseOrders.value) {
      if (!seen.has(o.vendorId)) {
        seen.set(o.vendorId, { id: o.vendorId, name: o.vendorName })
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  })

  const summary = computed(() => {
    let base = purchaseOrders.value
    if (vendorFilter.value) {
      base = base.filter((o) => o.vendorId === vendorFilter.value)
    }
    if (dateFrom.value) {
      base = base.filter((o) => (o.createdAt || '').slice(0, 10) >= dateFrom.value)
    }
    if (dateTo.value) {
      base = base.filter((o) => (o.createdAt || '').slice(0, 10) <= dateTo.value)
    }
    return {
      totalCount: base.length,
      totalPrice: base.reduce((sum, o) => sum + o.totalPrice, 0),
    }
  })

  const warehouses = computed(() => WAREHOUSES)

  // --- 액션(actions) ---

  /**
   * 목록 조회 — 모든 발주를 한 번에 받아와 client-side 로 필터/정렬.
   * 상세는 list 응답에 items/statusHistory 가 없으므로,
   * mutation 후 selectOrder 시 detail 을 별도 fetch 해서 갱신.
   */
  async function fetchOrders() {
    loading.value = true
    error.value = null
    try {
      const list = await purchaseOrderApi.list()
      // ListRes 는 items/statusHistory 미포함 — 빈 배열로 채워둠
      purchaseOrders.value = (list ?? []).map((o) => ({
        ...toFeOrder(o),
        items: [],
        statusHistory: [],
      }))
    } catch (e) {
      error.value = e?.message ?? '발주 목록을 불러오지 못했습니다.'
      console.error('[purchaseOrder] fetchOrders 실패', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 단건 상세 조회 — items + statusHistory 까지 채워서 store 에 반영.
   * mutation 직후 또는 selectOrder 시 호출.
   */
  async function fetchDetail(id) {
    try {
      const detail = await purchaseOrderApi.detail(id)
      const fe = toFeOrder(detail)
      const idx = purchaseOrders.value.findIndex((o) => o.id === id)
      if (idx >= 0) {
        purchaseOrders.value.splice(idx, 1, fe)
      } else {
        purchaseOrders.value = [fe, ...purchaseOrders.value]
      }
      return fe
    } catch (e) {
      error.value = e?.message ?? '발주 상세를 불러오지 못했습니다.'
      console.error('[purchaseOrder] fetchDetail 실패', e)
      throw e
    }
  }

  function selectOrder(id) {
    selectedOrderId.value = id
    if (id) {
      // 상세 정보(items/statusHistory) 가 비어있으면 fetch
      const order = purchaseOrders.value.find((o) => o.id === id)
      if (order && (order.items.length === 0 || order.statusHistory.length === 0)) {
        fetchDetail(id).catch(() => {
          // fetchDetail 안에서 이미 처리
        })
      }
    }
  }

  async function createOrder(payload) {
    const req = toBeCreateReq(payload)
    const created = await purchaseOrderApi.create(req)
    const fe = toFeOrder(created)
    purchaseOrders.value = [fe, ...purchaseOrders.value]
    return fe
  }

  async function updateOrder(id, { warehouseId, items }) {
    const warehouse = WAREHOUSES.find((w) => w.id === warehouseId)
    const req = toBeUpdateReq({
      warehouseId,
      warehouseName: warehouse?.name ?? '',
      items,
    })
    const updated = await purchaseOrderApi.update(id, req)
    const fe = toFeOrder(updated)
    const idx = purchaseOrders.value.findIndex((o) => o.id === id)
    if (idx >= 0) purchaseOrders.value.splice(idx, 1, fe)
    return fe
  }

  async function markCompleted(id) {
    const updated = await purchaseOrderApi.complete(id)
    const fe = toFeOrder(updated)
    const idx = purchaseOrders.value.findIndex((o) => o.id === id)
    if (idx >= 0) purchaseOrders.value.splice(idx, 1, fe)
    return fe
  }

  async function cancelOrder(id, reason = '') {
    const updated = await purchaseOrderApi.cancel(id, reason)
    const fe = toFeOrder(updated)
    const idx = purchaseOrders.value.findIndex((o) => o.id === id)
    if (idx >= 0) purchaseOrders.value.splice(idx, 1, fe)
    return fe
  }

  /**
   * SYS-001 강제 트리거 — 시연·QA용.
   * 배치 호출 후 처리된 건이 있으면 목록·선택 상세 재조회로 화면 동기화.
   */
  async function runBatch() {
    try {
      const result = await purchaseOrderApi.runBatch()
      const changed = (result?.approved ?? 0) + (result?.shipping ?? 0)
      if (changed > 0) {
        await fetchOrders()
        if (selectedOrderId.value) {
          await fetchDetail(selectedOrderId.value).catch(() => {})
        }
      }
      return result
    } catch (e) {
      error.value = e?.message ?? '배치 강제 실행에 실패했습니다.'
      console.error('[purchaseOrder] runBatch 실패', e)
      throw e
    }
  }

  // 스토어 생성 시 자동 fetch (vendor store 패턴)
  fetchOrders().catch(() => {
    // fetchOrders 안에서 이미 처리
  })

  return {
    // state
    purchaseOrders,
    selectedOrderId,
    activeStatusTab,
    searchKeyword,
    vendorFilter,
    dateFrom,
    dateTo,
    sortBy,
    loading,
    error,
    // getters
    selectedOrder,
    filteredOrders,
    statusCounts,
    vendorOptions,
    summary,
    warehouses,
    // actions
    selectOrder,
    fetchOrders,
    fetchDetail,
    createOrder,
    updateOrder,
    cancelOrder,
    markCompleted,
    runBatch,
  }
})

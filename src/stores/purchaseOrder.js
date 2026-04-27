import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 창고 더미 목록 (BE 연동 전 상수)
const WAREHOUSES = [
  { id: 'WH-001', name: '서울 1센터' },
  { id: 'WH-002', name: '인천 제1센터' },
  { id: 'WH-003', name: '경기 남부센터' },
  { id: 'WH-004', name: '부산 물류센터' },
  { id: 'WH-005', name: '대구 통합센터' },
]

// localStorage 키
const STORAGE_KEY = 'stockit:purchase-orders'

// 발주 번호 생성 헬퍼 (PO-YYYYMMDD-NNN)
function generatePoId(list) {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const todayOrders = list.filter((o) => o.id.includes(`PO-${dateStr}`))
  const seq = String(todayOrders.length + 1).padStart(3, '0')
  return `PO-${dateStr}-${seq}`
}

// 더미 발주 데이터 시드 (10~15건)
const SEED_ORDERS = [
  {
    id: 'PO-20260415-001',
    warehouseId: 'WH-001',
    warehouseName: '서울 1센터',
    vendorId: 'VND-001',
    vendorName: '(주)테크서플라이',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: null,
    status: 'COMPLETED',
    totalPrice: 4500000,
    createdAt: '2026-04-15T09:30:00',
    updatedAt: '2026-04-17T14:20:00',
    items: [
      {
        id: 'PI-001-1',
        productId: 'PRD-001',
        productCode: 'PRD-001',
        productName: '고속 충전기 (C타입) 25W',
        quantity: 300,
        unitPrice: 15000,
        subtotal: 4500000,
      },
    ],
  },
  {
    id: 'PO-20260416-001',
    warehouseId: 'WH-002',
    warehouseName: '인천 제1센터',
    vendorId: 'VND-002',
    vendorName: '글로벌오피스(주)',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: 'AI-001',
    status: 'APPROVED',
    totalPrice: 2400000,
    createdAt: '2026-04-16T10:15:00',
    updatedAt: '2026-04-16T11:00:00',
    items: [
      {
        id: 'PI-002-1',
        productId: 'PRD-004',
        productCode: 'PRD-004',
        productName: 'A4 복사용지 80g (500매)',
        quantity: 200,
        unitPrice: 6500,
        subtotal: 1300000,
      },
      {
        id: 'PI-002-2',
        productId: 'PRD-005',
        productCode: 'PRD-005',
        productName: '더블클립 세트 (19mm)',
        quantity: 500,
        unitPrice: 2200,
        subtotal: 1100000,
      },
    ],
  },
  {
    id: 'PO-20260416-002',
    warehouseId: 'WH-003',
    warehouseName: '경기 남부센터',
    vendorId: 'VND-001',
    vendorName: '(주)테크서플라이',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: null,
    status: 'SHIPPING',
    totalPrice: 5800000,
    createdAt: '2026-04-16T13:00:00',
    updatedAt: '2026-04-17T08:30:00',
    items: [
      {
        id: 'PI-003-1',
        productId: 'PRD-002',
        productCode: 'PRD-002',
        productName: '대용량 보조배터리 20000mAh',
        quantity: 100,
        unitPrice: 58000,
        subtotal: 5800000,
      },
    ],
  },
  {
    id: 'PO-20260417-001',
    warehouseId: 'WH-001',
    warehouseName: '서울 1센터',
    vendorId: 'VND-003',
    vendorName: '헬스케어솔루션(주)',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: 'AI-002',
    status: 'PENDING',
    totalPrice: 1250000,
    createdAt: '2026-04-17T09:00:00',
    updatedAt: '2026-04-17T09:00:00',
    items: [
      {
        id: 'PI-004-1',
        productId: 'PRD-007',
        productCode: 'PRD-007',
        productName: 'KF94 마스크 (50매입)',
        quantity: 500,
        unitPrice: 2500,
        subtotal: 1250000,
      },
    ],
  },
  {
    id: 'PO-20260417-002',
    warehouseId: 'WH-004',
    warehouseName: '부산 물류센터',
    vendorId: 'VND-004',
    vendorName: '리빙플러스(주)',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: null,
    status: 'REJECTED',
    totalPrice: 420000,
    cancelReason: '거래처 단가 변경으로 발주 취소',
    createdAt: '2026-04-17T11:30:00',
    updatedAt: '2026-04-17T14:00:00',
    items: [
      {
        id: 'PI-005-1',
        productId: 'PRD-010',
        productCode: 'PRD-010',
        productName: '탁상용 미니 가습기',
        quantity: 30,
        unitPrice: 14000,
        subtotal: 420000,
      },
    ],
  },
  {
    id: 'PO-20260418-001',
    warehouseId: 'WH-002',
    warehouseName: '인천 제1센터',
    vendorId: 'VND-001',
    vendorName: '(주)테크서플라이',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: null,
    status: 'PENDING',
    totalPrice: 3200000,
    createdAt: '2026-04-18T08:45:00',
    updatedAt: '2026-04-18T08:45:00',
    items: [
      {
        id: 'PI-006-1',
        productId: 'PRD-003',
        productCode: 'PRD-003',
        productName: '무소음 무선 마우스',
        quantity: 80,
        unitPrice: 25000,
        subtotal: 2000000,
      },
      {
        id: 'PI-006-2',
        productId: 'PRD-006',
        productCode: 'PRD-006',
        productName: '기계식 키보드 (갈축)',
        quantity: 20,
        unitPrice: 60000,
        subtotal: 1200000,
      },
    ],
  },
  {
    id: 'PO-20260418-002',
    warehouseId: 'WH-005',
    warehouseName: '대구 통합센터',
    vendorId: 'VND-005',
    vendorName: '스마트스토리지(주)',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: null,
    status: 'APPROVED',
    totalPrice: 880000,
    createdAt: '2026-04-18T10:20:00',
    updatedAt: '2026-04-18T15:30:00',
    items: [
      {
        id: 'PI-007-1',
        productId: 'PRD-011',
        productCode: 'PRD-011',
        productName: '투명 박스 테이프 (48mm)',
        quantity: 400,
        unitPrice: 2200,
        subtotal: 880000,
      },
    ],
  },
  {
    id: 'PO-20260419-001',
    warehouseId: 'WH-001',
    warehouseName: '서울 1센터',
    vendorId: 'VND-002',
    vendorName: '글로벌오피스(주)',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: 'AI-003',
    status: 'PENDING',
    totalPrice: 1950000,
    createdAt: '2026-04-19T09:15:00',
    updatedAt: '2026-04-19T09:15:00',
    items: [
      {
        id: 'PI-008-1',
        productId: 'PRD-012',
        productCode: 'PRD-012',
        productName: '절전형 5구 멀티탭 (3m)',
        quantity: 150,
        unitPrice: 13000,
        subtotal: 1950000,
      },
    ],
  },
  {
    id: 'PO-20260419-002',
    warehouseId: 'WH-003',
    warehouseName: '경기 남부센터',
    vendorId: 'VND-003',
    vendorName: '헬스케어솔루션(주)',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: null,
    status: 'SHIPPING',
    totalPrice: 450000,
    createdAt: '2026-04-19T11:00:00',
    updatedAt: '2026-04-19T16:00:00',
    items: [
      {
        id: 'PI-009-1',
        productId: 'PRD-008',
        productCode: 'PRD-008',
        productName: '휴대용 가글 (중) 250ml',
        quantity: 300,
        unitPrice: 1500,
        subtotal: 450000,
      },
    ],
  },
  {
    id: 'PO-20260420-001',
    warehouseId: 'WH-002',
    warehouseName: '인천 제1센터',
    vendorId: 'VND-004',
    vendorName: '리빙플러스(주)',
    memberId: 'MB-003',
    memberName: '이선엽',
    recommendationId: null,
    status: 'PENDING',
    totalPrice: 650000,
    createdAt: '2026-04-20T08:00:00',
    updatedAt: '2026-04-20T08:00:00',
    items: [
      {
        id: 'PI-010-1',
        productId: 'PRD-009',
        productCode: 'PRD-009',
        productName: '유리제 머그컵 350ml',
        quantity: 50,
        unitPrice: 8900,
        subtotal: 445000,
      },
      {
        id: 'PI-010-2',
        productId: 'PRD-013',
        productCode: 'PRD-013',
        productName: '종이컵 6.5온스 (1000개입)',
        quantity: 10,
        unitPrice: 20500,
        subtotal: 205000,
      },
    ],
  },
]

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

  // --- 게터(getters) ---
  const selectedOrder = computed(
    () => purchaseOrders.value.find((o) => o.id === selectedOrderId.value) ?? null,
  )

  const filteredOrders = computed(() => {
    let list = purchaseOrders.value

    // 상태 탭 필터
    if (activeStatusTab.value !== '전체') {
      list = list.filter((o) => o.status === activeStatusTab.value)
    }

    // 검색어 필터 (발주번호 또는 거래처명)
    if (searchKeyword.value.trim()) {
      const kw = searchKeyword.value.trim().toLowerCase()
      list = list.filter(
        (o) => o.id.toLowerCase().includes(kw) || o.vendorName.toLowerCase().includes(kw),
      )
    }

    // 거래처 필터
    if (vendorFilter.value) {
      list = list.filter((o) => o.vendorId === vendorFilter.value)
    }

    // 기간 필터 (createdAt 의 YYYY-MM-DD 부분만 비교)
    if (dateFrom.value) {
      list = list.filter((o) => o.createdAt.slice(0, 10) >= dateFrom.value)
    }
    if (dateTo.value) {
      list = list.filter((o) => o.createdAt.slice(0, 10) <= dateTo.value)
    }

    // 정렬 — 새 배열로 (원본 mutate 금지)
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
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) // 'latest'
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

  // 거래처 필터 옵션 — 발주에 등장한 unique vendor 만, 한국어 이름 오름차순
  const vendorOptions = computed(() => {
    const seen = new Map()
    for (const o of purchaseOrders.value) {
      if (!seen.has(o.vendorId)) {
        seen.set(o.vendorId, { id: o.vendorId, name: o.vendorName })
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  })

  // 통계 요약 — 거래처/기간 컨텍스트만 반영, 상태 탭/검색은 무시
  // 상태 분포는 탭 카운트로 충분하므로 총 건수/금액만 노출
  const summary = computed(() => {
    let base = purchaseOrders.value
    if (vendorFilter.value) {
      base = base.filter((o) => o.vendorId === vendorFilter.value)
    }
    if (dateFrom.value) {
      base = base.filter((o) => o.createdAt.slice(0, 10) >= dateFrom.value)
    }
    if (dateTo.value) {
      base = base.filter((o) => o.createdAt.slice(0, 10) <= dateTo.value)
    }
    return {
      totalCount: base.length,
      totalPrice: base.reduce((sum, o) => sum + o.totalPrice, 0),
    }
  })

  const warehouses = computed(() => WAREHOUSES)

  // --- 액션(actions) ---
  function selectOrder(id) {
    selectedOrderId.value = id
  }

  function createOrder({
    warehouseId,
    vendorId,
    vendorName,
    items,
    recommendationId = null,
    memberId = 'MB-003',
    memberName = '이선엽',
  }) {
    const warehouse = WAREHOUSES.find((w) => w.id === warehouseId)
    const now = new Date().toISOString()
    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)

    const newOrder = {
      id: generatePoId(purchaseOrders.value),
      warehouseId,
      warehouseName: warehouse?.name ?? '',
      vendorId,
      vendorName,
      memberId,
      memberName,
      recommendationId,
      status: 'PENDING',
      totalPrice,
      createdAt: now,
      updatedAt: now,
      items: items.map((item, idx) => ({
        id: `PI-${Date.now()}-${idx + 1}`,
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    }

    purchaseOrders.value = [newOrder, ...purchaseOrders.value]
    saveToStorage()
    return newOrder
  }

  function updateOrder(id, { warehouseId, items }) {
    const order = purchaseOrders.value.find((o) => o.id === id)
    if (!order) return

    if (order.status !== 'PENDING') {
      console.warn(
        `[purchaseOrder] updateOrder: ${id}는 PENDING 상태가 아닙니다 (현재: ${order.status})`,
      )
      return
    }

    const warehouse = WAREHOUSES.find((w) => w.id === warehouseId)
    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0)

    order.warehouseId = warehouseId
    order.warehouseName = warehouse?.name ?? order.warehouseName
    order.items = items.map((item, idx) => ({
      id: item.id ?? `PI-${Date.now()}-${idx + 1}`,
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    }))
    order.totalPrice = totalPrice
    order.updatedAt = new Date().toISOString()

    saveToStorage()
  }

  function cancelOrder(id, reason = '') {
    const order = purchaseOrders.value.find((o) => o.id === id)
    if (!order) return

    if (order.status !== 'PENDING') {
      console.warn(
        `[purchaseOrder] cancelOrder: ${id}는 PENDING 상태가 아닙니다 (현재: ${order.status})`,
      )
      return
    }

    order.status = 'REJECTED'
    order.cancelReason = reason
    order.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  function approveOrder(id) {
    const order = purchaseOrders.value.find((o) => o.id === id)
    if (!order || order.status !== 'PENDING') return

    order.status = 'APPROVED'
    order.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  function markShipping(id) {
    const order = purchaseOrders.value.find((o) => o.id === id)
    if (!order || order.status !== 'APPROVED') return

    order.status = 'SHIPPING'
    order.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  function markCompleted(id) {
    const order = purchaseOrders.value.find((o) => o.id === id)
    if (!order || order.status !== 'SHIPPING') return

    order.status = 'COMPLETED'
    order.updatedAt = new Date().toISOString()
    saveToStorage()
  }

  // --- localStorage 영속화 ---
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchaseOrders.value))
    } catch (e) {
      console.error('[purchaseOrder] localStorage 저장 실패', e)
    }
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 구버전 데이터 호환 — missing 필드 default
        purchaseOrders.value = parsed.map((o) => ({
          ...o,
          cancelReason: o.cancelReason ?? '',
        }))
        return true
      }
    } catch (e) {
      console.error('[purchaseOrder] localStorage 로드 실패', e)
    }
    return false
  }

  function init() {
    const loaded = loadFromStorage()
    if (!loaded) {
      // 더미 데이터로 초기화
      purchaseOrders.value = SEED_ORDERS
      saveToStorage()
    }
  }

  // 스토어 생성 시 자동 초기화
  init()

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
    // getters
    selectedOrder,
    filteredOrders,
    statusCounts,
    vendorOptions,
    summary,
    warehouses,
    // actions
    selectOrder,
    createOrder,
    updateOrder,
    cancelOrder,
    approveOrder,
    markShipping,
    markCompleted,
    init,
  }
})

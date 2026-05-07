import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { inboundApi } from '@/api/warehouse/inbound.js'

/**
 * WHS-005/007/008 창고 관리자 입고 store.
 *
 * BE 의 신설 inbound 도메인(`/api/warehouse/inbound`) 응답 기반.
 * 본사 발주 입고 + 창고간 이동 입고 두 source 통합 (이번 사이클은 PURCHASE_ORDER 만 active).
 *
 * id 호환 — `entity.id` 컴포넌트 패턴 보존을 위해 inboundCode 를 id 로 노출.
 * totalPrice 는 totalAmount 의 alias (기존 컴포넌트 호환).
 */
export const useWarehouseInboundStore = defineStore('warehouseInbound', () => {
  // --- state ---
  const items = ref([])
  const selectedDetail = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 5탭 — [전체 / READY_TO_SHIP / IN_TRANSIT / ARRIVED / COMPLETED]
  const activeStatusTab = ref('전체')
  const selectedOrderId = ref(null)
  const searchKeyword = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const sortBy = ref('latest')

  // --- BE WhInboundDto 응답 매핑 ---
  function fromListApi(v) {
    return {
      id: v.inboundCode,
      inboundCode: v.inboundCode,
      inboundType: v.inboundType,        // 'PURCHASE_ORDER' | 'WAREHOUSE_TRANSFER'
      sourceRefNo: v.sourceRefNo,        // PO-... | STF-...
      sourceName: v.sourceName,          // 공급처명 | 출발창고명
      warehouseName: v.warehouseName,
      status: v.status,
      totalQuantity: v.totalQuantity ?? 0,
      totalAmount: v.totalAmount ?? null,
      totalPrice: v.totalAmount ?? null, // 기존 컴포넌트 호환 alias
      productNames: v.productNames ?? [],
      createdAt: v.createdAt,
      arrivedAt: v.arrivedAt ?? null,
      completedAt: v.completedAt ?? null,
      // 호환 — 기존 컴포넌트가 vendorName 직접 접근 시 sourceName 그대로
      vendorName: v.sourceName,
      // detail 채워질 때까지 빈 배열로 노출
      items: [],
      statusHistory: [],
    }
  }

  function fromDetailApi(v) {
    return {
      id: v.inboundCode,
      inboundCode: v.inboundCode,
      inboundType: v.inboundType,
      sourceRefNo: v.sourceRefNo,
      sourceName: v.sourceName,
      warehouseId: v.warehouseId,           // stockStore lookup 용
      warehouseName: v.warehouseName,
      status: v.status,
      totalQuantity: v.totalQuantity ?? 0,
      totalAmount: v.totalAmount ?? null,
      totalPrice: v.totalAmount ?? null,
      createdAt: v.createdAt,
      arrivedAt: v.arrivedAt ?? null,
      completedAt: v.completedAt ?? null,
      confirmedByName: v.confirmedByName ?? null,
      memo: v.memo ?? null,
      vendorName: v.sourceName,
      items: (v.items ?? []).map((it) => ({
        id: it.skuCode,
        productCode: it.productCode,
        productName: it.productName,
        skuCode: it.skuCode,
        color: it.color,
        size: it.size,
        displayOption: it.displayOption,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
      })),
      statusHistory: (v.statusHistory ?? []).map((h) => ({
        status: h.status,
        at: h.at,                        // BE 가 changedAt → at 노출 (StatusHistoryRes.from)
        byName: h.byName,                // BE 가 changedByName → byName
        note: h.note,
      })),
    }
  }

  // --- getters ---
  const selectedOrder = computed(() => {
    if (!selectedOrderId.value) return null
    if (selectedDetail.value && selectedDetail.value.id === selectedOrderId.value) {
      return selectedDetail.value
    }
    return items.value.find((o) => o.id === selectedOrderId.value) ?? null
  })

  const inboundList = computed(() => {
    let list =
      activeStatusTab.value === '전체'
        ? items.value
        : items.value.filter((o) => o.status === activeStatusTab.value)

    if (searchKeyword.value.trim()) {
      const k = searchKeyword.value.trim().toLowerCase()
      list = list.filter(
        (o) =>
          (o.inboundCode ?? '').toLowerCase().includes(k) ||
          (o.sourceRefNo ?? '').toLowerCase().includes(k) ||
          (o.sourceName ?? '').toLowerCase().includes(k) ||
          (o.productNames ?? []).some((name) => (name ?? '').toLowerCase().includes(k)),
      )
    }

    if (dateFrom.value) {
      list = list.filter((o) => (o.createdAt ?? '').slice(0, 10) >= dateFrom.value)
    }
    if (dateTo.value) {
      list = list.filter((o) => (o.createdAt ?? '').slice(0, 10) <= dateTo.value)
    }

    const sorted = [...list]
    switch (sortBy.value) {
      case 'oldest':
        sorted.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
        break
      case 'priceAsc':
        sorted.sort((a, b) => (a.totalAmount ?? 0) - (b.totalAmount ?? 0))
        break
      case 'priceDesc':
        sorted.sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0))
        break
      default:
        sorted.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    }
    return sorted
  })

  const counts = computed(() => ({
    전체: items.value.length,
    READY_TO_SHIP: items.value.filter((o) => o.status === 'READY_TO_SHIP').length,
    IN_TRANSIT: items.value.filter((o) => o.status === 'IN_TRANSIT').length,
    ARRIVED: items.value.filter((o) => o.status === 'ARRIVED').length,
    COMPLETED: items.value.filter((o) => o.status === 'COMPLETED').length,
  }))

  // --- actions ---
  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const list = await inboundApi.list()
      items.value = (list ?? []).map(fromListApi)
    } catch (e) {
      error.value = e?.message ?? '입고 목록을 불러오지 못했습니다.'
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(id) {
    try {
      const detail = await inboundApi.detail(id)
      const mapped = fromDetailApi(detail)
      selectedDetail.value = mapped
      const idx = items.value.findIndex((o) => o.id === id)
      if (idx >= 0) {
        items.value[idx] = { ...items.value[idx], ...mapped }
      }
      return mapped
    } catch (e) {
      error.value = e?.message ?? '입고 상세를 불러오지 못했습니다.'
      throw e
    }
  }

  function selectOrder(id) {
    selectedOrderId.value = id
    if (id) {
      const order = items.value.find((o) => o.id === id)
      if (!order || order.items.length === 0 || order.statusHistory.length === 0) {
        fetchDetail(id).catch(() => {
          // fetchDetail 안에서 이미 처리
        })
      } else {
        selectedDetail.value = order
      }
    } else {
      selectedDetail.value = null
    }
  }

  // 입고 확정 (WHS-007) — ARRIVED → COMPLETED. BE: POST /api/warehouse/inbound/{inboundCode}/confirm
  async function confirmInbound(id) {
    await inboundApi.confirm(id)
    await fetchDetail(id)
    await fetchAll()
  }

  // 마운트 자동 fetch
  fetchAll().catch((err) => {
    console.error('[warehouseInbound] fetchAll 실패', err)
  })

  return {
    items,
    activeStatusTab,
    selectedOrderId,
    searchKeyword,
    dateFrom,
    dateTo,
    sortBy,
    loading,
    error,
    selectedOrder,
    inboundList,
    counts,
    fetchAll,
    fetchDetail,
    selectOrder,
    confirmInbound,
  }
})

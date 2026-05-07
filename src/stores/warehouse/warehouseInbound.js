import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { inboundApi } from '@/api/warehouse/inbound.js'

/**
 * WHS-005/007/008 창고 관리자 입고 store.
 *
 * 단일 진실 원천(ADR-015) — BE InboundController(`/api/warehouse/inbound`) 가 직접 응답.
 * 권한군 격리 — 본사 도메인 store(`purchaseOrder.js`) 의존 X. 그 store 는
 * 마운트 시 `/api/hq/**` 자동 fetch 라 창고 관리자(role=WAREHOUSE) 권한으로 호출 시
 * SecurityConfig 가 차단(401/403). 자체 axios 호출로 분리.
 *
 * BE 응답(PurchaseOrderDto.ListRes / DetailRes) 의 code 를 FE 의 id 로 매핑해
 * 컴포넌트의 `order.id` 호환 유지.
 */
export const useWarehouseInboundStore = defineStore('warehouseInbound', () => {
  // --- state ---
  const items = ref([]) // 입고 후보 발주 목록 (READY_TO_SHIP/IN_TRANSIT/ARRIVED/COMPLETED)
  const selectedDetail = ref(null) // 선택된 발주의 상세 (items + statusHistory 포함)
  const loading = ref(false)
  const error = ref(null)

  // 창고 화면 5탭 — [전체] + 거래처 책임 4단계 (READY_TO_SHIP/IN_TRANSIT/ARRIVED/COMPLETED).
  // 첫 진입 시 [전체] 활성 — STATUS_TABS 첫 항목과 일치시켜 사용자 멘탈 모델 보존.
  // 입고 확정([입고 완료] 액션) 은 ARRIVED 일 때만 가능.
  const activeStatusTab = ref('전체')
  const selectedOrderId = ref(null)
  const searchKeyword = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const sortBy = ref('latest') // 'latest' | 'oldest' | 'priceAsc' | 'priceDesc'

  // --- BE 응답 매핑 ---
  // BE list/detail 응답의 code 를 FE id 로 노출, snake/camel 키 통일.
  function fromListApi(po) {
    return {
      id: po.code,
      code: po.code,
      vendorId: po.vendorCode,
      vendorName: po.vendorName,
      warehouseId: po.warehouseId,
      warehouseName: po.warehouseName,
      warehouseCode: po.warehouseCode,
      status: po.status,
      totalPrice: po.totalAmount,
      itemCount: po.itemCount,
      productNames: po.productNames ?? [],
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      // detail 채워질 때까지 빈 배열로 노출
      items: [],
      statusHistory: [],
    }
  }

  // BE PurchaseOrderDto.DetailRes 응답엔 productNames/itemCount 가 없음 (ListRes 만 보유) —
  // fromListApi 를 spread 하면 두 필드를 빈 값으로 박아 selectOrder→fetchDetail 머지 시
  // list 의 productNames 를 덮는 회귀가 발생. 의도적으로 detail 응답에 실제 있는 필드만 매핑.
  function fromDetailApi(po) {
    return {
      id: po.code,
      code: po.code,
      vendorId: po.vendorCode,
      vendorName: po.vendorName,
      warehouseId: po.warehouseId,
      warehouseName: po.warehouseName,
      warehouseCode: po.warehouseCode,
      status: po.status,
      totalPrice: po.totalAmount,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt,
      items: (po.items ?? []).map((it) => ({
        id: it.skuCode,
        skuCode: it.skuCode,
        productCode: it.productCode,
        productName: it.productName,
        color: it.color,
        size: it.size,
        displayOption: it.displayOption,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
      })),
      statusHistory: (po.statusHistory ?? []).map((h) => ({
        status: h.status,
        at: h.changedAt,
        byName: h.changedByName,
        note: h.note,
      })),
      vendorContactName: po.vendorContactName,
      cancelReason: po.cancelReason,
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
    // '전체' 탭은 모든 입고 후보(READY_TO_SHIP/IN_TRANSIT/ARRIVED/COMPLETED) 노출.
    let list =
      activeStatusTab.value === '전체'
        ? items.value
        : items.value.filter((o) => o.status === activeStatusTab.value)

    if (searchKeyword.value.trim()) {
      const k = searchKeyword.value.trim().toLowerCase()
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(k) ||
          (o.vendorName ?? '').toLowerCase().includes(k) ||
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
        sorted.sort((a, b) => (a.totalPrice ?? 0) - (b.totalPrice ?? 0))
        break
      case 'priceDesc':
        sorted.sort((a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0))
        break
      default:
        sorted.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    }
    return sorted
  })

  // 탭 카운트는 항상 전체 기준 (검색·기간 무관)
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
      // 목록에도 반영 (창고 정보 등 동기화)
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

  // 입고 확정 (WHS-007) — ARRIVED → COMPLETED.
  // BE: POST /api/warehouse/inbound/{code}/confirm (내부적으로 PurchaseOrderService.complete 위임).
  async function confirmInbound(id) {
    await inboundApi.confirm(id)
    await fetchDetail(id)
    // 상태 전이 후 목록 status 갱신 — 단순화 위해 전체 재조회.
    await fetchAll()
  }

  // 마운트 자동 fetch — vendor/circularInventoryBuyers store 패턴 일관.
  fetchAll().catch((err) => {
    console.error('[warehouseInbound] fetchAll 실패', err)
  })

  return {
    // state
    items,
    activeStatusTab,
    selectedOrderId,
    searchKeyword,
    dateFrom,
    dateTo,
    sortBy,
    loading,
    error,
    // getters
    selectedOrder,
    inboundList,
    counts,
    // actions
    fetchAll,
    fetchDetail,
    selectOrder,
    confirmInbound,
  }
})

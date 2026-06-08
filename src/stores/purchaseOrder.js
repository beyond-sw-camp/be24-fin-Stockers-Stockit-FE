import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { purchaseOrderApi } from '@/api/hq/purchaseOrder.js'
import { getInfrastructures } from '@/api/hq/infrastructure.js'
import { useAuthStore } from '@/stores/auth.js'
import {
  VENDOR_PROCESSING_STATUSES,
  toBeCreateReq,
  toBeUpdateReq,
  toFeCatalogRow,
  toFeOrder,
} from '@/stores/purchaseOrder/mappers.js'

export { VENDOR_PROCESSING_STATUSES }

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

    if (activeStatusTab.value === 'VENDOR_PROCESSING') {
      list = list.filter((o) => VENDOR_PROCESSING_STATUSES.includes(o.status))
    } else if (activeStatusTab.value !== '전체') {
      list = list.filter((o) => o.status === activeStatusTab.value)
    }

    if (searchKeyword.value.trim()) {
      const kw = searchKeyword.value.trim().toLowerCase()
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(kw) ||
          o.vendorName.toLowerCase().includes(kw) ||
          (o.productNames ?? []).some((name) => (name ?? '').toLowerCase().includes(kw)),
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

  // ─── 발주내역 클라이언트사이드 페이지네이션 ──────────────────────────────
  // 전체를 로드(fetchOrders size 크게)해 두고, 탭/검색/정렬/합계는 전체(filteredOrders)
  // 기준 그대로 동작시키되 "표시"만 페이지로 끊는다. (서버 페이지네이션은 클라사이드
  // 탭/검색과 충돌하므로 채택 X — 데이터셋 소규모라 전체 로드가 정확+단순)
  const ordersPage = ref(0) // 0-based
  const ordersPageSize = ref(20)
  const ordersTotalElements = computed(() => filteredOrders.value.length)
  const ordersTotalPages = computed(() =>
    Math.max(1, Math.ceil(ordersTotalElements.value / ordersPageSize.value)),
  )
  const pagedOrders = computed(() => {
    const start = ordersPage.value * ordersPageSize.value
    return filteredOrders.value.slice(start, start + ordersPageSize.value)
  })
  const ordersHasPrevious = computed(() => ordersPage.value > 0)
  const ordersHasNext = computed(() => ordersPage.value < ordersTotalPages.value - 1)
  function setOrdersPage(p) {
    ordersPage.value = Math.min(Math.max(0, p), ordersTotalPages.value - 1)
  }
  function setOrdersPageSize(s) {
    ordersPageSize.value = Number(s) || 20
    ordersPage.value = 0
  }
  // 필터/검색 바뀌면 1페이지로 리셋 (정렬은 집합 불변이라 제외)
  watch([activeStatusTab, searchKeyword, vendorFilter, dateFrom, dateTo], () => {
    ordersPage.value = 0
  })

  const statusCounts = computed(() => {
    const all = purchaseOrders.value
    return {
      전체: all.length,
      REQUESTED: all.filter((o) => o.status === 'REQUESTED').length,
      APPROVED: all.filter((o) => o.status === 'APPROVED').length,
      READY_TO_SHIP: all.filter((o) => o.status === 'READY_TO_SHIP').length,
      IN_TRANSIT: all.filter((o) => o.status === 'IN_TRANSIT').length,
      ARRIVED: all.filter((o) => o.status === 'ARRIVED').length,
      COMPLETED: all.filter((o) => o.status === 'COMPLETED').length,
      CANCELLED: all.filter((o) => o.status === 'CANCELLED').length,
      VENDOR_PROCESSING: all.filter((o) => VENDOR_PROCESSING_STATUSES.includes(o.status)).length,
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
    // 취소된(CANCELLED) 발주는 총 발주 합계에서 제외 — 실제 처리되지 않은 금액.
    let base = purchaseOrders.value.filter((o) => o.status !== 'CANCELLED')
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

  // 창고 목록 — BE infrastructure(type=WAREHOUSE)에서 fetch
  const warehouseList = ref([])
  const warehouses = computed(() =>
    warehouseList.value.map((w) => ({ id: w.id, name: w.name, code: w.code })),
  )

  // ─── 카탈로그 (새 발주 페이지) — Page<SkuRowRes> 평탄 row + 페이징 + 서버 필터/facet
  const catalogRows = ref([])
  const catalogPage = ref(0) // 0-based
  const catalogSize = ref(50)
  const catalogTotalElements = ref(0)
  const catalogTotalPages = ref(0)
  const catalogHasNext = ref(false)
  const catalogHasPrevious = ref(false)
  const catalogColors = ref([])
  const catalogSizes = ref([])
  const catalogLoading = ref(false)
  const catalogError = ref(null)

  // 필터 state — view 가 v-model 또는 직접 binding, action 이 서버 재호출
  const catalogVendor = ref('')
  const catalogKeyword = ref('')
  const catalogColor = ref('')
  const catalogSkuSize = ref('')
  const catalogShortageOnly = ref(false)
  const catalogSort = ref('id,asc')
  const catalogWarehouseId = ref(null)

  async function fetchCatalog(overrides = {}) {
    catalogLoading.value = true
    catalogError.value = null
    try {
      const res = await purchaseOrderApi.getCatalog({
        page: overrides.page ?? catalogPage.value,
        size: overrides.size ?? catalogSize.value,
        sort: overrides.sort ?? catalogSort.value,
        vendorCode: overrides.vendor ?? catalogVendor.value,
        keyword: overrides.keyword ?? catalogKeyword.value,
        color: overrides.color ?? catalogColor.value,
        skuSize: overrides.skuSize ?? catalogSkuSize.value,
        shortageOnly: (overrides.shortageOnly ?? catalogShortageOnly.value) ? true : undefined,
        warehouseId: overrides.warehouseId ?? catalogWarehouseId.value,
      })
      catalogRows.value = Array.isArray(res?.content) ? res.content.map(toFeCatalogRow) : []
      catalogPage.value = Number(res?.number ?? 0)
      catalogSize.value = Number(res?.size ?? 50)
      catalogTotalElements.value = Number(res?.totalElements ?? 0)
      catalogTotalPages.value = Number(res?.totalPages ?? 0)
      catalogHasNext.value = !res?.last
      catalogHasPrevious.value = !res?.first
    } catch (e) {
      catalogError.value = e?.message ?? '카탈로그를 불러오지 못했습니다.'
      catalogRows.value = []
      catalogTotalElements.value = 0
      catalogTotalPages.value = 0
      catalogHasNext.value = false
      catalogHasPrevious.value = false
      console.error('[purchaseOrder] fetchCatalog 실패', e)
    } finally {
      catalogLoading.value = false
    }
  }

  async function fetchCatalogFacets() {
    try {
      const res = await purchaseOrderApi.getCatalogFacets({
        vendorCode: catalogVendor.value,
        keyword: catalogKeyword.value,
      })
      catalogColors.value = Array.isArray(res?.colors) ? res.colors : []
      catalogSizes.value = Array.isArray(res?.sizes) ? res.sizes : []
    } catch (e) {
      console.error('[purchaseOrder] fetchCatalogFacets 실패', e)
      catalogColors.value = []
      catalogSizes.value = []
    }
  }

  async function setCatalogPage(p) {
    if (p < 0) return
    await fetchCatalog({ page: p })
  }

  async function setCatalogSize(s) {
    await fetchCatalog({ page: 0, size: s })
  }

  // 필터 변경 — page=0 으로 리셋. vendor/keyword 바뀌면 facet 도 같이 갱신.
  async function applyCatalogFilters(patch = {}) {
    let facetAffected = false
    if ('vendor' in patch) {
      catalogVendor.value = patch.vendor ?? ''
      facetAffected = true
    }
    if ('keyword' in patch) {
      catalogKeyword.value = patch.keyword ?? ''
      facetAffected = true
    }
    if ('color' in patch) catalogColor.value = patch.color ?? ''
    if ('skuSize' in patch) catalogSkuSize.value = patch.skuSize ?? ''
    if ('shortageOnly' in patch) catalogShortageOnly.value = !!patch.shortageOnly
    if ('sort' in patch) catalogSort.value = patch.sort ?? 'id,asc'
    if ('warehouseId' in patch) catalogWarehouseId.value = patch.warehouseId ?? null
    await Promise.all([
      fetchCatalog({ page: 0 }),
      facetAffected ? fetchCatalogFacets() : Promise.resolve(),
    ])
  }

  async function fetchWarehouses() {
    try {
      const list = await getInfrastructures({ type: 'WAREHOUSE' })
      warehouseList.value = Array.isArray(list) ? list : []
    } catch (e) {
      console.error('[purchaseOrder] fetchWarehouses 실패', e)
    }
  }

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
      const res = await purchaseOrderApi.list({ size: 500 })
      // BE 가 Page<ListRes> (po-list-pagination-be) 또는 List 둘 다 대응.
      // 페이지네이션 UI 도입은 별 phase 책임 — 일단 첫 페이지 데이터만 표시.
      const list = Array.isArray(res) ? res : (res?.content ?? [])
      // detail fetch 로 이미 채워진 items/statusHistory 는 list 응답에 미포함 →
      // 통째 reassign 시 덮어쓰지 않도록 prev 캐시 merge. 신규 발주 직후 selectOrder →
      // fetchDetail prepend 와 View 마운트 fetchOrders 의 race 보호.
      const prevMap = new Map(purchaseOrders.value.map((o) => [o.id, o]))
      purchaseOrders.value = list.map((o) => {
        const fe = toFeOrder(o)
        const prev = prevMap.get(fe.id)
        return {
          ...fe,
          items: prev?.items?.length ? prev.items : [],
          statusHistory: prev?.statusHistory?.length ? prev.statusHistory : [],
        }
      })
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
    if (!id) return
    // 상세 fetch 조건:
    //   1) store 에 order 가 아직 없음 (신규 batch 생성 직후 — cartStore.createBatch 는 poStore push 안 함)
    //   2) order 는 있지만 list 응답이라 items/statusHistory 깡통
    // fetchDetail 은 idx < 0 일 때 prepend 로 push 하므로 두 경우 모두 안전.
    const order = purchaseOrders.value.find((o) => o.id === id)
    if (!order || order.items.length === 0 || order.statusHistory.length === 0) {
      fetchDetail(id).catch(() => {
        // fetchDetail 안에서 이미 처리
      })
    }
  }

  /**
   * BE batch 응답(DetailRes[]) 을 store 에 직접 흡수.
   * createBatch 응답은 items + statusHistory 까지 완전 — 별도 fetchDetail 불필요.
   * 같은 id 가 이미 있으면 교체, 없으면 prepend. 정렬은 filteredOrders 가 담당.
   */
  function ingestOrders(beOrders) {
    if (!Array.isArray(beOrders) || beOrders.length === 0) return
    const incoming = beOrders.map(toFeOrder).filter(Boolean)
    const incomingIds = new Set(incoming.map((o) => o.id))
    const kept = purchaseOrders.value.filter((o) => !incomingIds.has(o.id))
    purchaseOrders.value = [...incoming, ...kept]
  }

  async function createOrder(payload) {
    const req = toBeCreateReq(payload)
    const created = await purchaseOrderApi.create(req)
    const fe = toFeOrder(created)
    purchaseOrders.value = [fe, ...purchaseOrders.value]
    return fe
  }

  async function updateOrder(id, { warehouseCode, items }) {
    const req = toBeUpdateReq({ warehouseCode, items })
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
      const changed =
        (result?.approved ?? 0) +
        (result?.readyToShip ?? 0) +
        (result?.inTransit ?? 0) +
        (result?.arrived ?? 0)
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

  // 스토어 생성 시 자동 fetch (vendor store 패턴) — 본사 도메인 API(/api/hq/**)
  // 호출이라 role=hq 일 때만 트리거. 다른 권한군(warehouse/store) 화면이 이 store
  // 를 의존해도(예: warehouseStock) SecurityConfig 가 401/403 차단하지 않도록 안전망.
  // 본사 화면은 명시적으로 fetchOrders/fetchWarehouses 호출 가능.
  const auth = useAuthStore()
  if (auth.user?.role === 'hq') {
    fetchOrders().catch(() => {
      // fetchOrders 안에서 이미 처리
    })
    fetchWarehouses().catch(() => {
      // fetchWarehouses 안에서 이미 처리
    })
  }

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
    // catalog state
    catalogRows,
    catalogPage,
    catalogSize,
    catalogTotalElements,
    catalogTotalPages,
    catalogHasNext,
    catalogHasPrevious,
    catalogColors,
    catalogSizes,
    catalogLoading,
    catalogError,
    catalogVendor,
    catalogKeyword,
    catalogColor,
    catalogSkuSize,
    catalogShortageOnly,
    catalogSort,
    catalogWarehouseId,
    // getters
    selectedOrder,
    filteredOrders,
    pagedOrders,
    ordersPage,
    ordersPageSize,
    ordersTotalPages,
    ordersTotalElements,
    ordersHasPrevious,
    ordersHasNext,
    setOrdersPage,
    setOrdersPageSize,
    statusCounts,
    vendorOptions,
    summary,
    warehouses,
    // actions
    selectOrder,
    fetchOrders,
    fetchDetail,
    ingestOrders,
    fetchWarehouses,
    createOrder,
    updateOrder,
    cancelOrder,
    markCompleted,
    runBatch,
    // catalog actions
    fetchCatalog,
    fetchCatalogFacets,
    setCatalogPage,
    setCatalogSize,
    applyCatalogFilters,
  }
})

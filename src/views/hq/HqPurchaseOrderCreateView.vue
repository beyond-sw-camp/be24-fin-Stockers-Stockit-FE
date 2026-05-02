<script setup>
import { computed, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'
import { useWarehouseStockStore } from '@/stores/warehouseStock.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const poStore = usePurchaseOrderStore()
const stockStore = useWarehouseStockStore()

// ─── SKU 단위 재고 (FE 시뮬레이션 — BE 인벤토리 도메인 합류 전 임시) ───
// 카탈로그 행이 SKU 단위라 행마다 가용/실/안전/권장 4값 노출.
// 인벤토리 SKU BE 합류 시 store 의 시뮬레이션 함수만 axios 로 교체하면 view 수정 0.
function rowStock(skuCode) {
  if (!selectedWarehouseCode.value || !skuCode) return null
  return stockStore.getSkuStock(selectedWarehouseCode.value, skuCode)
}

function rowStockLevel(skuCode) {
  return stockStore.getSkuStockLevel(rowStock(skuCode))
}

function rowSuggested(skuCode) {
  return stockStore.getSkuSuggestedQuantity(rowStock(skuCode))
}

function stockLevelClass(level) {
  if (level === 'critical') return 'text-red-600'
  if (level === 'warning') return 'text-amber-600'
  return 'text-gray-700'
}

const DRAFT_KEY = 'stockit:po-cart-draft'

const isEditMode = computed(() => route.name === 'hq-purchase-order-edit')
const editingOrderId = computed(() => route.params.id ?? null)

// ─── 레이아웃 ────────────────────────────────────────────────────────────────
const hqMenus = roleMenus.hq
const activeTopMenu = computed(() => '주문/발주 관리')
const sideMenus = [
  { label: '매장 주문', icon: 'file', path: '/hq/orders' },
  { label: '거래처 발주', icon: 'truck', path: '/hq/purchase-orders' },
  { label: '거래처 관리', icon: 'briefcase', path: '/hq/vendors' },
]
const activeSideMenu = ref('거래처 발주')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ─── state ───────────────────────────────────────────────────────────────────
const selectedWarehouseCode = ref('')
const keyword = ref('')
const vendorFilter = ref('all')
const sortBy = ref('default')
const cart = ref([])

// 창고 변경 confirm
const showWarehouseChangeConfirm = ref(false)
const pendingWarehouseId = ref(null)
// 거래처 전환 confirm (한 발주서 = 한 거래처 정책)
const showVendorSwitchConfirm = ref(false)
const pendingNewVendorProduct = ref(null)
// 장바구니 비우기 confirm
const showClearCartConfirm = ref(false)
// 발주 요청 최종 확인
const showSubmitConfirm = ref(false)

// 행 안 수량 입력 — { [skuCode]: number }. cart 담은 후 0 으로 reset.
const rowQuantities = ref({})
// 그룹 접힘 상태 — { [masterKey]: boolean }
const collapsed = ref({})
// 부족만 보기 토글 (마스터 단위 — 그룹 헤더의 가용재고 < 안전재고 × 1.5 인 그룹만)
const shortageOnly = ref(false)

// ─── Power 모드 ─────────────────────────────────────────────────────────────
// 다중 선택: skuCode set
const selectedSkus = ref(new Set())
// 옵션 facet 필터: { [axisName]: Set<value> } — 같은 axis 안 OR, 다른 axis 끼리 AND
const activeFacetFilters = reactive({})
// 일괄 입력 모달
const showBulkQtyModal = ref(false)
const bulkQtyInput = ref(0)
// 검색창 ref (단축키용)
const searchInputRef = ref(null)
// cart 강조용 — [좌측에서 보기] / [장바구니에서 보기] 점프 시 잠시 highlight
const highlightedSkuCode = ref('')
let highlightTimer = null

function highlightCart(skuCode) {
  highlightedSkuCode.value = skuCode
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => {
    highlightedSkuCode.value = ''
  }, 1500)
}

// 양방향 점프 — 카탈로그 → cart, cart → 카탈로그
function scrollToCartSku(skuCode) {
  const el = document.querySelector(`[data-cart-sku-code="${skuCode}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    highlightCart(skuCode)
  }
}

function scrollToCatalogSku(skuCode) {
  // 그룹이 접혀 있으면 펼침
  const skuRow = catalogSkuRows.value.find((r) => r.type === 'sku' && r.skuCode === skuCode)
  if (skuRow && collapsed.value[skuRow.masterKey]) {
    collapsed.value[skuRow.masterKey] = false
  }
  nextTick(() => {
    const el = document.querySelector(`[data-sku-code="${skuCode}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

function isInCart(skuCode) {
  return cart.value.some((item) => item.skuCode === skuCode)
}

function toggleSkuSelected(skuCode) {
  const set = new Set(selectedSkus.value)
  if (set.has(skuCode)) set.delete(skuCode)
  else set.add(skuCode)
  selectedSkus.value = set
}

function isGroupAllSelected(masterKey) {
  const skus = filteredRows.value.filter((r) => r.type === 'sku' && r.masterKey === masterKey)
  if (skus.length === 0) return false
  return skus.every((s) => selectedSkus.value.has(s.skuCode))
}

function isGroupSomeSelected(masterKey) {
  const skus = filteredRows.value.filter((r) => r.type === 'sku' && r.masterKey === masterKey)
  return skus.some((s) => selectedSkus.value.has(s.skuCode)) && !isGroupAllSelected(masterKey)
}

function toggleGroupSelected(masterKey, evt) {
  // 그룹 헤더 행 클릭과 충돌 방지 — 이벤트 stop 은 호출처에서
  evt?.stopPropagation?.()
  const skus = filteredRows.value.filter((r) => r.type === 'sku' && r.masterKey === masterKey)
  const set = new Set(selectedSkus.value)
  const allSelected = skus.every((s) => set.has(s.skuCode))
  for (const s of skus) {
    if (allSelected) set.delete(s.skuCode)
    else set.add(s.skuCode)
  }
  selectedSkus.value = set
}

function clearSelection() {
  selectedSkus.value = new Set()
}

function selectAllVisible() {
  const set = new Set()
  for (const r of filteredRows.value) {
    if (r.type === 'sku') set.add(r.skuCode)
  }
  selectedSkus.value = set
}

// facet 필터 토글 — axis 안 다중 선택 OR, 다른 axis AND
function toggleFacet(axisName, value) {
  const cur = activeFacetFilters[axisName] ?? new Set()
  const next = new Set(cur)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  if (next.size === 0) delete activeFacetFilters[axisName]
  else activeFacetFilters[axisName] = next
}

function isFacetActive(axisName, value) {
  return activeFacetFilters[axisName]?.has(value) ?? false
}

function clearFacets() {
  for (const k of Object.keys(activeFacetFilters)) delete activeFacetFilters[k]
}

function skuMatchesFacets(row) {
  const filters = Object.entries(activeFacetFilters)
  if (filters.length === 0) return true
  for (const [axisName, valueSet] of filters) {
    const current = axisName === '색상' ? row.color : axisName === '사이즈' ? row.size : ''
    if (!valueSet.has(current)) return false
  }
  return true
}

// 일괄 입력 모달
function openBulkQtyModal() {
  if (selectedSkus.value.size === 0) return
  bulkQtyInput.value = 0
  showBulkQtyModal.value = true
}

function closeBulkQtyModal() {
  showBulkQtyModal.value = false
  bulkQtyInput.value = 0
}

function applyBulkQty() {
  const qty = Number(bulkQtyInput.value) || 0
  if (qty <= 0) {
    triggerToast('수량을 입력하세요.')
    return
  }
  if (!selectedWarehouseCode.value) {
    triggerToast('먼저 입고 창고를 선택해주세요.')
    return
  }
  // 선택된 SKU 들의 vendorCode 가 cart 거래처와 다른 게 섞여 있으면 거절 (한 거래처 룰)
  const selectedRows = []
  for (const r of catalogSkuRows.value) {
    if (r.type === 'sku' && selectedSkus.value.has(r.skuCode)) selectedRows.push(r)
  }
  if (selectedRows.length === 0) return
  const firstVendor = selectedRows[0].vendorCode
  const sameVendor = selectedRows.every((r) => r.vendorCode === firstVendor)
  if (!sameVendor) {
    triggerToast('서로 다른 거래처 SKU 가 섞여 있습니다.')
    return
  }
  if (currentCartVendorId.value && firstVendor !== currentCartVendorId.value) {
    triggerToast('장바구니의 거래처와 다릅니다. 장바구니를 비우고 다시 시도하세요.')
    return
  }
  for (const row of selectedRows) {
    pushSku(row, qty)
    rowQuantities.value[row.skuCode] = 0
  }
  saveDraft()
  selectedSkus.value = new Set()
  closeBulkQtyModal()
  triggerToast(`${selectedRows.length}개 SKU 를 ${qty}개씩 담았습니다.`)
}

// 키보드 단축
function handleKeydown(e) {
  const target = e.target
  const inEditable = target instanceof HTMLElement
    && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

  if (e.key === 'Escape') {
    if (showBulkQtyModal.value) {
      closeBulkQtyModal()
      e.preventDefault()
      return
    }
    if (selectedSkus.value.size > 0) {
      clearSelection()
      e.preventDefault()
      return
    }
    if (target === searchInputRef.value) {
      searchInputRef.value?.blur?.()
    }
    return
  }

  if (e.key === '/' && !inEditable) {
    searchInputRef.value?.focus?.()
    e.preventDefault()
    return
  }

  if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
    if (!inEditable) {
      selectAllVisible()
      e.preventDefault()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (highlightTimer) clearTimeout(highlightTimer)
  if (toastTimer) clearTimeout(toastTimer)
})

// 토스트
const toast = ref({ show: false, message: '' })
let toastTimer = null
function triggerToast(message) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message }
  toastTimer = setTimeout(() => {
    toast.value = { show: false, message: '' }
  }, 3000)
}

// ─── computed ────────────────────────────────────────────────────────────────
// 카탈로그 = poStore 의 평탄 row 배열 (header + sku 행 섞여 있음).
// 검색·정렬·필터·그룹 접힘은 view 단에서 적용해 filteredRows 만들어 v-for.
const catalogSkuRows = computed(() => poStore.catalogSkuRows)
const catalogFacets = computed(() => poStore.catalogFacets)
const catalogLoading = computed(() => poStore.catalogLoading)

// 검색·정렬을 적용한 row 들. 정렬은 SKU 단가/제품명 기준 — 그룹 단위로 묶이도록 group key 우선 정렬.
const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const all = catalogSkuRows.value
  if (all.length === 0) return []

  // 1) SKU 행만 추출해서 검색·정렬·facet 필터 적용
  let skus = all.filter((r) => r.type === 'sku')
  if (kw) {
    skus = skus.filter((r) =>
      [r.vendorName, r.productName, r.productCode, r.skuCode, r.color, r.size, r.displayOption]
        .some((s) => (s ?? '').toLowerCase().includes(kw)),
    )
  }
  skus = skus.filter(skuMatchesFacets)

  // 부족만 보기 — SKU 단위 stock 임계 기준
  if (shortageOnly.value && selectedWarehouseCode.value) {
    skus = skus.filter((r) => {
      const level = rowStockLevel(r.skuCode)
      return level === 'critical' || level === 'warning'
    })
  }
  switch (sortBy.value) {
    case 'priceAsc':
      skus = [...skus].sort((a, b) => a.unitPrice - b.unitPrice)
      break
    case 'priceDesc':
      skus = [...skus].sort((a, b) => b.unitPrice - a.unitPrice)
      break
    case 'nameAsc':
      skus = [...skus].sort((a, b) =>
        a.productName.localeCompare(b.productName, 'ko') || (a.displayOption || '').localeCompare((b.displayOption || ''), 'ko'),
      )
      break
    default:
      // BE 응답 순서 그대로 (vendorName → productName → SKU id asc)
      break
  }

  // 2) masterKey 기준으로 그룹 헤더 + SKU 행을 다시 묶어서 반환 (정렬은 그룹 안 SKU 순서 유지)
  const skusByMaster = new Map()
  for (const s of skus) {
    if (!skusByMaster.has(s.masterKey)) skusByMaster.set(s.masterKey, [])
    skusByMaster.get(s.masterKey).push(s)
  }
  const headerByMaster = new Map()
  for (const r of all) {
    if (r.type === 'header') headerByMaster.set(r.masterKey, r)
  }

  const baseResult = []
  for (const [masterKey, skuList] of skusByMaster) {
    const header = headerByMaster.get(masterKey)
    if (!header) continue
    baseResult.push(header)
    if (!collapsed.value[masterKey]) {
      baseResult.push(...skuList)
    }
  }

  // vendorFilter === 'all' 일 때만 vendor row 삽입 — 거래처 단위 sticky 그룹.
  // 특정 거래처 필터 시엔 select 에 이미 vendor 표시되어 잉여라 생략.
  if (vendorFilter.value !== 'all') return baseResult

  const result = []
  let lastVendor = null
  for (const r of baseResult) {
    if (r.type === 'header' && r.vendorCode !== lastVendor) {
      result.push({
        type: 'vendor',
        vendorCode: r.vendorCode,
        vendorName: r.vendorName,
      })
      lastVendor = r.vendorCode
    }
    result.push(r)
  }
  return result
})

// 매칭 SKU 수 (헤더 제외)
const matchedSkuCount = computed(() => filteredRows.value.filter((r) => r.type === 'sku').length)

// 카탈로그 부족 SKU 카운트 — SKU 단위
const shortageCount = computed(() => {
  if (!selectedWarehouseCode.value) return 0
  const skuCodes = catalogSkuRows.value
    .filter((r) => r.type === 'sku')
    .map((r) => r.skuCode)
  return stockStore.getSkuShortageCount(selectedWarehouseCode.value, skuCodes)
})

// SKU 행 [권장 N] 클릭 → 그 SKU 의 행 수량 input 에 set + 포커스
function applySuggestedToSku(row) {
  const suggested = rowSuggested(row.skuCode)
  if (suggested <= 0) return
  rowQuantities.value[row.skuCode] = suggested
  nextTick(() => {
    const el = document.querySelector(`[data-sku-code="${row.skuCode}"] input[type="number"]`)
    if (el) {
      el.focus()
      el.select?.()
    }
  })
}

// 그룹 안 SKU 수 (펼침/접힘과 무관, 검색 매칭 후) — 헤더에 표시할 카운트용
function groupMatchedCount(masterKey) {
  return filteredRows.value.filter((r) => r.type === 'sku' && r.masterKey === masterKey).length
}

// vendorOptions — 카탈로그 안 unique vendor 만 (드롭다운 출처)
const vendorOptions = computed(() => {
  const seen = new Map()
  for (const r of catalogSkuRows.value) {
    if (r.type === 'header' && !seen.has(r.vendorCode)) {
      seen.set(r.vendorCode, { id: r.vendorCode, code: r.vendorCode, name: r.vendorName })
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
})

function rowKey(row) {
  if (row.type === 'vendor') return `v-${row.vendorCode}`
  if (row.type === 'header') return `h-${row.masterKey}`
  return `s-${row.skuCode}`
}

function priceRangeText(header) {
  if (header.minSkuUnitPrice === header.maxSkuUnitPrice) {
    return `₩${header.minSkuUnitPrice.toLocaleString()}`
  }
  return `₩${header.minSkuUnitPrice.toLocaleString()}~${header.maxSkuUnitPrice.toLocaleString()}`
}

function toggleGroup(masterKey) {
  collapsed.value[masterKey] = !collapsed.value[masterKey]
}

// 거래처 단위 접기/펼치기 — 그 vendor 의 모든 master 토글
function isVendorAllCollapsed(vendorCode) {
  const masters = catalogSkuRows.value.filter(
    (r) => r.type === 'header' && r.vendorCode === vendorCode,
  )
  if (masters.length === 0) return false
  return masters.every((m) => collapsed.value[m.masterKey])
}

function toggleVendorGroup(vendorCode) {
  const masters = catalogSkuRows.value.filter(
    (r) => r.type === 'header' && r.vendorCode === vendorCode,
  )
  const allCollapsed = masters.every((m) => collapsed.value[m.masterKey])
  const next = { ...collapsed.value }
  for (const m of masters) {
    next[m.masterKey] = !allCollapsed
  }
  collapsed.value = next
}

function expandAll() {
  collapsed.value = {}
}

function collapseAll() {
  const next = {}
  for (const r of catalogSkuRows.value) {
    if (r.type === 'header') next[r.masterKey] = true
  }
  collapsed.value = next
}

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
)

const canSubmit = computed(() => !!selectedWarehouseCode.value && cart.value.length > 0)

const currentCartVendorId = computed(() =>
  cart.value.length > 0 ? cart.value[0].vendorId : null,
)

const currentCartVendorName = computed(() =>
  cart.value.length > 0 ? cart.value[0].vendorName : '',
)

const pendingWarehouseName = computed(() => {
  if (!pendingWarehouseId.value) return ''
  return poStore.warehouses.find((w) => w.code === pendingWarehouseId.value)?.name ?? ''
})

const pendingNewVendorName = computed(() => pendingNewVendorProduct.value?.vendorName ?? '')

const selectedWarehouseName = computed(
  () => poStore.warehouses.find((w) => w.code === selectedWarehouseCode.value)?.name ?? '',
)

// ─── localStorage 영속화 ──────────────────────────────────────────────────────
function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) return
    const data = JSON.parse(saved)
    if (data && typeof data === 'object') {
      selectedWarehouseCode.value = data.warehouseCode ?? data.warehouseId ?? ''
      cart.value = Array.isArray(data.items) ? data.items : []
    }
  } catch {
    // 무시
  }
}

function saveDraft() {
  if (isEditMode.value) return // edit 모드는 localStorage 영속화 안 함
  try {
    const payload = {
      warehouseCode: selectedWarehouseCode.value,
      items: cart.value,
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
  } catch {
    // 무시
  }
}

function clearDraftStorage() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // 무시
  }
}

// ─── 장바구니 액션 ───────────────────────────────────────────────────────────
// SKU 행 [+] 클릭 → 행 안 수량 input 값을 cart 로 push. 동일 SKU 가 cart 에 있으면 합산.
// 한 발주서 = 한 거래처 정책 — cart 에 다른 거래처가 있으면 거래처 전환 confirm.
function addSkuToCart(row) {
  if (!selectedWarehouseCode.value) {
    triggerToast('먼저 입고 창고를 선택해주세요.')
    return
  }
  const qty = Number(rowQuantities.value[row.skuCode]) || 0
  if (qty <= 0) {
    triggerToast('수량을 입력하세요.')
    return
  }
  if (currentCartVendorId.value && row.vendorCode !== currentCartVendorId.value) {
    pendingNewVendorProduct.value = row
    showVendorSwitchConfirm.value = true
    return
  }
  pushSku(row, qty)
  rowQuantities.value[row.skuCode] = 0
  saveDraft()
}

function pushSku(row, qty) {
  const existing = cart.value.find((item) => item.skuCode === row.skuCode)
  if (existing) {
    existing.quantity += qty
  } else {
    cart.value.push({
      productId: row.vendorProductCode,
      productCode: row.productCode,
      productName: row.productName,
      vendorId: row.vendorCode,
      vendorName: row.vendorName,
      skuCode: row.skuCode,
      color: row.color,
      size: row.size,
      displayOption: row.displayOption,
      unitPrice: row.unitPrice,
      quantity: qty,
    })
  }
}

// Shift+Enter — 그룹 안 모든 수량 입력된 SKU 일괄 담기
function addGroupToCart(masterKey) {
  if (!selectedWarehouseCode.value) {
    triggerToast('먼저 입고 창고를 선택해주세요.')
    return
  }
  const skus = catalogSkuRows.value.filter((r) => r.type === 'sku' && r.masterKey === masterKey)
  if (skus.length === 0) return
  // 한 거래처 룰
  const vendorCode = skus[0].vendorCode
  if (currentCartVendorId.value && vendorCode !== currentCartVendorId.value) {
    triggerToast('장바구니의 거래처와 다릅니다.')
    return
  }
  let added = 0
  for (const row of skus) {
    const qty = Number(rowQuantities.value[row.skuCode]) || 0
    if (qty <= 0) continue
    pushSku(row, qty)
    rowQuantities.value[row.skuCode] = 0
    added++
  }
  if (added === 0) {
    triggerToast('수량을 입력한 SKU 가 없습니다.')
    return
  }
  saveDraft()
  triggerToast(`${added}개 SKU 를 담았습니다.`)
}

function confirmVendorSwitch() {
  const row = pendingNewVendorProduct.value
  cart.value = []
  if (row) {
    const qty = Number(rowQuantities.value[row.skuCode]) || 0
    if (qty > 0) pushSku(row, qty)
    rowQuantities.value[row.skuCode] = 0
  }
  pendingNewVendorProduct.value = null
  showVendorSwitchConfirm.value = false
  saveDraft()
}

function cancelVendorSwitch() {
  pendingNewVendorProduct.value = null
  showVendorSwitchConfirm.value = false
}

function updateQty(idx, qty) {
  const num = parseInt(qty, 10)
  if (Number.isNaN(num) || num < 1) return
  cart.value[idx].quantity = num
  saveDraft()
}

function increaseQty(idx) {
  cart.value[idx].quantity += 1
  saveDraft()
}

function decreaseQty(idx) {
  if (cart.value[idx].quantity <= 1) return
  cart.value[idx].quantity -= 1
  saveDraft()
}

function removeItem(idx) {
  cart.value.splice(idx, 1)
  saveDraft()
}

function openClearCartConfirm() {
  if (cart.value.length === 0) return
  showClearCartConfirm.value = true
}

function confirmClearCart() {
  cart.value = []
  showClearCartConfirm.value = false
  saveDraft()
}

function cancelClearCart() {
  showClearCartConfirm.value = false
}

// ─── 창고 변경 ────────────────────────────────────────────────────────────────
function handleWarehouseChange(newId) {
  if (newId === selectedWarehouseCode.value) return
  if (cart.value.length === 0) {
    selectedWarehouseCode.value = newId
    saveDraft()
    return
  }
  // cart 가 비어있지 않으면 confirm
  pendingWarehouseId.value = newId
  showWarehouseChangeConfirm.value = true
  // select DOM 값을 selectedWarehouseCode 로 강제 원복 (취소 시 어색하지 않게)
  nextTick(() => {
    if (warehouseSelectRef.value) {
      warehouseSelectRef.value.value = selectedWarehouseCode.value
    }
  })
}

function confirmWarehouseChange() {
  selectedWarehouseCode.value = pendingWarehouseId.value
  cart.value = []
  pendingWarehouseId.value = null
  showWarehouseChangeConfirm.value = false
  saveDraft()
}

function cancelWarehouseChange() {
  pendingWarehouseId.value = null
  showWarehouseChangeConfirm.value = false
}

const warehouseSelectRef = ref(null)

// ─── 발주 요청 ────────────────────────────────────────────────────────────────
function openSubmitConfirm() {
  if (!canSubmit.value) return
  // 방어: 한 거래처 정책 (이론상 발생 X 안전망)
  const firstVendorId = cart.value[0].vendorId
  const allSameVendor = cart.value.every((i) => i.vendorId === firstVendorId)
  if (!allSameVendor) {
    triggerToast('한 발주서에는 한 거래처 품목만 담을 수 있습니다.')
    return
  }
  showSubmitConfirm.value = true
}

function cancelSubmitOrder() {
  showSubmitConfirm.value = false
}

async function confirmSubmitOrder() {
  showSubmitConfirm.value = false
  const items = cart.value.map((i) => ({
    productId: i.productId,
    productCode: i.productCode,
    productName: i.productName,
    skuCode: i.skuCode,
    color: i.color,
    size: i.size,
    displayOption: i.displayOption,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    subtotal: i.unitPrice * i.quantity,
  }))

  try {
    if (isEditMode.value) {
      // 가드 재검증 — 다른 곳에서 상태 바뀌었을 수 있음
      const order = poStore.purchaseOrders.find((o) => o.id === editingOrderId.value)
      if (!order || order.status !== 'PENDING') {
        triggerToast('상태가 변경되어 수정할 수 없습니다')
        setTimeout(() => router.replace({ name: 'hq-purchase-orders' }), 900)
        return
      }
      await poStore.updateOrder(editingOrderId.value, {
        warehouseCode: selectedWarehouseCode.value,
        items,
      })
      poStore.selectOrder(editingOrderId.value)
      triggerToast('발주가 수정되었습니다')
    } else {
      const newOrder = await poStore.createOrder({
        warehouseCode: selectedWarehouseCode.value,
        vendorId: cart.value[0].vendorId,
        vendorName: cart.value[0].vendorName,
        items,
        memberId: auth.user?.memberId ?? 'MB-003',
        memberName: auth.user?.name ?? '이선엽',
      })
      cart.value = []
      clearDraftStorage()
      poStore.selectOrder(newOrder.id)
      triggerToast('발주가 요청되었습니다')
    }

    setTimeout(() => {
      router.push({ name: 'hq-purchase-orders' })
    }, 900)
  } catch (e) {
    triggerToast(e?.message ?? '발주 처리에 실패했습니다')
  }
}

// ─── 수정 모드 초기화 ────────────────────────────────────────────────────────
function initEditMode() {
  const id = editingOrderId.value
  const order = poStore.purchaseOrders.find((o) => o.id === id)
  if (!order) {
    triggerToast('발주를 찾을 수 없습니다')
    setTimeout(() => router.replace({ name: 'hq-purchase-orders' }), 900)
    return
  }
  if (order.status !== 'PENDING') {
    triggerToast('승인 대기 상태의 발주만 수정할 수 있습니다')
    setTimeout(() => router.replace({ name: 'hq-purchase-orders' }), 900)
    return
  }
  selectedWarehouseCode.value = order.warehouseCode || ''
  vendorFilter.value = order.vendorId // 거래처 잠금 (BE vendorCode)
  cart.value = order.items.map((i) => ({
    productId: i.productId,
    productCode: i.productCode,
    productName: i.productName,
    skuCode: i.skuCode ?? '',
    color: i.color ?? '',
    size: i.size ?? '',
    displayOption: i.displayOption ?? [i.color, i.size].filter(Boolean).join('/'),
    vendorId: order.vendorId,
    vendorName: order.vendorName,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
  }))
}

// ─── mounted + vendorFilter watch (카탈로그 fetch) ─────────────────────────
function effectiveVendorCode() {
  return vendorFilter.value && vendorFilter.value !== 'all' ? vendorFilter.value : ''
}

function reloadCatalog() {
  poStore.fetchCatalog({
    vendorCode: effectiveVendorCode(),
    warehouseCode: selectedWarehouseCode.value,
  }).catch((err) => {
    console.error('[HqPurchaseOrderCreateView] fetchCatalog 실패', err)
  })
}

onMounted(() => {
  if (isEditMode.value) {
    initEditMode()
  } else {
    loadDraft()
  }
  reloadCatalog()
})

// 거래처 필터 변경 시 server-side 재 fetch (한 거래처 결과만 받기)
watch(vendorFilter, () => {
  reloadCatalog()
})

// ─── 아이콘 ──────────────────────────────────────────────────────────────────
const IconBase = (paths) => ({
  props: {
    size: { type: Number, default: 16 },
    strokeWidth: { type: Number, default: 2 },
  },
  render() {
    return h(
      'svg',
      {
        width: this.size,
        height: this.size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': this.strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
      },
      paths.map((p) => h(p.tag, p.attrs)),
    )
  },
})

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])
const PlusIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 5v14' } },
  { tag: 'path', attrs: { d: 'M5 12h14' } },
])
const TrashIcon = IconBase([
  { tag: 'polyline', attrs: { points: '3 6 5 6 21 6' } },
  { tag: 'path', attrs: { d: 'M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' } },
  { tag: 'path', attrs: { d: 'M10 11v6' } },
  { tag: 'path', attrs: { d: 'M14 11v6' } },
])
const ArrowLeftIcon = IconBase([
  { tag: 'path', attrs: { d: 'M19 12H5' } },
  { tag: 'path', attrs: { d: 'm12 19-7-7 7-7' } },
])
const ShoppingCartIcon = IconBase([
  { tag: 'circle', attrs: { cx: '9', cy: '21', r: '1' } },
  { tag: 'circle', attrs: { cx: '20', cy: '21', r: '1' } },
  { tag: 'path', attrs: { d: 'M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6' } },
])
const AlertTriangleIcon = IconBase([
  { tag: 'path', attrs: { d: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z' } },
  { tag: 'path', attrs: { d: 'M12 9v4' } },
  { tag: 'path', attrs: { d: 'M12 17h.01' } },
])
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex h-[calc(100vh-100px)] min-w-0 flex-col gap-4 overflow-hidden">
      <!-- 상단 바 -->
      <section
        class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white p-3 shadow-sm"
      >
        <button
          type="button"
          class="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#004D3C]"
          @click="router.push({ name: 'hq-purchase-orders' })"
        >
          <ArrowLeftIcon :size="14" />
          발주 목록으로
        </button>

        <div class="ml-2 flex items-center gap-2">
          <label class="text-[11px] font-black uppercase tracking-wider text-gray-500">
            입고 창고
          </label>
          <select
            ref="warehouseSelectRef"
            :value="selectedWarehouseCode"
            class="border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            @change="handleWarehouseChange($event.target.value)"
          >
            <option value="">창고 선택</option>
            <option v-for="wh in poStore.warehouses" :key="wh.code" :value="wh.code">
              {{ wh.name }}
            </option>
          </select>
        </div>

        <span
          v-if="isEditMode"
          class="ml-auto inline-flex items-center gap-1 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700"
        >
          수정 중: {{ editingOrderId }} · {{ currentCartVendorName }}
        </span>
        <span
          v-else-if="cart.length > 0"
          class="ml-auto inline-flex items-center gap-1 bg-[#E6F2F0] px-2 py-1 text-[10px] font-bold text-[#004D3C]"
        >
          임시 저장된 품목 {{ cart.length }}건
        </span>
      </section>

      <!-- 본문: 좌(카탈로그) + 우(장바구니) — viewport 높이 기준 자체 스크롤 -->
      <section class="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        <!-- ── 좌측: 카탈로그 ── -->
        <div
          class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
        >
          <!-- 필터 헤더 -->
          <div
            class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2 pr-[15px]"
          >
            <label class="relative block">
              <SearchIcon
                :size="14"
                class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                ref="searchInputRef"
                v-model="keyword"
                type="text"
                placeholder='제품명/SKU코드/옵션값 검색  ("/" 로 포커스)'
                class="w-72 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C]"
              />
            </label>
            <select
              v-model="vendorFilter"
              :disabled="isEditMode"
              class="border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="all">전체 거래처</option>
              <option v-for="v in vendorOptions" :key="v.code" :value="v.code">
                {{ v.name }}
              </option>
            </select>
            <select
              v-model="sortBy"
              class="border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            >
              <option value="default">정렬: 기본</option>
              <option value="priceAsc">단가 ↑</option>
              <option value="priceDesc">단가 ↓</option>
              <option value="nameAsc">제품명 ㄱ-ㄴ</option>
            </select>
            <button
              type="button"
              class="border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
              @click="expandAll"
            >
              전체 펼치기
            </button>
            <button
              type="button"
              class="border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
              @click="collapseAll"
            >
              전체 접기
            </button>
            <button
              type="button"
              class="border px-3 py-1.5 text-[11px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                shortageOnly
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : shortageCount > 0
                    ? 'border-red-300 bg-white text-red-600 hover:bg-red-50'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              "
              :disabled="!selectedWarehouseCode || shortageCount === 0"
              :title="!selectedWarehouseCode ? '먼저 창고를 선택하세요' : (shortageCount === 0 ? '재고 부족 품목 없음' : '가용재고가 안전재고 1.5배 미만인 마스터만 표시')"
              @click="shortageOnly = !shortageOnly"
            >
              {{ shortageOnly ? `✓ 부족만 (${shortageCount})` : (selectedWarehouseCode && shortageCount > 0 ? `부족만 보기 (${shortageCount})` : '부족만 보기') }}
            </button>
            <span class="ml-auto text-[11px] font-bold text-gray-500">
              SKU {{ matchedSkuCount }}건
            </span>
          </div>

          <!-- Facet 필터 칩 (옵션 axis 별) -->
          <div
            v-if="catalogFacets.length > 0"
            class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-2 py-2 pr-[15px]"
          >
            <div v-for="facet in catalogFacets" :key="facet.name" class="flex items-center gap-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-gray-400">
                {{ facet.name }}
              </span>
              <button
                v-for="value in facet.values"
                :key="`${facet.name}-${value}`"
                type="button"
                class="border px-2 py-0.5 text-[10px] font-bold transition-colors"
                :class="isFacetActive(facet.name, value)
                  ? 'border-[#004D3C] bg-[#004D3C] text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
                @click="toggleFacet(facet.name, value)"
              >
                {{ value }}
              </button>
            </div>
            <button
              v-if="Object.keys(activeFacetFilters).length > 0"
              type="button"
              class="ml-auto text-[10px] font-bold text-gray-500 hover:text-gray-700 underline"
              @click="clearFacets"
            >
              필터 초기화
            </button>
          </div>

          <!-- 창고 미선택 안내 -->
          <div
            v-if="!selectedWarehouseCode"
            class="border-b border-amber-200 bg-amber-50 px-3 py-2 pr-[15px] text-[11px] font-bold text-amber-700"
          >
            입고 창고를 먼저 선택해주세요. 창고가 정해져야 발주서를 만들 수 있습니다.
          </div>

          <!-- 카탈로그 테이블 — 카드 내부 자체 스크롤. 그룹 헤더 sticky. -->
          <div class="min-h-0 flex-1 overflow-auto">
            <table class="w-full table-fixed border-collapse text-xs">
              <thead class="bg-gray-100 text-xs text-gray-500">
                <tr>
                  <th class="w-8 px-1 py-2 text-center font-black"></th>
                  <th class="w-48 px-2 py-2 text-left font-black">옵션</th>
                  <th class="w-28 px-2 py-2 text-left font-black">SKU 코드</th>
                  <th class="w-20 px-2 py-2 text-right font-black">단가</th>
                  <th class="w-12 px-2 py-2 text-right font-black" title="실재고 + 입고예정 - 출고예정">가용</th>
                  <th class="w-12 px-2 py-2 text-right font-black" title="실재고 (현재 보유)">실</th>
                  <th class="w-12 px-2 py-2 text-right font-black" title="안전재고 (이 밑으로 떨어지면 안 됨)">안전</th>
                  <th class="w-14 px-2 py-2 text-right font-black" title="안전재고 × 1.5 까지 채우는 권장 발주 수량">권장</th>
                  <th class="w-14 px-1 py-2 text-center font-black">수량</th>
                  <th class="w-12 px-2 py-2 text-center font-black"></th>
                </tr>
              </thead>
              <tbody :class="!selectedWarehouseCode ? 'pointer-events-none opacity-50' : ''">
                <template v-for="row in filteredRows" :key="rowKey(row)">
                  <!-- 거래처 헤더 (전체 거래처 모드 only) -->
                  <tr
                    v-if="row.type === 'vendor'"
                    class="bg-[#004D3C] text-white cursor-pointer select-none"
                    @click="toggleVendorGroup(row.vendorCode)"
                  >
                    <td class="w-8 px-1 py-2 text-center align-middle">
                      <span class="text-xs font-black">
                        {{ isVendorAllCollapsed(row.vendorCode) ? '▸' : '▾' }}
                      </span>
                    </td>
                    <td colspan="9" class="px-2 py-2 align-middle">
                      <span class="text-[11px] font-black uppercase tracking-wider">
                        {{ row.vendorName }}
                      </span>
                    </td>
                  </tr>
                  <!-- 제품 헤더 -->
                  <tr
                    v-else-if="row.type === 'header'"
                    class="bg-[#E6F2F0] cursor-pointer select-none"
                    @click="toggleGroup(row.masterKey)"
                  >
                    <td class="px-1 py-2 text-center ">
                      <input
                        v-if="!collapsed[row.masterKey]"
                        type="checkbox"
                        :checked="isGroupAllSelected(row.masterKey)"
                        :indeterminate.prop="isGroupSomeSelected(row.masterKey)"
                        class="cursor-pointer"
                        @click.stop
                        @change="toggleGroupSelected(row.masterKey, $event)"
                      />
                    </td>
                    <td colspan="9" class="px-2 py-2 ">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-black text-[#004D3C]">
                          {{ collapsed[row.masterKey] ? '▸' : '▾' }}
                        </span>
                        <span class="text-xs font-bold text-gray-700">{{ row.productName }}</span>
                        <span class="text-[10px] text-gray-500">{{ row.productCode }}</span>
                        <span class="ml-auto text-[10px] font-bold text-gray-500">
                          SKU {{ groupMatchedCount(row.masterKey) }} · {{ priceRangeText(row) }}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <!-- SKU 행 -->
                  <tr
                    v-else
                    class="border-b border-gray-100 hover:bg-[#F4FAF8]"
                    :class="selectedSkus.has(row.skuCode) ? 'bg-emerald-50' : ''"
                    :data-sku-code="row.skuCode"
                  >
                    <td class="px-1 py-2 text-center align-middle">
                      <input
                        type="checkbox"
                        :checked="selectedSkus.has(row.skuCode)"
                        class="cursor-pointer"
                        @change="toggleSkuSelected(row.skuCode)"
                      />
                    </td>
                    <td class="px-2 py-2 align-middle">
                      <div class="text-xs font-bold text-gray-800">{{ row.displayOption }}</div>
                    </td>
                    <td class="px-2 py-2 text-[11px] text-gray-500 align-middle">{{ row.skuCode }}</td>
                    <td class="px-2 py-2 text-right font-bold text-[#004D3C] align-middle">
                      ₩{{ row.unitPrice.toLocaleString() }}
                    </td>
                    <!-- 가용재고 -->
                    <td class="px-2 py-2 text-right font-bold align-middle" :class="stockLevelClass(rowStockLevel(row.skuCode))">
                      <template v-if="rowStock(row.skuCode)">{{ rowStock(row.skuCode).available }}</template>
                      <span v-else class="text-gray-300">—</span>
                    </td>
                    <!-- 실재고 -->
                    <td class="px-2 py-2 text-right font-bold text-gray-500 align-middle">
                      <template v-if="rowStock(row.skuCode)">{{ rowStock(row.skuCode).onHand }}</template>
                      <span v-else class="text-gray-300">—</span>
                    </td>
                    <!-- 안전재고 -->
                    <td class="px-2 py-2 text-right font-bold text-gray-500 align-middle">
                      <template v-if="rowStock(row.skuCode)">{{ rowStock(row.skuCode).safetyStock }}</template>
                      <span v-else class="text-gray-300">—</span>
                    </td>
                    <!-- 권장 발주 -->
                    <td class="px-2 py-2 text-right align-middle">
                      <template v-if="rowStock(row.skuCode)">
                        <button
                          v-if="rowSuggested(row.skuCode) > 0"
                          type="button"
                          class="border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700 hover:bg-red-100"
                          :title="`권장 발주 ${rowSuggested(row.skuCode)}개를 수량 입력란에 채웁니다`"
                          @click="applySuggestedToSku(row)"
                        >
                          {{ rowSuggested(row.skuCode) }}
                        </button>
                        <span v-else class="text-gray-300">—</span>
                      </template>
                      <span v-else class="text-gray-300">—</span>
                    </td>
                    <td class="px-1 py-2 align-middle">
                      <input
                        type="number"
                        min="0"
                        :placeholder="'0'"
                        class="w-full border border-gray-300 px-1 py-1 text-center text-xs outline-none focus:border-[#004D3C]"
                        :value="rowQuantities[row.skuCode] ?? ''"
                        @input="rowQuantities[row.skuCode] = Number($event.target.value) || 0"
                        @keydown.enter.exact="addSkuToCart(row)"
                        @keydown.enter.shift.prevent="addGroupToCart(row.masterKey)"
                      />
                    </td>
                    <td class="px-2 py-2 text-center align-middle">
                      <div class="inline-flex items-center gap-1">
                        <button
                          type="button"
                          class="inline-flex items-center justify-center border border-[#004D3C] bg-white p-1 text-[#004D3C] hover:bg-[#E6F2F0] disabled:cursor-not-allowed disabled:opacity-40"
                          :disabled="!(Number(rowQuantities[row.skuCode]) > 0)"
                          title="장바구니 담기 (Enter)"
                          @click="addSkuToCart(row)"
                        >
                          <PlusIcon :size="12" />
                        </button>
                        <button
                          v-if="isInCart(row.skuCode)"
                          type="button"
                          class="text-[10px] font-bold text-[#004D3C] hover:underline"
                          title="장바구니에서 보기"
                          @click="scrollToCartSku(row.skuCode)"
                        >
                          ●
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
                <tr v-if="!catalogLoading && catalogSkuRows.length === 0">
                  <td colspan="10" class="px-3 py-8 text-center text-xs text-gray-400">
                    노출 가능한 계약 제품이 없습니다.
                  </td>
                </tr>
                <tr v-else-if="!catalogLoading && filteredRows.length === 0">
                  <td colspan="10" class="px-3 py-8 text-center text-xs text-gray-400">
                    검색 결과가 없습니다.
                  </td>
                </tr>
                <tr v-if="catalogLoading">
                  <td colspan="10" class="px-3 py-8 text-center text-xs text-gray-400">
                    카탈로그를 불러오는 중...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── 우측: 장바구니 ── -->
        <aside
          class="flex w-full shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm xl:w-96"
        >
          <!-- 헤더 -->
          <div
            class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white"
          >
            <h3
              class="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider"
            >
              <ShoppingCartIcon :size="14" />
              발주 요청서
            </h3>
            <span class="text-[10px] font-bold opacity-80">{{ cart.length }}건</span>
          </div>

          <!-- 거래처 표시 -->
          <div
            v-if="currentCartVendorName"
            class="border-b border-gray-200 bg-[#E6F2F0] px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#004D3C]"
          >
            {{ currentCartVendorName }}
          </div>

          <!-- 본문 -->
          <div class="flex-1 overflow-y-auto p-3">
            <div v-if="cart.length === 0" class="py-10 text-center text-xs text-gray-400">
              왼쪽 카탈로그에서 품목을 담아주세요
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="(item, idx) in cart"
                :key="(item.skuCode || item.productCode) + '-' + idx"
                class="border bg-white p-2 transition-colors"
                :class="highlightedSkuCode === item.skuCode ? 'border-[#004D3C] ring-2 ring-[#004D3C]/30' : 'border-gray-200'"
                :data-cart-sku-code="item.skuCode"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-black text-gray-800">{{ item.productName }}</p>
                    <p v-if="item.displayOption" class="text-[10px] font-bold text-[#004D3C]">
                      {{ item.displayOption }}
                    </p>
                    <p class="text-[10px] text-gray-400">
                      {{ item.skuCode || item.productCode }} · ₩{{ item.unitPrice.toLocaleString() }}
                    </p>
                  </div>
                  <button
                    v-if="item.skuCode"
                    type="button"
                    class="text-[10px] font-bold text-gray-500 hover:text-[#004D3C] underline"
                    title="좌측 카탈로그에서 보기"
                    @click="scrollToCatalogSku(item.skuCode)"
                  >
                    ← 카탈로그
                  </button>
                  <button
                    type="button"
                    class="text-red-400 hover:text-red-600"
                    aria-label="삭제"
                    @click="removeItem(idx)"
                  >
                    <TrashIcon :size="12" />
                  </button>
                </div>
                <div class="mt-2 flex items-center justify-between">
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      class="flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-xs hover:bg-gray-50"
                      @click="decreaseQty(idx)"
                    >
                      −
                    </button>
                    <input
                      :value="item.quantity"
                      type="number"
                      min="1"
                      class="w-12 border border-gray-300 py-0.5 text-center text-xs outline-none focus:border-[#004D3C]"
                      @change="updateQty(idx, $event.target.value)"
                    />
                    <button
                      type="button"
                      class="flex h-6 w-6 items-center justify-center border border-gray-300 bg-white text-xs hover:bg-gray-50"
                      @click="increaseQty(idx)"
                    >
                      +
                    </button>
                  </div>
                  <span class="text-xs font-bold text-gray-700">
                    ₩{{ (item.unitPrice * item.quantity).toLocaleString() }}
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <!-- 푸터 -->
          <div class="space-y-2 border-t border-gray-200 bg-gray-50 p-3">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase text-gray-500">총액</span>
              <span class="text-sm font-black text-[#004D3C]">
                ₩{{ cartTotal.toLocaleString() }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="border border-gray-400 bg-white px-2 py-2 text-[11px] font-black text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="cart.length === 0"
                @click="openClearCartConfirm"
              >
                장바구니 비우기
              </button>
              <button
                type="button"
                class="border border-[#004D3C] bg-[#004D3C] px-2 py-2 text-[11px] font-black text-white hover:bg-[#1f4b3a] disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="!canSubmit"
                @click="openSubmitConfirm"
              >
                {{ isEditMode ? '수정 저장' : '발주 요청' }}
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>

    <!-- ───────── 모달: 창고 변경 confirm (비파괴, signature) ───────── -->
    <div
      v-if="showWarehouseChangeConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelWarehouseChange"
    >
      <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
        <div class="bg-[#004D3C] px-5 py-3 text-white">
          <h2 class="text-sm font-black">입고 창고 변경</h2>
        </div>
        <div class="p-5 text-xs text-gray-700">
          <p>
            장바구니 <strong>{{ cart.length }}건</strong>이 초기화됩니다. 입고 창고를
            <strong>{{ pendingWarehouseName }}</strong>으로 변경할까요?
          </p>
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="cancelWarehouseChange"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
            @click="confirmWarehouseChange"
          >
            변경
          </button>
        </div>
      </div>
    </div>

    <!-- ───────── 모달: 거래처 변경 confirm (amber, 주의) ───────── -->
    <div
      v-if="showVendorSwitchConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelVendorSwitch"
    >
      <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
        <div class="flex items-center gap-2 bg-amber-600 px-5 py-3 text-white">
          <AlertTriangleIcon :size="14" />
          <h2 class="text-sm font-black">거래처 변경</h2>
        </div>
        <div class="p-5 text-xs text-gray-700">
          <p>
            장바구니의 <strong>{{ currentCartVendorName }}</strong> 품목
            <strong>{{ cart.length }}건</strong>이 초기화됩니다.
            <strong>{{ pendingNewVendorName }}</strong> 거래처로 새로 시작할까요?
          </p>
          <p class="mt-2 text-[11px] text-gray-500">
            한 발주서에는 한 거래처 품목만 담을 수 있습니다.
          </p>
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="cancelVendorSwitch"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-amber-600 bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-500"
            @click="confirmVendorSwitch"
          >
            새로 시작
          </button>
        </div>
      </div>
    </div>

    <!-- ───────── 모달: 장바구니 비우기 confirm (파괴, red) ───────── -->
    <div
      v-if="showClearCartConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelClearCart"
    >
      <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
        <div class="bg-red-700 px-5 py-3 text-white">
          <h2 class="text-sm font-black">장바구니 비우기</h2>
        </div>
        <div class="p-5 text-xs text-gray-700">
          <p>
            장바구니 <strong>{{ cart.length }}건</strong>이 모두 삭제됩니다. 계속할까요?
          </p>
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="cancelClearCart"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-red-700 bg-red-700 px-4 py-2 text-xs font-black text-white hover:bg-red-600"
            @click="confirmClearCart"
          >
            삭제
          </button>
        </div>
      </div>
    </div>

    <!-- ───────── 모달: 발주 요청/수정 최종 확인 (signature, 비파괴) ───────── -->
    <div
      v-if="showSubmitConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelSubmitOrder"
    >
      <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
        <div class="bg-[#004D3C] px-5 py-3 text-white">
          <h2 class="text-sm font-black">{{ isEditMode ? '발주 수정 확인' : '발주 요청 확인' }}</h2>
        </div>
        <div class="space-y-2 p-5 text-xs text-gray-700">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">발주서 요약</p>
          <dl class="space-y-1.5">
            <div class="flex justify-between gap-2">
              <dt class="text-gray-500">입고 창고</dt>
              <dd class="font-bold text-gray-800">{{ selectedWarehouseName }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-gray-500">거래처</dt>
              <dd class="font-bold text-gray-800">{{ currentCartVendorName }}</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-gray-500">품목</dt>
              <dd class="font-bold text-gray-800">{{ cart.length }}건</dd>
            </div>
            <div class="flex justify-between gap-2">
              <dt class="text-gray-500">총액</dt>
              <dd class="font-black text-[#004D3C]">₩{{ cartTotal.toLocaleString() }}</dd>
            </div>
          </dl>
          <p class="pt-2 text-[11px] leading-relaxed text-gray-500">
            <template v-if="isEditMode">
              이 내용으로 발주를 수정합니다. 거래처 승인 전까지만 가능합니다.
            </template>
            <template v-else>
              이 내용으로 거래처에 발주 요청합니다.
              요청 후 거래처 응답 받기 전까지 [취소] 가능합니다.
            </template>
          </p>
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="cancelSubmitOrder"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
            @click="confirmSubmitOrder"
          >
            {{ isEditMode ? '수정 저장' : '발주 요청' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ───────── Floating Action Bar (Power 모드: 다중 선택 시 노출) ───────── -->
    <Transition
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-200"
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="selectedSkus.size > 0"
        class="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform"
      >
        <div class="flex items-center gap-3 border border-[#004D3C] bg-[#004D3C] px-4 py-2.5 text-white shadow-xl">
          <span class="text-xs font-black">{{ selectedSkus.size }}개 SKU 선택됨</span>
          <button
            type="button"
            class="border border-white bg-white px-3 py-1 text-[11px] font-black text-[#004D3C] hover:bg-gray-100"
            @click="openBulkQtyModal"
          >
            수량 일괄 입력
          </button>
          <button
            type="button"
            class="text-[11px] font-bold text-white/80 hover:text-white underline"
            @click="clearSelection"
          >
            선택 해제
          </button>
        </div>
      </div>
    </Transition>

    <!-- ───────── 모달: 수량 일괄 입력 ───────── -->
    <div
      v-if="showBulkQtyModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="closeBulkQtyModal"
    >
      <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
        <div class="bg-[#004D3C] px-5 py-3 text-white">
          <h2 class="text-sm font-black">수량 일괄 입력</h2>
        </div>
        <div class="p-5 text-xs text-gray-700">
          <p class="mb-3">
            선택한 <strong>{{ selectedSkus.size }}개 SKU</strong> 모두에 동일한 수량을 적용합니다.
          </p>
          <input
            v-model.number="bulkQtyInput"
            type="number"
            min="1"
            placeholder="수량"
            class="w-full border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-[#004D3C]"
            @keydown.enter="applyBulkQty"
          />
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="closeBulkQtyModal"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
            @click="applyBulkQty"
          >
            적용
          </button>
        </div>
      </div>
    </div>

    <!-- ───────── 토스트 ───────── -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed right-4 top-4 z-[60] border border-[#004D3C] bg-white px-4 py-3 text-xs font-bold text-gray-800 shadow-lg"
      >
        {{ toast.message }}
      </div>
    </Transition>
  </AppLayout>
</template>

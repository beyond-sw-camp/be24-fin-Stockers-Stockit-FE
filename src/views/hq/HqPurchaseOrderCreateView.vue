<script setup>
import { computed, h, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useVendorStore } from '@/stores/vendor.js'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'
import { useWarehouseStockStore } from '@/stores/warehouseStock.js'
import { getProductSkus } from '@/api/productMaster.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const vendor = useVendorStore()
const poStore = usePurchaseOrderStore()
const stockStore = useWarehouseStockStore()

// 카탈로그 행마다 호출 — 선택된 창고 + 행 productCode 의 재고 정보. 창고 미선택이면 null.
function rowStock(productCode) {
  if (!selectedWarehouseCode.value) return null
  return stockStore.getStock(selectedWarehouseCode.value, productCode)
}

function rowStockLevel(stock) {
  return stockStore.getStockLevel(stock)
}

// 권장 발주 수량 — 안전재고 × 1.5 까지 채우는 만큼. 부족 아닌 행은 0.
function rowSuggested(productCode) {
  return stockStore.getSuggestedQuantity(rowStock(productCode))
}

// 재고 셀 색 — 가용재고 기준 안전재고 임계
function stockLevelClass(stock) {
  const level = rowStockLevel(stock)
  if (level === 'critical') return 'text-red-600'
  if (level === 'warning') return 'text-amber-600'
  return 'text-gray-700'
}

// "부족만 보기" 토글 — 가용재고 < safetyStock × 1.5 인 행만 노출
const shortageOnly = ref(false)

// 카탈로그 부족 카운트 — 토글 클릭 안 해도 헤더에서 즉시 인지
const shortageCount = computed(() => {
  if (!selectedWarehouseCode.value) return 0
  const codes = catalog.value.map((vp) => vp.productCode)
  return stockStore.getShortageCount(selectedWarehouseCode.value, codes)
})

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

// SKU 옵션 선택 모달 — Master 카드 클릭 시 그 master 의 SKU 옵션 목록 fetch.
// 슬래시 합성 컨벤션 (optionName="색상/사이즈", optionValue="화이트/L") 자동 분기:
//   - matrix: rowName/colName 분리, 행×열 그리드
//   - list: 1차원 옵션 리스트
const showSkuModal = ref(false)
const skuModalVp = ref(null)        // 클릭한 vendor product (master)
const skuModalSkus = ref([])         // 그 master 의 SKU 목록 (ACTIVE만)
const skuModalQuantities = ref({})   // { [skuCode]: quantity }
const skuModalLoading = ref(false)

const skuParsed = computed(() => {
  const active = skuModalSkus.value.filter((s) => s.status === 'ACTIVE')
  if (active.length === 0) return { kind: 'empty' }
  const sample = active[0]
  const isMulti = (sample.optionName || '').includes('/')
  if (isMulti) {
    const [rowName, colName] = sample.optionName.split('/')
    const cells = {}
    const rowSet = new Set()
    const colSet = new Set()
    for (const sku of active) {
      const parts = (sku.optionValue || '').split('/')
      const rowVal = parts[0] ?? ''
      const colVal = parts[1] ?? ''
      rowSet.add(rowVal)
      colSet.add(colVal)
      if (!cells[rowVal]) cells[rowVal] = {}
      cells[rowVal][colVal] = sku
    }
    return {
      kind: 'matrix',
      rowName,
      colName,
      rows: [...rowSet],
      cols: [...colSet],
      cells,
    }
  }
  return {
    kind: 'list',
    name: sample.optionName,
    items: active.map((s) => ({ value: s.optionValue, sku: s })),
  }
})

const skuModalTotalQty = computed(() =>
  Object.values(skuModalQuantities.value).reduce((sum, q) => sum + (Number(q) || 0), 0),
)

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
// 카탈로그: active 거래처 × active 계약 제품
// 데이터 출처는 vendor.allVendorProducts (전체 거래처 제품 — onMounted 에서 fetch).
// 기존 vendor.vendorProducts 는 한 거래처 전용이라 발주 카탈로그엔 부적합.
const catalog = computed(() => {
  const activeVendorMap = new Map(
    vendor.vendors.filter((v) => v.status === 'active').map((v) => [v.id, v]),
  )
  return vendor.allVendorProducts
    .filter((vp) => vp.status === 'active' && activeVendorMap.has(vp.vendorId))
    .map((vp) => ({
      ...vp,
      vendorName: activeVendorMap.get(vp.vendorId)?.name ?? '',
    }))
})

const displayedCatalog = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const vf = vendorFilter.value
  let list = catalog.value.filter((vp) => {
    const matchVendor = vf === 'all' || vp.vendorId === vf
    const matchKw =
      !kw ||
      vp.productCode.toLowerCase().includes(kw) ||
      vp.productName.toLowerCase().includes(kw)
    return matchVendor && matchKw
  })
  // "부족만 보기" 토글 — 창고 선택된 상태에서만 적용
  if (shortageOnly.value && selectedWarehouseCode.value) {
    list = list.filter((vp) => {
      const level = rowStockLevel(rowStock(vp.productCode))
      return level === 'critical' || level === 'warning'
    })
  }
  switch (sortBy.value) {
    case 'priceAsc':
      list = [...list].sort((a, b) => a.unitPrice - b.unitPrice)
      break
    case 'priceDesc':
      list = [...list].sort((a, b) => b.unitPrice - a.unitPrice)
      break
    case 'nameAsc':
      list = [...list].sort((a, b) => a.productName.localeCompare(b.productName, 'ko'))
      break
    default:
      break
  }
  return list
})

const vendorOptions = computed(() => vendor.vendors.filter((v) => v.status === 'active'))

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
// Master 카드 클릭 → SKU 옵션 선택 모달 오픈 (즉시 cart 추가 X, SKU 단위 발주).
async function addToCart(vp) {
  if (!selectedWarehouseCode.value) return
  // 한 발주서 = 한 거래처 정책
  if (currentCartVendorId.value && vp.vendorId !== currentCartVendorId.value) {
    pendingNewVendorProduct.value = vp
    showVendorSwitchConfirm.value = true
    return
  }
  await openSkuModal(vp)
}

async function openSkuModal(vp) {
  skuModalVp.value = vp
  skuModalQuantities.value = {}
  skuModalLoading.value = true
  showSkuModal.value = true
  try {
    const list = await getProductSkus(vp.productCode)
    skuModalSkus.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.error('[HqPurchaseOrderCreateView] getProductSkus 실패', e)
    skuModalSkus.value = []
    triggerToast('SKU 옵션을 불러오지 못했습니다.')
  } finally {
    skuModalLoading.value = false
  }
}

function closeSkuModal() {
  showSkuModal.value = false
  skuModalVp.value = null
  skuModalSkus.value = []
  skuModalQuantities.value = {}
}

function addSkusFromModal() {
  const vp = skuModalVp.value
  if (!vp) return
  let added = 0
  for (const sku of skuModalSkus.value) {
    const qty = Number(skuModalQuantities.value[sku.skuCode]) || 0
    if (qty <= 0) continue
    const existing = cart.value.find((item) => item.skuCode === sku.skuCode)
    if (existing) {
      existing.quantity += qty
    } else {
      cart.value.push({
        productId: vp.id,
        productCode: vp.productCode,
        productName: vp.productName,
        vendorId: vp.vendorId,
        vendorName: vp.vendorName,
        skuCode: sku.skuCode,
        optionName: sku.optionName,
        optionValue: sku.optionValue,
        unitPrice: sku.unitPrice,
        quantity: qty,
      })
    }
    added++
  }
  if (added === 0) {
    triggerToast('수량을 입력한 옵션이 없습니다.')
    return
  }
  saveDraft()
  closeSkuModal()
}

// 권장 발주 수량 — SKU 단위가 아니라 master 단위 정보라 일단 SKU 모달을 열어준다.
// 사용자가 옵션별 수량을 직접 분배. (추후 SKU별 안전재고 도입 시 자동 분배 가능)
function addRecommendedToCart(vp) {
  addToCart(vp)
}

function confirmVendorSwitch() {
  const vp = pendingNewVendorProduct.value
  cart.value = []
  if (vp) {
    // 거래처 전환 후 SKU 모달 열기 (cart 가 비었으니 vendor 정책 통과)
    openSkuModal(vp)
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
    optionName: i.optionName,
    optionValue: i.optionValue,
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
  vendorFilter.value = order.vendorId // 거래처 잠금
  cart.value = order.items.map((i) => ({
    productId: i.productId,
    productCode: i.productCode,
    productName: i.productName,
    skuCode: i.skuCode ?? '',
    optionName: i.optionName ?? '',
    optionValue: i.optionValue ?? '',
    vendorId: order.vendorId,
    vendorName: order.vendorName,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
  }))
}

// ─── mounted ────────────────────────────────────────────────────────────────
onMounted(() => {
  vendor.fetchAllVendorProducts('ACTIVE').catch((err) => {
    console.error('[HqPurchaseOrderCreateView] fetchAllVendorProducts 실패', err)
  })
  if (isEditMode.value) {
    initEditMode()
  } else {
    loadDraft()
  }
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
            class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2"
          >
            <label class="relative block">
              <SearchIcon
                :size="14"
                class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="keyword"
                type="text"
                placeholder="제품명/제품코드 검색"
                class="w-56 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C]"
              />
            </label>
            <select
              v-model="vendorFilter"
              :disabled="isEditMode"
              class="border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="all">전체 거래처</option>
              <option v-for="v in vendorOptions" :key="v.id" :value="v.id">
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
              class="border px-3 py-1.5 text-[11px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              :class="
                shortageOnly
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : shortageCount > 0
                    ? 'border-red-300 bg-white text-red-600 hover:bg-red-50'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              "
              :disabled="!selectedWarehouseCode || shortageCount === 0"
              :title="!selectedWarehouseCode ? '먼저 창고를 선택하세요' : (shortageCount === 0 ? '재고 부족 품목 없음' : '가용재고가 안전재고 1.5배 미만인 품목만 표시')"
              @click="shortageOnly = !shortageOnly"
            >
              {{ shortageOnly ? `✓ 부족만 (${shortageCount})` : (selectedWarehouseCode && shortageCount > 0 ? `부족만 보기 (${shortageCount})` : '부족만 보기') }}
            </button>
            <span class="ml-auto text-[11px] font-bold text-gray-500">
              {{ displayedCatalog.length }}건
            </span>
          </div>

          <!-- 창고 미선택 안내 -->
          <div
            v-if="!selectedWarehouseCode"
            class="border-b border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700"
          >
            입고 창고를 먼저 선택해주세요. 창고가 정해져야 발주서를 만들 수 있습니다.
          </div>

          <!-- 카탈로그 테이블 — 카드 내부 자체 스크롤 (가로/세로 모두) -->
          <div class="min-h-0 flex-1 overflow-auto">
            <table class="w-full table-fixed border-collapse text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-24 px-2 py-2 text-left font-black">거래처</th>
                  <th class="w-20 px-2 py-2 text-left font-black">제품코드</th>
                  <th class="w-56 px-2 py-2 text-left font-black">제품명</th>
                  <th class="w-24 px-2 py-2 text-right font-black">단가</th>
                  <th class="hidden w-14 px-2 py-2 text-right font-black 2xl:table-cell" title="실재고 + 입고예정 - 출고예정">가용</th>
                  <th class="hidden w-14 px-2 py-2 text-right font-black 2xl:table-cell" title="실재고 (현재 보유)">실재고</th>
                  <th class="hidden w-12 px-2 py-2 text-right font-black 2xl:table-cell" title="안전재고 (이 밑으로 떨어지면 안 됨)">안전</th>
                  <th class="hidden w-14 px-2 py-2 text-right font-black 2xl:table-cell" title="안전재고 × 1.5 까지 채우는 권장 발주 수량">권장</th>
                  <th class="w-12 px-2 py-2 text-center font-black"></th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-gray-100"
                :class="!selectedWarehouseCode ? 'pointer-events-none opacity-50' : ''"
              >
                <tr
                  v-for="vp in displayedCatalog"
                  :key="vp.id"
                  class="cursor-pointer transition-colors hover:bg-[#E6F2F0]"
                  @click="addToCart(vp)"
                >
                  <td class="px-2 py-2.5 font-bold text-gray-700 truncate">{{ vp.vendorName }}</td>
                  <td class="px-2 py-2.5 text-gray-500">{{ vp.productCode }}</td>
                  <td class="px-2 py-2.5 font-black text-gray-800 truncate">{{ vp.productName }}</td>
                  <td class="px-2 py-2.5 text-right font-bold text-[#004D3C]">
                    ₩{{ vp.unitPrice.toLocaleString() }}
                  </td>
                  <!-- 가용재고 (2xl 이상에서만 표시) -->
                  <td class="hidden px-2 py-2.5 text-right font-black 2xl:table-cell" :class="stockLevelClass(rowStock(vp.productCode))">
                    <template v-if="rowStock(vp.productCode)">
                      {{ rowStock(vp.productCode).available }}
                    </template>
                    <span v-else class="text-gray-300">—</span>
                  </td>
                  <td class="hidden px-2 py-2.5 text-right font-bold text-gray-500 2xl:table-cell">
                    <template v-if="rowStock(vp.productCode)">
                      {{ rowStock(vp.productCode).onHand }}
                    </template>
                    <span v-else class="text-gray-300">—</span>
                  </td>
                  <td class="hidden px-2 py-2.5 text-right font-bold text-gray-500 2xl:table-cell">
                    <template v-if="rowStock(vp.productCode)">
                      {{ rowStock(vp.productCode).safetyStock }}
                    </template>
                    <span v-else class="text-gray-300">—</span>
                  </td>
                  <td class="hidden px-2 py-2.5 text-right 2xl:table-cell">
                    <template v-if="rowStock(vp.productCode)">
                      <button
                        v-if="rowSuggested(vp.productCode) > 0"
                        type="button"
                        class="border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700 hover:bg-red-100"
                        :title="`클릭하여 ${rowSuggested(vp.productCode)}개로 담기`"
                        @click.stop="addRecommendedToCart(vp)"
                      >
                        {{ rowSuggested(vp.productCode) }}
                      </button>
                      <span v-else class="text-gray-300">—</span>
                    </template>
                    <span v-else class="text-gray-300">—</span>
                  </td>
                  <td class="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center whitespace-nowrap border border-[#004D3C] bg-white p-1 text-[#004D3C] hover:bg-[#E6F2F0]"
                      :title="'담기'"
                      @click.stop="addToCart(vp)"
                    >
                      <PlusIcon :size="12" />
                    </button>
                  </td>
                </tr>
                <tr v-if="catalog.length === 0">
                  <td colspan="9" class="px-3 py-8 text-center text-xs text-gray-400">
                    노출 가능한 계약 제품이 없습니다.
                  </td>
                </tr>
                <tr v-else-if="displayedCatalog.length === 0">
                  <td colspan="9" class="px-3 py-8 text-center text-xs text-gray-400">
                    {{ shortageOnly ? '재고 부족 품목이 없습니다.' : '검색 결과가 없습니다.' }}
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
                class="border border-gray-200 bg-white p-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-black text-gray-800">{{ item.productName }}</p>
                    <p v-if="item.optionValue" class="text-[10px] font-bold text-[#004D3C]">
                      {{ item.optionValue }}
                    </p>
                    <p class="text-[10px] text-gray-400">
                      {{ item.skuCode || item.productCode }} · ₩{{ item.unitPrice.toLocaleString() }}
                    </p>
                  </div>
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

    <!-- ───────── 모달: SKU 옵션 선택 ───────── -->
    <div
      v-if="showSkuModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeSkuModal"
    >
      <div class="w-full max-w-2xl border border-gray-300 bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <h2 class="text-sm font-black text-gray-800">옵션 선택</h2>
            <p class="text-[11px] text-gray-500 mt-0.5">
              {{ skuModalVp?.productName }} · {{ skuModalVp?.productCode }}
            </p>
          </div>
          <button type="button" class="text-gray-500 hover:text-gray-700" @click="closeSkuModal">
            ✕
          </button>
        </div>
        <div class="max-h-[60vh] overflow-auto p-4">
          <div v-if="skuModalLoading" class="py-12 text-center text-xs text-gray-400">
            옵션을 불러오는 중...
          </div>
          <div v-else-if="skuParsed.kind === 'empty'" class="py-12 text-center text-xs text-gray-400">
            등록된 옵션이 없습니다.
          </div>

          <!-- 다차원 매트릭스 (색상 × 사이즈 등) -->
          <table v-else-if="skuParsed.kind === 'matrix'" class="w-full border-collapse text-xs">
            <thead>
              <tr class="bg-gray-100 text-gray-700">
                <th class="border border-gray-200 px-2 py-1.5 text-left font-black">
                  {{ skuParsed.rowName }} \ {{ skuParsed.colName }}
                </th>
                <th
                  v-for="col in skuParsed.cols"
                  :key="col"
                  class="border border-gray-200 px-2 py-1.5 text-center font-black"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in skuParsed.rows" :key="row">
                <th class="border border-gray-200 bg-gray-50 px-2 py-1.5 text-left font-black text-gray-700">
                  {{ row }}
                </th>
                <td
                  v-for="col in skuParsed.cols"
                  :key="col"
                  class="border border-gray-200 px-1.5 py-1 text-center"
                >
                  <input
                    v-if="skuParsed.cells[row]?.[col]"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-16 border border-gray-300 px-1 py-0.5 text-center text-xs outline-none focus:border-[#004D3C]"
                    :value="skuModalQuantities[skuParsed.cells[row][col].skuCode] ?? ''"
                    @input="skuModalQuantities[skuParsed.cells[row][col].skuCode] = Number($event.target.value) || 0"
                  />
                  <span v-else class="text-gray-300">-</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 1차원 리스트 (단일 옵션 차원) -->
          <ul v-else-if="skuParsed.kind === 'list'" class="space-y-2">
            <li class="border-b border-gray-200 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {{ skuParsed.name }}
            </li>
            <li
              v-for="opt in skuParsed.items"
              :key="opt.sku.skuCode"
              class="flex items-center justify-between border border-gray-200 px-3 py-2"
            >
              <div>
                <p class="text-xs font-black text-gray-800">{{ opt.value }}</p>
                <p class="text-[10px] text-gray-400">
                  {{ opt.sku.skuCode }} · ₩{{ opt.sku.unitPrice.toLocaleString() }}
                </p>
              </div>
              <input
                type="number"
                min="0"
                placeholder="0"
                class="w-20 border border-gray-300 px-2 py-1 text-center text-xs outline-none focus:border-[#004D3C]"
                :value="skuModalQuantities[opt.sku.skuCode] ?? ''"
                @input="skuModalQuantities[opt.sku.skuCode] = Number($event.target.value) || 0"
              />
            </li>
          </ul>
        </div>
        <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
          <span class="text-[11px] font-bold text-gray-600">
            총 수량: <strong class="text-[#004D3C]">{{ skuModalTotalQty }}</strong>
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              class="border border-gray-300 bg-white px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
              @click="closeSkuModal"
            >
              취소
            </button>
            <button
              type="button"
              class="bg-[#004D3C] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#003828] disabled:bg-gray-300"
              :disabled="skuModalTotalQty <= 0"
              @click="addSkusFromModal"
            >
              장바구니 담기
            </button>
          </div>
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

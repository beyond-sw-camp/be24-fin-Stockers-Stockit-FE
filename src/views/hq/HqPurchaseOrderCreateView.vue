<script setup>
import { computed, h, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useVendorStore } from '@/stores/vendor.js'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'

const router = useRouter()
const auth = useAuthStore()
const vendor = useVendorStore()
const poStore = usePurchaseOrderStore()

const DRAFT_KEY = 'stockit:po-cart-draft'

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
const selectedWarehouseId = ref('')
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
const catalog = computed(() => {
  const activeVendorMap = new Map(
    vendor.vendors.filter((v) => v.status === 'active').map((v) => [v.id, v]),
  )
  return vendor.vendorProducts
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

const canSubmit = computed(() => !!selectedWarehouseId.value && cart.value.length > 0)

const currentCartVendorId = computed(() =>
  cart.value.length > 0 ? cart.value[0].vendorId : null,
)

const currentCartVendorName = computed(() =>
  cart.value.length > 0 ? cart.value[0].vendorName : '',
)

const pendingWarehouseName = computed(() => {
  if (!pendingWarehouseId.value) return ''
  return poStore.warehouses.find((w) => w.id === pendingWarehouseId.value)?.name ?? ''
})

const pendingNewVendorName = computed(() => pendingNewVendorProduct.value?.vendorName ?? '')

const selectedWarehouseName = computed(
  () => poStore.warehouses.find((w) => w.id === selectedWarehouseId.value)?.name ?? '',
)

// ─── localStorage 영속화 ──────────────────────────────────────────────────────
function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (!saved) return
    const data = JSON.parse(saved)
    if (data && typeof data === 'object') {
      selectedWarehouseId.value = data.warehouseId ?? ''
      cart.value = Array.isArray(data.items) ? data.items : []
    }
  } catch {
    // 무시
  }
}

function saveDraft() {
  try {
    const payload = {
      warehouseId: selectedWarehouseId.value,
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
function addToCart(vp) {
  if (!selectedWarehouseId.value) return
  // 한 발주서 = 한 거래처 정책
  if (currentCartVendorId.value && vp.vendorId !== currentCartVendorId.value) {
    pendingNewVendorProduct.value = vp
    showVendorSwitchConfirm.value = true
    return
  }
  const existing = cart.value.find((item) => item.productCode === vp.productCode)
  if (existing) {
    existing.quantity += 1
  } else {
    cart.value.push({
      productId: vp.id,
      productCode: vp.productCode,
      productName: vp.productName,
      vendorId: vp.vendorId,
      vendorName: vp.vendorName,
      unitPrice: vp.unitPrice,
      quantity: 1,
    })
  }
  saveDraft()
}

function confirmVendorSwitch() {
  const vp = pendingNewVendorProduct.value
  cart.value = []
  if (vp) {
    cart.value.push({
      productId: vp.id,
      productCode: vp.productCode,
      productName: vp.productName,
      vendorId: vp.vendorId,
      vendorName: vp.vendorName,
      unitPrice: vp.unitPrice,
      quantity: 1,
    })
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
  if (newId === selectedWarehouseId.value) return
  if (cart.value.length === 0) {
    selectedWarehouseId.value = newId
    saveDraft()
    return
  }
  // cart 가 비어있지 않으면 confirm
  pendingWarehouseId.value = newId
  showWarehouseChangeConfirm.value = true
  // select DOM 값을 selectedWarehouseId 로 강제 원복 (취소 시 어색하지 않게)
  nextTick(() => {
    if (warehouseSelectRef.value) {
      warehouseSelectRef.value.value = selectedWarehouseId.value
    }
  })
}

function confirmWarehouseChange() {
  selectedWarehouseId.value = pendingWarehouseId.value
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

function confirmSubmitOrder() {
  showSubmitConfirm.value = false
  const items = cart.value.map((i) => ({
    productId: i.productId,
    productCode: i.productCode,
    productName: i.productName,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    subtotal: i.unitPrice * i.quantity,
  }))

  const newOrder = poStore.createOrder({
    warehouseId: selectedWarehouseId.value,
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

  setTimeout(() => {
    router.push({ name: 'hq-purchase-orders' })
  }, 900)
}

// ─── mounted ────────────────────────────────────────────────────────────────
onMounted(() => {
  loadDraft()
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
    <div class="flex flex-col gap-4">
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
            :value="selectedWarehouseId"
            class="border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            @change="handleWarehouseChange($event.target.value)"
          >
            <option value="">창고 선택</option>
            <option v-for="wh in poStore.warehouses" :key="wh.id" :value="wh.id">
              {{ wh.name }}
            </option>
          </select>
        </div>

        <span
          v-if="cart.length > 0"
          class="ml-auto inline-flex items-center gap-1 bg-[#E6F2F0] px-2 py-1 text-[10px] font-bold text-[#004D3C]"
        >
          임시 저장된 품목 {{ cart.length }}건
        </span>
      </section>

      <!-- 본문: 좌(카탈로그) + 우(장바구니) -->
      <section class="flex min-h-0 flex-col gap-4 xl:flex-row">
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
              class="border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C]"
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
            <span class="ml-auto text-[11px] font-bold text-gray-500">
              {{ displayedCatalog.length }}건
            </span>
          </div>

          <!-- 창고 미선택 안내 -->
          <div
            v-if="!selectedWarehouseId"
            class="border-b border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700"
          >
            입고 창고를 먼저 선택해주세요. 창고가 정해져야 발주서를 만들 수 있습니다.
          </div>

          <!-- 카탈로그 테이블 -->
          <div class="overflow-auto">
            <table class="w-full min-w-[640px] table-fixed border-collapse text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-40 px-3 py-2 text-left font-black">거래처</th>
                  <th class="w-28 px-3 py-2 text-left font-black">제품코드</th>
                  <th class="px-3 py-2 text-left font-black">제품명</th>
                  <th class="w-24 px-3 py-2 text-right font-black">단가</th>
                  <th class="w-20 px-3 py-2 text-center font-black"></th>
                </tr>
              </thead>
              <tbody
                class="divide-y divide-gray-100"
                :class="!selectedWarehouseId ? 'pointer-events-none opacity-50' : ''"
              >
                <tr
                  v-for="vp in displayedCatalog"
                  :key="vp.id"
                  class="cursor-pointer transition-colors hover:bg-[#E6F2F0]"
                  @click="addToCart(vp)"
                >
                  <td class="px-3 py-2.5 font-bold text-gray-700">{{ vp.vendorName }}</td>
                  <td class="px-3 py-2.5 text-gray-500">{{ vp.productCode }}</td>
                  <td class="px-3 py-2.5 font-black text-gray-800">{{ vp.productName }}</td>
                  <td class="px-3 py-2.5 text-right font-bold text-[#004D3C]">
                    ₩{{ vp.unitPrice.toLocaleString() }}
                  </td>
                  <td class="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center gap-1 whitespace-nowrap border border-[#004D3C] bg-white px-2 py-1 text-[10px] font-black text-[#004D3C] hover:bg-[#E6F2F0]"
                      @click.stop="addToCart(vp)"
                    >
                      <PlusIcon :size="10" />
                      담기
                    </button>
                  </td>
                </tr>
                <tr v-if="catalog.length === 0">
                  <td colspan="5" class="px-3 py-8 text-center text-xs text-gray-400">
                    노출 가능한 계약 제품이 없습니다.
                  </td>
                </tr>
                <tr v-else-if="displayedCatalog.length === 0">
                  <td colspan="5" class="px-3 py-8 text-center text-xs text-gray-400">
                    검색 결과가 없습니다.
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
                :key="item.productCode + '-' + idx"
                class="border border-gray-200 bg-white p-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-black text-gray-800">{{ item.productName }}</p>
                    <p class="text-[10px] text-gray-400">
                      {{ item.productCode }} · ₩{{ item.unitPrice.toLocaleString() }}
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
                발주 요청
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

    <!-- ───────── 모달: 발주 요청 최종 확인 (signature, 비파괴) ───────── -->
    <div
      v-if="showSubmitConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelSubmitOrder"
    >
      <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
        <div class="bg-[#004D3C] px-5 py-3 text-white">
          <h2 class="text-sm font-black">발주 요청 확인</h2>
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
            이 내용으로 거래처에 발주 요청합니다.
            요청 후 거래처 응답 받기 전까지 [취소] 가능합니다.
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
            발주 요청
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

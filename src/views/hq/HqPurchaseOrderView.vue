<script setup>
import { computed, h, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'

const router = useRouter()
const auth = useAuthStore()
const poStore = usePurchaseOrderStore()

// ─── 레이아웃 설정 ───────────────────────────────────────────────────────────
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

// ─── 거래처/제품 더미 데이터 (vendor.js 미구현 상태 대비 내부 정의) ─────────
const VENDORS = [
  { id: 'VND-001', name: '(주)테크서플라이', status: 'active' },
  { id: 'VND-002', name: '글로벌오피스(주)', status: 'active' },
  { id: 'VND-003', name: '헬스케어솔루션(주)', status: 'active' },
  { id: 'VND-004', name: '리빙플러스(주)', status: 'active' },
  { id: 'VND-005', name: '스마트스토리지(주)', status: 'active' },
]

// 거래처별 계약 제품 (VENDOR_PRODUCT 기반)
const VENDOR_PRODUCTS = [
  {
    id: 'VP-001-1',
    vendorId: 'VND-001',
    productId: 'PRD-001',
    productCode: 'PRD-001',
    productName: '고속 충전기 (C타입) 25W',
    unitPrice: 15000,
    status: 'active',
  },
  {
    id: 'VP-001-2',
    vendorId: 'VND-001',
    productId: 'PRD-002',
    productCode: 'PRD-002',
    productName: '대용량 보조배터리 20000mAh',
    unitPrice: 58000,
    status: 'active',
  },
  {
    id: 'VP-001-3',
    vendorId: 'VND-001',
    productId: 'PRD-003',
    productCode: 'PRD-003',
    productName: '무소음 무선 마우스',
    unitPrice: 25000,
    status: 'active',
  },
  {
    id: 'VP-001-4',
    vendorId: 'VND-001',
    productId: 'PRD-006',
    productCode: 'PRD-006',
    productName: '기계식 키보드 (갈축)',
    unitPrice: 60000,
    status: 'active',
  },
  {
    id: 'VP-002-1',
    vendorId: 'VND-002',
    productId: 'PRD-004',
    productCode: 'PRD-004',
    productName: 'A4 복사용지 80g (500매)',
    unitPrice: 6500,
    status: 'active',
  },
  {
    id: 'VP-002-2',
    vendorId: 'VND-002',
    productId: 'PRD-005',
    productCode: 'PRD-005',
    productName: '더블클립 세트 (19mm)',
    unitPrice: 2200,
    status: 'active',
  },
  {
    id: 'VP-002-3',
    vendorId: 'VND-002',
    productId: 'PRD-012',
    productCode: 'PRD-012',
    productName: '절전형 5구 멀티탭 (3m)',
    unitPrice: 13000,
    status: 'active',
  },
  {
    id: 'VP-003-1',
    vendorId: 'VND-003',
    productId: 'PRD-007',
    productCode: 'PRD-007',
    productName: 'KF94 마스크 (50매입)',
    unitPrice: 2500,
    status: 'active',
  },
  {
    id: 'VP-003-2',
    vendorId: 'VND-003',
    productId: 'PRD-008',
    productCode: 'PRD-008',
    productName: '휴대용 가글 (중) 250ml',
    unitPrice: 1500,
    status: 'active',
  },
  {
    id: 'VP-004-1',
    vendorId: 'VND-004',
    productId: 'PRD-009',
    productCode: 'PRD-009',
    productName: '유리제 머그컵 350ml',
    unitPrice: 8900,
    status: 'active',
  },
  {
    id: 'VP-004-2',
    vendorId: 'VND-004',
    productId: 'PRD-010',
    productCode: 'PRD-010',
    productName: '탁상용 미니 가습기',
    unitPrice: 14000,
    status: 'active',
  },
  {
    id: 'VP-004-3',
    vendorId: 'VND-004',
    productId: 'PRD-013',
    productCode: 'PRD-013',
    productName: '종이컵 6.5온스 (1000개입)',
    unitPrice: 20500,
    status: 'active',
  },
  {
    id: 'VP-005-1',
    vendorId: 'VND-005',
    productId: 'PRD-011',
    productCode: 'PRD-011',
    productName: '투명 박스 테이프 (48mm)',
    unitPrice: 2200,
    status: 'active',
  },
]

// ─── 상태 탭 ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { label: '전체', key: '전체' },
  { label: '승인 대기', key: 'PENDING' },
  { label: '승인 완료', key: 'APPROVED' },
  { label: '배송 중', key: 'SHIPPING' },
  { label: '완료', key: 'COMPLETED' },
  { label: '취소', key: 'REJECTED' },
]

// ─── 발주 목록/상세 ──────────────────────────────────────────────────────────
function selectOrder(id) {
  poStore.selectOrder(id)
}

function handleCancel() {
  if (!poStore.selectedOrder) return
  if (!confirm(`발주 ${poStore.selectedOrder.id}를 취소하시겠습니까?`)) return
  poStore.cancelOrder(poStore.selectedOrder.id)
}

// ─── 거래처 액션 대리 트리거 (옵션 A) ──────────────────────────────────────
const showApproveConfirm = ref(false)
const showShippingConfirm = ref(false)

const toast = ref({ show: false, message: '' })
let toastTimer = null
function triggerToast(message) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message }
  toastTimer = setTimeout(() => {
    toast.value = { show: false, message: '' }
  }, 3000)
}

function openApproveConfirm() {
  if (poStore.selectedOrder?.status !== 'PENDING') return
  showApproveConfirm.value = true
}
function confirmApprove() {
  const id = poStore.selectedOrder?.id
  if (!id) return
  poStore.approveOrder(id)
  showApproveConfirm.value = false
  triggerToast('거래처 승인이 기록되었습니다')
}
function cancelApprove() {
  showApproveConfirm.value = false
}

function openShippingConfirm() {
  if (poStore.selectedOrder?.status !== 'APPROVED') return
  showShippingConfirm.value = true
}
function confirmShipping() {
  const id = poStore.selectedOrder?.id
  if (!id) return
  poStore.markShipping(id)
  showShippingConfirm.value = false
  triggerToast('거래처 출고가 기록되었습니다')
}
function cancelShipping() {
  showShippingConfirm.value = false
}

// 상태 뱃지 클래스
function statusClass(status) {
  const map = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-emerald-50 text-emerald-700',
    SHIPPING: 'bg-blue-50 text-blue-600',
    COMPLETED: 'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-50 text-red-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-500'
}

// 상태 한국어 라벨
function statusLabel(status) {
  const map = {
    PENDING: '승인 대기',
    APPROVED: '승인 완료',
    SHIPPING: '배송 중',
    COMPLETED: '완료',
    REJECTED: '취소',
  }
  return map[status] ?? status
}

// 날짜 포맷
function formatDate(iso) {
  if (!iso) return '-'
  return iso.replace('T', ' ').slice(0, 16)
}

// ─── 모달 상태 관리 ──────────────────────────────────────────────────────────
// 발주 수정 모달 (신규 등록은 /hq/purchase-orders/new 페이지로 분리됨)
const showOrderModal = ref(false)

// 모달 폼 상태
const modalWarehouseId = ref('')
const modalVendorId = ref('')
const modalProductSearch = ref('')
const modalCart = ref([]) // [{ productId, productCode, productName, unitPrice, quantity, subtotal }]

// 현재 거래처의 제품 목록 (검색 포함)
const modalVendorProducts = computed(() => {
  if (!modalVendorId.value) return []
  return VENDOR_PRODUCTS.filter(
    (vp) =>
      vp.vendorId === modalVendorId.value &&
      vp.status !== 'expired' &&
      (modalProductSearch.value === '' ||
        vp.productName.toLowerCase().includes(modalProductSearch.value.toLowerCase())),
  )
})

const modalCartTotal = computed(() => modalCart.value.reduce((sum, item) => sum + item.subtotal, 0))

function goCreatePage() {
  router.push({ name: 'hq-purchase-order-new' })
}

function openEditModal() {
  const order = poStore.selectedOrder
  if (!order || order.status !== 'PENDING') return

  modalWarehouseId.value = order.warehouseId
  modalVendorId.value = order.vendorId
  modalProductSearch.value = ''
  // 기존 품목 장바구니에 주입
  modalCart.value = order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productCode: item.productCode,
    productName: item.productName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }))
  showOrderModal.value = true
}

function closeOrderModal() {
  showOrderModal.value = false
}

// 제품 장바구니 추가
function addToCart(product) {
  const existing = modalCart.value.find((item) => item.productId === product.productId)
  if (existing) {
    existing.quantity += 1
    existing.subtotal = existing.quantity * existing.unitPrice
  } else {
    modalCart.value.push({
      productId: product.productId,
      productCode: product.productCode,
      productName: product.productName,
      unitPrice: product.unitPrice,
      quantity: 1,
      subtotal: product.unitPrice,
    })
  }
}

// 장바구니 수량 변경
function updateCartQty(idx, qty) {
  const num = parseInt(qty, 10)
  if (isNaN(num) || num < 1) return
  modalCart.value[idx].quantity = num
  modalCart.value[idx].subtotal = num * modalCart.value[idx].unitPrice
}

// 장바구니 품목 삭제
function removeCartItem(idx) {
  modalCart.value.splice(idx, 1)
}

// 수정 저장 (CEN-037)
function submitOrder() {
  if (!modalWarehouseId.value) {
    alert('창고를 선택해주세요.')
    return
  }
  if (!modalVendorId.value) {
    alert('거래처를 선택해주세요.')
    return
  }
  if (modalCart.value.length === 0) {
    alert('발주할 품목을 추가해주세요.')
    return
  }

  poStore.updateOrder(poStore.selectedOrder.id, {
    warehouseId: modalWarehouseId.value,
    items: modalCart.value,
  })

  closeOrderModal()
}

// ─── ESC 키로 상세 패널 닫기 ────────────────────────────────────────────────
function handleKeydown(e) {
  if (e.key === 'Escape' && !showOrderModal.value && poStore.selectedOrderId) {
    poStore.selectedOrderId = null
  }
}
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// ─── inline SVG 아이콘 (render 함수 방식) ────────────────────────────────────
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

const PlusIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 5v14' } },
  { tag: 'path', attrs: { d: 'M5 12h14' } },
])

const SearchIcon = IconBase([
  { tag: 'circle', attrs: { cx: '11', cy: '11', r: '7' } },
  { tag: 'path', attrs: { d: 'm20 20-3.5-3.5' } },
])

const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

const EditIcon = IconBase([
  { tag: 'path', attrs: { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' } },
  { tag: 'path', attrs: { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z' } },
])

const TrashIcon = IconBase([
  { tag: 'polyline', attrs: { points: '3 6 5 6 21 6' } },
  { tag: 'path', attrs: { d: 'M19 6 18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' } },
  { tag: 'path', attrs: { d: 'M10 11v6' } },
  { tag: 'path', attrs: { d: 'M14 11v6' } },
])

const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])

const WarehouseIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 10.5 12 4l9 6.5' } },
  { tag: 'path', attrs: { d: 'M5 9.5V20h14V9.5' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])

const UserIcon = IconBase([
  { tag: 'path', attrs: { d: 'M20 21a8 8 0 0 0-16 0' } },
  { tag: 'circle', attrs: { cx: '12', cy: '8', r: '4' } },
])

const CheckIcon = IconBase([
  { tag: 'polyline', attrs: { points: '20 6 9 17 4 12' } },
])

const TruckIcon = IconBase([
  { tag: 'path', attrs: { d: 'M10 17H5a2 2 0 0 1-2-2V7h11v10Z' } },
  { tag: 'path', attrs: { d: 'M14 17h-1V9h3l3 3v5h-1' } },
  { tag: 'circle', attrs: { cx: '7.5', cy: '17.5', r: '1.5' } },
  { tag: 'circle', attrs: { cx: '17.5', cy: '17.5', r: '1.5' } },
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
      <!-- 상단 헤더 영역: 상태 탭 -->
      <section class="border border-gray-300 bg-white p-3 shadow-sm">
        <!-- 상태 탭 -->
        <div class="flex flex-wrap gap-1">
          <button
            v-for="tab in STATUS_TABS"
            :key="tab.key"
            type="button"
            class="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-black transition-colors"
            :class="
              poStore.activeStatusTab === tab.key
                ? 'border-[#004D3C] bg-[#004D3C] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="poStore.activeStatusTab = tab.key"
          >
            <span>{{ tab.label }}</span>
            <span
              class="min-w-[18px] px-1 py-0.5 text-center text-[10px]"
              :class="
                poStore.activeStatusTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              {{ poStore.statusCounts[tab.key] }}
            </span>
          </button>
        </div>
      </section>

      <!-- 본문: 좌(테이블) + 우(상세 패널) — xl 이상에서 좌우 분할 -->
      <section class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <!-- ── 발주 목록 테이블 ── -->
        <div
          class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
        >
          <!-- 테이블 상단 바: 건수 + 검색 + 새 발주 -->
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2"
          >
            <span class="text-xs font-bold text-gray-600">
              총 {{ poStore.filteredOrders.length }}건
            </span>
            <div class="flex flex-wrap items-center gap-2">
              <label class="relative block">
                <SearchIcon
                  :size="14"
                  class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  v-model="poStore.searchKeyword"
                  type="text"
                  placeholder="발주번호/거래처명 검색"
                  class="w-52 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C]"
                />
              </label>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-3 py-1.5 text-xs font-black text-white transition-colors hover:bg-[#1f4b3a]"
                @click="goCreatePage"
              >
                <PlusIcon :size="14" />
                새 발주
              </button>
            </div>
          </div>

          <div class="overflow-auto">
            <table class="w-full min-w-[760px] table-fixed border-collapse text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-32 px-3 py-2 text-left font-black">발주번호</th>
                  <th class="px-3 py-2 text-left font-black">거래처</th>
                  <th class="w-28 px-3 py-2 text-left font-black">입고 창고</th>
                  <th class="w-14 px-3 py-2 text-center font-black">품목수</th>
                  <th class="w-28 px-3 py-2 text-right font-black">총금액</th>
                  <th class="w-20 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-28 px-3 py-2 text-center font-black">생성일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="order in poStore.filteredOrders"
                  :key="order.id"
                  class="cursor-pointer transition-colors hover:bg-gray-50"
                  :class="{ 'bg-[#E6F2F0]': poStore.selectedOrderId === order.id }"
                  @click="selectOrder(order.id)"
                >
                  <td class="px-3 py-3 font-bold text-gray-400">{{ order.id }}</td>
                  <td class="px-3 py-3 font-black text-gray-800">{{ order.vendorName }}</td>
                  <td class="px-3 py-3 font-bold text-gray-600">{{ order.warehouseName }}</td>
                  <td class="px-3 py-3 text-center font-bold text-gray-700">
                    {{ order.items.length }}
                  </td>
                  <td class="px-3 py-3 text-right font-black text-gray-800">
                    ₩{{ order.totalPrice.toLocaleString() }}
                  </td>
                  <td class="px-3 py-3 text-center">
                    <span
                      class="inline-flex px-2 py-1 text-[10px] font-black"
                      :class="statusClass(order.status)"
                    >
                      {{ statusLabel(order.status) }}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-center text-[11px] text-gray-500">
                    {{ formatDate(order.createdAt) }}
                  </td>
                </tr>
                <tr v-if="poStore.filteredOrders.length === 0">
                  <td colspan="7" class="px-3 py-8 text-center text-xs text-gray-400">
                    조회된 발주 내역이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── 우측: 발주 상세 패널 (선택 시에만 표시) ── -->
        <aside
          v-if="poStore.selectedOrder"
          class="flex w-full shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm xl:w-[420px]"
        >
          <!-- 상세 패널 헤더 -->
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3
              class="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider"
            >
              <InfoIcon :size="14" />
              발주 상세
            </h3>
            <div class="flex items-center gap-3">
              <span
                class="inline-flex px-2 py-1 text-[10px] font-black"
                :class="statusClass(poStore.selectedOrder.status)"
              >
                {{ statusLabel(poStore.selectedOrder.status) }}
              </span>
              <button
                type="button"
                class="p-1 text-white/80 hover:bg-white/10"
                aria-label="닫기"
                @click="poStore.selectedOrderId = null"
              >
                <XIcon :size="16" />
              </button>
            </div>
          </div>

          <!-- 상세 내용 -->
          <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <!-- 기본 정보 카드 -->
            <section class="space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-[10px] font-bold uppercase text-gray-400">발주번호</p>
                  <p class="mt-0.5 text-sm font-black text-gray-900">
                    {{ poStore.selectedOrder.id }}
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[10px] font-bold uppercase text-gray-400">거래처</p>
                  <p class="mt-0.5 text-xs font-black text-gray-800">
                    {{ poStore.selectedOrder.vendorName }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase text-gray-400">입고 창고</p>
                  <p class="mt-0.5 text-xs font-black text-gray-800">
                    {{ poStore.selectedOrder.warehouseName }}
                  </p>
                </div>
                <div>
                  <p
                    class="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400"
                  >
                    <UserIcon :size="10" />
                    담당자
                  </p>
                  <p class="mt-0.5 text-xs font-black text-gray-800">
                    {{ poStore.selectedOrder.memberName }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase text-gray-400">생성일시</p>
                  <p class="mt-0.5 text-xs font-bold text-gray-500">
                    {{ formatDate(poStore.selectedOrder.createdAt) }}
                  </p>
                </div>
              </div>
            </section>

            <!-- 품목 테이블 -->
            <section>
              <p class="mb-2 text-[10px] font-black uppercase text-gray-400">발주 품목</p>
              <table class="w-full text-xs">
                <thead class="bg-gray-100 text-[10px] uppercase text-gray-500">
                  <tr>
                    <th class="px-2 py-2 text-left font-black">제품명</th>
                    <th class="w-10 px-2 py-2 text-right font-black">수량</th>
                    <th class="w-20 px-2 py-2 text-right font-black">단가</th>
                    <th class="w-20 px-2 py-2 text-right font-black">소계</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in poStore.selectedOrder.items" :key="item.id">
                    <td class="px-2 py-2 font-bold text-gray-800">{{ item.productName }}</td>
                    <td class="px-2 py-2 text-right font-bold text-gray-700">
                      {{ item.quantity }}
                    </td>
                    <td class="px-2 py-2 text-right text-gray-500">
                      ₩{{ item.unitPrice.toLocaleString() }}
                    </td>
                    <td class="px-2 py-2 text-right font-bold text-gray-700">
                      ₩{{ item.subtotal.toLocaleString() }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="border-t border-gray-300 bg-gray-50 font-black text-gray-900">
                  <tr>
                    <td colspan="3" class="px-2 py-2">총계</td>
                    <td class="px-2 py-2 text-right text-[#004D3C]">
                      ₩{{ poStore.selectedOrder.totalPrice.toLocaleString() }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>
          </div>

          <!-- 액션/안내 (상태별 조건부) -->
          <!-- PENDING 단계에서만 본사 권한(수정/취소) 노출. 승인 이후 단계는 시스템 자동화(RQ-001/002) 및 창고관리자(PO-003/004) 영역이므로 조회만. -->
          <div class="space-y-4 px-4 pb-6 pt-2">
            <template v-if="poStore.selectedOrder.status === 'PENDING'">
              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-2 py-3 text-[11px] font-black text-white hover:bg-[#1f4b3a]"
                @click="openApproveConfirm"
              >
                <CheckIcon :size="12" />
                거래처 승인 받음
              </button>
              <div class="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-1 border border-gray-400 bg-white px-2 py-2.5 text-[11px] font-black text-gray-700 hover:bg-gray-50"
                  @click="openEditModal"
                >
                  <EditIcon :size="12" />
                  수정
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-1 border border-red-500 bg-red-50 px-2 py-2.5 text-[11px] font-black text-red-700 hover:bg-red-100"
                  @click="handleCancel"
                >
                  <XIcon :size="12" />
                  취소
                </button>
              </div>
              <p class="pt-1 text-center text-[11px] leading-relaxed text-gray-400">
                거래처와 확인 후 [거래처 승인 받음] 을 눌러 진행 단계로 넘기세요.
              </p>
            </template>

            <template v-else-if="poStore.selectedOrder.status === 'APPROVED'">
              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-2 py-3 text-[11px] font-black text-white hover:bg-[#1f4b3a]"
                @click="openShippingConfirm"
              >
                <TruckIcon :size="12" />
                거래처 출고 시작
              </button>
              <p class="pt-1 text-center text-xs leading-relaxed text-gray-500">
                승인 완료 · 거래처 출고 통지 받으면 [거래처 출고 시작] 을 누르세요.
              </p>
            </template>

            <template v-else-if="poStore.selectedOrder.status === 'SHIPPING'">
              <p class="text-center text-xs text-gray-500">
                배송 중 · 창고 입고 검수 대기
              </p>
            </template>

            <template v-else>
              <p class="text-center text-xs text-gray-400">
                {{
                  poStore.selectedOrder.status === 'COMPLETED'
                    ? '입고 완료된 발주입니다.'
                    : '취소된 발주입니다.'
                }}
              </p>
            </template>
          </div>

          <!-- 하단: 닫기 버튼 -->
          <div class="border-t border-gray-200">
            <button
              type="button"
              class="w-full px-4 py-2.5 text-center text-[11px] font-bold text-gray-500 hover:bg-gray-50"
              @click="poStore.selectedOrderId = null"
            >
              닫기 (ESC)
            </button>
          </div>
        </aside>
      </section>
    </div>

    <!-- ================================================================ -->
    <!-- 모달 1/2: 새 발주 생성 / 발주 수정 (SO-026, SO-027, SO-028)       -->
    <!-- ================================================================ -->
    <div
      v-if="showOrderModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="closeOrderModal"
    >
      <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-xl">
        <!-- 모달 헤더 -->
        <div class="flex items-center justify-between bg-[#004D3C] px-5 py-4 text-white">
          <h2 class="text-sm font-black">발주 수정</h2>
          <button
            type="button"
            class="p-1 text-white/80 hover:bg-white/10"
            @click="closeOrderModal"
          >
            <XIcon :size="16" />
          </button>
        </div>

        <!-- 모달 본문 -->
        <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <!-- 창고 선택 -->
          <div>
            <label class="mb-1 block text-xs font-bold text-gray-700">
              입고 창고 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="modalWarehouseId"
              class="w-full border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#004D3C]"
            >
              <option value="">창고 선택</option>
              <option v-for="wh in poStore.warehouses" :key="wh.id" :value="wh.id">
                {{ wh.name }}
              </option>
            </select>
          </div>

          <!-- 거래처 선택 -->
          <div>
            <label class="mb-1 block text-xs font-bold text-gray-700">
              거래처 <span class="text-red-500">*</span>
            </label>
            <select
              v-model="modalVendorId"
              class="w-full border border-gray-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#004D3C]"
              @change="modalProductSearch = ''"
            >
              <option value="">거래처 선택</option>
              <option v-for="vendor in VENDORS" :key="vendor.id" :value="vendor.id">
                {{ vendor.name }}
              </option>
            </select>
          </div>

          <!-- 제품 검색 (SO-026: 주문 물품 검색) -->
          <div>
            <label class="mb-1 block text-xs font-bold text-gray-700">제품 검색</label>
            <div class="relative">
              <SearchIcon
                :size="14"
                class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="modalProductSearch"
                type="text"
                placeholder="제품명으로 검색..."
                :disabled="!modalVendorId"
                class="w-full border border-gray-300 bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C] disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            <!-- 검색 결과 목록 -->
            <div
              v-if="modalVendorId"
              class="mt-1 max-h-44 overflow-y-auto border border-gray-200 bg-white"
            >
              <div
                v-for="vp in modalVendorProducts"
                :key="vp.id"
                class="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-[#E6F2F0]"
                @click="addToCart(vp)"
              >
                <div>
                  <p class="text-xs font-black text-gray-800">{{ vp.productName }}</p>
                  <p class="text-[10px] text-gray-400">{{ vp.productCode }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-bold text-[#004D3C]">
                    ₩{{ vp.unitPrice.toLocaleString() }}
                  </p>
                  <p class="text-[10px] text-gray-400">단가</p>
                </div>
              </div>
              <div
                v-if="modalVendorProducts.length === 0"
                class="px-3 py-4 text-center text-xs text-gray-400"
              >
                검색 결과가 없습니다.
              </div>
            </div>
            <p v-else class="mt-1 text-[11px] text-gray-400">거래처를 먼저 선택해주세요.</p>
          </div>

          <!-- 장바구니 테이블 -->
          <div v-if="modalCart.length > 0">
            <p class="mb-2 text-xs font-bold text-gray-700">발주 품목 목록</p>
            <table class="w-full text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-2 py-2 text-left font-black">제품명</th>
                  <th class="w-20 px-2 py-2 text-right font-black">단가</th>
                  <th class="w-20 px-2 py-2 text-center font-black">수량</th>
                  <th class="w-20 px-2 py-2 text-right font-black">소계</th>
                  <th class="w-8 px-2 py-2 text-center font-black"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(item, idx) in modalCart" :key="item.productId">
                  <td class="px-2 py-2 font-bold text-gray-800">{{ item.productName }}</td>
                  <td class="px-2 py-2 text-right text-gray-500">
                    ₩{{ item.unitPrice.toLocaleString() }}
                  </td>
                  <td class="px-2 py-2 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        class="flex h-5 w-5 items-center justify-center border border-gray-300 bg-white text-xs hover:bg-gray-50"
                        @click="updateCartQty(idx, item.quantity - 1)"
                      >
                        -
                      </button>
                      <input
                        :value="item.quantity"
                        type="number"
                        min="1"
                        class="w-10 border border-gray-300 py-0.5 text-center text-xs outline-none focus:border-[#004D3C]"
                        @change="updateCartQty(idx, $event.target.value)"
                      />
                      <button
                        type="button"
                        class="flex h-5 w-5 items-center justify-center border border-gray-300 bg-white text-xs hover:bg-gray-50"
                        @click="updateCartQty(idx, item.quantity + 1)"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td class="px-2 py-2 text-right font-bold text-gray-700">
                    ₩{{ item.subtotal.toLocaleString() }}
                  </td>
                  <td class="px-2 py-2 text-center">
                    <button
                      type="button"
                      class="text-red-400 hover:text-red-600"
                      @click="removeCartItem(idx)"
                    >
                      <TrashIcon :size="12" />
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="border-t border-gray-300 bg-gray-50 font-black text-gray-900">
                <tr>
                  <td colspan="3" class="px-2 py-2">총액</td>
                  <td colspan="2" class="px-2 py-2 text-right text-[#004D3C]">
                    ₩{{ modalCartTotal.toLocaleString() }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div
            v-else
            class="rounded border border-dashed border-gray-300 py-6 text-center text-xs text-gray-400"
          >
            제품을 검색하여 발주 품목을 추가해주세요.
          </div>
        </div>

        <!-- 모달 푸터 -->
        <div
          class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3"
        >
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="closeOrderModal"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
            @click="submitOrder"
          >
            수정 저장
          </button>
        </div>
      </div>
    </div>

    <!-- ───────── 모달: 거래처 승인 received confirm ───────── -->
    <div
      v-if="showApproveConfirm && poStore.selectedOrder"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelApprove"
    >
      <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
        <div class="bg-[#004D3C] px-5 py-3 text-white">
          <h2 class="text-sm font-black">거래처 승인 기록</h2>
        </div>
        <div class="space-y-2 p-5 text-xs text-gray-700">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">발주 정보</p>
          <p>
            <strong>{{ poStore.selectedOrder.id }}</strong> ·
            {{ poStore.selectedOrder.vendorName }} ·
            <span class="font-bold text-[#004D3C]">
              ₩{{ poStore.selectedOrder.totalPrice.toLocaleString() }}
            </span>
          </p>
          <p class="pt-2">
            거래처 승인을 시스템에 기록합니다. 발주 상태가 <strong>승인 완료</strong>로 변경됩니다.
          </p>
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="cancelApprove"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
            @click="confirmApprove"
          >
            승인 기록
          </button>
        </div>
      </div>
    </div>

    <!-- ───────── 모달: 거래처 출고 시작 confirm ───────── -->
    <div
      v-if="showShippingConfirm && poStore.selectedOrder"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelShipping"
    >
      <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
        <div class="bg-[#004D3C] px-5 py-3 text-white">
          <h2 class="text-sm font-black">거래처 출고 기록</h2>
        </div>
        <div class="space-y-2 p-5 text-xs text-gray-700">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">발주 정보</p>
          <p>
            <strong>{{ poStore.selectedOrder.id }}</strong> ·
            {{ poStore.selectedOrder.vendorName }} ·
            <span class="font-bold text-[#004D3C]">
              ₩{{ poStore.selectedOrder.totalPrice.toLocaleString() }}
            </span>
          </p>
          <p class="pt-2">
            거래처 출고를 시스템에 기록합니다. 발주 상태가 <strong>배송 중</strong>으로 변경됩니다.
          </p>
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="cancelShipping"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
            @click="confirmShipping"
          >
            출고 기록
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

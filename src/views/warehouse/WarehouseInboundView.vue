<script setup>
import { computed, h, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useInboundStore } from '@/stores/inbound.js'
import { useWarehouseStockStore } from '@/stores/warehouseStock.js'

const router = useRouter()
const auth = useAuthStore()
const inbound = useInboundStore()
const stockStore = useWarehouseStockStore()

// 입고 확정 시 재고 변화 미리보기 — 선택된 발주의 items 와 warehouseId 로 산출
const inboundPreview = computed(() => {
  const order = inbound.selectedOrder
  if (!order || !order.warehouseId) return []
  return stockStore.getInboundPreview(order.warehouseId, order.items ?? [])
})

const previewHasShortage = computed(() =>
  inboundPreview.value.some((row) => row.shortageAfter),
)

// 우측 상세 품목 표 — 행마다 현재 실재고/안전재고 표시용 캐시
const itemStocks = computed(() => {
  const order = inbound.selectedOrder
  if (!order || !order.warehouseId) return new Map()
  const map = new Map()
  for (const item of order.items ?? []) {
    if (!item.productCode) continue
    map.set(item.id, stockStore.getStock(order.warehouseId, item.productCode))
  }
  return map
})

function getItemStock(item) {
  return itemStocks.value.get(item.id) ?? null
}

function isItemShortage(item) {
  const s = getItemStock(item)
  return !!(s && s.onHand < s.safetyStock)
}

// ─── 레이아웃 ────────────────────────────────────────────────────────────────
const activeSideMenu = ref('입고 관리')
const topMenus = roleMenus.warehouse
const sideMenus = roleMenus.warehouse.find((menu) => menu.label === '입/출고 관리')?.children ?? []

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// ─── 상태 탭 ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { key: 'DELIVERED', label: '입고 예정' },
  { key: 'COMPLETED', label: '입고 완료' },
]

// 탭 변경 시 선택 클리어 — 좌측 목록과 우측 상세의 컨텍스트 일치 유지
function changeTab(key) {
  inbound.activeStatusTab = key
  inbound.selectedOrderId = null
}

// ─── 입고 확정 confirm ───────────────────────────────────────────────────────
const showConfirmInbound = ref(false)

function openConfirmInbound() {
  // DELIVERED(배송완료, 도착됨) 상태에서만 입고 확정 가능 — markCompleted 검증
  if (inbound.selectedOrder?.status !== 'DELIVERED') return
  showConfirmInbound.value = true
}
function cancelConfirmInbound() {
  showConfirmInbound.value = false
}
async function confirmInbound() {
  const id = inbound.selectedOrder?.id
  if (!id) return
  showConfirmInbound.value = false
  try {
    await inbound.confirmInbound(id)
    triggerToast('입고가 확정되었습니다')
  } catch (e) {
    triggerToast(e?.message ?? '입고 확정에 실패했습니다')
  }
}

// ─── 토스트 ─────────────────────────────────────────────────────────────────
const toast = ref({ show: false, message: '' })
let toastTimer = null
function triggerToast(message) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message }
  toastTimer = setTimeout(() => {
    toast.value = { show: false, message: '' }
  }, 3000)
}

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────
function statusClass(status) {
  const map = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-emerald-50 text-emerald-700',
    SHIPPING: 'bg-blue-50 text-blue-600',
    DELIVERED: 'bg-violet-50 text-violet-700',
    COMPLETED: 'bg-gray-100 text-gray-500',
    REJECTED: 'bg-red-50 text-red-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-500'
}

function statusLabel(status) {
  const map = {
    PENDING: '승인 대기',
    APPROVED: '승인 완료',
    SHIPPING: '배송 중',
    DELIVERED: '배송 완료',
    COMPLETED: '입고 완료',
    REJECTED: '취소',
  }
  return map[status] ?? status
}

function formatDate(iso) {
  if (!iso) return '-'
  return iso.replace('T', ' ').slice(0, 16)
}

function historyDotClass(status) {
  const map = {
    PENDING: 'bg-amber-500',
    APPROVED: 'bg-emerald-500',
    SHIPPING: 'bg-blue-500',
    DELIVERED: 'bg-violet-500',
    COMPLETED: 'bg-gray-700',
    REJECTED: 'bg-red-600',
  }
  return map[status] ?? 'bg-gray-400'
}

function historyTextClass(status) {
  const map = {
    PENDING: 'text-amber-700',
    APPROVED: 'text-emerald-700',
    SHIPPING: 'text-blue-600',
    DELIVERED: 'text-violet-700',
    COMPLETED: 'text-gray-700',
    REJECTED: 'text-red-700',
  }
  return map[status] ?? 'text-gray-700'
}

function selectOrder(id) {
  inbound.selectOrder(id)
}

// 창고 관점 진행 이력 — DELIVERED/COMPLETED 만 (PENDING/APPROVED/SHIPPING 은 거래처 영역, 노이즈)
const visibleHistory = computed(() => {
  const list = inbound.selectedOrder?.statusHistory ?? []
  return list.filter((h) => h.status === 'DELIVERED' || h.status === 'COMPLETED')
})

// ─── ESC 키로 상세 패널 닫기 ────────────────────────────────────────────────
function handleKeydown(e) {
  if (e.key === 'Escape' && inbound.selectedOrderId) {
    inbound.selectedOrderId = null
  }
}
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// ─── inline SVG 아이콘 ────────────────────────────────────────────────────
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

const XIcon = IconBase([
  { tag: 'path', attrs: { d: 'M18 6 6 18' } },
  { tag: 'path', attrs: { d: 'm6 6 12 12' } },
])

const InfoIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 10v6' } },
  { tag: 'path', attrs: { d: 'M12 7h.01' } },
])

const UserIcon = IconBase([
  { tag: 'path', attrs: { d: 'M20 21a8 8 0 0 0-16 0' } },
  { tag: 'circle', attrs: { cx: '12', cy: '8', r: '4' } },
])

const CheckIcon = IconBase([{ tag: 'polyline', attrs: { points: '20 6 9 17 4 12' } }])
</script>

<template>
  <AppLayout
    active-top-menu="입/출고 관리"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <!-- 상단 헤더 영역: 상태 탭 -->
      <section class="border border-gray-300 bg-white p-3 shadow-sm">
        <div class="flex flex-wrap gap-1">
          <button
            v-for="tab in STATUS_TABS"
            :key="tab.key"
            type="button"
            class="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-black transition-colors"
            :class="
              inbound.activeStatusTab === tab.key
                ? 'border-[#004D3C] bg-[#004D3C] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="changeTab(tab.key)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="min-w-[18px] px-1 py-0.5 text-center text-[10px]"
              :class="
                inbound.activeStatusTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              {{ inbound.counts[tab.key] }}
            </span>
          </button>
        </div>
      </section>

      <!-- 본문: 좌(테이블) + 우(상세 패널) -->
      <section class="flex min-h-0 flex-col gap-4 xl:flex-row">
        <!-- ── 입고 목록 테이블 ── -->
        <div
          class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
        >
          <!-- 테이블 상단 바: 건수 -->
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2"
          >
            <span class="text-xs font-bold text-gray-600">
              총 {{ inbound.inboundList.length }}건
            </span>
          </div>

          <!-- 필터 줄: 기간 / 정렬 / 검색 -->
          <div
            class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2"
          >
            <input
              v-model="inbound.dateFrom"
              type="date"
              class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            />
            <span class="text-xs text-gray-400">~</span>
            <input
              v-model="inbound.dateTo"
              type="date"
              class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            />

            <select
              v-model="inbound.sortBy"
              class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="priceDesc">총금액 ↓</option>
              <option value="priceAsc">총금액 ↑</option>
            </select>

            <label class="relative ml-auto block">
              <SearchIcon
                :size="14"
                class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="inbound.searchKeyword"
                type="text"
                placeholder="발주번호/거래처/품목 검색"
                class="w-52 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C]"
              />
            </label>
          </div>

          <div class="overflow-auto">
            <table class="w-full min-w-[760px] table-fixed border-collapse text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-32 px-3 py-2 text-left font-black">발주번호</th>
                  <th class="w-32 px-3 py-2 text-left font-black">거래처</th>
                  <th class="w-28 px-3 py-2 text-left font-black">입고 창고</th>
                  <th class="w-44 px-3 py-2 text-left font-black">품목</th>
                  <th class="w-28 px-3 py-2 text-right font-black">총금액</th>
                  <th class="w-20 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-28 px-3 py-2 text-center font-black">입고 예정일</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="order in inbound.inboundList"
                  :key="order.id"
                  class="cursor-pointer transition-colors hover:bg-gray-50"
                  :class="{ 'bg-[#E6F2F0]': inbound.selectedOrderId === order.id }"
                  @click="selectOrder(order.id)"
                >
                  <td class="px-3 py-3 font-bold text-gray-400">{{ order.id }}</td>
                  <td class="px-3 py-3 font-black text-gray-800">{{ order.vendorName }}</td>
                  <td class="px-3 py-3 font-bold text-gray-600">{{ order.warehouseName }}</td>
                  <td class="px-3 py-3 font-bold text-gray-700">
                    <span class="block truncate" :title="(order.productNames ?? []).join(', ')">
                      <template v-if="order.productNames && order.productNames.length > 0">
                        {{ order.productNames[0]
                        }}<template v-if="order.productNames.length > 1">
                          외 {{ order.productNames.length - 1 }}건
                        </template>
                      </template>
                      <template v-else>—</template>
                    </span>
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
                <tr v-if="inbound.inboundList.length === 0">
                  <td colspan="7" class="px-3 py-8 text-center text-xs text-gray-400">
                    조회된 입고 내역이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── 우측: 입고 상세 패널 (선택 시) ── -->
        <aside
          v-if="inbound.selectedOrder"
          class="flex w-full shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm xl:w-[420px]"
        >
          <!-- 상세 패널 헤더 -->
          <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
            <h3
              class="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider"
            >
              <InfoIcon :size="14" />
              입고 상세
            </h3>
            <div class="flex items-center gap-3">
              <span
                class="inline-flex px-2 py-1 text-[10px] font-black"
                :class="statusClass(inbound.selectedOrder.status)"
              >
                {{ statusLabel(inbound.selectedOrder.status) }}
              </span>
              <button
                type="button"
                class="p-1 text-white/80 hover:bg-white/10"
                aria-label="닫기"
                @click="inbound.selectedOrderId = null"
              >
                <XIcon :size="16" />
              </button>
            </div>
          </div>

          <!-- 상세 내용 -->
          <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <!-- 기본 정보 -->
            <section class="space-y-3">
              <div>
                <p class="text-[10px] font-bold uppercase text-gray-400">발주번호</p>
                <p class="mt-0.5 text-sm font-black text-gray-900">
                  {{ inbound.selectedOrder.id }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[10px] font-bold uppercase text-gray-400">거래처</p>
                  <p class="mt-0.5 text-xs font-black text-gray-800">
                    {{ inbound.selectedOrder.vendorName }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase text-gray-400">입고 창고</p>
                  <p class="mt-0.5 text-xs font-black text-gray-800">
                    {{ inbound.selectedOrder.warehouseName }}
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
                    {{ inbound.selectedOrder.memberName }}
                  </p>
                </div>
                <div>
                  <p class="text-[10px] font-bold uppercase text-gray-400">생성일시</p>
                  <p class="mt-0.5 text-xs font-bold text-gray-500">
                    {{ formatDate(inbound.selectedOrder.createdAt) }}
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
                    <th class="w-12 px-2 py-2 text-right font-black">실재고</th>
                    <th class="w-10 px-2 py-2 text-right font-black">안전</th>
                    <th class="w-16 px-2 py-2 text-right font-black">단가</th>
                    <th class="w-16 px-2 py-2 text-right font-black">소계</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in inbound.selectedOrder.items" :key="item.id">
                    <td class="px-2 py-2 font-bold text-gray-800">{{ item.productName }}</td>
                    <td class="px-2 py-2 text-right font-bold text-gray-700">
                      {{ item.quantity }}
                    </td>
                    <td
                      class="px-2 py-2 text-right font-black"
                      :class="isItemShortage(item) ? 'text-red-600' : 'text-gray-800'"
                    >
                      <template v-if="getItemStock(item)">
                        {{ getItemStock(item).onHand }}
                      </template>
                      <span v-else class="text-gray-300">—</span>
                    </td>
                    <td class="px-2 py-2 text-right font-bold text-gray-500">
                      <template v-if="getItemStock(item)">
                        {{ getItemStock(item).safetyStock }}
                      </template>
                      <span v-else class="text-gray-300">—</span>
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
                    <td colspan="5" class="px-2 py-2">총계</td>
                    <td class="px-2 py-2 text-right text-[#004D3C]">
                      ₩{{ inbound.selectedOrder.totalPrice.toLocaleString() }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            <!-- 진행 이력 타임라인 — 창고 단계(SHIPPING/COMPLETED)만 -->
            <section v-if="visibleHistory.length">
              <p class="mb-2 text-[10px] font-black uppercase text-gray-400">진행 이력</p>
              <ol class="ml-2">
                <li
                  v-for="(h, idx) in visibleHistory"
                  :key="idx"
                  class="relative pb-3 pl-5 last:pb-0"
                >
                  <span
                    class="absolute left-0 top-1 block h-2.5 w-2.5"
                    :class="historyDotClass(h.status)"
                  />
                  <span
                    v-if="idx < visibleHistory.length - 1"
                    class="absolute bottom-0 left-[4px] top-3.5 w-px bg-gray-300"
                  />
                  <p class="text-[11px] font-black" :class="historyTextClass(h.status)">
                    {{ statusLabel(h.status) }}
                  </p>
                  <p class="text-[10px] text-gray-500">
                    {{ formatDate(h.at) }} · {{ h.byName }}
                  </p>
                </li>
              </ol>
            </section>
          </div>

          <!-- 액션/안내 (상태별 분기) -->
          <div class="space-y-3 px-4 pb-6 pt-2">
            <template v-if="inbound.selectedOrder.status === 'DELIVERED'">
              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-2 py-3 text-[11px] font-black text-white hover:bg-[#1f4b3a]"
                @click="openConfirmInbound"
              >
                <CheckIcon :size="12" />
                입고 확정
              </button>
              <p class="pt-1 text-center text-[11px] leading-relaxed text-gray-400">
                배송 완료된 발주입니다. [입고 확정] 을 누르면 창고 자산으로 등록됩니다.
              </p>
            </template>

            <template v-else-if="inbound.selectedOrder.status === 'COMPLETED'">
              <p class="pt-2 text-center text-xs text-gray-400">입고 완료된 발주입니다.</p>
            </template>
          </div>

          <!-- 하단: 닫기 -->
          <div class="border-t border-gray-200">
            <button
              type="button"
              class="w-full px-4 py-2.5 text-center text-[11px] font-bold text-gray-500 hover:bg-gray-50"
              @click="inbound.selectedOrderId = null"
            >
              닫기 (ESC)
            </button>
          </div>
        </aside>
      </section>
    </div>

    <!-- ───────── 모달: 입고 확정 confirm ───────── -->
    <div
      v-if="showConfirmInbound && inbound.selectedOrder"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="cancelConfirmInbound"
    >
      <div class="w-full max-w-lg overflow-hidden bg-white shadow-xl">
        <div class="bg-[#004D3C] px-5 py-3 text-white">
          <h2 class="text-sm font-black">입고 확정</h2>
        </div>
        <div class="space-y-3 p-5 text-xs text-gray-700">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">발주 정보</p>
            <p class="mt-1">
              <strong>{{ inbound.selectedOrder.id }}</strong> ·
              {{ inbound.selectedOrder.vendorName }} ·
              <span class="font-bold text-[#004D3C]">
                ₩{{ inbound.selectedOrder.totalPrice.toLocaleString() }}
              </span>
            </p>
          </div>

          <!-- 입고 후 재고 변화 미리보기 -->
          <div v-if="inboundPreview.length > 0">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              입고 후 재고 변화 ({{ inbound.selectedOrder.warehouseName }})
            </p>
            <table class="mt-1 w-full table-fixed border-collapse text-[11px]">
              <thead class="bg-gray-50 text-[9px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="px-2 py-1.5 text-left font-black">품목</th>
                  <th class="w-12 px-2 py-1.5 text-right font-black">입고</th>
                  <th class="w-20 px-2 py-1.5 text-right font-black">실재고</th>
                  <th class="w-12 px-2 py-1.5 text-right font-black">안전</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in inboundPreview" :key="row.productCode">
                  <td class="truncate px-2 py-1.5 font-bold text-gray-800">
                    {{ row.productName }}
                  </td>
                  <td class="px-2 py-1.5 text-right font-black text-[#004D3C]">
                    +{{ row.quantity }}
                  </td>
                  <td class="px-2 py-1.5 text-right font-bold">
                    <template v-if="row.before">
                      <span class="text-gray-400">{{ row.before.onHand }}</span>
                      <span class="mx-1 text-gray-300">→</span>
                      <span :class="row.shortageAfter ? 'text-red-600' : 'text-gray-800'">
                        {{ row.after.onHand }}
                      </span>
                    </template>
                    <span v-else class="text-gray-300">—</span>
                  </td>
                  <td class="px-2 py-1.5 text-right font-bold text-gray-500">
                    <template v-if="row.before">{{ row.before.safetyStock }}</template>
                    <span v-else class="text-gray-300">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              v-if="previewHasShortage"
              class="mt-2 border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-800"
            >
              ⚠ 입고 확정 후에도 안전재고 미달 품목이 있습니다 — 추가 발주 검토 필요.
            </p>
          </div>

          <p class="pt-1 text-[11px] text-gray-500">
            창고 자산으로 등록되며 발주 상태가 <strong>입고 완료</strong>로 변경됩니다.
          </p>
        </div>
        <div
          class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3"
        >
          <button
            type="button"
            class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
            @click="cancelConfirmInbound"
          >
            취소
          </button>
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
            @click="confirmInbound"
          >
            입고 확정
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

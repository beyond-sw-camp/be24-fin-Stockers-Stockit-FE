<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'
import WarehouseInboundConfirmModal from '@/components/warehouse/inbound/WarehouseInboundConfirmModal.vue'
import WarehouseInboundDetailPanel from '@/components/warehouse/inbound/WarehouseInboundDetailPanel.vue'
import { SearchIcon } from '@/components/warehouse/inbound/icons.js'
import { roleMenus } from '@/config/roleMenus.js'
import { useToast } from '@/composables/useToast.js'
import { useWarehouseStatusFormat } from '@/composables/warehouse/useWarehouseStatusFormat.js'
import { useWarehouseInboundStore } from '@/stores/warehouse/warehouseInbound.js'
import { useWarehouseStockStore } from '@/stores/warehouse/warehouseStock.js'

const inbound = useWarehouseInboundStore()
const stockStore = useWarehouseStockStore()
const { toast, triggerToast } = useToast()
const { statusClass, statusLabel, inboundTypeClass, inboundTypeLabel, formatDate } =
  useWarehouseStatusFormat()

// ─── 레이아웃 ────────────────────────────────────────────────────────────────
const activeSideMenu = ref('입고 관리')
const topMenus = roleMenus.warehouse

// ─── 상태 탭 ────────────────────────────────────────────────────────────────
// 5탭 — [전체] + 거래처 책임 4단계 (READY_TO_SHIP 부터 노출). [입고 확정] 은 ARRIVED 일 때만.
const STATUS_TABS = [
  { key: '전체', label: '전체' },
  { key: 'READY_TO_SHIP', label: '배송 준비 중' },
  { key: 'IN_TRANSIT', label: '배송 중' },
  { key: 'ARRIVED', label: '입고 예정' },
  { key: 'COMPLETED', label: '입고 완료' },
]

function changeTab(key) {
  inbound.activeStatusTab = key
  inbound.selectedOrderId = null
}

function selectOrder(id) {
  inbound.selectOrder(id)
}

// ─── 입고 확정 confirm ───────────────────────────────────────────────────────
const showConfirmInbound = ref(false)

// 입고 확정 시 재고 변화 미리보기 — 선택된 발주의 items 와 warehouseId 로 산출
const inboundPreview = computed(() => {
  const order = inbound.selectedOrder
  if (!order || !order.warehouseId) return []
  return stockStore.getInboundPreview(order.warehouseId, order.items ?? [])
})

const previewHasShortage = computed(() => inboundPreview.value.some((row) => row.shortageAfter))

// 우측 상세 품목 표 — 행마다 현재 실재고/안전재고 표시용 캐시.
// 발주 라인 = 단일 SKU 이므로 SKU 단위 lookup (master 합산값과 혼동 방지 —
// 창고재고조회 화면이 SKU 단위로 보여주는 것과 정합).
// BE inbound items 응답에 id 필드 없음 — skuCode 를 map key 로 사용 (panel lookup 도 동기화).
const itemStocks = computed(() => {
  const order = inbound.selectedOrder
  if (!order || !order.warehouseId) return new Map()
  const map = new Map()
  for (const item of order.items ?? []) {
    if (!item.skuCode) continue
    map.set(item.skuCode, stockStore.getSkuStock(order.warehouseId, item.skuCode))
  }
  return map
})

function openConfirmInbound() {
  // ARRIVED(배송 완료, 도착됨) 상태에서만 입고 확정 가능 — markCompleted 검증
  if (inbound.selectedOrder?.status !== 'ARRIVED') return
  showConfirmInbound.value = true
}

async function confirmInbound() {
  const id = inbound.selectedOrder?.id
  if (!id) return
  showConfirmInbound.value = false
  try {
    await inbound.confirmInbound(id)
    // 입고 확정 직후 재고 캐시 무효화 + 즉시 재로딩 — onHand 변화 반영.
    stockStore.invalidate()
    await stockStore.loadProductStocks().catch(() => {})
    triggerToast('입고가 확정되었습니다')
  } catch (e) {
    triggerToast(e?.message ?? '입고 확정에 실패했습니다')
  }
}

// ─── ESC 키로 상세 패널 닫기 ────────────────────────────────────────────────
function handleKeydown(e) {
  if (e.key === 'Escape' && inbound.selectedOrderId) {
    inbound.selectedOrderId = null
  }
}

// 화면 진입 시 입고 목록 강제 fetch — 다른 화면에서 status 변경됐을 수 있으므로 stale 방지.
// stockStore SKU + master 둘 다 트리거 — itemStocks 는 SKU 단위, inboundPreview 도 SKU 단위.
// master 캐시는 다른 화면 호환 위해 같이 채워둠 (no-op if already loaded).
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  inbound.fetchAll().catch(() => {})
  stockStore.loadProductStocks().catch(() => {})
  stockStore.loadSkuStocks().catch(() => {})
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <AppLayout
    active-top-menu="입고 관리"
    :top-menus="topMenus"
    :side-menus="[]"

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
                placeholder="발주번호/공급처/품목 검색"
                class="w-52 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C]"
              />
            </label>
          </div>

          <div class="overflow-auto">
            <table class="w-full min-w-[920px] table-fixed border-collapse text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-16 px-2 py-2 text-center font-black">종류</th>
                  <th class="w-36 px-3 py-2 text-left font-black">입고번호</th>
                  <th class="w-36 px-3 py-2 text-left font-black">출처번호</th>
                  <th class="w-32 px-3 py-2 text-left font-black">출처</th>
                  <th class="w-44 px-3 py-2 text-left font-black">품목</th>
                  <th class="w-20 px-3 py-2 text-right font-black">수량</th>
                  <th class="w-28 px-3 py-2 text-right font-black">금액</th>
                  <th class="w-20 px-3 py-2 text-center font-black">상태</th>
                  <th class="w-28 px-3 py-2 text-center font-black">도착(예정)일</th>
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
                  <td class="px-2 py-3 text-center">
                    <span
                      class="inline-flex px-2 py-1 text-[10px] font-black"
                      :class="inboundTypeClass(order.inboundType)"
                    >
                      {{ inboundTypeLabel(order.inboundType) }}
                    </span>
                  </td>
                  <td class="px-3 py-3 font-bold text-gray-700">{{ order.inboundCode }}</td>
                  <td class="px-3 py-3 font-bold text-gray-500">{{ order.sourceRefNo }}</td>
                  <td class="px-3 py-3 font-black text-gray-800">{{ order.sourceName }}</td>
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
                  <td class="px-3 py-3 text-right font-bold text-gray-700">
                    {{ (order.totalQuantity ?? 0).toLocaleString() }}
                  </td>
                  <td class="px-3 py-3 text-right font-black text-gray-800">
                    <template v-if="order.totalAmount != null">
                      ₩{{ order.totalAmount.toLocaleString() }}
                    </template>
                    <span v-else class="text-gray-300">—</span>
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
                    {{ formatDate(order.arrivedAt ?? order.createdAt) }}
                  </td>
                </tr>
                <tr v-if="inbound.inboundList.length === 0">
                  <td colspan="9" class="px-3 py-8 text-center text-xs text-gray-400">
                    조회된 입고 내역이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── 우측: 입고 상세 패널 (선택 시) ── -->
        <WarehouseInboundDetailPanel
          v-if="inbound.selectedOrder"
          :order="inbound.selectedOrder"
          :item-stocks="itemStocks"
          @close="inbound.selectedOrderId = null"
          @confirm-inbound="openConfirmInbound"
        />
      </section>
    </div>

    <!-- ───────── 모달: 입고 확정 confirm ───────── -->
    <WarehouseInboundConfirmModal
      :open="showConfirmInbound"
      :order="inbound.selectedOrder"
      :preview="inboundPreview"
      :has-shortage="previewHasShortage"
      @cancel="showConfirmInbound = false"
      @confirm="confirmInbound"
    />

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

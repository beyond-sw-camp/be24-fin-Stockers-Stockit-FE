<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'
import { PlusIcon, TruckIcon, ZapIcon } from '@/components/hq/purchase-order/icons.js'
import PurchaseOrderCancelModal from '@/components/hq/purchase-order/PurchaseOrderCancelModal.vue'
import PurchaseOrderDetailPanel from '@/components/hq/purchase-order/PurchaseOrderDetailPanel.vue'
import { useStatusFormat } from '@/composables/hq/purchaseOrder/useStatusFormat.js'

const router = useRouter()
const auth = useAuthStore()
const poStore = usePurchaseOrderStore()

const { statusClass, statusLabel, historyDotClass, historyTextClass, formatDate } = useStatusFormat()

// ─── 레이아웃 설정 ───────────────────────────────────────────────────────────
const hqMenus = roleMenus.hq
const activeTopMenu = computed(() => '주문/발주 관리')

const sideMenus = [
  { label: '매장 주문', icon: 'file', path: '/hq/orders' },
  { label: '공급처 발주', icon: 'truck', path: '/hq/purchase-orders' },
  { label: '공급처 관리', icon: 'briefcase', path: '/hq/vendors' },
]
const activeSideMenu = ref('공급처 발주')

function handleLogout() {
  auth.logout()
  router.push('/dev-login')
}

// ─── 상태 탭 ────────────────────────────────────────────────────────────────
// 본사 화면이라 COMPLETED 라벨은 "종료" (창고 화면은 "입고 완료").
// 공급처 책임 4단계(APPROVED/READY_TO_SHIP/IN_TRANSIT/ARRIVED)는 SYS-001 배치가
// 자동 처리하므로 본사는 액션 불가 — '공급처 처리 중' 한 탭으로 그루핑해 인지 부담 감소.
// 세부 단계는 우측 상세의 진행 이력 타임라인이 시각화한다.
const STATUS_TABS = [
  { label: '전체', key: '전체' },
  { label: '승인 대기', key: 'REQUESTED' },
  { label: '공급처 처리 중', key: 'VENDOR_PROCESSING' },
  { label: '종료', key: 'COMPLETED' },
  { label: '취소', key: 'CANCELLED' },
]

// ─── 발주 목록/상세 ──────────────────────────────────────────────────────────
function selectOrder(id) {
  poStore.selectOrder(id)
}

// ─── 발주 취소 confirm ──────────────────────────────────────────────────────
// 공급처 승인(PENDING→APPROVED)·출고 시작(APPROVED→SHIPPING) 두 단계는 SYS-001 배치가
// 자동 처리한다 (5분 주기, 30분 경과 조건). 본사는 발주 작성·취소 + 시연용 강제 트리거만.
// cancelReason 은 모달 로컬 state — 부모는 open/close 만 관리.
const showCancelConfirm = ref(false)

const toast = ref({ show: false, message: '' })
let toastTimer = null
function triggerToast(message) {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message }
  toastTimer = setTimeout(() => {
    toast.value = { show: false, message: '' }
  }, 3000)
}

// ─── SYS-001 배치 강제 트리거 (시연·QA용) ─────────────────────────────────
// 30분 대기 조건을 무시하고 공급처 책임 4단계(REQUESTED/APPROVED/READY_TO_SHIP/IN_TRANSIT)
// 모두 즉시 다음 단계로 넘긴다.
const isRunningBatch = ref(false)
async function runBatchTrigger() {
  if (isRunningBatch.value) return
  isRunningBatch.value = true
  try {
    const result = await poStore.runBatch()
    const total =
      (result?.approved ?? 0) +
      (result?.readyToShip ?? 0) +
      (result?.inTransit ?? 0) +
      (result?.arrived ?? 0)
    if (total === 0) {
      triggerToast('자동 전환 대상 발주가 없습니다')
    } else {
      triggerToast(
        `자동 전환 ${total}건 (승인 ${result.approved} · 배송준비 ${result.readyToShip} · 배송중 ${result.inTransit} · 배송완료 ${result.arrived})`,
      )
    }
  } catch (e) {
    triggerToast(e?.message ?? '배치 실행에 실패했습니다')
  } finally {
    isRunningBatch.value = false
  }
}

// ─── 발주 취소 (CEN-038) ────────────────────────────────────────────────────
// REQUESTED (승인 대기) 단계에서만 취소 가능. 그 이후는 공급처가 이미 받았으므로 차단.
function openCancelConfirm() {
  if (poStore.selectedOrder?.status !== 'REQUESTED') return
  showCancelConfirm.value = true
}

function cancelCancelConfirm() {
  showCancelConfirm.value = false
}

async function confirmCancelOrder(reason) {
  const id = poStore.selectedOrder?.id
  if (!id) return
  showCancelConfirm.value = false
  try {
    await poStore.cancelOrder(id, (reason ?? '').trim())
    triggerToast('발주가 취소되었습니다')
  } catch (e) {
    triggerToast(e?.message ?? '취소 처리에 실패했습니다')
  }
}

// 탭 변경 시 선택 클리어 — 좌측 목록과 우측 상세의 컨텍스트 일치 유지
function changeTab(key) {
  poStore.activeStatusTab = key
  poStore.selectedOrderId = null
}

// statusClass / statusLabel / historyDotClass / historyTextClass / formatDate
// 는 useStatusFormat() composable 에서 제공.

// ─── 발주 작성/수정 페이지 라우팅 ──────────────────────────────────────────
function goCreatePage() {
  router.push({ name: 'hq-purchase-order-new' })
}

function goEditPage() {
  const order = poStore.selectedOrder
  if (!order || order.status !== 'REQUESTED') return
  router.push({ name: 'hq-purchase-order-edit', params: { id: order.id } })
}

// ─── ESC 키로 상세 패널 닫기 ────────────────────────────────────────────────
function handleKeydown(e) {
  if (e.key === 'Escape' && poStore.selectedOrderId) {
    poStore.selectedOrderId = null
  }
}
// 화면 진입 시 발주 목록 강제 fetch — 다른 화면(창고 입고 확정 등)에서 status 가
// 변경됐을 수 있으므로 stale data 방지. store 의 마운트 자동 fetch 는 첫 인스턴스에만 실행됨.
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  poStore.fetchOrders().catch(() => {})
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

// 아이콘은 @/components/hq/purchase-order/icons.js 에서 import.
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
      <!-- 총 발주 요약 (공급처/기간 컨텍스트 반영) -->
      <section class="flex items-center gap-4 border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center bg-[#E6F2F0] text-[#004D3C]"
        >
          <TruckIcon :size="22" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">총 발주</p>
          <p class="mt-0.5 truncate text-2xl font-black text-[#004D3C]">
            ₩{{ poStore.summary.totalPrice.toLocaleString() }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">건수</p>
          <p class="mt-0.5 text-xl font-black text-gray-700">
            {{ poStore.summary.totalCount }}<span class="ml-0.5 text-xs font-bold">건</span>
          </p>
        </div>
      </section>

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
            @click="changeTab(tab.key)"
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
            <!-- 본사 액션 가능 단계 강조 — REQUESTED 카운트 > 0 + 비활성 탭일 때만 -->
            <span
              v-if="
                tab.key === 'REQUESTED' &&
                poStore.statusCounts.REQUESTED > 0 &&
                poStore.activeStatusTab !== 'REQUESTED'
              "
              class="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500"
              aria-hidden="true"
            />
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
                  placeholder="발주번호/공급처/품목명 검색"
                  class="w-52 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C]"
                />
              </label>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-1.5 text-xs font-black text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                :disabled="isRunningBatch"
                title="SYS-001 배치를 즉시 한 번 돌립니다 (시연·QA용)"
                @click="runBatchTrigger"
              >
                <ZapIcon :size="14" />
                {{ isRunningBatch ? '실행 중...' : '배치 강제 실행' }}
              </button>
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

          <!-- 필터 줄: 공급처 / 기간 / 정렬 -->
          <div
            class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2"
          >
            <select
              v-model="poStore.vendorFilter"
              class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            >
              <option value="">전체 공급처</option>
              <option v-for="v in poStore.vendorOptions" :key="v.id" :value="v.id">
                {{ v.name }}
              </option>
            </select>

            <input
              v-model="poStore.dateFrom"
              type="date"
              class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            />
            <span class="text-xs text-gray-400">~</span>
            <input
              v-model="poStore.dateTo"
              type="date"
              class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            />

            <select
              v-model="poStore.sortBy"
              class="ml-auto border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="priceDesc">총금액 ↓</option>
              <option value="priceAsc">총금액 ↑</option>
            </select>
          </div>

          <div class="overflow-auto">
            <table class="w-full min-w-[760px] table-fixed border-collapse text-xs">
              <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th class="w-32 px-3 py-2 text-left font-black">발주번호</th>
                  <th class="px-3 py-2 text-left font-black">공급처</th>
                  <th class="w-28 px-3 py-2 text-left font-black">입고 창고</th>
                  <th class="w-44 px-3 py-2 text-left font-black">품목</th>
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
                <tr v-if="poStore.filteredOrders.length === 0">
                  <td colspan="7" class="px-3 py-8 text-center text-xs text-gray-400">
                    조회된 발주 내역이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <PurchaseOrderDetailPanel
          v-if="poStore.selectedOrder"
          :order="poStore.selectedOrder"
          @close="poStore.selectedOrderId = null"
          @edit="goEditPage"
          @cancel="openCancelConfirm"
        />
      </section>
    </div>

    <PurchaseOrderCancelModal
      :open="showCancelConfirm"
      :order="poStore.selectedOrder"
      @cancel="cancelCancelConfirm"
      @confirm="confirmCancelOrder"
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

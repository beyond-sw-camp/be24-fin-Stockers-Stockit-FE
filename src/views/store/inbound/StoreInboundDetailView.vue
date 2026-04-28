<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useStoreOrdersStore } from '@/stores/storeOrders.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const storeOrders = useStoreOrdersStore()

const storeMenus = roleMenus.store
const inboundMenus = roleMenus.store.find((menu) => menu.label === '입고 관리')?.children ?? []
const activeTopMenu = computed(() => '입고 관리')
const activeSideMenu = ref('입고 리스트')

const showConfirmModal = ref(false)
const toastMessage = ref('')

const orderId = computed(() => String(route.params.id ?? ''))
const selectedOrder = computed(() => storeOrders.getOrderById(orderId.value))
const isHistoryMode = computed(() => route.name === 'store-inbound-history-detail')
const canConfirmInbound = computed(() =>
  !isHistoryMode.value
  && selectedOrder.value?.status === 'APPROVED'
  && selectedOrder.value?.inboundStatus === 'ARRIVED',
)
const highlightedInboundHistoryKey = computed(() => {
  if (!selectedOrder.value || selectedOrder.value.inboundStatus === 'RECEIVED') return ''
  const lastHistory = selectedOrder.value.inboundStatusHistory?.at(-1)
  if (!lastHistory) return ''
  return `${lastHistory.status}-${lastHistory.at}`
})

function formatDateTime(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function statusClass(status) {
  return {
    REQUESTED: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-[#EBF5F5] text-black',
    COMPLETED: 'bg-slate-200 text-slate-800',
    CANCELLED: 'bg-red-100 text-red-700',
  }[status] ?? 'bg-gray-100 text-gray-600'
}

function inboundStatusClass(status) {
  return {
    READY_TO_SHIP: 'bg-slate-100 text-slate-700',
    IN_TRANSIT: 'bg-blue-100 text-blue-700',
    ARRIVED: 'bg-amber-100 text-amber-700',
    RECEIVED: 'bg-[#EBF5F5] text-black',
  }[status] ?? 'bg-gray-100 text-gray-600'
}

function historyDotClass(status) {
  return {
    READY_TO_SHIP: 'bg-slate-500',
    IN_TRANSIT: 'bg-blue-500',
    ARRIVED: 'bg-amber-500',
    RECEIVED: 'bg-emerald-500',
  }[status] ?? 'bg-gray-400'
}

function historyTextClass(status) {
  return {
    READY_TO_SHIP: 'text-slate-700',
    IN_TRANSIT: 'text-blue-700',
    ARRIVED: 'text-amber-700',
    RECEIVED: 'text-emerald-700',
  }[status] ?? 'text-gray-700'
}

function shouldHighlightHistory(history) {
  return highlightedInboundHistoryKey.value === `${history.status}-${history.at}`
}

function historyGlowStyle(status) {
  const glowMap = {
    READY_TO_SHIP: {
      '--timeline-glow-rgb': '51, 65, 85',
      '--timeline-glow-soft-rgb': '100, 116, 139',
    },
    IN_TRANSIT: {
      '--timeline-glow-rgb': '29, 78, 216',
      '--timeline-glow-soft-rgb': '96, 165, 250',
    },
    ARRIVED: {
      '--timeline-glow-rgb': '180, 83, 9',
      '--timeline-glow-soft-rgb': '251, 191, 36',
    },
    RECEIVED: {
      '--timeline-glow-rgb': '22, 101, 52',
      '--timeline-glow-soft-rgb': '74, 222, 128',
    },
  }

  return glowMap[status] ?? {
    '--timeline-glow-rgb': '75, 85, 99',
    '--timeline-glow-soft-rgb': '156, 163, 175',
  }
}

function openConfirmModal() {
  if (!canConfirmInbound.value) return
  showConfirmModal.value = true
}

function confirmInbound() {
  if (!selectedOrder.value) return
  const result = storeOrders.confirmInbound(selectedOrder.value.orderId, auth.user?.name)
  showConfirmModal.value = false

  if (!result.success) {
    toastMessage.value = result.message
    return
  }

  toastMessage.value = '매장 입고가 확정되어 재고에 반영되었습니다.'
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="inboundMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Inbound</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">입고 상세</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              발주 원문과 입고 진행 상태를 함께 확인하고, 배송 완료 상태에서만 입고를 최종 확정합니다.
            </p>
          </div>
          <button
            type="button"
            class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="router.push({ name: 'store-inbound-list' })"
          >
            목록으로
          </button>
        </div>
      </section>

      <section
        v-if="selectedOrder"
        class="border border-gray-300 bg-white shadow-sm"
      >
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 class="text-sm font-black text-gray-900">{{ selectedOrder.orderId }}</h2>
            <p class="mt-1 text-[11px] font-bold text-gray-400">
              {{ formatDateTime(selectedOrder.requestedAt) }} · {{ selectedOrder.storeName }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="selectedOrder.inboundStatus"
              class="inline-flex px-2 py-1 text-[10px] font-black"
              :class="inboundStatusClass(selectedOrder.inboundStatus)"
            >
              {{ storeOrders.inboundStatusLabelMap[selectedOrder.inboundStatus] }}
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-4 p-4">
          <section
            v-if="canConfirmInbound"
            class="border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">Inbound Check</p>
                <p class="mt-1 text-sm font-black text-amber-900">
                  실제 입고된 수량과 발주 수량을 먼저 확인한 뒤 입고 확정을 진행하세요.
                </p>
                <p class="mt-1 text-xs font-bold text-amber-700">
                  입고 확정 버튼을 누르면 확인된 수량이 매장 재고에 즉시 반영됩니다.
                </p>
              </div>
            </div>
          </section>

          <div class="grid gap-4 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
          <div class="flex flex-col gap-4">
            <section class="grid gap-3 sm:grid-cols-2">
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">요청자</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedOrder.requestedBy }}</p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">입고 확정자</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedOrder.inboundConfirmedBy || '-' }}</p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">총 입고 예정 수량</p>
                <p class="mt-1 text-sm font-black text-gray-900">
                  {{ selectedOrder.items.reduce((sum, item) => sum + item.expectedInboundQuantity, 0) }}개
                </p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">입고 완료일시</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ formatDateTime(selectedOrder.inboundCompletedAt) }}</p>
              </div>
            </section>

            <section class="min-w-0">
              <table class="w-full table-fixed border-collapse text-xs">
                <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th class="w-[18%] px-3 py-2.5 text-left font-black">품목코드</th>
                    <th class="w-[20%] px-2 py-2.5 text-left font-black">상품명</th>
                    <th class="w-[17%] px-2 py-2.5 text-left font-black">옵션</th>
                    <th class="w-[18%] px-2 py-2.5 text-left font-black">카테고리</th>
                    <th class="w-[10%] px-2 py-2.5 text-center font-black">현재고</th>
                    <th class="w-[12%] px-2 py-2.5 text-center font-black">발주수량</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in selectedOrder.items" :key="`${selectedOrder.orderId}-${item.skuId}`">
                    <td class="px-3 py-2.5 font-mono font-bold text-gray-500">{{ item.itemCode }}</td>
                    <td class="px-2 py-2.5">
                      <p class="truncate font-black text-gray-900">{{ item.productName }}</p>
                    </td>
                    <td class="px-2 py-2.5 font-bold text-gray-700">{{ item.color }} / {{ item.size }}</td>
                    <td class="px-2 py-2.5 font-bold text-gray-500">{{ item.mainCategory }} &gt; {{ item.subCategory }}</td>
                    <td class="px-2 py-2.5 text-center font-black text-gray-800">{{ item.currentStoreStock }}</td>
                    <td class="px-3 py-2.5 text-center font-black text-gray-900">{{ item.expectedInboundQuantity }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="border border-gray-200 bg-gray-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">발주 메모</p>
              <p class="mt-2 text-xs font-bold text-gray-700">{{ selectedOrder.memo || '메모 없음' }}</p>
            </section>
          </div>

          <div class="flex flex-col gap-4">
            <section class="w-full border border-blue-200 bg-blue-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">입고 정책</p>
              <p class="mt-2 text-xs font-black text-blue-700">
                입고 확정은 배송 완료 상태에서만 가능합니다. 이번 버전은 부분 입고 없이 발주 1건 전체를 한 번에 재고로 반영합니다.
              </p>
            </section>

            <section class="w-full">
              <p class="mb-2 text-[10px] font-black uppercase text-gray-400">입고 진행 이력</p>
              <ol class="ml-2 border border-gray-200 bg-white px-4 py-4">
                <li
                  v-for="(history, index) in selectedOrder.inboundStatusHistory"
                  :key="`${history.status}-${history.at}-${index}`"
                  class="relative pb-3 pl-5 last:pb-0"
                >
                  <span
                    class="absolute left-0 top-1 block h-2.5 w-2.5"
                    :class="[historyDotClass(history.status), shouldHighlightHistory(history) && 'timeline-highlight-glow-box']"
                    :style="shouldHighlightHistory(history) ? historyGlowStyle(history.status) : undefined"
                  />
                  <span
                    v-if="index < selectedOrder.inboundStatusHistory.length - 1"
                    class="absolute bottom-0 left-[4px] top-3.5 w-px bg-gray-300"
                  />
                  <p
                    class="text-[11px] font-black"
                    :class="[historyTextClass(history.status), shouldHighlightHistory(history) && 'timeline-highlight-glow']"
                    :style="shouldHighlightHistory(history) ? historyGlowStyle(history.status) : undefined"
                  >
                    {{ storeOrders.inboundStatusLabelMap[history.status] ?? history.status }}
                  </p>
                  <p class="text-[10px] text-gray-500">
                    {{ formatDateTime(history.at) }} · {{ history.byName }}
                  </p>
                  <p v-if="history.note" class="text-[10px] text-gray-400">{{ history.note }}</p>
                </li>
              </ol>
            </section>

            <div class="w-full space-y-3">
              <template v-if="canConfirmInbound">
                <button
                  type="button"
                  class="w-full border border-[#004D3C] bg-[#004D3C] px-3 py-2.5 text-[11px] font-black text-white hover:bg-[#003d30]"
                  @click="openConfirmModal"
                >
                  입고 확정
                </button>
              </template>
              <template v-else>
                <p class="border border-gray-200 bg-gray-50 px-3 py-3 text-center text-xs font-bold text-gray-500">
                  {{
                    selectedOrder.status === 'COMPLETED'
                      ? '입고까지 완료된 종료 발주입니다.'
                      : '배송 완료 상태에서만 입고 확정이 가능합니다.'
                  }}
                </p>
              </template>

              <p
                v-if="toastMessage"
                class="border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700"
              >
                {{ toastMessage }}
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section
        v-else
        class="border border-gray-300 bg-white px-6 py-16 text-center text-sm font-bold text-gray-400 shadow-sm"
      >
        입고 상세 정보를 찾을 수 없습니다.
      </section>

      <div
        v-if="showConfirmModal && selectedOrder"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showConfirmModal = false"
      >
        <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
          <div class="bg-[#004D3C] px-5 py-3 text-white">
            <h2 class="text-sm font-black">입고 확정</h2>
          </div>
          <div class="space-y-3 p-5 text-xs text-gray-700">
            <p>
              <strong>{{ selectedOrder.orderId }}</strong> 발주건을 매장 재고에 반영합니다.
            </p>
            <p>
              입고 예정 수량
              <strong>{{ selectedOrder.items.reduce((sum, item) => sum + item.expectedInboundQuantity, 0) }}개</strong>가
              한 번에 반영됩니다.
            </p>
            <p class="text-gray-500">
              확정 후 입고 상태는 <strong>입고 완료</strong>로 변경되며 다시 되돌릴 수 없습니다.
            </p>
          </div>
          <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
            <button
              type="button"
              class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
              @click="showConfirmModal = false"
            >
              취소
            </button>
            <button
              type="button"
              class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#003d30]"
              @click="confirmInbound"
            >
              입고 확정
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
@keyframes timelineGlowBlink {
  0%,
  100% {
    opacity: 1;
    text-shadow: 0 0 0 rgba(var(--timeline-glow-rgb), 0);
  }

  20%,
  70% {
    opacity: 0.78;
    text-shadow:
      0 0 12px rgba(var(--timeline-glow-rgb), 0.58),
      0 0 24px rgba(var(--timeline-glow-soft-rgb), 0.32);
  }

  35%,
  85% {
    opacity: 1;
    text-shadow:
      0 0 18px rgba(var(--timeline-glow-rgb), 0.8),
      0 0 32px rgba(var(--timeline-glow-soft-rgb), 0.42);
  }
}

.timeline-highlight-glow {
  animation: timelineGlowBlink 3s ease-in-out 1;
}

@keyframes timelineBoxBlink {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
    box-shadow: 0 0 0 rgba(var(--timeline-glow-rgb), 0);
  }

  20%,
  70% {
    opacity: 0.86;
    transform: scale(1.14);
    box-shadow:
      0 0 12px rgba(var(--timeline-glow-rgb), 0.58),
      0 0 20px rgba(var(--timeline-glow-soft-rgb), 0.3);
  }

  35%,
  85% {
    opacity: 1;
    transform: scale(1.2);
    box-shadow:
      0 0 18px rgba(var(--timeline-glow-rgb), 0.82),
      0 0 30px rgba(var(--timeline-glow-soft-rgb), 0.44);
  }
}

.timeline-highlight-glow-box {
  animation: timelineBoxBlink 3s ease-in-out 1;
}
</style>

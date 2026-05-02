<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useStoreOrderStore } from '@/stores/store/storeOrder.js'
import { formatDateTime, storeInboundStatusClass, storeOrderStatusClass } from '@/features/store/common/ui.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const storeOrders = useStoreOrderStore()

const storeMenus = roleMenus.store
const orderMenus = roleMenus.store.find((menu) => menu.label === '발주 관리')?.children ?? []
const activeTopMenu = computed(() => '발주 관리')
const activeSideMenu = ref('발주 내역')

const showCancelConfirm = ref(false)
const cancelReason = ref('')
const toastMessage = ref('')

const orderId = computed(() => String(route.params.id ?? ''))
const selectedOrder = computed(() => storeOrders.getOrderById(orderId.value))

function statusClass(status) {
  return storeOrderStatusClass(status)
}

function inboundStatusClass(status) {
  return storeInboundStatusClass(status)
}

function historyDotClass(status) {
  return {
    REQUESTED: 'bg-amber-500',
    APPROVED: 'bg-emerald-500',
    COMPLETED: 'bg-slate-700',
    CANCELLED: 'bg-red-600',
  }[status] ?? 'bg-gray-400'
}

function historyTextClass(status) {
  return {
    REQUESTED: 'text-amber-700',
    APPROVED: 'text-emerald-700',
    COMPLETED: 'text-slate-800',
    CANCELLED: 'text-red-700',
  }[status] ?? 'text-gray-700'
}

function openCancelConfirm() {
  if (!selectedOrder.value || selectedOrder.value.status !== 'REQUESTED') return
  cancelReason.value = ''
  showCancelConfirm.value = true
}

function confirmCancelOrder() {
  if (!selectedOrder.value) return
  const result = storeOrders.cancelOrder(
    selectedOrder.value.orderId,
    cancelReason.value,
    auth.user?.name,
  )
  showCancelConfirm.value = false
  if (!result.success) {
    toastMessage.value = result.message
    return
  }
  toastMessage.value = '발주 요청이 취소되었습니다.'
}

function goEditPage() {
  if (!selectedOrder.value || selectedOrder.value.status !== 'REQUESTED') return
  router.push({ name: 'store-order-edit', params: { id: selectedOrder.value.orderId } })
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
    :side-menus="orderMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Orders</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">발주 상세</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              발주건 상세와 입고 진행 상태를 함께 확인하고, 승인 대기 상태에서만 수정 또는 취소할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="router.push({ name: 'store-order-history' })"
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
            <span class="inline-flex px-2 py-1 text-[10px] font-black" :class="statusClass(selectedOrder.status)">
              {{ storeOrders.statusLabelMap[selectedOrder.status] }}
            </span>
            <span
              v-if="selectedOrder.inboundStatus"
              class="inline-flex px-2 py-1 text-[10px] font-black"
              :class="inboundStatusClass(selectedOrder.inboundStatus)"
            >
              {{ storeOrders.inboundStatusLabelMap[selectedOrder.inboundStatus] }}
            </span>
          </div>
        </div>

        <div class="grid gap-4 p-4 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
          <div class="flex flex-col gap-4">
            <section class="grid gap-3 sm:grid-cols-2">
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">요청자</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedOrder.requestedBy }}</p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">총 요청 수량</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedOrder.totalRequestedQuantity }}개</p>
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
                    <th class="w-[10%] px-2 py-2.5 text-center font-black">실재고</th>
                    <th class="w-[10%] px-2 py-2.5 text-center font-black">가용재고</th>
                    <th class="w-[10%] px-2 py-2.5 text-center font-black">안전재고</th>
                    <th class="w-[10%] px-2 py-2.5 text-center font-black">요청</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in selectedOrder.items" :key="`${selectedOrder.orderId}-${item.skuId}`">
                    <td class="px-3 py-2.5 font-mono font-bold text-gray-500">{{ item.itemCode }}</td>
                    <td class="px-2 py-2.5">
                      <p class="truncate font-black text-gray-900">{{ item.productName }}</p>
                    </td>
                    <td class="px-2 py-2.5 font-bold text-gray-700">{{ item.color }} / {{ item.size }}</td>
                    <td class="px-2 py-2.5 font-bold text-gray-500">
                      {{ item.mainCategory }} &gt; {{ item.subCategory }}
                    </td>
                    <td class="px-2 py-2.5 text-center font-black text-gray-800">{{ item.currentStoreStock }}</td>
                    <td class="px-2 py-2.5 text-center font-black text-gray-900">{{ item.availableStoreStock }}</td>
                    <td class="px-2 py-2.5 text-center font-black text-gray-700">{{ item.safetyStock }}</td>
                    <td class="px-3 py-2.5 text-center font-black text-gray-900">{{ item.requestedQuantity }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="border border-gray-200 bg-gray-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">요청 메모</p>
              <p class="mt-2 text-xs font-bold text-gray-700">{{ selectedOrder.memo || '메모 없음' }}</p>
            </section>

            <section v-if="selectedOrder.cancelReason" class="border border-red-200 bg-red-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-red-400">취소 사유</p>
              <p class="mt-2 text-xs font-bold text-red-700">{{ selectedOrder.cancelReason }}</p>
            </section>
          </div>

          <div class="flex flex-col gap-4">
            <section class="w-full border border-blue-200 bg-blue-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">정책 안내</p>
              <p class="mt-2 text-xs font-black text-blue-700">
                가용재고는 실재고 + 입고예정 수량 기준입니다. 요청된 발주는 익일 12시 배치 승인 대상으로 안내합니다.
              </p>
            </section>

            <section class="w-full">
              <p class="mb-2 text-[10px] font-black uppercase text-gray-400">진행 이력</p>
              <ol class="ml-2 border border-gray-200 bg-white px-4 py-4">
                <li
                  v-for="(history, index) in selectedOrder.statusHistory"
                  :key="`${history.status}-${history.at}-${index}`"
                  class="relative pb-3 pl-5 last:pb-0"
                >
                  <span class="absolute left-0 top-1 block h-2.5 w-2.5" :class="historyDotClass(history.status)" />
                  <span
                    v-if="index < selectedOrder.statusHistory.length - 1"
                    class="absolute bottom-0 left-[4px] top-3.5 w-px bg-gray-300"
                  />
                  <p class="text-[11px] font-black" :class="historyTextClass(history.status)">
                    {{ storeOrders.statusLabelMap[history.status] ?? history.status }}
                  </p>
                  <p class="text-[10px] text-gray-500">
                    {{ formatDateTime(history.at) }} · {{ history.byName }}
                  </p>
                  <p v-if="history.note" class="text-[10px] text-gray-400">{{ history.note }}</p>
                </li>
              </ol>
            </section>

            <div class="w-full space-y-3">
              <template v-if="selectedOrder.status === 'REQUESTED'">
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="border border-gray-400 bg-white px-2 py-2.5 text-[11px] font-black text-gray-700 hover:bg-gray-50"
                    @click="goEditPage"
                  >
                    발주 수정
                  </button>
                  <button
                    type="button"
                    class="border border-red-500 bg-red-50 px-2 py-2.5 text-[11px] font-black text-red-700 hover:bg-red-100"
                    @click="openCancelConfirm"
                  >
                    발주 취소
                  </button>
                </div>
              </template>
              <template v-else>
                <p class="border border-gray-200 bg-gray-50 px-3 py-3 text-center text-xs font-bold text-gray-500">
                  {{
                    selectedOrder.status === 'APPROVED'
                      ? '승인 완료 후 입고 진행 중인 발주입니다.'
                      : selectedOrder.status === 'COMPLETED'
                        ? '입고까지 완료된 종료 발주입니다.'
                        : '취소된 발주입니다.'
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
      </section>

      <section
        v-else
        class="border border-gray-300 bg-white px-6 py-16 text-center text-sm font-bold text-gray-400 shadow-sm"
      >
        발주 상세 정보를 찾을 수 없습니다.
      </section>

      <div
        v-if="showCancelConfirm && selectedOrder"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showCancelConfirm = false"
      >
        <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
          <div class="bg-red-700 px-5 py-3 text-white">
            <h2 class="text-sm font-black">발주 요청 취소</h2>
          </div>
          <div class="space-y-3 p-5 text-xs text-gray-700">
            <p>
              <strong>{{ selectedOrder.orderId }}</strong> 발주 요청을 취소합니다.
            </p>
            <textarea
              v-model="cancelReason"
              rows="3"
              maxlength="500"
              placeholder="발주 취소 사유 입력 (예: 중복 요청, 행사 계획 변경)"
              class="w-full resize-none border border-gray-300 px-2 py-1.5 text-xs outline-none focus:border-red-500"
            />
          </div>
          <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
            <button
              type="button"
              class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
              @click="showCancelConfirm = false"
            >
              닫기
            </button>
            <button
              type="button"
              class="border border-red-700 bg-red-700 px-4 py-2 text-xs font-black text-white hover:bg-red-600"
              @click="confirmCancelOrder"
            >
              취소 확정
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

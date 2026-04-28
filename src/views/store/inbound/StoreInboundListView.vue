<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useStoreOrdersStore } from '@/stores/storeOrders.js'

const router = useRouter()
const auth = useAuthStore()
const storeOrders = useStoreOrdersStore()

const storeMenus = roleMenus.store
const inboundMenus = roleMenus.store.find((menu) => menu.label === '입고 관리')?.children ?? []
const activeTopMenu = computed(() => '입고 관리')
const activeSideMenu = ref('입고 리스트')

if (
  !['전체', 'READY_TO_SHIP', 'IN_TRANSIT', 'ARRIVED', 'RECEIVED'].includes(
    storeOrders.inboundActiveStatusTab,
  )
) {
  storeOrders.inboundActiveStatusTab = '전체'
}

const STATUS_TABS = [
  { label: '전체', key: '전체' },
  { label: '배송 준비중', key: 'READY_TO_SHIP' },
  { label: '배송 중', key: 'IN_TRANSIT' },
  { label: '배송 완료', key: 'ARRIVED' },
  { label: '입고 완료', key: 'RECEIVED' },
]

const arrivedOrders = computed(() =>
  storeOrders.inboundListOrders.filter(
    (order) => order.inboundStatus === 'ARRIVED' && order.status === 'APPROVED',
  ),
)
const arrivedOrderCount = computed(() => arrivedOrders.value.length)

function formatDateTime(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDate(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function headlineLabel(order) {
  if (!order || order.items.length === 0) return '-'
  return order.items.length > 1
    ? `${order.items[0].productName} 외 ${order.items.length - 1}건`
    : order.items[0].productName
}

function inboundStatusClass(status) {
  return (
    {
      READY_TO_SHIP: 'bg-slate-100 text-slate-700',
      IN_TRANSIT: 'bg-blue-100 text-blue-700',
      ARRIVED: 'bg-amber-100 text-amber-700',
      RECEIVED: 'bg-[#EBF5F5] text-black',
    }[status] ?? 'bg-gray-100 text-gray-600'
  )
}

function inboundActionLabel(order) {
  if (order.inboundStatus === 'READY_TO_SHIP' || order.inboundStatus === 'IN_TRANSIT') return '대기'
  if (order.inboundStatus === 'RECEIVED' || order.status === 'COMPLETED') return '처리 완료'
  return '-'
}

function canHandleInbound(order) {
  return order.inboundStatus === 'ARRIVED' && order.status === 'APPROVED'
}

function changeTab(key) {
  storeOrders.inboundActiveStatusTab = key
}

function focusArrivedOrders() {
  storeOrders.inboundActiveStatusTab = 'ARRIVED'
}

function goToInboundDetail(orderId) {
  router.push({ name: 'store-inbound-detail', params: { id: orderId } })
}

function goToFirstArrivedOrder() {
  const firstOrder = arrivedOrders.value[0]
  if (!firstOrder) return
  goToInboundDetail(firstOrder.orderId)
}

function handleRowClick(orderId) {
  goToInboundDetail(orderId)
}

function handleActionClick(event, orderId) {
  event.stopPropagation()
  goToInboundDetail(orderId)
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
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Store Inbound
            </p>
            <h1 class="mt-1 text-lg font-black text-gray-900">입고 리스트</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              승인 완료된 발주의 입고 진행 현황과 입고 완료 내역을 한 화면에서 확인합니다.
            </p>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>입고 전체 {{ storeOrders.inboundStatusCounts.전체 }}건</p>
            <p class="mt-1 text-gray-400">
              입고 완료 {{ storeOrders.inboundSummary.receivedCount }}건
            </p>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white p-3 shadow-sm">
        <div class="flex flex-wrap gap-1">
          <button
            v-for="tab in STATUS_TABS"
            :key="tab.key"
            type="button"
            class="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-black transition-colors"
            :class="
              storeOrders.inboundActiveStatusTab === tab.key
                ? 'border-[#004D3C] bg-[#004D3C] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="changeTab(tab.key)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="min-w-[18px] px-1 py-0.5 text-center text-[10px]"
              :class="
                storeOrders.inboundActiveStatusTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              {{ storeOrders.inboundStatusCounts[tab.key] }}
            </span>
          </button>
        </div>
      </section>

      <section
        v-if="arrivedOrderCount > 0"
        class="border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">
              Inbound Action
            </p>
            <p class="mt-1 text-sm font-black text-amber-900">
              입고 확정이 필요한 발주가 {{ arrivedOrderCount }}건 있습니다.
            </p>
            <p class="mt-1 text-xs font-bold text-amber-700">
              배송 완료 상태의 발주는 매장 재고 반영 전 단계입니다. 상세로 들어가 입고 확정을
              진행하세요.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100"
              @click="focusArrivedOrders"
            >
              배송 완료만 보기
            </button>
            <button
              type="button"
              class="border border-amber-700 bg-amber-700 px-3 py-2 text-xs font-black text-white hover:bg-amber-800"
              @click="goToFirstArrivedOrder"
            >
              첫 발주 바로 처리
            </button>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2"
        >
          <span class="text-xs font-bold text-gray-600"
            >총 {{ storeOrders.filteredInboundList.length }}건</span
          >
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="storeOrders.inboundSearchKeyword"
              type="search"
              placeholder="발주번호, 상품명, 카테고리"
              class="w-64 border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-[#004D3C]"
            />
          </div>
        </div>

        <div
          class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2"
        >
          <input
            v-model="storeOrders.inboundDateFrom"
            type="date"
            class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
          />
          <span class="text-xs text-gray-400">~</span>
          <input
            v-model="storeOrders.inboundDateTo"
            type="date"
            class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
          />
          <select
            v-model="storeOrders.inboundSortBy"
            class="ml-auto border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="qtyDesc">수량 많은순</option>
            <option value="qtyAsc">수량 적은순</option>
          </select>
        </div>

        <div class="min-w-0">
          <table class="w-full table-fixed border-collapse text-xs">
            <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th class="w-[14%] px-3 py-2 text-left font-black">발주일시</th>
                <th class="w-[16%] px-2 py-2 text-left font-black">발주번호</th>
                <th class="w-[22%] px-2 py-2 text-left font-black">대표 상품명</th>
                <th class="w-[8%] px-2 py-2 text-center font-black">총 SKU</th>
                <th class="w-[10%] px-2 py-2 text-center font-black">입고 수량</th>
                <th class="w-[12%] px-2 py-2 text-center font-black">입고 상태</th>
                <th class="w-[10%] px-2 py-2 text-center font-black">입고 예정일</th>
                <th class="w-[14%] px-2 py-2 text-center font-black">입고 확정 처리</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="order in storeOrders.filteredInboundList"
                :key="order.orderId"
                class="cursor-pointer transition-colors hover:bg-gray-50"
                @click="handleRowClick(order.orderId)"
              >
                <td class="px-3 py-2.5 font-bold text-gray-600">
                  {{ formatDateTime(order.requestedAt) }}
                </td>
                <td class="px-2 py-2.5 font-mono font-black text-gray-800">{{ order.orderId }}</td>
                <td class="px-2 py-2.5 font-black text-gray-900">
                  <p class="truncate">{{ headlineLabel(order) }}</p>
                </td>
                <td class="px-2 py-2.5 text-center font-black text-gray-700">
                  {{ order.totalSkuCount }}
                </td>
                <td class="px-2 py-2.5 text-center font-black text-gray-900">
                  {{ order.items.reduce((sum, item) => sum + item.expectedInboundQuantity, 0) }}
                </td>
                <td class="px-2 py-2.5 text-center">
                  <span
                    class="inline-flex px-2 py-1 text-[10px] font-black"
                    :class="inboundStatusClass(order.inboundStatus)"
                  >
                    {{ storeOrders.inboundStatusLabelMap[order.inboundStatus] }}
                  </span>
                </td>
                <td class="px-2 py-2.5 text-center font-bold text-gray-700">
                  {{ formatDate(order.inboundExpectedAt) }}
                </td>
                <td class="px-2 py-2.5 text-center">
                  <button
                    v-if="canHandleInbound(order)"
                    type="button"
                    class="inline-flex items-center gap-1 rounded-lg border border-[#B9D8D1] bg-[#F3FAF8] px-3 py-1.5 text-[10px] font-black text-[#0F4C3F] shadow-[0_1px_2px_rgba(15,76,63,0.06)] transition-all hover:-translate-y-px hover:border-[#8FC2B6] hover:bg-[#E8F5F1] hover:shadow-[0_6px_16px_rgba(15,76,63,0.12)]"
                    @click="handleActionClick($event, order.orderId)"
                  >
                    <span>입고 확정하기</span>
                    <span aria-hidden="true" class="text-[11px] leading-none">→</span>
                  </button>
                  <span
                    v-else
                    class="text-[11px] font-black"
                    :class="
                      order.inboundStatus === 'RECEIVED' || order.status === 'COMPLETED'
                        ? 'text-gray-500'
                        : 'text-gray-400'
                    "
                  >
                    {{ inboundActionLabel(order) }}
                  </span>
                </td>
              </tr>
              <tr v-if="storeOrders.filteredInboundList.length === 0">
                <td colspan="8" class="px-4 py-12 text-center text-gray-400">
                  조회 가능한 입고 내역이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

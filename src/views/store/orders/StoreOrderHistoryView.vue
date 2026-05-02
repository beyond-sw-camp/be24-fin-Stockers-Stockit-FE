<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useStoreOrderStore } from '@/stores/storeOrder.js'

const router = useRouter()
const auth = useAuthStore()
const storeOrders = useStoreOrderStore()

const storeMenus = roleMenus.store
const orderMenus = roleMenus.store.find((menu) => menu.label === '발주 관리')?.children ?? []
const activeTopMenu = computed(() => '발주 관리')
const activeSideMenu = ref('발주 내역')

const STATUS_TABS = [
  { label: '전체', key: '전체' },
  { label: '승인 대기', key: 'REQUESTED' },
  { label: '승인 완료', key: 'APPROVED' },
  { label: '완료', key: 'COMPLETED' },
  { label: '취소', key: 'CANCELLED' },
]

function formatDateTime(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function headlineLabel(order) {
  if (!order || order.items.length === 0) return '-'
  return order.items.length > 1
    ? `${order.items[0].productName} 외 ${order.items.length - 1}건`
    : order.items[0].productName
}

function statusClass(status) {
  return {
    REQUESTED: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-[#EBF5F5] text-black',
    COMPLETED: 'bg-slate-200 text-slate-800',
    CANCELLED: 'bg-red-100 text-red-700',
  }[status] ?? 'bg-gray-100 text-gray-600'
}

function changeTab(key) {
  storeOrders.activeStatusTab = key
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
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Orders</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">발주 내역</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              발주건 목록을 먼저 확인하고, 원하는 발주건을 눌러 상세 페이지로 이동합니다.
            </p>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>전체 {{ storeOrders.summary.totalOrders }}건</p>
            <p class="mt-1 text-gray-400">누적 요청 수량 {{ storeOrders.summary.totalRequestedQuantity }}개</p>
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
              storeOrders.activeStatusTab === tab.key
                ? 'border-[#004D3C] bg-[#004D3C] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="changeTab(tab.key)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="min-w-[18px] px-1 py-0.5 text-center text-[10px]"
              :class="
                storeOrders.activeStatusTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              {{ storeOrders.statusCounts[tab.key] }}
            </span>
          </button>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <span class="text-xs font-bold text-gray-600">총 {{ storeOrders.filteredOrders.length }}건</span>
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="storeOrders.searchKeyword"
              type="search"
              placeholder="발주번호, 상품명, 카테고리"
              class="w-60 border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-[#004D3C]"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <input
            v-model="storeOrders.dateFrom"
            type="date"
            class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
          />
          <span class="text-xs text-gray-400">~</span>
          <input
            v-model="storeOrders.dateTo"
            type="date"
            class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
          />
          <select
            v-model="storeOrders.sortBy"
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
                <th class="w-[20%] px-2 py-2 text-left font-black">요청일시</th>
                <th class="w-[18%] px-2 py-2 text-left font-black">발주번호</th>
                <th class="w-[30%] px-2 py-2 text-left font-black">대표 상품명</th>
                <th class="w-[10%] px-2 py-2 text-right font-black">총 SKU</th>
                <th class="w-[12%] px-2 py-2 text-right font-black">총요청</th>
                <th class="w-[10%] px-2 py-2 text-center font-black">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="order in storeOrders.filteredOrders"
                :key="order.orderId"
                class="cursor-pointer transition-colors hover:bg-gray-50"
                @click="router.push({ name: 'store-order-detail', params: { id: order.orderId } })"
              >
                <td class="px-2 py-2.5 font-bold text-gray-600">{{ formatDateTime(order.requestedAt) }}</td>
                <td class="px-2 py-2.5 font-mono font-black text-gray-800">{{ order.orderId }}</td>
                <td class="px-2 py-2.5 font-black text-gray-900">
                  <p class="truncate">{{ headlineLabel(order) }}</p>
                </td>
                <td class="px-2 py-2.5 text-right font-black text-gray-700">{{ order.totalSkuCount }}</td>
                <td class="px-2 py-2.5 text-right font-black text-gray-900">{{ order.totalRequestedQuantity }}</td>
                <td class="px-2 py-2.5 text-center">
                  <span class="inline-flex px-2 py-1 text-[10px] font-black" :class="statusClass(order.status)">
                    {{ storeOrders.statusLabelMap[order.status] }}
                  </span>
                </td>
              </tr>
              <tr v-if="storeOrders.filteredOrders.length === 0">
                <td colspan="6" class="px-4 py-12 text-center text-gray-400">조회 가능한 발주 내역이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

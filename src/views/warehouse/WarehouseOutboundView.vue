<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useWarehouseOutboundStore } from '@/stores/warehouse/warehouseOutbound.js'

const router = useRouter()
const auth = useAuthStore()
const outboundStore = useWarehouseOutboundStore()

const activeSideMenu = ref('출고 관리')
const topMenus = roleMenus.warehouse
const sideMenus = roleMenus.warehouse.find((menu) => menu.label === '입/출고 관리')?.children ?? []

const STATUS_TABS = [
  { key: '전체', label: '전체' },
  { key: 'READY_TO_SHIP', label: '출고 준비중' },
  { key: 'IN_TRANSIT', label: '배송중' },
  { key: 'COMPLETED', label: '완료' },
]
const TYPE_OPTIONS = [
  { value: '전체', label: '전체 유형' },
  { value: 'STORE_OUTBOUND', label: '매장 출고' },
  { value: 'WH_TRANSFER', label: '창고간 이동' },
  { value: 'CIRCULAR_SALE', label: '순환재고 판매' },
]
const PERIOD_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'DAY', label: '일' },
  { key: 'MONTH', label: '월' },
  { key: 'YEAR', label: '년' },
]

const activePeriod = ref('ALL')

const rows = computed(() => outboundStore.filteredOutboundList)

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function changeTab(key) {
  outboundStore.activeStatusTab = key
}

function openDetail(outboundId) {
  router.push({ name: 'wh-outbound-detail', params: { id: outboundId } })
}

function statusClass(status) {
  return (
    {
      READY_TO_SHIP: 'bg-amber-50 text-amber-700',
      IN_TRANSIT: 'bg-blue-50 text-blue-700',
      COMPLETED: 'bg-emerald-50 text-emerald-700',
    }[status] ?? 'bg-gray-100 text-gray-600'
  )
}

function formatDate(iso) {
  if (!iso) return '-'
  return iso.replace('T', ' ').slice(0, 16)
}

function toYmd(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function applyPeriod(periodKey) {
  const now = new Date()
  let fromDate = new Date(now)

  if (periodKey === 'ALL') {
    activePeriod.value = periodKey
    outboundStore.dateFrom = ''
    outboundStore.dateTo = ''
    return
  }

  if (periodKey === 'MONTH') {
    fromDate.setMonth(now.getMonth() - 1)
  } else if (periodKey === 'YEAR') {
    fromDate.setFullYear(now.getFullYear() - 1)
  }

  activePeriod.value = periodKey
  outboundStore.dateFrom = toYmd(fromDate)
  outboundStore.dateTo = toYmd(now)
}

applyPeriod('ALL')
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
      <section class="border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 p-5 shadow-sm">
        <p class="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Warehouse Outbound</p>
        <h1 class="mt-1 text-xl font-black text-slate-900">출고 리스트</h1>
        <p class="mt-1 text-sm font-semibold text-slate-600">매장 출고, 창고간 이동, 순환재고 판매 출고를 통합 관리합니다.</p>
      </section>

      <section class="border border-slate-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex flex-col gap-3 pb-1 lg:flex-row lg:items-start lg:justify-between">
          <div class="grid gap-1 lg:grid-cols-[66px_1fr] lg:items-center">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">출고 상태</p>
            <div class="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1">
              <button
                v-for="tab in STATUS_TABS"
                :key="tab.key"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black transition-colors"
                :class="outboundStore.activeStatusTab === tab.key
                  ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                  : 'border-transparent bg-white text-slate-600 hover:bg-slate-50'"
                @click="changeTab(tab.key)"
              >
                <span>{{ tab.label }}</span>
                <span
                  class="min-w-[20px] rounded-md px-1.5 py-0.5 text-center text-[10px]"
                  :class="outboundStore.activeStatusTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'"
                >
                  {{ outboundStore.statusCounts[tab.key] }}
                </span>
              </button>
            </div>
          </div>
          <div class="grid gap-1 lg:grid-cols-[66px_1fr] lg:items-center">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">출고 유형</p>
            <select
              v-model="outboundStore.activeTypeTab"
              class="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-emerald-700"
            >
              <option
                v-for="option in TYPE_OPTIONS"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <section class="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
          <div class="inline-flex overflow-hidden rounded-xl border border-slate-300 bg-white">
            <button
              v-for="period in PERIOD_TABS"
              :key="period.key"
              type="button"
              class="px-3 py-2 text-xs font-extrabold transition-colors"
              :class="activePeriod === period.key
                ? 'bg-emerald-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'"
              @click="applyPeriod(period.key)"
            >
              {{ period.label }}
            </button>
          </div>
          <input
            v-model="outboundStore.dateFrom"
            type="date"
            class="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700"
          />
          <span class="text-xs font-bold text-slate-400">~</span>
          <input
            v-model="outboundStore.dateTo"
            type="date"
            class="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700"
          />
          <input
            v-model="outboundStore.searchKeyword"
            type="text"
            placeholder="출고번호/발주번호/출고처/목적지/대표상품 검색"
            class="h-9 min-w-[260px] flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700 lg:ml-auto lg:max-w-[420px]"
          />
        </div>

        <div class="overflow-auto">
          <table class="w-full table-fixed border-collapse text-xs">
            <thead class="bg-slate-100/90 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th class="w-[16%] px-4 py-3 text-left font-black">출고번호</th>
                <th class="w-[12%] px-4 py-3 text-left font-black">발주번호</th>
                <th class="w-[11%] px-4 py-3 text-left font-black">유형</th>
                <th class="w-[15%] px-4 py-3 text-left font-black">도착 매장/물류창고</th>
                <th class="w-[20%] px-4 py-3 text-left font-black">대표 상품</th>
                <th class="w-[8%] px-4 py-3 text-right font-black">총 수량</th>
                <th class="w-[8%] px-4 py-3 text-center font-black">상태</th>
                <th class="w-[10%] px-4 py-3 text-left font-black">요청일시</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="row in rows"
                :key="row.outboundId"
                class="cursor-pointer transition-colors hover:bg-emerald-50/40"
                @click="openDetail(row.outboundId)"
              >
                <td class="whitespace-nowrap px-4 py-3 font-bold text-slate-500">{{ row.outboundId }}</td>
                <td class="px-4 py-3 font-black text-slate-900">{{ row.orderId }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                    {{ outboundStore.outboundTypeLabelMap[row.outboundType] }}
                  </span>
                </td>
                <td class="px-4 py-3 font-bold text-slate-700">{{ row.targetName }}</td>
                <td class="truncate px-4 py-3 font-bold text-slate-700">
                  <template v-if="row.totalSkuCount > 1">
                    {{ row.headlineProduct }} 외 {{ row.totalSkuCount - 1 }}건
                  </template>
                  <template v-else>
                    {{ row.headlineProduct }}
                  </template>
                </td>
                <td class="px-4 py-3 text-right font-black text-slate-700">{{ row.totalRequestedQuantity }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-flex rounded-md px-2.5 py-1 text-[10px] font-black" :class="statusClass(row.status)">
                    {{ outboundStore.outboundStatusLabelMap[row.status] }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-3 font-bold text-slate-500">{{ formatDate(row.requestedAt) }}</td>
              </tr>
              <tr v-if="rows.length === 0">
                <td colspan="8" class="px-4 py-14 text-center text-sm font-semibold text-slate-400">
                  조건에 맞는 출고 리스트가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

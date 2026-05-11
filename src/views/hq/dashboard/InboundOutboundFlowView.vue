<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRightLeft,
  Clock3,
  PackageCheck,
  Truck,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { extractErrorMessage } from '@/api/axios.js'
import { getWarehouseTransfers } from '@/api/hq/inventory.js'
import { purchaseOrderApi } from '@/api/hq/purchaseOrder.js'
import { roleMenus } from '@/config/roleMenus.js'
import { dashboardSideMenus } from '@/views/hq/dashboard/dashboardMenus.js'
import { buildPurchaseRows, flattenTransferLines, getDefaultDateRange, toUiTransferStatus } from '@/views/hq/dashboard/dashboardData.js'

const router = useRouter()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('입출고 흐름')
const sideMenus = dashboardSideMenus

const flowStats = ref([])
const inboundQueues = ref([])
const outboundQueues = ref([])
const centerFlows = ref([])
const liveLogs = ref([])
const loading = ref(false)
const loadError = ref('')

const activeTopMenu = computed(() => '대시보드')
const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)


function goToAllFlowTransactions() {
  router.push('/hq/dashboard/flow/all')
}

const fetchFlowData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const { fromDate, toDate } = getDefaultDateRange(30)
    const [transfers, purchaseOrders] = await Promise.all([
      getWarehouseTransfers({ fromDate, toDate }),
      purchaseOrderApi.list({ from: fromDate, to: toDate }),
    ])
    const transferRows = Array.isArray(transfers) ? transfers : []
    const purchaseRows = Array.isArray(purchaseOrders) ? purchaseOrders : []

    const pendingInboundCount = purchaseRows.filter((row) => ['APPROVED', 'SHIPPING'].includes(String(row.status))).length
    const inProgressTransferCount = transferRows.filter((row) => String(row.status) === 'IN_PROGRESS').length
    const completedTransferCount = transferRows.filter((row) => String(row.status) === 'COMPLETED').length

    flowStats.value = [
      { label: '금일 입고 예정', value: `${pendingInboundCount}`, unit: '건' },
      { label: '금일 출고 예정', value: `${inProgressTransferCount}`, unit: '건' },
      { label: '이동 지시 진행중', value: `${inProgressTransferCount}`, unit: '건' },
      { label: '완료 처리 건수', value: `${completedTransferCount}`, unit: '건' },
    ]

    inboundQueues.value = purchaseRows.slice(0, 8).map((row) => ({
      center: row.warehouseName || '-',
      item: (row.productNames || [])[0] || '-',
      qty: `${Number(row.itemCount || 0).toLocaleString()} SKU`,
      eta: row.createdAt ? new Date(row.createdAt).toISOString().slice(11, 16) : '-',
      state: row.status === 'SHIPPING' ? '검수 진행' : row.status === 'APPROVED' ? '입고 대기' : '대기',
    }))

    outboundQueues.value = transferRows.slice(0, 8).map((row) => ({
      target: row.toWarehouseName || '-',
      item: `${Number(row.skuCount || 0).toLocaleString()} SKU`,
      qty: `${Number(row.totalQty || 0).toLocaleString()} EA`,
      depart: row.requestedAt ? new Date(row.requestedAt).toISOString().slice(11, 16) : '-',
      state: toUiTransferStatus(row.status),
    }))

    const centerMap = new Map()
    transferRows.forEach((row) => {
      const fromKey = row.fromWarehouseName || '-'
      const toKey = row.toWarehouseName || '-'
      const from = centerMap.get(fromKey) || { center: fromKey, inbound: 0, outbound: 0, transfer: 0, status: '정상' }
      const to = centerMap.get(toKey) || { center: toKey, inbound: 0, outbound: 0, transfer: 0, status: '정상' }
      from.outbound += 1
      from.transfer += Number(row.skuCount || 0)
      to.inbound += 1
      to.transfer += Number(row.skuCount || 0)
      centerMap.set(fromKey, from)
      centerMap.set(toKey, to)
    })
    centerFlows.value = Array.from(centerMap.values())
      .map((row) => ({
        ...row,
        status: row.outbound > row.inbound * 2 ? '주의' : row.transfer > 10 ? '혼잡' : '정상',
      }))
      .slice(0, 8)

    const transferLogs = flattenTransferLines(transferRows)
    const purchaseLogs = buildPurchaseRows(purchaseRows).map((row, idx) => ({
      id: `${row.id}-${idx + 1}`,
      type: '입고',
      location: row.location,
      item: row.item,
      qty: row.qty,
      status: row.status,
      time: row.time,
    }))
    liveLogs.value = [...transferLogs, ...purchaseLogs]
      .sort((a, b) => String(b.time).localeCompare(String(a.time)))
      .slice(0, 12)
  } catch (error) {
    loadError.value = extractErrorMessage(error, '입출고 흐름 데이터를 불러오지 못했습니다.')
    flowStats.value = []
    inboundQueues.value = []
    outboundQueues.value = []
    centerFlows.value = []
    liveLogs.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchFlowData()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
  >
    <div class="flex flex-col gap-3">
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <ArrowRightLeft :size="18" />
            입출고 흐름
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">기준: {{ dateLabel }}</span>
          <span class="inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
            <Clock3 :size="12" />
            물류 흐름 실시간
          </span>
        </div>

      </section>
      <p v-if="loadError" class="border border-red-100 bg-red-50 px-3 py-3 text-xs font-medium text-red-700">
        {{ loadError }}
      </p>
      <p v-else-if="loading" class="border border-gray-300 bg-white px-3 py-3 text-xs font-medium text-gray-500">
        입출고 흐름 데이터를 불러오는 중입니다.
      </p>

      <section class="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="stat in flowStats"
          :key="stat.label"
          class="flex h-[80px] flex-col justify-between border border-gray-300 bg-white px-3 py-3 shadow-sm"
        >
          <p class="text-[11px] font-medium leading-tight text-gray-500">{{ stat.label }}</p>
          <div class="flex items-end justify-between gap-1">
            <div class="min-w-0 leading-none">
              <span class="text-[20px] font-bold tracking-tight text-gray-950">{{ stat.value }}</span>
              <span class="ml-0.5 text-[11px] text-gray-400">{{ stat.unit }}</span>
            </div>
            <Truck :size="14" class="text-[#1f4b3a]" />
          </div>
        </article>
        <article
          v-if="flowStats.length === 0"
          class="col-span-2 border border-gray-300 bg-white px-3 py-6 text-center text-xs font-medium text-gray-400 xl:col-span-4"
        >
          표시할 흐름 지표가 없습니다.
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(300px,0.9fr)]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <PackageCheck :size="16" />
              입고 진행 현황
            </h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="row in inboundQueues" :key="`${row.center}-${row.item}`" class="px-3 py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold text-gray-800">{{ row.center }}</p>
                  <p class="mt-1 text-[11px] text-gray-600">{{ row.item }} · {{ row.qty }}</p>
                  <p class="mt-2 text-[11px] text-gray-400">예정 {{ row.eta }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium"
                  :class="row.state === '지연' ? 'bg-red-50 text-red-700' : row.state === '검수 진행' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'">
                  {{ row.state }}
                </span>
              </div>
            </div>
            <div v-if="inboundQueues.length === 0" class="px-3 py-10 text-center text-xs text-gray-400">
              입고 진행 데이터가 없습니다.
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Truck :size="16" />
              출고 진행 현황
            </h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="row in outboundQueues" :key="`${row.target}-${row.item}`" class="px-3 py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold text-gray-800">{{ row.target }}</p>
                  <p class="mt-1 text-[11px] text-gray-600">{{ row.item }} · {{ row.qty }}</p>
                  <p class="mt-2 text-[11px] text-gray-400">출발 {{ row.depart }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium"
                  :class="row.state === '출고 완료' ? 'bg-emerald-50 text-emerald-700' : row.state === '상차 진행' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'">
                  {{ row.state }}
                </span>
              </div>
            </div>
            <div v-if="outboundQueues.length === 0" class="px-3 py-10 text-center text-xs text-gray-400">
              출고 진행 데이터가 없습니다.
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">거점별 흐름</h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="row in centerFlows" :key="row.center" class="px-3 py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold text-gray-800">{{ row.center }}</p>
                  <p class="mt-1 text-[11px] text-gray-500">입고 {{ row.inbound }} · 출고 {{ row.outbound }} · 이동 {{ row.transfer }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium"
                  :class="row.status === '정상' ? 'bg-emerald-50 text-emerald-700' : row.status === '주의' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">
                  {{ row.status }}
                </span>
              </div>
            </div>
            <div v-if="centerFlows.length === 0" class="px-3 py-10 text-center text-xs text-gray-400">
              거점별 흐름 데이터가 없습니다.
            </div>
          </div>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-800">최근 입출고 로그</h3>
            <span class="bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>
          </div>
          <button type="button" class="text-xs font-semibold text-[#1f4b3a] hover:underline" @click="goToAllFlowTransactions">전체 입출고 조회</button>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[800px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">ID</th>
                <th class="px-3 py-2.5 text-left font-bold">구분</th>
                <th class="px-3 py-2.5 text-left font-bold">거점</th>
                <th class="px-3 py-2.5 text-left font-bold">품목</th>
                <th class="px-3 py-2.5 text-right font-bold">수량</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
                <th class="px-3 py-2.5 text-left font-bold">시각</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="row in liveLogs" :key="row.id" class="hover:bg-gray-50/50">
                <td class="px-3 py-2.5 font-mono text-gray-400">{{ row.id }}</td>
                <td class="px-3 py-2.5 text-xs font-bold text-gray-700">{{ row.type }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ row.location }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ row.item }}</td>
                <td class="px-3 py-2.5 text-right font-bold" :class="row.qty.startsWith('+') ? 'text-emerald-600' : 'text-red-600'">{{ row.qty }}</td>
                <td class="px-3 py-2.5 text-gray-700">{{ row.status }}</td>
                <td class="px-3 py-2.5 text-gray-400">{{ row.time }}</td>
              </tr>
              <tr v-if="liveLogs.length === 0">
                <td colspan="7" class="px-3 py-10 text-center text-xs text-gray-400">
                  최근 입출고 로그가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

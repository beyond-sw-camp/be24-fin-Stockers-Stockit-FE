<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import LineChart from '@/components/common/charts/LineChart.vue'
import { getStoreInventories } from '@/api/store/inventory.js'
import { getStoreOrders } from '@/api/store/orders.js'
import { getSales } from '@/api/store/sales.js'
import { getStoreInboundList } from '@/api/store/inbound.js'

const router = useRouter()
const storeMenus = roleMenus.store
const activeTopMenu = computed(() => '매장 대시보드')

const loading = ref(false)
const inventoryError = ref(false)
const salesError = ref(false)
const dailySalesError = ref(false)
const storeOrdersError = ref(false)

const inventories = ref([])
const todaySalesAmount = ref(0)
const todaySalesCount = ref(0)
// 최근 7일 일평균 판매 수량 (재고 보유일 계산용)
const dailyAvgSalesQty = ref(0)

// 발주 현황 (입고 현황 패턴 — 2 카드)
const storeOrderSummary = ref({ pending: 0, todayRequested: 0 })

// 입고 현황 (PENDING_RECEIPT / RECEIVED 카운트)
const inboundStatus = ref({ pending: 0, receivedToday: 0 })
const inboundError = ref(false)

// 일별 매출 추이 (최근 7일)
const dailySales = ref([]) // [{ date: 'MM/DD', amount: number }, ...]

// 매장 발주 상태별 카운트
const STORE_ORDER_STATUS_META = [
  { code: 'REQUESTED', label: '승인 대기', barCls: 'bg-amber-500' },
  { code: 'APPROVED',  label: '승인 완료', barCls: 'bg-sky-500' },
  { code: 'COMPLETED', label: '입고 완료', barCls: 'bg-emerald-500' },
  { code: 'CANCELLED', label: '취소',     barCls: 'bg-gray-400' },
]
const storeOrderStatusBreakdown = ref([])
const maxStoreOrderStatusCount = computed(() =>
  Math.max(...storeOrderStatusBreakdown.value.map((s) => s.count), 1),
)
const storeOrderBarWidth = (count) =>
  Math.max(2, Math.round((count / maxStoreOrderStatusCount.value) * 100))


const safeInventories = computed(() => (Array.isArray(inventories.value) ? inventories.value : []))
const totalItems = computed(() => safeInventories.value.length)
const lowStockCount = computed(() => safeInventories.value.filter((row) => Number(row.availableStock ?? 0) > 0 && Number(row.availableStock ?? 0) <= Number(row.safetyStock ?? 0)).length)
const outOfStockCount = computed(() => safeInventories.value.filter((row) => Number(row.availableStock ?? 0) <= 0).length)
const riskItems = computed(() => safeInventories.value.filter((row) => Number(row.availableStock ?? 0) <= Number(row.safetyStock ?? 0)))

// 재고 보유일 — 가장 시급한 SKU (Min)
// 각 SKU별 보유일 = availableStock / (일평균 판매수량 / SKU 수)  [균일 속도 가정]
const urgentSkuInventory = computed(() => {
  const list = safeInventories.value
  const avg = dailyAvgSalesQty.value
  if (!list.length || !avg || avg <= 0) return null
  const perSkuVelocity = avg / list.length
  if (perSkuVelocity <= 0) return null
  let minDays = Infinity
  let urgent = null
  for (const row of list) {
    const stock = Number(row.availableStock ?? 0)
    const days = stock / perSkuVelocity
    if (days < minDays) {
      minDays = days
      urgent = row
    }
  }
  if (!urgent || !Number.isFinite(minDays)) return null
  return {
    days: Math.round(minDays * 10) / 10,
    itemName: urgent.itemName || urgent.itemCode || '-',
  }
})

// 재고 리스크 미니 리스트 — 품절 우선, 그 다음 부족(부족분 큰 순) — TOP 6
const topRiskItems = computed(() =>
  [...riskItems.value]
    .map((row) => {
      const available = Number(row.availableStock ?? 0)
      const safety = Number(row.safetyStock ?? 0)
      const isOutOfStock = available <= 0
      return {
        ...row,
        available,
        safety,
        gap: Math.max(0, safety - available),
        urgency: isOutOfStock ? 0 : 1,
        statusLabel: isOutOfStock ? '품절' : '부족',
      }
    })
    .sort((a, b) => a.urgency - b.urgency || b.gap - a.gap)
    .slice(0, 6),
)
const riskRatio = computed(() => {
  if (!totalItems.value) return 0
  return Math.round((riskItems.value.length / totalItems.value) * 1000) / 10
})

const statusDistribution = computed(() => {
  const normal = safeInventories.value.filter((row) => Number(row.availableStock ?? 0) > Number(row.safetyStock ?? 0)).length
  const low = lowStockCount.value
  const out = outOfStockCount.value
  const sum = Math.max(normal + low + out, 1)
  return [
    { label: '정상', count: normal, ratio: Math.round((normal / sum) * 100) },
    { label: '부족', count: low, ratio: Math.round((low / sum) * 100) },
    { label: '품절', count: out, ratio: Math.round((out / sum) * 100) },
  ]
})

function statusClass(status) {
  if (status === '품절') return 'bg-red-50 text-red-700'
  if (status === '부족') return 'bg-amber-50 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
}

function todayDateStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function dateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 일별 매출 추이 차트 데이터
const dailySalesChartData = computed(() => ({
  labels: dailySales.value.map((p) => p.date),
  datasets: [
    {
      label: '매출',
      data: dailySales.value.map((p) => p.amount),
      borderColor: '#0E7A60',
      backgroundColor: 'rgba(14, 122, 96, 0.12)',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#0E7A60',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: true,
    },
  ],
}))
const dailySalesChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#6ee7b7',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
      displayColors: false,
      callbacks: { label: (ctx) => `₩${Number(ctx.parsed.y).toLocaleString()}` },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 }, callback: (v) => `₩${Number(v).toLocaleString()}` },
    },
  },
  interaction: { mode: 'index', intersect: false },
}

async function fetchStats() {
  loading.value = true
  inventoryError.value = false
  salesError.value = false

  try {
    const inventoryRes = await getStoreInventories()
    inventories.value = Array.isArray(inventoryRes) ? inventoryRes : []
  } catch {
    inventories.value = []
    inventoryError.value = true
  }

  try {
    const today = todayDateStr()
    const salesList = await getSales({ from: today, to: today })
    const list = Array.isArray(salesList) ? salesList : []
    todaySalesAmount.value = list.reduce((sum, s) => sum + Number(s?.totalAmount ?? 0), 0)
    todaySalesCount.value = list.length
  } catch {
    todaySalesAmount.value = 0
    todaySalesCount.value = 0
    salesError.value = true
  }

  // 일별 매출 추이 (최근 7일) + 베스트셀러 TOP 5
  try {
    const now = new Date()
    const from = new Date(now)
    from.setDate(from.getDate() - 6)
    const salesList = await getSales({ from: dateStr(from), to: dateStr(now) })
    const list = Array.isArray(salesList) ? salesList : []

    const bucket = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(from)
      d.setDate(from.getDate() + i)
      const key = dateStr(d)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      bucket[key] = { date: `${mm}/${dd}`, amount: 0 }
    }
    let totalQty7d = 0
    for (const sale of list) {
      const soldAt = sale?.soldAt ? new Date(sale.soldAt) : null
      if (soldAt && !Number.isNaN(soldAt.getTime())) {
        const key = dateStr(soldAt)
        if (bucket[key]) bucket[key].amount += Number(sale?.totalAmount ?? 0)
      }
      totalQty7d += Number(sale?.totalQuantity ?? 0)
    }
    dailySales.value = Object.keys(bucket)
      .sort()
      .map((k) => bucket[k])
    dailyAvgSalesQty.value = totalQty7d / 7
  } catch {
    dailySales.value = []
    dailyAvgSalesQty.value = 0
    dailySalesError.value = true
  }

  // 입고 현황
  try {
    const inbList = await getStoreInboundList()
    const list = Array.isArray(inbList) ? inbList : []
    const today = todayDateStr()
    let pending = 0
    let receivedToday = 0
    for (const row of list) {
      const status = String(row?.status || '').toUpperCase()
      if (status === 'PENDING_RECEIPT') pending++
      else if (status === 'RECEIVED') {
        const confirmedAt = row?.confirmedAt || row?.updatedAt || row?.receivedAt
        if (confirmedAt && String(confirmedAt).startsWith(today)) receivedToday++
      }
    }
    inboundStatus.value = { pending, receivedToday }
  } catch {
    inboundStatus.value = { pending: 0, receivedToday: 0 }
    inboundError.value = true
  }

  // 매장 발주 상태별 카운트 + 발주 현황 요약
  try {
    const orders = await getStoreOrders()
    const list = Array.isArray(orders) ? orders : []
    const map = {}
    const today = todayDateStr()
    let todayRequested = 0
    for (const o of list) {
      const code = String(o?.status || '').toUpperCase()
      map[code] = (map[code] || 0) + 1
      const reqAt = String(o?.requestedAt || '').slice(0, 10)
      if (reqAt === today) todayRequested++
    }
    storeOrderStatusBreakdown.value = STORE_ORDER_STATUS_META.map((s) => ({
      ...s,
      count: map[s.code] || 0,
    }))
    storeOrderSummary.value = {
      pending: map.REQUESTED || 0,
      todayRequested,
    }
  } catch {
    storeOrderStatusBreakdown.value = STORE_ORDER_STATUS_META.map((s) => ({ ...s, count: 0 }))
    storeOrderSummary.value = { pending: 0, todayRequested: 0 }
    storeOrdersError.value = true
  }

  loading.value = false
}

onMounted(fetchStats)
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="[]"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Operation Dashboard</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">매장 대시보드</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">금일 매출, 재고 위험, 발주 진행 현황을 한 화면에서 확인합니다.</p>
      </section>

      <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">금일 매출</p><p class="mt-2 text-2xl font-black text-gray-900">₩{{ todaySalesAmount.toLocaleString() }}</p><p v-if="salesError" class="mt-1 text-[10px] font-bold text-red-500">불러오기 실패</p></article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">금일 판매 건수</p><p class="mt-2 text-2xl font-black text-gray-900">{{ todaySalesCount.toLocaleString() }}<span class="ml-1 text-sm font-black text-gray-400">건</span></p></article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">재고 위험 SKU</p><p class="mt-2 text-2xl font-black text-gray-900">{{ riskItems.length.toLocaleString() }}<span class="ml-1 text-sm font-black text-gray-400">개</span></p></article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">재고 보유일 (최단)</p>
          <p class="mt-2 text-2xl font-black text-gray-900">
            <template v-if="urgentSkuInventory">{{ urgentSkuInventory.days.toLocaleString() }}<span class="ml-1 text-sm font-black text-gray-400">일</span></template>
            <template v-else><span class="text-base font-black text-gray-400">—</span></template>
          </p>
          <p class="mt-1 truncate text-[10px] font-bold text-gray-500" :title="urgentSkuInventory?.itemName ?? ''">
            <template v-if="urgentSkuInventory">{{ urgentSkuInventory.itemName }}</template>
            <template v-else>판매 데이터 부족</template>
          </p>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">일별 매출 추이</h2>
            <p class="mt-0.5 text-[10px] text-gray-400">최근 7일 일별 매출 합계</p>
          </div>
          <div class="flex-1 p-4" style="min-height: 220px;">
            <LineChart :data="dailySalesChartData" :options="dailySalesChartOptions" />
            <p v-if="dailySalesError" class="mt-2 text-xs font-bold text-red-500">매출 데이터를 불러오지 못해 0값으로 표시했습니다.</p>
          </div>
        </article>

        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">발주 상태별 진행</h2>
            <p class="mt-0.5 text-[10px] text-gray-400">매장 → 본사 발주 단계별 건수</p>
          </div>
          <div class="flex flex-1 flex-col justify-center gap-3 px-4 py-4">
            <div v-for="s in storeOrderStatusBreakdown" :key="s.code">
              <div class="mb-1 flex items-center justify-between text-[11px]">
                <span class="font-bold text-gray-600">{{ s.label }}</span>
                <span class="font-black text-gray-900">{{ s.count }}건</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-gray-100">
                <div :class="['h-full rounded-full', s.barCls]" :style="{ width: `${storeOrderBarWidth(s.count)}%` }"></div>
              </div>
            </div>
            <p
              v-if="!storeOrderStatusBreakdown.some((s) => s.count > 0)"
              class="py-6 text-center text-[11px] font-bold text-gray-400"
            >
              발주 데이터가 없습니다.
            </p>
            <p v-if="storeOrdersError" class="text-xs font-bold text-red-500">발주 데이터를 불러오지 못해 0값으로 표시했습니다.</p>
          </div>
        </article>
      </section>

      <!-- 재고 리스크 (좌, 2행 span) + 입고 현황 (우상) + 발주 현황 (우하) -->
      <section class="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article class="border border-gray-300 bg-white shadow-sm xl:row-span-2">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">재고 리스크 목록</h2>
            <button
              type="button"
              class="text-xs font-black text-[#0E7A60] hover:underline"
              @click="router.push('/store/inventory')"
            >
              재고 조회 →
            </button>
          </div>
          <ul class="divide-y divide-gray-100">
            <li
              v-for="row in topRiskItems"
              :key="row.itemCode"
              class="flex items-center gap-3 px-4 py-2.5"
            >
              <span class="min-w-0 flex-1 truncate text-xs font-bold text-gray-900">{{ row.itemName }}</span>
              <span class="shrink-0 font-mono text-[11px] font-black text-gray-600">{{ row.available }} / {{ row.safety }}</span>
              <span
                class="shrink-0 px-2 py-0.5 text-[10px] font-black"
                :class="statusClass(row.statusLabel)"
              >{{ row.statusLabel }}</span>
            </li>
            <li v-if="!topRiskItems.length" class="px-4 py-8 text-center text-xs font-bold text-gray-400">
              안전재고 이하 SKU가 없습니다.
            </li>
          </ul>
          <p
            v-if="riskItems.length > topRiskItems.length"
            class="border-t border-gray-100 px-4 py-2 text-center text-[11px] font-bold text-gray-400"
          >
            +{{ riskItems.length - topRiskItems.length }}건 더 — 전체는 재고 조회에서 확인
          </p>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm xl:self-start">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
            <h2 class="text-sm font-black text-gray-900">입고 현황</h2>
            <button
              type="button"
              class="text-xs font-black text-[#0E7A60] hover:underline"
              @click="router.push('/store/inbound/list')"
            >
              입고 관리 →
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2 p-3">
            <div class="border border-amber-200 bg-amber-50 px-3 py-2">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">입고 대기</p>
              <p class="mt-1 text-xl font-black text-amber-900">{{ inboundStatus.pending.toLocaleString() }}<span class="ml-1 text-xs font-black text-amber-500">건</span></p>
              <p class="mt-0.5 text-[10px] font-bold text-amber-600">확정 처리 필요</p>
            </div>
            <div class="border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">오늘 확정</p>
              <p class="mt-1 text-xl font-black text-emerald-900">{{ inboundStatus.receivedToday.toLocaleString() }}<span class="ml-1 text-xs font-black text-emerald-500">건</span></p>
              <p class="mt-0.5 text-[10px] font-bold text-emerald-600">금일 입고 완료</p>
            </div>
          </div>
          <p v-if="inboundError" class="px-3 pb-2 text-xs font-bold text-red-500">입고 데이터를 불러오지 못했습니다.</p>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm xl:self-start">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
            <h2 class="text-sm font-black text-gray-900">발주 현황</h2>
            <button
              type="button"
              class="text-xs font-black text-[#0E7A60] hover:underline"
              @click="router.push('/store/orders/history')"
            >
              발주 내역 →
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2 p-3">
            <div class="border border-amber-200 bg-amber-50 px-3 py-2">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">승인 대기</p>
              <p class="mt-1 text-xl font-black text-amber-900">{{ storeOrderSummary.pending.toLocaleString() }}<span class="ml-1 text-xs font-black text-amber-500">건</span></p>
              <p class="mt-0.5 text-[10px] font-bold text-amber-600">본사 승인 대기 중</p>
            </div>
            <div class="border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">오늘 발주</p>
              <p class="mt-1 text-xl font-black text-emerald-900">{{ storeOrderSummary.todayRequested.toLocaleString() }}<span class="ml-1 text-xs font-black text-emerald-500">건</span></p>
              <p class="mt-0.5 text-[10px] font-bold text-emerald-600">금일 신규 발주</p>
            </div>
          </div>
          <p v-if="storeOrdersError" class="px-3 pb-2 text-xs font-bold text-red-500">발주 데이터를 불러오지 못했습니다.</p>
        </article>
      </section>

      <p v-if="loading" class="text-xs font-bold text-gray-500">데이터를 불러오는 중입니다.</p>
    </div>
  </AppLayout>
</template>

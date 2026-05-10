<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { getStoreInventories } from '@/api/store/inventory.js'
import { getStoreOrderAnalytics } from '@/api/store/orders.js'

const USE_DUMMY_DATA = true

const DUMMY_INVENTORIES = [
  { itemCode: 'ITEM-001', itemName: '코튼 베이직 티셔츠', availableStock: 58, safetyStock: 20, status: '정상' },
  { itemCode: 'ITEM-002', itemName: '슬림 데님 팬츠', availableStock: 12, safetyStock: 15, status: '부족' },
  { itemCode: 'ITEM-003', itemName: '오버핏 셔츠', availableStock: 0, safetyStock: 10, status: '품절' },
  { itemCode: 'ITEM-004', itemName: '니트 가디건', availableStock: 9, safetyStock: 12, status: '부족' },
  { itemCode: 'ITEM-005', itemName: '캔버스 토트백', availableStock: 33, safetyStock: 8, status: '정상' },
]

const DUMMY_ANALYTICS = {
  totalOrders: 184,
  totalRequestedQuantity: 2740,
  topSkus: [
    { skuCode: 'SKU-1001', productName: '코튼 베이직 티셔츠', requestedQuantity: 420, orderCount: 18 },
    { skuCode: 'SKU-1204', productName: '슬림 데님 팬츠', requestedQuantity: 355, orderCount: 14 },
    { skuCode: 'SKU-1402', productName: '오버핏 셔츠', requestedQuantity: 310, orderCount: 12 },
  ],
  categoryBreakdown: [
    { label: '상의', requestedQuantity: 1120 },
    { label: '하의', requestedQuantity: 890 },
    { label: '잡화', requestedQuantity: 730 },
  ],
}

const storeMenus = roleMenus.store
const statsMenus = roleMenus.store.find((menu) => menu.label === '통계')?.children ?? []
const activeTopMenu = computed(() => '통계')
const activeSideMenu = ref('재고 운영 통계')

const loading = ref(false)
const inventoryError = ref(false)
const analyticsError = ref(false)

const inventories = ref([])
const analyticsSummary = ref({
  totalOrders: 0,
  totalRequestedQuantity: 0,
})
const analyticsTopSkus = ref([])
const analyticsCategoryBreakdown = ref([])

const safeInventories = computed(() => (Array.isArray(inventories.value) ? inventories.value : []))
const totalItems = computed(() => safeInventories.value.length)
const lowStockCount = computed(() => safeInventories.value.filter((row) => Number(row.availableStock ?? 0) > 0 && Number(row.availableStock ?? 0) <= Number(row.safetyStock ?? 0)).length)
const outOfStockCount = computed(() => safeInventories.value.filter((row) => Number(row.availableStock ?? 0) <= 0).length)
const riskItems = computed(() => safeInventories.value.filter((row) => Number(row.availableStock ?? 0) <= Number(row.safetyStock ?? 0)))
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

async function fetchStats() {
  loading.value = true
  inventoryError.value = false
  analyticsError.value = false

  if (USE_DUMMY_DATA) {
    inventories.value = DUMMY_INVENTORIES
    analyticsSummary.value = {
      totalOrders: Number(DUMMY_ANALYTICS.totalOrders ?? 0),
      totalRequestedQuantity: Number(DUMMY_ANALYTICS.totalRequestedQuantity ?? 0),
    }
    analyticsTopSkus.value = DUMMY_ANALYTICS.topSkus
    analyticsCategoryBreakdown.value = DUMMY_ANALYTICS.categoryBreakdown
    loading.value = false
    return
  }

  try {
    const inventoryRes = await getStoreInventories()
    inventories.value = Array.isArray(inventoryRes) ? inventoryRes : []
  } catch {
    inventories.value = []
    inventoryError.value = true
  }

  try {
    const analyticsRes = await getStoreOrderAnalytics()
    analyticsSummary.value = {
      totalOrders: Number(analyticsRes?.totalOrders ?? 0),
      totalRequestedQuantity: Number(analyticsRes?.totalRequestedQuantity ?? 0),
    }
    analyticsTopSkus.value = Array.isArray(analyticsRes?.topSkus) ? analyticsRes.topSkus : []
    analyticsCategoryBreakdown.value = Array.isArray(analyticsRes?.categoryBreakdown) ? analyticsRes.categoryBreakdown : []
  } catch {
    analyticsSummary.value = { totalOrders: 0, totalRequestedQuantity: 0 }
    analyticsTopSkus.value = []
    analyticsCategoryBreakdown.value = []
    analyticsError.value = true
  }

  loading.value = false
}

onMounted(fetchStats)
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="statsMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory Operations</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">재고 운영 통계</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">재고 상태와 발주 분석 데이터를 기반으로 운영 리스크를 확인합니다.</p>
      </section>

      <section class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">전체 품목 수</p><p class="mt-2 text-2xl font-black text-gray-900">{{ totalItems.toLocaleString() }}</p></article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">부족 SKU 수</p><p class="mt-2 text-2xl font-black text-gray-900">{{ lowStockCount.toLocaleString() }}</p></article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">품절 SKU 수</p><p class="mt-2 text-2xl font-black text-gray-900">{{ outOfStockCount.toLocaleString() }}</p></article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">안전재고 이하 비율</p><p class="mt-2 text-2xl font-black text-gray-900">{{ riskRatio }}%</p></article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">누적 발주 건수</p><p class="mt-2 text-2xl font-black text-gray-900">{{ analyticsSummary.totalOrders.toLocaleString() }}</p></article>
        <article class="border border-gray-300 bg-white p-3 shadow-sm"><p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">누적 발주 수량</p><p class="mt-2 text-2xl font-black text-gray-900">{{ analyticsSummary.totalRequestedQuantity.toLocaleString() }}</p></article>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3"><h2 class="text-sm font-black text-gray-900">재고 상태 분포</h2></div>
          <div class="space-y-3 p-4">
            <div v-for="row in statusDistribution" :key="row.label" class="space-y-1">
              <div class="flex items-center justify-between text-xs"><span class="font-bold text-gray-700">{{ row.label }}</span><span class="font-black text-gray-900">{{ row.count }}개 ({{ row.ratio }}%)</span></div>
              <div class="h-2 overflow-hidden bg-gray-100"><div class="h-full bg-[#0E7A60]" :style="{ width: `${row.ratio}%` }" /></div>
            </div>
            <p v-if="inventoryError" class="text-xs font-bold text-red-500">재고 데이터를 불러오지 못해 0값으로 표시했습니다.</p>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3"><h2 class="text-sm font-black text-gray-900">카테고리별 발주 비중</h2></div>
          <div class="space-y-2 p-4">
            <div v-for="row in analyticsCategoryBreakdown" :key="row.label" class="flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2"><span class="text-xs font-bold text-gray-700">{{ row.label }}</span><span class="text-xs font-black text-gray-900">{{ Number(row.requestedQuantity ?? 0).toLocaleString() }}개</span></div>
            <p v-if="!analyticsCategoryBreakdown.length" class="py-6 text-center text-xs font-bold text-gray-400">발주 분석 데이터가 없습니다.</p>
            <p v-if="analyticsError" class="text-xs font-bold text-red-500">발주 분석 데이터를 불러오지 못해 0값으로 표시했습니다.</p>
          </div>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3"><h2 class="text-sm font-black text-gray-900">발주 TOP SKU</h2></div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[620px] text-xs"><thead class="bg-gray-50 text-[10px] uppercase text-gray-500"><tr><th class="px-3 py-3 text-left font-black">SKU</th><th class="px-3 py-3 text-left font-black">상품명</th><th class="px-3 py-3 text-right font-black">발주 수량</th><th class="px-3 py-3 text-right font-black">발주 건수</th></tr></thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in analyticsTopSkus" :key="row.skuCode"><td class="px-3 py-3 font-mono font-bold text-gray-600">{{ row.skuCode }}</td><td class="px-3 py-3 font-bold text-gray-900">{{ row.productName }}</td><td class="px-3 py-3 text-right font-black text-gray-900">{{ Number(row.requestedQuantity ?? 0).toLocaleString() }}</td><td class="px-3 py-3 text-right font-black text-gray-700">{{ Number(row.orderCount ?? 0).toLocaleString() }}</td></tr>
                <tr v-if="!analyticsTopSkus.length"><td colspan="4" class="px-4 py-10 text-center text-gray-400">발주 TOP SKU 데이터가 없습니다.</td></tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3"><h2 class="text-sm font-black text-gray-900">재고 리스크 목록</h2></div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[620px] text-xs"><thead class="bg-gray-50 text-[10px] uppercase text-gray-500"><tr><th class="px-3 py-3 text-left font-black">품목코드</th><th class="px-3 py-3 text-left font-black">품목명</th><th class="px-3 py-3 text-right font-black">가용/안전</th><th class="px-3 py-3 text-center font-black">상태</th></tr></thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in riskItems" :key="row.itemCode"><td class="px-3 py-3 font-mono font-bold text-gray-600">{{ row.itemCode }}</td><td class="px-3 py-3 font-bold text-gray-900">{{ row.itemName }}</td><td class="px-3 py-3 text-right font-black text-gray-700">{{ Number(row.availableStock ?? 0) }} / {{ Number(row.safetyStock ?? 0) }}</td><td class="px-3 py-3 text-center"><span class="px-2 py-1 text-[11px] font-black" :class="statusClass(row.status)">{{ row.status }}</span></td></tr>
                <tr v-if="!riskItems.length"><td colspan="4" class="px-4 py-10 text-center text-gray-400">안전재고 이하 SKU가 없습니다.</td></tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <p v-if="loading" class="text-xs font-bold text-gray-500">데이터를 불러오는 중입니다.</p>
    </div>
  </AppLayout>
</template>

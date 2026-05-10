<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { getStoreInventories } from '@/api/store/inventory.js'
import { getStoreOrderAnalytics } from '@/api/store/orders.js'
import { useSalesStore } from '@/stores/store/storeSales.js'

const USE_DUMMY_DATA = true

const DUMMY_INVENTORIES = [
  { itemCode: 'ITEM-001', itemName: '코튼 베이직 티셔츠', parentCategory: '상의', childCategory: '티셔츠', actualStock: 71, availableStock: 58, safetyStock: 20, status: '정상' },
  { itemCode: 'ITEM-002', itemName: '슬림 데님 팬츠', parentCategory: '하의', childCategory: '데님', actualStock: 18, availableStock: 12, safetyStock: 15, status: '부족' },
  { itemCode: 'ITEM-003', itemName: '오버핏 셔츠', parentCategory: '상의', childCategory: '셔츠', actualStock: 4, availableStock: 0, safetyStock: 10, status: '품절' },
  { itemCode: 'ITEM-004', itemName: '니트 가디건', parentCategory: '아우터', childCategory: '가디건', actualStock: 14, availableStock: 9, safetyStock: 12, status: '부족' },
  { itemCode: 'ITEM-005', itemName: '캔버스 토트백', parentCategory: '잡화', childCategory: '가방', actualStock: 37, availableStock: 33, safetyStock: 8, status: '정상' },
]

const DUMMY_TOP_SKUS = [
  { skuCode: 'ITEM-001', requestedQuantity: 420, orderCount: 18 },
  { skuCode: 'ITEM-002', requestedQuantity: 355, orderCount: 14 },
  { skuCode: 'ITEM-003', requestedQuantity: 310, orderCount: 12 },
  { skuCode: 'ITEM-004', requestedQuantity: 205, orderCount: 10 },
]

const salesStore = useSalesStore()

const storeMenus = roleMenus.store
const statsMenus = roleMenus.store.find((menu) => menu.label === '통계')?.children ?? []
const activeTopMenu = computed(() => '통계')
const activeSideMenu = ref('재고·발주 리포트')

const loading = ref(false)
const hasError = ref(false)

const inventories = ref([])
const topSkus = ref([])

const keyword = ref('')
const category = ref('전체')
const stockStatus = ref('전체')

const topSkuByCode = computed(() => {
  const map = new Map()
  for (const row of topSkus.value) {
    map.set(row.skuCode, {
      requestedQuantity: Number(row.requestedQuantity ?? 0),
      orderCount: Number(row.orderCount ?? 0),
    })
  }
  return map
})

const soldByName = computed(() => {
  const map = new Map()
  for (const sale of salesStore.sales ?? []) {
    for (const item of sale.items ?? []) {
      const key = String(item.productName ?? '').trim()
      if (!key) continue
      map.set(key, (map.get(key) ?? 0) + Number(item.quantity ?? 0))
    }
  }
  return map
})

const categoryOptions = computed(() => {
  const set = new Set((inventories.value ?? []).map((row) => row.parentCategory).filter(Boolean))
  return ['전체', ...set]
})

const filteredRows = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return (inventories.value ?? []).filter((row) => {
    const categoryMatched = category.value === '전체' || row.parentCategory === category.value
    const statusMatched = stockStatus.value === '전체' || row.status === stockStatus.value
    const keywordMatched =
      !q ||
      [row.itemCode, row.itemName, row.parentCategory, row.childCategory]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    return categoryMatched && statusMatched && keywordMatched
  })
})

function priorityHint(row) {
  const available = Number(row.availableStock ?? 0)
  const safety = Number(row.safetyStock ?? 0)
  if (available <= 0) return '즉시 발주'
  if (available <= safety) return '우선 발주'
  return '모니터링'
}

function priorityClass(row) {
  const hint = priorityHint(row)
  if (hint === '즉시 발주') return 'bg-red-50 text-red-700'
  if (hint === '우선 발주') return 'bg-amber-50 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
}

async function fetchReport() {
  loading.value = true
  hasError.value = false

  if (USE_DUMMY_DATA) {
    inventories.value = DUMMY_INVENTORIES
    topSkus.value = DUMMY_TOP_SKUS
    loading.value = false
    return
  }

  try {
    const [inventoryRes, analyticsRes] = await Promise.all([getStoreInventories(), getStoreOrderAnalytics()])
    inventories.value = Array.isArray(inventoryRes) ? inventoryRes : []
    topSkus.value = Array.isArray(analyticsRes?.topSkus) ? analyticsRes.topSkus : []
  } catch {
    inventories.value = []
    topSkus.value = []
    hasError.value = true
  } finally {
    loading.value = false
  }
}

onMounted(fetchReport)
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
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory & Orders Report</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">재고·발주 리포트</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">카테고리/재고상태/키워드 기준으로 운영 우선순위를 확인합니다.</p>
      </section>

      <section class="grid gap-3 border border-gray-300 bg-white p-4 shadow-sm md:grid-cols-3">
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold text-gray-500">카테고리</span>
          <select v-model="category" class="h-9 border border-gray-300 px-2 text-xs font-bold">
            <option v-for="opt in categoryOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold text-gray-500">재고 상태</span>
          <select v-model="stockStatus" class="h-9 border border-gray-300 px-2 text-xs font-bold">
            <option value="전체">전체</option>
            <option value="정상">정상</option>
            <option value="부족">부족</option>
            <option value="품절">품절</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-[11px] font-bold text-gray-500">키워드</span>
          <input v-model="keyword" type="search" placeholder="품목코드, 품목명" class="h-9 border border-gray-300 px-2 text-xs font-bold" />
        </label>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">재고 운영 테이블</h2>
          <p class="text-xs font-bold text-gray-500">총 {{ filteredRows.length.toLocaleString() }}건</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[1220px] text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 text-left font-black">품목코드</th>
                <th class="px-3 py-3 text-left font-black">품목명</th>
                <th class="px-3 py-3 text-right font-black">실재고</th>
                <th class="px-3 py-3 text-right font-black">가용재고</th>
                <th class="px-3 py-3 text-right font-black">안전재고</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
                <th class="px-3 py-3 text-center font-black">발주 우선순위</th>
                <th class="px-3 py-3 text-right font-black">누적 발주수량</th>
                <th class="px-3 py-3 text-right font-black">발주건수</th>
                <th class="px-3 py-3 text-right font-black">판매수량(보조)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in filteredRows" :key="row.itemCode">
                <td class="px-3 py-3 font-mono font-bold text-gray-700">{{ row.itemCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-700">{{ Number(row.actualStock ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-700">{{ Number(row.availableStock ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-700">{{ Number(row.safetyStock ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-3 text-center"><span class="px-2 py-1 text-[11px] font-black" :class="priorityClass({ ...row, status: row.status })">{{ row.status }}</span></td>
                <td class="px-3 py-3 text-center"><span class="px-2 py-1 text-[11px] font-black" :class="priorityClass(row)">{{ priorityHint(row) }}</span></td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ Number(topSkuByCode.get(row.itemCode)?.requestedQuantity ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-700">{{ Number(topSkuByCode.get(row.itemCode)?.orderCount ?? 0).toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-700">{{ Number(soldByName.get(row.itemName) ?? 0).toLocaleString() }}</td>
              </tr>
              <tr v-if="filteredRows.length === 0"><td colspan="10" class="px-4 py-12 text-center text-gray-400">조건에 맞는 재고 운영 데이터가 없습니다.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <p v-if="hasError" class="text-xs font-bold text-red-500">일부 데이터를 불러오지 못해 0값 또는 빈 목록으로 표시했습니다.</p>
      <p v-if="loading" class="text-xs font-bold text-gray-500">데이터를 불러오는 중입니다.</p>
    </div>
  </AppLayout>
</template>

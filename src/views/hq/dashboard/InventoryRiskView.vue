<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  ShieldAlert,
  TriangleAlert,
  Warehouse,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { extractErrorMessage } from '@/api/axios.js'
import { getCompanyWideInventories, getWarehouseTransferImbalancedSkus } from '@/api/hq/inventory.js'
import { roleMenus } from '@/config/roleMenus.js'
import { dashboardSideMenus } from '@/views/hq/dashboard/dashboardMenus.js'
const hqMenus = roleMenus.hq

const activeSideMenu = ref('재고 위험')
const sideMenus = dashboardSideMenus

const riskStats = ref([])
const riskStores = ref([])
const riskWarehouses = ref([])
const shortageRanking = ref([])
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

const toNum = (v) => Number(v || 0)
const toStatus = (available, safety) => {
  if (toNum(available) <= 0) return '품절'
  if (toNum(available) <= toNum(safety)) return '부족'
  return '안전'
}

const fetchRiskData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const [companyWide, imbalancedSkus] = await Promise.all([
      getCompanyWideInventories(),
      getWarehouseTransferImbalancedSkus(),
    ])
    const items = Array.isArray(companyWide?.items) ? companyWide.items : []
    const riskItems = items
      .map((item) => {
        const current = toNum(item.availableStock)
        const safety = toNum(item.safetyStock)
        const gap = Math.max(0, safety - current)
        const status = toStatus(current, safety)
        return {
          name: '전사 집계',
          sku: item.itemName,
          current,
          safety,
          gap,
          status,
          level: status === '품절' ? 'high' : status === '부족' ? 'medium' : 'low',
          eta: status === '품절' ? '즉시 보충' : status === '부족' ? '오늘 보충' : '모니터링',
        }
      })
      .filter((row) => row.status !== '안전')
      .sort((a, b) => b.gap - a.gap)

    riskStores.value = riskItems.slice(0, 12)

    const imbalanced = Array.isArray(imbalancedSkus) ? imbalancedSkus : []
    riskWarehouses.value = imbalanced.slice(0, 8).map((row) => ({
      name: row.itemName,
      sku: row.skuCode,
      status: toNum(row.shortageWarehouseCount) > 0 ? '부족' : '정상',
      action: `부족 창고 ${toNum(row.shortageWarehouseCount)}곳 · 순부족 ${toNum(row.totalShortageQty)}EA`,
      level: toNum(row.totalShortageQty) > 0 ? 'high' : 'medium',
    }))

    shortageRanking.value = riskItems.slice(0, 4).map((row, idx) => ({
      rank: idx + 1,
      target: row.sku,
      issue: `현재 ${row.current} / 안전 ${row.safety}`,
      severity: row.eta,
    }))

    const outOfStockCount = riskItems.filter((row) => row.status === '품절').length
    riskStats.value = [
      { label: '안전재고 미만 항목', value: `${riskItems.length}`, unit: '건', tone: 'danger' },
      { label: '품절 임박 SKU', value: `${Math.max(0, riskItems.length - outOfStockCount)}`, unit: '개', tone: 'warning' },
      { label: '창고 위험 품목', value: `${riskWarehouses.value.length}`, unit: '개', tone: 'warning' },
      { label: '즉시 보충 필요', value: `${outOfStockCount}`, unit: '건', tone: 'danger' },
    ]
  } catch (error) {
    loadError.value = extractErrorMessage(error, '재고 위험 데이터를 불러오지 못했습니다.')
    riskStats.value = []
    riskStores.value = []
    riskWarehouses.value = []
    shortageRanking.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRiskData()
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
            <ShieldAlert :size="18" />
            재고 위험
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
          <span class="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
            <Clock3 :size="12" />
            위험 항목 실시간 추적
          </span>
        </div>

      </section>
      <p v-if="loadError" class="border border-red-100 bg-red-50 px-3 py-3 text-xs font-medium text-red-700">
        {{ loadError }}
      </p>
      <p v-else-if="loading" class="border border-gray-300 bg-white px-3 py-3 text-xs font-medium text-gray-500">
        재고 위험 데이터를 불러오는 중입니다.
      </p>

      <section class="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="stat in riskStats"
          :key="stat.label"
          class="flex h-[80px] flex-col justify-between border border-gray-300 bg-white px-3 py-3 shadow-sm"
        >
          <p class="text-[11px] font-medium leading-tight text-gray-500">{{ stat.label }}</p>
          <div class="flex items-end justify-between gap-1">
            <div class="min-w-0 leading-none">
              <span class="text-[20px] font-bold tracking-tight text-gray-950">{{ stat.value }}</span>
              <span class="ml-0.5 text-[11px] text-gray-400">{{ stat.unit }}</span>
            </div>
            <TriangleAlert
              :size="14"
              :class="stat.tone === 'danger' ? 'text-red-600' : 'text-amber-600'"
            />
          </div>
        </article>
        <article
          v-if="riskStats.length === 0"
          class="col-span-2 border border-gray-300 bg-white px-3 py-6 text-center text-xs font-medium text-gray-400 xl:col-span-4"
        >
          표시할 위험 지표가 없습니다.
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <AlertCircle :size="16" class="text-red-600" />
              매장 재고 위험 목록
            </h3>
            <span class="text-[10px] font-medium text-gray-400">안전재고 기준 부족분 우선</span>
          </div>

          <div class="overflow-auto">
            <table class="w-full min-w-[760px] text-[13px]">
              <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-2.5 text-left font-bold">매장</th>
                  <th class="px-3 py-2.5 text-left font-bold">위험 품목</th>
                  <th class="px-3 py-2.5 text-right font-bold">현재고</th>
                  <th class="px-3 py-2.5 text-right font-bold">안전재고</th>
                  <th class="px-3 py-2.5 text-right font-bold">부족분</th>
                  <th class="px-3 py-2.5 text-left font-bold">권장 조치</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 border-t border-gray-200">
                <tr v-for="row in riskStores" :key="`${row.name}-${row.sku}`" class="hover:bg-gray-50/50">
                  <td class="px-3 py-2.5 font-semibold text-gray-800">{{ row.name }}</td>
                  <td class="px-3 py-2.5 text-gray-600">{{ row.sku }}</td>
                  <td class="px-3 py-2.5 text-right text-gray-700">{{ row.current }}</td>
                  <td class="px-3 py-2.5 text-right text-gray-500">{{ row.safety }}</td>
                  <td class="px-3 py-2.5 text-right font-bold text-red-600">-{{ row.gap }}</td>
                  <td class="px-3 py-2.5">
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium"
                      :class="row.level === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'"
                    >
                      <ArrowRight :size="12" />
                      {{ row.eta }}
                    </span>
                  </td>
                </tr>
                <tr v-if="riskStores.length === 0">
                  <td colspan="6" class="px-3 py-10 text-center text-xs text-gray-400">
                    매장 재고 위험 데이터가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Warehouse :size="16" />
              창고 위험 신호
            </h3>
          </div>

          <div class="divide-y divide-gray-100">
            <div v-for="row in riskWarehouses" :key="`${row.name}-${row.sku}`" class="px-3 py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold text-gray-800">{{ row.name }}</p>
                  <p class="mt-1 text-[11px] text-gray-500">{{ row.sku }}</p>
                  <p class="mt-2 text-[11px] font-medium text-gray-600">{{ row.action }}</p>
                </div>
                <span
                  class="inline-flex shrink-0 rounded-full px-2 py-1 text-[11px] font-medium"
                  :class="row.level === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'"
                >
                  {{ row.status }}
                </span>
              </div>
            </div>
            <div v-if="riskWarehouses.length === 0" class="px-3 py-10 text-center text-xs text-gray-400">
              창고 위험 신호 데이터가 없습니다.
            </div>
          </div>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">위험 우선순위</h3>
          <span class="text-[10px] font-medium text-gray-400">즉시 조치 대상 순</span>
        </div>

        <div class="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="item in shortageRanking"
            :key="item.rank"
            class="border-b border-r border-gray-100 px-3 py-3 last:border-r-0 xl:border-b-0"
          >
            <p class="text-[11px] font-medium text-gray-400">Priority {{ item.rank }}</p>
            <p class="mt-2 text-[15px] font-semibold text-gray-900">{{ item.target }}</p>
            <p class="mt-2 text-[13px] text-gray-600">{{ item.issue }}</p>
            <p class="mt-3 text-[11px] font-semibold text-red-600">{{ item.severity }}</p>
          </article>
          <article
            v-if="shortageRanking.length === 0"
            class="border-b border-gray-100 px-3 py-10 text-center text-xs text-gray-400 md:col-span-2 xl:col-span-4"
          >
            위험 우선순위 데이터가 없습니다.
          </article>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

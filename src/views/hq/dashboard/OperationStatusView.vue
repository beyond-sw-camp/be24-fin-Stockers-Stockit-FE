<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShoppingCart,
  Warehouse,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { extractErrorMessage } from '@/api/axios.js'
import { getCircularCandidates, getCompanyWideInventories, getWarehouseTransferImbalancedSkus, getWarehouseTransfers } from '@/api/hq/inventory.js'
import { purchaseOrderApi } from '@/api/hq/purchaseOrder.js'
import { roleMenus } from '@/config/roleMenus.js'
import { getDefaultDateRange, toUiPurchaseStatus } from '@/views/hq/dashboard/dashboardData.js'

const router = useRouter()
const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => '본사 대시보드')

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date()),
)

const isLoading = ref(false)
const loadError = ref('')
const kpiStats = ref([])
const inventoryRisks = ref([])
const warehouseImbalances = ref([])

const currentImbalanceIndex = ref(0)

const currentWarehouseImbalance = computed(() => warehouseImbalances.value[currentImbalanceIndex.value] ?? null)

const imbalancePositionLabel = computed(
  () => `${warehouseImbalances.value.length === 0 ? 0 : currentImbalanceIndex.value + 1} / ${warehouseImbalances.value.length}`,
)

const orderStatuses = computed(() => [
  { label: '발주 요청', value: 0, color: 'bg-[#004D3C]' },
  { label: '창고 배정', value: 0, color: 'bg-[#7fb3a8]' },
  { label: '출고 준비', value: 0, color: 'bg-[#D6EAEA]' },
  { label: '배송 중', value: 0, color: 'bg-sky-200' },
])

const purchaseStatuses = ref([])

const alerts = ref([])


const goTo = (path) => router.push(path)

const moveImbalance = (direction) => {
  if (warehouseImbalances.value.length === 0) return
  currentImbalanceIndex.value =
    (currentImbalanceIndex.value + direction + warehouseImbalances.value.length) %
    warehouseImbalances.value.length
}

const statusBadgeClass = (status) =>
  ({
    안전: 'bg-[#EBF5F5] text-[#004D3C]',
    부족: 'bg-amber-50 text-amber-700',
    품절: 'bg-red-50 text-red-700',
  })[status] ?? 'bg-gray-50 text-gray-500'

const alertTypeBadgeClass = (type) =>
  ({
    '매장 발주량 이상 감지': 'bg-amber-50 text-amber-700',
    '창고 발주량 이상 알림': 'bg-orange-50 text-orange-700',
    '매장 재고 부족 알림': 'bg-red-50 text-red-700',
    '창고 재고 부족 알림': 'bg-rose-50 text-rose-700',
  })[type] ?? 'bg-gray-50 text-gray-500'

const toNum = (v) => Number(v || 0)
const statusByAvailableAndSafety = (available, safety) => {
  const a = toNum(available)
  const s = toNum(safety)
  if (a <= 0) return '품절'
  if (a <= s) return '부족'
  return '안전'
}

const fetchDashboardData = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const { fromDate, toDate } = getDefaultDateRange(30)
    const [companyWide, circularCandidates, imbalancedSkus, transfers, purchaseOrders] = await Promise.all([
      getCompanyWideInventories(),
      getCircularCandidates({ page: 0, size: 20, sort: 'convertibleStock,desc' }),
      getWarehouseTransferImbalancedSkus(),
      getWarehouseTransfers({ fromDate, toDate }),
      purchaseOrderApi.list({ from: fromDate, to: toDate }),
    ])

    const items = Array.isArray(companyWide?.items) ? companyWide.items : []
    const shortages = items
      .map((item) => {
        const availableStock = toNum(item.availableStock)
        const safetyStock = toNum(item.safetyStock)
        return {
          item: item.itemName,
          category: [item.parentCategory, item.childCategory].filter(Boolean).join(' > '),
          location: '전사 집계',
          status: statusByAvailableAndSafety(availableStock, safetyStock),
          stock: availableStock,
          safety: safetyStock,
          gap: Math.max(0, safetyStock - availableStock),
        }
      })
      .filter((item) => item.status === '부족' || item.status === '품절')
      .sort((a, b) => b.gap - a.gap)

    inventoryRisks.value = shortages.slice(0, 8)

    const totalActual = items.reduce((acc, item) => acc + toNum(item.actualStock), 0)
    const totalAvailable = items.reduce((acc, item) => acc + toNum(item.availableStock), 0)
    const availableRate = totalActual > 0 ? ((totalAvailable / totalActual) * 100).toFixed(1) : '0.0'

    const progressPoCount = (purchaseOrders || []).filter(
      (order) => !['COMPLETED', 'REJECTED', 'CANCELED'].includes(String(order.status || '')),
    ).length

    kpiStats.value = [
      { label: '가용 재고율', value: availableRate, unit: '%', caption: '비가용 제외', tone: 'blue' },
      { label: '부족 재고', value: `${shortages.length}`, unit: 'SKU', caption: '안전재고 이하', tone: 'red' },
      {
        label: '순환 재고 후보',
        value: `${Number(circularCandidates?.totalElements || 0)}`,
        unit: '품목',
        caption: '전환 검토 필요',
        tone: 'lime',
      },
      { label: '발주 진행', value: `${progressPoCount}`, unit: '건', caption: '본사 거래처 발주', tone: 'gray' },
    ]

    warehouseImbalances.value = (imbalancedSkus || []).slice(0, 8).map((sku) => ({
      item: sku.itemName,
      category: sku.category || '-',
      warehouses: [
        {
          warehouse: '부족 창고 수',
          stock: toNum(sku.shortageWarehouseCount),
          safety: Math.max(toNum(sku.shortageWarehouseCount), 1),
          status: toNum(sku.shortageWarehouseCount) > 0 ? '부족' : '안전',
        },
        {
          warehouse: '전사 가용재고',
          stock: toNum(sku.totalAvailable),
          safety: Math.max(toNum(sku.totalShortageQty), 1),
          status: toNum(sku.totalShortageQty) > 0 ? '부족' : '안전',
        },
      ],
    }))
    if (currentImbalanceIndex.value >= warehouseImbalances.value.length) {
      currentImbalanceIndex.value = 0
    }

    const poByStatus = (purchaseOrders || []).reduce((acc, row) => {
      const status = toUiPurchaseStatus(row.status)
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    purchaseStatuses.value = [
      { label: '발주 요청', value: poByStatus['발주 요청'] || 0, color: 'bg-[#004D3C]' },
      { label: '거래처 확인', value: poByStatus['거래처 확인'] || 0, color: 'bg-[#7fb3a8]' },
      { label: '입고 예정', value: poByStatus['입고 예정'] || 0, color: 'bg-[#D6EAEA]' },
    ]

    void transfers
    alerts.value = []
  } catch (error) {
    loadError.value = extractErrorMessage(error, '운영 현황 데이터를 불러오지 못했습니다.')
    kpiStats.value = []
    inventoryRisks.value = []
    warehouseImbalances.value = []
    purchaseStatuses.value = []
    alerts.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="[]"
    show-system-card
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              HQ Operation Dashboard
            </p>
            <h1 class="mt-1 text-xl font-black text-gray-950">중앙관리자 운영 현황</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              전사 재고, 주문/발주, 알림을 한 화면에서 확인합니다.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex h-8 items-center gap-1 border border-[#D6EAEA] bg-[#EBF5F5] px-3 text-[11px] font-black text-[#004D3C]"
            >
              <Clock :size="13" />
              {{ dateLabel }}
            </span>
            <span
              class="inline-flex h-8 items-center gap-1 border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-black text-emerald-700"
            >
              <CheckCircle2 :size="13" />
              실시간 모니터링
            </span>
          </div>
        </div>
      </section>
      <p v-if="loadError" class="border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
        {{ loadError }}
      </p>
      <p v-else-if="isLoading" class="border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-500">
        운영 현황 데이터를 불러오는 중입니다.
      </p>

      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article
          v-for="stat in kpiStats"
          :key="stat.label"
          class="border border-gray-200 bg-white p-3 shadow-sm"
        >
          <p class="text-[11px] font-bold text-gray-500">{{ stat.label }}</p>
          <div class="mt-3 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <span class="text-2xl font-black text-gray-950">{{ stat.value }}</span>
              <span class="ml-1 text-xs font-black text-gray-400">{{ stat.unit }}</span>
            </div>
            <span
              class="h-2.5 w-2.5 shrink-0"
              :class="{
                'bg-[#004D3C]': stat.tone === 'green',
                'bg-sky-400': stat.tone === 'blue',
                'bg-red-400': stat.tone === 'red',
                'bg-orange-300': stat.tone === 'orange',
                'bg-lime-300': stat.tone === 'lime',
                'bg-gray-300': stat.tone === 'gray',
              }"
            />
          </div>
          <p class="mt-2 text-[11px] font-bold text-gray-400">{{ stat.caption }}</p>
        </article>
        <article
          v-if="kpiStats.length === 0"
          class="col-span-2 border border-gray-200 bg-white p-3 text-xs font-bold text-gray-400 lg:col-span-4"
        >
          표시할 운영 지표가 없습니다.
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <AlertTriangle :size="16" class="text-red-500" />
              전사 재고 위험
            </h2>
            <button
              type="button"
              class="text-xs font-black text-[#004D3C] hover:underline"
              @click="goTo('/hq/inventory/company-wide')"
            >
              전사 재고 조회
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[680px] text-left text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-4 py-3 font-black">품목</th>
                  <th class="px-4 py-3 font-black">카테고리</th>
                  <th class="px-4 py-3 font-black">위치</th>
                  <th class="px-4 py-3 text-right font-black">현재/안전</th>
                  <th class="px-4 py-3 font-black">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in inventoryRisks"
                  :key="`${item.item}-${item.location}`"
                  class="hover:bg-[#EBF5F5]/60"
                >
                  <td class="px-4 py-3 font-black text-gray-900">{{ item.item }}</td>
                  <td class="px-4 py-3 font-bold text-gray-500">{{ item.category }}</td>
                  <td class="px-4 py-3 font-bold text-gray-700">{{ item.location }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-900">
                    {{ item.stock }} / {{ item.safety }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-1 text-[11px] font-black"
                      :class="statusBadgeClass(item.status)"
                      >{{ item.status }}</span
                    >
                  </td>
                </tr>
                <tr v-if="inventoryRisks.length === 0">
                  <td colspan="5" class="px-4 py-8 text-center text-xs font-bold text-gray-400">
                    재고 위험 데이터가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="border border-gray-200 bg-white shadow-sm">
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3"
          >
            <div class="flex min-w-0 items-center gap-2">
              <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-black text-gray-900">
                <Warehouse :size="16" class="shrink-0" />
                <span class="truncate">창고별 재고 불균형</span>
              </h2>
              <span class="shrink-0 text-[11px] font-black text-gray-400">{{
                imbalancePositionLabel
              }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 transition hover:border-[#004D3C] hover:text-[#004D3C]"
                aria-label="이전 불균형 품목"
                @click="moveImbalance(-1)"
              >
                <ChevronLeft :size="14" />
              </button>
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 transition hover:border-[#004D3C] hover:text-[#004D3C]"
                aria-label="다음 불균형 품목"
                @click="moveImbalance(1)"
              >
                <ChevronRight :size="14" />
              </button>
              <button
                type="button"
                class="ml-1 text-xs font-black text-[#004D3C] hover:underline"
                @click="goTo('/hq/inventory/warehouse-comparison')"
              >
                창고 비교
              </button>
            </div>
          </div>
          <div class="px-4 py-3">
            <template v-if="currentWarehouseImbalance">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-black text-gray-900">
                  {{ currentWarehouseImbalance.item }}
                </p>
                <p class="mt-1 text-[11px] font-bold text-gray-400">
                  {{ currentWarehouseImbalance.category }}
                </p>
              </div>
            </div>
            <div class="h-4" aria-hidden="true" />

            <div class="grid gap-2 sm:grid-cols-2">
              <div
                v-for="warehouse in currentWarehouseImbalance.warehouses"
                :key="warehouse.warehouse"
                class="border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate text-[11px] font-black text-gray-900">
                    {{ warehouse.warehouse }}
                  </p>
                  <span
                    class="shrink-0 px-2 py-1 text-[10px] font-black"
                    :class="statusBadgeClass(warehouse.status)"
                  >
                    {{ warehouse.status }}
                  </span>
                </div>
                <div class="mt-2 flex items-end justify-between gap-2">
                  <span class="text-lg font-black text-gray-950">{{ warehouse.stock }}</span>
                  <span class="text-[11px] font-bold text-gray-400"
                    >/ {{ warehouse.safety }} EA</span
                  >
                </div>
              </div>
            </div>
            </template>
            <p v-else class="py-8 text-center text-xs font-bold text-gray-400">
              창고 불균형 데이터가 없습니다.
            </p>
          </div>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article class="border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <ShoppingCart :size="16" />
              매장 발주·거래처 발주 현황
            </h2>
            <div class="flex gap-2">
              <button
                type="button"
                class="text-xs font-black text-[#004D3C] hover:underline"
                @click="goTo('/hq/orders')"
              >
                매장 주문
              </button>
              <button
                type="button"
                class="text-xs font-black text-[#004D3C] hover:underline"
                @click="goTo('/hq/purchase-orders')"
              >
                거래처 발주
              </button>
            </div>
          </div>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p class="mb-3 text-[11px] font-black text-gray-500">매장 발주</p>
              <div class="space-y-3">
                <div v-for="status in orderStatuses" :key="status.label">
                  <div class="flex justify-between text-xs font-black text-gray-600">
                    <span>{{ status.label }}</span>
                    <span>{{ status.value }}건</span>
                  </div>
                  <div class="mt-1 h-7 bg-gray-100">
                    <div
                      class="h-full"
                      :class="status.color"
                      :style="{ width: `${Math.min(status.value, 80)}%` }"
                    />
                  </div>
                </div>
                <p v-if="orderStatuses.length === 0" class="py-6 text-center text-xs font-bold text-gray-400">
                  데이터가 없습니다.
                </p>
              </div>
            </div>
            <div>
              <p class="mb-3 text-[11px] font-black text-gray-500">거래처 발주</p>
              <div class="space-y-3">
                <div v-for="status in purchaseStatuses" :key="status.label">
                  <div class="flex justify-between text-xs font-black text-gray-600">
                    <span>{{ status.label }}</span>
                    <span>{{ status.value }}건</span>
                  </div>
                  <div class="mt-1 h-7 bg-gray-100">
                    <div
                      class="h-full"
                      :class="status.color"
                      :style="{ width: `${Math.min(status.value, 80)}%` }"
                    />
                  </div>
                </div>
                <p v-if="purchaseStatuses.length === 0" class="py-6 text-center text-xs font-bold text-gray-400">
                  데이터가 없습니다.
                </p>
              </div>
            </div>
          </div>
        </article>

        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <AlertTriangle :size="16" />
              알림 센터 요약
            </h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="alert in alerts" :key="alert.message" class="px-4 py-3">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="px-2 py-1 text-[11px] font-black"
                  :class="alertTypeBadgeClass(alert.type)"
                  >{{ alert.type }}</span
                >
                <span class="text-[11px] font-bold text-gray-400">{{ alert.time }}</span>
              </div>
              <p class="mt-2 text-xs font-black text-gray-900">{{ alert.message }}</p>
            </div>
            <p v-if="alerts.length === 0" class="px-4 py-8 text-center text-xs font-bold text-gray-400">
              알림 데이터가 없습니다.
            </p>
          </div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

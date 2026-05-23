<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { extractErrorMessage } from '@/api/axios.js'
import { getCompanyWideInventories, getWarehouseTransfers } from '@/api/hq/inventory.js'
import { purchaseOrderApi } from '@/api/hq/purchaseOrder.js'
import { getInfrastructures } from '@/api/hq/infrastructure.js'
import { dashboardAnalyticsApi, vendorAnalyticsApi, salesAnalyticsApi } from '@/api/hq/analytics.js'
import { roleMenus } from '@/config/roleMenus.js'
import { getDefaultDateRange } from '@/views/hq/dashboard/dashboardData.js'

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

// ───────── 운영현황 상태 ─────────
const isLoading = ref(false)
const loadError = ref('')
// KPI 카드 — 카드 슬롯을 항상 보장하기 위해 ref 분리 + computed 로 구성.
// 'loading' 상태에서도 카드 자리는 즉시 그려지고, 각 API 응답 도착 시 카드별로 독립 갱신됨.
const activeStoreCount = ref(0)
const storeCardState = ref('loading')          // 'loading' | 'ok' | 'error'
const inTransitTransferCount = ref(0)
const transferCardState = ref('loading')
const kpiOps = computed(() => [
  {
    label: '운영 매장 수',
    value: storeCardState.value === 'ok' ? `${activeStoreCount.value}` : '–',
    unit: '곳',
    caption: storeCardState.value === 'ok'
      ? '상태 ACTIVE 매장'
      : (storeCardState.value === 'error' ? '불러오기 실패' : '불러오는 중…'),
    tone: 'green',
    route: '/hq/infrastructure',
    hoverCls: 'hover:border-emerald-400',
  },
  {
    label: '재고이동 진행',
    value: transferCardState.value === 'ok' ? `${inTransitTransferCount.value}` : '–',
    unit: '건',
    caption: transferCardState.value === 'ok'
      ? '실시간 · 출고 준비중 + 배송중'
      : (transferCardState.value === 'error' ? '불러오기 실패' : '불러오는 중…'),
    tone: 'blue',
    route: '/hq/inventory/warehouse-comparison',
    hoverCls: 'hover:border-blue-400',
  },
])
const inventoryRisks = ref([])
const purchaseStatusBreakdown = ref([])

// BE PurchaseOrderStatus 7단계 → 대시보드용 5단계로 그룹핑
// REQUESTED → 발주 요청
// APPROVED → 거래처 확인
// READY_TO_SHIP / IN_TRANSIT / ARRIVED → 입고 예정 (창고 도착 전까지)
// COMPLETED → 입고 완료
// CANCELLED → 취소
const PURCHASE_STATUS_META = [
  { code: 'REQUESTED', label: '발주 요청',   barCls: 'bg-amber-500' },
  { code: 'APPROVED',  label: '거래처 확인', barCls: 'bg-sky-500' },
  { code: 'SHIPPING',  label: '입고 예정',   barCls: 'bg-indigo-500' },
  { code: 'COMPLETED', label: '입고 완료',   barCls: 'bg-emerald-500' },
  { code: 'CANCELLED', label: '취소',        barCls: 'bg-gray-400' },
]

function mapPurchaseStatus(raw) {
  const s = String(raw || '').toUpperCase()
  if (s === 'READY_TO_SHIP' || s === 'IN_TRANSIT' || s === 'ARRIVED') return 'SHIPPING'
  if (s === 'REJECTED' || s === 'CANCELED') return 'CANCELLED'
  return s
}

const maxPurchaseStatusCount = computed(() =>
  Math.max(...purchaseStatusBreakdown.value.map((s) => s.count), 1),
)
const statusBarWidth = (count) =>
  Math.max(2, Math.round((count / maxPurchaseStatusCount.value) * 100))

const goTo = (path) => router.push(path)

const statusBadgeClass = (status) =>
  ({
    안전: 'bg-[#EBF5F5] text-[#004D3C]',
    부족: 'bg-amber-50 text-amber-700',
    품절: 'bg-red-50 text-red-700',
  })[status] ?? 'bg-gray-50 text-gray-500'

const toNum = (v) => Number(v || 0)
const statusByAvailableAndSafety = (available, safety) => {
  const a = toNum(available)
  const s = toNum(safety)
  if (a <= 0) return '품절'
  if (a <= s) return '부족'
  return '안전'
}

const fetchOperationData = async () => {
  isLoading.value = true
  loadError.value = ''
  storeCardState.value = 'loading'
  transferCardState.value = 'loading'

  const { fromDate, toDate } = getDefaultDateRange(30)
  // 재고이동 진행은 실시간(현재 시점 진행 중) 기준으로 표시 — 기간 필터 우회용 넓은 범위
  const TRANSFER_FROM = '2020-01-01'
  const TRANSFER_TO = '2099-12-31'

  // 4개 API — 한 번씩만 호출 (Promise 객체 재사용)
  const companyWideP = getCompanyWideInventories()
  const purchaseP = purchaseOrderApi.list({ from: fromDate, to: toDate })
  const transferP = getWarehouseTransfers({ fromDate: TRANSFER_FROM, toDate: TRANSFER_TO })
  const storeP = getInfrastructures({ type: 'STORE', status: 'ACTIVE' })

  // 운영 매장 수 카드 — 매장 API 응답 도착 즉시 갱신 (다른 API 와 무관)
  storeP
    .then((r) => {
      const stores = Array.isArray(r) ? r : (r?.content || [])
      activeStoreCount.value = stores.length
      storeCardState.value = 'ok'
    })
    .catch(() => { storeCardState.value = 'error' })

  // 재고이동 진행 카드 — 이동 API 응답 도착 즉시 갱신
  transferP
    .then((r) => {
      const transfers = Array.isArray(r) ? r : (r?.content || [])
      inTransitTransferCount.value = transfers.filter(
        (row) => String(row.status || '').toUpperCase() !== 'ARRIVED',
      ).length
      transferCardState.value = 'ok'
    })
    .catch(() => { transferCardState.value = 'error' })

  // 4개 모두 끝나면 나머지 영역 집계 + 에러 라벨
  const results = await Promise.allSettled([companyWideP, purchaseP, transferP, storeP])
  const [companyWideRes, purchaseOrdersRes, transfersRes, storesRes] = results

  const companyWide = companyWideRes.status === 'fulfilled' ? companyWideRes.value : null
  // BE 는 Page<> 객체를 반환 — content 배열 추출 (배열 직접 반환 케이스도 호환)
  const purchaseOrdersRaw = purchaseOrdersRes.status === 'fulfilled' ? purchaseOrdersRes.value : null
  const purchaseOrders = Array.isArray(purchaseOrdersRaw)
    ? purchaseOrdersRaw
    : (Array.isArray(purchaseOrdersRaw?.content) ? purchaseOrdersRaw.content : [])

  const failedLabels = []
  if (companyWideRes.status === 'rejected') failedLabels.push('전사 재고')
  if (purchaseOrdersRes.status === 'rejected') failedLabels.push('발주')
  if (transfersRes.status === 'rejected') failedLabels.push('재고이동')
  if (storesRes.status === 'rejected') failedLabels.push('매장')
  loadError.value = failedLabels.length
    ? `일부 데이터를 불러오지 못했습니다 (${failedLabels.join(', ')}). 네트워크 상태나 BE 상태를 확인해주세요.`
    : ''

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

  const statusCountMap = {}
  for (const order of purchaseOrders || []) {
    const code = mapPurchaseStatus(order.status)
    statusCountMap[code] = (statusCountMap[code] || 0) + 1
  }
  purchaseStatusBreakdown.value = PURCHASE_STATUS_META.map((s) => ({
    ...s,
    count: statusCountMap[s.code] || 0,
  }))

  // kpiOps 는 computed 라 별도 할당 불필요 — 각 카드 ref/state 가 이미 갱신됨
  isLoading.value = false
}

// ───────── 상세 분석 (Analytics) 상태 ─────────
const periodUnit = ref('연간')
const periodOptions = ['월간', '연간']
const PERIOD_MAP = { '월간': 'MONTH', '연간': 'YEAR' }

const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)
const yearOptions = computed(() => {
  const out = []
  for (let i = 0; i < 5; i++) out.push(now.getFullYear() - i)
  return out
})
const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const statsData = ref(null)
const statsLoading = ref(false)
const statsError = ref('')

function pad2(n) { return String(n).padStart(2, '0') }
function fmtDate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }

function resolveDateRange() {
  if (periodUnit.value === '월간') {
    const fromDate = new Date(selectedYear.value, selectedMonth.value - 1, 1)
    const toDate = new Date(selectedYear.value, selectedMonth.value, 0)
    return { from: fmtDate(fromDate), to: fmtDate(toDate) }
  }
  const fromDate = new Date(selectedYear.value, 0, 1)
  const toDate = new Date(selectedYear.value, 11, 31)
  return { from: fmtDate(fromDate), to: fmtDate(toDate) }
}

async function fetchAnalyticsData() {
  statsLoading.value = true
  statsError.value = ''
  try {
    const { from, to } = resolveDateRange()
    const params = {
      period: PERIOD_MAP[periodUnit.value] ?? 'YEAR',
      from,
      to,
    }
    try {
      statsData.value = await dashboardAnalyticsApi.get(params)
    } catch {
      // 일시 지연/경합 상황에서 flaky 완화를 위해 1회 짧은 재시도.
      await new Promise((resolve) => setTimeout(resolve, 300))
      statsData.value = await dashboardAnalyticsApi.get(params)
    }
  } catch (e) {
    console.error('[OperationStatusView] analytics fetch failed', e)
    statsError.value = '분석 데이터를 불러오지 못했습니다.'
    statsData.value = null
  } finally {
    statsLoading.value = false
  }
}

// ───────── 월별 판매 수량 (단일 API 호출 · FE 월별 집계) ─────────
// BE의 SalesAnalyticsDto.TrendPoint에 quantity 필드 추가로 1회 호출에서 모든 일자별 수량 수신.
// FE는 label "MM/dd"에서 월을 추출해 12개 버킷으로 합산.
const monthlyQuantities = ref(Array(12).fill(0))
const monthlyQtyLoading = ref(false)

async function fetchMonthlyQuantities() {
  monthlyQtyLoading.value = true
  try {
    const year = selectedYear.value
    const from = `${year}-01-01`
    const to = `${year}-12-31`
    const data = await salesAnalyticsApi.get({ period: 'YEAR', from, to })

    const buckets = Array(12).fill(0)
    for (const point of (data?.trend?.current ?? [])) {
      const monthToken = String(point?.label ?? '').split('/')[0]
      const m = parseInt(monthToken, 10)
      if (m >= 1 && m <= 12) {
        buckets[m - 1] += Number(point?.quantity ?? 0)
      }
    }
    monthlyQuantities.value = buckets
  } catch {
    monthlyQuantities.value = Array(12).fill(0)
  } finally {
    monthlyQtyLoading.value = false
  }
}

const monthlySalesChartData = computed(() => ({
  labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  datasets: [
    {
      label: '판매 수량',
      data: monthlyQuantities.value,
      backgroundColor: '#10b981',
      borderRadius: 4,
      maxBarThickness: 36,
    },
  ],
}))

const monthlySalesChartOptions = {
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
      callbacks: { label: (ctx) => `${Number(ctx.parsed.y).toLocaleString()}개` },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 }, callback: (v) => Number(v).toLocaleString() },
    },
  },
}

// ───────── 거래처/소재 분석 (소재 매출 비중 도넛) ─────────
const vendorStats = ref(null)

async function fetchVendorStats() {
  try {
    const { from, to } = resolveDateRange()
    vendorStats.value = await vendorAnalyticsApi.get({
      period: PERIOD_MAP[periodUnit.value] ?? 'YEAR',
      from, to,
    })
  } catch (e) {
    console.error('[OperationStatusView] vendor analytics fetch failed', e)
    vendorStats.value = null
  }
}

watch([periodUnit, selectedYear, selectedMonth], () => {
  fetchAnalyticsData()
  fetchVendorStats()
})
watch(selectedYear, fetchMonthlyQuantities)

const kpi = computed(() => statsData.value?.kpi ?? {})

function formatKoreanMoney(won) {
  if (won == null || isNaN(won)) return '₩0'
  return `₩${Number(won).toLocaleString('ko-KR')}`
}
function formatTrendPct(pct) {
  if (pct == null || isNaN(pct)) return '—'
  const n = Number(pct)
  if (n > 0) return `↗ +${n.toFixed(1)}%`
  if (n < 0) return `↘ ${n.toFixed(1)}%`
  return '→ 0.0%'
}

// ───────── 소재 매출 비중 도넛 ─────────
const MATERIAL_PALETTE = [
  '#059669', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444',
  '#10b981', '#3b82f6', '#eab308', '#c084fc', '#f87171',
]

const circularMaterialStats = computed(() => {
  const list = (vendorStats.value?.circularMaterials ?? []).map((m) => ({
    name: m.name,
    units: Number(m.units ?? 0),
    sales: Number(m.sales ?? 0),
    eco: !!m.eco,
  }))
  const sorted = [...list].sort((a, b) => b.sales - a.sales)
  const total = sorted.reduce((s, x) => s + x.sales, 0) || 1
  return sorted.map((item) => ({
    ...item,
    sharePct: parseFloat(((item.sales / total) * 100).toFixed(1)),
  }))
})

const materialShareList = computed(() =>
  circularMaterialStats.value.map((m, i) => ({
    name: m.name,
    sales: m.sales,
    share: m.sharePct,
    color: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length],
  })),
)

// 순환재고 판매 건수 = 모든 소재의 units 합계
const circularSalesCount = computed(() =>
  circularMaterialStats.value.reduce((sum, m) => sum + (m.units || 0), 0),
)

const materialDoughnutData = computed(() => ({
  labels: materialShareList.value.map((m) => m.name),
  datasets: [{
    data: materialShareList.value.map((m) => m.share),
    backgroundColor: materialShareList.value.map((m) => m.color),
    borderWidth: 2,
    borderColor: '#fff',
  }],
}))

const materialDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const item = circularMaterialStats.value[ctx.dataIndex]
          const lines = [`${ctx.label}: ${ctx.parsed}%`]
          if (item) lines.push(`판매량: ${Number(item.units ?? 0).toLocaleString()}건`)
          return lines
        },
      },
    },
  },
  cutout: '60%',
}

onMounted(() => {
  fetchOperationData()
  fetchAnalyticsData()
  fetchVendorStats()
  fetchMonthlyQuantities()
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
      <!-- 헤더 -->
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              HQ Operation Dashboard
            </p>
            <h1 class="mt-1 text-xl font-black text-gray-950">본사 대시보드</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              운영 KPI·월별 판매·재고 위험·소재 매출·발주 상태를 한 화면에서 확인합니다.
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

      <!-- 로딩/에러 안내 -->
      <p v-if="loadError" class="border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
        {{ loadError }}
      </p>
      <p v-else-if="isLoading" class="border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-500">
        운영 현황 데이터를 불러오는 중입니다.
      </p>

      <!-- 운영 KPI + 통계 카드 -->
      <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="stat in kpiOps"
          :key="stat.label"
          class="group border border-gray-200 bg-white px-4 py-3 shadow-sm transition"
          :class="stat.route ? ['cursor-pointer', stat.hoverCls || 'hover:border-gray-400', 'hover:-translate-y-0.5', 'hover:shadow-md'] : []"
          @click="stat.route && router.push(stat.route)"
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
          <div class="mt-2 flex items-center justify-between gap-2">
            <p class="truncate text-[11px] font-bold text-gray-400">{{ stat.caption }}</p>
            <span
              v-if="stat.route"
              class="shrink-0 text-[10px] font-black text-[#004D3C] group-hover:underline"
            >자세히 보기 →</span>
          </div>
        </article>

        <!-- 상품 판매량 (분석 점프 카드) -->
        <article
          class="group cursor-pointer border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md"
          @click="router.push('/hq/analytics/sales')"
        >
          <p class="text-[11px] font-bold text-gray-500">상품 판매량</p>
          <div class="mt-3 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <span class="text-2xl font-black text-gray-950">{{ Number(kpi.totalSalesQty ?? 0).toLocaleString() }}</span>
              <span class="ml-1 text-xs font-black text-gray-400">개</span>
            </div>
            <span class="h-2.5 w-2.5 shrink-0 bg-emerald-400" />
          </div>
          <div class="mt-2 flex items-center justify-between gap-2">
            <p class="truncate text-[11px] font-bold text-gray-400">{{ formatTrendPct(kpi.totalRevenueTrendPct) }} · 매출 1위 {{ kpi.topProductName || '-' }}</p>
            <span class="shrink-0 text-[10px] font-black text-[#004D3C] group-hover:underline">자세히 보기 →</span>
          </div>
        </article>

        <!-- 순환재고 판매량 (분석 점프 카드) -->
        <article
          class="group cursor-pointer border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md"
          @click="router.push('/hq/analytics/vendors')"
        >
          <p class="text-[11px] font-bold text-gray-500">순환재고 판매량</p>
          <div class="mt-3 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <span class="text-2xl font-black text-gray-950">{{ circularSalesCount.toLocaleString() }}</span>
              <span class="ml-1 text-xs font-black text-gray-400">건</span>
            </div>
            <span class="h-2.5 w-2.5 shrink-0 bg-blue-400" />
          </div>
          <div class="mt-2 flex items-center justify-between gap-2">
            <p class="truncate text-[11px] font-bold text-gray-400">활성 거래처 {{ Number(kpi.activeVendorCount ?? 0).toLocaleString() }}곳 · TOP {{ (kpi.topVendorName ?? '').trim() || '-' }}</p>
            <span class="shrink-0 text-[10px] font-black text-[#004D3C] group-hover:underline">자세히 보기 →</span>
          </div>
        </article>

        <article
          v-if="kpiOps.length === 0"
          class="border border-gray-200 bg-white p-3 text-xs font-bold text-gray-400 sm:col-span-2 lg:col-span-4"
        >
          표시할 지표가 없습니다.
        </article>
      </section>


      <!-- 월별 판매 수량 + 전사 재고 위험 -->
      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article class="flex flex-col border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
                📦 월별 판매 수량
              </h2>
              <p class="mt-1 text-[11px] font-bold text-gray-400">
                {{ selectedYear }}년 월별 상품 판매 수량 합계
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="monthlyQtyLoading" class="text-[11px] font-bold text-emerald-600">집계 중…</span>
              <button
                type="button"
                class="text-xs font-black text-[#004D3C] hover:underline"
                @click="router.push('/hq/analytics/sales')"
              >
                판매량 조회
              </button>
            </div>
          </div>
          <div class="flex-1 px-4 py-4" style="min-height: 280px;">
            <BarChart :data="monthlySalesChartData" :options="monthlySalesChartOptions" />
          </div>
        </article>

        <article class="flex flex-col border border-gray-200 bg-white shadow-sm">
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
          <div class="flex-1 overflow-y-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-3 py-2 font-black">품목</th>
                  <th class="px-3 py-2 text-right font-black">현재/안전</th>
                  <th class="px-3 py-2 font-black">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in inventoryRisks"
                  :key="`${item.item}-${item.location}`"
                  class="hover:bg-[#EBF5F5]/60"
                >
                  <td class="truncate px-3 py-2 font-black text-gray-900">{{ item.item }}</td>
                  <td class="px-3 py-2 text-right font-black text-gray-900">
                    {{ item.stock }} / {{ item.safety }}
                  </td>
                  <td class="px-3 py-2">
                    <span
                      class="px-2 py-0.5 text-[10px] font-black"
                      :class="statusBadgeClass(item.status)"
                      >{{ item.status }}</span
                    >
                  </td>
                </tr>
                <tr v-if="inventoryRisks.length === 0">
                  <td colspan="3" class="px-3 py-8 text-center text-xs font-bold text-gray-400">
                    재고 위험 데이터가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <!-- 소재 매출 비중 + 발주 상태별 진행 -->
      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
                🥧 소재 매출 비중
              </h2>
              <p class="mt-1 text-[11px] font-bold text-gray-400">순환재고 소재별 매출 점유율 (현재 필터 기준)</p>
            </div>
            <button
              type="button"
              class="text-xs font-black text-[#004D3C] hover:underline"
              @click="router.push('/hq/analytics/vendors')"
            >
              순환재고 판매량 조회
            </button>
          </div>
          <div class="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div class="min-h-[240px]">
              <DoughnutChart
                v-if="materialShareList.length"
                :data="materialDoughnutData"
                :options="materialDoughnutOptions"
                :height="240"
              />
              <p v-else class="py-12 text-center text-[11px] font-bold text-gray-400">소재 데이터가 없습니다.</p>
            </div>
            <ul v-if="materialShareList.length" class="grid grid-cols-1 gap-x-3 gap-y-1 self-center text-[11px] sm:grid-cols-2">
              <li
                v-for="mat in materialShareList"
                :key="mat.name"
                class="flex items-center justify-between gap-2 border-b border-dashed border-gray-100 py-1"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <span class="inline-block h-2 w-2 shrink-0" :style="{ backgroundColor: mat.color }"></span>
                  <span class="truncate font-bold text-gray-700">{{ mat.name }}</span>
                </span>
                <span class="shrink-0 text-gray-500">{{ mat.share }}%</span>
              </li>
            </ul>
          </div>
        </article>

        <article class="flex flex-col border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
                📦 발주 상태별 진행
              </h2>
              <p class="mt-1 text-[11px] font-bold text-gray-400">물류창고 발주 단계별 건수</p>
            </div>
            <button
              type="button"
              class="text-xs font-black text-[#004D3C] hover:underline"
              @click="goTo('/hq/purchase-orders')"
            >
              발주 관리
            </button>
          </div>
          <div class="flex flex-1 flex-col justify-center gap-3 px-4 py-4">
            <div v-for="s in purchaseStatusBreakdown" :key="s.code">
              <div class="mb-1 flex items-center justify-between text-[11px]">
                <span class="font-bold text-gray-600">{{ s.label }}</span>
                <span class="font-black text-gray-900">{{ s.count }}건</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-gray-100">
                <div :class="['h-full rounded-full', s.barCls]" :style="{ width: `${statusBarWidth(s.count)}%` }"></div>
              </div>
            </div>
            <p
              v-if="!purchaseStatusBreakdown.some((s) => s.count > 0)"
              class="py-6 text-center text-[11px] font-bold text-gray-400"
            >
              발주 데이터가 없습니다.
            </p>
          </div>
        </article>
      </section>

    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { salesAnalyticsApi } from '@/api/hq/analytics.js'
import { getInfrastructures } from '@/api/hq/infrastructure.js'
import { getCategories } from '@/api/hq/category.js'
import {
  BarChart3,
  ShoppingBag,
  TrendingUp,
  Award,
  Filter,
  PieChart,
  Package,
  Tag,
  Search,
  Store,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('판매량 통계')


// ─── 탭 (URL 쿼리스트링과 동기화) ──────────────────────────────────────
const tabs = [
  { key: 'product', label: '품목별', icon: Package },
  { key: 'productDetail', label: '상품별', icon: Tag },
]

const activeTab = ref(route.query.tab && tabs.some((t) => t.key === route.query.tab) ? route.query.tab : 'product')

const setTab = (key) => {
  activeTab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}

watch(() => route.query.tab, (tab) => {
  if (tab && tabs.some((t) => t.key === tab)) activeTab.value = tab
})

// ─── 공통 필터 바 ──────────────────────────────────────────────────────
// ─── 기간 단위별 dateRange 헬퍼 ──────────────────────────────────────
//   일간 → YYYY-MM-DD,  월간 → YYYY-MM,  연간 → YYYY
const pad2 = (n) => String(n).padStart(2, '0')

function defaultDateForPeriod(unit) {
  const now = new Date()
  if (unit === '일간') return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
  if (unit === '월간') return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
  if (unit === '연간') return String(now.getFullYear())
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`
}

const periodUnit = ref('연간')
const storeFilter = ref('전사 통합')
const categoryFilter = ref('전체')
const dateRange = ref(defaultDateForPeriod('연간'))

const periodOptions = ['일간', '월간', '연간']

// 기간 단위별 input type 과 라벨
const periodInputType = computed(() => {
  if (periodUnit.value === '일간') return 'date'
  if (periodUnit.value === '월간') return 'month'
  return 'number'   // 연간
})

const periodInputLabel = computed(() => {
  if (periodUnit.value === '일간') return '기준 일'
  if (periodUnit.value === '월간') return '기준 월'
  return '기준 연'
})

// ─── 매장 / 카테고리 — BE 동적 로드 ──────────────────────────────────
const stores = ref([])         // BE infrastructure 응답 [{ code, name, locationType, ... }]
const rootCategories = ref([]) // BE category L1 응답 [{ code, name, level, ... }]

async function loadStores() {
  try {
    const list = await getInfrastructures({ type: 'STORE', status: 'ACTIVE' })
    stores.value = Array.isArray(list) ? list : []
  } catch (e) {
    console.error('[SalesView] loadStores failed', e)
    stores.value = []
  }
}

async function loadCategories() {
  try {
    const list = await getCategories()
    // L1 (ROOT) 만 필터 — BE 의 level 필드 (ROOT/CHILD)
    rootCategories.value = (Array.isArray(list) ? list : [])
      .filter((c) => c.level === 'ROOT')
  } catch (e) {
    console.error('[SalesView] loadCategories failed', e)
    rootCategories.value = []
  }
}

const storeOptions = computed(() => [
  '전사 통합',
  ...stores.value.map((s) => s.name),
])

const categoryOptions = computed(() => [
  '전체',
  ...rootCategories.value.map((c) => c.name),
])

// 매장 라벨 → BE infrastructure code 매핑 (BE 응답에서 자동 도출)
const storeCodeByLabel = computed(() => {
  const map = { '전사 통합': null }
  for (const s of stores.value) map[s.name] = s.code
  return map
})

const PERIOD_MAP = {
  '일간': 'DAY', '월간': 'MONTH', '연간': 'YEAR',
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// ─── BE 연동 — 판매량 통계 ──────────────────────────────────────────────
const salesData = ref(null)
const loading = ref(false)
const loadError = ref('')

function resolveDateRange() {
  const v = dateRange.value ?? ''
  const unit = periodUnit.value

  // 일간: YYYY-MM-DD → from=to=같은 날짜
  if (unit === '일간') {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) return { from: v, to: v }
  }

  // 월간: YYYY-MM → 1일~말일
  if (unit === '월간') {
    const m = v.match(/^(\d{4})-(\d{2})$/)
    if (m) {
      const lastDay = new Date(parseInt(m[1]), parseInt(m[2]), 0).getDate()
      return { from: `${m[1]}-${m[2]}-01`, to: `${m[1]}-${m[2]}-${pad2(lastDay)}` }
    }
  }

  // 연간: YYYY → 1월 1일~12월 31일
  if (unit === '연간') {
    const m = v.match(/^(\d{4})$/)
    if (m) return { from: `${m[1]}-01-01`, to: `${m[1]}-12-31` }
  }

  // fallback: 오늘 월
  const today = new Date()
  const y = today.getFullYear()
  const mo = pad2(today.getMonth() + 1)
  const lastDay = new Date(y, today.getMonth() + 1, 0).getDate()
  return { from: `${y}-${mo}-01`, to: `${y}-${mo}-${pad2(lastDay)}` }
}

async function fetchSalesData() {
  loading.value = true
  loadError.value = ''
  try {
    const { from, to } = resolveDateRange()
    salesData.value = await salesAnalyticsApi.get({
      period: PERIOD_MAP[periodUnit.value] ?? 'MONTH',
      from, to,
      storeCode: storeCodeByLabel.value[storeFilter.value] ?? null,
      mainCategory: categoryFilter.value === '전체' ? null : categoryFilter.value,
    })
  } catch (e) {
    console.error('[SalesView] fetch failed', e)
    loadError.value = '판매 통계를 불러오지 못했습니다.'
    salesData.value = null
  } finally {
    loading.value = false
  }
}

// periodUnit 변경 시 dateRange 를 새 기간 단위에 맞는 default 로 리셋
//  → 그러면 dateRange watch 가 fetchSalesData 자동 트리거
watch(periodUnit, (newUnit) => {
  dateRange.value = defaultDateForPeriod(newUnit)
})

watch([storeFilter, categoryFilter, dateRange], fetchSalesData)
onMounted(async () => {
  // 1) 매장/카테고리 마스터 데이터 먼저 로드 (드롭다운용)
  await Promise.all([loadStores(), loadCategories()])
  // 2) 판매 통계 호출
  await fetchSalesData()
})

// ─── KPI (모든 탭 공유) — BE 응답 기반 ────────────────────────────────
const signed = (n) => (n > 0 ? `+${n}` : `${n}`)
const trendStr = (pct) => {
  if (pct == null) return '—'
  const v = Number(pct)
  if (Number.isNaN(v)) return '—'
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

const kpiSummary = computed(() => {
  const k = salesData.value?.kpi
  const empty = (label, unit, icon, color, iconBg, iconCls) => ({
    label, value: '—', unit, trend: '—', icon, color, iconBg, iconCls,
  })
  if (!k) {
    return [
      empty('총 매출',         '원',  TrendingUp,  'text-emerald-700', 'bg-emerald-50', 'text-emerald-600'),
      empty('판매 수량',       '개',  ShoppingBag, 'text-blue-700',    'bg-blue-50',    'text-blue-600'),
      empty('활성 매장 수',    '개',  Store,       'text-violet-700',  'bg-violet-50',  'text-violet-600'),
      empty('베스트 카테고리', '',    BarChart3,   'text-amber-700',   'bg-amber-50',   'text-amber-600'),
    ]
  }
  return [
    {
      label: '총 매출',
      value: '₩' + Number(k.totalRevenue ?? 0).toLocaleString('ko-KR'),
      unit: '',
      trend: trendStr(k.totalRevenueTrendPct),
      icon: TrendingUp, color: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600',
    },
    {
      label: '판매 수량',
      value: (k.totalQuantity ?? 0).toLocaleString(),
      unit: '개',
      trend: trendStr(k.totalQuantityTrendPct),
      icon: ShoppingBag, color: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600',
    },
    {
      label: '활성 매장 수',
      value: String(k.activeStoreCount ?? 0),
      unit: '개',
      trend: `/ ${k.totalStoreCount ?? 0}개 (${signed(k.activeStoreCountDelta ?? 0)})`,
      icon: Store, color: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600',
    },
    {
      label: '베스트 카테고리',
      value: k.bestCategoryName || '—',
      unit: '',
      trend: k.bestCategorySharePct != null ? `비중 ${Number(k.bestCategorySharePct).toFixed(1)}%` : '—',
      icon: BarChart3, color: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600',
    },
  ]
})

// ─── 개요 탭: 일자별 추이 — BE trend 기반 ─────────────────────────────
const overviewTrendData = computed(() => {
  const cur = salesData.value?.trend?.current ?? []
  const prev = salesData.value?.trend?.previous ?? []
  return {
    labels: cur.map((p) => p.label),
    datasets: [
      {
        label: '매출 (M원)',
        data: cur.map((p) => Number(((p.revenue ?? 0) / 1_000_000).toFixed(2))),
        borderColor: '#059669',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.35,
        fill: true,
      },
      {
        label: '전기 동기',
        data: prev.map((p) => Number(((p.revenue ?? 0) / 1_000_000).toFixed(2))),
        borderColor: '#94a3b8',
        backgroundColor: 'rgba(148, 163, 184, 0.05)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 2,
        tension: 0.35,
        fill: false,
      },
    ],
  }
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, labels: { font: { size: 11 }, usePointStyle: true } },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#6ee7b7',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => v + 'M' } },
  },
  interaction: { mode: 'index', intersect: false },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` },
    },
  },
  cutout: '60%',
}

// ─── 품목별 탭: BE subCategoryStats → 기존 형태로 매핑 ────────────────
//   sales 단위: BE 의 salesAmount 그대로 (원). 차트만 M 단위로 변환.
const products = computed(() => {
  const stats = salesData.value?.subCategoryStats ?? []
  return stats.map((s) => ({
    category: s.mainCategory,
    name: s.subCategory,
    units: s.quantity ?? 0,
    sales: Number(s.salesAmount ?? 0),
  }))
})

const PRODUCT_CATEGORY_COLORS = {
  '상의': '#0ea5e9',
  '바지': '#f59e0b',
  '치마': '#a855f7',
  '아우터': '#059669',
}

const productStats = computed(() => {
  const list = products.value
  const filtered = categoryFilter.value === '전체'
    ? list
    : list.filter((p) => p.category === categoryFilter.value)
  const sorted = [...filtered].sort((a, b) => b.sales - a.sales)
  const total = sorted.reduce((s, x) => s + x.sales, 0) || 1
  return sorted.map((item) => ({
    ...item,
    sharePct: parseFloat(((item.sales / total) * 100).toFixed(1)),
  }))
})

// BE 응답 (categorySummary) 그대로 매핑 — FE 재계산 없음
const categorySummary = computed(() => {
  const summary = salesData.value?.categorySummary ?? []
  return summary.map((s) => ({
    category: s.mainCategory,
    productCount: s.productCount ?? 0,
    sales: Number(s.salesAmount ?? 0),
    units: s.quantity ?? 0,
    sharePct: Number(s.sharePct ?? 0),
    color: PRODUCT_CATEGORY_COLORS[s.mainCategory] ?? '#6b7280',
  }))
})

const categoryDoughnutData = computed(() => ({
  labels: categorySummary.value.map((c) => c.category),
  datasets: [{
    data: categorySummary.value.map((c) => c.sharePct),
    backgroundColor: categorySummary.value.map((c) => c.color),
    borderWidth: 2,
    borderColor: '#fff',
  }],
}))

const productBarData = computed(() => ({
  labels: productStats.value.slice(0, 10).map((p) => p.name),
  datasets: [{
    label: '매출 (M원)',
    // 차트만 M 단위로 압축 표시 (raw 는 원)
    data: productStats.value.slice(0, 10).map((p) => Number((p.sales / 1_000_000).toFixed(2))),
    backgroundColor: productStats.value.slice(0, 10).map((p) => PRODUCT_CATEGORY_COLORS[p.category]),
    borderRadius: 4,
  }],
}))

// ─── 상품별 탭: BE productDetailsBySubCategory → 기존 형태로 매핑 ───
//   sales 단위: BE 의 salesAmount 그대로 (원). 차트만 M 단위로 변환.
const productDetails = computed(() => {
  const obj = salesData.value?.productDetailsBySubCategory ?? {}
  const out = {}
  for (const [subCat, list] of Object.entries(obj)) {
    out[subCat] = (list ?? []).map((p) => ({
      name: p.productName,
      units: p.quantity ?? 0,
      sales: Number(p.salesAmount ?? 0),
    }))
  }
  return out
})

// 카테고리 → 품목 매핑 — BE subCategoryStats 에서 자동 도출 (BE 추가 호출 0)
const PRODUCT_TYPE_MAP = computed(() => {
  const map = {}
  for (const s of salesData.value?.subCategoryStats ?? []) {
    if (!map[s.mainCategory]) map[s.mainCategory] = []
    if (!map[s.mainCategory].includes(s.subCategory)) {
      map[s.mainCategory].push(s.subCategory)
    }
  }
  return map
})

// ─── 상품별 탭 필터 ────────────────────────────────────────────────────
const productTypeFilter = ref('전체')
const productKeyword = ref('')

const productTypeOptions = computed(() => {
  if (categoryFilter.value === '전체') {
    return ['전체', ...Object.keys(productDetails.value)]
  }
  return ['전체', ...(PRODUCT_TYPE_MAP.value[categoryFilter.value] ?? [])]
})

// 평탄화: 모든 상품 + 카테고리/품목 정보 포함
const flatProducts = computed(() => {
  const arr = []
  for (const [productType, items] of Object.entries(productDetails.value)) {
    const cat = Object.entries(PRODUCT_TYPE_MAP.value).find(([_, types]) => types.includes(productType))?.[0] ?? ''
    for (const item of items) {
      arr.push({ ...item, productType, category: cat })
    }
  }
  return arr
})

const filteredProductDetails = computed(() => {
  let list = flatProducts.value
  if (categoryFilter.value !== '전체') {
    list = list.filter((p) => p.category === categoryFilter.value)
  }
  if (productTypeFilter.value !== '전체') {
    list = list.filter((p) => p.productType === productTypeFilter.value)
  }
  if (productKeyword.value.trim()) {
    const kw = productKeyword.value.trim().toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(kw))
  }
  return list
})

// 품목별로 그룹핑 (테이블 표시용)
const productDetailsByType = computed(() => {
  const groups = {}
  for (const p of filteredProductDetails.value) {
    if (!groups[p.productType]) {
      groups[p.productType] = { items: [], category: p.category }
    }
    groups[p.productType].items.push(p)
  }
  return Object.entries(groups).map(([type, { items, category }]) => {
    const sortedItems = [...items].sort((a, b) => b.sales - a.sales)
    const subtotal = sortedItems.reduce((s, x) => s + x.sales, 0)
    const totalUnits = sortedItems.reduce((s, x) => s + x.units, 0)
    return {
      productType: type,
      category,
      categoryColor: PRODUCT_CATEGORY_COLORS[category] ?? '#6b7280',
      items: sortedItems,
      subtotal,
      totalUnits,
    }
  })
})

// TOP 10 상품 막대 차트
const top10ProductDetails = computed(() =>
  [...filteredProductDetails.value].sort((a, b) => b.sales - a.sales).slice(0, 10),
)

const productDetailBarData = computed(() => ({
  labels: top10ProductDetails.value.map((p) => p.name),
  datasets: [{
    label: '매출 (M원)',
    // 차트만 M 단위로 압축 표시 (raw 는 원)
    data: top10ProductDetails.value.map((p) => Number((p.sales / 1_000_000).toFixed(2))),
    backgroundColor: top10ProductDetails.value.map((p) => PRODUCT_CATEGORY_COLORS[p.category] ?? '#6b7280'),
    borderRadius: 4,
  }],
}))

const productDetailBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `₩${ctx.parsed.x}M` } },
  },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => '₩' + v + 'M' } },
    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

// 상품별 KPI — sales 는 raw 원 단위
const productDetailKpi = computed(() => {
  const list = filteredProductDetails.value
  const totalCount = list.length
  const totalSales = list.reduce((s, p) => s + p.sales, 0)
  const totalUnits = list.reduce((s, p) => s + p.units, 0)
  const top = [...list].sort((a, b) => b.sales - a.sales)[0]
  return { totalCount, totalSales, totalUnits, topProduct: top }
})

// 카테고리별로 그룹핑된 품목 (테이블용)
const productsByCategory = computed(() => {
  const cats = rootCategories.value.length > 0
    ? rootCategories.value.map((c) => c.name)
    : ['상의', '바지', '치마', '아우터']  // fallback
  return cats
    .filter((cat) => categoryFilter.value === '전체' || cat === categoryFilter.value)
    .map((cat) => {
      const items = products.value
        .filter((p) => p.category === cat)
        .sort((a, b) => b.sales - a.sales)
      const subtotal = items.reduce((s, x) => s + x.sales, 0)
      return { category: cat, color: PRODUCT_CATEGORY_COLORS[cat], items, subtotal }
    })
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx) => `₩${ctx.parsed.x}M` },
    },
  },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => v + 'M' } },
    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
  >
    <div class="flex flex-col gap-4">
      <!-- ━━━━━━━ 페이지 헤더 ━━━━━━━ -->
      <section class="flex flex-wrap items-end justify-between gap-3 border border-gray-300 bg-white p-4 shadow-sm">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">SALES ANALYTICS</p>
          <h2 class="mt-1 flex items-center gap-2 text-base font-black text-gray-900">
            <BarChart3 :size="18" class="text-[#004D3C]" />
            판매량 통계
          </h2>
          <p class="mt-1 text-[11px] text-gray-500">기준일: {{ dateLabel }} · 소재별·시간·계절을 한 화면에서 비교</p>
        </div>
      </section>

      <!-- ━━━━━━━ 공통 필터 바 ━━━━━━━ -->
      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white p-3 shadow-sm">
        <div class="flex items-center gap-1.5 border-r border-gray-200 pr-3 text-[11px] font-bold text-gray-500">
          <Filter :size="13" />
          공통 필터
        </div>

        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          기간 단위
          <select
            v-model="periodUnit"
            class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
          >
            <option v-for="p in periodOptions" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>

        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          {{ periodInputLabel }}
          <input
            v-model="dateRange"
            :type="periodInputType"
            :min="periodInputType === 'number' ? 2020 : undefined"
            :max="periodInputType === 'number' ? 2099 : undefined"
            class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
          />
        </label>

        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          매장
          <select
            v-model="storeFilter"
            class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
          >
            <option v-for="s in storeOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>

        <div class="ml-auto flex items-center gap-2 text-[10px] font-bold text-gray-400">
          <span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
          모든 탭에 동일하게 적용됩니다
        </div>
      </section>

      <!-- ━━━━━━━ KPI 4개 (모든 탭 공유) ━━━━━━━ -->
      <section class="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <div
          v-for="kpi in kpiSummary"
          :key="kpi.label"
          class="border border-gray-300 bg-white p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">{{ kpi.label }}</p>
            <div :class="[kpi.iconBg, 'flex h-8 w-8 items-center justify-center']">
              <component :is="kpi.icon" :size="14" :class="kpi.iconCls" />
            </div>
          </div>
          <p class="mt-2 text-xl font-black" :class="kpi.color">
            {{ kpi.value }}
            <span class="ml-1 text-xs font-bold text-gray-500">{{ kpi.unit }}</span>
          </p>
          <p class="mt-1 text-[10px] font-bold text-emerald-600">↗ {{ kpi.trend }}</p>
        </div>
      </section>

      <!-- ━━━━━━━ 탭 네비게이션 ━━━━━━━ -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center border-b border-gray-200">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="relative flex items-center gap-2 px-5 py-3 text-xs font-bold transition-colors"
            :class="activeTab === tab.key ? 'text-[#004D3C]' : 'text-gray-500 hover:bg-gray-50'"
            @click="setTab(tab.key)"
          >
            <component :is="tab.icon" :size="14" />
            {{ tab.label }}
            <span
              v-if="activeTab === tab.key"
              class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#004D3C]"
            ></span>
          </button>
        </div>

        <!-- ━━━━━━━ 탭: 품목별 ━━━━━━━ -->
        <div v-if="activeTab === 'product'" class="p-6">
          <!-- 카테고리 요약 카드 4개 -->
          <div class="grid gap-6 grid-cols-2 lg:grid-cols-4">
            <div
              v-for="cat in categorySummary"
              :key="cat.category"
              class="border border-gray-300 bg-white p-5 shadow-sm"
            >
              <div class="flex items-center justify-between">
                <span
                  class="px-2 py-0.5 text-[10px] font-black text-white"
                  :style="{ backgroundColor: cat.color }"
                >
                  {{ cat.category }}
                </span>
                <span class="text-[10px] font-bold text-gray-400">{{ cat.productCount }}개 품목</span>
              </div>
              <p class="mt-2 break-all text-xl font-black leading-tight" :style="{ color: cat.color }">
                ₩{{ Number(cat.sales).toLocaleString('ko-KR') }}
              </p>
              <div class="mt-2.5 flex flex-col gap-1 text-[10px]">
                <span class="whitespace-nowrap text-gray-500">{{ cat.units.toLocaleString() }}개 판매</span>
                <span class="whitespace-nowrap text-right font-bold" :style="{ color: cat.color }">{{ cat.sharePct }}%</span>
              </div>
              <div class="mt-2 h-1.5 w-full bg-gray-100">
                <div class="h-full transition-all" :style="{ width: `${cat.sharePct}%`, backgroundColor: cat.color }"></div>
              </div>
            </div>
          </div>

          <!-- 카테고리 필터 -->
          <div class="mt-6 flex flex-wrap items-center gap-5">
            <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
              카테고리
              <select
                v-model="categoryFilter"
                class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
              >
                <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
          </div>

          <div class="mt-6 grid gap-6 lg:grid-cols-3">
            <!-- 좌측: 품목별 매출 TOP 10 막대 -->
            <div class="border border-gray-200 bg-white p-5 lg:col-span-2">
              <header class="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                  <Package :size="14" class="text-emerald-600" />
                  품목별 매출 TOP 10
                </h3>
                <div class="flex items-center gap-2 text-[10px]">
                  <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#0ea5e9"></span>상의</span>
                  <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#f59e0b"></span>바지</span>
                  <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#a855f7"></span>치마</span>
                  <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#059669"></span>아우터</span>
                </div>
              </header>
              <BarChart :data="productBarData" :options="barOptions" :height="320" />
            </div>

            <!-- 우측: 카테고리별 비중 도넛 -->
            <div class="border border-gray-200 bg-white p-5">
              <header class="mb-3 border-b border-gray-100 pb-2">
                <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                  <PieChart :size="14" class="text-blue-600" />
                  카테고리별 비중
                </h3>
              </header>
              <DoughnutChart :data="categoryDoughnutData" :options="doughnutOptions" :height="240" />
              <ul class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <li v-for="cat in categorySummary" :key="cat.category" class="flex items-center justify-between gap-2 border-b border-dashed border-gray-100 py-1">
                  <span class="flex min-w-0 items-center gap-2">
                    <span class="inline-block h-2 w-2 shrink-0" :style="{ backgroundColor: cat.color }"></span>
                    <span class="truncate font-bold text-gray-700">{{ cat.category }}</span>
                  </span>
                  <span class="shrink-0 text-gray-500">{{ cat.sharePct }}%</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- 카테고리별 품목 상세 테이블 -->
          <div class="mt-6 space-y-5">
            <div
              v-for="grp in productsByCategory"
              :key="grp.category"
              class="border border-gray-200 bg-white"
            >
              <header class="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                <h3 class="flex items-center gap-2 text-xs font-black text-gray-800">
                  <span class="inline-block h-3 w-3" :style="{ backgroundColor: grp.color }"></span>
                  {{ grp.category }}
                </h3>
                <span class="text-[10px] font-bold text-gray-400">
                  {{ grp.items.length }}개 품목 · 합계 ₩{{ Number(grp.subtotal).toLocaleString('ko-KR') }}
                </span>
              </header>
              <div class="overflow-auto">
                <table class="w-full min-w-[480px] text-xs">
                  <thead class="bg-gray-100 text-[10px] text-gray-500">
                    <tr>
                      <th class="w-12 px-3 py-2 text-center font-bold">순위</th>
                      <th class="px-3 py-2 text-left font-bold">품목</th>
                      <th class="w-24 px-3 py-2 text-right font-bold">판매수</th>
                      <th class="w-24 px-3 py-2 text-right font-bold">매출</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="(item, i) in grp.items" :key="item.name" class="hover:bg-gray-50">
                      <td class="px-3 py-2 text-center font-bold text-gray-500">{{ i + 1 }}</td>
                      <td class="px-3 py-2 font-bold text-gray-800">{{ item.name }}</td>
                      <td class="px-3 py-2 text-right font-mono text-gray-700">{{ item.units.toLocaleString() }}</td>
                      <td class="px-3 py-2 text-right font-mono font-bold text-gray-800">₩{{ Number(item.sales).toLocaleString('ko-KR') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ━━━━━━━ 탭: 상품별 ━━━━━━━ -->
        <div v-else-if="activeTab === 'productDetail'" class="p-6">
          <!-- 필터 바 -->
          <div class="flex flex-wrap items-center gap-4">
            <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
              카테고리
              <select
                v-model="categoryFilter"
                class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
              >
                <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
            <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
              품목
              <select
                v-model="productTypeFilter"
                class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white"
              >
                <option v-for="t in productTypeOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
            <label class="relative ml-auto flex items-center">
              <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                v-model="productKeyword"
                type="text"
                placeholder="상품명 검색..."
                class="w-56 border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C] focus:bg-white"
              />
            </label>
          </div>

          <!-- 상품 KPI 4개 -->
          <div class="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div class="border border-gray-300 bg-white p-4 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">총 상품 수</p>
              <p class="mt-2 text-xl font-black text-gray-900">{{ productDetailKpi.totalCount }}<span class="ml-1 text-xs font-bold text-gray-500">개</span></p>
              <p class="mt-1 text-[10px] text-gray-500">필터 적용 결과</p>
            </div>
            <div class="border border-gray-300 bg-white p-4 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">합계 매출</p>
              <p class="mt-2 text-xl font-black text-gray-900">₩{{ Number(productDetailKpi.totalSales).toLocaleString('ko-KR') }}</p>
              <p class="mt-1 text-[10px] text-gray-500">상품 매출 합산</p>
            </div>
            <div class="border border-gray-300 bg-white p-4 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">합계 판매수</p>
              <p class="mt-2 text-xl font-black text-gray-900">{{ productDetailKpi.totalUnits.toLocaleString() }}<span class="ml-1 text-xs font-bold text-gray-500">개</span></p>
              <p class="mt-1 text-[10px] text-gray-500">전체 판매 수량</p>
            </div>
            <div class="border border-gray-300 bg-white p-4 shadow-sm">
              <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">🏆 TOP 1 상품</p>
              <p v-if="productDetailKpi.topProduct" class="mt-2 truncate text-sm font-black text-gray-900">{{ productDetailKpi.topProduct.name }}</p>
              <p v-if="productDetailKpi.topProduct" class="mt-1 text-[10px] text-gray-500">
                ₩{{ Number(productDetailKpi.topProduct.sales).toLocaleString('ko-KR') }} · {{ productDetailKpi.topProduct.units }}개
              </p>
            </div>
          </div>

          <!-- TOP 10 상품 막대 -->
          <div class="mt-6 border border-gray-200 bg-white p-5 shadow-sm">
            <header class="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                <Award :size="14" class="text-amber-600" />
                상품별 매출 TOP 10
              </h3>
              <div class="flex items-center gap-2 text-[10px]">
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#0ea5e9"></span>상의</span>
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#f59e0b"></span>바지</span>
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#a855f7"></span>치마</span>
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2" style="background:#059669"></span>아우터</span>
              </div>
            </header>
            <BarChart v-if="top10ProductDetails.length" :data="productDetailBarData" :options="productDetailBarOptions" :height="380" />
            <p v-else class="py-12 text-center text-xs text-gray-400">검색 조건에 맞는 상품이 없습니다.</p>
          </div>

          <!-- 품목별 그룹 상세 테이블 -->
          <div class="mt-6 space-y-5">
            <div
              v-for="grp in productDetailsByType"
              :key="grp.productType"
              class="border border-gray-200 bg-white"
            >
              <header class="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-4 py-3">
                <h3 class="flex items-center gap-2 text-xs font-black text-gray-800">
                  <span class="inline-block h-3 w-3" :style="{ backgroundColor: grp.categoryColor }"></span>
                  <span class="text-gray-500">{{ grp.category }} ›</span>
                  {{ grp.productType }}
                </h3>
                <span class="text-[10px] font-bold text-gray-400">
                  {{ grp.items.length }}개 상품 · {{ grp.totalUnits.toLocaleString() }}개 판매 · 합계 ₩{{ Number(grp.subtotal).toLocaleString('ko-KR') }}
                </span>
              </header>
              <div class="overflow-auto">
                <table class="w-full min-w-[520px] text-xs">
                  <thead class="bg-gray-100 text-[10px] text-gray-500">
                    <tr>
                      <th class="w-12 px-3 py-2 text-center font-bold">순위</th>
                      <th class="px-3 py-2 text-left font-bold">상품명</th>
                      <th class="w-24 px-3 py-2 text-right font-bold">판매수</th>
                      <th class="w-24 px-3 py-2 text-right font-bold">매출</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="(item, i) in grp.items" :key="item.name" class="hover:bg-gray-50">
                      <td class="px-3 py-2 text-center font-bold text-gray-500">{{ i + 1 }}</td>
                      <td class="px-3 py-2 font-bold text-gray-800">{{ item.name }}</td>
                      <td class="px-3 py-2 text-right font-mono text-gray-700">{{ item.units.toLocaleString() }}</td>
                      <td class="px-3 py-2 text-right font-mono font-bold text-gray-800">₩{{ Number(item.sales).toLocaleString('ko-KR') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <p v-if="!productDetailsByType.length" class="border border-gray-200 bg-white px-4 py-8 text-center text-xs text-gray-400">
              검색 조건에 맞는 상품이 없습니다.
            </p>
          </div>
        </div>

      </section>
    </div>
  </AppLayout>
</template>

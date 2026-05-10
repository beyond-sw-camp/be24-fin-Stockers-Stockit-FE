<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { Truck, TrendingDown, Package, RefreshCw, Warehouse, Tag } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { orderStatsAnalyticsApi } from '@/api/hq/analytics.js'
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('발주량 통계')

const categoryFilter = ref('전체')
const detailViewMode = ref('item') // 'item' | 'product'
const productTypeFilter = ref('전체') // 상품별 모드 전용 품목 필터

// ─── 기간 단위별 dateRange 헬퍼 (판매량 통계와 동일 패턴) ──────────────
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
const dateRange = ref(defaultDateForPeriod('연간'))

const periodOptions = ['일간', '월간', '연간']

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

// ─── BE 연동 — 발주량 통계 ──────────────────────────────────────────────
const statsData = ref(null)
const loading = ref(false)
const loadError = ref('')

const PERIOD_MAP = {
  '일간': 'DAY', '월간': 'MONTH', '연간': 'YEAR',
}

function resolveDateRange() {
  const v = dateRange.value ?? ''
  const unit = periodUnit.value

  if (unit === '일간') {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) return { from: v, to: v }
  }
  if (unit === '월간') {
    const m = v.match(/^(\d{4})-(\d{2})$/)
    if (m) {
      const lastDay = new Date(parseInt(m[1]), parseInt(m[2]), 0).getDate()
      return { from: `${m[1]}-${m[2]}-01`, to: `${m[1]}-${m[2]}-${pad2(lastDay)}` }
    }
  }
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

async function fetchOrderStats() {
  loading.value = true
  loadError.value = ''
  try {
    const { from, to } = resolveDateRange()
    statsData.value = await orderStatsAnalyticsApi.get({
      period: PERIOD_MAP[periodUnit.value] ?? 'MONTH',
      from, to,
      category: categoryFilter.value === '전체' ? null : categoryFilter.value,
    })
  } catch (e) {
    console.error('[OrderStatsView] fetch failed', e)
    loadError.value = '발주량 통계를 불러오지 못했습니다.'
    statsData.value = null
  } finally {
    loading.value = false
  }
}

// periodUnit 변경 시 dateRange 를 새 단위 default 로 리셋 → dateRange watch 가 fetch 트리거
watch(periodUnit, (newUnit) => {
  dateRange.value = defaultDateForPeriod(newUnit)
})

watch([categoryFilter, dateRange], () => {
  productTypeFilter.value = '전체'
  fetchOrderStats()
})
onMounted(fetchOrderStats)

// ─── 창고별 발주 데이터 (BE → FE 매핑) ──────────────────────────────
//   BE: { warehouseCode, warehouseName, orders, items, totalValue(원), sharePct }
//   FE 표시: name, orders, items, totalValue(M원), share(%)
const warehouseOrders = computed(() => {
  return (statsData.value?.warehouseOrders ?? []).map((w) => ({
    name: w.warehouseName,
    code: w.warehouseCode,
    orders: w.orders,
    items: w.items,
    totalValue: Number((Number(w.totalValue ?? 0) / 1_000_000).toFixed(1)),
    share: Number(w.sharePct ?? 0),
  }))
})

const topWarehouse = computed(() => {
  if (!warehouseOrders.value.length) return { name: '-', orders: 0 }
  return [...warehouseOrders.value].sort((a, b) => b.orders - a.orders)[0]
})
const totalWarehouseOrders = computed(() =>
  warehouseOrders.value.reduce((s, w) => s + w.orders, 0),
)
const totalWarehouseValue = computed(() =>
  warehouseOrders.value.reduce((s, w) => s + w.totalValue, 0).toFixed(1),
)


const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// ─── 품목별 발주 (BE orderCycleData 그대로) ───────────────────────────
const orderCycleData = computed(() => statsData.value?.orderCycleData ?? [])

// ─── 상품별 발주 (BE productOrderData 그대로) ─────────────────────────
const productOrderData = computed(() => statsData.value?.productOrderData ?? [])

// 상품별 모드에서 사용할 품목 옵션 (동적)
const productTypeOptions = computed(() => {
  const types = [...new Set(productOrderData.value.map((p) => p.productType))]
  return ['전체', ...types]
})

// 현재 보기 모드에 따른 데이터 (품목 또는 상품, 품목 필터 적용)
const currentDetailData = computed(() => {
  if (detailViewMode.value === 'item') return orderCycleData.value
  // 상품 모드 + 품목 필터
  if (productTypeFilter.value === '전체') return productOrderData.value
  return productOrderData.value.filter((p) => p.productType === productTypeFilter.value)
})

const currentShortest = computed(() => {
  if (!currentDetailData.value.length) return { item: '-', avgCycle: 0 }
  return currentDetailData.value.reduce((a, b) => (a.avgCycle < b.avgCycle ? a : b))
})

const currentLongest = computed(() => {
  if (!currentDetailData.value.length) return { item: '-', avgCycle: 0 }
  return currentDetailData.value.reduce((a, b) => (a.avgCycle > b.avgCycle ? a : b))
})

// ─── 월별 추이 (BE month 'YYYY-MM' → FE m '11월') ─────────────────────
const monthlyTrend = computed(() => {
  return (statsData.value?.monthlyTrend ?? []).map((p) => {
    const monthNum = parseInt(String(p.month).split('-')[1] ?? '0')
    return { m: `${monthNum}월`, orders: p.orders ?? 0, items: p.items ?? 0 }
  })
})

// ─── KPI (BE 응답 기반) ─────────────────────────────────────────────────
const kpiMetrics = computed(() => {
  const k = statsData.value?.kpi
  const empty = (label, unit, icon, valueCls, iconBg, iconCls, sub) => ({
    label, value: '—', unit, sub, icon, valueCls, iconBg, iconCls,
  })
  if (!k) {
    return [
      empty('관리 품목 수',  '개', Package,   'text-emerald-700', 'bg-emerald-50', 'text-emerald-600', '발주 이력 기준'),
      empty('가장 긴 주기',  '일', TrendingDown, 'text-slate-700',   'bg-slate-50',   'text-slate-600',   '-'),
      empty('가장 짧은 주기', '일', RefreshCw, 'text-amber-700',   'bg-amber-50',   'text-amber-600',   '-'),
      empty('누적 발주',     '건', Truck,     'text-violet-700',  'bg-violet-50',  'text-violet-600',  '최근 6개월'),
    ]
  }
  return [
    { label: '관리 품목 수',  value: k.managedItemCount ?? 0,    unit: '개', sub: '발주 이력 기준',           icon: Package,   valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
    { label: '가장 긴 주기',  value: k.longestCycleDays ?? 0,    unit: '일', sub: k.longestCycleItem || '-',   icon: TrendingDown, valueCls: 'text-slate-700',   iconBg: 'bg-slate-50',   iconCls: 'text-slate-600' },
    { label: '가장 짧은 주기', value: k.shortestCycleDays ?? 0,   unit: '일', sub: k.shortestCycleItem || '-',  icon: RefreshCw, valueCls: 'text-amber-700',   iconBg: 'bg-amber-50',   iconCls: 'text-amber-600' },
    { label: '누적 발주',     value: k.totalOrders ?? 0,         unit: '건', sub: '최근 6개월',               icon: Truck,     valueCls: 'text-violet-700',  iconBg: 'bg-violet-50',  iconCls: 'text-violet-600' },
  ]
})

// 품목별/상품별 평균 발주 주기 BarChart (보기 모드에 따라 동적 전환)
const cycleChartData = computed(() => ({
  labels: currentDetailData.value.map((d) => d.item),
  datasets: [
    {
      label: '평균 발주 주기',
      data: currentDetailData.value.map((d) => d.avgCycle),
      backgroundColor: currentDetailData.value.map((d) =>
        d.avgCycle === currentShortest.value.avgCycle ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.85)',
      ),
      borderColor: currentDetailData.value.map((d) =>
        d.avgCycle === currentShortest.value.avgCycle ? '#d97706' : '#059669',
      ),
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 36,
      hoverBackgroundColor: currentDetailData.value.map((d) =>
        d.avgCycle === currentShortest.value.avgCycle ? '#d97706' : '#047857',
      ),
    },
  ],
}))

const cycleChartOptions = computed(() => {
  const isProductMode = detailViewMode.value === 'product'
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: isProductMode ? 'y' : 'x', // 상품 모드는 가로 막대 (긴 이름 가독성)
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#6ee7b7',
        titleFont: { size: 11, weight: 'bold' },
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: (items) => items[0].label,
          label: (ctx) => {
            const d = currentDetailData.value[ctx.dataIndex]
            const isShortest = d.avgCycle === currentShortest.value.avgCycle
            const isLongest = d.avgCycle === currentLongest.value.avgCycle
            return [
              `카테고리: ${d.category}`,
              d.productType ? `품목: ${d.productType}` : '',
              `평균 주기: ${d.avgCycle}일`,
              `평균 수량: ${d.avgQty.toLocaleString()}개`,
              `누적 발주: ${d.totalOrders}건`,
              `최근 발주: ${d.lastOrderedAt}`,
              isShortest ? '⚡ 최단 주기 (고회전)' : '',
              isLongest ? '🐢 최장 주기' : '',
            ].filter(Boolean)
          },
        },
      },
    },
    scales: isProductMode
      ? {
          // 상품 모드: 가로 막대 (Y축에 상품명, X축에 일수)
          x: {
            grid: { color: '#f3f4f6' },
            ticks: { font: { size: 10 }, callback: (v) => v + '일' },
            beginAtZero: true,
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              color: '#374151',
              autoSkip: false,
              // 긴 상품명 잘림 방지: 최대 22자, 그 이상은 ... 처리
              callback: function (value) {
                const label = this.getLabelForValue(value)
                return label && label.length > 22 ? label.slice(0, 21) + '…' : label
              },
            },
          },
        }
      : {
          // 품목 모드: 세로 막대 — 데이터 9개 이상이면 짝수 인덱스만 글씨, 홀수는 ● (색깔점) 으로 자리만 표시.
          //   막대 hover 시 tooltip 에서 풀 정보. 라벨 생략 없음.
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              color: (ctx) => {
                const dense = currentDetailData.value.length > 8
                if (!dense) return '#4b5563'
                return ctx.index % 2 === 0 ? '#4b5563' : '#059669'  // 점은 emerald (막대 색과 동일)
              },
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
              padding: 4,
              callback: function (value, index) {
                const label = this.getLabelForValue(value)
                const dense = currentDetailData.value.length > 8
                if (!dense) return label
                return index % 2 === 0 ? label : '●'
              },
            },
          },
          y: {
            grid: { color: '#f3f4f6' },
            ticks: { font: { size: 10 }, callback: (v) => v + '일' },
            beginAtZero: true,
          },
        },
    layout: { padding: { bottom: 4 } },
  }
})

// 상품 모드 차트 동적 높이: 행 수에 따라
const cycleChartHeight = computed(() => {
  if (detailViewMode.value !== 'product') return 220
  const rows = currentDetailData.value.length
  return Math.max(220, rows * 28) // 1행당 28px
})

// ─── 상품별 발주 도넛 (누적 발주 건수 비중) ────────────────────────────
const PRODUCT_DOUGHNUT_PALETTE = [
  '#059669', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444',
  '#10b981', '#3b82f6', '#eab308', '#c084fc', '#f87171',
  '#14b8a6', '#06b6d4', '#84cc16', '#ec4899', '#f97316',
  '#22c55e', '#8b5cf6', '#fb923c', '#fbbf24', '#0891b2',
  '#7c3aed', '#dc2626',
]

const productOrderShareList = computed(() => {
  const total = currentDetailData.value.reduce((s, p) => s + p.totalOrders, 0) || 1
  return currentDetailData.value.map((p, i) => ({
    name: p.item,
    productType: p.productType ?? '',
    category: p.category,
    totalOrders: p.totalOrders,
    avgCycle: p.avgCycle,
    avgQty: p.avgQty,
    sharePct: parseFloat(((p.totalOrders / total) * 100).toFixed(1)),
    color: PRODUCT_DOUGHNUT_PALETTE[i % PRODUCT_DOUGHNUT_PALETTE.length],
  }))
})

const productDoughnutData = computed(() => ({
  labels: productOrderShareList.value.map((p) => p.name),
  datasets: [{
    data: productOrderShareList.value.map((p) => p.sharePct),
    backgroundColor: productOrderShareList.value.map((p) => p.color),
    borderWidth: 2,
    borderColor: '#fff',
  }],
}))

const productDoughnutOptions = {
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
      callbacks: {
        label: (ctx) => {
          const item = productOrderShareList.value[ctx.dataIndex]
          return [
            `${ctx.label}`,
            `누적 발주: ${item.totalOrders}건 (${item.sharePct}%)`,
            `품목: ${item.productType} · ${item.category}`,
            `평균 주기: ${item.avgCycle}일`,
          ]
        },
      },
    },
  },
  cutout: '55%',
}

const totalProductOrders = computed(() =>
  productOrderShareList.value.reduce((s, p) => s + p.totalOrders, 0),
)

const topProductByOrders = computed(() => {
  if (!productOrderShareList.value.length) return null
  return [...productOrderShareList.value].sort((a, b) => b.totalOrders - a.totalOrders)[0]
})

const monthlyTrendChartData = computed(() => ({
  labels: monthlyTrend.value.map((m) => m.m),
  datasets: [
    {
      label: '발주 건수',
      data: monthlyTrend.value.map((m) => m.orders),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#2563eb',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: true,
      yAxisID: 'y',
    },
    {
      label: '관리 품목 수',
      data: monthlyTrend.value.map((m) => m.items),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.08)',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#f59e0b',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: false,
      yAxisID: 'y1',
    },
  ],
}))

const monthlyTrendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { font: { size: 10 }, boxWidth: 12, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#93c5fd',
      titleFont: { size: 11, weight: 'bold' },
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}${ctx.datasetIndex === 0 ? '건' : '개'}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: {
      position: 'left',
      grid: { color: '#f3f4f6' },
      beginAtZero: true,
      ticks: {
        font: { size: 10 },
        stepSize: 1,
        precision: 0,
        callback: (v) => Number.isInteger(v) ? `${v}건` : '',
      },
    },
    y1: {
      position: 'right',
      grid: { display: false },
      beginAtZero: true,
      ticks: {
        font: { size: 10 },
        stepSize: 1,
        precision: 0,
        callback: (v) => Number.isInteger(v) ? `${v}개` : '',
      },
    },
  },
  interaction: { mode: 'index', intersect: false },
}

</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-3">

      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Truck :size="18" class="text-emerald-600" />
            발주량 통계
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
          <span v-if="loading" class="text-[11px] font-medium text-emerald-600">불러오는 중…</span>
          <span v-else-if="loadError" class="text-[11px] font-medium text-rose-600">{{ loadError }}</span>
        </div>
        <span class="text-[11px] text-gray-500">품목별 평균 발주 주기 분석 (막대 차트)</span>
      </section>

      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">집계 단위</span>
          <div class="flex border border-gray-200">
            <button
              v-for="opt in periodOptions"
              :key="opt"
              type="button"
              class="px-3 py-1 text-[11px] font-semibold transition-colors"
              :class="periodUnit === opt ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
              @click="periodUnit = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">{{ periodInputLabel }}</span>
          <input
            v-model="dateRange"
            :type="periodInputType"
            :min="periodUnit === '연간' ? 2020 : undefined"
            :max="periodUnit === '연간' ? 2099 : undefined"
            class="border border-gray-200 bg-white px-2 py-1 text-[11px]"
          />
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">카테고리</span>
          <select v-model="categoryFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option>전체</option>
            <option>상의</option>
            <option>바지</option>
            <option>치마</option>
            <option>아우터</option>
          </select>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <article
          v-for="m in kpiMetrics"
          :key="m.label"
          class="flex h-[90px] flex-col justify-between border border-gray-300 bg-white px-3 py-3 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <p class="text-[11px] font-medium text-gray-500">{{ m.label }}</p>
            <div :class="[m.iconBg, 'flex h-7 w-7 items-center justify-center']">
              <component :is="m.icon" :size="14" :class="m.iconCls" />
            </div>
          </div>
          <div>
            <div class="flex items-end gap-1 leading-none">
              <span :class="[m.valueCls, 'text-[20px] font-bold tracking-tight']">{{ m.value }}</span>
              <span class="mb-0.5 text-[11px] text-gray-400">{{ m.unit }}</span>
            </div>
            <p class="mt-1 truncate text-[10px] text-gray-400">{{ m.sub }}</p>
          </div>
        </article>
      </section>

      <!-- 창고별 발주 정보 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2.5">
          <div>
            <h3 class="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Warehouse :size="14" class="text-emerald-600" />
              창고별 발주 분포
            </h3>
            <p class="mt-0.5 text-[10px] text-gray-400">{{ warehouseOrders.length }}개 본사 창고 · 누적 {{ totalWarehouseOrders }}건 · ₩{{ totalWarehouseValue }}M</p>
          </div>
          <span
            v-if="warehouseOrders.length"
            class="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
          >
            🥇 1위 {{ topWarehouse.name }} · {{ topWarehouse.orders }}건
          </span>
        </div>
        <ul class="divide-y divide-gray-100">
          <li
            v-for="(w, i) in warehouseOrders"
            :key="w.name"
            class="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/60"
          >
            <span class="flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-black"
              :class="i === 0 ? 'bg-emerald-500 text-white' : i === 1 ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'">
              {{ i + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-[12px] font-bold text-gray-800">{{ w.name }}</p>
              <p class="text-[10px] text-gray-500">{{ w.items }}개 품목 · 누적 ₩{{ w.totalValue }}M</p>
            </div>
            <div class="hidden md:block w-48">
              <div class="h-2 w-full bg-gray-100">
                <div
                  class="h-full transition-all"
                  :class="i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-gray-400'"
                  :style="{ width: `${w.share}%` }"
                ></div>
              </div>
            </div>
            <div class="w-24 text-right">
              <p class="text-sm font-black text-gray-900">{{ w.orders }}<span class="ml-0.5 text-[10px] font-bold text-gray-400">건</span></p>
              <p class="text-[10px] font-bold text-gray-500">{{ w.share }}%</p>
            </div>
          </li>
        </ul>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2.5">
            <div>
              <h3 class="text-sm font-medium text-gray-800">
                {{ detailViewMode === 'product' ? '상품별 발주 비중' : '품목별 평균 발주 주기' }}
              </h3>
              <p class="mt-0.5 text-[10px] text-gray-400">
                <template v-if="detailViewMode === 'product'">
                  도넛 차트 · 누적 발주 건수 기준 · 총 {{ totalProductOrders }}건 / {{ currentDetailData.length }}개 상품
                </template>
                <template v-else>
                  세로 막대 · 단위: 일 (기간: {{ periodUnit }})
                </template>
              </p>
              <p
                v-if="detailViewMode === 'item'"
                class="mt-1 text-[10.5px] font-medium text-emerald-700/80"
              >
                💡 막대에 마우스를 올리면 상세 정보가 표시됩니다
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <!-- 상품 모드 전용 품목 필터 -->
              <label
                v-if="detailViewMode === 'product'"
                class="flex items-center gap-1.5 text-[10px] font-bold text-gray-500"
              >
                품목
                <select
                  v-model="productTypeFilter"
                  class="border border-gray-300 bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-700 outline-none focus:border-emerald-600 focus:bg-white"
                >
                  <option v-for="t in productTypeOptions" :key="t" :value="t">{{ t }}</option>
                </select>
              </label>
              <span
                v-if="detailViewMode === 'product' && topProductByOrders"
                class="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
              >
                🥇 1위 {{ topProductByOrders.name }} ({{ topProductByOrders.sharePct }}%)
              </span>
              <span
                v-else-if="currentDetailData.length"
                class="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"
              >
                ⚡ 최단 {{ currentShortest.item }} {{ currentShortest.avgCycle }}일
              </span>
            </div>
          </div>
          <div class="flex flex-1 px-3 py-3">
            <!-- 품목 모드: 세로 막대 -->
            <BarChart
              v-if="detailViewMode === 'item' && currentDetailData.length"
              :data="cycleChartData"
              :options="cycleChartOptions"
              :height="cycleChartHeight"
            />
            <!-- 상품 모드: 도넛 + 우측 리스트 -->
            <div
              v-else-if="detailViewMode === 'product' && currentDetailData.length"
              class="grid w-full gap-4 lg:grid-cols-2"
            >
              <DoughnutChart :data="productDoughnutData" :options="productDoughnutOptions" :height="280" />
              <ul class="grid max-h-[280px] grid-cols-1 content-start gap-x-3 gap-y-1 overflow-auto text-[11px]">
                <li
                  v-for="p in productOrderShareList"
                  :key="p.name"
                  class="flex items-center justify-between gap-2 border-b border-dashed border-gray-100 py-1"
                >
                  <span class="flex min-w-0 items-center gap-2">
                    <span class="inline-block h-2 w-2 shrink-0" :style="{ backgroundColor: p.color }"></span>
                    <span class="truncate font-bold text-gray-700">{{ p.name }}</span>
                  </span>
                  <span class="shrink-0 font-mono text-gray-500">{{ p.sharePct }}%</span>
                </li>
              </ul>
            </div>
            <p v-else class="w-full py-12 text-center text-xs text-gray-400">
              선택한 품목에 해당하는 상품이 없습니다.
            </p>
          </div>
        </article>

        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">월별 발주 건수 추이</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">최근 6개월</p>
          </div>
          <div class="flex flex-1 items-center px-3 py-3">
            <LineChart :data="monthlyTrendChartData" :options="monthlyTrendChartOptions" :height="220" />
          </div>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">
            {{ detailViewMode === 'product' ? '상품별' : '품목별' }} 발주 통계 상세
          </h3>
          <div class="inline-flex border border-gray-300 bg-white">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-colors"
              :class="detailViewMode === 'item'
                ? 'bg-[#004D3C] text-white'
                : 'text-gray-600 hover:bg-gray-50'"
              @click="detailViewMode = 'item'"
            >
              <Package :size="12" />
              품목별 발주 통계 상세
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-colors"
              :class="detailViewMode === 'product'
                ? 'bg-[#004D3C] text-white'
                : 'text-gray-600 hover:bg-gray-50'"
              @click="detailViewMode = 'product'"
            >
              <Tag :size="12" />
              상품별 발주 통계 상세
            </button>
          </div>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[760px] text-[12px]">
            <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">{{ detailViewMode === 'product' ? '상품명' : '품목명' }}</th>
                <th v-if="detailViewMode === 'product'" class="px-3 py-2 text-left font-semibold">품목</th>
                <th class="px-3 py-2 text-left font-semibold">카테고리</th>
                <th class="px-3 py-2 text-right font-semibold">평균 주기</th>
                <th class="px-3 py-2 text-right font-semibold">평균 수량</th>
                <th class="px-3 py-2 text-right font-semibold">누적 발주</th>
                <th class="px-3 py-2 text-left font-semibold">최근 발주일</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="d in currentDetailData" :key="d.item" class="hover:bg-gray-50/60">
                <td class="px-3 py-2.5 font-medium text-gray-800">{{ d.item }}</td>
                <td v-if="detailViewMode === 'product'" class="px-3 py-2.5 text-gray-600">{{ d.productType }}</td>
                <td class="px-3 py-2.5 text-gray-500">{{ d.category }}</td>
                <td class="px-3 py-2.5 text-right">
                  <span class="inline-flex items-center gap-1 font-bold text-emerald-700">
                    {{ d.avgCycle }}<span class="text-[10px] font-normal text-gray-400">일</span>
                  </span>
                </td>
                <td class="px-3 py-2.5 text-right text-gray-700">{{ d.avgQty.toLocaleString() }}</td>
                <td class="px-3 py-2.5 text-right text-gray-600">{{ d.totalOrders }}건</td>
                <td class="px-3 py-2.5 text-gray-500">{{ d.lastOrderedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

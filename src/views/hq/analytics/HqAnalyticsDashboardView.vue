<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  LayoutDashboard,
  TrendingUp,
  Truck,
  Repeat,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Calendar,
  ArrowRight,
  Download,
  FileText,
  FileSpreadsheet,
  Filter,
  Recycle,
  Handshake,
  Leaf,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { dashboardAnalyticsApi } from '@/api/hq/analytics.js'

const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('통합 KPI 대시보드')

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// ─── 필터 ─────────────────────────────────────────────────────────────
const periodUnit = ref('연간')
const periodOptions = ['월간', '연간']
const PERIOD_MAP = { '월간': 'MONTH', '연간': 'YEAR' }

const now = new Date()
const selectedYear = ref(now.getFullYear())
const selectedMonth = ref(now.getMonth() + 1)

// 최근 5년 옵션
const yearOptions = computed(() => {
  const out = []
  for (let i = 0; i < 5; i++) out.push(now.getFullYear() - i)
  return out
})
const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// ─── BE 연동 ──────────────────────────────────────────────────────────
const statsData = ref(null)
const loading = ref(false)
const loadError = ref('')

function pad2(n) { return String(n).padStart(2, '0') }
function fmt(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }

function resolveDateRange() {
  if (periodUnit.value === '월간') {
    // 선택한 연도/월 의 1일 ~ 말일
    const fromDate = new Date(selectedYear.value, selectedMonth.value - 1, 1)
    const toDate = new Date(selectedYear.value, selectedMonth.value, 0) // 다음달 0일 = 이번달 말일
    return { from: fmt(fromDate), to: fmt(toDate) }
  }
  // 연간 — 선택한 연도의 1월 1일 ~ 12월 31일
  const fromDate = new Date(selectedYear.value, 0, 1)
  const toDate = new Date(selectedYear.value, 11, 31)
  return { from: fmt(fromDate), to: fmt(toDate) }
}

async function fetchDashboard() {
  loading.value = true
  loadError.value = ''
  try {
    const { from, to } = resolveDateRange()
    statsData.value = await dashboardAnalyticsApi.get({
      period: PERIOD_MAP[periodUnit.value] ?? 'YEAR',
      from, to,
    })
  } catch (e) {
    console.error('[DashboardView] fetch failed', e)
    loadError.value = '통합 KPI 대시보드를 불러오지 못했습니다.'
    statsData.value = null
  } finally {
    loading.value = false
  }
}

watch([periodUnit, selectedYear, selectedMonth], fetchDashboard)
onMounted(fetchDashboard)

const kpi = computed(() => statsData.value?.kpi ?? {})

// ─── 금액 표기 — 풀 콤마 원 단위 ──────────────────────────────────────
function formatKoreanMoney(won) {
  if (won == null || isNaN(won)) return '₩0'
  return `₩${Number(won).toLocaleString('ko-KR')}`
}
// Turnover lockedValue 는 BE 가 백만원 단위로 응답
function formatMillionWon(million) {
  if (million == null || isNaN(million)) return '₩0'
  return formatKoreanMoney(Math.round(Number(million) * 1_000_000))
}
function formatTrendPct(pct) {
  if (pct == null || isNaN(pct)) return '—'
  const n = Number(pct)
  if (n > 0) return `↗ +${n.toFixed(1)}%`
  if (n < 0) return `↘ ${n.toFixed(1)}%`
  return '→ 0.0%'
}
function trendCls(pct) {
  if (pct == null || isNaN(pct)) return 'text-gray-500'
  const n = Number(pct)
  if (n > 0) return 'text-emerald-600'
  if (n < 0) return 'text-red-600'
  return 'text-gray-500'
}

// ─── KPI 5카드 (BE 응답 기반, 3축 균형) ───────────────────────────────
const periodLabel = computed(() => {
  if (periodUnit.value === '월간') return `${selectedYear.value}년 ${selectedMonth.value}월`
  return `${selectedYear.value}년`
})

const kpiStats = computed(() => {
  const k = kpi.value
  return [
    {
      label: `${periodLabel.value} 매출`,
      value: formatKoreanMoney(k.totalRevenue ?? 0),
      unit: '',
      sub: formatTrendPct(k.totalRevenueTrendPct),
      icon: TrendingUp,
      valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600',
      subCls: trendCls(k.totalRevenueTrendPct),
    },
    {
      label: '악성재고 묶인 자금',
      value: formatMillionWon(k.lockedValue ?? 0),
      unit: '',
      sub: '1년 이상 안 팔린 SKU',
      icon: AlertCircle,
      valueCls: 'text-rose-700', iconBg: 'bg-rose-50', iconCls: 'text-rose-600',
      subCls: 'text-rose-600',
    },
    {
      label: '악성 재고',
      value: Number(k.dangerSkuCount ?? 0).toLocaleString(),
      unit: '건',
      sub: `전체 ${Number(k.totalSkuCount ?? 0).toLocaleString()} 중`,
      icon: Repeat,
      valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600',
      subCls: 'text-amber-600',
    },
    {
      label: '순환재고 거래처',
      value: Number(k.activeVendorCount ?? 0).toLocaleString(),
      unit: '곳',
      sub: `소재 ${k.activeMaterialCount ?? 0}종`,
      icon: Handshake,
      valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600',
      subCls: 'text-gray-500',
    },
    {
      label: '순환재고 매출',
      value: formatKoreanMoney(k.circularSalesAmount ?? 0),
      unit: '',
      sub: '친환경 매출 기여',
      icon: Recycle,
      valueCls: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600',
      subCls: 'text-violet-600',
    },
  ]
})

// ─── 일자별 매출 추이 (BE trendCurrent) ───────────────────────────────
const trendCurrent = computed(() => statsData.value?.trendCurrent ?? [])

const salesTrendChartData = computed(() => ({
  labels: trendCurrent.value.map((p) => p.label),
  datasets: [
    {
      label: '매출',
      data: trendCurrent.value.map((p) => Number(p.revenue ?? 0)),
      borderColor: '#059669',
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#059669',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: true,
    },
  ],
}))

const salesTrendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
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
        label: (ctx) => formatKoreanMoney(ctx.parsed.y),
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => formatKoreanMoney(v) } },
  },
  interaction: { mode: 'index', intersect: false },
}

const trendStats = computed(() => {
  const values = trendCurrent.value.map((p) => Number(p.revenue ?? 0))
  if (!values.length) return { min: 0, max: 0 }
  return { min: Math.min(...values), max: Math.max(...values) }
})

// ─── 월별 매출 집계 (연간 모드용) — trendCurrent 일별 → 12개월 합계 ──
const monthlyTrend = computed(() => {
  const out = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, revenue: 0 }))
  for (const point of trendCurrent.value) {
    const m = parseInt(String(point.label ?? '').split(/[\/\-]/)[0], 10)
    if (m >= 1 && m <= 12) {
      out[m - 1].revenue += Number(point.revenue ?? 0)
    }
  }
  return out
})

const monthlyChartData = computed(() => ({
  labels: monthlyTrend.value.map((m) => `${m.month}월`),
  datasets: [{
    label: '월 매출',
    data: monthlyTrend.value.map((m) => m.revenue),
    backgroundColor: '#059669',
    borderRadius: 4,
  }],
}))

const monthlyChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
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
      callbacks: { label: (ctx) => formatKoreanMoney(ctx.parsed.y) },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => formatKoreanMoney(v) } },
  },
}

const monthlyStats = computed(() => {
  const values = monthlyTrend.value.map((m) => m.revenue)
  if (!values.length) return { min: 0, max: 0, peakMonth: '-' }
  const max = Math.max(...values)
  const min = Math.min(...values.filter((v) => v > 0).concat(max === 0 ? [0] : []))
  const peakIdx = values.indexOf(max)
  return { min, max, peakMonth: peakIdx >= 0 ? `${peakIdx + 1}월` : '-' }
})

// ─── 이상치 알림 (BE 미연동 — UI mock 유지) ──────────────────────────
const alerts = [
  { type: '매출 급감', target: '부산 센텀점', detail: '주간 매출 -12.4%, 프로모션 종료 영향', severity: 'high' },
  { type: '회전율 저하', target: '인천 제2센터', detail: '아우터 평균 보유일 19일', severity: 'medium' },
  { type: '수요 급증', target: '반팔 티셔츠', detail: '최근 7일 발주량 2.8배 증가', severity: 'medium' },
]

const severityCls = {
  high: 'border-red-300 bg-red-50/50',
  medium: 'border-amber-300 bg-amber-50/50',
  low: 'border-gray-300 bg-gray-50/50',
}

// ─── 카드 2 — 재고 건강도 3단계 (BE healthy / caution+warning / danger) ──
const inventoryHealth3 = computed(() => {
  const k = kpi.value
  const healthy = Number(k.healthyCount ?? 0)
  const cautionMerged = Number(k.cautionCount ?? 0) + Number(k.warningCount ?? 0)
  const danger = Number(k.dangerSkuCount ?? 0)
  const total = healthy + cautionMerged + danger || 1
  const pct = (n) => Number(((n / total) * 100).toFixed(1))
  return [
    { label: '정상', count: healthy,        pct: pct(healthy),        color: 'bg-emerald-500', textCls: 'text-emerald-700' },
    { label: '주의', count: cautionMerged,  pct: pct(cautionMerged),  color: 'bg-amber-500',   textCls: 'text-amber-700' },
    { label: '위험', count: danger,         pct: pct(danger),         color: 'bg-red-500',     textCls: 'text-red-700' },
  ]
})
const dangerPct = computed(() => inventoryHealth3.value.find((s) => s.label === '위험')?.pct ?? 0)
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
            <LayoutDashboard :size="18" class="text-emerald-600" />
            통합 KPI 대시보드
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
        </div>
        <div class="flex flex-col items-end gap-0.5 text-[11px] text-gray-500">
          <span>4개 통계의 핵심 지표를 한 화면에서 모니터링</span>
          <span v-if="loading" class="font-bold text-emerald-600">데이터 불러오는 중…</span>
          <span v-else-if="loadError" class="font-bold text-red-600">{{ loadError }}</span>
        </div>
      </section>

      <!-- 필터 바 -->
      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white p-3 shadow-sm">
        <div class="flex items-center gap-1.5 border-r border-gray-200 pr-3 text-[11px] font-bold text-gray-500">
          <Filter :size="13" />
          필터
        </div>
        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          기간
          <select v-model="periodUnit" class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
            <option v-for="p in periodOptions" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label v-if="periodUnit === '월간' || periodUnit === '연간'" class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          연도
          <select v-model.number="selectedYear" class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
          </select>
        </label>
        <label v-if="periodUnit === '월간'" class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          월
          <select v-model.number="selectedMonth" class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
            <option v-for="m in monthOptions" :key="m" :value="m">{{ m }}월</option>
          </select>
        </label>
      </section>

      <!-- 횡단 KPI 5개 -->
      <section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <article
          v-for="m in kpiStats"
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
              <span :class="[m.valueCls, 'text-[22px] font-black tracking-tight']">{{ m.value }}</span>
              <span class="mb-0.5 text-[11px] text-gray-400">{{ m.unit }}</span>
            </div>
            <p class="mt-1 truncate text-[10px] font-bold" :class="m.subCls ?? 'text-gray-400'">{{ m.sub }}</p>
          </div>
        </article>
      </section>

      <!-- 일자별 매출 추이 + 이상치 알림 -->
      <section class="grid gap-3 xl:grid-cols-3">
        <article class="border border-gray-300 bg-white shadow-sm xl:col-span-2">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <div>
              <h3 class="text-sm font-medium text-gray-800">매출 추이</h3>
              <p class="mt-0.5 text-[10px] text-gray-400">
                {{ periodLabel }}<template v-if="periodUnit === '연간'"> · 월별 집계</template>
              </p>
            </div>
            <span v-if="periodUnit === '연간' && monthlyTrend.length" class="text-[10px] text-gray-500">
              최고 {{ monthlyStats.peakMonth }} {{ formatKoreanMoney(monthlyStats.max) }}
            </span>
            <span v-else-if="periodUnit === '월간' && trendCurrent.length" class="text-[10px] text-gray-500">
              최저 {{ formatKoreanMoney(trendStats.min) }} ↔ 최고 {{ formatKoreanMoney(trendStats.max) }}
            </span>
          </div>
          <div class="px-3 py-3">
            <!-- 연간: 월별 막대 차트 -->
            <BarChart
              v-if="periodUnit === '연간'"
              :data="monthlyChartData"
              :options="monthlyChartOptions"
              :height="180"
            />
            <!-- 월간: 일별 라인 차트 -->
            <LineChart
              v-else-if="periodUnit === '월간' && trendCurrent.length"
              :data="salesTrendChartData"
              :options="salesTrendChartOptions"
              :height="180"
            />
            <p v-else class="py-10 text-center text-[11px] text-gray-400">데이터가 없습니다.</p>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">이상치 알림</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">발주·재고·매출 이상 탐지</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="a in alerts"
              :key="`${a.type}-${a.target}`"
              class="flex items-start gap-2 border-l-2 px-3 py-2.5"
              :class="severityCls[a.severity]"
            >
              <AlertCircle :size="13" class="mt-0.5 shrink-0 text-gray-500" />
              <div class="min-w-0 flex-1">
                <p class="text-[11px] font-bold text-gray-800">{{ a.type }} · {{ a.target }}</p>
                <p class="mt-0.5 text-[10px] text-gray-500">{{ a.detail }}</p>
              </div>
              <ChevronRight :size="12" class="mt-1 shrink-0 text-gray-400" />
            </div>
          </div>
        </article>
      </section>

      <!-- 분석 영역 — 각 통계 페이지로의 점프 카드 (핵심 1개 메트릭만 강조) -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <div>
            <h3 class="text-sm font-medium text-gray-800">주요 분석 영역</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">각 카드 클릭 시 상세 분석 페이지로 이동</p>
          </div>
        </div>

        <div class="grid gap-px bg-gray-200 md:grid-cols-2 xl:grid-cols-3">
          <!-- 1. 판매량 통계 — 매출 1위 품목 강조 -->
          <router-link
            to="/hq/analytics/sales"
            class="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-emerald-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-emerald-50">
                  <BarChart3 :size="14" class="text-emerald-600" />
                </div>
                <p class="text-[12px] font-bold text-gray-800">판매량 통계</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-emerald-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">🏆 매출 1위 품목</p>
              <p class="mt-1 truncate text-base font-black text-emerald-700" :title="kpi.topProductName">{{ kpi.topProductName || '-' }}</p>
              <p class="mt-1 text-[11px] text-gray-500">
                {{ formatKoreanMoney(kpi.topProductSales ?? 0) }}
                · {{ Number(kpi.topProductUnits ?? 0).toLocaleString() }}개 판매
              </p>
            </div>
            <p class="border-l-2 border-emerald-500 bg-emerald-50/50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              베스트 카테고리: {{ kpi.bestCategoryName || '-' }} · 비중 {{ kpi.bestCategorySharePct != null ? Number(kpi.bestCategorySharePct).toFixed(1) : '—' }}%
            </p>
          </router-link>

          <!-- 2. 재고 회전율 통계 — 재고 건강도 3단계 분포 -->
          <router-link
            to="/hq/analytics/turnover"
            class="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-violet-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-violet-50">
                  <Repeat :size="14" class="text-violet-600" />
                </div>
                <p class="text-[12px] font-bold text-gray-800">재고 회전율 통계</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-violet-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">📊 재고 건강도</p>
              <div class="mt-2 flex h-2 w-full overflow-hidden">
                <div
                  v-for="seg in inventoryHealth3"
                  :key="seg.label"
                  :class="seg.color"
                  :style="{ width: seg.pct + '%' }"
                  :title="`${seg.label} ${seg.count.toLocaleString()}건 (${seg.pct}%)`"
                ></div>
              </div>
              <ul class="mt-2 space-y-0.5 text-[11px]">
                <li v-for="seg in inventoryHealth3" :key="seg.label" class="flex items-center justify-between">
                  <span class="flex items-center gap-1.5">
                    <span class="inline-block h-2 w-2" :class="seg.color"></span>
                    <span :class="seg.textCls" class="font-bold">{{ seg.label }}</span>
                  </span>
                  <span class="font-mono text-gray-500">{{ seg.count.toLocaleString() }}건 ({{ seg.pct }}%)</span>
                </li>
              </ul>
            </div>
            <p class="border-l-2 border-red-500 bg-red-50/50 px-2 py-1 text-[10px] font-bold text-red-700">
              🚨 위험 재고 비중 {{ dangerPct }}% — 회전 점검 필요
            </p>
          </router-link>

          <!-- 3. 발주량 통계 — 발주 주기 가장 빠른/느린 품목 -->
          <router-link
            to="/hq/analytics/order-stats"
            class="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-orange-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-orange-50">
                  <Truck :size="14" class="text-orange-600" />
                </div>
                <p class="text-[12px] font-bold text-gray-800">발주량 통계</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-orange-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">⏱ 발주 주기</p>
              <ul class="mt-1 space-y-1 text-[11px]">
                <li class="flex items-center justify-between border-b border-dashed border-gray-100 py-0.5">
                  <span class="flex items-center gap-1.5">
                    <span class="bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">최단</span>
                    <span class="font-bold text-gray-700">{{ kpi.shortestOrderItem || '-' }}</span>
                  </span>
                  <span class="font-mono font-black text-emerald-700">{{ kpi.shortestOrderCycle ?? 0 }}일</span>
                </li>
                <li class="flex items-center justify-between py-0.5">
                  <span class="flex items-center gap-1.5">
                    <span class="bg-red-100 px-1.5 py-0.5 text-[9px] font-black text-red-700">최장</span>
                    <span class="font-bold text-gray-700">{{ kpi.longestOrderItem || '-' }}</span>
                  </span>
                  <span class="font-mono font-black text-red-700">{{ kpi.longestOrderCycle ?? 0 }}일</span>
                </li>
              </ul>
            </div>
            <p class="border-l-2 border-amber-500 bg-amber-50/50 px-2 py-1 text-[10px] font-bold text-amber-700">
              주기 격차 {{ (kpi.longestOrderCycle ?? 0) - (kpi.shortestOrderCycle ?? 0) }}일 — 발주 균형 검토
            </p>
          </router-link>

          <!-- 4. 순환재고 거래처 통계 — TOP 거래처 -->
          <router-link
            to="/hq/analytics/vendors"
            class="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-blue-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-blue-50">
                  <Handshake :size="14" class="text-blue-600" />
                </div>
                <p class="text-[12px] font-bold text-gray-800">순환재고 거래처 통계</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-blue-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">⭐ TOP 거래처</p>
              <p class="mt-1 truncate text-base font-black text-blue-700" :title="kpi.topVendorName">{{ (kpi.topVendorName ?? '').trim() || '-' }}</p>
              <p class="mt-1 text-[11px] text-gray-500">{{ formatKoreanMoney(kpi.topVendorAmount ?? 0) }}</p>
            </div>
            <p class="border-l-2 border-blue-500 bg-blue-50/50 px-2 py-1 text-[10px] font-bold text-blue-700">
              활성 거래처 {{ Number(kpi.activeVendorCount ?? 0).toLocaleString() }}곳 · 소재 {{ kpi.activeMaterialCount ?? 0 }}종
            </p>
          </router-link>

          <!-- 5. TOP 소재 (Vendor 점프) -->
          <router-link
            to="/hq/analytics/vendors"
            class="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-violet-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-violet-50">
                  <Recycle :size="14" class="text-violet-600" />
                </div>
                <p class="text-[12px] font-bold text-gray-800">🌿 TOP 소재</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-violet-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">기간 내 최다 거래 소재</p>
              <p class="mt-1 truncate text-2xl font-black text-violet-700">{{ kpi.topMaterialName || '-' }}</p>
              <p class="mt-1 text-[11px] text-gray-500">
                {{ formatKoreanMoney(kpi.topMaterialAmount ?? 0) }}
                · {{ Number(kpi.topMaterialWeight ?? 0).toLocaleString() }} kg
              </p>
            </div>
            <p class="border-l-2 border-emerald-500 bg-emerald-50/50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              <Leaf :size="9" class="mr-0.5 inline" /> {{ kpi.topMaterialType || '-' }}
            </p>
          </router-link>

          <!-- 6. 리포트 센터 -->
          <div class="flex flex-col gap-3 bg-white p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-gray-100">
                  <Download :size="14" class="text-gray-700" />
                </div>
                <p class="text-[12px] font-bold text-gray-800">리포트 센터</p>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <button
                type="button"
                class="group/btn flex items-center gap-2 border border-gray-200 bg-white px-2 py-1.5 text-left transition-colors hover:border-rose-300 hover:bg-rose-50/50"
              >
                <FileText :size="12" class="text-rose-600" />
                <span class="flex-1 text-[10px] font-medium text-gray-700">통합 대시보드 PDF</span>
                <Download :size="10" class="text-gray-300 group-hover/btn:text-rose-600" />
              </button>
              <button
                type="button"
                class="group/btn flex items-center gap-2 border border-gray-200 bg-white px-2 py-1.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <FileSpreadsheet :size="12" class="text-emerald-600" />
                <span class="flex-1 text-[10px] font-medium text-gray-700">4개 통계 Excel 일괄</span>
                <Download :size="10" class="text-gray-300 group-hover/btn:text-emerald-600" />
              </button>
              <button
                type="button"
                class="group/btn flex items-center gap-2 border border-gray-200 bg-white px-2 py-1.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/50"
              >
                <Calendar :size="12" class="text-blue-600" />
                <span class="flex-1 text-[10px] font-medium text-gray-700">월간 리포트 (자동)</span>
                <Download :size="10" class="text-gray-300 group-hover/btn:text-blue-600" />
              </button>
            </div>
            <span class="text-[10px] text-gray-400">최근 다운로드: 04/27 14:23</span>
          </div>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

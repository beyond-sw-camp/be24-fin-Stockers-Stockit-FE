<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayoutDashboard,
  TrendingUp,
  Truck,
  Repeat,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Clock,
  Calendar,
  ArrowRight,
  Download,
  FileText,
  FileSpreadsheet,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('통합 KPI 대시보드')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// 횡단 KPI (5개) — 핵심 숫자만 강조
const kpiStats = [
  { label: '금일 매출',     value: '128.4', unit: 'M원', sub: '↗ +8.2%',         icon: TrendingUp,   valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600', subCls: 'text-emerald-600' },
  { label: '평균 회전율',    value: '4.2',   unit: 'x',   sub: '⚠ 목표 4.5x 미달', icon: Repeat,       valueCls: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600', subCls: 'text-amber-600' },
  { label: '이번 달 발주',   value: '42.8',  unit: 'M원', sub: '승인 대기 18건',   icon: Truck,        valueCls: 'text-amber-700',  iconBg: 'bg-amber-50',  iconCls: 'text-amber-600',  subCls: 'text-gray-500' },
  { label: '활성 거래처',    value: '14',    unit: '곳',  sub: 'A 6 · B 5 · C 3',  icon: Calendar,     valueCls: 'text-blue-700',   iconBg: 'bg-blue-50',   iconCls: 'text-blue-600',   subCls: 'text-gray-500' },
  { label: '🚨 위험 알림',   value: '12',    unit: '건',  sub: '악성재고 ₩22.4M',  icon: AlertCircle,  valueCls: 'text-red-700',    iconBg: 'bg-red-50',    iconCls: 'text-red-600',    subCls: 'text-red-600' },
]

// 일자별 매출 추이 (12일)
const salesTrend = [76, 82, 88, 84, 92, 98, 104, 101, 110, 118, 124, 128]
const salesTrendLabels = ['04/17', '04/18', '04/19', '04/20', '04/21', '04/22', '04/23', '04/24', '04/25', '04/26', '04/27', '04/28']

const salesTrendChartData = computed(() => ({
  labels: salesTrendLabels,
  datasets: [
    {
      label: '일 매출',
      data: salesTrend,
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
        label: (ctx) => `₩${ctx.parsed.y}M`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => v + 'M' } },
  },
  interaction: { mode: 'index', intersect: false },
}

// 이상치 알림 (3건)
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

// CEN-045 소재 TOP3
const topMaterials = [
  { name: '면 (Cotton)', share: 19.5, units: 4500, sales: 65 },
  { name: '데님 (Denim)', share: 15.6, units: 2500, sales: 52 },
  { name: '셔츠 (Shirts)', share: 12.6, units: 2800, sales: 42 },
]
const totalMaterialSales = 333 // M원

// CEN-046 24h sparkline
const hourlySpark = [1.2, 0.6, 0.3, 0.2, 0.2, 0.4, 1.1, 2.4, 4.8, 6.2, 7.4, 8.6, 11.2, 9.8, 8.4, 7.6, 7.2, 8.4, 10.6, 12.4, 11.8, 8.2, 5.4, 2.8]
const maxHourly = Math.max(...hourlySpark)
const peakHour = hourlySpark.indexOf(maxHourly)
const totalDailySales = hourlySpark.reduce((a, b) => a + b, 0)

// CEN-047 회전율 요약
const turnoverSummary = {
  avg: 4.2,
  target: 4.5,
  best: { name: '강남점', value: 6.5 },
  worst: { name: '부산 센텀점', value: 2.1, days: 14.3 },
  storeCount: 8,
}

// CEN-048 계절별 요약
const seasonsSummary = [
  { season: '봄', sales: 384, share: 22.6, color: 'bg-emerald-500', textCls: 'text-emerald-700' },
  { season: '여름', sales: 472, share: 27.8, color: 'bg-amber-500', textCls: 'text-amber-700' },
  { season: '가을', sales: 412, share: 24.3, color: 'bg-orange-500', textCls: 'text-orange-700' },
  { season: '겨울', sales: 430, share: 25.3, color: 'bg-blue-500', textCls: 'text-blue-700' },
]
const maxSeason = Math.max(...seasonsSummary.map((s) => s.sales))
const totalAnnualSales = seasonsSummary.reduce((s, x) => s + x.sales, 0)

// CEN-049 발주 주기 요약
const orderCycleSummary = {
  avgCycle: 21,
  managedItems: 15,
  totalOrders: 173,
  shortest: { name: '반팔 티셔츠', cycle: 7 },
  longest: { name: '패딩', cycle: 42 },
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
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
        <span class="text-[11px] text-gray-500">4개 통계의 핵심 지표 + 즉시 액션을 한 화면에서 모니터링</span>
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
              <h3 class="text-sm font-medium text-gray-800">일자별 매출 추이</h3>
              <p class="mt-0.5 text-[10px] text-gray-400">최근 12일 (단위: 백만원)</p>
            </div>
            <span class="text-[10px] text-gray-500">최저 {{ Math.min(...salesTrend) }}M ↔ 최고 {{ Math.max(...salesTrend) }}M</span>
          </div>
          <div class="px-3 py-3">
            <LineChart :data="salesTrendChartData" :options="salesTrendChartOptions" :height="180" />
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
              <p class="mt-1 text-2xl font-black text-emerald-700">패딩</p>
              <p class="mt-1 text-[11px] text-gray-500">₩68M · 850개 판매</p>
            </div>
            <p class="border-l-2 border-emerald-500 bg-emerald-50/50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              아우터 카테고리 · 전체 매출 비중 14%
            </p>
          </router-link>

          <!-- 2. 재고 회전율 통계 — 회전율 + 악성재고 위험 강조 -->
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
              <p class="text-[10px] font-bold uppercase text-gray-400">평균 회전율 · 보유일</p>
              <p class="mt-1 flex items-baseline gap-2">
                <span class="text-2xl font-black text-violet-700">{{ turnoverSummary.avg }}x</span>
                <span class="text-[11px] font-bold text-gray-500">87일 보유</span>
              </p>
              <p class="mt-1 text-[11px] text-gray-500">목표 4.5x ⚠ 미달</p>
            </div>
            <p class="border-l-2 border-red-500 bg-red-50/50 px-2 py-1 text-[10px] font-bold text-red-700">
              🚨 악성 재고 12건 · ₩22.4M 묶임
            </p>
          </router-link>

          <!-- 3. 발주량 통계 — 발주 주기 강조 -->
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
              <p class="text-[10px] font-bold uppercase text-gray-400">평균 발주 주기</p>
              <p class="mt-1 flex items-baseline gap-2">
                <span class="text-2xl font-black text-orange-700">{{ orderCycleSummary.avgCycle }}</span>
                <span class="text-[11px] font-bold text-gray-500">일 / 회</span>
              </p>
              <p class="mt-1 text-[11px] text-gray-500">최근 6개월 {{ orderCycleSummary.totalOrders }}건 누적</p>
            </div>
            <p class="border-l-2 border-amber-500 bg-amber-50/50 px-2 py-1 text-[10px] font-bold text-amber-700">
              📋 승인 대기 18건 · 즉시 처리 권장
            </p>
          </router-link>

          <!-- 4. 순환재고 거래처 통계 — 거래처 등급 + TOP 강조 -->
          <router-link
            to="/hq/analytics/vendors"
            class="group flex flex-col gap-3 bg-white p-4 transition-colors hover:bg-blue-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-blue-50">
                  <Calendar :size="14" class="text-blue-600" />
                </div>
                <p class="text-[12px] font-bold text-gray-800">순환재고 거래처 통계</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-blue-600" />
            </div>
            <div>
              <p class="text-[10px] font-bold uppercase text-gray-400">⭐ TOP 거래처</p>
              <p class="mt-1 text-2xl font-black text-blue-700">(주)봄섬유</p>
              <p class="mt-1 text-[11px] text-gray-500">Cotton (면) · ₩280M / 의존도 18%</p>
            </div>
            <div class="flex items-center gap-1.5 text-[10px]">
              <span class="bg-emerald-100 px-2 py-0.5 font-black text-emerald-700">A 6</span>
              <span class="bg-blue-100 px-2 py-0.5 font-black text-blue-700">B 5</span>
              <span class="bg-red-100 px-2 py-0.5 font-black text-red-700">C 3</span>
            </div>
          </router-link>

          <!-- 5. 즉시 액션 보드 -->
          <div class="flex flex-col gap-3 bg-white p-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-rose-50">
                  <AlertCircle :size="14" class="text-rose-600" />
                </div>
                <p class="text-[12px] font-bold text-gray-800">🎯 즉시 액션</p>
              </div>
              <span class="text-[10px] font-black text-red-600">3건</span>
            </div>
            <ul class="space-y-1.5 text-[11px]">
              <li class="flex items-start gap-2 border-l-2 border-red-500 bg-red-50/50 px-2 py-1">
                <span class="font-bold text-red-700">🚨</span>
                <span class="text-gray-700">패딩 245일 보유 — 순환재고 전환</span>
              </li>
              <li class="flex items-start gap-2 border-l-2 border-amber-500 bg-amber-50/50 px-2 py-1">
                <span class="font-bold text-amber-700">⚠️</span>
                <span class="text-gray-700">가나섬유 단가 +5% — 협상 필요</span>
              </li>
              <li class="flex items-start gap-2 border-l-2 border-blue-500 bg-blue-50/50 px-2 py-1">
                <span class="font-bold text-blue-700">📋</span>
                <span class="text-gray-700">발주 결재 대기 18건 — 승인</span>
              </li>
            </ul>
          </div>

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

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

// 횡단 KPI (5개)
const kpiStats = [
  { label: '금일 누적 매출', value: '128.4', unit: 'M원', sub: '전일 마감 대비 +8.2%', icon: TrendingUp, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '전주 대비 증감률', value: '+6.4', unit: '%', sub: '직영점 성장 주도', icon: TrendingUp, valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
  { label: '총 발주 금액', value: '42.8', unit: 'M원', sub: '승인 대기 18건', icon: Truck, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
  { label: '평균 회전율', value: '4.2', unit: 'x', sub: '목표 4.5x 미달', icon: Repeat, valueCls: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600' },
  { label: '품절 위험 SKU', value: '27', unit: '개', sub: '전주 대비 -5', icon: AlertCircle, valueCls: 'text-red-700', iconBg: 'bg-red-50', iconCls: 'text-red-600' },
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
        <span class="text-[11px] text-gray-500">5개 분석 영역의 핵심 지표를 한 화면에서 모니터링</span>
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
              <span :class="[m.valueCls, 'text-[20px] font-bold tracking-tight']">{{ m.value }}</span>
              <span class="mb-0.5 text-[11px] text-gray-400">{{ m.unit }}</span>
            </div>
            <p class="mt-1 truncate text-[10px] text-gray-400">{{ m.sub }}</p>
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

      <!-- 5개 분석 영역 위젯 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <div>
            <h3 class="text-sm font-medium text-gray-800">주요 분석 영역</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">각 카드 클릭 시 상세 분석 페이지로 이동</p>
          </div>
        </div>

        <div class="grid gap-px bg-gray-200 md:grid-cols-2 xl:grid-cols-3">
          <!-- 소재별 판매량 -->
          <router-link
            to="/hq/analytics/menu-sales"
            class="group flex flex-col gap-2 bg-white p-3 transition-colors hover:bg-emerald-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-emerald-50">
                  <BarChart3 :size="14" class="text-emerald-600" />
                </div>
                <p class="text-[12px] font-semibold text-gray-800">소재별 판매량 및 비중</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-emerald-600" />
            </div>
            <p class="text-[10px] text-gray-500">소재(원단) 단위로 분석한 매출 점유율 TOP 3</p>
            <div class="space-y-1.5 border-y border-gray-100 py-2">
              <div v-for="(t, i) in topMaterials" :key="t.name" class="flex items-center gap-2">
                <span class="inline-flex h-4 w-4 shrink-0 items-center justify-center bg-emerald-100 text-[9px] font-black text-emerald-700">{{ i + 1 }}</span>
                <p class="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-700">{{ t.name }}</p>
                <span class="shrink-0 text-[10px] text-gray-500">₩{{ t.sales }}M</span>
                <span class="w-10 shrink-0 text-right text-[10px] font-bold text-emerald-700">{{ t.share }}%</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-gray-500">
              <span>총 매출 <span class="font-bold text-gray-700">₩{{ totalMaterialSales }}M</span></span>
              <span class="text-gray-400">14종 · 이번 달</span>
            </div>
          </router-link>

          <!-- 시간대 매출 패턴 -->
          <router-link
            to="/hq/analytics/sales-pattern"
            class="group flex flex-col gap-2 bg-white p-3 transition-colors hover:bg-emerald-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-blue-50">
                  <Clock :size="14" class="text-blue-600" />
                </div>
                <p class="text-[12px] font-semibold text-gray-800">시간대·요일 매출 패턴</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-blue-600" />
            </div>
            <p class="text-[10px] text-gray-500">하루 24시간 매출 분포 (어제 기준)</p>
            <div class="flex h-12 items-end gap-px">
              <div
                v-for="(v, i) in hourlySpark"
                :key="i"
                class="flex-1 bg-blue-400"
                :class="{ 'bg-blue-700': i === peakHour }"
                :style="{ height: (v / maxHourly * 100) + '%' }"
                :title="`${i}시: ${v.toFixed(1)}M`"
              />
            </div>
            <div class="grid grid-cols-2 gap-2 border-y border-gray-100 py-2 text-[10px]">
              <div>
                <p class="text-gray-500">🔥 피크 시간</p>
                <p class="mt-0.5 font-bold text-blue-700">{{ peakHour }}시 · ₩{{ maxHourly.toFixed(1) }}M</p>
              </div>
              <div>
                <p class="text-gray-500">하루 매출</p>
                <p class="mt-0.5 font-bold text-gray-700">₩{{ totalDailySales.toFixed(0) }}M</p>
              </div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-gray-500">
              <span>최고 요일 <span class="font-bold text-blue-700">토요일</span></span>
              <span class="text-gray-400">30일 평균</span>
            </div>
          </router-link>

          <!-- 재고 회전율 -->
          <router-link
            to="/hq/analytics/turnover"
            class="group flex flex-col gap-2 bg-white p-3 transition-colors hover:bg-emerald-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-violet-50">
                  <Repeat :size="14" class="text-violet-600" />
                </div>
                <p class="text-[12px] font-semibold text-gray-800">재고 회전율</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-violet-600" />
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-[26px] font-black text-violet-700">{{ turnoverSummary.avg }}</span>
              <span class="text-[11px] font-medium text-gray-500">회 / 월</span>
            </div>
            <p class="text-[10px] text-gray-500">한 달에 평균 {{ turnoverSummary.avg }}회 재고가 교체됨</p>
            <div class="space-y-1.5 border-y border-gray-100 py-2 text-[10px]">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">목표 회전율</span>
                <span class="font-medium" :class="turnoverSummary.avg >= turnoverSummary.target ? 'text-emerald-700' : 'text-red-600'">
                  {{ turnoverSummary.target }}회 ({{ turnoverSummary.avg >= turnoverSummary.target ? '달성 ✓' : '미달 ⚠' }})
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">우수 매장</span>
                <span class="font-medium text-emerald-700">{{ turnoverSummary.best.name }} ({{ turnoverSummary.best.value }}회)</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">주의 매장</span>
                <span class="font-medium text-red-600">{{ turnoverSummary.worst.name }} · {{ turnoverSummary.worst.days }}일 보유</span>
              </div>
            </div>
            <span class="text-[10px] text-gray-400">{{ turnoverSummary.storeCount }}개 매장 · 최근 6개월 평균</span>
          </router-link>

          <!-- 계절별 판매 변화 -->
          <router-link
            to="/hq/analytics/seasonal"
            class="group flex flex-col gap-2 bg-white p-3 transition-colors hover:bg-emerald-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-amber-50">
                  <Calendar :size="14" class="text-amber-600" />
                </div>
                <p class="text-[12px] font-semibold text-gray-800">계절별 판매 변화</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-amber-600" />
            </div>
            <p class="text-[10px] text-gray-500">계절별 매출 비중 (단위: 백만원)</p>
            <div class="grid grid-cols-4 gap-1.5">
              <div
                v-for="s in seasonsSummary"
                :key="s.season"
                class="text-center"
                :title="`${s.season}: ${s.sales}M (${s.share}%)`"
              >
                <div class="flex h-10 items-end overflow-hidden bg-gray-100">
                  <div class="w-full" :class="s.color" :style="{ height: (s.sales / maxSeason * 100) + '%' }" />
                </div>
                <p class="mt-1 text-[9px] font-bold" :class="s.textCls">{{ s.season }}</p>
                <p class="text-[9px] text-gray-400">{{ s.sales }}M</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 border-y border-gray-100 py-2 text-[10px]">
              <div>
                <p class="text-gray-500">🏆 베스트 시즌</p>
                <p class="mt-0.5 font-bold text-amber-700">여름 (27.8%)</p>
              </div>
              <div>
                <p class="text-gray-500">연간 매출</p>
                <p class="mt-0.5 font-bold text-gray-700">₩{{ totalAnnualSales }}M</p>
              </div>
            </div>
            <span class="text-[10px] text-gray-400">2026년 · 4계절 합계</span>
          </router-link>

          <!-- 발주량 통계 -->
          <router-link
            to="/hq/analytics/order-stats"
            class="group flex flex-col gap-2 bg-white p-3 transition-colors hover:bg-emerald-50/30"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-orange-50">
                  <Truck :size="14" class="text-orange-600" />
                </div>
                <p class="text-[12px] font-semibold text-gray-800">발주량 통계</p>
              </div>
              <ArrowRight :size="14" class="text-gray-300 transition-colors group-hover:text-orange-600" />
            </div>
            <div class="flex items-baseline gap-2">
              <span class="text-[26px] font-black text-orange-700">{{ orderCycleSummary.avgCycle }}</span>
              <span class="text-[11px] font-medium text-gray-500">일 / 회</span>
            </div>
            <p class="text-[10px] text-gray-500">품목당 평균 {{ orderCycleSummary.avgCycle }}일에 1회 발주 (재입고 주기)</p>
            <div class="space-y-1.5 border-y border-gray-100 py-2 text-[10px]">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">⚡ 최단 주기</span>
                <span class="truncate font-medium text-emerald-700">{{ orderCycleSummary.shortest.name }} · {{ orderCycleSummary.shortest.cycle }}일</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">🐢 최장 주기</span>
                <span class="truncate font-medium text-amber-700">{{ orderCycleSummary.longest.name }} · {{ orderCycleSummary.longest.cycle }}일</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">관리 품목</span>
                <span class="font-medium text-gray-700">{{ orderCycleSummary.managedItems }}종</span>
              </div>
            </div>
            <span class="text-[10px] text-gray-400">최근 6개월 누적 {{ orderCycleSummary.totalOrders }}건</span>
          </router-link>

          <!-- 6번째 셀: 리포트 센터 -->
          <div class="flex flex-col gap-2 bg-white p-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center bg-gray-100">
                  <Download :size="14" class="text-gray-700" />
                </div>
                <p class="text-[12px] font-semibold text-gray-800">리포트 센터</p>
              </div>
            </div>
            <p class="text-[10px] text-gray-500">통계 데이터를 PDF·Excel로 내보내기</p>
            <div class="flex flex-col gap-1.5 border-y border-gray-100 py-2">
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
                <span class="flex-1 text-[10px] font-medium text-gray-700">5개 지표 Excel 일괄</span>
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

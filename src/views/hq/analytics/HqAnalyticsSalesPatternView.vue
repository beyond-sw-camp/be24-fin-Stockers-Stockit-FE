<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Calendar, TrendingUp, Activity } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import ChartTooltip from '@/components/common/charts/ChartTooltip.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('시간대·요일 매출 패턴')

// CEN-046: 날짜 미선택 시 어제 매출 기준
const yesterday = new Date()
yesterday.setDate(yesterday.getDate() - 1)
const formatDate = (d) =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)

const selectedDate = ref(yesterday.toISOString().slice(0, 10))
const storeFilter = ref('전사 통합')
const categoryFilter = ref('전체')
const sizeFilter = ref('전체')

const storeOptions = ['전사 통합', '직영점', '강남점', '판교 테크노점', '여의도 IFC몰점', '성수 리빙샵', '부산 센텀점']

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// 24시간 매출 패턴 (선택 날짜 기준)
const hourlySales = [
  { h: 0, sales: 1.2 }, { h: 1, sales: 0.6 }, { h: 2, sales: 0.3 }, { h: 3, sales: 0.2 },
  { h: 4, sales: 0.2 }, { h: 5, sales: 0.4 }, { h: 6, sales: 1.1 }, { h: 7, sales: 2.4 },
  { h: 8, sales: 4.8 }, { h: 9, sales: 6.2 }, { h: 10, sales: 7.4 }, { h: 11, sales: 8.6 },
  { h: 12, sales: 11.2 }, { h: 13, sales: 9.8 }, { h: 14, sales: 8.4 }, { h: 15, sales: 7.6 },
  { h: 16, sales: 7.2 }, { h: 17, sales: 8.4 }, { h: 18, sales: 10.6 }, { h: 19, sales: 12.4 },
  { h: 20, sales: 11.8 }, { h: 21, sales: 8.2 }, { h: 22, sales: 5.4 }, { h: 23, sales: 2.8 },
]
const maxHourly = computed(() => Math.max(...hourlySales.map((p) => p.sales)))
const totalDaily = computed(() => hourlySales.reduce((s, p) => s + p.sales, 0))
const peak = computed(() => hourlySales.reduce((a, b) => (a.sales > b.sales ? a : b)))
const trough = computed(() => hourlySales.reduce((a, b) => (a.sales < b.sales ? a : b)))
const avgHourly = computed(() => totalDaily.value / 24)

// 요일별 평균 매출 (CEN-046: 최근 30일 7요일 평균)
const weeklyAvg = [
  { day: '월', sales: 96.4 },
  { day: '화', sales: 88.2 },
  { day: '수', sales: 92.8 },
  { day: '목', sales: 98.6 },
  { day: '금', sales: 124.4 },
  { day: '토', sales: 142.8 },
  { day: '일', sales: 118.6 },
]
const maxWeekly = computed(() => Math.max(...weeklyAvg.map((d) => d.sales)))
const bestDay = computed(() => weeklyAvg.reduce((a, b) => (a.sales > b.sales ? a : b)))

// 요일별 평균 매출 BarChart
const weeklyChartData = computed(() => ({
  labels: weeklyAvg.map((d) => d.day + '요일'),
  datasets: [
    {
      label: '요일별 평균 매출',
      data: weeklyAvg.map((d) => d.sales),
      backgroundColor: weeklyAvg.map((d) =>
        d.sales === bestDay.value.sales ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.85)',
      ),
      borderColor: weeklyAvg.map((d) =>
        d.sales === bestDay.value.sales ? '#d97706' : '#059669',
      ),
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 48,
      hoverBackgroundColor: weeklyAvg.map((d) =>
        d.sales === bestDay.value.sales ? '#d97706' : '#047857',
      ),
    },
  ],
}))

const weeklyChartOptions = computed(() => ({
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
        label: (ctx) => {
          const isPeak = weeklyAvg[ctx.dataIndex].sales === bestDay.value.sales
          return [
            `평균 매출 ₩${ctx.parsed.y.toFixed(1)}M`,
            '최근 30일 평균',
            isPeak ? '🏆 최고 매출 요일' : '',
          ].filter(Boolean)
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11, weight: 'bold' }, color: '#374151' },
    },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 }, callback: (v) => v + 'M' },
      beginAtZero: true,
    },
  },
}))

// 30일 일자별 매출 추세 (CEN-046)
const dailyTrend30 = Array.from({ length: 30 }, (_, i) => {
  const base = 95 + Math.sin(i / 4) * 12 + (i % 7 === 5 ? 35 : 0) + (i % 7 === 6 ? 18 : 0)
  return { day: i + 1, sales: Math.round(base * 10) / 10 }
})

const kpiMetrics = computed(() => [
  { label: '피크 시간대', value: `${peak.value.h}시`, unit: '', sub: `₩${peak.value.sales.toFixed(1)}M`, icon: Clock, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '최저 시간대', value: `${trough.value.h}시`, unit: '', sub: `₩${trough.value.sales.toFixed(1)}M`, icon: Activity, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
  { label: '시간당 평균', value: avgHourly.value.toFixed(1), unit: 'M원', sub: '하루 평균', icon: TrendingUp, valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
  { label: '최고 요일', value: `${bestDay.value.day}요일`, unit: '', sub: `${bestDay.value.sales.toFixed(0)}M (30일 평균)`, icon: Calendar, valueCls: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600' },
])

// 시간대별 매출 LineChart
const hourlyChartData = computed(() => ({
  labels: hourlySales.map((p) => `${p.h}시`),
  datasets: [
    {
      label: '시간대별 매출',
      data: hourlySales.map((p) => p.sales),
      borderColor: '#059669',
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#059669',
      pointBorderWidth: 2,
      tension: 0.4,
      fill: true,
    },
  ],
}))

const hourlyChartOptions = computed(() => ({
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
        label: (ctx) =>
          `매출 ₩${ctx.parsed.y.toFixed(1)}M (전체의 ${(ctx.parsed.y / totalDaily.value * 100).toFixed(1)}%)`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0, autoSkipPadding: 8 } },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 }, callback: (v) => v + 'M' },
      beginAtZero: true,
    },
  },
  interaction: { mode: 'index', intersect: false },
}))

// 30일 일자별 매출 추이 LineChart
const dailyTrendChartData = computed(() => ({
  labels: dailyTrend30.map((d) => `D-${30 - d.day + 1}`),
  datasets: [
    {
      label: '일별 매출',
      data: dailyTrend30.map((d) => d.sales),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.10)',
      borderWidth: 2,
      pointRadius: 1.5,
      pointHoverRadius: 5,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#2563eb',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: true,
    },
  ],
}))

const dailyTrendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#93c5fd',
      titleFont: { size: 11, weight: 'bold' },
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
      displayColors: false,
      callbacks: {
        label: (ctx) => `매출 ₩${ctx.parsed.y}M`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0, autoSkipPadding: 12 } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => v + 'M' } },
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
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">

      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Clock :size="18" class="text-emerald-600" />
            시간대·요일 매출 패턴
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준일: {{ formatDate(new Date(selectedDate)) }}
          </span>
        </div>
        <span class="text-[11px] text-gray-500">
          날짜 미선택 시 어제 매출 기준 · 요일 패턴은 30일 평균
        </span>
      </section>

      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">기준 날짜</span>
          <input v-model="selectedDate" type="date" class="border border-gray-200 bg-white px-2 py-1 text-[11px]" />
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">매장</span>
          <select v-model="storeFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option v-for="opt in storeOptions" :key="opt">{{ opt }}</option>
          </select>
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
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">사이즈</span>
          <select v-model="sizeFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option>전체</option>
            <option>XS</option>
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
            <option>XXL</option>
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

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">시간대별 매출 패턴</h3>
          <p class="mt-0.5 text-[10px] text-gray-400">선 그래프 · 24시간 단위 매출 (기준일: {{ formatDate(new Date(selectedDate)) }})</p>
        </div>
        <div class="px-3 py-3">
          <LineChart :data="hourlyChartData" :options="hourlyChartOptions" :height="220" />
        </div>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <div>
              <h3 class="text-sm font-medium text-gray-800">요일별 평균 매출</h3>
              <p class="mt-0.5 text-[10px] text-gray-400">최근 30일 요일별 평균 (단위: 백만원)</p>
            </div>
            <span class="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              🏆 {{ bestDay.day }}요일 {{ bestDay.sales.toFixed(0) }}M
            </span>
          </div>
          <div class="flex flex-1 items-center px-3 py-3">
            <BarChart :data="weeklyChartData" :options="weeklyChartOptions" :height="220" />
          </div>
        </article>

        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">30일 일자별 매출 추이</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">최근 30일 매출 추세선</p>
          </div>
          <div class="flex flex-1 items-center px-3 py-3">
            <LineChart :data="dailyTrendChartData" :options="dailyTrendChartOptions" :height="200" />
          </div>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">시간대별 매출 상세 (24시간)</h3>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[640px] text-[12px]">
            <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">시간대</th>
                <th class="px-3 py-2 text-right font-semibold">매출 (백만원)</th>
                <th class="px-3 py-2 text-left font-semibold">시각화</th>
                <th class="px-3 py-2 text-right font-semibold">전체 비중</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="p in hourlySales" :key="p.h" class="hover:bg-gray-50/60">
                <td class="px-3 py-1.5 font-medium text-gray-700">{{ p.h }}시 ~ {{ p.h + 1 }}시</td>
                <td class="px-3 py-1.5 text-right font-medium text-gray-800">{{ p.sales.toFixed(1) }}</td>
                <td class="px-3 py-1.5">
                  <div class="h-1.5 w-full overflow-hidden bg-gray-100">
                    <div class="h-1.5 bg-emerald-500" :style="{ width: (p.sales / maxHourly * 100) + '%' }" />
                  </div>
                </td>
                <td class="px-3 py-1.5 text-right font-bold text-emerald-700">
                  {{ (p.sales / totalDaily * 100).toFixed(1) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

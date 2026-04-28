<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Truck, Clock, Package, RefreshCw } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('발주량 통계')

const periodUnit = ref('월간')
const categoryFilter = ref('전체')
const sizeFilter = ref('전체')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

const orderCycleData = [
  { item: '반팔 티셔츠', category: '상의', avgCycle: 7, avgQty: 480, totalOrders: 26, lastOrderedAt: '2026-04-22' },
  { item: '청바지', category: '바지', avgCycle: 10, avgQty: 360, totalOrders: 18, lastOrderedAt: '2026-04-19' },
  { item: '셔츠', category: '상의', avgCycle: 12, avgQty: 280, totalOrders: 15, lastOrderedAt: '2026-04-21' },
  { item: '긴팔 티셔츠', category: '상의', avgCycle: 14, avgQty: 320, totalOrders: 13, lastOrderedAt: '2026-04-18' },
  { item: '후드티', category: '상의', avgCycle: 14, avgQty: 240, totalOrders: 12, lastOrderedAt: '2026-04-17' },
  { item: '긴바지', category: '바지', avgCycle: 18, avgQty: 240, totalOrders: 11, lastOrderedAt: '2026-04-15' },
  { item: '후드집업', category: '아우터', avgCycle: 21, avgQty: 180, totalOrders: 9, lastOrderedAt: '2026-04-10' },
  { item: '반바지', category: '바지', avgCycle: 21, avgQty: 220, totalOrders: 9, lastOrderedAt: '2026-04-08' },
  { item: '자켓', category: '아우터', avgCycle: 28, avgQty: 120, totalOrders: 7, lastOrderedAt: '2026-04-02' },
  { item: '니트', category: '상의', avgCycle: 28, avgQty: 180, totalOrders: 7, lastOrderedAt: '2026-03-28' },
  { item: '가디건', category: '아우터', avgCycle: 30, avgQty: 140, totalOrders: 6, lastOrderedAt: '2026-03-26' },
  { item: '츄리닝', category: '바지', avgCycle: 32, avgQty: 150, totalOrders: 6, lastOrderedAt: '2026-03-25' },
  { item: '미니스커트', category: '치마', avgCycle: 35, avgQty: 100, totalOrders: 5, lastOrderedAt: '2026-03-22' },
  { item: '롱스커트', category: '치마', avgCycle: 38, avgQty: 80, totalOrders: 5, lastOrderedAt: '2026-03-18' },
  { item: '패딩', category: '아우터', avgCycle: 42, avgQty: 110, totalOrders: 4, lastOrderedAt: '2026-03-15' },
]

const monthlyTrend = [
  { m: '11월', orders: 156, items: 32 },
  { m: '12월', orders: 184, items: 38 },
  { m: '1월', orders: 142, items: 28 },
  { m: '2월', orders: 168, items: 34 },
  { m: '3월', orders: 198, items: 42 },
  { m: '4월', orders: 174, items: 36 },
]

const totalItems = orderCycleData.length
const avgCycleAll = computed(() =>
  Math.round(orderCycleData.reduce((s, d) => s + d.avgCycle, 0) / orderCycleData.length),
)
const shortest = computed(() => orderCycleData.reduce((a, b) => (a.avgCycle < b.avgCycle ? a : b)))
const longest = computed(() => orderCycleData.reduce((a, b) => (a.avgCycle > b.avgCycle ? a : b)))
const totalOrdersSum = computed(() => orderCycleData.reduce((s, d) => s + d.totalOrders, 0))

const kpiMetrics = computed(() => [
  { label: '관리 품목 수', value: totalItems, unit: '개', sub: '발주 이력 기준', icon: Package, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '평균 발주 주기', value: avgCycleAll.value, unit: '일', sub: '품목 평균', icon: Clock, valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
  { label: '가장 짧은 주기', value: shortest.value.avgCycle, unit: '일', sub: shortest.value.item, icon: RefreshCw, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
  { label: '누적 발주', value: totalOrdersSum.value, unit: '건', sub: '최근 6개월', icon: Truck, valueCls: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600' },
])

// 품목별 평균 발주 주기 BarChart
const cycleChartData = computed(() => ({
  labels: orderCycleData.map((d) => d.item),
  datasets: [
    {
      label: '평균 발주 주기',
      data: orderCycleData.map((d) => d.avgCycle),
      backgroundColor: orderCycleData.map((d) =>
        d.avgCycle === shortest.value.avgCycle ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.85)',
      ),
      borderColor: orderCycleData.map((d) =>
        d.avgCycle === shortest.value.avgCycle ? '#d97706' : '#059669',
      ),
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false,
      maxBarThickness: 36,
      hoverBackgroundColor: orderCycleData.map((d) =>
        d.avgCycle === shortest.value.avgCycle ? '#d97706' : '#047857',
      ),
    },
  ],
}))

const cycleChartOptions = computed(() => ({
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
          const d = orderCycleData[ctx.dataIndex]
          const isShortest = d.avgCycle === shortest.value.avgCycle
          const isLongest = d.avgCycle === longest.value.avgCycle
          return [
            `카테고리: ${d.category}`,
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
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 10 },
        color: '#4b5563',
        maxRotation: 0,
        minRotation: 0,
        autoSkip: false,
        padding: 4,
      },
    },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 }, callback: (v) => v + '일' },
      beginAtZero: true,
    },
  },
  layout: { padding: { bottom: 4 } },
}))

const monthlyTrendChartData = computed(() => ({
  labels: monthlyTrend.map((m) => m.m),
  datasets: [
    {
      label: '발주 건수',
      data: monthlyTrend.map((m) => m.orders),
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
      data: monthlyTrend.map((m) => m.items),
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
    y: { position: 'left', grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => v + '건' }, beginAtZero: true },
    y1: { position: 'right', grid: { display: false }, ticks: { font: { size: 10 }, callback: (v) => v + '개' }, beginAtZero: true },
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
            <Truck :size="18" class="text-emerald-600" />
            발주량 통계
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
        </div>
        <span class="text-[11px] text-gray-500">품목별 평균 발주 주기 분석 (막대 차트)</span>
      </section>

      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">집계 단위</span>
          <div class="flex border border-gray-200">
            <button
              v-for="opt in ['월간', '분기']"
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

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2.5">
            <div>
              <h3 class="text-sm font-medium text-gray-800">품목별 평균 발주 주기</h3>
              <p class="mt-0.5 text-[10px] text-gray-400">막대 차트 · 단위: 일 (기간: {{ periodUnit }})</p>
            </div>
            <span class="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              ⚡ 최단 {{ shortest.item }} {{ shortest.avgCycle }}일
            </span>
          </div>
          <div class="flex flex-1 items-center px-3 py-3">
            <BarChart :data="cycleChartData" :options="cycleChartOptions" :height="220" />
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
        <div class="border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">품목별 발주 통계 상세</h3>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[760px] text-[12px]">
            <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">품목명</th>
                <th class="px-3 py-2 text-left font-semibold">카테고리</th>
                <th class="px-3 py-2 text-right font-semibold">평균 주기</th>
                <th class="px-3 py-2 text-right font-semibold">평균 수량</th>
                <th class="px-3 py-2 text-right font-semibold">누적 발주</th>
                <th class="px-3 py-2 text-left font-semibold">최근 발주일</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="d in orderCycleData" :key="d.item" class="hover:bg-gray-50/60">
                <td class="px-3 py-2.5 font-medium text-gray-800">{{ d.item }}</td>
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

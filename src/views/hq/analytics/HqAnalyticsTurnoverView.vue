<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Repeat, Timer, TrendingUp, AlertTriangle } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import ChartTooltip from '@/components/common/charts/ChartTooltip.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('재고 회전율 통계')

const periodUnit = ref('월간')
const scopeFilter = ref('전사 통합')
const categoryFilter = ref('전체')
const sizeFilter = ref('전체')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// 매장·창고별 회전율 (CEN-047: 본사 창고 + 가맹점)
const turnoverData = [
  { name: '본사 인천 제1창고', type: '본사 창고', avgInventory: 18420, sales: 92100, turnover: 5.0, daysOnHand: 6.0, status: '우수' },
  { name: '본사 이천 풀필먼트', type: '본사 창고', avgInventory: 12640, sales: 50560, turnover: 4.0, daysOnHand: 7.5, status: '정상' },
  { name: '본사 부산 물류창고', type: '본사 창고', avgInventory: 9820, sales: 27496, turnover: 2.8, daysOnHand: 10.7, status: '저조' },
  { name: '스톡잇 강남점', type: '직영점', avgInventory: 1240, sales: 8060, turnover: 6.5, daysOnHand: 4.6, status: '우수' },
  { name: '판교 테크노점', type: '직영점', avgInventory: 1080, sales: 5832, turnover: 5.4, daysOnHand: 5.6, status: '우수' },
  { name: '여의도 IFC몰점', type: '직영점', avgInventory: 1340, sales: 6432, turnover: 4.8, daysOnHand: 6.3, status: '정상' },
  { name: '성수 리빙샵', type: '직영점', avgInventory: 980, sales: 2842, turnover: 2.9, daysOnHand: 10.3, status: '저조' },
  { name: '부산 센텀점', type: '직영점', avgInventory: 1450, sales: 3045, turnover: 2.1, daysOnHand: 14.3, status: '경고' },
]

const filteredData = computed(() => {
  if (scopeFilter.value === '본사 창고만') return turnoverData.filter((d) => d.type === '본사 창고')
  if (scopeFilter.value === '직영점만') return turnoverData.filter((d) => d.type === '직영점')
  return turnoverData
})

const avgTurnover = computed(() => {
  const list = filteredData.value
  if (list.length === 0) return '0.00'
  return (list.reduce((s, d) => s + d.turnover, 0) / list.length).toFixed(2)
})

const avgDaysOnHand = computed(() => {
  const list = filteredData.value
  if (list.length === 0) return '0.0'
  return (list.reduce((s, d) => s + d.daysOnHand, 0) / list.length).toFixed(1)
})

const bestTurnover = computed(() =>
  filteredData.value.length ? filteredData.value.reduce((a, b) => (a.turnover > b.turnover ? a : b)) : { name: '-', turnover: 0 },
)

const worstTurnover = computed(() =>
  filteredData.value.length ? filteredData.value.reduce((a, b) => (a.turnover < b.turnover ? a : b)) : { name: '-', daysOnHand: 0 },
)

const maxTurnover = computed(() => Math.max(...filteredData.value.map((d) => d.turnover), 1))

// 6개월 추이
const trendByMonth = [
  { m: '11월', value: 4.2 },
  { m: '12월', value: 4.5 },
  { m: '1월', value: 4.0 },
  { m: '2월', value: 4.3 },
  { m: '3월', value: 4.6 },
  { m: '4월', value: 4.2 },
]

// 카테고리별 회전율
const categoryTurnover = [
  { category: '상의', avgInventory: 8420, sales: 51360, turnover: 6.1, daysOnHand: 4.9 },
  { category: '바지', avgInventory: 6240, sales: 31200, turnover: 5.0, daysOnHand: 6.0 },
  { category: '치마', avgInventory: 1820, sales: 6916, turnover: 3.8, daysOnHand: 7.9 },
  { category: '아우터', avgInventory: 5240, sales: 13624, turnover: 2.6, daysOnHand: 11.5 },
]

const kpiMetrics = computed(() => [
  { label: '평균 회전율', value: avgTurnover.value, unit: 'x', sub: `목표 4.5x ${parseFloat(avgTurnover.value) >= 4.5 ? '상회' : '미달'}`, icon: Repeat, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '평균 보유일', value: avgDaysOnHand.value, unit: '일', sub: '평균 재고 ÷ 일 평균 판매', icon: Timer, valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
  { label: '회전율 1위', value: bestTurnover.value.turnover, unit: 'x', sub: bestTurnover.value.name, icon: TrendingUp, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
  { label: '주의 필요', value: worstTurnover.value.daysOnHand, unit: '일', sub: worstTurnover.value.name, icon: AlertTriangle, valueCls: 'text-red-700', iconBg: 'bg-red-50', iconCls: 'text-red-600' },
])

const statusCls = {
  우수: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  정상: 'bg-blue-50 text-blue-700 border-blue-200',
  저조: 'bg-amber-50 text-amber-700 border-amber-200',
  경고: 'bg-red-50 text-red-700 border-red-200',
}

const turnoverTrendChartData = computed(() => ({
  labels: trendByMonth.map((p) => p.m),
  datasets: [
    {
      label: '평균 회전율',
      data: trendByMonth.map((p) => p.value),
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#7c3aed',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: true,
    },
    {
      label: '목표 (4.5x)',
      data: trendByMonth.map(() => 4.5),
      borderColor: '#f59e0b',
      borderDash: [4, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
      fill: false,
    },
  ],
}))

const turnoverTrendChartOptions = {
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
      titleColor: '#c4b5fd',
      titleFont: { size: 11, weight: 'bold' },
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}x`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: {
        font: { size: 10 },
        stepSize: 1,
        autoSkip: false,
        callback: (v) => v + 'x',
      },
      beginAtZero: true,
      min: 0,
      max: 9,
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
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">

      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Repeat :size="18" class="text-emerald-600" />
            재고 회전율 통계
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
        </div>
        <div class="flex flex-col items-end gap-0.5 text-[10px] text-gray-500">
          <span><b class="text-gray-700">재고 회전율</b> = 판매량 ÷ 평균 재고</span>
          <span><b class="text-gray-700">재고 보유일수</b> = 평균 재고 ÷ 하루 평균 판매량</span>
        </div>
      </section>

      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">기간</span>
          <div class="flex border border-gray-200">
            <button
              v-for="opt in ['월간', '분기', '연간']"
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
          <span class="text-[10px] font-bold uppercase text-gray-400">범위</span>
          <select v-model="scopeFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option>전사 통합</option>
            <option>본사 창고만</option>
            <option>직영점만</option>
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

      <section class="grid gap-3 xl:grid-cols-3">
        <article class="border border-gray-300 bg-white shadow-sm xl:col-span-2">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">매장·창고별 회전율 비교</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">단위: 회 (회전율 = 기간 내 판매량 / 평균 재고)</p>
          </div>
          <div class="px-3 py-3">
            <div class="space-y-2">
              <div
                v-for="d in filteredData"
                :key="d.name"
                class="group relative flex items-center gap-3 rounded px-1 py-0.5 transition-colors hover:bg-violet-50/40"
              >
                <div class="w-44 shrink-0">
                  <p class="truncate text-[12px] font-medium text-gray-700">{{ d.name }}</p>
                  <p class="text-[9px] text-gray-400">{{ d.type }}</p>
                </div>
                <div class="h-3 flex-1 overflow-hidden bg-gray-100">
                  <div
                    class="h-3 transition-all group-hover:brightness-110"
                    :class="d.turnover >= 4.5 ? 'bg-emerald-500' : d.turnover >= 3 ? 'bg-blue-500' : d.turnover >= 2.5 ? 'bg-amber-500' : 'bg-red-500'"
                    :style="{ width: (d.turnover / maxTurnover * 100) + '%' }"
                  />
                </div>
                <span class="w-12 shrink-0 text-right text-[11px] font-bold text-gray-700">{{ d.turnover }}x</span>
                <span class="w-14 shrink-0 text-right text-[10px] text-gray-400">{{ d.daysOnHand }}일</span>
                <ChartTooltip>
                  <p class="text-[11px] font-bold text-violet-300">{{ d.name }}</p>
                  <p class="text-[9px] text-gray-300">{{ d.type }}</p>
                  <div class="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-gray-700 pt-1 text-[10px]">
                    <span class="text-gray-400">회전율</span>
                    <span class="text-right font-bold text-violet-300">{{ d.turnover }}x</span>
                    <span class="text-gray-400">보유일수</span>
                    <span class="text-right font-semibold">{{ d.daysOnHand }}일</span>
                    <span class="text-gray-400">평균 재고</span>
                    <span class="text-right font-semibold">{{ d.avgInventory.toLocaleString() }}</span>
                    <span class="text-gray-400">판매량</span>
                    <span class="text-right font-semibold">{{ d.sales.toLocaleString() }}</span>
                    <span class="text-gray-400">상태</span>
                    <span class="text-right font-bold" :class="d.status === '우수' ? 'text-emerald-400' : d.status === '정상' ? 'text-blue-400' : d.status === '저조' ? 'text-amber-400' : 'text-red-400'">{{ d.status }}</span>
                  </div>
                </ChartTooltip>
              </div>
            </div>
          </div>
        </article>

        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">전사 회전율 추이</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">최근 6개월 (목표선 4.5x)</p>
          </div>
          <div class="flex flex-1 items-center px-3 py-3">
            <LineChart :data="turnoverTrendChartData" :options="turnoverTrendChartOptions" :height="320" />
          </div>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">카테고리별 회전율</h3>
          </div>
          <div class="overflow-auto">
            <table class="w-full text-[12px]">
              <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">카테고리</th>
                  <th class="px-3 py-2 text-right font-semibold">평균 재고</th>
                  <th class="px-3 py-2 text-right font-semibold">판매량</th>
                  <th class="px-3 py-2 text-right font-semibold">회전율</th>
                  <th class="px-3 py-2 text-right font-semibold">보유일수</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 border-t border-gray-200">
                <tr v-for="c in categoryTurnover" :key="c.category" class="hover:bg-gray-50/60">
                  <td class="px-3 py-2 font-medium text-gray-800">{{ c.category }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ c.avgInventory.toLocaleString() }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ c.sales.toLocaleString() }}</td>
                  <td class="px-3 py-2 text-right font-bold text-emerald-700">{{ c.turnover }}x</td>
                  <td class="px-3 py-2 text-right font-medium text-gray-700">{{ c.daysOnHand }}일</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">매장·창고 상세</h3>
          </div>
          <div class="overflow-auto">
            <table class="w-full text-[12px]">
              <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">대상</th>
                  <th class="px-3 py-2 text-right font-semibold">회전율</th>
                  <th class="px-3 py-2 text-right font-semibold">보유일수</th>
                  <th class="px-3 py-2 text-center font-semibold">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 border-t border-gray-200">
                <tr v-for="d in filteredData" :key="d.name" class="hover:bg-gray-50/60">
                  <td class="px-3 py-2 font-medium text-gray-800">{{ d.name }}</td>
                  <td class="px-3 py-2 text-right font-bold text-gray-700">{{ d.turnover }}x</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ d.daysOnHand }}일</td>
                  <td class="px-3 py-2 text-center">
                    <span class="inline-flex border px-1.5 py-0.5 text-[10px] font-bold" :class="statusCls[d.status]">
                      {{ d.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

    </div>
  </AppLayout>
</template>

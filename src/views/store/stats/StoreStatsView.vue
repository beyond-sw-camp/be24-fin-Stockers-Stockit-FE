<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const storeMenus = roleMenus.store
const statsMenus = roleMenus.store.find((menu) => menu.label === '통계')?.children ?? []
const activeTopMenu = computed(() => '통계')
const activeSideMenu = ref('매장 통계')

const kpi = [
  { label: '오늘 매출', value: '₩4,821,500', delta: '+12.3%', tone: 'up' },
  { label: '주간 매출', value: '₩29,484,000', delta: '+6.8%', tone: 'up' },
  { label: '객단가', value: '₩38,900', delta: '-2.1%', tone: 'down' },
  { label: '판매 건수', value: '124건', delta: '+9건', tone: 'up' },
  { label: '재고 부족 SKU', value: '7개', delta: '주의 필요', tone: 'warn' },
  { label: '발주 진행 건수', value: '5건', delta: '승인대기 2건', tone: 'neutral' },
]

const trend = [58, 72, 66, 81, 75, 92, 88]
const trendLabels = ['월', '화', '수', '목', '금', '토', '일']

const salesTrendChartData = computed(() => ({
  labels: trendLabels,
  datasets: [
    {
      label: '일 매출',
      data: trend,
      borderColor: '#0E7A60',
      backgroundColor: 'rgba(14, 122, 96, 0.14)',
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#0E7A60',
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
        label: (ctx) => `${ctx.parsed.y}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#9ca3af' } },
    y: {
      display: true,
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 }, color: '#9ca3af' },
      border: { display: false },
    },
  },
  interaction: { mode: 'index', intersect: false },
}

const categoryMix = [
  { name: '상의', percent: 38, color: '#0E7A60' },
  { name: '하의', percent: 27, color: '#3A9D85' },
  { name: '아우터', percent: 19, color: '#77BEAD' },
  { name: '잡화', percent: 16, color: '#B8DDD4' },
]

const topSkus = [
  { sku: 'SKU-0132', name: '오버핏 코튼 티셔츠', qty: 48, amount: 1152000 },
  { sku: 'SKU-0084', name: '슬림 데님 팬츠', qty: 37, amount: 1776000 },
  { sku: 'SKU-0201', name: '린넨 블렌드 셔츠', qty: 32, amount: 1536000 },
  { sku: 'SKU-0314', name: '라운드 니트 가디건', qty: 24, amount: 2112000 },
  { sku: 'SKU-0160', name: '캔버스 토트백', qty: 21, amount: 756000 },
]

const riskSkus = [
  { sku: 'SKU-0084-BLK-28', name: '슬림 데님 팬츠 / 28', stock: 2, safe: 10, risk: '높음' },
  { sku: 'SKU-0132-WHT-XS', name: '오버핏 코튼 티셔츠 / XS', stock: 5, safe: 15, risk: '중간' },
  { sku: 'SKU-0314-GRY-M', name: '라운드 니트 가디건 / M', stock: 8, safe: 20, risk: '중간' },
  { sku: 'SKU-0201-IVR-L', name: '린넨 블렌드 셔츠 / L', stock: 11, safe: 18, risk: '관심' },
]

function toneClass(tone) {
  if (tone === 'up') return 'text-emerald-600'
  if (tone === 'down') return 'text-red-500'
  if (tone === 'warn') return 'text-amber-600'
  return 'text-gray-500'
}

function riskClass(risk) {
  if (risk === '높음') return 'bg-red-50 text-red-600'
  if (risk === '중간') return 'bg-amber-50 text-amber-600'
  return 'bg-slate-100 text-slate-600'
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="statsMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Statistics</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">매장 통계</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">매장 운영에 필요한 핵심 지표를 한 페이지에서 확인합니다.</p>
      </section>

      <section class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <article v-for="item in kpi" :key="item.label" class="border border-gray-300 bg-white px-3 py-3 shadow-sm">
          <p class="text-[11px] font-bold text-gray-500">{{ item.label }}</p>
          <p class="mt-2 text-xl font-black text-gray-900">{{ item.value }}</p>
          <p class="mt-1 text-[11px] font-bold" :class="toneClass(item.tone)">{{ item.delta }}</p>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">최근 7일 매출 추이</h2>
          </div>
          <div class="px-4 pb-4 pt-3">
            <div class="h-[140px]">
              <LineChart :data="salesTrendChartData" :options="salesTrendChartOptions" :height="140" />
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">카테고리별 매출 비중</h2>
          </div>
          <div class="space-y-3 px-4 py-4">
            <div v-for="row in categoryMix" :key="row.name" class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-gray-700">{{ row.name }}</span>
                <span class="font-black text-gray-900">{{ row.percent }}%</span>
              </div>
              <div class="h-2 overflow-hidden bg-gray-100">
                <div class="h-full" :style="{ width: `${row.percent}%`, backgroundColor: row.color }" />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">판매 TOP SKU</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[520px] text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-3 text-left font-black">SKU</th>
                  <th class="px-3 py-3 text-left font-black">상품명</th>
                  <th class="px-3 py-3 text-right font-black">판매수량</th>
                  <th class="px-3 py-3 text-right font-black">매출</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in topSkus" :key="row.sku">
                  <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.sku }}</td>
                  <td class="px-3 py-3 font-bold text-gray-800">{{ row.name }}</td>
                  <td class="px-3 py-3 text-right font-black text-gray-700">{{ row.qty }}</td>
                  <td class="px-3 py-3 text-right font-black text-gray-900">₩{{ row.amount.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">재고 리스크 SKU</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[520px] text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-3 text-left font-black">SKU</th>
                  <th class="px-3 py-3 text-left font-black">상품명</th>
                  <th class="px-3 py-3 text-right font-black">재고/안전</th>
                  <th class="px-3 py-3 text-center font-black">위험도</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in riskSkus" :key="row.sku">
                  <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.sku }}</td>
                  <td class="px-3 py-3 font-bold text-gray-800">{{ row.name }}</td>
                  <td class="px-3 py-3 text-right font-black text-gray-700">{{ row.stock }} / {{ row.safe }}</td>
                  <td class="px-3 py-3 text-center">
                    <span class="px-2 py-1 text-[11px] font-black" :class="riskClass(row.risk)">{{ row.risk }}</span>
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

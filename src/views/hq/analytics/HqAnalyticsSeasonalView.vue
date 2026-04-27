<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Snowflake, Sun, Sprout, Leaf, Calendar } from 'lucide-vue-next'
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
const activeSideMenu = ref('계절별 판매량 변화')

const yearFilter = ref('2026')
const categoryFilter = ref('전체')
const sizeFilter = ref('전체')
const selectedSeason = ref('봄')

const seasonMeta = {
  봄: { key: 'spring', months: '3월 ~ 5월', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', textCls: 'text-emerald-700', activeCls: 'bg-emerald-600 text-white', icon: Sprout },
  여름: { key: 'summer', months: '6월 ~ 8월', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', textCls: 'text-amber-700', activeCls: 'bg-amber-600 text-white', icon: Sun },
  가을: { key: 'autumn', months: '9월 ~ 11월', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', textCls: 'text-orange-700', activeCls: 'bg-orange-600 text-white', icon: Leaf },
  겨울: { key: 'winter', months: '12월 ~ 2월', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', textCls: 'text-blue-700', activeCls: 'bg-blue-600 text-white', icon: Snowflake },
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

const seasonTotals = [
  { season: '봄', months: '3-5월', sales: 384, share: 22.6, icon: Sprout, color: '#10b981', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200', textClass: 'text-emerald-700' },
  { season: '여름', months: '6-8월', sales: 472, share: 27.8, icon: Sun, color: '#f59e0b', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', textClass: 'text-amber-700' },
  { season: '가을', months: '9-11월', sales: 412, share: 24.3, icon: Leaf, color: '#d97706', bgClass: 'bg-orange-50', borderClass: 'border-orange-200', textClass: 'text-orange-700' },
  { season: '겨울', months: '12-2월', sales: 430, share: 25.3, icon: Snowflake, color: '#3b82f6', bgClass: 'bg-blue-50', borderClass: 'border-blue-200', textClass: 'text-blue-700' },
]
const maxSeason = computed(() => Math.max(...seasonTotals.map((s) => s.sales)))

const itemSeasonality = [
  { item: '반팔 티셔츠', category: '상의', spring: 38, summer: 96, autumn: 18, winter: 4, peak: '여름' },
  { item: '긴팔 티셔츠', category: '상의', spring: 72, summer: 18, autumn: 86, winter: 64, peak: '가을' },
  { item: '셔츠', category: '상의', spring: 78, summer: 56, autumn: 82, winter: 42, peak: '가을' },
  { item: '니트', category: '상의', spring: 22, summer: 4, autumn: 78, winter: 92, peak: '겨울' },
  { item: '후드티', category: '상의', spring: 64, summer: 16, autumn: 82, winter: 74, peak: '가을' },
  { item: '청바지', category: '바지', spring: 86, summer: 42, autumn: 78, winter: 52, peak: '봄' },
  { item: '반바지', category: '바지', spring: 24, summer: 94, autumn: 12, winter: 2, peak: '여름' },
  { item: '긴바지', category: '바지', spring: 56, summer: 18, autumn: 82, winter: 88, peak: '겨울' },
  { item: '츄리닝', category: '바지', spring: 62, summer: 38, autumn: 68, winter: 76, peak: '겨울' },
  { item: '미니스커트', category: '치마', spring: 78, summer: 88, autumn: 32, winter: 8, peak: '여름' },
  { item: '롱스커트', category: '치마', spring: 72, summer: 56, autumn: 64, winter: 38, peak: '봄' },
  { item: '패딩', category: '아우터', spring: 8, summer: 2, autumn: 36, winter: 96, peak: '겨울' },
  { item: '후드집업', category: '아우터', spring: 68, summer: 14, autumn: 84, winter: 62, peak: '가을' },
  { item: '자켓', category: '아우터', spring: 84, summer: 22, autumn: 78, winter: 38, peak: '봄' },
  { item: '가디건', category: '아우터', spring: 64, summer: 18, autumn: 82, winter: 72, peak: '가을' },
]

const yearlyHistory = [
  { year: '2023', spring: 312, summer: 388, autumn: 348, winter: 372 },
  { year: '2024', spring: 348, summer: 422, autumn: 378, winter: 401 },
  { year: '2025', spring: 364, summer: 446, autumn: 396, winter: 418 },
  { year: '2026', spring: 384, summer: 472, autumn: 412, winter: 430 },
]

const peakSeason = computed(() => seasonTotals.reduce((a, b) => (a.sales > b.sales ? a : b)))
const seasonalitySpread = computed(() => {
  const max = maxSeason.value
  const min = Math.min(...seasonTotals.map((s) => s.sales))
  return ((max - min) / max * 100).toFixed(1)
})

const filteredItemSeasonality = computed(() => {
  if (categoryFilter.value === '전체') return itemSeasonality
  return itemSeasonality.filter((i) => i.category === categoryFilter.value)
})

const stableMenuCount = computed(() =>
  filteredItemSeasonality.value.filter((m) => {
    const arr = [m.spring, m.summer, m.autumn, m.winter]
    return Math.max(...arr) - Math.min(...arr) < 30
  }).length,
)

const kpiMetrics = computed(() => [
  { label: '베스트 시즌', value: peakSeason.value.season, unit: peakSeason.value.months, sub: `${peakSeason.value.sales}M (${peakSeason.value.share}%)`, icon: peakSeason.value.icon, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '시즌 편차', value: seasonalitySpread.value, unit: '%', sub: '최고-최저 시즌간', icon: Calendar, valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
  { label: '계절성 강한 품목', value: filteredItemSeasonality.value.length - stableMenuCount.value, unit: '개', sub: '편차 30 이상', icon: Sun, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
  { label: '안정 품목', value: stableMenuCount.value, unit: '개', sub: '시즌 편차 적음', icon: Leaf, valueCls: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600' },
])

const peakBadge = {
  봄: 'bg-emerald-50 text-emerald-700',
  여름: 'bg-amber-50 text-amber-700',
  가을: 'bg-orange-50 text-orange-700',
  겨울: 'bg-blue-50 text-blue-700',
}

const yearlyChartData = computed(() => {
  const meta = seasonMeta[selectedSeason.value]
  return {
    labels: yearlyHistory.map((y) => y.year + '년'),
    datasets: [
      {
        label: selectedSeason.value,
        data: yearlyHistory.map((y) => y[meta.key]),
        borderColor: meta.color,
        backgroundColor: meta.bg,
        borderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#fff',
        pointBorderColor: meta.color,
        pointBorderWidth: 2,
        tension: 0.35,
        fill: true,
      },
    ],
  }
})

const yearlyChartOptions = computed(() => {
  const meta = seasonMeta[selectedSeason.value]
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: meta.color,
        titleFont: { size: 11, weight: 'bold' },
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: (items) => `${items[0].label} ${selectedSeason.value}`,
          label: (ctx) => `매출 ₩${ctx.parsed.y}M`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => v + 'M' }, beginAtZero: true },
    },
    interaction: { mode: 'index', intersect: false },
  }
})

const seasonStats = computed(() => {
  const meta = seasonMeta[selectedSeason.value]
  const values = yearlyHistory.map((y) => y[meta.key])
  const latest = values[values.length - 1]
  const prev = values[values.length - 2]
  const yoyPct = prev ? ((latest - prev) / prev * 100).toFixed(1) : '0.0'
  const max = Math.max(...values)
  const min = Math.min(...values)
  return { latest, prev, yoyPct, max, min, avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(0) }
})
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
            <Calendar :size="18" class="text-emerald-600" />
            계절별 판매량 변화
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
        </div>
        <span class="text-[11px] text-gray-500">계절별 품목 판매량 변화 추적</span>
      </section>

      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">연도</span>
          <select v-model="yearFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option>2026</option>
            <option>2025</option>
            <option>2024</option>
            <option>2023</option>
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

      <section class="grid gap-3 xl:grid-cols-4">
        <article
          v-for="s in seasonTotals"
          :key="s.season"
          class="group relative border bg-white p-3 shadow-sm transition-all hover:shadow-lg"
          :class="[s.borderClass, s.bgClass]"
        >
          <ChartTooltip>
            <p class="text-[11px] font-bold" :style="{ color: s.color }">{{ s.season }} ({{ s.months }})</p>
            <div class="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-gray-700 pt-1 text-[10px]">
              <span class="text-gray-400">매출</span>
              <span class="text-right text-[12px] font-bold">₩{{ s.sales }}M</span>
              <span class="text-gray-400">연간 비중</span>
              <span class="text-right font-semibold" :style="{ color: s.color }">{{ s.share }}%</span>
            </div>
          </ChartTooltip>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[11px] font-bold" :class="s.textClass">{{ s.season }}</p>
              <p class="text-[10px] text-gray-500">{{ s.months }}</p>
            </div>
            <component :is="s.icon" :size="18" :class="s.textClass" />
          </div>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-[22px] font-black" :class="s.textClass">{{ s.sales }}</span>
            <span class="text-[10px] text-gray-500">M원</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-[10px]">
            <span class="text-gray-500">연간 비중</span>
            <span class="font-bold" :class="s.textClass">{{ s.share }}%</span>
          </div>
          <div class="mt-1.5 h-1.5 w-full overflow-hidden bg-white">
            <div class="h-1.5" :style="{ width: (s.sales / maxSeason * 100) + '%', backgroundColor: s.color }" />
          </div>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-3 py-2.5">
          <div>
            <h3 class="text-sm font-medium text-gray-800">
              다년간 계절별 매출 추이
              <span class="ml-1 text-[11px] font-semibold" :class="seasonMeta[selectedSeason].textCls">
                · {{ selectedSeason }} ({{ seasonMeta[selectedSeason].months }})
              </span>
            </h3>
            <p class="mt-0.5 text-[10px] text-gray-400">선택한 시즌의 연도별 매출 변화 (단위: 백만원)</p>
          </div>
          <div class="flex items-center gap-1 border border-gray-200 p-0.5">
            <button
              v-for="(meta, season) in seasonMeta"
              :key="season"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold transition-colors"
              :class="selectedSeason === season ? meta.activeCls : 'bg-white text-gray-600 hover:bg-gray-50'"
              @click="selectedSeason = season"
            >
              <component :is="meta.icon" :size="12" />
              {{ season }}
            </button>
          </div>
        </div>

        <div class="grid gap-3 px-3 py-3 xl:grid-cols-[1fr_220px]">
          <div>
            <LineChart :data="yearlyChartData" :options="yearlyChartOptions" :height="220" />
          </div>
          <aside class="flex flex-col gap-2">
            <div class="border p-2.5" :class="selectedSeason === '봄' ? 'border-emerald-200 bg-emerald-50' : selectedSeason === '여름' ? 'border-amber-200 bg-amber-50' : selectedSeason === '가을' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'">
              <p class="text-[10px] text-gray-500">
                올해({{ yearFilter }}) {{ selectedSeason }}
                <span class="text-gray-400">· {{ seasonMeta[selectedSeason].months }}</span>
              </p>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-[20px] font-black" :class="seasonMeta[selectedSeason].textCls">{{ seasonStats.latest }}</span>
                <span class="text-[11px] text-gray-500">M원</span>
              </div>
              <p class="mt-1 text-[10px] font-semibold" :class="parseFloat(seasonStats.yoyPct) >= 0 ? 'text-emerald-600' : 'text-red-600'">
                전년 대비 {{ parseFloat(seasonStats.yoyPct) >= 0 ? '+' : '' }}{{ seasonStats.yoyPct }}%
              </p>
            </div>
            <div class="grid grid-cols-2 gap-2 border border-gray-200 p-2.5 text-[10px]">
              <div>
                <p class="text-gray-500">최고</p>
                <p class="mt-0.5 font-bold text-gray-800">{{ seasonStats.max }}M</p>
              </div>
              <div>
                <p class="text-gray-500">최저</p>
                <p class="mt-0.5 font-bold text-gray-800">{{ seasonStats.min }}M</p>
              </div>
              <div>
                <p class="text-gray-500">4년 평균</p>
                <p class="mt-0.5 font-bold text-gray-800">{{ seasonStats.avg }}M</p>
              </div>
              <div>
                <p class="text-gray-500">전년</p>
                <p class="mt-0.5 font-bold text-gray-800">{{ seasonStats.prev }}M</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">품목별 계절성 강도</h3>
          <p class="mt-0.5 text-[10px] text-gray-400">계절별 판매량(상대지수) — 피크 시즌이 집중될수록 계절성이 강함</p>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[680px] text-[12px]">
            <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">품목명</th>
                <th class="px-3 py-2 text-left font-semibold">카테고리</th>
                <th class="px-3 py-2 text-right font-semibold">봄</th>
                <th class="px-3 py-2 text-right font-semibold">여름</th>
                <th class="px-3 py-2 text-right font-semibold">가을</th>
                <th class="px-3 py-2 text-right font-semibold">겨울</th>
                <th class="px-3 py-2 text-center font-semibold">피크 시즌</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="m in filteredItemSeasonality" :key="m.item" class="hover:bg-gray-50/60">
                <td class="px-3 py-2 font-medium text-gray-800">{{ m.item }}</td>
                <td class="px-3 py-2 text-gray-500">{{ m.category }}</td>
                <td class="px-3 py-2 text-right" :class="m.peak === '봄' ? 'font-bold text-emerald-700' : 'text-gray-500'">{{ m.spring }}</td>
                <td class="px-3 py-2 text-right" :class="m.peak === '여름' ? 'font-bold text-amber-700' : 'text-gray-500'">{{ m.summer }}</td>
                <td class="px-3 py-2 text-right" :class="m.peak === '가을' ? 'font-bold text-orange-700' : 'text-gray-500'">{{ m.autumn }}</td>
                <td class="px-3 py-2 text-right" :class="m.peak === '겨울' ? 'font-bold text-blue-700' : 'text-gray-500'">{{ m.winter }}</td>
                <td class="px-3 py-2 text-center">
                  <span class="inline-flex px-1.5 py-0.5 text-[10px] font-bold" :class="peakBadge[m.peak]">{{ m.peak }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

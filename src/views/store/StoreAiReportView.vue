<script setup>
import { computed, h, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useStoreAiReportStore } from '@/stores/storeAiReport.js'

const router = useRouter()
const auth = useAuthStore()
const reportStore = useStoreAiReportStore()

const storeMenus = roleMenus.store
const sideMenus = roleMenus.store
const activeTopMenu = computed(() => 'AI 리포트')
const activeSideMenu = ref('AI 리포트')

const showHistoryDropdown = ref(false)
const historyDropdownRef = ref(null)
const expandedRestockId = ref(null)

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function toggleHistoryDropdown() {
  showHistoryDropdown.value = !showHistoryDropdown.value
}

function handleSelectSnapshot(id) {
  reportStore.loadSnapshot(id)
  showHistoryDropdown.value = false
}

function handleRegenerate() {
  reportStore.regenerate()
}

function handleRangeChange(tab) {
  reportStore.setRange(tab)
}

function handleToggleRestock(id) {
  expandedRestockId.value = expandedRestockId.value === id ? null : id
}

function handleNavigateOrder(productCode) {
  router.push({ name: 'store-orders', query: { productId: productCode } })
}

function handleBundleSuggest(bundle) {
  alert(`묶음 프로모션 제안: ${bundle}`)
}

function handleOutsideClick(e) {
  if (!showHistoryDropdown.value) return
  const el = historyDropdownRef.value
  if (el && !el.contains(e.target)) {
    showHistoryDropdown.value = false
  }
}

function handleKeydown(e) {
  if (e.key !== 'Escape') return
  if (showHistoryDropdown.value) {
    showHistoryDropdown.value = false
    return
  }
  if (expandedRestockId.value) {
    expandedRestockId.value = null
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
  window.removeEventListener('keydown', handleKeydown)
})

function formatDateTime(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatRelative(iso) {
  if (!iso) return '-'
  const now = new Date()
  const target = new Date(iso)
  const diffMs = now - target
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`
  return formatDateTime(iso)
}

const generationTypeLabel = {
  weekly: '자동 주간',
  monthly: '자동 월간',
  manual: '수동',
}

function generationBadgeClass(type) {
  const map = {
    weekly: 'bg-emerald-50 text-emerald-700',
    monthly: 'bg-blue-50 text-blue-700',
    manual: 'bg-amber-50 text-amber-700',
  }
  return map[type] ?? 'bg-gray-100 text-gray-600'
}

function urgencyBadgeClass(u) {
  const map = {
    critical: 'bg-red-50 text-red-700',
    warn: 'bg-amber-50 text-amber-700',
    ok: 'bg-emerald-50 text-emerald-700',
  }
  return map[u] ?? 'bg-gray-100 text-gray-600'
}

function urgencyLabel(u) {
  const map = { critical: '긴급', warn: '주의', ok: '정상' }
  return map[u] ?? u
}

const rangeMultiplier = computed(() => (reportStore.rangeTab === 'monthly' ? 4.3 : 1))

const summaryCards = computed(() => {
  const s = reportStore.currentReport.summary
  const rangeLabel = reportStore.rangeTab === 'monthly' ? '월간' : '주간'
  return [
    { label: `${rangeLabel} 매출 TOP 상품`, value: s.weeklyTopProduct, unit: '' },
    {
      label: '전면 배치 추천',
      value: Math.round(s.displayChangeCount * rangeMultiplier.value),
      unit: '건',
    },
    {
      label: '발주 권장',
      value: Math.round(s.restockCount * rangeMultiplier.value),
      unit: '건',
    },
    { label: '연관 강도 점수', value: s.associationScore, unit: '점' },
  ]
})

const displayChartData = computed(() => {
  const list = [...reportStore.currentReport.displayRecommendations]
    .sort((a, b) => b.expectedUpliftPct - a.expectedUpliftPct)
    .slice(0, 10)
  return {
    labels: list.map((r) => r.productName),
    datasets: [
      {
        label: '전면 배치 시 예상 매출 상승률 (%)',
        data: list.map((r) => r.expectedUpliftPct),
        backgroundColor: '#004D3C',
        borderRadius: 2,
        maxBarThickness: 18,
      },
    ],
  }
})

const displayChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `+${ctx.parsed.x}% 예상 상승`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: '#f3f4f6' },
      ticks: { callback: (v) => `${v}%`, font: { size: 10 } },
    },
    y: { grid: { display: false }, ticks: { font: { size: 11 } } },
  },
}

const displayKpi = computed(() => {
  const list = reportStore.currentReport.displayRecommendations
  if (list.length === 0) {
    return { count: 0, avgUplift: 0, topName: '-' }
  }
  const avg = list.reduce((sum, r) => sum + r.expectedUpliftPct, 0) / list.length
  const top = [...list].sort((a, b) => b.weeklySales - a.weeklySales)[0]
  return {
    count: list.length,
    avgUplift: Math.round(avg),
    topName: top.productName,
  }
})

const sortedDisplayCards = computed(() =>
  [...reportStore.currentReport.displayRecommendations].sort(
    (a, b) => b.expectedUpliftPct - a.expectedUpliftPct,
  ),
)

function restockTrendData(productCode) {
  const values = reportStore.salesTrend(productCode)
  const labels = Array.from({ length: 7 }, (_, i) => `${i + 1}일 전`).reverse()
  return {
    labels,
    datasets: [
      {
        label: '일별 판매량',
        data: values,
        borderColor: '#004D3C',
        backgroundColor: 'rgba(0, 77, 60, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#004D3C',
      },
    ],
  }
}

const restockTrendOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 } },
      beginAtZero: true,
    },
  },
}

const IconBase = (paths) => ({
  props: {
    size: { type: Number, default: 16 },
    strokeWidth: { type: Number, default: 2 },
  },
  render() {
    return h(
      'svg',
      {
        width: this.size,
        height: this.size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': this.strokeWidth,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true',
      },
      paths.map((p) => h(p.tag, p.attrs)),
    )
  },
})

const SparklesIcon = IconBase([
  {
    tag: 'path',
    attrs: {
      d: 'M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1',
    },
  },
])

const ChevronDownIcon = IconBase([{ tag: 'path', attrs: { d: 'm6 9 6 6 6-6' } }])
const CheckIcon = IconBase([{ tag: 'path', attrs: { d: 'M20 6 9 17l-5-5' } }])
const RefreshIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 12a9 9 0 0 1 15-6.7L21 8' } },
  { tag: 'path', attrs: { d: 'M21 3v5h-5' } },
  { tag: 'path', attrs: { d: 'M21 12a9 9 0 0 1-15 6.7L3 16' } },
  { tag: 'path', attrs: { d: 'M3 21v-5h5' } },
])
const TrendUpIcon = IconBase([
  { tag: 'path', attrs: { d: 'm3 17 6-6 4 4 8-8' } },
  { tag: 'path', attrs: { d: 'M14 7h7v7' } },
])
const TrendDownIcon = IconBase([
  { tag: 'path', attrs: { d: 'm3 7 6 6 4-4 8 8' } },
  { tag: 'path', attrs: { d: 'M14 17h7v-7' } },
])
const PackageIcon = IconBase([
  { tag: 'path', attrs: { d: 'm3 7 9-4 9 4v10l-9 4-9-4Z' } },
  { tag: 'path', attrs: { d: 'M3 7l9 4 9-4' } },
  { tag: 'path', attrs: { d: 'M12 11v10' } },
])
const CartIcon = IconBase([
  { tag: 'circle', attrs: { cx: '9', cy: '20', r: '1.5' } },
  { tag: 'circle', attrs: { cx: '17', cy: '20', r: '1.5' } },
  { tag: 'path', attrs: { d: 'M3 4h2l2.7 11.3a2 2 0 0 0 2 1.7h8.6a2 2 0 0 0 2-1.6L22 8H6' } },
])
const LinkIcon = IconBase([
  { tag: 'path', attrs: { d: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1' } },
  { tag: 'path', attrs: { d: 'M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1' } },
])
const ChevronIcon = IconBase([{ tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }])
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <!-- 리포트 헤더 -->
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <!-- 왼쪽: 타이틀 + 메타 -->
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center bg-[#E6F2F0] text-[#004D3C]"
            >
              <SparklesIcon :size="20" />
            </div>
            <div>
              <h1 class="text-lg font-black text-gray-900">스마트 워크 AI 리포트</h1>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span
                  class="inline-flex items-center px-2 py-0.5 text-[10px] font-black"
                  :class="generationBadgeClass(reportStore.reportMeta.generationType)"
                >
                  {{ generationTypeLabel[reportStore.reportMeta.generationType] }}
                </span>
                <span>
                  최근 생성
                  <strong class="font-bold text-gray-700">
                    {{ formatDateTime(reportStore.reportMeta.generatedAt) }}
                  </strong>
                  ({{ formatRelative(reportStore.reportMeta.generatedAt) }})
                </span>
                <span class="text-gray-300">|</span>
                <span>
                  다음 자동 생성
                  <strong class="font-bold text-gray-700">
                    {{ formatDateTime(reportStore.reportMeta.nextScheduledAt) }}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <!-- 오른쪽: 탭 + 과거 리포트 + 새로 생성 -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- 주간/월간 토글 -->
            <div class="inline-flex border border-gray-300 bg-white">
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-black transition-colors"
                :class="
                  reportStore.rangeTab === 'weekly'
                    ? 'bg-[#004D3C] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                "
                @click="handleRangeChange('weekly')"
              >
                주간
              </button>
              <button
                type="button"
                class="border-l border-gray-300 px-3 py-1.5 text-xs font-black transition-colors"
                :class="
                  reportStore.rangeTab === 'monthly'
                    ? 'bg-[#004D3C] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                "
                @click="handleRangeChange('monthly')"
              >
                월간
              </button>
            </div>

            <!-- 과거 리포트 드롭다운 -->
            <div ref="historyDropdownRef" class="relative">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-1.5 text-xs font-black text-gray-700 hover:bg-gray-50"
                @click="toggleHistoryDropdown"
              >
                과거 리포트
                <ChevronDownIcon :size="14" />
              </button>
              <div
                v-if="showHistoryDropdown"
                class="absolute right-0 top-full z-30 mt-1 max-h-80 w-72 overflow-auto border border-gray-200 bg-white shadow-lg"
              >
                <ul class="divide-y divide-gray-100">
                  <li
                    v-for="snap in reportStore.reportHistory"
                    :key="snap.id"
                    class="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs transition-colors hover:bg-[#E6F2F0]"
                    :class="{ 'bg-[#E6F2F0]': snap.id === reportStore.currentReportId }"
                    @click="handleSelectSnapshot(snap.id)"
                  >
                    <div class="min-w-0">
                      <p class="truncate font-black text-gray-800">
                        {{ formatDateTime(snap.generatedAt) }}
                      </p>
                      <span
                        class="mt-0.5 inline-flex px-1.5 py-0.5 text-[9px] font-black"
                        :class="generationBadgeClass(snap.generationType)"
                      >
                        {{ generationTypeLabel[snap.generationType] }}
                      </span>
                    </div>
                    <CheckIcon
                      v-if="snap.id === reportStore.currentReportId"
                      :size="14"
                      class="shrink-0 text-[#004D3C]"
                    />
                  </li>
                </ul>
              </div>
            </div>

            <!-- 새로 생성 -->
            <button
              type="button"
              class="inline-flex items-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-3 py-1.5 text-xs font-black text-white transition-colors hover:bg-[#1f4b3a] disabled:opacity-60"
              :disabled="reportStore.isGenerating"
              @click="handleRegenerate"
            >
              <RefreshIcon :size="14" :class="reportStore.isGenerating ? 'animate-spin' : ''" />
              {{ reportStore.isGenerating ? '생성 중...' : '리포트 새로 생성' }}
            </button>
          </div>
        </div>
      </section>

      <!-- 요약 바 -->
      <section class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="(card, idx) in summaryCards"
          :key="idx"
          class="flex flex-col justify-between border border-gray-300 bg-white p-4 shadow-sm"
        >
          <p class="text-[10px] font-black uppercase tracking-wider text-gray-400">
            {{ card.label }}
          </p>
          <p class="mt-2 truncate text-xl font-black text-[#004D3C]">
            {{ card.value }}<span v-if="card.unit" class="ml-1 text-sm">{{ card.unit }}</span>
          </p>
        </div>
      </section>

      <!-- 섹션 1: 전면/주력 진열 추천 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div class="flex items-center gap-2">
            <PackageIcon :size="16" class="text-[#004D3C]" />
            <h2 class="text-sm font-black text-gray-900">전면/주력 진열 추천</h2>
          </div>
          <span class="text-[11px] text-gray-400"
            >매대 하드웨어 위치 추적 없음 · 상품 랭킹 기반</span
          >
        </header>

        <!-- KPI -->
        <div class="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-3">
          <div class="flex flex-col border border-gray-200 bg-gray-50 p-3">
            <span class="text-[10px] font-black uppercase text-gray-400">추천 상품 수</span>
            <span class="mt-1 text-2xl font-black text-gray-800">{{ displayKpi.count }}건</span>
          </div>
          <div class="flex flex-col border border-gray-200 bg-gray-50 p-3">
            <span class="text-[10px] font-black uppercase text-gray-400">평균 예상 상승률</span>
            <span class="mt-1 text-2xl font-black text-emerald-600">
              +{{ displayKpi.avgUplift }}%
            </span>
          </div>
          <div class="flex flex-col border border-gray-200 bg-gray-50 p-3">
            <span class="text-[10px] font-black uppercase text-gray-400">TOP 매출 상품</span>
            <span class="mt-1 truncate text-sm font-black text-gray-800">
              {{ displayKpi.topName }}
            </span>
          </div>
        </div>

        <!-- 차트 -->
        <div class="px-4 pt-4">
          <p class="mb-2 text-[11px] font-black uppercase tracking-wider text-gray-500">
            전면 배치 시 예상 매출 상승률 TOP 10
          </p>
          <BarChart :data="displayChartData" :options="displayChartOptions" :height="320" />
        </div>

        <!-- 추천 카드 리스트 -->
        <div class="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
          <article
            v-for="rec in sortedDisplayCards"
            :key="rec.id"
            class="flex flex-col gap-2 border border-gray-200 bg-white p-3 transition-colors hover:border-[#004D3C]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-black text-gray-900">{{ rec.productName }}</p>
                <p class="text-[10px] text-gray-400">{{ rec.productCode }}</p>
              </div>
              <span
                class="shrink-0 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700"
              >
                +{{ rec.expectedUpliftPct }}% 예상
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
              <span
                >주간 판매 <strong class="font-black">{{ rec.weeklySales }}</strong
                >개</span
              >
              <span class="text-gray-300">|</span>
              <span
                class="inline-flex items-center gap-0.5 font-black"
                :class="rec.trendPct >= 0 ? 'text-emerald-600' : 'text-red-600'"
              >
                <TrendUpIcon v-if="rec.trendPct >= 0" :size="11" />
                <TrendDownIcon v-else :size="11" />
                {{ rec.trendPct >= 0 ? '+' : '' }}{{ rec.trendPct }}%
              </span>
            </div>
            <p class="text-[11px] text-gray-500">{{ rec.reason }}</p>
          </article>
        </div>
      </section>

      <!-- 섹션 2: 발주 추천 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div class="flex items-center gap-2">
            <CartIcon :size="16" class="text-[#004D3C]" />
            <h2 class="text-sm font-black text-gray-900">발주 추천</h2>
          </div>
          <span class="text-[11px] text-gray-400">행을 클릭하면 7일 판매 추세가 열립니다</span>
        </header>

        <div class="overflow-auto">
          <table class="w-full min-w-[860px] table-fixed border-collapse text-xs">
            <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th class="w-8 px-2 py-2 text-center font-black"></th>
                <th class="px-3 py-2 text-left font-black">상품</th>
                <th class="w-20 px-3 py-2 text-right font-black">현재재고</th>
                <th class="w-20 px-3 py-2 text-right font-black">안전재고</th>
                <th class="w-20 px-3 py-2 text-right font-black">일평균판매</th>
                <th class="w-20 px-3 py-2 text-right font-black">추천수량</th>
                <th class="w-16 px-3 py-2 text-center font-black">긴급도</th>
                <th class="px-3 py-2 text-left font-black">근거</th>
                <th class="w-24 px-3 py-2 text-center font-black">액션</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <template v-for="row in reportStore.sortedRestock" :key="row.id">
                <tr
                  class="cursor-pointer transition-colors hover:bg-gray-50"
                  :class="{ 'bg-[#E6F2F0]': expandedRestockId === row.id }"
                  @click="handleToggleRestock(row.id)"
                >
                  <td class="px-2 py-3 text-center text-gray-400">
                    <ChevronIcon
                      :size="12"
                      :class="expandedRestockId === row.id ? 'rotate-90' : ''"
                    />
                  </td>
                  <td class="px-3 py-3">
                    <p class="font-black text-gray-800">{{ row.productName }}</p>
                    <p class="text-[10px] text-gray-400">{{ row.productCode }}</p>
                  </td>
                  <td
                    class="px-3 py-3 text-right font-bold"
                    :class="row.currentQty < row.safetyStock ? 'text-red-600' : 'text-gray-700'"
                  >
                    {{ row.currentQty }}
                  </td>
                  <td class="px-3 py-3 text-right text-gray-500">{{ row.safetyStock }}</td>
                  <td class="px-3 py-3 text-right text-gray-600">{{ row.avgDailySales }}/일</td>
                  <td class="px-3 py-3 text-right font-black text-[#004D3C]">
                    {{ row.recommendedQty }}
                  </td>
                  <td class="px-3 py-3 text-center">
                    <span
                      class="inline-flex px-2 py-1 text-[10px] font-black"
                      :class="urgencyBadgeClass(row.urgency)"
                    >
                      {{ urgencyLabel(row.urgency) }}
                    </span>
                  </td>
                  <td class="px-3 py-3 text-[11px] text-gray-500">{{ row.reason }}</td>
                  <td class="px-3 py-3 text-center">
                    <button
                      type="button"
                      class="border border-[#004D3C] bg-[#004D3C] px-2 py-1 text-[10px] font-black text-white hover:bg-[#1f4b3a]"
                      @click.stop="handleNavigateOrder(row.productCode)"
                    >
                      발주하기
                    </button>
                  </td>
                </tr>
                <tr v-if="expandedRestockId === row.id" class="bg-gray-50">
                  <td colspan="9" class="px-4 py-4">
                    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_280px]">
                      <div>
                        <p
                          class="mb-2 text-[11px] font-black uppercase tracking-wider text-gray-500"
                        >
                          최근 7일 판매 추세
                        </p>
                        <LineChart
                          :data="restockTrendData(row.productCode)"
                          :options="restockTrendOptions"
                          :height="180"
                        />
                      </div>
                      <div class="flex flex-col justify-center gap-2 border-l border-gray-200 pl-4">
                        <p class="text-[11px] font-black uppercase text-gray-400">추천 발주 수량</p>
                        <p class="text-3xl font-black text-[#004D3C]">
                          {{ row.recommendedQty }}<span class="ml-1 text-sm">개</span>
                        </p>
                        <p class="text-[11px] text-gray-500">
                          재고 회전 기준 {{ Math.ceil(row.recommendedQty / row.avgDailySales) }}일분
                        </p>
                        <button
                          type="button"
                          class="mt-2 inline-flex items-center justify-center gap-1 border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
                          @click.stop="handleNavigateOrder(row.productCode)"
                        >
                          <CartIcon :size="12" />
                          주문 화면에서 발주 생성
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="reportStore.sortedRestock.length === 0">
                <td colspan="9" class="px-4 py-8 text-center text-xs text-gray-400">
                  발주 추천 내역이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 섹션 3: 연관 상품 추천 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div class="flex items-center gap-2">
            <LinkIcon :size="16" class="text-[#004D3C]" />
            <h2 class="text-sm font-black text-gray-900">연관 상품 추천</h2>
          </div>
          <span class="text-[11px] text-gray-400">함께 팔리는 상품 TOP 3 · 묶음 프로모션 제안</span>
        </header>

        <div class="overflow-auto">
          <table class="w-full min-w-[760px] table-fixed border-collapse text-xs">
            <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-black">주력 상품</th>
                <th class="px-3 py-2 text-left font-black">함께 팔리는 상품 TOP 3</th>
                <th class="w-32 px-3 py-2 text-center font-black">액션</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="rule in reportStore.currentReport.associationRules" :key="rule.id">
                <td class="px-3 py-3 align-top">
                  <p class="font-black text-gray-800">{{ rule.baseProduct }}</p>
                </td>
                <td class="px-3 py-3">
                  <div class="flex flex-col gap-2">
                    <div
                      v-for="(p, idx) in rule.partners"
                      :key="idx"
                      class="flex items-center gap-3"
                    >
                      <span class="w-40 shrink-0 truncate text-xs text-gray-700">
                        {{ p.name }}
                      </span>
                      <div class="relative flex-1 bg-gray-100">
                        <div class="h-2 bg-[#004D3C]" :style="{ width: p.coBuyRate + '%' }"></div>
                      </div>
                      <span class="w-10 text-right text-[11px] font-black text-gray-600">
                        {{ p.coBuyRate }}%
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3 text-center">
                  <button
                    type="button"
                    class="border border-[#004D3C] bg-white px-2 py-1 text-[10px] font-black text-[#004D3C] hover:bg-[#E6F2F0]"
                    @click="handleBundleSuggest(rule.suggestedBundle)"
                  >
                    묶음 프로모션 제안
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

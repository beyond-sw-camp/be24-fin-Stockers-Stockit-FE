<script setup>
import { computed, h, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useHqAiReportStore } from '@/stores/hqAiReport.js'

const router = useRouter()
const auth = useAuthStore()
const reportStore = useHqAiReportStore()

const hqMenus = roleMenus.hq
const aiReportSideMenus = roleMenus.hq.find((m) => m.label === 'AI 리포트')?.children ?? []
const activeTopMenu = computed(() => 'AI 리포트')
const activeSideMenu = ref('AI 리포트')

const showHistoryDropdown = ref(false)
const historyDropdownRef = ref(null)
const forecastSectionRef = ref(null)

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

function handleFilterStore(e) {
  reportStore.setFilter({ store: e.target.value })
}

function handleFilterCategory(e) {
  reportStore.setFilter({ category: e.target.value })
}

function handleActionTab(tab) {
  reportStore.setActionTab(tab)
}

function handleSelectForecast(id) {
  reportStore.selectForecast(id)
}

function scrollToForecast() {
  forecastSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleExecCardClick(card) {
  if (card.type === 'stockout_risk') {
    router.push({ name: 'hq-inventory', query: { productId: card.productCode } })
  } else if (card.type === 'dead_stock') {
    router.push({ name: 'hq-purchase-orders', query: { productId: card.productCode } })
  } else if (card.type === 'demand_surge') {
    reportStore.setFilter({ category: card.categoryName })
    scrollToForecast()
  }
}

function handleRelocationAction(row) {
  router.push({ name: 'hq-orders', query: { productId: row.productCode } })
}

function handlePurchaseAction(row) {
  router.push({ name: 'hq-purchase-orders', query: { productId: row.productCode } })
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

const rangeScale = computed(() => reportStore.rangeMultiplier)
const rangeLabel = computed(() => (reportStore.rangeTab === 'monthly' ? '월간' : '주간'))

const summaryCards = computed(() => {
  const s = reportStore.currentReport.summary
  const mult = rangeScale.value
  return [
    { label: '품절 위험 매장 수', value: s.stockoutRiskCount, unit: '개 매장' },
    {
      label: '장기 체류 품목 수',
      value: s.deadStockCount,
      unit: '건',
    },
    {
      label: '수요 급증 카테고리',
      value: s.demandSurgeCount,
      unit: '개',
    },
    {
      label: `${rangeLabel.value} 액션 추천`,
      value: Math.round(s.actionCount * mult),
      unit: '건',
    },
  ]
})

const execCardStyle = {
  stockout_risk: {
    accent: 'text-red-700',
    chip: 'bg-red-50 text-red-700',
    chipLabel: '품절 임박',
    action: '재고 현황에서 확인',
  },
  dead_stock: {
    accent: 'text-amber-700',
    chip: 'bg-amber-50 text-amber-700',
    chipLabel: '장기 체류',
    action: '발주 관리에서 확인',
  },
  demand_surge: {
    accent: 'text-emerald-700',
    chip: 'bg-emerald-50 text-emerald-700',
    chipLabel: '수요 급증',
    action: '수요 예측 섹션으로 이동',
  },
}

const execSubText = (card) => {
  if (card.type === 'stockout_risk') {
    return `${card.storeName} · 품목 ${card.productCode}`
  }
  if (card.type === 'dead_stock') {
    return `${card.warehouseName} · ${card.days}일 체류`
  }
  if (card.type === 'demand_surge') {
    return `트리거: ${card.trigger}`
  }
  return ''
}

const forecastChartData = computed(() => {
  const f = reportStore.selectedForecast
  if (!f) {
    return { labels: [], datasets: [] }
  }
  const histLabels = Array.from({ length: 12 }, (_, i) => `W-${12 - i}`)
  const fcLabels = Array.from({ length: 4 }, (_, i) => `W+${i + 1}`)
  const labels = [...histLabels, ...fcLabels]
  const historyLine = [...f.history, ...Array(4).fill(null)]
  const forecastLine = [...Array(11).fill(null), f.history[11], ...f.forecast]
  const lower = [...Array(11).fill(null), f.history[11], ...f.lowerBound]
  const upper = [...Array(11).fill(null), f.history[11], ...f.upperBound]

  return {
    labels,
    datasets: [
      {
        label: '신뢰구간 상한',
        data: upper,
        borderColor: 'rgba(0, 77, 60, 0)',
        backgroundColor: 'rgba(0, 77, 60, 0.12)',
        pointRadius: 0,
        fill: '+1',
        tension: 0.3,
      },
      {
        label: '신뢰구간 하한',
        data: lower,
        borderColor: 'rgba(0, 77, 60, 0)',
        backgroundColor: 'rgba(0, 77, 60, 0.12)',
        pointRadius: 0,
        fill: false,
        tension: 0.3,
      },
      {
        label: '실측',
        data: historyLine,
        borderColor: '#004D3C',
        backgroundColor: 'rgba(0, 77, 60, 0.05)',
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: '#004D3C',
        tension: 0.3,
        fill: false,
      },
      {
        label: '예측',
        data: forecastLine,
        borderColor: '#004D3C',
        borderDash: [5, 4],
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#004D3C',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
      },
    ],
  }
})

const forecastChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        font: { size: 10 },
        filter: (item) => !item.text.includes('신뢰구간'),
        boxWidth: 12,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          if (ctx.dataset.label.includes('신뢰구간')) return null
          return `${ctx.dataset.label}: ${ctx.parsed.y}개`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } },
    },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: { font: { size: 10 } },
      beginAtZero: true,
    },
  },
  interaction: { mode: 'index', intersect: false },
}

const categoryBarData = computed(() => {
  const list = reportStore.currentReport.demandForecasts
  const agg = {}
  list.forEach((f) => {
    if (!agg[f.categoryName]) {
      agg[f.categoryName] = { sumAvg: 0, sumFc: 0, n: 0 }
    }
    agg[f.categoryName].sumAvg += f.avgRecent4w
    agg[f.categoryName].sumFc += f.nextForecast
    agg[f.categoryName].n += 1
  })
  const labels = Object.keys(agg)
  const avgData = labels.map((k) => Math.round(agg[k].sumAvg / agg[k].n))
  const fcData = labels.map((k) => Math.round(agg[k].sumFc / agg[k].n))
  return {
    labels,
    datasets: [
      {
        label: '최근 4주 평균',
        data: avgData,
        backgroundColor: '#9ca3af',
        borderRadius: 2,
        maxBarThickness: 20,
      },
      {
        label: '다음 주 예측',
        data: fcData,
        backgroundColor: '#004D3C',
        borderRadius: 2,
        maxBarThickness: 20,
      },
    ],
  }
})

const categoryBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } }, beginAtZero: true },
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
const AlertIcon = IconBase([
  { tag: 'path', attrs: { d: 'M12 9v4' } },
  { tag: 'path', attrs: { d: 'M12 17h.01' } },
  {
    tag: 'path',
    attrs: { d: 'M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z' },
  },
])
const ClockIcon = IconBase([
  { tag: 'circle', attrs: { cx: '12', cy: '12', r: '9' } },
  { tag: 'path', attrs: { d: 'M12 7v5l3 2' } },
])
const TrendUpIcon = IconBase([
  { tag: 'path', attrs: { d: 'm3 17 6-6 4 4 8-8' } },
  { tag: 'path', attrs: { d: 'M14 7h7v7' } },
])
const TrendDownIcon = IconBase([
  { tag: 'path', attrs: { d: 'm3 7 6 6 4-4 8 8' } },
  { tag: 'path', attrs: { d: 'M14 17h7v-7' } },
])
const ForecastIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 3v18h18' } },
  { tag: 'path', attrs: { d: 'm7 15 4-4 3 3 6-8' } },
])
const TruckIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 7h11v10H3z' } },
  { tag: 'path', attrs: { d: 'M14 10h4l3 3v4h-7' } },
  { tag: 'circle', attrs: { cx: '7', cy: '18', r: '1.5' } },
  { tag: 'circle', attrs: { cx: '17', cy: '18', r: '1.5' } },
])
const WarehouseIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 9l9-5 9 5v11H3z' } },
  { tag: 'path', attrs: { d: 'M8 20v-7h8v7' } },
])
const StoreIcon = IconBase([
  { tag: 'path', attrs: { d: 'M3 7h18l-2 5H5Z' } },
  { tag: 'path', attrs: { d: 'M5 12v8h14v-8' } },
  { tag: 'path', attrs: { d: 'M10 20v-5h4v5' } },
])
const ArrowRightIcon = IconBase([{ tag: 'path', attrs: { d: 'M5 12h14M13 5l7 7-7 7' } }])
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="aiReportSideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <!-- 리포트 헤더 -->
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center bg-[#E6F2F0] text-[#004D3C]"
            >
              <SparklesIcon :size="20" />
            </div>
            <div>
              <h1 class="text-lg font-black text-gray-900">스마트 운영 AI 리포트</h1>
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

          <div class="flex flex-wrap items-center gap-2">
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

      <!-- 섹션 1: 핵심 요약 (Executive Summary) -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div class="flex items-center gap-2">
            <AlertIcon :size="16" class="text-[#004D3C]" />
            <h2 class="text-sm font-black text-gray-900">오늘 본사가 알아야 할 3가지</h2>
          </div>
          <span class="text-[11px] text-gray-400">
            품절 임박 · 장기 체류 · 수요 급증 자동 추출
          </span>
        </header>

        <div class="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
          <article
            v-for="card in reportStore.currentReport.executiveSummary"
            :key="card.type"
            class="flex cursor-pointer flex-col gap-3 border border-gray-200 bg-white p-4 transition-colors hover:border-[#004D3C] hover:bg-[#F4FBF9]"
            @click="handleExecCardClick(card)"
          >
            <div class="flex items-center justify-between">
              <span
                class="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black"
                :class="execCardStyle[card.type].chip"
              >
                <AlertIcon v-if="card.type === 'stockout_risk'" :size="11" />
                <ClockIcon v-else-if="card.type === 'dead_stock'" :size="11" />
                <TrendUpIcon v-else :size="11" />
                {{ execCardStyle[card.type].chipLabel }}
              </span>
            </div>
            <p class="text-sm font-black leading-relaxed" :class="execCardStyle[card.type].accent">
              {{ card.title }}
            </p>
            <p class="text-[11px] text-gray-500">{{ execSubText(card) }}</p>
            <div
              class="mt-auto inline-flex items-center gap-1 text-[11px] font-black text-[#004D3C]"
            >
              {{ execCardStyle[card.type].action }}
              <ArrowRightIcon :size="12" />
            </div>
          </article>
        </div>
      </section>

      <!-- 섹션 2: 수요 예측 -->
      <section ref="forecastSectionRef" class="border border-gray-300 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div class="flex items-center gap-2">
            <ForecastIcon :size="16" class="text-[#004D3C]" />
            <h2 class="text-sm font-black text-gray-900">수요 예측</h2>
          </div>
          <span
            class="inline-flex items-center gap-1 border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-black text-gray-500"
          >
            모델: 이동평균 + 계절성 보정
          </span>
        </header>

        <!-- 필터 바 -->
        <div
          class="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50/70 px-4 py-3"
        >
          <div class="flex items-center gap-2">
            <label class="text-[10px] font-black uppercase tracking-wider text-gray-500">
              매장
            </label>
            <select
              :value="reportStore.filterStore"
              class="border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-gray-700 focus:border-[#004D3C] focus:outline-none"
              @change="handleFilterStore"
            >
              <option value="all">전체 매장</option>
              <option v-for="s in reportStore.STORES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-[10px] font-black uppercase tracking-wider text-gray-500">
              카테고리
            </label>
            <select
              :value="reportStore.filterCategory"
              class="border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-gray-700 focus:border-[#004D3C] focus:outline-none"
              @change="handleFilterCategory"
            >
              <option value="all">전체 카테고리</option>
              <option v-for="c in reportStore.CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="ml-auto text-[11px] text-gray-500">
            필터 결과
            <strong class="font-black text-gray-700">{{
              reportStore.filteredForecasts.length
            }}</strong
            >건
          </div>
        </div>

        <!-- 메인 차트 -->
        <div class="grid grid-cols-1 gap-4 p-4 xl:grid-cols-[2fr_1fr]">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <p class="text-[11px] font-black uppercase tracking-wider text-gray-500">
                선택 항목 주별 추이 (12주 실측 + 4주 예측)
              </p>
              <p v-if="reportStore.selectedForecast" class="text-[11px] font-black text-gray-700">
                {{ reportStore.selectedForecast.storeName }} ·
                {{ reportStore.selectedForecast.productName }}
              </p>
            </div>
            <div v-if="reportStore.selectedForecast" class="border border-gray-200 bg-white p-3">
              <LineChart :data="forecastChartData" :options="forecastChartOptions" :height="280" />
              <div class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                <span class="inline-flex items-center gap-1">
                  <span class="h-[2px] w-4 bg-[#004D3C]"></span> 실측
                </span>
                <span class="inline-flex items-center gap-1">
                  <span
                    class="h-[2px] w-4 bg-[#004D3C] opacity-60"
                    style="
                      background-image: linear-gradient(to right, #004d3c 50%, transparent 50%);
                      background-size: 6px 2px;
                    "
                  ></span>
                  예측
                </span>
                <span class="inline-flex items-center gap-1">
                  <span class="h-2 w-4" style="background: rgba(0, 77, 60, 0.12)"></span>
                  신뢰구간
                </span>
              </div>
            </div>
            <div
              v-else
              class="flex h-[280px] items-center justify-center border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400"
            >
              필터 결과가 없습니다.
            </div>
          </div>

          <div>
            <p class="mb-2 text-[11px] font-black uppercase tracking-wider text-gray-500">
              카테고리별 평균 수요 (최근 4주 vs 다음 주 예측)
            </p>
            <div class="border border-gray-200 bg-white p-3">
              <BarChart :data="categoryBarData" :options="categoryBarOptions" :height="260" />
            </div>
          </div>
        </div>

        <!-- 예측 테이블 -->
        <div class="overflow-auto border-t border-gray-200">
          <table class="w-full min-w-[960px] table-fixed border-collapse text-xs">
            <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-black">매장</th>
                <th class="px-3 py-2 text-left font-black">품목</th>
                <th class="w-20 px-3 py-2 text-center font-black">카테고리</th>
                <th class="w-20 px-3 py-2 text-right font-black">최근 4주 평균</th>
                <th class="w-20 px-3 py-2 text-right font-black">다음 주 예측</th>
                <th class="w-28 px-3 py-2 text-right font-black">범위 (최소~최대)</th>
                <th class="w-20 px-3 py-2 text-right font-black">증감</th>
                <th class="px-3 py-2 text-left font-black">근거</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in reportStore.filteredForecasts"
                :key="row.id"
                class="cursor-pointer transition-colors hover:bg-gray-50"
                :class="{
                  'bg-[#E6F2F0]':
                    reportStore.selectedForecast && row.id === reportStore.selectedForecast.id,
                }"
                @click="handleSelectForecast(row.id)"
              >
                <td class="px-3 py-3 font-black text-gray-800">{{ row.storeName }}</td>
                <td class="px-3 py-3">
                  <p class="font-black text-gray-800">{{ row.productName }}</p>
                  <p class="text-[10px] text-gray-400">{{ row.productCode }}</p>
                </td>
                <td class="px-3 py-3 text-center text-gray-600">{{ row.categoryName }}</td>
                <td class="px-3 py-3 text-right text-gray-600">{{ row.avgRecent4w }}</td>
                <td class="px-3 py-3 text-right font-black text-[#004D3C]">
                  {{ row.nextForecast }}
                </td>
                <td class="px-3 py-3 text-right text-gray-500">
                  {{ row.rangeMin }}~{{ row.rangeMax }}
                </td>
                <td class="px-3 py-3 text-right">
                  <span
                    class="inline-flex items-center gap-0.5 font-black"
                    :class="row.deltaPct >= 0 ? 'text-emerald-600' : 'text-red-600'"
                  >
                    <TrendUpIcon v-if="row.deltaPct >= 0" :size="11" />
                    <TrendDownIcon v-else :size="11" />
                    {{ row.deltaPct >= 0 ? '+' : '' }}{{ row.deltaPct }}%
                  </span>
                </td>
                <td class="px-3 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in row.basisTags"
                      :key="tag"
                      class="inline-flex bg-gray-100 px-1.5 py-0.5 text-[10px] font-black text-gray-600"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </td>
              </tr>
              <tr v-if="reportStore.filteredForecasts.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-xs text-gray-400">
                  필터 결과가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 섹션 3: 발주·재배치 Action Items -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div class="flex items-center gap-2">
            <TruckIcon :size="16" class="text-[#004D3C]" />
            <h2 class="text-sm font-black text-gray-900">발주·재배치 추천</h2>
          </div>
          <span class="text-[11px] text-gray-400">긴급도 순 자동 정렬</span>
        </header>

        <div class="flex border-b border-gray-200 bg-gray-50/70">
          <button
            type="button"
            class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-colors"
            :class="
              reportStore.actionTab === 'relocation'
                ? 'border-b-2 border-[#004D3C] bg-white text-[#004D3C]'
                : 'text-gray-500 hover:text-gray-700'
            "
            @click="handleActionTab('relocation')"
          >
            창고↔매장 재배치
            <span
              class="inline-flex items-center bg-gray-100 px-1.5 py-0.5 text-[10px] font-black text-gray-600"
            >
              {{ reportStore.sortedRelocations.length }}
            </span>
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-colors"
            :class="
              reportStore.actionTab === 'purchase'
                ? 'border-b-2 border-[#004D3C] bg-white text-[#004D3C]'
                : 'text-gray-500 hover:text-gray-700'
            "
            @click="handleActionTab('purchase')"
          >
            창고 발주
            <span
              class="inline-flex items-center bg-gray-100 px-1.5 py-0.5 text-[10px] font-black text-gray-600"
            >
              {{ reportStore.sortedPurchaseOrders.length }}
            </span>
          </button>
        </div>

        <!-- 재배치 탭 -->
        <div v-if="reportStore.actionTab === 'relocation'" class="overflow-auto">
          <table class="w-full min-w-[920px] table-fixed border-collapse text-xs">
            <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th class="w-44 px-3 py-2 text-left font-black">From</th>
                <th class="w-8 px-2 py-2 text-center font-black"></th>
                <th class="w-32 px-3 py-2 text-left font-black">To</th>
                <th class="px-3 py-2 text-left font-black">상품</th>
                <th class="w-20 px-3 py-2 text-right font-black">추천 수량</th>
                <th class="w-16 px-3 py-2 text-center font-black">긴급도</th>
                <th class="px-3 py-2 text-left font-black">근거</th>
                <th class="w-28 px-3 py-2 text-center font-black">액션</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in reportStore.sortedRelocations"
                :key="row.id"
                class="transition-colors hover:bg-[#E6F2F0]"
              >
                <td class="px-3 py-3">
                  <div class="flex items-center gap-1.5">
                    <WarehouseIcon
                      v-if="row.from.type === 'warehouse'"
                      :size="13"
                      class="text-gray-500"
                    />
                    <StoreIcon v-else :size="13" class="text-gray-500" />
                    <span class="font-black text-gray-800">{{ row.from.name }}</span>
                  </div>
                </td>
                <td class="px-2 py-3 text-center text-gray-400">
                  <ArrowRightIcon :size="12" />
                </td>
                <td class="px-3 py-3">
                  <div class="flex items-center gap-1.5">
                    <StoreIcon :size="13" class="text-gray-500" />
                    <span class="font-black text-gray-800">{{ row.to.name }}</span>
                  </div>
                </td>
                <td class="px-3 py-3">
                  <p class="font-black text-gray-800">{{ row.productName }}</p>
                  <p class="text-[10px] text-gray-400">{{ row.productCode }}</p>
                </td>
                <td class="px-3 py-3 text-right font-black text-[#004D3C]">{{ row.qty }}</td>
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
                    @click="handleRelocationAction(row)"
                  >
                    이동 신청
                  </button>
                </td>
              </tr>
              <tr v-if="reportStore.sortedRelocations.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-xs text-gray-400">
                  재배치 추천 내역이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 발주 탭 -->
        <div v-else class="overflow-auto">
          <table class="w-full min-w-[880px] table-fixed border-collapse text-xs">
            <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th class="w-28 px-3 py-2 text-left font-black">창고</th>
                <th class="px-3 py-2 text-left font-black">상품</th>
                <th class="w-20 px-3 py-2 text-center font-black">카테고리</th>
                <th class="w-20 px-3 py-2 text-right font-black">추천 수량</th>
                <th class="w-20 px-3 py-2 text-center font-black">예상 납기</th>
                <th class="w-16 px-3 py-2 text-center font-black">긴급도</th>
                <th class="px-3 py-2 text-left font-black">근거</th>
                <th class="w-28 px-3 py-2 text-center font-black">액션</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in reportStore.sortedPurchaseOrders"
                :key="row.id"
                class="transition-colors hover:bg-[#E6F2F0]"
              >
                <td class="px-3 py-3">
                  <div class="flex items-center gap-1.5">
                    <WarehouseIcon :size="13" class="text-gray-500" />
                    <span class="font-black text-gray-800">{{ row.warehouseName }}</span>
                  </div>
                </td>
                <td class="px-3 py-3">
                  <p class="font-black text-gray-800">{{ row.productName }}</p>
                  <p class="text-[10px] text-gray-400">{{ row.productCode }}</p>
                </td>
                <td class="px-3 py-3 text-center text-gray-600">{{ row.categoryName }}</td>
                <td class="px-3 py-3 text-right font-black text-[#004D3C]">{{ row.qty }}</td>
                <td class="px-3 py-3 text-center text-gray-600">{{ row.etaDays }}일</td>
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
                    @click="handlePurchaseAction(row)"
                  >
                    발주 생성
                  </button>
                </td>
              </tr>
              <tr v-if="reportStore.sortedPurchaseOrders.length === 0">
                <td colspan="8" class="px-4 py-8 text-center text-xs text-gray-400">
                  발주 추천 내역이 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

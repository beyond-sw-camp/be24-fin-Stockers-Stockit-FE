<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  Handshake,
  TrendingUp,
  Award,
  Filter,
  Recycle,
  Leaf,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEsgStore } from '@/stores/esg.js'
import { vendorAnalyticsApi } from '@/api/hq/analytics.js'
import { MATERIAL_COLORS, MATERIAL_COLOR_FALLBACK } from '@/utils/esgScore.js'

const auth = useAuthStore()
const esgStore = useEsgStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((m) => m.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('순환재고 판매 통계')

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// ─── 필터 ─────────────────────────────────────────────────────────────
const periodUnit = ref('연간')

const periodOptions = ['월간', '연간']
const PERIOD_MAP = { '월간': 'MONTH', '연간': 'YEAR' }

// 월간 모드용 — YYYY-MM 형식. 기본값: 이번 달.
function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
const selectedMonth = ref(currentYearMonth())

// 최근 12개월 옵션 (이번 달 ~ 11개월 전)
const monthOptions = computed(() => {
  const out = []
  const base = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({ value: ym, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월` })
  }
  return out
})

// ─── BE 연동 ──────────────────────────────────────────────────────────
const statsData = ref(null)
const loading = ref(false)
const loadError = ref('')

function resolveDateRange() {
  const today = new Date()
  const pad2 = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

  if (periodUnit.value === '연간') {
    const fromDate = new Date(today)
    fromDate.setDate(fromDate.getDate() - 364)
    return { from: fmt(fromDate), to: fmt(today) }
  }

  // 월간 — selectedMonth (YYYY-MM) 의 1일 ~ 말일
  const [yy, mm] = selectedMonth.value.split('-').map(Number)
  const fromDate = new Date(yy, mm - 1, 1)
  const toDate = new Date(yy, mm, 0)  // 다음 달 0일 = 이번 달 말일
  return { from: fmt(fromDate), to: fmt(toDate) }
}

async function fetchVendorStats() {
  loading.value = true
  loadError.value = ''
  try {
    const { from, to } = resolveDateRange()
    statsData.value = await vendorAnalyticsApi.get({
      period: PERIOD_MAP[periodUnit.value] ?? 'MONTH',
      from, to,
    })
  } catch (e) {
    console.error('[VendorView] fetch failed', e)
    loadError.value = '순환재고 판매 통계를 불러오지 못했습니다.'
    statsData.value = null
  } finally {
    loading.value = false
  }
}

watch([periodUnit, selectedMonth], fetchVendorStats)
onMounted(() => {
  fetchVendorStats()
  esgStore.fetchTotalPoints(new Date().getFullYear())
})

// ─── BE 응답 → FE 데이터 ──────────────────────────────────────────────
const vendors = computed(() => statsData.value?.vendors ?? [])
const circularMaterialsRaw = computed(() => statsData.value?.circularMaterials ?? [])

const filteredVendors = computed(() => vendors.value)

// ─── 금액 표기 — 풀 콤마 원 단위 (₩X,XXX,XXX) — 판매량 통계와 통일 ────
function formatKoreanMoney(won) {
  if (won == null || isNaN(won)) return '₩0'
  return `₩${Number(won).toLocaleString('ko-KR')}`
}

// ─── KPI 4개 (BE 응답 기반) ───────────────────────────────────────────
const kpiCards = computed(() => {
  const kpi = statsData.value?.kpi ?? {}
  const activeVendors = kpi.activeVendorCount ?? 0
  const activeMats = kpi.activeMaterialCount ?? 0

  let periodSubLabel
  if (periodUnit.value === '연간') {
    periodSubLabel = '최근 1년 누적'
  } else {
    const [yy, mm] = selectedMonth.value.split('-').map(Number)
    periodSubLabel = `${yy}년 ${mm}월 누적`
  }

  return [
    {
      label: '활성 거래처',
      value: activeVendors,
      unit: '곳',
      sub: `소재 ${activeMats}종`,
      icon: Handshake, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600',
    },
    {
      label: '연간 총 탄소 감축량',
      value: (esgStore.totalCarbonReductionTon ?? 0).toFixed(2),
      unit: 'tCO₂',
      sub: '최근 1년 누적',
      icon: Leaf, valueCls: 'text-teal-700', iconBg: 'bg-teal-50', iconCls: 'text-teal-600',
    },
    {
      label: '총 판매 금액',
      value: formatKoreanMoney(kpi.totalSalesAmount ?? 0),
      unit: '',
      sub: periodSubLabel,
      icon: TrendingUp, valueCls: 'text-rose-700', iconBg: 'bg-rose-50', iconCls: 'text-rose-600',
    },
  ]
})

// ─── TOP 10 매출 막대 ─────────────────────────────────────────────────
const top10ByValue = computed(() =>
  [...vendors.value].sort((a, b) => b.orderValue - a.orderValue).slice(0, 10),
)

const TOP10_BAR_COLOR = '#059669'

const top10ChartData = computed(() => ({
  labels: top10ByValue.value.map((v) => (v.name ?? '').trim()),
  datasets: [{
    label: '발주 금액',
    data: top10ByValue.value.map((v) => Number(v.orderValue ?? 0)),
    backgroundColor: TOP10_BAR_COLOR,
    borderRadius: 4,
  }],
}))

const top10ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => formatKoreanMoney(ctx.parsed.x) } },
  },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => formatKoreanMoney(v) } },
    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

// ─── 의존도 도넛 (TOP 5 + 기타) ───────────────────────────────────────
const dependencyData = computed(() => {
  const sorted = [...vendors.value].sort((a, b) => b.orderValue - a.orderValue)
  const top5 = sorted.slice(0, 5)
  const rest = sorted.slice(5)
  const restValue = rest.reduce((s, v) => s + Number(v.orderValue ?? 0), 0)
  const total = sorted.reduce((s, v) => s + Number(v.orderValue ?? 0), 0) || 1
  const list = [
    ...top5.map((v) => ({
      name: (v.name ?? '').trim(),
      value: Number(v.orderValue ?? 0),
      pct: parseFloat(((Number(v.orderValue ?? 0) / total) * 100).toFixed(1)),
    })),
    {
      name: `기타 (${rest.length}곳)`,
      value: restValue,
      pct: parseFloat(((restValue / total) * 100).toFixed(1)),
    },
  ]
  return list
})

const DEPENDENCY_PALETTE = ['#059669', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#94a3b8']

const dependencyChartData = computed(() => ({
  labels: dependencyData.value.map((d) => d.name),
  datasets: [{
    data: dependencyData.value.map((d) => d.pct),
    backgroundColor: DEPENDENCY_PALETTE,
    borderWidth: 2,
    borderColor: '#fff',
  }],
}))

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed}%` } },
  },
  cutout: '60%',
}

// 소재 판매량 비중 도넛 전용 — 판매량(kg) 함께 표시
const materialDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const item = circularMaterialStats.value[ctx.dataIndex]
          const lines = [`${ctx.label}: ${ctx.parsed}%`]
          if (item) lines.push(`판매량: ${Number(item.units ?? 0).toLocaleString()}kg`)
          return lines
        },
      },
    },
  },
  cutout: '60%',
}

const maxDependency = computed(() =>
  Math.max(...dependencyData.value.slice(0, 5).map((d) => d.pct), 0),
)

// ─── 순환재고 상세 토글 ────────────────────────────────────────────
const detailView = ref('circular') // 'circular' 고정 (거래처 상세 제거됨)
const detailExpanded = ref(true) // 하단 상세 영역 펼침 상태 (기본 열림)

// ─── 순환재고 상세 (BE 응답 기반) ─────────────────────────────────────
//   정렬/비중 기준을 매출(sales) → 판매량(units, kg) 로 전환.
//   소재 매출 순위가 판매한 kg 수로 노출되도록 한다.
const circularMaterialStats = computed(() => {
  const list = circularMaterialsRaw.value.map((m) => ({
    name: m.name,
    materialCode: m.materialCode,
    materialType: m.materialType,
    units: Number(m.units ?? 0),
    sales: Number(m.sales ?? 0),
    eco: !!m.eco,
  }))
  const sorted = [...list].sort((a, b) => b.units - a.units)
  const total = sorted.reduce((s, x) => s + x.units, 0) || 1
  return sorted.map((item) => ({
    ...item,
    sharePct: parseFloat(((item.units / total) * 100).toFixed(1)),
  }))
})

const materialTypeBadge = (type) => {
  if (type === '천연 단일 섬유') return 'bg-emerald-100 text-emerald-700'
  if (type === '합성 섬유') return 'bg-violet-100 text-violet-700'
  if (type === '혼방') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

// ─── 소재 매출 순위 막대 (순환재고 모드용) — ESG 카드와 동일한 소재별 컬러 매핑 ────
function resolveMaterialColor(m) {
  // BE materialCode 우선 (예: "COTTON" / "POLYESTER" 등), 없으면 fallback
  return MATERIAL_COLORS[m?.materialCode] ?? MATERIAL_COLOR_FALLBACK
}

// 막대 데이터/옵션 — 매출(원) → 판매량(kg) 기준으로 전환.
const materialSalesBarData = computed(() => ({
  labels: circularMaterialStats.value.map((m) => m.name),
  datasets: [{
    label: '판매량(kg)',
    data: circularMaterialStats.value.map((m) => m.units),
    backgroundColor: circularMaterialStats.value.map(resolveMaterialColor),
    borderRadius: 4,
  }],
}))

const materialSalesBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `${Number(ctx.parsed.x).toLocaleString()} kg` } },
  },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => `${Number(v).toLocaleString()} kg` } },
    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

// 전체 판매량(kg) — 헤더 요약 표시용. (이전: 전체 매출 sum)
const totalMaterialWeight = computed(() =>
  circularMaterialStats.value.reduce((s, m) => s + m.units, 0),
)

// ─── 소재 판매량 비중 도넛 (순환재고 모드용) — ESG 카드와 동일한 소재별 컬러 매핑 ────
const materialShareList = computed(() =>
  circularMaterialStats.value.map((m) => ({
    name: m.name,
    units: m.units,
    share: m.sharePct,
    color: resolveMaterialColor(m),
  })),
)

const materialDoughnutData = computed(() => ({
  labels: materialShareList.value.map((m) => m.name),
  datasets: [{
    data: materialShareList.value.map((m) => m.share),
    backgroundColor: materialShareList.value.map((m) => m.color),
    borderWidth: 2,
    borderColor: '#fff',
  }],
}))
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
  >
    <div class="flex flex-col gap-4">
      <!-- 페이지 헤더 -->
      <section class="flex flex-wrap items-end justify-between gap-3 border border-gray-300 bg-white p-4 shadow-sm">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">CIRCULAR INVENTORY · VENDOR ANALYTICS</p>
          <h2 class="mt-1 flex items-center gap-2 text-base font-black text-gray-900">
            <Handshake :size="18" class="text-[#004D3C]" />
            순환재고 판매 통계
          </h2>
          <p class="mt-1 text-[11px] text-gray-500">
            기준일: {{ dateLabel }} · 거래처별 매출·의존도·소재 분포 분석
          </p>
        </div>
        <div class="flex flex-col items-end gap-0.5 text-[10px] text-gray-500">
          <span><b class="text-gray-700">의존도</b> = 거래처 매출 ÷ 전체 매출</span>
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
        <label v-if="periodUnit === '월간'" class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          월 선택
          <select v-model="selectedMonth" class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
            <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </label>
      </section>

      <!-- KPI 3개 (활성 거래처 · 연간 총 탄소 감축량 · 총 판매 금액) -->
      <section class="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <article
          v-for="k in kpiCards"
          :key="k.label"
          class="border border-gray-300 bg-white p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <p class="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">{{ k.label }}</p>
            <div :class="[k.iconBg, 'flex h-8 w-8 items-center justify-center']">
              <component :is="k.icon" :size="14" :class="k.iconCls" />
            </div>
          </div>
          <p class="mt-2 truncate text-xl font-black" :class="k.valueCls" :title="String(k.value)">
            {{ k.value }}
            <span v-if="k.unit" class="ml-1 text-xs font-bold text-gray-500">{{ k.unit }}</span>
          </p>
          <p class="mt-1 truncate text-[10px] text-gray-500">{{ k.sub }}</p>
        </article>
      </section>

      <!-- 막대 + 도넛 (detailView에 따라 거래처/소재로 전환) -->
      <section class="grid gap-4 lg:grid-cols-3">
        <!-- 좌측 막대 -->
        <article class="border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <!-- 거래처 모드 -->
          <template v-if="detailView === 'vendor'">
            <header class="mb-3 flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                <Award :size="14" class="text-amber-600" />
                거래처 매출 TOP 10
              </h3>
            </header>
            <BarChart :data="top10ChartData" :options="top10ChartOptions" :height="380" />
          </template>
          <!-- 순환재고 모드 — 매출(원) 기준에서 판매량(kg) 기준으로 전환 -->
          <template v-else>
            <header class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                <Award :size="14" :style="{ color: '#047857' }" />
                소재 판매량 순위
              </h3>
              <span class="text-[10px] font-bold text-gray-400">
                전체 판매량 <span :style="{ color: '#047857' }" class="font-black">{{ totalMaterialWeight.toLocaleString() }} kg</span> · {{ circularMaterialStats.length }}개 소재
              </span>
            </header>
            <BarChart :data="materialSalesBarData" :options="materialSalesBarOptions" :height="380" />
          </template>
        </article>

        <!-- 우측 도넛 -->
        <article class="border border-gray-200 bg-white p-5 shadow-sm">
          <!-- 거래처 모드: 의존도 분석 -->
          <template v-if="detailView === 'vendor'">
            <header class="mb-3 border-b border-gray-100 pb-2">
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                🔄 의존도 분석 (TOP 5)
              </h3>
            </header>
            <DoughnutChart :data="dependencyChartData" :options="doughnutOptions" :height="220" />
            <ul class="mt-3 space-y-1 text-[11px]">
              <li
                v-for="(d, i) in dependencyData"
                :key="d.name"
                class="flex items-center justify-between border-b border-dashed border-gray-100 py-1"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <span class="inline-block h-2 w-2 shrink-0" :style="{ backgroundColor: DEPENDENCY_PALETTE[i] }"></span>
                  <span class="truncate font-bold text-gray-700">{{ d.name }}</span>
                </span>
                <span class="shrink-0" :class="d.pct >= 18 ? 'font-black text-red-600' : 'text-gray-500'">{{ d.pct }}%</span>
              </li>
            </ul>
            <p
              v-if="maxDependency >= 18"
              class="mt-3 border-l-2 border-red-500 bg-red-50/50 px-2 py-1.5 text-[10px] font-bold text-red-700"
            >
              ⚠️ 최대 의존도 {{ maxDependency }}% — 분산 검토 필요
            </p>
          </template>
          <!-- 순환재고 모드: 소재 판매량 비중 (매출 → kg 기준 전환) -->
          <template v-else>
            <header class="mb-3 border-b border-gray-100 pb-2">
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                🥧 소재 판매량 비중
              </h3>
            </header>
            <DoughnutChart :data="materialDoughnutData" :options="materialDoughnutOptions" :height="220" />
            <ul class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <li
                v-for="mat in materialShareList"
                :key="mat.name"
                class="flex items-center justify-between gap-2 border-b border-dashed border-gray-100 py-1"
              >
                <span class="flex min-w-0 items-center gap-2">
                  <span class="inline-block h-2 w-2 shrink-0" :style="{ backgroundColor: mat.color }"></span>
                  <span class="truncate font-bold text-gray-700">{{ mat.name }}</span>
                </span>
                <span class="shrink-0 text-gray-500">{{ mat.share }}%</span>
              </li>
            </ul>
          </template>
        </article>
      </section>

      <!-- 순환재고 소재 상세 박스 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <header class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/70 px-4 py-3">
          <div class="flex items-center gap-2 border-l-4 border-[#004D3C] pl-3">
            <Recycle :size="18" class="text-[#004D3C]" />
            <h3 class="text-base font-black tracking-tight text-[#004D3C]">순환재고 소재 상세</h3>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-gray-400">{{ circularMaterialStats.length }}개 소재</span>
            <button
              type="button"
              class="inline-flex items-center gap-1 border border-gray-300 bg-white px-2 py-1 text-[10px] font-black text-gray-600 transition-colors hover:bg-gray-50"
              @click="detailExpanded = !detailExpanded"
            >
              {{ detailExpanded ? '▲ 접기' : '▼ 상세 보기' }}
            </button>
          </div>
        </header>

        <!-- 순환재고 상세 (소재별 판매 분석) -->
        <div v-if="detailExpanded" class="overflow-auto">
          <table class="w-full min-w-[680px] text-xs">
            <thead class="bg-gray-100 text-[10px] text-gray-500">
              <tr>
                <th class="w-12 px-3 py-2 text-center font-bold">순위</th>
                <th class="px-3 py-2 text-left font-bold">소재명</th>
                <th class="w-28 px-3 py-2 text-center font-bold">소재 유형</th>
                <th class="w-24 px-3 py-2 text-right font-bold">판매량(kg)</th>
                <th class="w-24 px-3 py-2 text-right font-bold">매출</th>
                <th class="w-20 px-3 py-2 text-right font-bold">비중</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, i) in circularMaterialStats" :key="item.name" class="hover:bg-gray-50">
                <td class="px-3 py-2 text-center font-bold text-gray-500">{{ i + 1 }}</td>
                <td class="px-3 py-2 font-bold text-gray-800">
                  {{ item.name }}
                  <span v-if="item.eco" class="ml-1 inline-flex items-center gap-0.5 bg-emerald-50 px-1 py-0.5 text-[9px] font-black text-emerald-700">
                    <Leaf :size="9" /> ECO
                  </span>
                </td>
                <td class="px-3 py-2 text-center">
                  <span :class="materialTypeBadge(item.materialType)" class="inline-block whitespace-nowrap px-2 py-0.5 text-[10px] font-black">
                    {{ item.materialType }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right font-mono font-bold text-gray-800">{{ item.units.toLocaleString() }} kg</td>
                <td class="px-3 py-2 text-right font-mono text-gray-700">{{ formatKoreanMoney(item.sales) }}</td>
                <td class="px-3 py-2 text-right font-bold text-gray-700">{{ item.sharePct }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

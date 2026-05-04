<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Handshake,
  TrendingUp,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Award,
  Search,
  Filter,
  Recycle,
  Leaf,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((m) => m.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('순환재고 거래처 통계')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// ─── 필터 ─────────────────────────────────────────────────────────────
const periodUnit = ref('월간')
const materialFilter = ref('전체')
const gradeFilter = ref('전체')
const keyword = ref('')

const periodOptions = ['월간', '분기', '연간']
const materialOptions = [
  '전체',
  'Cotton (면)',
  'Wool (울)',
  'Cashmere (캐시미어)',
  'Silk (실크)',
  'Linen (린넨)',
  'Polyester (폴리에스터)',
  'Acrylic (아크릴)',
  'Polyamide (나일론)',
  'Elastane (스판덱스)',
  '혼방',
]
const gradeOptions = ['전체', 'A', 'B', 'C']

// ─── 거래처 데이터 ────────────────────────────────────────────────────
// unitPrice: 소재의 표준 단가 (원/kg) — 본사 정책 기준가
// orderWeight: 1회 거래 시 발주 무게 (kg) — 거래처가 원하는 최소 거래량
//
// 소재 표준 단가 (원/kg):
//   Cotton 5000 / Wool 10000 / Cashmere 35000 / Silk 20000 / Linen 5000
//   Polyester 3000 / Acrylic 2000 / Polyamide 4000 / Elastane 2000 / 혼방 1000
const vendors = [
  // A등급 (우수)
  { name: '(주)봄섬유',     material: 'Cotton (면)',          unitPrice: 5000,  orderWeight: 3500, orderValue: 280, depShare: 18, leadTime: 12, onTimeRate: 96, defectRate: 0.8, priceChange: -2,  trend: 'up' },
  { name: '한솔텍스타일',    material: 'Cotton (면)',          unitPrice: 5000,  orderWeight: 4000, orderValue: 215, depShare: 14, leadTime: 11, onTimeRate: 98, defectRate: 0.5, priceChange:  0,  trend: 'up' },
  { name: '(주)그린코튼',    material: 'Cotton (면)',          unitPrice: 5000,  orderWeight: 2500, orderValue: 168, depShare: 11, leadTime: 13, onTimeRate: 95, defectRate: 1.0, priceChange: -1,  trend: 'flat' },
  { name: '신한섬유',       material: 'Polyester (폴리에스터)', unitPrice: 3000,  orderWeight: 8000, orderValue: 152, depShare: 10, leadTime: 14, onTimeRate: 97, defectRate: 0.7, priceChange: -5,  trend: 'up' },
  { name: '대성패브릭',     material: 'Wool (울)',            unitPrice: 10000, orderWeight: 800,  orderValue: 135, depShare: 9,  leadTime: 13, onTimeRate: 96, defectRate: 0.9, priceChange:  1,  trend: 'flat' },
  { name: '(주)서울니트',    material: 'Cashmere (캐시미어)',   unitPrice: 35000, orderWeight: 200,  orderValue: 98,  depShare: 6,  leadTime: 10, onTimeRate: 98, defectRate: 0.6, priceChange:  2,  trend: 'up' },
  // B등급 (일반)
  { name: '가나면방',       material: 'Cotton (면)',          unitPrice: 5000,  orderWeight: 3000, orderValue: 180, depShare: 12, leadTime: 15, onTimeRate: 88, defectRate: 1.5, priceChange:  5,  trend: 'flat' },
  { name: '동아울',         material: 'Wool (울)',            unitPrice: 10000, orderWeight: 600,  orderValue: 142, depShare: 9,  leadTime: 16, onTimeRate: 86, defectRate: 1.8, priceChange:  3,  trend: 'flat' },
  { name: '(주)컬러스',     material: 'Polyester (폴리에스터)', unitPrice: 3000,  orderWeight: 6000, orderValue: 95,  depShare: 6,  leadTime: 14, onTimeRate: 89, defectRate: 1.6, priceChange:  4,  trend: 'flat' },
  { name: '하늘텍스',       material: 'Polyamide (나일론)',    unitPrice: 4000,  orderWeight: 3500, orderValue: 78,  depShare: 5,  leadTime: 17, onTimeRate: 85, defectRate: 2.0, priceChange:  6,  trend: 'down' },
  { name: '미래패션',       material: 'Linen (린넨)',          unitPrice: 5000,  orderWeight: 1500, orderValue: 62,  depShare: 4,  leadTime: 16, onTimeRate: 87, defectRate: 1.7, priceChange:  2,  trend: 'flat' },
  // C등급 (부진)
  { name: '(주)아주의류',    material: '혼방',                  unitPrice: 1000,  orderWeight: 2000, orderValue: 45,  depShare: 3,  leadTime: 25, onTimeRate: 65, defectRate: 4.2, priceChange: 18,  trend: 'down' },
  { name: '동남섬유',       material: 'Acrylic (아크릴)',      unitPrice: 2000,  orderWeight: 4500, orderValue: 38,  depShare: 2,  leadTime: 22, onTimeRate: 72, defectRate: 3.5, priceChange: 12,  trend: 'down' },
  { name: '명진의류',       material: 'Silk (실크)',           unitPrice: 20000, orderWeight: 350,  orderValue: 28,  depShare: 2,  leadTime: 21, onTimeRate: 70, defectRate: 3.8, priceChange: 14,  trend: 'down' },
]

// ─── 등급 자동 산정 ───────────────────────────────────────────────────
// 점수: 정시율(50%) + 불량률 역산(25%) + 단가변동 역산(25%)
function calcGrade(v) {
  const onTimeScore = (v.onTimeRate / 100) * 50
  const defectScore = Math.max(0, (3 - v.defectRate) / 3) * 25
  const priceScore = Math.max(0, (10 - Math.abs(v.priceChange)) / 10) * 25
  const total = onTimeScore + defectScore + priceScore
  if (total >= 80) return 'A'
  if (total >= 60) return 'B'
  return 'C'
}

const vendorsWithGrade = computed(() =>
  vendors.map((v) => ({ ...v, grade: calcGrade(v) })),
)

// ─── 필터링 ────────────────────────────────────────────────────────────
const filteredVendors = computed(() => {
  let list = vendorsWithGrade.value
  if (materialFilter.value !== '전체') {
    list = list.filter((v) => v.material === materialFilter.value)
  }
  if (gradeFilter.value !== '전체') {
    list = list.filter((v) => v.grade === gradeFilter.value)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter((v) => v.name.toLowerCase().includes(kw))
  }
  return list
})

// ─── KPI 5개 ──────────────────────────────────────────────────────────
const kpiCards = computed(() => {
  const all = vendorsWithGrade.value
  const active = all.length
  const avgLead = (all.reduce((s, v) => s + v.leadTime, 0) / active).toFixed(1)
  const avgOnTime = (all.reduce((s, v) => s + v.onTimeRate, 0) / active).toFixed(1)
  const avgDefect = (all.reduce((s, v) => s + v.defectRate, 0) / active).toFixed(2)
  return [
    { label: '활성 거래처', value: active, unit: '곳', sub: `전체 ${all.length}개 · 소재 ${[...new Set(all.map(v => v.material))].length}종`, icon: Handshake, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
    { label: '평균 리드타임', value: avgLead, unit: '일', sub: '발주 → 입고 평균', icon: Truck, valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
    { label: '평균 정시율', value: avgOnTime, unit: '%', sub: '정시 납기 비율', icon: CheckCircle2, valueCls: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600' },
    { label: '평균 불량률', value: avgDefect, unit: '%', sub: '불량 / 입고 수량', icon: AlertTriangle, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
    { label: '총 발주 금액', value: all.reduce((s, v) => s + v.orderValue, 0), unit: 'M원', sub: '이번 달 누적', icon: TrendingUp, valueCls: 'text-rose-700', iconBg: 'bg-rose-50', iconCls: 'text-rose-600' },
  ]
})

// ─── TOP 10 매출 막대 ─────────────────────────────────────────────────
const top10ByValue = computed(() =>
  [...vendorsWithGrade.value].sort((a, b) => b.orderValue - a.orderValue).slice(0, 10),
)

const gradeColor = (grade) => {
  if (grade === 'A') return '#059669'
  if (grade === 'B') return '#3b82f6'
  return '#ef4444'
}

const top10ChartData = computed(() => ({
  labels: top10ByValue.value.map((v) => v.name),
  datasets: [{
    label: '발주 금액 (M원)',
    data: top10ByValue.value.map((v) => v.orderValue),
    backgroundColor: top10ByValue.value.map((v) => gradeColor(v.grade)),
    borderRadius: 4,
  }],
}))

const top10ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `₩${ctx.parsed.x}M` } },
  },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => '₩' + v + 'M' } },
    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

// ─── 의존도 도넛 (TOP 5 + 기타) ───────────────────────────────────────
const dependencyData = computed(() => {
  const sorted = [...vendorsWithGrade.value].sort((a, b) => b.orderValue - a.orderValue)
  const top5 = sorted.slice(0, 5)
  const rest = sorted.slice(5)
  const restValue = rest.reduce((s, v) => s + v.orderValue, 0)
  const total = sorted.reduce((s, v) => s + v.orderValue, 0) || 1
  const list = [
    ...top5.map((v) => ({
      name: v.name,
      value: v.orderValue,
      pct: parseFloat(((v.orderValue / total) * 100).toFixed(1)),
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

const maxDependency = computed(() =>
  Math.max(...dependencyData.value.slice(0, 5).map((d) => d.pct), 0),
)

// ─── 자동 인사이트 ────────────────────────────────────────────────────
const insights = computed(() => {
  const out = []
  const sorted = [...vendorsWithGrade.value].sort((a, b) => b.depShare - a.depShare)
  const topDep = sorted[0]
  if (topDep && topDep.depShare >= 15) {
    out.push({
      type: 'warning',
      icon: '🔥',
      title: '의존도 경고',
      text: `${topDep.name} 발주 비중 ${topDep.depShare}% — 분산 검토`,
      cls: 'border-amber-500 text-amber-700',
    })
  }
  const priceUp = vendorsWithGrade.value.filter((v) => v.priceChange >= 10).sort((a, b) => b.priceChange - a.priceChange)[0]
  if (priceUp) {
    out.push({
      type: 'price',
      icon: '📈',
      title: '단가 인상',
      text: `${priceUp.name} +${priceUp.priceChange}% 인상 — 협상 시기`,
      cls: 'border-rose-500 text-rose-700',
    })
  }
  const defectHigh = vendorsWithGrade.value.filter((v) => v.defectRate >= 3).sort((a, b) => b.defectRate - a.defectRate)[0]
  if (defectHigh) {
    out.push({
      type: 'defect',
      icon: '📉',
      title: '품질 하락',
      text: `${defectHigh.name} 불량 ${defectHigh.defectRate}% (평균의 2배) — 점검 미팅`,
      cls: 'border-red-500 text-red-700',
    })
  }
  const star = vendorsWithGrade.value.filter((v) => v.grade === 'A' && v.priceChange < 0).sort((a, b) => a.priceChange - b.priceChange)[0]
  if (star) {
    out.push({
      type: 'opportunity',
      icon: '✨',
      title: '발주 확대 추천',
      text: `${star.name} 정시율 ${star.onTimeRate}%, 단가 ${star.priceChange}% — 발주 확대 검토`,
      cls: 'border-emerald-500 text-emerald-700',
    })
  }
  return out
})

const gradeBadge = (grade) => {
  if (grade === 'A') return 'bg-emerald-100 text-emerald-700'
  if (grade === 'B') return 'bg-blue-100 text-blue-700'
  return 'bg-red-100 text-red-700'
}

const trendIcon = (trend) => {
  if (trend === 'up') return { ico: '↗', cls: 'text-emerald-600' }
  if (trend === 'down') return { ico: '↘', cls: 'text-red-600' }
  return { ico: '→', cls: 'text-gray-400' }
}

// ─── 거래처 상세 / 순환재고 상세 토글 ────────────────────────────────
const detailView = ref('vendor') // 'vendor' | 'circular'

// ─── 순환재고 상세: 소재 데이터 ──────────────────────────────────────
// materialType: 천연 단일 / 합성 / 혼방
const circularMaterials = [
  { name: 'Cotton (면)', materialType: '천연 단일', units: 4500, sales: 65, eco: true },
  { name: 'Wool (울)', materialType: '천연 단일', units: 1200, sales: 48, eco: true },
  { name: 'Cashmere (캐시미어)', materialType: '천연 단일', units: 380, sales: 45, eco: true },
  { name: 'Silk (실크)', materialType: '천연 단일', units: 420, sales: 38, eco: true },
  { name: 'Linen (린넨)', materialType: '천연 단일', units: 1500, sales: 28, eco: true },
  { name: 'Polyester (폴리에스터)', materialType: '합성', units: 3400, sales: 42, eco: false },
  { name: 'Acrylic (아크릴)', materialType: '합성', units: 1600, sales: 18, eco: false },
  { name: 'Polyamide (나일론)', materialType: '합성', units: 1800, sales: 39, eco: false },
  { name: 'Elastane (스판덱스)', materialType: '합성', units: 2200, sales: 22, eco: false },
  { name: '혼방', materialType: '혼방', units: 2400, sales: 35, eco: false },
]

const circularMaterialStats = computed(() => {
  const sorted = [...circularMaterials].sort((a, b) => b.sales - a.sales)
  const total = sorted.reduce((s, x) => s + x.sales, 0) || 1
  return sorted.map((item) => {
    const sharePct = (item.sales / total) * 100
    const avgUnitPrice = item.units > 0 ? Math.round((item.sales * 1_000_000) / item.units) : 0
    return {
      ...item,
      sharePct: parseFloat(sharePct.toFixed(1)),
      avgUnitPrice,
    }
  })
})

const materialTypeBadge = (type) => {
  if (type === '천연 단일') return 'bg-emerald-100 text-emerald-700'
  if (type === '합성') return 'bg-violet-100 text-violet-700'
  if (type === '혼방') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

// ─── 소재 매출 순위 막대 (순환재고 모드용) ────────────────────────────
const MATERIAL_BAR_COLOR = '#047857'

const materialSalesBarData = computed(() => ({
  labels: circularMaterialStats.value.map((m) => m.name),
  datasets: [{
    label: '매출 (M원)',
    data: circularMaterialStats.value.map((m) => m.sales),
    backgroundColor: MATERIAL_BAR_COLOR,
    borderRadius: 4,
  }],
}))

const materialSalesBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `₩${ctx.parsed.x}M` } },
  },
  scales: {
    x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 }, callback: (v) => '₩' + v + 'M' } },
    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

const totalMaterialSales = computed(() =>
  circularMaterialStats.value.reduce((s, m) => s + m.sales, 0).toFixed(1),
)

// ─── 소재 매출 비중 도넛 (순환재고 모드용) ────────────────────────────
const MATERIAL_PALETTE = [
  '#059669', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444',
  '#10b981', '#3b82f6', '#eab308', '#c084fc', '#f87171',
]

const materialShareList = computed(() =>
  circularMaterialStats.value.map((m, i) => ({
    name: m.name,
    sales: m.sales,
    share: m.sharePct,
    color: MATERIAL_PALETTE[i % MATERIAL_PALETTE.length],
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
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <!-- 페이지 헤더 -->
      <section class="flex flex-wrap items-end justify-between gap-3 border border-gray-300 bg-white p-4 shadow-sm">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">CIRCULAR INVENTORY · VENDOR ANALYTICS</p>
          <h2 class="mt-1 flex items-center gap-2 text-base font-black text-gray-900">
            <Handshake :size="18" class="text-[#004D3C]" />
            순환재고 거래처 통계
          </h2>
          <p class="mt-1 text-[11px] text-gray-500">
            기준일: {{ dateLabel }} · 거래처별 성과·의존도·리스크를 종합 분석
          </p>
        </div>
        <div class="flex flex-col items-end gap-0.5 text-[10px] text-gray-500">
          <span><b class="text-gray-700">정시 납기율</b> = 정시 도착 ÷ 전체 발주</span>
          <span><b class="text-gray-700">의존도</b> = 거래처 발주 ÷ 전체 발주</span>
          <span><b class="text-gray-700">등급</b> = 정시율(50) + 품질(25) + 단가(25)</span>
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
        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          소재
          <select v-model="materialFilter" class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
            <option v-for="m in materialOptions" :key="m" :value="m">{{ m }}</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
          등급
          <select v-model="gradeFilter" class="border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#004D3C] focus:bg-white">
            <option v-for="g in gradeOptions" :key="g" :value="g">{{ g }}</option>
          </select>
        </label>
        <label class="relative ml-auto flex items-center">
          <Search :size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="keyword"
            type="text"
            placeholder="거래처명 검색..."
            class="w-56 border border-gray-300 bg-gray-50 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C] focus:bg-white"
          />
        </label>
      </section>

      <!-- KPI 5개 -->
      <section class="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
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
          <p class="mt-2 text-xl font-black" :class="k.valueCls">
            {{ k.value }}
            <span class="ml-1 text-xs font-bold text-gray-500">{{ k.unit }}</span>
          </p>
          <p class="mt-1 text-[10px] text-gray-500">{{ k.sub }}</p>
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
              <div class="flex items-center gap-2 text-[10px]">
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2 bg-emerald-600"></span>A등급</span>
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2 bg-blue-500"></span>B등급</span>
                <span class="inline-flex items-center gap-1"><span class="h-2 w-2 bg-red-500"></span>C등급</span>
              </div>
            </header>
            <BarChart :data="top10ChartData" :options="top10ChartOptions" :height="380" />
          </template>
          <!-- 순환재고 모드 -->
          <template v-else>
            <header class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                <Award :size="14" :style="{ color: '#047857' }" />
                소재 매출 순위
              </h3>
              <span class="text-[10px] font-bold text-gray-400">
                전체 매출 <span :style="{ color: '#047857' }" class="font-black">₩{{ totalMaterialSales }}M</span> · {{ circularMaterialStats.length }}개 소재
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
          <!-- 순환재고 모드: 소재 매출 비중 -->
          <template v-else>
            <header class="mb-3 border-b border-gray-100 pb-2">
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-800">
                🥧 소재 매출 비중
              </h3>
            </header>
            <DoughnutChart :data="materialDoughnutData" :options="doughnutOptions" :height="220" />
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

      <!-- 자동 인사이트 -->
      <section v-if="insights.length" class="border border-gray-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
        <header class="mb-3 border-b border-gray-100 pb-2">
          <h3 class="text-xs font-black text-gray-800">💡 거래처 인사이트</h3>
        </header>
        <ul class="grid gap-2 text-[11px] md:grid-cols-2 xl:grid-cols-4">
          <li
            v-for="ins in insights"
            :key="ins.type"
            :class="ins.cls"
            class="border-l-2 bg-white px-3 py-2"
          >
            <p class="font-black">{{ ins.icon }} {{ ins.title }}</p>
            <p class="mt-1 text-gray-700">{{ ins.text }}</p>
          </li>
        </ul>
      </section>

      <!-- 거래처 상세 / 순환재고 상세 토글 박스 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <header class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/70 px-4 py-3">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black transition-colors"
              :class="detailView === 'vendor'
                ? 'bg-[#004D3C] text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'"
              @click="detailView = 'vendor'"
            >
              📋 거래처 상세
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black transition-colors"
              :class="detailView === 'circular'
                ? 'bg-[#004D3C] text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'"
              @click="detailView = 'circular'"
            >
              <Recycle :size="13" />
              순환재고 상세
            </button>
          </div>
          <span class="text-[10px] font-bold text-gray-400">
            <template v-if="detailView === 'vendor'">{{ filteredVendors.length }}개 거래처</template>
            <template v-else>{{ circularMaterialStats.length }}개 소재</template>
          </span>
        </header>

        <!-- 거래처 상세 -->
        <div v-if="detailView === 'vendor'" class="overflow-auto">
          <table class="w-full min-w-[1000px] text-xs">
            <thead class="bg-gray-100 text-[10px] text-gray-500">
              <tr>
                <th class="w-12 px-3 py-2 text-center font-bold">등급</th>
                <th class="px-3 py-2 text-left font-bold">거래처</th>
                <th class="w-44 px-3 py-2 text-center font-bold">소재</th>
                <th class="w-28 px-3 py-2 text-right font-bold">단가 (원/kg)</th>
                <th class="w-28 px-3 py-2 text-right font-bold">1회 거래 무게</th>
                <th class="w-24 px-3 py-2 text-right font-bold">발주 금액</th>
                <th class="w-20 px-3 py-2 text-right font-bold">의존도</th>
                <th class="w-20 px-3 py-2 text-right font-bold">리드타임</th>
                <th class="w-20 px-3 py-2 text-right font-bold">정시율</th>
                <th class="w-20 px-3 py-2 text-right font-bold">불량률</th>
                <th class="w-24 px-3 py-2 text-right font-bold">단가 변동</th>
                <th class="w-16 px-3 py-2 text-center font-bold">추세</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="!filteredVendors.length">
                <td class="px-3 py-8 text-center text-gray-400" colspan="12">
                  검색 조건에 맞는 거래처가 없습니다.
                </td>
              </tr>
              <tr v-for="v in filteredVendors" :key="v.name" class="hover:bg-gray-50">
                <td class="px-3 py-2 text-center">
                  <span :class="gradeBadge(v.grade)" class="px-2 py-0.5 text-[10px] font-black">{{ v.grade }}</span>
                </td>
                <td class="px-3 py-2 font-bold text-gray-800">{{ v.name.trim() }}</td>
                <td class="px-3 py-2 text-center text-gray-600">{{ v.material }}</td>
                <td class="px-3 py-2 text-right font-mono text-gray-700">₩{{ v.unitPrice.toLocaleString() }}</td>
                <td class="px-3 py-2 text-right font-mono text-gray-700">{{ v.orderWeight.toLocaleString() }}<span class="ml-0.5 text-[10px] text-gray-400">kg</span></td>
                <td class="px-3 py-2 text-right font-mono font-bold text-gray-800">₩{{ v.orderValue }}M</td>
                <td class="px-3 py-2 text-right font-mono"
                    :class="v.depShare >= 18 ? 'font-black text-red-600' : 'text-gray-700'">
                  {{ v.depShare }}%
                </td>
                <td class="px-3 py-2 text-right font-mono"
                    :class="v.leadTime >= 20 ? 'font-bold text-red-600' : 'text-gray-700'">
                  {{ v.leadTime }}일
                </td>
                <td class="px-3 py-2 text-right font-mono"
                    :class="v.onTimeRate >= 95 ? 'font-bold text-emerald-700' : v.onTimeRate < 80 ? 'font-bold text-red-600' : 'text-gray-700'">
                  {{ v.onTimeRate }}%
                </td>
                <td class="px-3 py-2 text-right font-mono"
                    :class="v.defectRate >= 3 ? 'font-bold text-red-600' : v.defectRate < 1 ? 'text-emerald-700' : 'text-gray-700'">
                  {{ v.defectRate }}%
                </td>
                <td class="px-3 py-2 text-right font-mono"
                    :class="v.priceChange >= 10 ? 'font-bold text-red-600' : v.priceChange < 0 ? 'font-bold text-emerald-700' : 'text-gray-700'">
                  {{ v.priceChange > 0 ? '+' : '' }}{{ v.priceChange }}%
                </td>
                <td class="px-3 py-2 text-center text-base"
                    :class="trendIcon(v.trend).cls">
                  {{ trendIcon(v.trend).ico }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 순환재고 상세 (소재별 판매 분석) -->
        <div v-else class="overflow-auto">
          <table class="w-full min-w-[680px] text-xs">
            <thead class="bg-gray-100 text-[10px] text-gray-500">
              <tr>
                <th class="w-12 px-3 py-2 text-center font-bold">순위</th>
                <th class="px-3 py-2 text-left font-bold">소재명</th>
                <th class="w-24 px-3 py-2 text-right font-bold">객단가</th>
                <th class="w-20 px-3 py-2 text-center font-bold">소재 유형</th>
                <th class="w-20 px-3 py-2 text-right font-bold">판매수</th>
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
                <td class="px-3 py-2 text-right font-mono text-gray-700">₩{{ item.avgUnitPrice.toLocaleString() }}</td>
                <td class="px-3 py-2 text-center">
                  <span :class="materialTypeBadge(item.materialType)" class="px-2 py-0.5 text-[10px] font-black">
                    {{ item.materialType }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right font-mono text-gray-700">{{ item.units.toLocaleString() }}</td>
                <td class="px-3 py-2 text-right font-mono font-bold text-gray-800">₩{{ item.sales }}M</td>
                <td class="px-3 py-2 text-right font-bold text-gray-700">{{ item.sharePct }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

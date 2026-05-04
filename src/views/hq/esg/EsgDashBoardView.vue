<script setup>
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import {
  Leaf,
  Recycle,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Award,
  ChevronDown,
  Scale,
  Coins,
  CheckCircle2,
  RefreshCw,
  Heart,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEsgStore } from '@/stores/esg.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => 'ESG 현황판')
const activeSideMenu = ref('ESG 현황판')
const esgSideMenus = [{ label: 'ESG 현황판', icon: 'chart', path: '/hq/esg' }]

const esgStore = useEsgStore()
const { totalPoints, kauPrice, kauPriceUpdatedAt, kauPriceLoading } = storeToRefs(esgStore)

const emissionCompliance = {
  allocation: 5000,
  ytdNet: 1135,
  ytdReduced: 285,
  utilizationPct: 22.7,
  expectedSurplus: 1595,
  warnPct: 75,
  quarterly: [
    { q: 'Q1', period: '1월~3월', allocation: 1250, actual: 720 },
    { q: 'Q2', period: '4월~6월', allocation: 1250, actual: 415 },
    { q: 'Q3', period: '7월~9월', allocation: 1250, actual: 0 },
    { q: 'Q4', period: '10월~12월', allocation: 1250, actual: 0 },
  ],
}

const marketVolume = {
  reducedTons: 285,
  surplusTons: 1595,
  yearlyTonsProjected: 855,
  yoyPct: 47,
  monthlyTons: [
    { m: '1월', tons: 76.4 },
    { m: '2월', tons: 95.0 },
    { m: '3월', tons: 86.4 },
    { m: '4월', tons: 27.2 },
    { m: '5월', tons: 55.0 },
    { m: '6월', tons: 68.0 },
    { m: '7월', tons: 82.0 },
    { m: '8월', tons: 74.0 },
    { m: '9월', tons: 62.0 },
    { m: '10월', tons: 78.0 },
    { m: '11월', tons: 92.0 },
    { m: '12월', tons: 88.0 },
  ],
}

// 배출 한도 vs 사용한 탄소배출권 도넛
const emissionRemaining = computed(
  () => emissionCompliance.allocation - emissionCompliance.ytdNet,
)

const emissionDoughnutData = computed(() => ({
  labels: ['사용한 탄소배출권', '잔여 한도'],
  datasets: [
    {
      data: [emissionCompliance.ytdNet, emissionRemaining.value],
      backgroundColor: ['#2563eb', '#e5e7eb'],
      borderColor: ['#1d4ed8', '#d1d5db'],
      borderWidth: 1,
      hoverBackgroundColor: ['#1d4ed8', '#9ca3af'],
    },
  ],
}))

const emissionDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { font: { size: 11 }, boxWidth: 10, usePointStyle: true, padding: 12 },
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#93c5fd',
      titleFont: { size: 11, weight: 'bold' },
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
      displayColors: false,
      callbacks: {
        label: (ctx) => {
          const total = emissionCompliance.allocation
          const pct = ((ctx.parsed / total) * 100).toFixed(1)
          return `${ctx.parsed.toLocaleString()} tCO₂ (${pct}%)`
        },
      },
    },
  },
}

// 분기별 배출 진행 BarChart (Q1~Q2 실적만, Q3~Q4 라벨만)
const quarterlyChartData = computed(() => ({
  labels: emissionCompliance.quarterly.map((q) => q.period),
  datasets: [
    {
      label: '분기별 실적',
      data: emissionCompliance.quarterly.map((q) => (q.actual > 0 ? q.actual : null)),
      backgroundColor: 'rgba(59, 130, 246, 0.9)',
      borderColor: '#1d4ed8',
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 32,
      hoverBackgroundColor: '#1d4ed8',
    },
  ],
}))

const quarterlyChartOptions = computed(() => ({
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
        title: (items) => {
          const q = emissionCompliance.quarterly[items[0].dataIndex]
          return `${q.q} · ${q.period}`
        },
        label: (ctx) => {
          const q = emissionCompliance.quarterly[ctx.dataIndex]
          return [
            `실적 ${q.actual.toLocaleString()} t`,
            `할당 ${q.allocation.toLocaleString()} t`,
            `사용률 ${((q.actual / q.allocation) * 100).toFixed(1)}%`,
          ]
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, color: '#6b7280', maxRotation: 0, minRotation: 0 },
    },
    y: {
      grid: { color: '#f3f4f6', drawBorder: false },
      ticks: {
        font: { size: 9 },
        color: '#9ca3af',
        callback: (v) => v + 't',
      },
      beginAtZero: true,
    },
  },
}))

// 월별 환산 가치 추이 BarChart (1~4월 실적만 표시, 5~12월은 라벨만)
const monthlyChartData = computed(() => ({
  labels: marketVolume.monthlyTons.map((m) => m.m),
  datasets: [
    {
      label: '월별 환산 가치',
      data: marketVolume.monthlyTons.map((m, i) =>
        i < 4 ? m.tons * kauPrice.value : null,
      ),
      backgroundColor: 'rgba(245, 158, 11, 0.9)',
      borderColor: '#d97706',
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 24,
      hoverBackgroundColor: '#d97706',
    },
  ],
}))

const monthlyChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#fcd34d',
      titleFont: { size: 11, weight: 'bold' },
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
      displayColors: false,
      callbacks: {
        title: (items) => items[0].label,
        label: (ctx) => {
          const m = marketVolume.monthlyTons[ctx.dataIndex]
          return [
            `감축량 ${m.tons.toFixed(1)} tCO₂`,
            `KAU ₩${kauPrice.value.toLocaleString()}/t`,
            `환산 가치 ₩${Math.round(m.tons * kauPrice.value).toLocaleString()}`,
            '✓ 실적',
          ]
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, color: '#6b7280', maxRotation: 0, minRotation: 0 },
    },
    y: {
      grid: { color: '#f3f4f6', drawBorder: false },
      min: 0,
      max: 5000000,
      ticks: {
        font: { size: 9 },
        color: '#9ca3af',
        stepSize: 500000,
        callback: (v) => '₩' + Math.round(v / 10000).toLocaleString() + '만',
      },
      beginAtZero: true,
    },
  },
}))

const reducedKrw = computed(() => marketVolume.reducedTons * kauPrice.value)
const surplusKrw = computed(() => marketVolume.surplusTons * kauPrice.value)
const yearlyKrw = computed(() => marketVolume.yearlyTonsProjected * kauPrice.value)

const kauUpdatedLabel = computed(() => {
  if (!kauPriceUpdatedAt.value) return '시세 미조회'
  const d = new Date(kauPriceUpdatedAt.value)
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return '방금 전 갱신'
  if (diffMin < 60) return `${diffMin}분 전 갱신`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}시간 전 갱신`
  return (
    new Intl.DateTimeFormat('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ' 갱신'
  )
})

onMounted(() => {
  esgStore.fetchKauPrice()
})

const kpiMetrics = [
  { label: '탄소 배출 절감', value: '2,847', unit: 'kg CO₂', sub: '전월 대비 +12%', icon: TrendingDown, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '소재 재활용 전환율', value: '68.4', unit: '%', sub: '목표치 70% 근접', icon: Recycle, valueCls: 'text-green-700', iconBg: 'bg-green-50', iconCls: 'text-green-600' },
  { label: '폐기물 감소량', value: '1,240', unit: 'kg', sub: '불법폐기 0건', icon: ShieldCheck, valueCls: 'text-teal-700', iconBg: 'bg-teal-50', iconCls: 'text-teal-600' },
  { label: '폐기 손실 수익전환', value: '4,820,000', unit: '원', sub: '순환 회수 완료', icon: Award, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
]

const scoreCategories = [
  {
    id: 'productionAvoid',
    label: '신규 생산 회피',
    points: 9226,
    pct: 42.6,
    icon: Recycle,
    badge: '글로벌 표준',
    barCls: 'bg-emerald-500',
    badgeCls: 'bg-emerald-100 text-emerald-700',
    iconCls: 'text-emerald-600',
    desc: '재판매 → 다른 회사 신규 소재 생산 회피 (Higg MSI 표준)',
    formula: '처리 무게(kg) × Higg MSI 신규 생산 회피량 (kg CO₂/kg)',
    rows: [
      { label: '면 (Cotton)', detail: '480kg × 6.5', points: 3120 },
      { label: '폴리에스터', detail: '320kg × 6.8', points: 2176 },
      { label: '나일론', detail: '210kg × 5.5', points: 1155 },
      { label: '데님', detail: '150kg × 6.5', points: 975 },
      { label: '울 (Wool)', detail: '90kg × 20.0', points: 1800 },
    ],
  },
  {
    id: 'disposalAvoid',
    label: '폐기 회피',
    points: 3459,
    pct: 16.0,
    icon: ShieldCheck,
    badge: 'K-ETS 정합',
    barCls: 'bg-teal-500',
    badgeCls: 'bg-teal-100 text-teal-700',
    iconCls: 'text-teal-600',
    desc: '악성재고를 소각·매립·덤핑하지 않음 (폐기 배출 회피)',
    formula: '처리 무게(kg) × 소재별 폐기 회피 계수 (kg CO₂/kg)',
    rows: [
      { label: '면 (Cotton)', detail: '480kg × 2.5', points: 1200 },
      { label: '폴리에스터', detail: '320kg × 3.0', points: 960 },
      { label: '나일론', detail: '210kg × 3.2', points: 672 },
      { label: '데님', detail: '150kg × 2.5', points: 375 },
      { label: '울 (Wool)', detail: '90kg × 2.8', points: 252 },
    ],
  },
  {
    id: 'method',
    label: '처리 방식',
    points: 6300,
    pct: 29.1,
    icon: RefreshCw,
    badge: '가중 적용',
    barCls: 'bg-blue-500',
    badgeCls: 'bg-blue-100 text-blue-700',
    iconCls: 'text-blue-600',
    desc: '업사이클 ×1.5 / 재활용 ×1.2 / 재판매 ×1.0 / 다운사이클 ×0.6',
    formula: '처리량(kg) × Higg MSI 평균 회피량 × 처리 방식별 가중치',
    rows: [
      { label: '업사이클링', target: '가치 향상 재제품화 (가방/패치워크)', detail: '280kg × 가중치 1.5', points: 1575 },
      { label: '재활용', target: '분쇄/재방사 → 신소재 원료', detail: '700kg × 가중치 1.2', points: 3150 },
      { label: '중고 재판매', target: '정상 재고 → 아울렛/구제몰', detail: '420kg × 가중치 1.0', points: 945 },
      { label: '다운사이클링', target: '산업용 흡음재/충전재', detail: '285kg × 가중치 0.6', points: 630 },
    ],
  },
  {
    id: 'donation',
    label: '기부',
    points: 2655,
    pct: 12.3,
    icon: Heart,
    badge: '사회적 가치 최고',
    barCls: 'bg-pink-500',
    badgeCls: 'bg-pink-100 text-pink-700',
    iconCls: 'text-pink-600',
    desc: '재해구호 ×2.0 / 취약계층 ×1.5 / 개도국 ×1.3 / 교육기관 ×1.1',
    formula: '기부 무게(kg) × 소재별 탄소환산계수 × 기부 유형별 가중치',
    rows: [
      { label: '재해 구호', target: '지진/홍수/한파 긴급 지원', detail: '면 코트 95kg × 6.5 × 2.0', points: 1235 },
      { label: '취약 계층 지원', target: '노숙인/저소득/복지시설', detail: '면 80kg × 6.5 × 1.5', points: 780 },
      { label: '개도국 의류 지원', target: '해외 구호 단체', detail: '폴리에스터 50kg × 6.8 × 1.3', points: 442 },
      { label: '교육 기관 지원', target: '직업학교/기술학원 (재단 실습용)', detail: '다양 소재 30kg × 6.0 × 1.1', points: 198 },
    ],
  },
]

const expandedId = ref(null)
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

const materialData = [
  // 천연 단일
  { name: '면 (Cotton)', type: '천연', total: 720, recycled: 480, rate: 66.7, factor: 1.8, saved: 864 },
  { name: '울 (Wool)', type: '천연', total: 120, recycled: 90, rate: 75.0, factor: 2.5, saved: 225 },
  { name: '캐시미어 (Cashmere)', type: '천연', total: 60, recycled: 38, rate: 63.3, factor: 2.8, saved: 106 },
  { name: '실크 (Silk)', type: '천연', total: 45, recycled: 28, rate: 62.2, factor: 2.4, saved: 67 },
  { name: '린넨 (Linen)', type: '천연', total: 80, recycled: 55, rate: 68.8, factor: 1.6, saved: 88 },
  // 합성
  { name: '폴리에스터 (Polyester)', type: '합성', total: 450, recycled: 320, rate: 71.1, factor: 2.3, saved: 736 },
  { name: '나일론 (Polyamide)', type: '합성', total: 310, recycled: 210, rate: 67.7, factor: 2.1, saved: 441 },
  { name: '아크릴 (Acrylic)', type: '합성', total: 180, recycled: 110, rate: 61.1, factor: 2.0, saved: 220 },
  { name: '스판덱스 (Elastane)', type: '합성', total: 50, recycled: 24, rate: 48.0, factor: 1.7, saved: 41 },
  // 혼방
  { name: '데님 (면/스판)', type: '혼방', total: 200, recycled: 150, rate: 75.0, factor: 1.9, saved: 285 },
  { name: '면/폴리 혼방', type: '혼방', total: 220, recycled: 130, rate: 59.1, factor: 1.9, saved: 247 },
  { name: '울/아크릴 혼방', type: '혼방', total: 90, recycled: 50, rate: 55.6, factor: 2.2, saved: 110 },
]

const TYPE_BADGE_CLS = {
  '천연': 'bg-green-50 text-green-700 border border-green-200',
  '합성': 'bg-blue-50 text-blue-700 border border-blue-200',
  '혼방': 'bg-amber-50 text-amber-700 border border-amber-200',
}

const materialSummary = computed(() => {
  const groups = ['천연', '합성', '혼방']
  return groups.map((g) => {
    const items = materialData.filter((m) => m.type === g)
    const total = items.reduce((s, m) => s + m.total, 0)
    const recycled = items.reduce((s, m) => s + m.recycled, 0)
    const saved = items.reduce((s, m) => s + m.saved, 0)
    const rate = total > 0 ? +((recycled / total) * 100).toFixed(1) : 0
    return { type: g, count: items.length, total, recycled, rate, saved }
  })
})

const materialTotals = computed(() => {
  const total = materialData.reduce((s, m) => s + m.total, 0)
  const recycled = materialData.reduce((s, m) => s + m.recycled, 0)
  const saved = materialData.reduce((s, m) => s + m.saved, 0)
  const rate = total > 0 ? +((recycled / total) * 100).toFixed(1) : 0
  return { total, recycled, saved, rate }
})

const activityLog = [
  { date: '04.28', type: 'donation', label: '재해 구호 - 포항 한파 면 코트 기부', points: 1235, detail: '95kg × 6.5 × 2.0' },
  { date: '04.27', type: 'productionAvoid', label: '면 재판매 (신규 생산 회피)', points: 3120, detail: '480kg × Higg 6.5' },
  { date: '04.26', type: 'method', label: '재활용 처리 (분쇄/재방사)', points: 3150, detail: '700kg × 가중치 1.2' },
  { date: '04.25', type: 'disposalAvoid', label: '면 소각 폐기 회피', points: 1200, detail: '480kg × 2.5' },
  { date: '04.23', type: 'productionAvoid', label: '폴리에스터 재판매 (신규 생산 회피)', points: 2176, detail: '320kg × Higg 6.8' },
  { date: '04.22', type: 'donation', label: '취약 계층 의류 지원 (사회복지시설)', points: 780, detail: '80kg × 6.5 × 1.5' },
  { date: '04.20', type: 'method', label: '업사이클링 처리 (가방/패치워크)', points: 1575, detail: '280kg × 가중치 1.5' },
  { date: '04.18', type: 'disposalAvoid', label: '폴리에스터 매립 폐기 회피', points: 960, detail: '320kg × 3.0' },
  { date: '04.16', type: 'productionAvoid', label: '울 재판매 (신규 생산 회피)', points: 1800, detail: '90kg × Higg 20.0' },
  { date: '04.14', type: 'donation', label: '개도국 의류 지원 (해외 구호 단체)', points: 442, detail: '50kg × 6.8 × 1.3' },
  { date: '04.12', type: 'method', label: '중고 재판매 (아울렛 출고)', points: 945, detail: '420kg × 가중치 1.0' },
  { date: '04.10', type: 'disposalAvoid', label: '나일론 소각 폐기 회피', points: 672, detail: '210kg × 3.2' },
]


const typeCfg = {
  productionAvoid: { label: '생산회피', cls: 'bg-emerald-50 text-emerald-700' },
  disposalAvoid: { label: '폐기회피', cls: 'bg-teal-50 text-teal-700' },
  method: { label: '처리방식', cls: 'bg-blue-50 text-blue-700' },
  donation: { label: '기부', cls: 'bg-pink-50 text-pink-700' },
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="esgSideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">

      <!-- 헤더 -->
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Leaf :size="18" class="text-emerald-600" />
            ESG 친환경 발자국 현황판
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
          <span class="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
            탄소 절감 실시간 집계
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-gray-500">누적 ESG 점수</span>
          <span class="border border-emerald-300 bg-emerald-50 px-3 py-1 text-[14px] font-black text-emerald-700">
            {{ totalPoints.toLocaleString() }} pt
          </span>
        </div>
      </section>

      <!-- KPI 카드 4개 -->
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
            <p class="mt-1 text-[10px] text-gray-400">{{ m.sub }}</p>
          </div>
        </article>
      </section>

      <!-- 배출 한도 vs 실적 + 배출권 시장 가치 환산 -->
      <section class="grid gap-3 xl:grid-cols-2">

        <!-- 배출 한도 vs 실적 (K-ETS) -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Scale :size="15" class="text-blue-600" />
              배출 한도 vs 실적
              <span class="text-[10px] font-normal text-gray-400">K-ETS 컴플라이언스</span>
            </h3>
            <span class="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <CheckCircle2 :size="11" />
              준수
            </span>
          </div>

          <div class="flex flex-1 flex-col gap-3 px-3 pt-3 pb-0">
            <!-- 배출 한도 vs 사용한 탄소배출권 도넛 -->
            <div>
              <div class="mb-1.5 flex items-baseline justify-between">
                <span class="text-[11px] font-medium text-gray-500">연간 할당량 사용률</span>
                <span class="inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  사용 {{ emissionCompliance.ytdNet.toLocaleString() }} / 한도 {{ emissionCompliance.allocation.toLocaleString() }} tCO₂
                </span>
              </div>
              <div class="relative">
                <DoughnutChart :data="emissionDoughnutData" :options="emissionDoughnutOptions" :height="220" />
                <div class="pointer-events-none absolute inset-x-0 top-[28%] flex flex-col items-center">
                  <span class="text-[10px] font-medium text-gray-500">사용률</span>
                  <span class="text-[26px] font-black text-blue-700 leading-none">{{ emissionCompliance.utilizationPct }}%</span>
                  <span class="mt-1 text-[10px] text-gray-400">{{ emissionCompliance.ytdNet.toLocaleString() }} / {{ emissionCompliance.allocation.toLocaleString() }} tCO₂</span>
                </div>
              </div>
            </div>

            <!-- 3개 메트릭 -->
            <div class="grid grid-cols-3 gap-2">
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">정부 할당량</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <span class="text-[14px] font-bold text-gray-800">{{ emissionCompliance.allocation.toLocaleString() }}</span>
                  <span class="text-[9px] text-gray-400">tCO₂</span>
                </div>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">YTD 실효 배출</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <span class="text-[14px] font-bold text-blue-700">{{ emissionCompliance.ytdNet.toLocaleString() }}</span>
                  <span class="text-[9px] text-gray-400">tCO₂</span>
                </div>
              </div>
              <div class="border border-emerald-200 bg-emerald-50 px-2 py-2">
                <p class="text-[10px] text-emerald-700">예상 잉여</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <span class="text-[14px] font-bold text-emerald-700">+{{ emissionCompliance.expectedSurplus.toLocaleString() }}</span>
                  <span class="text-[9px] text-emerald-600">tCO₂</span>
                </div>
              </div>
            </div>

            <!-- 분기별 진행 (BarChart, 카드 최하단) -->
            <div class="mt-auto">
              <div class="mb-1.5 flex items-center justify-between">
                <p class="text-[10px] font-medium text-gray-500">분기별 배출 진행 (YTD 실적)</p>
                <span class="inline-flex items-center gap-1 text-[9px] text-gray-500">
                  <span class="inline-block h-2 w-2 rounded-sm bg-blue-500"></span>
                  실적
                </span>
              </div>
              <BarChart :data="quarterlyChartData" :options="quarterlyChartOptions" :height="140" />
            </div>

          </div>
        </article>

        <!-- 배출권 시장 가치 환산 -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Coins :size="15" class="text-amber-600" />
              배출권 시장 가치 환산
            </h3>
            <div class="flex items-center gap-1.5">
              <span class="text-[9px] text-gray-400">{{ kauUpdatedLabel }}</span>
              <span class="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                KAU24 ₩{{ kauPrice.toLocaleString() }}/tCO₂
              </span>
              <button
                type="button"
                class="flex h-5 w-5 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
                :disabled="kauPriceLoading"
                title="시세 새로고침"
                @click="esgStore.fetchKauPrice()"
              >
                <RefreshCw :size="11" :class="kauPriceLoading ? 'animate-spin' : ''" />
              </button>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-3 px-3 pt-3 pb-0">
            <!-- 메인 환산 가치 -->
            <div class="border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 px-3 py-3">
              <p class="text-[10px] font-medium text-amber-700">절감 활동 시장 환산 가치 (YTD)</p>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-[22px] font-black text-amber-700">₩{{ reducedKrw.toLocaleString() }}</span>
              </div>
              <p class="mt-1 text-[10px] text-amber-700/70">
                {{ marketVolume.reducedTons }} tCO₂ × ₩{{ kauPrice.toLocaleString() }} = 절감 인정 가치
              </p>
            </div>

            <!-- 3개 메트릭 -->
            <div class="grid grid-cols-3 gap-2">
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">YTD 절감권</p>
                <div class="mt-0.5">
                  <span class="text-[12px] font-bold text-amber-700">₩{{ Math.round(reducedKrw / 10000).toLocaleString() }}만</span>
                </div>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">예상 잉여권</p>
                <div class="mt-0.5">
                  <span class="text-[12px] font-bold text-emerald-700">₩{{ Math.round(surplusKrw / 10000).toLocaleString() }}만</span>
                </div>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">연간 추정</p>
                <div class="mt-0.5">
                  <span class="text-[12px] font-bold text-violet-700">₩{{ Math.round(yearlyKrw / 10000).toLocaleString() }}만</span>
                </div>
              </div>
            </div>

            <!-- YoY 강조 (월별 추이 위) -->
            <div class="mt-auto flex items-center justify-between border border-violet-200 bg-violet-50/50 px-2.5 py-2">
              <div class="flex items-center gap-2">
                <TrendingUp :size="13" class="text-violet-600" />
                <span class="text-[11px] font-medium text-violet-800">전년 동기 대비 환산 가치</span>
              </div>
              <span class="text-[12px] font-bold text-violet-700">+{{ marketVolume.yoyPct }}%</span>
            </div>

            <!-- 월별 추이 (12개월 BarChart, 카드 최하단) -->
            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <p class="text-[10px] font-medium text-gray-500">월별 환산 가치 추이 (YTD 실적)</p>
                <span class="inline-flex items-center gap-1 text-[9px] text-gray-500">
                  <span class="inline-block h-2 w-2 rounded-sm bg-amber-500"></span>
                  실적
                </span>
              </div>
              <BarChart :data="monthlyChartData" :options="monthlyChartOptions" :height="220" />
            </div>
          </div>
        </article>
      </section>

      <!-- 탄소 감축 점수 상세 -->
      <section class="grid gap-3">

        <!-- 탄소 감축 점수 상세 -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">탄소 감축 점수 상세내역</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">각 항목을 클릭하면 세부 내역과 산출 공식을 확인할 수 있습니다</p>
          </div>

          <div class="divide-y divide-gray-100">
            <div v-for="cat in scoreCategories" :key="cat.id">
              <button
                type="button"
                class="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-gray-50"
                @click="toggleExpand(cat.id)"
              >
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <component :is="cat.icon" :size="15" :class="cat.iconCls" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-[13px] font-semibold text-gray-800">{{ cat.label }}</span>
                    <span
                      v-if="cat.badge"
                      class="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      :class="cat.badgeCls"
                    >
                      {{ cat.badge }}
                    </span>
                  </div>
                  <p class="mt-0.5 text-[11px] text-gray-400">{{ cat.desc }}</p>
                  <div class="mt-1.5 flex items-center gap-2">
                    <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div class="h-1.5 rounded-full" :class="cat.barCls" :style="{ width: cat.pct + '%' }" />
                    </div>
                    <span class="shrink-0 text-[10px] text-gray-400">{{ cat.pct }}%</span>
                  </div>
                </div>
                <div class="shrink-0 text-right">
                  <span class="text-[16px] font-bold text-gray-900">{{ cat.points.toLocaleString() }}</span>
                  <span class="ml-0.5 text-[10px] text-gray-400">pt</span>
                </div>
                <ChevronDown
                  :size="14"
                  class="shrink-0 text-gray-400 transition-transform duration-200"
                  :class="expandedId === cat.id ? 'rotate-180' : ''"
                />
              </button>

              <!-- 펼침 상세 -->
              <div v-if="expandedId === cat.id" class="border-t border-gray-100 bg-gray-50 px-3 py-3">
                <p class="mb-2.5 text-[10px] text-gray-500">
                  산출 공식:
                  <span class="font-medium text-gray-700">{{ cat.formula }}</span>
                </p>
                <table class="w-full">
                  <thead>
                    <tr class="text-[10px] uppercase text-gray-400">
                      <th class="pb-1.5 text-left font-medium">항목</th>
                      <th class="pb-1.5 text-center font-medium">상세</th>
                      <th class="pb-1.5 text-center font-medium">대상</th>
                      <th class="pb-1.5 text-right font-medium">점수</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="row in cat.rows" :key="row.label" class="text-[12px]">
                      <td class="py-1.5 font-medium text-gray-700">{{ row.label }}</td>
                      <td class="py-1.5 text-center text-gray-400">{{ row.detail }}</td>
                      <td class="py-1.5 text-center text-gray-500">{{ row.target || '-' }}</td>
                      <td class="py-1.5 text-right font-bold text-emerald-700">+{{ row.points.toLocaleString() }}</td>
                    </tr>
                    <tr class="border-t border-gray-200 text-[12px]">
                      <td colspan="3" class="py-1.5 text-right font-semibold text-gray-600">소계</td>
                      <td class="py-1.5 text-right text-[13px] font-bold text-gray-900">
                        {{ cat.points.toLocaleString() }} pt
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 총점 -->
          <div class="border-t border-gray-300 bg-gray-50 px-3 py-2.5">
            <div class="flex items-center justify-between">
              <span class="text-[12px] font-semibold text-gray-600">총 ESG 점수</span>
              <div class="flex items-baseline gap-1">
                <span class="text-[22px] font-black text-emerald-700">{{ totalPoints.toLocaleString() }}</span>
                <span class="text-[11px] text-gray-400">pt</span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- 소재별 재활용 전환율 + 활동 내역 -->
      <section class="grid gap-3 xl:grid-cols-2">

        <!-- 소재별 재활용 전환율 -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Recycle :size="15" class="text-green-600" />
              소재별 재활용 전환율
            </h3>
          </div>

          <!-- 소재 분류 체계 요약 (3계층: 천연/합성/혼방) -->
          <div class="grid grid-cols-3 gap-2 border-b border-gray-100 bg-gray-50/50 px-3 py-2.5">
            <div
              v-for="g in materialSummary"
              :key="g.type"
              class="rounded border bg-white px-2 py-1.5"
              :class="{
                'border-green-200': g.type === '천연',
                'border-blue-200': g.type === '합성',
                'border-amber-200': g.type === '혼방',
              }"
            >
              <div class="flex items-center justify-between">
                <span
                  class="rounded px-1.5 py-0.5 text-[9px] font-bold"
                  :class="TYPE_BADGE_CLS[g.type]"
                >
                  {{ g.type }} 소재
                </span>
                <span class="text-[9px] text-gray-400">{{ g.count }}종</span>
              </div>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-[14px] font-bold text-gray-800">{{ g.rate }}%</span>
                <span class="text-[9px] text-gray-400">전환율</span>
              </div>
              <div class="text-[9px] text-gray-500">
                {{ g.recycled }}/{{ g.total }}kg · +{{ g.saved }}pt
              </div>
            </div>
          </div>

          <div class="overflow-auto">
            <table class="w-full min-w-[520px] text-[12px]">
              <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-2 py-2 text-left font-semibold">분류</th>
                  <th class="px-2 py-2 text-left font-semibold">소재</th>
                  <th class="px-2 py-2 text-right font-semibold">보유 (kg)</th>
                  <th class="px-2 py-2 text-right font-semibold">재활용 (kg)</th>
                  <th class="px-2 py-2 text-right font-semibold">전환율</th>
                  <th class="px-2 py-2 text-right font-semibold">CO₂ (pt)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 border-t border-gray-200">
                <tr v-for="m in materialData" :key="m.name" class="hover:bg-gray-50/60">
                  <td class="px-2 py-2">
                    <span
                      class="rounded px-1.5 py-0.5 text-[9px] font-bold"
                      :class="TYPE_BADGE_CLS[m.type]"
                    >
                      {{ m.type }}
                    </span>
                  </td>
                  <td class="px-2 py-2 font-medium text-gray-800">{{ m.name }}</td>
                  <td class="px-2 py-2 text-right text-gray-500">{{ m.total }}</td>
                  <td class="px-2 py-2 text-right font-medium text-green-700">{{ m.recycled }}</td>
                  <td class="px-2 py-2 text-right">
                    <span class="text-[11px] font-semibold text-green-700">{{ m.rate }}%</span>
                  </td>
                  <td class="px-2 py-2 text-right font-bold text-emerald-700">+{{ m.saved }}</td>
                </tr>
              </tbody>
              <tfoot class="border-t-2 border-gray-200 bg-gray-50">
                <tr class="text-[11px]">
                  <td class="px-2 py-2 font-semibold text-gray-600" colspan="2">합계</td>
                  <td class="px-2 py-2 text-right font-semibold text-gray-600">{{ materialTotals.total.toLocaleString() }}</td>
                  <td class="px-2 py-2 text-right font-semibold text-green-700">{{ materialTotals.recycled.toLocaleString() }}</td>
                  <td class="px-2 py-2 text-right">
                    <span class="font-bold text-green-700">{{ materialTotals.rate }}%</span>
                  </td>
                  <td class="px-2 py-2 text-right font-bold text-emerald-700">+{{ materialTotals.saved.toLocaleString() }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </article>

        <!-- 탄소 감축 활동 내역 -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">탄소 감축 활동 내역</h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="(log, i) in activityLog"
              :key="i"
              class="flex items-center gap-3 px-3 py-2.5"
            >
              <span class="w-10 shrink-0 text-[10px] text-gray-400">{{ log.date }}</span>
              <span
                class="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                :class="typeCfg[log.type].cls"
              >
                {{ typeCfg[log.type].label }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-[12px] font-medium text-gray-700">{{ log.label }}</p>
                <p class="text-[10px] text-gray-400">{{ log.detail }}</p>
              </div>
              <span class="shrink-0 text-[13px] font-bold text-emerald-600">
                +{{ log.points.toLocaleString() }}
              </span>
            </div>
          </div>
        </article>
      </section>

    </div>
  </AppLayout>
</template>
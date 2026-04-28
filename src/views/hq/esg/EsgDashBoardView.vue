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
  ArrowLeftRight,
  Navigation,
  Award,
  ChevronDown,
  Scale,
  Coins,
  CheckCircle2,
  RefreshCw,
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
    id: 'circular',
    label: '순환재고 전환',
    points: 6300,
    pct: 46.7,
    icon: Recycle,
    badge: '최고 점수',
    barCls: 'bg-emerald-500',
    badgeCls: 'bg-emerald-100 text-emerald-700',
    iconCls: 'text-emerald-600',
    desc: '소각·덤핑·보관 대신 리사이클링 처리',
    formula: '순환재고 KG × 소재별 탄소환산계수',
    rows: [
      { label: '면 (Cotton)', detail: '480 kg × 1.8', points: 864 },
      { label: '폴리에스터', detail: '320 kg × 2.3', points: 736 },
      { label: '나일론', detail: '210 kg × 2.1', points: 441 },
      { label: '데님', detail: '150 kg × 1.9', points: 285 },
      { label: '울 (Wool)', detail: '90 kg × 2.5', points: 225 },
    ],
  },
  {
    id: 'transfer',
    label: '창고 간 재고 이동',
    points: 4400,
    pct: 32.6,
    icon: ArrowLeftRight,
    badge: null,
    barCls: 'bg-blue-500',
    badgeCls: '',
    iconCls: 'text-blue-600',
    desc: '신규 발주 대신 재고 이동으로 탄소 절감',
    formula: '차단 발주 수량 × 10kg/벌 − 이동거리 × 0.1kg/km',
    rows: [
      { label: '인천→수원', detail: '180벌 차단 | 50km 이동', points: 1791 },
      { label: '부산→대구', detail: '95벌 차단 | 60km 이동', points: 944 },
      { label: '광주→전주', detail: '140벌 차단 | 40km 이동', points: 1396 },
    ],
  },
  {
    id: 'route',
    label: '이동 경로 최적화',
    points: 1500,
    pct: 11.1,
    icon: Navigation,
    badge: null,
    barCls: 'bg-violet-500',
    badgeCls: '',
    iconCls: 'text-violet-600',
    desc: '최적 경로 선택 시에만 추가 점수 부여',
    formula: '표준 경로 대비 추가 절감 CO₂량 (kg) = 점수',
    rows: [
      { label: '인천→수원 최적화', detail: 'CO₂ 42kg 추가 절감', points: 420 },
      { label: '부산→대구 최적화', detail: 'CO₂ 38kg 추가 절감', points: 380 },
      { label: '광주→전주 최적화', detail: 'CO₂ 48kg 추가 절감', points: 480 },
    ],
  },
  {
    id: 'illegal',
    label: '불법 폐기 방지',
    points: 1300,
    pct: 9.6,
    icon: ShieldCheck,
    badge: null,
    barCls: 'bg-orange-500',
    badgeCls: '',
    iconCls: 'text-orange-600',
    desc: '제3국 투기 예정 재고를 국내 수요처에 투명 연결',
    formula: '회수 재고 × 탄소계수 + 투명 연결 보너스 점수',
    rows: [
      { label: '잡화류 → 건축재 공장 (안산)', detail: '85kg 투명 연결', points: 420 },
      { label: '구형 아우터 → 재활용 업체 (인천)', detail: '62kg 처리 완료', points: 350 },
      { label: '불량 섬유류 → 산업 흡음재', detail: '48kg 처리 완료', points: 350 },
    ],
  },
]

const expandedId = ref(null)
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

const materialData = [
  { name: '면 (Cotton)', total: 720, recycled: 480, rate: 66.7, factor: 1.8, saved: 864 },
  { name: '폴리에스터', total: 450, recycled: 320, rate: 71.1, factor: 2.3, saved: 736 },
  { name: '나일론', total: 310, recycled: 210, rate: 67.7, factor: 2.1, saved: 441 },
  { name: '데님', total: 200, recycled: 150, rate: 75.0, factor: 1.9, saved: 285 },
  { name: '울 (Wool)', total: 120, recycled: 90, rate: 75.0, factor: 2.5, saved: 225 },
]

const activityLog = [
  { date: '04.23', type: 'circular', label: '폴리에스터 순환재고 전환', points: 460, detail: '200kg 처리' },
  { date: '04.22', type: 'transfer', label: '인천→수원 재고 이동', points: 895, detail: '90벌 이동' },
  { date: '04.21', type: 'route', label: '부산→대구 최적 경로', points: 380, detail: 'CO₂ 38kg 절감' },
  { date: '04.20', type: 'circular', label: '면 소재 순환재고 전환', points: 540, detail: '300kg 처리' },
  { date: '04.19', type: 'illegal', label: '건축재 공장 투명 연결', points: 420, detail: '아우터 85kg' },
  { date: '04.18', type: 'transfer', label: '광주→전주 재고 이동', points: 1396, detail: '140벌 이동' },
]

const typeCfg = {
  circular: { label: '순환전환', cls: 'bg-emerald-50 text-emerald-700' },
  transfer: { label: '재고이동', cls: 'bg-blue-50 text-blue-700' },
  route: { label: '경로최적', cls: 'bg-violet-50 text-violet-700' },
  illegal: { label: '폐기방지', cls: 'bg-orange-50 text-orange-700' },
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
                      <th class="pb-1.5 text-right font-medium">점수</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="row in cat.rows" :key="row.label" class="text-[12px]">
                      <td class="py-1.5 font-medium text-gray-700">{{ row.label }}</td>
                      <td class="py-1.5 text-center text-gray-400">{{ row.detail }}</td>
                      <td class="py-1.5 text-right font-bold text-emerald-700">+{{ row.points.toLocaleString() }}</td>
                    </tr>
                    <tr class="border-t border-gray-200 text-[12px]">
                      <td colspan="2" class="py-1.5 text-right font-semibold text-gray-600">소계</td>
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
          <div class="overflow-auto">
            <table class="w-full min-w-[480px] text-[12px]">
              <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">소재</th>
                  <th class="px-3 py-2 text-right font-semibold">전체 (kg)</th>
                  <th class="px-3 py-2 text-right font-semibold">재활용 (kg)</th>
                  <th class="px-3 py-2 font-semibold">전환율</th>
                  <th class="px-3 py-2 text-right font-semibold">CO₂ 절감 (pt)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 border-t border-gray-200">
                <tr v-for="m in materialData" :key="m.name" class="hover:bg-gray-50/60">
                  <td class="px-3 py-2.5 font-medium text-gray-800">{{ m.name }}</td>
                  <td class="px-3 py-2.5 text-right text-gray-500">{{ m.total }}</td>
                  <td class="px-3 py-2.5 text-right font-medium text-green-700">{{ m.recycled }}</td>
                  <td class="px-3 py-2.5">
                    <div class="flex items-center gap-2">
                      <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div class="h-1.5 rounded-full bg-green-500" :style="{ width: m.rate + '%' }" />
                      </div>
                      <span class="text-[11px] font-semibold text-green-700">{{ m.rate }}%</span>
                    </div>
                  </td>
                  <td class="px-3 py-2.5 text-right font-bold text-emerald-700">+{{ m.saved }}</td>
                </tr>
              </tbody>
              <tfoot class="border-t-2 border-gray-200 bg-gray-50">
                <tr class="text-[11px]">
                  <td class="px-3 py-2 font-semibold text-gray-600">합계</td>
                  <td class="px-3 py-2 text-right font-semibold text-gray-600">1,800</td>
                  <td class="px-3 py-2 text-right font-semibold text-green-700">1,250</td>
                  <td class="px-3 py-2">
                    <span class="font-bold text-green-700">68.4%</span>
                  </td>
                  <td class="px-3 py-2 text-right font-bold text-emerald-700">+2,551</td>
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
<script setup>
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Leaf,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Scale,
  Coins,
  CheckCircle2,
  RefreshCw,
  Wallet,
  X,
  Save,
  Edit3,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEsgStore } from '@/stores/esg.js'
import { useEmissionQuotaStore } from '@/stores/emissionQuota.js'
import { carbonPriceApi, circularRevenueApi } from '@/api/hq/esg.js'
import { extractErrorMessage } from '@/api/axios.js'
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => 'ESG 대시보드')
const activeSideMenu = ref('탄소배출권 관리')
const esgSideMenus = (hqMenus.find((menu) => menu.label === 'ESG 대시보드')?.children ?? [])

const esgStore = useEsgStore()
const {
  totalPoints,
  totalSalesKg,
  totalCarbonReductionTon,
  carbonReductionDeltaPct,
  kauPrice,
  kauPriceUpdatedAt,
  kauPriceLoading,
} = storeToRefs(esgStore)

// ─────────── 배출권(KAU25) 실시간 시세 — BE 연동 ───────────
const carbonLatest = ref(null)        // { pricePerTon, symbol, basDt, fltRt, fallback }
const carbonTrend = ref([])           // 최근 7거래일 시세 배열
const carbonLoading = ref(false)
const carbonError = ref('')

async function loadCarbonPrice() {
  carbonLoading.value = true
  carbonError.value = ''
  try {
    const [latestRes, trendRes] = await Promise.all([
      carbonPriceApi.getLatest(),
      carbonPriceApi.getTrend('SEVEN_DAYS'),
    ])
    carbonLatest.value = latestRes
    carbonTrend.value = trendRes ?? []
    // esgStore.kauPrice 와 동기화 — circularStock 빌더 / 다른 화면이 동일 가격 참조
    if (latestRes?.pricePerTon != null) {
      esgStore.setKauPrice(latestRes.pricePerTon)
    }
  } catch (err) {
    carbonError.value = extractErrorMessage(err, '배출권 시세를 불러오지 못했습니다.')
  } finally {
    carbonLoading.value = false
  }
}

// 등락 표시
const carbonFltRtNum = computed(() => parseFloat(carbonLatest.value?.fltRt ?? '0') || 0)
const carbonIsUp = computed(() => carbonFltRtNum.value > 0)
const carbonIsDown = computed(() => carbonFltRtNum.value < 0)

const carbonHigh7d = computed(() => {
  if (!carbonTrend.value.length) return 0
  return Math.max(...carbonTrend.value.map(d => d.pricePerTon))
})
const carbonLow7d = computed(() => {
  if (!carbonTrend.value.length) return 0
  return Math.min(...carbonTrend.value.map(d => d.pricePerTon))
})

// 7일 라인 차트 데이터
const carbonChartData = computed(() => ({
  labels: carbonTrend.value.map(d => {
    const s = d.basDt ?? ''
    return s.length === 8 ? `${s.slice(4,6)}/${s.slice(6,8)}` : s
  }),
  datasets: [{
    label: 'KAU25 종가',
    data: carbonTrend.value.map(d => d.pricePerTon),
    borderColor: '#d97706',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    pointBackgroundColor: '#d97706',
    pointRadius: 3,
    pointHoverRadius: 5,
    tension: 0.25,
    fill: true,
  }],
}))

const carbonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#92400e',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 8,
      callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString('ko-KR')}원/톤` },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (v) => v.toLocaleString('ko-KR'),
        font: { size: 9 },
      },
      grid: { color: 'rgba(0,0,0,0.04)' },
    },
    x: {
      grid: { display: false },
      ticks: { font: { size: 9 } },
    },
  },
}

const formatPct = (s) => {
  if (s === null || s === undefined || s === '') return '0%'
  const n = parseFloat(s)
  if (Number.isNaN(n)) return s
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}
const formatBasDtShort = (yyyymmdd) => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return ''
  return `${yyyymmdd.slice(4,6)}.${yyyymmdd.slice(6,8)}`
}

onMounted(loadCarbonPrice)

// 헤더 누적 ESG 점수 — BE sale events + mock donation 으로 자동 계산
onMounted(() => {
  esgStore.fetchTotalPoints().catch(err => {
    console.error('[EsgDashBoardView] fetchTotalPoints failed:', err)
  })
})

// 배출 한도 vs 실적 데이터 — emissionQuota 스토어와 연동
// 대시보드 진입 시 BE 에서 저장된 할당량/월별 실적을 불러와 새로고침/재로그인 후에도 동일하게 유지
const quotaStore = useEmissionQuotaStore()
onMounted(async () => {
  try {
    await quotaStore.fetchQuota()
  } catch (err) {
    console.error('[EsgDashBoardView] quota fetch failed:', err)
  }
})
const {
  fiscalYear,
  yearlyAllocation,
  warnThresholdPct,
  monthlyEmissions,
} = storeToRefs(quotaStore)

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

// 정부 할당량 입력 모달
const showQuotaModal = ref(false)
const quotaDraft = reactive({
  yearlyAllocation: 0,
  warnThresholdPct: 75,
  monthly: ['', '', '', '', '', '', '', '', '', '', '', ''],
})

function openQuotaModal() {
  quotaDraft.yearlyAllocation = yearlyAllocation.value
  quotaDraft.warnThresholdPct = warnThresholdPct.value
  quotaDraft.monthly = (monthlyEmissions.value ?? []).map(v => v == null ? '' : String(v))
  while (quotaDraft.monthly.length < 12) quotaDraft.monthly.push('')
  showQuotaModal.value = true
}
function closeQuotaModal() {
  showQuotaModal.value = false
}
function quarterSum(q) {
  const start = (q - 1) * 3
  let sum = 0
  for (let i = 0; i < 3; i++) {
    const v = Number(quotaDraft.monthly[start + i])
    if (!isNaN(v)) sum += v
  }
  return sum
}
async function saveQuotaModal() {
  try {
    const monthly = quotaDraft.monthly.map(v =>
      v === '' || v === null || isNaN(Number(v)) ? null : Number(v),
    )
    await quotaStore.saveQuota({
      allocation: Number(quotaDraft.yearlyAllocation) || 0,
      warnPct:    Number(warnThresholdPct.value) || 75,
      monthly,
    })
    showQuotaModal.value = false
  } catch (err) {
    alert('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
  }
}

const emissionCompliance = computed(() => ({
  allocation:     quotaStore.yearlyAllocation,
  ytdNet:         Number(quotaStore.ytdEmissions.toFixed(2)),
  ytdAvoided:     Number(quotaStore.ytdAvoided.toFixed(2)),
  netEmissions:   Number(quotaStore.netEmissions.toFixed(2)),
  costSavingsWon: Math.round(quotaStore.costSavingsWon),
  utilizationPct: Number(quotaStore.utilizationPct.toFixed(1)),
  expectedSurplus: Number(quotaStore.remaining.toFixed(2)),
  warnPct:        quotaStore.warnThresholdPct,
  quarterly: quotaStore.quarterly.map(q => ({
    q: q.q,
    period: q.period,
    actual: Number(q.emissions.toFixed(2)),
    status: q.status,
  })),
}))

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
  () => emissionCompliance.value.allocation - emissionCompliance.value.ytdNet,
)

const emissionDoughnutData = computed(() => ({
  labels: ['사용한 탄소배출권', '잔여 한도'],
  datasets: [
    {
      data: [emissionCompliance.value.ytdNet, emissionRemaining.value],
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
          const total = emissionCompliance.value.allocation
          const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0'
          return `${ctx.parsed.toLocaleString()} tCO₂ (${pct}%)`
        },
      },
    },
  },
}

// 분기별 배출 진행 BarChart (Q1~Q2 실적만, Q3~Q4 라벨만)
const quarterlyChartData = computed(() => ({
  labels: emissionCompliance.value.quarterly.map((q) => q.period),
  datasets: [
    {
      label: '분기별 실적',
      data: emissionCompliance.value.quarterly.map((q) => (q.actual > 0 ? q.actual : null)),
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
          const q = emissionCompliance.value.quarterly[items[0].dataIndex]
          return `${q.q} · ${q.period}`
        },
        label: (ctx) => {
          const q = emissionCompliance.value.quarterly[ctx.dataIndex]
          return `실적 ${q.actual.toLocaleString()} tCO₂`
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

// 별도 esgStore.fetchKauPrice() 호출은 제거 — loadCarbonPrice 가 BE 호출 후
// esgStore.setKauPrice 로 동기화하므로 중복 API 호출을 피함

// KPI 2카드 — BE 데이터 기반 (esgStore.fetchTotalPoints 에서 계산)
//   탄소 배출 절감 = SUM(weight × material_factor) / 1000 [tCO₂]
//   순환재고 판매량 = SUM(weight) [kg]
//   전월 대비 변동률 = (이번달 - 전월) / 전월 × 100
const carbonDeltaLabel = computed(() => {
  const pct = carbonReductionDeltaPct.value
  if (pct === 0) return '전월 대비 변동 없음'
  const sign = pct > 0 ? '+' : ''
  return `전월 대비 ${sign}${pct}%`
})
const kpiMetrics = computed(() => [
  { label: '탄소 배출 절감',   value: (totalCarbonReductionTon.value ?? 0).toFixed(2),    unit: 'tCO₂', sub: carbonDeltaLabel.value, icon: TrendingDown, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '순환재고 판매량', value: (totalSalesKg.value ?? 0).toLocaleString('ko-KR'), unit: 'kg',   sub: '불법폐기 0건',         icon: ShieldCheck,  valueCls: 'text-teal-700',     iconBg: 'bg-teal-50',     iconCls: 'text-teal-600' },
])

// ─────────── 거래 가능 탄소 배출권 (자산 포트폴리오 스타일) ───────────
//   잔여 한도 × KAU25 시세 = 보유 자산 가치
//   향후 KOC offset 도입 시 carbonAssetBreakdown 에 항목 추가
const carbonAssetValue = computed(() =>
  Math.round(emissionCompliance.value.expectedSurplus * (kauPrice.value || 0)),
)

// 변동률 (7거래일 첫째 날 대비) — carbonTrend 의 첫째 날 종가를 baseline 으로 동적 산정
const carbonAssetTrend = computed(() => {
  const surplus = emissionCompliance.value.expectedSurplus
  const trend = carbonTrend.value ?? []
  if (trend.length === 0) {
    return { up: false, down: false, label: '시세 미조회', detail: '기준값 없음' }
  }
  const firstPrice = Number(trend[0]?.pricePerTon) || 0
  const baseline = Math.round(surplus * firstPrice)
  const current = carbonAssetValue.value
  if (baseline === 0) return { up: false, down: false, label: '0%', detail: '기준값 없음' }
  const diff = current - baseline
  const pct = (diff / baseline) * 100
  const formattedPct = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
  const formattedDiff = (diff >= 0 ? '+' : '−') + '₩' + Math.abs(diff).toLocaleString('ko-KR')
  return {
    up: diff > 0, down: diff < 0,
    label: `${formattedPct} (vs 7거래일 첫날)`,
    detail: `${formattedDiff} · 잔여 ${surplus.toLocaleString()} tCO₂ × ₩${(kauPrice.value || 0).toLocaleString()}`,
  }
})

// 일별 자산 가치 추이 — 잔여 한도(현재) × 일별 KAU25 종가 (carbonTrend, BE 연동)
const carbonAssetMonthlyData = computed(() => {
  const trend = carbonTrend.value ?? []
  const surplus = emissionCompliance.value.expectedSurplus
  return {
    labels: trend.map(d => {
      const s = d?.basDt ?? ''
      return s.length === 8 ? `${s.slice(4,6)}/${s.slice(6,8)}` : s
    }),
    datasets: [{
      label: '자산 가치',
      data: trend.map(d => Math.round(surplus * (Number(d?.pricePerTon) || 0))),
      borderColor: '#d97706',
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      pointBackgroundColor: '#d97706',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      pointRadius: 3.5,
      pointHoverRadius: 5,
      borderWidth: 2,
      tension: 0.3,
      fill: true,
    }],
  }
})
const carbonAssetMonthlyOptions = {
  responsive: true, maintainAspectRatio: false,
  layout: { padding: { left: 0, right: 4, top: 4, bottom: 4 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#92400e', titleColor: '#fff', bodyColor: '#fff', padding: 8,
      callbacks: { label: (ctx) => `₩${ctx.parsed.y.toLocaleString('ko-KR')}` },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        font: { size: 9 }, maxTicksLimit: 5,
        callback: (v) => '₩' + Math.round(v / 1000000) + 'M',
      },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 8.5 },
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0,
        padding: 4,
      },
    },
  },
}

// ─────────── 순환 재고 판매 수익 — BE 연동 ───────────
//   GET /api/hq/esg/circular-revenue?year=YYYY
//   응답: { year, monthly:[{month,revenue,count}], totalRevenue, totalCount, monthsWithData, avgMonthly }
const revenuePeriod = ref('YEAR')   // M | Q | YEAR (토글 — totalRevenue 계산 범위만 영향)
const revenueData = ref(null)        // BE 응답 원본
const revenueLoading = ref(false)
const revenueError = ref('')

async function loadRevenue() {
  revenueLoading.value = true
  revenueError.value = ''
  try {
    const year = new Date().getFullYear()
    revenueData.value = await circularRevenueApi.get(year)
  } catch (err) {
    revenueError.value = extractErrorMessage(err, '순환재고 판매 수익을 불러오지 못했습니다.')
  } finally {
    revenueLoading.value = false
  }
}
onMounted(loadRevenue)

// 12개월 수익 배열 — BE 응답 기반 (없으면 0으로 패딩)
const revenueMonthly = computed(() => {
  const monthly = revenueData.value?.monthly ?? []
  const arr = Array(12).fill(0)
  for (const p of monthly) {
    const m = Number(p?.month) || 0
    if (m >= 1 && m <= 12) arr[m - 1] = Number(p?.revenue) || 0
  }
  return arr
})

// 토글 (월/분기/연) 에 따른 합계 — BE 의 12개월 데이터를 FE 에서 슬라이싱
const totalRevenue = computed(() => {
  const arr = revenueMonthly.value
  const now = new Date()
  const m = now.getMonth()
  if (revenuePeriod.value === 'M') return arr[m] ?? 0
  if (revenuePeriod.value === 'Q') {
    const start = Math.max(0, m - 2)
    return arr.slice(start, m + 1).reduce((s, v) => s + v, 0)
  }
  return revenueData.value?.totalRevenue ?? arr.reduce((s, v) => s + v, 0)
})

const revenueStats = computed(() => ({
  avgMonthly: Number(revenueData.value?.avgMonthly) || 0,
  count: Number(revenueData.value?.totalCount) || 0,
}))

const revenueChartData = computed(() => ({
  labels: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  datasets: [{
    label: '월별 수익',
    data: revenueMonthly.value,
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
    borderColor: '#059669',
    borderWidth: 1.5, borderRadius: 3,
    maxBarThickness: 18, categoryPercentage: 0.7, barPercentage: 0.8,
  }],
}))
const revenueChartOptions = {
  responsive: true, maintainAspectRatio: false,
  layout: { padding: { left: 4, right: 8, top: 4, bottom: 12 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#065f46', titleColor: '#fff', bodyColor: '#fff', padding: 8,
      callbacks: { label: (ctx) => `₩${ctx.parsed.y.toLocaleString('ko-KR')}` },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        font: { size: 9 }, maxTicksLimit: 5,
        callback: (v) => v >= 10000 ? '₩' + Math.round(v / 10000) + '만' : '₩' + v,
      },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: {
      grid: { display: false },
      ticks: {
        font: { size: 8.5 },
        autoSkip: false,
        maxRotation: 0,
        minRotation: 0,
        padding: 6,
      },
    },
  },
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)


</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="esgSideMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-3">

      <!-- 헤더 -->
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Leaf :size="18" class="text-emerald-600" />
            탄소배출권 관리
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

      <!-- KPI 카드 (2개) -->
      <section class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article
          v-for="m in kpiMetrics"
          :key="m.label"
          class="flex h-[90px] flex-col justify-between border border-gray-300 bg-white px-4 py-3 shadow-sm"
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

      <!-- 배출 한도 vs 실적 + 거래 가능 탄소 배출권 -->
      <section class="grid gap-3 xl:grid-cols-2">

        <!-- 탄소중립 관리 (emissionQuota 스토어 연동) -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Scale :size="15" class="text-blue-600" />
              탄소중립 관리
              <span class="text-[10px] font-normal text-gray-400">SBTi 자발적 모델</span>
            </h3>
            <button
              type="button"
              class="inline-flex items-center gap-1 border border-blue-300 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100"
              @click="openQuotaModal"
            >
              <Edit3 :size="12" />
              할당량 입력
            </button>
          </div>

          <div class="flex flex-1 flex-col gap-3 px-3 pt-3 pb-0">
            <!-- 배출 한도 vs 사용한 탄소배출권 도넛 -->
            <div>
              <div class="mb-1.5 flex items-baseline justify-between">
                <span class="text-[11px] font-medium text-gray-500">정부 할당량 대비 사용률</span>
                <span class="inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  실효 {{ emissionCompliance.ytdNet.toLocaleString() }} / 할당 {{ emissionCompliance.allocation.toLocaleString() }} tCO₂
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

            <!-- 4개 메트릭: 정부 할당량 / 사용한 탄소 배출량 / 잔여 한도 / 절감한 탄소 배출량 -->
            <div class="grid grid-cols-4 gap-2">
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">정부 할당량</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <span class="text-[14px] font-bold text-gray-800">{{ emissionCompliance.allocation.toLocaleString() }}</span>
                  <span class="text-[9px] text-gray-400">tCO₂</span>
                </div>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">사용한 탄소 배출량</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <span class="text-[14px] font-bold text-blue-700">{{ emissionCompliance.ytdNet.toLocaleString() }}</span>
                  <span class="text-[9px] text-gray-400">tCO₂</span>
                </div>
              </div>
              <div class="border border-amber-200 bg-amber-50 px-2 py-2">
                <p class="text-[10px] text-amber-700">잔여 한도</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <span class="text-[14px] font-bold text-amber-700">{{ emissionCompliance.expectedSurplus.toLocaleString() }}</span>
                  <span class="text-[9px] text-amber-600">tCO₂</span>
                </div>
              </div>
              <div class="border border-emerald-200 bg-emerald-50 px-2 py-2">
                <p class="text-[10px] text-emerald-700">절감한 탄소 배출량</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <!-- KPI "탄소 배출 절감" 카드와 동일한 값 (esgStore.totalCarbonReductionKg / 1000) -->
                  <span class="text-[14px] font-bold text-emerald-700">{{ totalCarbonReductionTon.toFixed(2) }}</span>
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

        <!-- 거래 가능 탄소 배출권 (자산 포트폴리오 스타일) -->
        <article class="flex min-w-0 flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-gray-800">
              <span class="inline-flex items-center gap-2">
                <Coins :size="15" class="text-amber-600" />
                거래 가능 탄소 배출권
                <span class="text-[10px] font-normal text-gray-400">자산 포트폴리오</span>
              </span>
              <span class="text-[10.5px] font-normal text-amber-700/80">
                ⓘ 잔여 한도 × KAU25 시세 · KRX 매도 가능 (평일 10:00~12:00)
              </span>
            </h3>
            <span class="shrink-0 text-[10px] text-gray-400">기준: {{ dateLabel }}</span>
          </div>

          <!-- 보유 자산 가치 (메인 메트릭) -->
          <div class="border-b border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 px-3 py-3">
            <p class="text-[10px] font-medium text-amber-700/80">보유 자산 가치</p>
            <div class="mt-1 flex items-baseline gap-1.5">
              <span class="text-[24px] font-black text-amber-700">
                ₩{{ carbonAssetValue.toLocaleString('ko-KR') }}
              </span>
              <span
                class="text-[11px] font-bold"
                :class="carbonAssetTrend.up ? 'text-red-600' : carbonAssetTrend.down ? 'text-blue-600' : 'text-gray-500'"
              >
                {{ carbonAssetTrend.up ? '↗' : carbonAssetTrend.down ? '↘' : '·' }}
                {{ carbonAssetTrend.label }}
              </span>
            </div>
            <p class="mt-1 text-[10px] text-amber-700/70">
              {{ carbonAssetTrend.detail }}
            </p>
          </div>

          <!-- 월별 가치 추이 (막대 차트) -->
          <div class="flex min-w-0 flex-1 flex-col px-3 py-2.5">
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">최근 7거래일 자산 가치 추이</p>
            <div class="relative w-full flex-1" style="min-height: 220px;">
              <LineChart :data="carbonAssetMonthlyData" :options="carbonAssetMonthlyOptions" fill-height />
            </div>
          </div>
        </article>
      </section>

      <!-- 순환 재고 판매 수익 + 탄소 배출권 시장 -->
      <section class="grid gap-3 xl:grid-cols-2">

        <!-- 순환 재고 판매 수익 -->
        <article class="flex min-w-0 flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-gray-800">
              <span class="inline-flex items-center gap-2">
                <Wallet :size="15" class="text-emerald-600" />
                순환 재고 판매 수익
              </span>
              <span class="text-[10.5px] font-normal text-emerald-700/80">
                ⓘ 판매 단가 × 무게 합산 · 월말 마감 후 자동 갱신
              </span>
            </h3>
            <div class="inline-flex shrink-0 items-center gap-0.5 border border-gray-300 bg-white p-0.5">
              <button
                v-for="p in [{v:'M',l:'월'},{v:'Q',l:'분기'},{v:'YEAR',l:'년'}]"
                :key="p.v"
                type="button"
                class="px-2 py-0.5 text-[10px] font-medium transition"
                :class="revenuePeriod === p.v ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-50'"
                @click="revenuePeriod = p.v"
              >{{ p.l }}</button>
            </div>
          </div>

          <!-- 월별 판매 수익 (메인) -->
          <div class="border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-3 py-3">
            <p class="text-[10px] font-medium text-emerald-700/80">
              월별 판매 수익
            </p>
            <div class="mt-1 flex items-baseline gap-1.5">
              <span class="text-[24px] font-black text-emerald-700">
                ₩{{ totalRevenue.toLocaleString('ko-KR') }}
              </span>
            </div>
            <p class="mt-1 text-[10px] text-emerald-700/70">
              거래 {{ revenueStats.count }}건 · 월 평균 ₩{{ revenueStats.avgMonthly.toLocaleString() }}
              <span class="ml-1 text-gray-500">(데이터 있는 월 기준)</span>
            </p>
          </div>

          <!-- 월별 수익 추이 -->
          <div class="flex min-w-0 flex-1 flex-col px-3 py-2.5">
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">월별 수익 추이 (12개월)</p>
            <div class="relative w-full flex-1" style="min-height: 220px;">
              <BarChart :data="revenueChartData" :options="revenueChartOptions" fill-height />
            </div>
          </div>
        </article>

        <!-- 탄소 배출권 시장 (BE 실시간 KAU25 연동) -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Coins :size="15" class="text-amber-600" />
              탄소 배출권 시장
              <button
                type="button"
                class="ml-1 inline-flex items-center gap-0.5 text-[10px] font-normal text-amber-700 transition-colors hover:text-amber-800 hover:underline"
                @click="router.push('/hq/esg/carbon-price')"
              >
                자세히 보기 →
              </button>
            </h3>
            <div class="flex items-center gap-1.5">
              <span v-if="carbonLatest?.basDt" class="text-[9px] text-gray-400">
                {{ formatBasDtShort(carbonLatest.basDt) }} 기준
              </span>
              <span class="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                {{ carbonLatest?.symbol ?? 'KAU25' }} · KRX
              </span>
              <button
                type="button"
                class="flex h-5 w-5 items-center justify-center border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
                :disabled="carbonLoading"
                title="시세 새로고침"
                @click="loadCarbonPrice"
              >
                <RefreshCw :size="11" :class="carbonLoading ? 'animate-spin' : ''" />
              </button>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-6 px-4 pt-4 pb-4">
            <!-- 폴백 알림 -->
            <div
              v-if="carbonLatest?.fallback"
              class="border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-medium text-amber-800"
            >
              ⚠ 외부 시세 API 응답 지연 — 예비값 표시 중
            </div>

            <!-- 메인: 탄소배출권 현재 시세 (KAU25 가장 최근 종가) -->
            <div class="border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 px-4 py-5">
              <p class="text-[11px] font-medium text-amber-700">탄소배출권 현재 시세</p>
              <div class="mt-2 flex items-baseline gap-1.5">
                <span class="text-[26px] font-black text-amber-700">
                  ₩{{ (carbonLatest?.pricePerTon ?? 0).toLocaleString('ko-KR') }}
                </span>
                <span class="text-[12px] text-amber-700/80">/ tCO₂</span>
              </div>
              <p class="mt-2 text-[10px] text-amber-700/70">
                KRX 한국거래소 배출권 시장 KAU25 가장 최근 종가
              </p>
            </div>

            <!-- 7일 시세 추이 (라인 차트) — 기존 "월별 환산 가치 추이" 자리 -->
            <div class="flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <p class="text-[11px] font-medium text-gray-500">최근 7거래일 시세 추이 (KAU25)</p>
              </div>
              <LineChart
                v-if="carbonTrend.length"
                :data="carbonChartData"
                :options="carbonChartOptions"
                :height="200"
              />
              <div
                v-else
                class="flex items-center justify-center border border-dashed border-gray-200 bg-gray-50 text-[11px] text-gray-400"
                style="height: 200px;"
              >
                {{ carbonError || '시세 불러오는 중...' }}
              </div>
            </div>

            <!-- 휴장일 안내 (하단으로 이동, 카드 전체 높이를 채우기 위해 mt-auto) -->
            <p class="mt-auto border-l-2 border-amber-300 bg-amber-50/50 px-3 py-3 text-[11.5px] leading-relaxed text-amber-900/80">
              <span class="mr-0.5 font-bold">ⓘ</span>
              한국거래소 배출권 시장은 <strong>평일 오전 10:00~12:00</strong>만 운영됩니다.
              <strong>주말·공휴일</strong>은 휴장이라 시세가 형성되지 않아 그래프와 표에서 제외됩니다.
            </p>
          </div>
        </article>
      </section>

    </div>

    <!-- 정부 할당량 관리 모달 -->
    <Teleport to="body">
      <div
        v-if="showQuotaModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        @click.self="closeQuotaModal"
      >
        <div class="flex max-h-[90vh] w-full max-w-2xl flex-col border border-gray-300 bg-white shadow-2xl">
          <!-- 헤더 -->
          <div class="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50 px-5 py-3">
            <h3 class="inline-flex items-center gap-2 text-[15px] font-bold text-gray-900">
              <Scale :size="18" class="text-blue-600" />
              {{ fiscalYear }} 정부 할당량 관리
            </h3>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              @click="closeQuotaModal"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- 본문 -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <!-- 연간 할당량 -->
            <div class="mb-4">
              <label class="flex flex-col gap-1">
                <span class="text-[11px] font-semibold text-gray-700">연간 할당량 (tCO₂)</span>
                <input
                  v-model.number="quotaDraft.yearlyAllocation"
                  type="number"
                  min="0"
                  class="border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                  placeholder="예: 1000"
                />
              </label>
            </div>

            <!-- 월별 입력 (분기별 4행) -->
            <div class="mb-6">
              <p class="mb-1.5 text-[11px] font-semibold text-gray-700">월별 실적 (tCO₂)</p>
              <div class="flex flex-col gap-1.5">
                <div
                  v-for="q in 4"
                  :key="q"
                  class="grid grid-cols-4 gap-2"
                >
                  <label
                    v-for="m in 3"
                    :key="m"
                    class="flex flex-col gap-0.5 border border-gray-200 bg-gray-50 px-2 py-1.5"
                  >
                    <span class="text-[10px] font-medium text-gray-500">{{ MONTH_LABELS[(q - 1) * 3 + (m - 1)] }}</span>
                    <input
                      v-model="quotaDraft.monthly[(q - 1) * 3 + (m - 1)]"
                      type="number"
                      min="0"
                      class="w-full border-0 bg-transparent p-0 text-[12px] font-semibold text-gray-900 focus:outline-none focus:ring-0"
                      placeholder="-"
                    />
                  </label>
                  <div class="flex flex-col gap-0.5 border border-blue-200 bg-blue-50 px-2 py-1.5">
                    <span class="text-[10px] font-semibold text-blue-700">Q{{ q }}</span>
                    <span class="text-[12px] font-bold text-blue-700">
                      {{ quarterSum(q).toLocaleString() }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 안내 -->
            <p class="text-[11px] text-gray-500">
              매월 활동량 입력 시 tCO₂로 자동 환산됩니다. YTD는 누적, 분기 차트는 3개월씩 합산.
            </p>
          </div>

          <!-- 푸터 -->
          <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
            <button
              type="button"
              class="border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-100"
              @click="closeQuotaModal"
            >
              취소
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 border border-blue-600 bg-blue-600 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-blue-700"
              @click="saveQuotaModal"
            >
              <Save :size="13" />
              저장
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

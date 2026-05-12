<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
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
  Wallet,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEsgStore } from '@/stores/esg.js'
import { useEmissionQuotaStore } from '@/stores/emissionQuota.js'
import { carbonPriceApi } from '@/api/hq/esg.js'
import { extractErrorMessage } from '@/api/axios.js'
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => 'ESG 대시보드')
const activeSideMenu = ref('친환경 발자국 현황판')
const esgSideMenus = (hqMenus.find((menu) => menu.label === 'ESG 대시보드')?.children ?? [])

const esgStore = useEsgStore()
const { totalPoints, kauPrice, kauPriceUpdatedAt, kauPriceLoading } = storeToRefs(esgStore)

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

// 배출 한도 vs 실적 데이터 — emissionQuota 스토어와 연동
// (별도 페이지 /hq/esg/emissionquota 에서 입력한 활동량이 자동 반영됨)
const quotaStore = useEmissionQuotaStore()

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

onMounted(() => {
  esgStore.fetchKauPrice()
})

const kpiMetrics = [
  { label: '탄소 배출 절감', value: '2,847', unit: 'kg CO₂', sub: '전월 대비 +12%', icon: TrendingDown, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '소재 재활용 전환율', value: '68.4', unit: '%', sub: '목표치 70% 근접', icon: Recycle, valueCls: 'text-green-700', iconBg: 'bg-green-50', iconCls: 'text-green-600' },
  { label: '폐기물 감소량', value: '1,240', unit: 'kg', sub: '불법폐기 0건', icon: ShieldCheck, valueCls: 'text-teal-700', iconBg: 'bg-teal-50', iconCls: 'text-teal-600' },
  { label: '폐기 손실 수익전환', value: '4,820,000', unit: '원', sub: '순환 회수 완료', icon: Award, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
]

// 나무 키우기 점수 카테고리 (5종)
//  1. 순환재고 판매 실행      — 판매 1건당 기본 100점 (10kg 이상)
//  2. 탄소 감축 기여           — 무게 × 소재 계수 × 0.5 (판매 + 기부 모두 합산)
//  3. 순환 거래 확산           — 신규 거래처 첫 거래 +150
//  4. 지역 상생                — 사회적기업/지역 소규모 파트너 거래 +150 (월 3건 한도)
//  5. 기부 활동 실행           — 기부 1건당 기본 80점 (10kg 이상)
//  ※ 카테고리 합계: 400 + 1,436 + 150 + 150 + 320 = 2,456 pt
const scoreCategories = [
  {
    id: 'saleExecution',
    label: '순환재고 판매 실행',
    points: 400,
    pct: 16.3,
    icon: RefreshCw,
    badge: '기본 점수',
    barCls: 'bg-emerald-500',
    badgeCls: 'bg-emerald-100 text-emerald-700',
    iconCls: 'text-emerald-600',
    desc: '순환재고 판매 1건이 최종 완료되면 적립되는 기본 점수',
    formula: '판매 1건당 100점 (최소 10kg 이상 유효)',
    rows: [
      { label: '04.27', target: '폴리에스터 500kg 판매 (D사)', detail: '기본 100점', points: 100 },
      { label: '04.20', target: '혼방 300kg 판매 (마을협동조합)', detail: '기본 100점', points: 100 },
      { label: '04.15', target: '면 250kg 판매 (B사)', detail: '기본 100점', points: 100 },
      { label: '04.10', target: '면 100kg 판매 (A사)', detail: '기본 100점', points: 100 },
    ],
  },
  {
    id: 'carbonReduction',
    label: '탄소 감축 기여',
    points: 1436,
    pct: 58.5,
    icon: Leaf,
    badge: 'GHG Avoided',
    barCls: 'bg-teal-500',
    badgeCls: 'bg-teal-100 text-teal-700',
    iconCls: 'text-teal-600',
    desc: '소각되지 않고 판매·기부된 무게에 대한 실제 탄소 감축 환산 (판매 + 기부 합산)',
    formula: '무게(kg) × 소재 계수 × 0.5 (면 1.8 / 폴리 2.3 / 나일론 2.1 / 울 2.5 / 혼방 비율 분해)',
    rows: [
      { label: '04.27', target: '폴리에스터 500kg 판매', detail: '500 × 2.3 × 0.5', points: 575 },
      { label: '04.20', target: '혼방 300kg 판매 (면50:폴리50)', detail: '300 × 2.0 × 0.5', points: 300 },
      { label: '04.15', target: '면 250kg 판매', detail: '250 × 1.8 × 0.5', points: 225 },
      { label: '04.10', target: '면 100kg 판매', detail: '100 × 1.8 × 0.5', points: 90 },
      { label: '04.28', target: '면 95kg 기부 (재해구호)', detail: '95 × 1.8 × 0.5', points: 86 },
      { label: '04.22', target: '면 80kg 기부 (취약계층)', detail: '80 × 1.8 × 0.5', points: 72 },
      { label: '04.14', target: '폴리 50kg 기부 (개도국)', detail: '50 × 2.3 × 0.5', points: 58 },
      { label: '04.05', target: '혼방 30kg 기부 (교육기관)', detail: '30 × 2.0 × 0.5', points: 30 },
    ],
  },
  {
    id: 'newBuyer',
    label: '순환 거래 확산',
    points: 150,
    pct: 6.1,
    icon: Recycle,
    badge: 'ESG-S 신규 채널',
    barCls: 'bg-blue-500',
    badgeCls: 'bg-blue-100 text-blue-700',
    iconCls: 'text-blue-600',
    desc: '신규 순환 거래처와의 첫 거래 — 소각 대체 채널 확장 기여',
    formula: '신규 buyerId 첫 거래 1건당 +150점 (과거 순환 판매 이력 0건 판별)',
    rows: [
      { label: '04.27', target: '신규 거래처 D사 첫 거래 (폴리 500kg)', detail: '신규 채널 발굴 가점', points: 150 },
    ],
  },
  {
    id: 'localPartner',
    label: '지역 상생',
    points: 150,
    pct: 6.1,
    icon: ShieldCheck,
    badge: 'ESG-S 사회적 가치',
    barCls: 'bg-amber-500',
    badgeCls: 'bg-amber-100 text-amber-700',
    iconCls: 'text-amber-600',
    desc: '지역 소규모 파트너 / 사회적 기업과 거래 — 지역 경제·사회적 가치 기여',
    formula: '거래 1건당 +150점 (거래처당 월 3건 한도, 어뷰징 방지)',
    rows: [
      { label: '04.20', target: '마을협동조합 (사회적 기업) — 혼방 300kg', detail: '지역 상생 가점', points: 150 },
    ],
  },
  {
    id: 'donationExecution',
    label: '기부 활동 실행',
    points: 320,
    pct: 13.0,
    icon: Heart,
    badge: '사회적 가치',
    barCls: 'bg-pink-500',
    badgeCls: 'bg-pink-100 text-pink-700',
    iconCls: 'text-pink-600',
    desc: '기부 1건이 최종 완료되면 적립되는 기본 점수',
    formula: '기부 1건당 80점 (최소 10kg 이상 유효)',
    rows: [
      { label: '04.28', target: '재해 구호 (면 95kg)', detail: '기본 80점', points: 80 },
      { label: '04.22', target: '취약 계층 지원 (면 80kg)', detail: '기본 80점', points: 80 },
      { label: '04.14', target: '개도국 의류 지원 (폴리 50kg)', detail: '기본 80점', points: 80 },
      { label: '04.05', target: '교육 기관 지원 (혼방 30kg)', detail: '기본 80점', points: 80 },
    ],
  },
]

const expandedId = ref(null)
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

// ─────────── 거래 가능 탄소 배출권 (자산 포트폴리오 스타일) ───────────
//   잔여 한도 × KAU25 시세 = 보유 자산 가치
//   향후 KOC offset 도입 시 carbonAssetBreakdown 에 항목 추가
const carbonAssetValue = computed(() =>
  Math.round(emissionCompliance.value.expectedSurplus * (kauPrice.value || 0)),
)

// 변동률 (1월 평균 대비) — mock baseline ₩42,000,000
const carbonAssetTrend = computed(() => {
  const baseline = 42_000_000
  const current = carbonAssetValue.value
  if (baseline === 0) return { up: false, down: false, label: '0%', detail: '기준값 없음' }
  const diff = current - baseline
  const pct = (diff / baseline) * 100
  const formattedPct = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
  const formattedDiff = (diff >= 0 ? '+' : '−') + '₩' + Math.abs(diff).toLocaleString('ko-KR')
  return {
    up: diff > 0, down: diff < 0,
    label: `${formattedPct} (vs 1월 평균)`,
    detail: `${formattedDiff} · 잔여 ${emissionCompliance.value.expectedSurplus.toLocaleString()} tCO₂ × ₩${(kauPrice.value || 0).toLocaleString()}`,
  }
})

// 월별 자산 가치 추이 (mock — 잔여량은 동일, 시세 변동 반영)
const CARBON_ASSET_MONTHLY_PRICE = [8200, 8400, 8950, 9100, 9620, 9840, 9700, 9550, 9420, 9180, 8950, 8800]
const carbonAssetMonthlyData = computed(() => ({
  labels: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  datasets: [{
    label: '자산 가치',
    data: CARBON_ASSET_MONTHLY_PRICE.map(p =>
      Math.round(emissionCompliance.value.expectedSurplus * p),
    ),
    backgroundColor: 'rgba(245, 158, 11, 0.85)',
    borderColor: '#d97706',
    borderWidth: 1.5, borderRadius: 3,
    maxBarThickness: 18, categoryPercentage: 0.7, barPercentage: 0.8,
  }],
}))
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

// ─────────── 순환 재고 판매 수익 (mock) ───────────
//   향후 BE 연동: GET /api/hq/circular-stock/sales/revenue?period=YEAR|Q|M
//   계산: SUM(sale_price) by month/buyer
const revenuePeriod = ref('YEAR')   // M | Q | YEAR

// 월별 수익 mock (1~12월, 단위 원)
const REVENUE_MONTHLY = [376_000, 800_000, 630_000, 2_010_000, 0, 0, 0, 0, 0, 0, 0, 0]
// 월별 거래 건수 mock (1~12월)
const REVENUE_COUNT_MONTHLY = [1, 2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0]

const totalRevenue = computed(() => {
  const now = new Date()
  const m = now.getMonth()
  if (revenuePeriod.value === 'M') return REVENUE_MONTHLY[m] ?? 0
  if (revenuePeriod.value === 'Q') {
    const start = Math.max(0, m - 2)
    return REVENUE_MONTHLY.slice(start, m + 1).reduce((s, v) => s + v, 0)
  }
  return REVENUE_MONTHLY.reduce((s, v) => s + v, 0)
})

const revenueStats = computed(() => {
  const monthsWithData = REVENUE_MONTHLY.filter(v => v > 0).length || 1
  const avgMonthly = Math.round(REVENUE_MONTHLY.reduce((s, v) => s + v, 0) / monthsWithData)
  const count = REVENUE_COUNT_MONTHLY.reduce((s, v) => s + v, 0)
  return { avgMonthly, count }
})

const revenueChartData = computed(() => ({
  labels: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  datasets: [{
    label: '월별 수익',
    data: REVENUE_MONTHLY,
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

const topBuyers = computed(() => {
  const sorted = [...REVENUE_BY_BUYER].sort((a, b) => b.amount - a.amount)
  const total = sorted.reduce((s, b) => s + b.amount, 0) || 1
  return sorted.map(b => ({ ...b, share: ((b.amount / total) * 100).toFixed(1) }))
})

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
              class="text-[11px] font-medium text-blue-700 transition hover:underline"
              @click="router.push('/hq/esg/emissionquota')"
            >
              자세히 보기 →
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

            <!-- 4개 메트릭: 정부 할당량 / YTD 실효 / 잔여 한도 / 회피 배출량 -->
            <div class="grid grid-cols-4 gap-2">
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
              <div class="border border-amber-200 bg-amber-50 px-2 py-2">
                <p class="text-[10px] text-amber-700">잔여 한도</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <span class="text-[14px] font-bold text-amber-700">{{ emissionCompliance.expectedSurplus.toLocaleString() }}</span>
                  <span class="text-[9px] text-amber-600">tCO₂</span>
                </div>
              </div>
              <div class="border border-emerald-200 bg-emerald-50 px-2 py-2">
                <p class="text-[10px] text-emerald-700">회피 배출량</p>
                <div class="mt-0.5 flex items-baseline gap-0.5">
                  <span class="text-[14px] font-bold text-emerald-700">−{{ emissionCompliance.ytdAvoided.toLocaleString() }}</span>
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

        <!-- 배출권 시장 가치 환산 (BE 실시간 KAU25 연동) -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Coins :size="15" class="text-amber-600" />
              배출권 시장 가치 환산
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

          <div class="flex flex-1 flex-col gap-3 px-3 pt-3 pb-3">
            <!-- 폴백 알림 -->
            <div
              v-if="carbonLatest?.fallback"
              class="border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-medium text-amber-800"
            >
              ⚠ 외부 시세 API 응답 지연 — 예비값 표시 중
            </div>

            <!-- 메인: 탄소배출권 현재 시세 (KAU25 가장 최근 종가) -->
            <div class="border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 px-3 py-3">
              <p class="text-[10px] font-medium text-amber-700">탄소배출권 현재 시세</p>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-[22px] font-black text-amber-700">
                  ₩{{ (carbonLatest?.pricePerTon ?? 0).toLocaleString('ko-KR') }}
                </span>
                <span class="text-[11px] text-amber-700/80">/ tCO₂</span>
              </div>
              <p class="mt-1 text-[10px] text-amber-700/70">
                KRX 한국거래소 배출권 시장 KAU25 가장 최근 종가
              </p>
            </div>

            <!-- 3개 메트릭: 전일대비 / 7일 최고 / 7일 최저 -->
            <div class="grid grid-cols-3 gap-2">
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">전일 대비</p>
                <div
                  class="mt-0.5"
                  :class="carbonIsUp ? 'text-red-600' : carbonIsDown ? 'text-blue-600' : 'text-gray-700'"
                >
                  <span class="text-[12px] font-bold">{{ formatPct(carbonLatest?.fltRt) }}</span>
                </div>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">7일 최고가</p>
                <div class="mt-0.5">
                  <span class="text-[12px] font-bold text-red-600">
                    ₩{{ carbonHigh7d.toLocaleString('ko-KR') }}
                  </span>
                </div>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-2 py-2">
                <p class="text-[10px] text-gray-500">7일 최저가</p>
                <div class="mt-0.5">
                  <span class="text-[12px] font-bold text-blue-600">
                    ₩{{ carbonLow7d.toLocaleString('ko-KR') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 7일 시세 추이 (라인 차트) — 기존 "월별 환산 가치 추이" 자리 -->
            <div class="mt-auto">
              <div class="mb-1.5 flex items-center justify-between">
                <p class="text-[10px] font-medium text-gray-500">최근 7거래일 시세 추이 (KAU25)</p>
                <button
                  type="button"
                  class="text-[9px] font-medium text-amber-700 transition hover:underline"
                  @click="router.push('/hq/esg/carbon-price')"
                >
                  자세히 보기 →
                </button>
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
              <!-- 휴장일 안내 -->
              <p class="mt-2 border-l-2 border-amber-300 bg-amber-50/50 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-900/80">
                <span class="mr-0.5 font-bold">ⓘ</span>
                한국거래소 배출권 시장은 <strong>평일 오전 10:00~12:00</strong>만 운영됩니다.
                <strong>주말·공휴일</strong>은 휴장이라 시세가 형성되지 않아 그래프와 표에서 제외됩니다.
              </p>
            </div>
          </div>
        </article>
      </section>

      <!-- 친환경 나무 키우기 점수 상세 -->
      <section class="grid gap-3">

        <!-- 친환경 나무 키우기 점수 상세 -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <div>
              <h3 class="text-sm font-medium text-gray-800">친환경 나무 키우기 점수</h3>
              <p class="mt-0.5 text-[10px] text-gray-400">각 항목을 클릭하면 세부 내역과 산출 공식을 확인할 수 있습니다</p>
            </div>
            <button
              type="button"
              class="text-[11px] font-medium text-emerald-700 transition hover:underline"
              @click="router.push('/hq/esg/tree-score')"
            >
              자세히 보기 →
            </button>
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

      <!-- 거래 가능 탄소 배출권 + 활동 내역 -->
      <section class="grid gap-3 xl:grid-cols-2">

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
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">월별 자산 가치 추이</p>
            <div class="relative w-full" style="height: 220px;">
              <BarChart :data="carbonAssetMonthlyData" :options="carbonAssetMonthlyOptions" />
            </div>
          </div>
        </article>

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

          <!-- 누적 수익 (메인) -->
          <div class="border-b border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-3 py-3">
            <p class="text-[10px] font-medium text-emerald-700/80">
              {{ revenuePeriod === 'M' ? '이번 달' : revenuePeriod === 'Q' ? '최근 3개월' : '올해 (YTD)' }} 누적 수익
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
            <div class="relative w-full" style="height: 220px;">
              <BarChart :data="revenueChartData" :options="revenueChartOptions" />
            </div>
          </div>
        </article>
      </section>

    </div>
  </AppLayout>
</template>

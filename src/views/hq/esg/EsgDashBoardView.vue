<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  Leaf,
  ShieldCheck,
  TrendingDown,
  Scale,
  Coins,
  RefreshCw,
  Wallet,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEsgStore } from '@/stores/esg.js'
import { carbonPriceApi, circularRevenueApi } from '@/api/hq/esg.js'
import { extractErrorMessage } from '@/api/axios.js'
import { MATERIAL_FACTORS, MATERIAL_COLORS, MATERIAL_COLOR_FALLBACK } from '@/utils/esgScore.js'
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => 'ESG 탄소 성과 관리')
const activeSideMenu = ref('탄소 배출 관리')
const esgSideMenus = (hqMenus.find((menu) => menu.label === 'ESG 탄소 성과 관리')?.children ?? [])

const esgStore = useEsgStore()
const {
  totalPoints,
  totalSalesKg,
  totalCarbonReductionTon,
  carbonReductionDeltaPct,
  carbonReductionByMaterialKg,
  carbonReductionMonthly,
  kauPrice,
  kauPriceUpdatedAt,
  kauPriceLoading,
} = storeToRefs(esgStore)

// ─────────── 순환 활동 탄소 감축 현황 (소재 전체, 사용량 많은 순) ───────────
//   - MATERIAL_FACTORS 의 모든 소재를 절감량(tCO₂e) 기준 내림차순 정렬
//   - "한글 (English)" 형식으로 모든 소재 영문 병기
const materialReductionRows = computed(() => {
  const buckets = carbonReductionByMaterialKg.value ?? {}
  // POLYAMIDE 와 NYLON 은 동일 label('나일론') 이라 중복 노출 방지: 절감량을 NYLON 으로 통합 후 POLYAMIDE 제외
  const merged = { ...buckets }
  if (merged.POLYAMIDE != null) {
    merged.NYLON = (merged.NYLON ?? 0) + (merged.POLYAMIDE ?? 0)
    delete merged.POLYAMIDE
  }
  // 한글명 옆에 영문명을 병기 — 회계/ESG 공시 문서 어휘와 정렬 (예: "면 (Cotton)")
  const labelOverride = {
    COTTON:    '면 (Cotton)',
    WOOL:      '울 (Wool)',
    CASHMERE:  '캐시미어 (Cashmere)',
    SILK:      '실크 (Silk)',
    LINEN:     '린넨 (Linen)',
    POLYESTER: '폴리에스터 (Polyester)',
    ACRYLIC:   '아크릴 (Acrylic)',
    NYLON:     '나일론 (Nylon)',
    POLYAMIDE: '나일론 (Nylon)',
    ELASTANE:  '스판덱스 (Elastane)',
    RAYON:     '레이온 (Rayon)',
    BLEND:     '혼방 (Blend)',
  }
  const rows = Object.entries(merged).map(([key, kg]) => ({
    key,
    label: labelOverride[key] ?? MATERIAL_FACTORS[key]?.label ?? key,
    kg: Number(kg) || 0,
    color: MATERIAL_COLORS[key] ?? MATERIAL_COLOR_FALLBACK,
  }))
  // 사용량 많은 순 (kg 내림차순). 동률이면 라벨 가나다순.
  rows.sort((a, b) => (b.kg - a.kg) || a.label.localeCompare(b.label, 'ko'))
  const maxKg = Math.max(...rows.map(r => r.kg), 1)
  return rows.map(r => ({
    ...r,
    ton: r.kg / 1000,
    barPct: Math.min(100, (r.kg / maxKg) * 100),
  }))
})

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

// 헤더 누적 ESG 점수 — BE sale events 기반 자동 계산
onMounted(() => {
  esgStore.fetchTotalPoints().catch(err => {
    console.error('[EsgDashBoardView] fetchTotalPoints failed:', err)
  })
})

// (정부 할당량 / 분기 배출 등 emissionQuota 관련 코드 제거됨 — UI 에서도 모두 사용 안 함)

// 월별 환산 가치 추이 BarChart (1~4월 실적만 표시, 5~12월은 라벨만)
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
  { label: '연간 총 탄소 감축량',   value: (totalCarbonReductionTon.value ?? 0).toFixed(2),    unit: 'tCO₂', sub: carbonDeltaLabel.value, icon: TrendingDown, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '순환재고 판매량', value: (totalSalesKg.value ?? 0).toLocaleString('ko-KR'), unit: 'kg',   sub: '판매 내역 보기 →',     icon: ShieldCheck,  valueCls: 'text-teal-700',     iconBg: 'bg-teal-50',     iconCls: 'text-teal-600', to: '/hq/circular-inventory/sales/history' },
])

// ─────────── 배출권 시장 가치 환산 (자산 포트폴리오 스타일) ───────────
//   순환 활동 탄소 감축량 (tCO₂e) × KAU25 시세 = 절감 가치 (환산 가치)
//   - 의미: 우리가 순환재고 활동으로 회피한 탄소량을 배출권으로 환산했을 때의 시장 가치
//   - 데이터: esgStore.totalCarbonReductionTon (= "순환 활동 탄소 감축 현황" 막대 합계)
const carbonAssetValue = computed(() =>
  Math.round((totalCarbonReductionTon.value || 0) * (kauPrice.value || 0)),
)

// 변동률 (7거래일 첫째 날 대비) — carbonTrend 의 첫째 날 종가를 baseline 으로 동적 산정
const carbonAssetTrend = computed(() => {
  const reductionTon = totalCarbonReductionTon.value || 0
  const trend = carbonTrend.value ?? []
  if (trend.length === 0) {
    return { up: false, down: false, label: '시세 미조회', detail: '기준값 없음' }
  }
  const firstPrice = Number(trend[0]?.pricePerTon) || 0
  const baseline = Math.round(reductionTon * firstPrice)
  const current = carbonAssetValue.value
  if (baseline === 0) return { up: false, down: false, label: '0%', detail: '기준값 없음' }
  const diff = current - baseline
  const pct = (diff / baseline) * 100
  const formattedPct = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
  const formattedDiff = (diff >= 0 ? '+' : '−') + '₩' + Math.abs(diff).toLocaleString('ko-KR')
  return {
    up: diff > 0, down: diff < 0,
    label: `${formattedPct} (vs 7거래일 첫날)`,
    detail: `${formattedDiff} · 절감량 ${reductionTon.toFixed(1)} tCO₂e × ₩${(kauPrice.value || 0).toLocaleString()}`,
  }
})

// 월별 환산 가치 추이 — 월별 탄소 절감량(kg → tCO₂e) × 현재 KAU25 시세
//   - esgStore.carbonReductionMonthly: 1~12월 kg CO₂ (computeMonthlyCarbonReduction 결과)
//   - 의미: 각 월에 회피한 탄소량을 배출권 시장 가치로 환산 (막대 그래프 표시)
const carbonAssetMonthlyData = computed(() => {
  const monthly = carbonReductionMonthly.value ?? Array(12).fill(0)
  const price = Number(kauPrice.value) || 0
  const labels = Array.from({ length: 12 }, (_, i) => `${i + 1}월`)
  const data = monthly.map(kg => Math.round(((Number(kg) || 0) / 1000) * price))
  return {
    labels,
    datasets: [{
      label: '월별 환산 가치',
      data,
      backgroundColor: 'rgba(245, 158, 11, 0.85)',
      hoverBackgroundColor: '#d97706',
      borderColor: '#d97706',
      borderWidth: 1,
      borderRadius: 3,
      maxBarThickness: 28,
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
      beginAtZero: true,
      ticks: {
        font: { size: 9 }, maxTicksLimit: 5,
        callback: (v) => {
          if (v >= 1_000_000) return '₩' + Math.round(v / 1_000_000) + 'M'
          if (v >= 1_000) return '₩' + Math.round(v / 1_000) + 'K'
          return '₩' + v
        },
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

// 12개월 누적 합계 — BE 의 totalRevenue 우선, 없으면 월별 데이터 합산
const totalRevenue = computed(() => {
  const arr = revenueMonthly.value
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
            탄소 배출 관리
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
          :class="m.to ? 'cursor-pointer transition hover:border-gray-400 hover:shadow' : ''"
          @click="m.to && router.push(m.to)"
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

        <!-- 순환 활동 탄소 감축 현황 (소재 그룹별 막대 게이지) -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
              <Scale :size="15" class="text-emerald-600" />
              순환 활동 탄소 감축 현황
            </h3>
          </div>

          <div class="flex flex-1 flex-col gap-4 px-4 py-4">
            <!-- 소재 그룹별 막대 게이지 -->
            <div class="flex flex-col gap-3">
              <div
                v-for="row in materialReductionRows"
                :key="row.key"
                class="flex flex-col gap-1.5"
              >
                <div class="flex items-baseline justify-between">
                  <span class="text-[12px] font-medium text-gray-700">{{ row.label }}</span>
                  <span class="text-[12px] font-bold text-gray-800">
                    {{ row.ton.toFixed(1) }}
                    <span class="text-[10px] font-medium text-gray-500">tCO₂e</span>
                  </span>
                </div>
                <div class="h-1.5 w-full bg-gray-100">
                  <div
                    class="h-full transition-all"
                    :style="{ width: `${row.barPct}%`, backgroundColor: row.color }"
                  ></div>
                </div>
              </div>
            </div>

          </div>
        </article>

        <!-- 배출권 시장 가치 환산 (자산 포트폴리오 스타일) -->
        <article class="flex min-w-0 flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-gray-200 px-3 py-2.5">
            <h3 class="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-gray-800">
              <span class="inline-flex items-center gap-2">
                <Coins :size="15" class="text-amber-600" />
                탄소 감축량 시장 가치 환산
              </span>
              <span class="text-[10.5px] font-normal text-amber-700/80">
                ⓘ 순환 활동 탄소 감축량 × KAU25 시세
              </span>
            </h3>
            <span class="shrink-0 text-[10px] text-gray-400">기준: {{ dateLabel }}</span>
          </div>

          <!-- 순환재고 판매 누적 환산 가치 (메인 메트릭) -->
          <!--   = 연간 누적 탄소 감축량(tCO₂) × KAU25 현재 시세(원/톤) -->
          <!--   "보유 자산" 이 아니라 "탄소 감축 효과를 KAU 시세로 환산한 누적 가치" 라는 의미 -->
          <div class="border-b border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 px-3 py-3">
            <p class="text-[10px] font-medium text-amber-700/80">탄소 감축량 누적 환산 가치</p>
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
            <p class="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-gray-500">월별 환산 가치 추이</p>
            <div class="relative w-full flex-1" style="min-height: 220px;">
              <BarChart :data="carbonAssetMonthlyData" :options="carbonAssetMonthlyOptions" fill-height />
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
  </AppLayout>
</template>

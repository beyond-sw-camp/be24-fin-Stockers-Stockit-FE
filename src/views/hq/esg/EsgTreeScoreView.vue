<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ArrowLeft, RefreshCw, Leaf, Recycle, ShieldCheck, Heart,
  TrendingUp, Award, Filter, ChevronDown, Sprout, Calendar,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
const auth = useAuthStore()
const topMenus = computed(() => roleMenus.hq ?? [])
const sideMenus = ref([])
const activeSideMenu = ref('')

// ─────────── 점수 룰 마스터 ───────────
const SCORE_RULES = {
  saleBase: 100,             // 판매 1건 기본 점수
  donationBase: 80,          // 기부 1건 기본 점수
  minWeightKg: 10,           // 최소 중량
  newBuyerBonus: 150,
  localPartnerBonus: 150,
  localPartnerMonthlyCap: 3, // 거래처당 월 한도
}
const MATERIAL_FACTORS = {
  COTTON:     { label: '면',     factor: 1.8 },
  POLYESTER:  { label: '폴리에스터', factor: 2.3 },
  NYLON:      { label: '나일론', factor: 2.1 },
  WOOL:       { label: '울',     factor: 2.5 },
  BLEND:      { label: '혼방',   factor: 2.0 },  // 면50:폴리50 비율 분해 평균 mock
}

// ─────────── Mock 이벤트 데이터 (BE 연동 시 GET /api/hq/esg/score/events 로 교체) ───────────
const events = ref([
  // 4월 판매 4건
  { id: 1,  date: '2026-04-27', type: 'sale',     buyer: '신규 D사', material: 'POLYESTER', weightKg: 500, isNewBuyer: true,  isLocalPartner: false, donationType: null,        method: 'RECYCLE' },
  { id: 2,  date: '2026-04-20', type: 'sale',     buyer: '마을협동조합', material: 'BLEND',     weightKg: 300, isNewBuyer: false, isLocalPartner: true,  donationType: null,        method: 'UPCYCLE' },
  { id: 3,  date: '2026-04-15', type: 'sale',     buyer: 'B사',     material: 'COTTON',    weightKg: 250, isNewBuyer: false, isLocalPartner: false, donationType: null,        method: 'RESALE' },
  { id: 4,  date: '2026-04-10', type: 'sale',     buyer: 'A사',     material: 'COTTON',    weightKg: 100, isNewBuyer: false, isLocalPartner: false, donationType: null,        method: 'RESALE' },
  // 4월 기부 4건
  { id: 5,  date: '2026-04-28', type: 'donation', buyer: '재해구호본부',  material: 'COTTON',    weightKg:  95, isNewBuyer: false, isLocalPartner: false, donationType: 'DISASTER',  method: null },
  { id: 6,  date: '2026-04-22', type: 'donation', buyer: '사회복지시설',  material: 'COTTON',    weightKg:  80, isNewBuyer: false, isLocalPartner: false, donationType: 'VULNERABLE',method: null },
  { id: 7,  date: '2026-04-14', type: 'donation', buyer: '해외구호단체',  material: 'POLYESTER', weightKg:  50, isNewBuyer: false, isLocalPartner: false, donationType: 'OVERSEAS',  method: null },
  { id: 8,  date: '2026-04-05', type: 'donation', buyer: '직업학교',      material: 'BLEND',     weightKg:  30, isNewBuyer: false, isLocalPartner: false, donationType: 'EDU',       method: null },
  // 3월 mock (월별 추이용)
  { id: 9,  date: '2026-03-25', type: 'sale',     buyer: 'B사',     material: 'WOOL',      weightKg: 150, isNewBuyer: false, isLocalPartner: false, donationType: null,        method: 'UPCYCLE' },
  { id: 10, date: '2026-03-18', type: 'sale',     buyer: 'C사',     material: 'NYLON',     weightKg: 200, isNewBuyer: true,  isLocalPartner: false, donationType: null,        method: 'RECYCLE' },
  { id: 11, date: '2026-03-12', type: 'donation', buyer: '재해구호본부',  material: 'COTTON',    weightKg:  60, isNewBuyer: false, isLocalPartner: false, donationType: 'DISASTER',  method: null },
  // 2월 mock
  { id: 12, date: '2026-02-28', type: 'sale',     buyer: 'A사',     material: 'COTTON',    weightKg: 180, isNewBuyer: false, isLocalPartner: false, donationType: null,        method: 'RESALE' },
  { id: 13, date: '2026-02-15', type: 'sale',     buyer: '마을협동조합', material: 'BLEND',     weightKg: 220, isNewBuyer: false, isLocalPartner: true,  donationType: null,        method: 'UPCYCLE' },
  // 1월 mock
  { id: 14, date: '2026-01-22', type: 'sale',     buyer: 'A사',     material: 'COTTON',    weightKg:   8, isNewBuyer: false, isLocalPartner: false, donationType: null,        method: 'RESALE' },  // 최소 미달
  { id: 15, date: '2026-01-12', type: 'donation', buyer: '직업학교',      material: 'BLEND',     weightKg:  40, isNewBuyer: false, isLocalPartner: false, donationType: 'EDU',       method: null },
])

// ─────────── 점수 계산 함수 (이벤트 1건 → 분해 점수) ───────────
//   탄소 점수 = 무게(kg) × 소재 계수 × 0.5
//   (×0.5 스케일링 — 거래량 누적에 따른 점수 폭주 방지 / 다른 점수 요소와 비중 균형)
const CARBON_SCALE = 0.5
function calcEventScore(e) {
  const valid = e.weightKg >= SCORE_RULES.minWeightKg
  const factor = MATERIAL_FACTORS[e.material]?.factor ?? 0
  if (e.type === 'sale') {
    if (!valid) return { saleExecution: 0, carbon: 0, newBuyer: 0, localPartner: 0, donationExecution: 0, total: 0, valid: false }
    const saleExecution = SCORE_RULES.saleBase
    const carbon = Math.round(e.weightKg * factor * CARBON_SCALE)
    const newBuyer = e.isNewBuyer ? SCORE_RULES.newBuyerBonus : 0
    const localPartner = e.isLocalPartner ? SCORE_RULES.localPartnerBonus : 0
    const total = saleExecution + carbon + newBuyer + localPartner
    return { saleExecution, carbon, newBuyer, localPartner, donationExecution: 0, total, valid: true }
  }
  // donation
  if (!valid) return { saleExecution: 0, carbon: 0, newBuyer: 0, localPartner: 0, donationExecution: 0, total: 0, valid: false }
  const donationExecution = SCORE_RULES.donationBase
  const carbon = Math.round(e.weightKg * factor * CARBON_SCALE)
  return { saleExecution: 0, carbon, newBuyer: 0, localPartner: 0, donationExecution, total: donationExecution + carbon, valid: true }
}

// ─────────── 필터 ───────────
//   기간 필터: 페이지 전체 (통계/차트/카테고리 합산) 에 영향
//   카테고리 필터: 활동 이력 섹션에만 적용 (5개 점수 요소 + 전체)
const filterPeriod = ref('YEAR')        // YEAR | Q | M
const filterCategory = ref('ALL')       // ALL | saleExecution | carbon | newBuyer | localPartner | donationExecution

// 기간만 적용한 이벤트 (통계/차트/카테고리 합산용)
const filteredEvents = computed(() => {
  const now = new Date()
  const ym = now.getFullYear() * 12 + now.getMonth()
  return events.value.filter(e => {
    const d = new Date(e.date)
    const eYm = d.getFullYear() * 12 + d.getMonth()
    if (filterPeriod.value === 'M') return eYm === ym
    if (filterPeriod.value === 'Q') return eYm >= ym - 2
    return d.getFullYear() === now.getFullYear()  // YEAR
  })
})

// 카테고리 필터까지 적용 — 활동 이력 섹션 전용
const logEvents = computed(() => {
  if (filterCategory.value === 'ALL') return filteredEvents.value
  const key = filterCategory.value
  return filteredEvents.value.filter(e => {
    const s = calcEventScore(e)
    return s[key] > 0
  })
})

// 활동 이력 카테고리 필터 메타 (라벨/색상)
const LOG_FILTERS = [
  { v: 'ALL',               l: '전체',          dot: '#6b7280' },
  { v: 'saleExecution',     l: '판매 실행',     dot: '#10b981' },
  { v: 'carbon',            l: '탄소 감축',     dot: '#14b8a6' },
  { v: 'newBuyer',          l: '신규 확산',     dot: '#3b82f6' },
  { v: 'localPartner',      l: '지역 상생',     dot: '#f59e0b' },
  { v: 'donationExecution', l: '기부 실행',     dot: '#ec4899' },
]

// ─────────── 카테고리 누적 ───────────
const categoryTotals = computed(() => {
  const t = { saleExecution: 0, carbon: 0, newBuyer: 0, localPartner: 0, donationExecution: 0 }
  for (const e of filteredEvents.value) {
    const s = calcEventScore(e)
    t.saleExecution    += s.saleExecution
    t.carbon           += s.carbon
    t.newBuyer         += s.newBuyer
    t.localPartner     += s.localPartner
    t.donationExecution+= s.donationExecution
  }
  return t
})
const totalScore = computed(() =>
  Object.values(categoryTotals.value).reduce((a, b) => a + b, 0),
)

const scoreCategories = computed(() => {
  const t = categoryTotals.value
  const total = totalScore.value || 1
  return [
    { id: 'saleExecution',     label: '순환재고 판매 실행', icon: RefreshCw,   color: '#10b981', barCls: 'bg-emerald-500', points: t.saleExecution,    desc: '판매 1건당 100점 (10kg 이상)' },
    { id: 'carbon',            label: '탄소 감축 기여',     icon: Leaf,        color: '#14b8a6', barCls: 'bg-teal-500',    points: t.carbon,           desc: '무게 × 소재 계수 (판매 + 기부 합산)' },
    { id: 'newBuyer',          label: '순환 거래 확산',     icon: Recycle,     color: '#3b82f6', barCls: 'bg-blue-500',    points: t.newBuyer,         desc: '신규 거래처 첫 거래 +150 (ESG-S)' },
    { id: 'localPartner',      label: '지역 상생',          icon: ShieldCheck, color: '#f59e0b', barCls: 'bg-amber-500',   points: t.localPartner,     desc: '사회적기업/지역 파트너 +150 (월 3건)' },
    { id: 'donationExecution', label: '기부 활동 실행',     icon: Heart,       color: '#ec4899', barCls: 'bg-pink-500',    points: t.donationExecution, desc: '기부 1건당 80점 (10kg 이상)' },
  ].map(c => ({ ...c, pct: total > 0 ? +((c.points / total) * 100).toFixed(1) : 0 }))
})

// ─────────── 통계 ───────────
const stats = computed(() => {
  const evs = filteredEvents.value
  const sales = evs.filter(e => e.type === 'sale')
  const dons = evs.filter(e => e.type === 'donation')
  const totalKg = evs.reduce((s, e) => s + e.weightKg, 0)
  const validEvents = evs.filter(e => e.weightKg >= SCORE_RULES.minWeightKg)
  const invalidEvents = evs.length - validEvents.length
  return {
    saleCount: sales.length,
    donationCount: dons.length,
    totalKg,
    validEvents: validEvents.length,
    invalidEvents,
    avgScore: validEvents.length > 0 ? Math.round(totalScore.value / validEvents.length) : 0,
  }
})

// ─────────── 월별 추이 차트 ───────────
const monthLabels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const monthlyScoresData = computed(() => {
  const buckets = Array(12).fill(0).map(() => ({ sale: 0, donation: 0 }))
  for (const e of events.value) {
    const m = new Date(e.date).getMonth()
    if (new Date(e.date).getFullYear() !== 2026) continue
    const s = calcEventScore(e)
    if (e.type === 'sale') buckets[m].sale += s.total
    else buckets[m].donation += s.total
  }
  return {
    labels: monthLabels,
    datasets: [
      {
        label: '판매',
        data: buckets.map(b => b.sale),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: '#059669',
        borderWidth: 1.5, borderRadius: 4, maxBarThickness: 18, stack: 'pts',
      },
      {
        label: '기부',
        data: buckets.map(b => b.donation),
        backgroundColor: 'rgba(236, 72, 153, 0.85)',
        borderColor: '#db2777',
        borderWidth: 1.5, borderRadius: 4, maxBarThickness: 18, stack: 'pts',
      },
    ],
  }
})
const monthlyScoresOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', align: 'end', labels: { boxWidth: 10, font: { size: 10 } } },
    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} pt` } },
  },
  scales: {
    y: { stacked: true, beginAtZero: true, ticks: { font: { size: 10 }, callback: (v) => v.toLocaleString() }, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { stacked: true, grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

// ─────────── 카테고리 도넛 ───────────
const categoryDoughnutData = computed(() => ({
  labels: scoreCategories.value.map(c => c.label),
  datasets: [{
    data: scoreCategories.value.map(c => c.points),
    backgroundColor: scoreCategories.value.map(c => c.color),
    borderColor: '#ffffff',
    borderWidth: 2,
  }],
}))
const categoryDoughnutOptions = {
  responsive: true, maintainAspectRatio: false, cutout: '60%',
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 6 } },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const total = totalScore.value || 1
          const pct = ((ctx.parsed / total) * 100).toFixed(1)
          return `${ctx.label}: ${ctx.parsed.toLocaleString()} pt (${pct}%)`
        },
      },
    },
  },
}

// ─────────── 활동 이력 (페이지네이션) ───────────
//   logEvents (기간 + 카테고리 필터) 를 정렬·페이징
const sortedEvents = computed(() =>
  [...logEvents.value].sort((a, b) => new Date(b.date) - new Date(a.date)),
)
const pageSize = ref(8)
const page = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(sortedEvents.value.length / pageSize.value)))
const pagedEvents = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return sortedEvents.value.slice(start, start + pageSize.value)
})
function changePage(p) { if (p >= 1 && p <= totalPages.value) page.value = p }

// 통계 위 "유효/미달" 카운트는 기간 필터 기준 (활동 이력 카테고리 필터 영향 X)
const periodValidCount = computed(() => filteredEvents.value.filter(e => calcEventScore(e).valid).length)
const periodInvalidCount = computed(() => filteredEvents.value.length - periodValidCount.value)

// 카테고리 펼침 상세
const expandedId = ref(null)
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id }

// 카테고리별 기여 이벤트 추출 (펼침 시)
function eventsForCategory(catId) {
  return sortedEvents.value
    .map(e => ({ ...e, score: calcEventScore(e) }))
    .filter(e => {
      if (!e.score.valid) return false
      if (catId === 'saleExecution')     return e.score.saleExecution > 0
      if (catId === 'carbon')            return e.score.carbon > 0
      if (catId === 'newBuyer')          return e.score.newBuyer > 0
      if (catId === 'localPartner')      return e.score.localPartner > 0
      if (catId === 'donationExecution') return e.score.donationExecution > 0
      return false
    })
    .map(e => ({
      ...e,
      catPoints:
        catId === 'saleExecution'     ? e.score.saleExecution
        : catId === 'carbon'          ? e.score.carbon
        : catId === 'newBuyer'        ? e.score.newBuyer
        : catId === 'localPartner'    ? e.score.localPartner
        : catId === 'donationExecution' ? e.score.donationExecution
        : 0,
    }))
}

// ─────────── 포맷터 ───────────
const formatNum = (n) => Number(n ?? 0).toLocaleString('ko-KR')
const formatDate = (s) => s.slice(5).replace('-', '.')
const typeLabel = (t) => t === 'sale' ? '판매' : '기부'
const typeCls = (t) => t === 'sale' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-pink-50 text-pink-700 border-pink-200'

// 페이지 로드
const loading = ref(false)
async function reload() {
  loading.value = true
  try { await new Promise(r => setTimeout(r, 100)) } finally { loading.value = false }
}
onMounted(reload)
</script>

<template>
  <AppLayout
    active-top-menu="ESG"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <!-- ───────── 헤더 ───────── -->
      <div class="flex items-end justify-between">
        <div>
          <button
            type="button"
            class="mb-2 inline-flex items-center gap-1.5 border border-[#004D3C]/30 bg-[#eef7f4] px-3 py-1.5 text-[12px] font-bold text-[#004D3C] transition hover:bg-[#004D3C] hover:text-white"
            @click="router.push('/hq/esg')"
          >
            <ArrowLeft :size="14" />
            ESG 대시보드로 돌아가기
          </button>
          <h1 class="inline-flex items-center gap-2 text-[20px] font-bold text-gray-900">
            <Sprout :size="22" class="text-emerald-600" />
            친환경 나무 키우기 점수
          </h1>
          <p class="mt-0.5 text-[12px] text-gray-500">
            순환재고 판매·기부 활동 1건마다 적립되는 ESG 점수 — 5종 점수 요소 합산
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- 필터 -->
          <div class="inline-flex items-center gap-1 border border-gray-300 bg-white p-0.5">
            <button
              v-for="f in [{v:'M',l:'이번 달'},{v:'Q',l:'최근 3개월'},{v:'YEAR',l:'올해'}]"
              :key="f.v"
              type="button"
              class="px-2.5 py-1 text-[11px] font-medium transition"
              :class="filterPeriod === f.v ? 'bg-[#004D3C] text-white' : 'text-gray-600 hover:bg-gray-50'"
              @click="filterPeriod = f.v"
            >
              {{ f.l }}
            </button>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50"
            @click="reload"
            :disabled="loading"
          >
            <RefreshCw :size="13" :class="{ 'animate-spin': loading }" />
            새로고침
          </button>
        </div>
      </div>

      <!-- ───────── 1. 총점 + 통계 ───────── -->
      <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div class="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm xl:col-span-2">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-700/70">
            <Award :size="13" /> 누적 ESG 점수
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-[40px] font-black leading-none text-emerald-700">{{ formatNum(totalScore) }}</span>
            <span class="text-[14px] font-bold text-emerald-600">pt</span>
          </div>
          <p class="mt-2 text-[11px] text-emerald-700/70">
            🌳 {{ Math.floor(totalScore / 1000) }}그루의 나무를 키우는 효과
            <span class="ml-1 text-gray-500">(1,000 pt = 1그루 환산 mock)</span>
          </p>
        </div>

        <div class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">판매 건수</p>
          <p class="mt-1 text-[22px] font-black text-emerald-700">{{ stats.saleCount }}</p>
          <p class="mt-0.5 text-[10px] text-gray-500">건 (≥10kg)</p>
        </div>
        <div class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">기부 건수</p>
          <p class="mt-1 text-[22px] font-black text-pink-700">{{ stats.donationCount }}</p>
          <p class="mt-0.5 text-[10px] text-gray-500">건 (≥10kg)</p>
        </div>
        <div class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">총 처리 무게</p>
          <p class="mt-1 text-[22px] font-black text-gray-800">{{ formatNum(stats.totalKg) }}</p>
          <p class="mt-0.5 text-[10px] text-gray-500">kg / 평균 {{ formatNum(stats.avgScore) }} pt/건</p>
        </div>
      </section>

      <!-- ───────── 2. 카테고리 도넛 + 월별 추이 ───────── -->
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">카테고리별 비중</h2>
            <p class="text-[10px] text-gray-500">5종 점수 요소 — {{ filterPeriod === 'M' ? '이번 달' : filterPeriod === 'Q' ? '최근 3개월' : '올해' }}</p>
          </div>
          <div class="p-4" style="height: 280px;">
            <DoughnutChart :data="categoryDoughnutData" :options="categoryDoughnutOptions" />
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">월별 점수 추이</h2>
            <p class="text-[10px] text-gray-500">판매 / 기부 누적 (스택)</p>
          </div>
          <div class="p-4" style="height: 280px;">
            <BarChart :data="monthlyScoresData" :options="monthlyScoresOptions" />
          </div>
        </article>
      </section>

      <!-- ───────── 3. 5종 카테고리 카드 (확장 가능) ───────── -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-4 py-3">
          <h2 class="text-[14px] font-bold text-gray-800">점수 요소 상세</h2>
          <p class="text-[10px] text-gray-400">각 카테고리를 클릭하면 기여 이벤트 목록을 펼쳐 볼 수 있습니다</p>
        </div>
        <div class="divide-y divide-gray-100">
          <div v-for="cat in scoreCategories" :key="cat.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              @click="toggleExpand(cat.id)"
            >
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <component :is="cat.icon" :size="16" :style="{ color: cat.color }" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline gap-2">
                  <span class="text-[13px] font-bold text-gray-800">{{ cat.label }}</span>
                  <span class="text-[10px] text-gray-400">{{ cat.desc }}</span>
                </div>
                <div class="mt-1.5 flex items-center gap-2">
                  <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div class="h-full rounded-full" :class="cat.barCls" :style="{ width: cat.pct + '%' }" />
                  </div>
                  <span class="shrink-0 text-[10px] text-gray-400">{{ cat.pct }}%</span>
                </div>
              </div>
              <div class="shrink-0 text-right">
                <span class="text-[18px] font-black text-gray-900">+{{ formatNum(cat.points) }}</span>
                <span class="ml-0.5 text-[10px] text-gray-400">pt</span>
              </div>
              <ChevronDown :size="14" class="shrink-0 text-gray-400 transition-transform" :class="expandedId === cat.id ? 'rotate-180' : ''" />
            </button>

            <div v-if="expandedId === cat.id" class="border-t border-gray-100 bg-gray-50 px-4 py-3">
              <p v-if="!eventsForCategory(cat.id).length" class="py-3 text-center text-[12px] text-gray-400">
                해당 카테고리에 기여한 이벤트가 없습니다
              </p>
              <table v-else class="w-full text-[12px]">
                <thead>
                  <tr class="text-[10px] uppercase text-gray-400">
                    <th class="pb-1.5 text-left font-medium">일자</th>
                    <th class="pb-1.5 text-left font-medium">유형</th>
                    <th class="pb-1.5 text-left font-medium">대상/거래처</th>
                    <th class="pb-1.5 text-left font-medium">소재 · 무게</th>
                    <th class="pb-1.5 text-right font-medium">기여 점수</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="e in eventsForCategory(cat.id)" :key="e.id">
                    <td class="py-1.5 font-mono text-gray-600">{{ formatDate(e.date) }}</td>
                    <td class="py-1.5">
                      <span class="inline-flex items-center border px-1.5 py-0.5 text-[9px] font-bold" :class="typeCls(e.type)">
                        {{ typeLabel(e.type) }}
                      </span>
                    </td>
                    <td class="py-1.5 text-gray-700">{{ e.buyer }}</td>
                    <td class="py-1.5 text-gray-500">
                      {{ MATERIAL_FACTORS[e.material]?.label }} · {{ formatNum(e.weightKg) }} kg
                    </td>
                    <td class="py-1.5 text-right font-bold text-emerald-700">+{{ formatNum(e.catPoints) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- ───────── 4. 활동 이력 (전체 + 페이지네이션) ───────── -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="inline-flex items-center gap-2 text-[14px] font-bold text-gray-800">
              <Calendar :size="14" class="text-[#004D3C]" />
              활동 이력
            </h2>
            <p class="text-[10px] text-gray-500">이벤트 1건 = 1행 · 점수 분해 표시 · 5개 점수 요소별 필터링 가능</p>
          </div>
          <div class="inline-flex flex-wrap items-center gap-1 border border-gray-300 bg-white p-0.5">
            <button
              v-for="f in LOG_FILTERS"
              :key="f.v"
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition"
              :class="filterCategory === f.v ? 'bg-[#004D3C] text-white' : 'text-gray-600 hover:bg-gray-50'"
              @click="filterCategory = f.v; page = 1"
            >
              <span
                class="inline-block h-2 w-2 rounded-full"
                :style="{ backgroundColor: filterCategory === f.v ? '#ffffff' : f.dot }"
              ></span>
              {{ f.l }}
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-[12px]">
            <thead class="border-b border-gray-200 bg-gray-50">
              <tr>
                <th class="px-3 py-2 font-bold text-gray-600">일자</th>
                <th class="px-3 py-2 text-center font-bold text-gray-600">유형</th>
                <th class="px-3 py-2 font-bold text-gray-600">거래처/대상</th>
                <th class="px-3 py-2 font-bold text-gray-600">소재</th>
                <th class="px-3 py-2 text-right font-bold text-gray-600">무게</th>
                <th class="px-3 py-2 font-bold text-gray-600">점수 분해</th>
                <th class="px-3 py-2 text-right font-bold text-emerald-700">총점</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in pagedEvents" :key="e.id" class="border-b border-gray-100 last:border-0" :class="{ 'opacity-50': !calcEventScore(e).valid }">
                <td class="px-3 py-2 font-mono text-gray-700">{{ formatDate(e.date) }}</td>
                <td class="px-3 py-2 text-center">
                  <span class="inline-flex items-center border px-2 py-0.5 text-[10px] font-bold" :class="typeCls(e.type)">
                    {{ typeLabel(e.type) }}
                  </span>
                </td>
                <td class="px-3 py-2 text-gray-800">{{ e.buyer }}</td>
                <td class="px-3 py-2 text-gray-600">
                  {{ MATERIAL_FACTORS[e.material]?.label }}
                  <span class="text-[10px] text-gray-400">×{{ MATERIAL_FACTORS[e.material]?.factor }}</span>
                </td>
                <td class="px-3 py-2 text-right font-mono text-gray-700">{{ formatNum(e.weightKg) }} kg</td>
                <td class="px-3 py-2 text-[10.5px] text-gray-500">
                  <template v-if="calcEventScore(e).valid">
                    <span v-if="calcEventScore(e).saleExecution"
                          :class="filterCategory === 'saleExecution' ? 'font-black text-emerald-700' : ''">
                      실행 {{ calcEventScore(e).saleExecution }}
                    </span>
                    <span v-if="calcEventScore(e).donationExecution"
                          :class="filterCategory === 'donationExecution' ? 'font-black text-pink-700' : ''">
                      실행 {{ calcEventScore(e).donationExecution }}
                    </span>
                    <span v-if="calcEventScore(e).carbon"
                          :class="filterCategory === 'carbon' ? 'font-black text-teal-700' : ''">
                      + 탄소 {{ formatNum(calcEventScore(e).carbon) }}
                    </span>
                    <span v-if="calcEventScore(e).newBuyer"
                          :class="filterCategory === 'newBuyer' ? 'font-black text-blue-700' : 'text-blue-600'">
                      + 신규 {{ calcEventScore(e).newBuyer }}
                    </span>
                    <span v-if="calcEventScore(e).localPartner"
                          :class="filterCategory === 'localPartner' ? 'font-black text-amber-700' : 'text-amber-600'">
                      + 지역 {{ calcEventScore(e).localPartner }}
                    </span>
                  </template>
                  <span v-else class="italic text-red-500">최소 10kg 미달 — 점수 부여 없음</span>
                </td>
                <td class="px-3 py-2 text-right">
                  <div class="font-black"
                       :class="calcEventScore(e).valid ? 'text-emerald-700' : 'text-gray-400'">
                    +{{ formatNum(calcEventScore(e).total) }}
                  </div>
                  <div v-if="filterCategory !== 'ALL' && calcEventScore(e).valid"
                       class="mt-0.5 text-[9px] text-gray-500">
                    이 항목 기여 <span class="font-bold">+{{ formatNum(calcEventScore(e)[filterCategory] || 0) }}</span>
                  </div>
                </td>
              </tr>
              <tr v-if="!pagedEvents.length">
                <td colspan="7" class="px-3 py-6 text-center text-[12px] text-gray-400">기간/유형에 해당하는 활동이 없습니다</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 페이지네이션 -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px]">
          <span class="text-gray-500">
            <template v-if="filterCategory === 'ALL'">
              총 {{ sortedEvents.length }}건 ·
              유효 {{ periodValidCount }}건 / 미달 {{ periodInvalidCount }}건
            </template>
            <template v-else>
              <span class="font-bold text-[#004D3C]">
                {{ LOG_FILTERS.find(f => f.v === filterCategory)?.l }}
              </span>
              에 기여한 이벤트 <strong>{{ sortedEvents.length }}</strong>건 표시 중
              <span class="text-gray-400">(기간 내 전체 {{ filteredEvents.length }}건)</span>
            </template>
          </span>
          <div v-if="totalPages > 1" class="inline-flex items-center gap-1">
            <button
              v-for="p in totalPages"
              :key="p"
              type="button"
              class="h-7 min-w-[28px] border border-gray-300 px-2 text-[11px] font-medium transition"
              :class="p === page ? 'bg-[#004D3C] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
              @click="changePage(p)"
            >
              {{ p }}
            </button>
          </div>
        </div>
      </section>

      <!-- ───────── 5. 룰 안내 ───────── -->
      <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div class="border-l-2 border-emerald-300 bg-emerald-50/50 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-900/80">
          <span class="font-bold">ⓘ 점수 요소 (순환재고 판매 1건):</span>
          ① 실행 100점 (≥10kg) ② 탄소 = 무게 × 소재 계수 × 0.5
          ③ 신규 거래처 첫 거래 +150 ④ 사회적기업/지역 파트너 +150 (월 3건 한도)
        </div>
        <div class="border-l-2 border-pink-300 bg-pink-50/50 px-3 py-2.5 text-[11px] leading-relaxed text-pink-900/80">
          <span class="font-bold">ⓘ 점수 요소 (기부 1건):</span>
          ⑤ 실행 80점 (≥10kg) ② 탄소 = 무게 × 소재 계수 × 0.5 (혼방은 비율 분해 평균)
        </div>
      </div>

      <div class="border-l-2 border-gray-300 bg-gray-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-gray-700">
        <span class="font-bold">ⓘ 소재별 탄소 계수 (kgCO₂/kg) × 0.5 스케일:</span>
        면 1.8 · 폴리에스터 2.3 · 나일론 2.1 · 울 2.5 · 혼방 2.0 (구성 비율 분해 평균)
        <span class="ml-1 text-gray-500">— 0.5 스케일 적용은 거래량 누적에 따른 점수 폭주 방지·다른 점수 요소와의 비중 균형 목적</span>
      </div>
    </div>
  </AppLayout>
</template>

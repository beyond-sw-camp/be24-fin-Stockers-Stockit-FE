<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, RefreshCw, Leaf, Recycle, ShieldCheck,
  TrendingUp, Award, Filter, Sprout, Calendar,
  Info, X, Heart,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import EsgTreeWidget from '@/components/common/EsgTreeWidget.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEsgStore } from '@/stores/esg.js'
import { scoreEventsApi } from '@/api/hq/esg.js'
import { extractErrorMessage } from '@/api/axios.js'
const router = useRouter()
const auth = useAuthStore()
const topMenus = computed(() => roleMenus.hq ?? [])
const sideMenus = computed(
  () => (roleMenus.hq ?? []).find((menu) => menu.label === 'ESG 탄소 성과 관리')?.children ?? [],
)
const activeSideMenu = ref('친환경 나무 키우기 점수')

// Phase 1 BE 이관 후: 산식·factor 모두 BE 에서 처리. 본 객체는 화면 표시용
// (테이블 소재명 라벨 + 안내 모달의 factor/note 표) 로만 사용.
// note 는 BE 응답에 없는 보조 텍스트라 FE 에만 유지.
const MATERIAL_FACTORS = {
  COTTON:     { label: '면',         group: 'NATURAL_SINGLE', factor: 1.8, note: '' },
  WOOL:       { label: '울',         group: 'NATURAL_SINGLE', factor: 1.2, note: '' },
  CASHMERE:   { label: '캐시미어',   group: 'NATURAL_SINGLE', factor: 1.3, note: '' },
  SILK:       { label: '실크',       group: 'NATURAL_SINGLE', factor: 1.3, note: '' },
  LINEN:      { label: '린넨',       group: 'NATURAL_SINGLE', factor: 1.7, note: '' },
  POLYESTER:  { label: '폴리에스터', group: 'SYNTHETIC',      factor: 2.3, note: '' },
  ACRYLIC:    { label: '아크릴',     group: 'SYNTHETIC',      factor: 2.4, note: '' },
  POLYAMIDE:  { label: '나일론',     group: 'SYNTHETIC',      factor: 2.5, note: '' },
  NYLON:      { label: '나일론',     group: 'SYNTHETIC',      factor: 2.5, note: 'POLYAMIDE 별칭' },
  ELASTANE:   { label: '스판덱스',   group: 'SYNTHETIC',      factor: 2.2, note: '' },
  BLEND:      { label: '혼방',       group: 'BLEND',          factor: 2.0, note: '소재 2종 이상 혼합 시 일괄 적용' },
}

// 소재 계수 안내 모달
const showFactorModal = ref(false)
function openFactorModal()  { showFactorModal.value = true }
function closeFactorModal() { showFactorModal.value = false }

// 점수 산정 안내 모달
const showScoreRuleModal = ref(false)
function openScoreRuleModal()  { showScoreRuleModal.value = true }
function closeScoreRuleModal() { showScoreRuleModal.value = false }

// 점수 산정 안내 표시용 룰 (5종 + 공통 조건)
// ⚠️ donation 항목은 BE 미지원 — FE 데모용 안내 표시만
const SCORE_RULE_ROWS = [
  {
    id: 'saleExecution',
    label: '순환재고 판매 실행',
    base: '판매 1건 = 100점',
    cond: '최소 10kg 이상 판매 시',
    detail: '판매 행동 자체에 부여되는 기본 점수. 너무 적게 팔면 점수 미부여 (어뷰징 방지).',
    barCls: 'bg-emerald-500',
  },
  {
    id: 'carbon',
    label: '탄소 감축 기여',
    base: '무게(kg) × 소재 계수',
    cond: '판매 활동',
    detail: '폐기·소각되지 않고 판매된 재고에 대한 실제 탄소 감축량 환산 점수. 혼방(소재 2종 이상)은 구성 소재 무관하게 일괄 2.0 계수 적용.',
    barCls: 'bg-teal-500',
  },
  {
    id: 'newBuyer',
    label: '순환 거래 확산',
    base: '+150점 (1회)',
    cond: '신규 거래처 첫 거래 시',
    detail: 'buyerId 기준 과거 순환 판매 이력 0건일 때만 부여 (ESG-S). 신규 파트너 발굴 인센티브로 소각 대체 채널 확장 유도.',
    barCls: 'bg-blue-500',
  },
  {
    id: 'localPartner',
    label: '지역 상생',
    base: '+150점',
    cond: '사회적기업·지역 파트너 거래 시 (월 3건 상한)',
    detail: '지역 기반 소규모 파트너 / 사회적 기업과의 거래에 부여 (ESG-S). 거래처당 월 3건 상한으로 어뷰징 방지.',
    barCls: 'bg-amber-500',
  },
  {
    id: 'donation',
    label: '기부',
    base: '기부 1건 = 100점 + (무게 × 소재 계수)',
    cond: '최소 10kg 이상 기부 시 (ESG-S)',
    detail: '소각되지 않고 기부된 재고에 대한 사회적 가치 환산 점수. 기본 실행 100점 + 탄소 감축 환산 (판매와 동일 산식). 자선기부단체·구호단체와의 연계 거래.',
    barCls: 'bg-pink-500',
  },
]

// 모달 표시용 소재 리스트 — BE material 시드 (Phase 1) 와 동일 (NYLON 은 POLYAMIDE 의 FE 별칭이라 제외)
const MATERIAL_FACTOR_ROWS = [
  { code: 'COTTON',     ...MATERIAL_FACTORS.COTTON },
  { code: 'WOOL',       ...MATERIAL_FACTORS.WOOL },
  { code: 'CASHMERE',   ...MATERIAL_FACTORS.CASHMERE },
  { code: 'SILK',       ...MATERIAL_FACTORS.SILK },
  { code: 'LINEN',      ...MATERIAL_FACTORS.LINEN },
  { code: 'POLYESTER',  ...MATERIAL_FACTORS.POLYESTER },
  { code: 'ACRYLIC',    ...MATERIAL_FACTORS.ACRYLIC },
  { code: 'POLYAMIDE',  ...MATERIAL_FACTORS.POLYAMIDE },
  { code: 'ELASTANE',   ...MATERIAL_FACTORS.ELASTANE },
  { code: 'BLEND',      ...MATERIAL_FACTORS.BLEND },
]
const MATERIAL_GROUP_LABEL = {
  NATURAL_SINGLE: '천연 단일',
  SYNTHETIC:      '합성',
  BLEND:          '혼방',
}

// ─────────── 활동 이력 카테고리 필터 ───────────
// ALL | saleExecution | carbon | newBuyer | localPartner — BE 동일 enum
const filterCategory = ref('ALL')

// 카테고리 필터 메타 (라벨/색상)
const LOG_FILTERS = [
  { v: 'ALL',               l: '전체',          dot: '#6b7280' },
  { v: 'saleExecution',     l: '판매 실행',     dot: '#10b981' },
  { v: 'carbon',            l: '탄소 감축',     dot: '#14b8a6' },
  { v: 'newBuyer',          l: '신규 확산',     dot: '#3b82f6' },
  { v: 'localPartner',      l: '지역 상생',     dot: '#f59e0b' },
  { v: 'donationExecution', l: '기부',          dot: '#ec4899' },
]
// 단일 카테고리 필터 시 점수 분해/총점 컬럼 라벨 & 텍스트 색상
const FILTER_BREAKDOWN_META = {
  saleExecution:     { label: '판매 실행', cls: 'text-emerald-700' },
  carbon:            { label: '탄소 감축', cls: 'text-teal-700' },
  newBuyer:          { label: '신규 확산', cls: 'text-blue-700' },
  localPartner:      { label: '지역 상생', cls: 'text-amber-700' },
  donationExecution: { label: '기부',      cls: 'text-pink-700' },
}

// ─────────── BE 응답 통째 보관 (Phase 3 — A''-1 서버 페이징/통계) ───────────
//   응답: { year, events(페이지 슬라이스), summary, monthlyBreakdown, categoryBreakdown, page, size, totalElements, totalPages }
const responseData = ref(null)
const loadEventsError = ref('')

/** BE event row 1건을 FE 표시용으로 정규화 (필드명 quirk 흡수) */
function normalizeSaleEvent(e) {
  return {
    id: e.id,
    date: e.date,
    type: e.type ?? (e.saleType ?? 'SALE').toLowerCase(),
    saleType: e.saleType ?? 'SALE',
    buyer: e.buyer ?? e.doneeName ?? '-',
    material: e.material,
    weightKg: e.weightKg,
    // Jackson+Lombok 직렬화 quirk: isXxx → "xxx" 로 직렬화될 수 있음. 양쪽 모두 수용.
    isNewBuyer: e.isNewBuyer ?? e.newBuyer ?? false,
    isLocalPartner: e.isLocalPartner ?? e.localPartner ?? false,
    mainMaterialCode: e.mainMaterialCode ?? null,
    mainMaterialRatio: e.mainMaterialRatio != null ? Number(e.mainMaterialRatio) : null,
    // BE 가 계산한 거래별 점수 4종 (그대로 사용 — FE 자체 산식 폐기)
    saleExecution: e.saleExecution ?? 0,
    carbon:        e.carbon        ?? 0,
    newBuyer:      e.newBuyer      ?? 0,
    localPartner:  e.localPartner  ?? 0,
    donationExecution: e.donationExecution ?? 0,
    total:         e.total         ?? 0,
    scoreValid:    e.scoreValid    === true,
  }
}

// 화면에 보여줄 이벤트 = BE 응답의 페이지 슬라이스 (정렬도 BE 가 id DESC 로 처리)
const pagedEvents = computed(() =>
  (responseData.value?.events ?? []).map(normalizeSaleEvent)
)

// BE summary — KPI/통계
const summary = computed(() => responseData.value?.summary ?? {
  totalScore: 0, saleExecutionSum: 0, carbonSum: 0, newBuyerSum: 0, localPartnerSum: 0, donationExecutionSum: 0,
  totalEventCount: 0, validEventCount: 0, totalKg: 0, avgScore: 0,
})

// BE categoryBreakdown — 도넛 차트 & 점수 요소 리스트
const categoryBreakdown = computed(() => responseData.value?.categoryBreakdown ?? {
  saleExecution: 0, carbon: 0, newBuyer: 0, localPartner: 0, donationExecution: 0,
})

// 총점 (도넛/헤더에서 사용)
const totalScore = computed(() => Number(summary.value.totalScore || 0))

// ESG 대시보드 헤더와 누적 점수/판매량 동기화
const esgStore = useEsgStore()
watch(totalScore,            (n) => esgStore.setTotalPoints(n),  { immediate: true })
watch(() => summary.value.totalKg, (n) => esgStore.setTotalSalesKg(Number(n || 0)), { immediate: true })

const scoreCategories = computed(() => {
  const t = categoryBreakdown.value
  const cats = [
    { id: 'saleExecution', label: '순환재고 판매 실행', icon: RefreshCw,   color: '#10b981', barCls: 'bg-emerald-500', points: t.saleExecution, desc: '판매 1건당 100점 (10kg 이상)' },
    { id: 'carbon',        label: '탄소 감축 기여',     icon: Leaf,        color: '#14b8a6', barCls: 'bg-teal-500',    points: t.carbon,        desc: '무게 × 소재 계수 (판매 + 기부)' },
    { id: 'newBuyer',      label: '순환 거래 확산',     icon: Recycle,     color: '#3b82f6', barCls: 'bg-blue-500',    points: t.newBuyer,      desc: '신규 거래처 첫 거래 +150 (ESG-S)' },
    { id: 'localPartner',  label: '지역 상생',          icon: ShieldCheck, color: '#f59e0b', barCls: 'bg-amber-500',   points: t.localPartner,  desc: '사회적기업/지역 파트너 +150 (월 3건 제한)' },
    { id: 'donation',      label: '기부',               icon: Heart,       color: '#ec4899', barCls: 'bg-pink-500',    points: t.donationExecution ?? 0, desc: '기부 1건당 100점 + 탄소 환산 (10kg 이상)' },
  ]
  // 5개 카드 점수 합계를 분모로 사용 → 도넛/진행바 비율 내적 일관성 확보
  const total = cats.reduce((sum, c) => sum + (c.points || 0), 0) || 1
  return cats.map(c => ({ ...c, pct: total > 0 ? +((c.points / total) * 100).toFixed(1) : 0 }))
})

// stats — 상단 KPI 카드 표시용 (BE summary 직접 사용)
const stats = computed(() => ({
  saleCount: Number(summary.value.totalEventCount || 0),
  totalKg:   Number(summary.value.totalKg || 0),
  validEvents:   Number(summary.value.validEventCount || 0),
  invalidEvents: Number(summary.value.totalEventCount || 0) - Number(summary.value.validEventCount || 0),
  avgScore:  Number(summary.value.avgScore || 0),
}))

// ─────────── 월별 추이 차트 — BE monthlyBreakdown 사용 ───────────
const monthLabels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const monthlyScoresData = computed(() => {
  // BE 응답 [{month:1, score:n}, ... 12개]. 누락 대비 12-bucket 안전 채움.
  const buckets = Array(12).fill(0)
  for (const row of (responseData.value?.monthlyBreakdown ?? [])) {
    const m = Number(row.month)
    if (m >= 1 && m <= 12) buckets[m - 1] = Number(row.score || 0)
  }
  return {
    labels: monthLabels,
    datasets: [{
      label: '월별 점수',
      data: buckets,
      backgroundColor: 'rgba(16, 185, 129, 0.85)',
      borderColor: '#059669',
      borderWidth: 1.5, borderRadius: 4, maxBarThickness: 18,
    }],
  }
})
const monthlyScoresOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y.toLocaleString()} pt` } },
  },
  scales: {
    y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: (v) => v.toLocaleString() }, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
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

// ─────────── 활동 이력 페이지네이션 (서버 페이징) ───────────
const pageSize = ref(20)
const page = ref(1)        // UI 는 1-based 유지. BE 호출 시 -1 변환.
const totalElements = computed(() => Number(responseData.value?.totalElements || 0))
const totalPages    = computed(() => Math.max(1, Number(responseData.value?.totalPages || 1)))

/**
 * 화살표 페이지네이션 — 현재 페이지를 중심으로 최대 5개 번호만 표시.
 *  - totalPages ≤ 5: 전체 표시
 *  - cur ≤ 3: [1, 2, 3, 4, 5]
 *  - cur ≥ total-2: 마지막 5개
 *  - 그 외: [cur-2, cur-1, cur, cur+1, cur+2]
 */
const PAGE_WINDOW = 5
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = page.value
  if (total <= PAGE_WINDOW) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  let start
  if (cur <= 3) {
    start = 1
  } else if (cur >= total - 2) {
    start = total - PAGE_WINDOW + 1
  } else {
    start = cur - 2
  }
  return Array.from({ length: PAGE_WINDOW }, (_, i) => start + i)
})

const PAGE_JUMP = 5
function changePage(p) {
  // 서버 totalPages 기반으로 클램프. 동일 페이지면 재호출 방지.
  const clamped = Math.max(1, Math.min(totalPages.value, p))
  if (clamped === page.value) return
  page.value = clamped
}
function goJumpBack()    { changePage(page.value - PAGE_JUMP) }
function goPrev()        { changePage(page.value - 1) }
function goNext()        { changePage(page.value + 1) }
function goJumpForward() { changePage(page.value + PAGE_JUMP) }

// ─────────── 포맷터 ───────────
const formatNum = (n) => Number(n ?? 0).toLocaleString('ko-KR')
const formatDate = (s) => s.slice(5).replace('-', '.')
const typeLabel = () => '판매'
const typeCls = () => 'bg-emerald-50 text-emerald-700 border-emerald-200'

// ─────────── BE 호출 ───────────
const loading = ref(false)

/** 현재 page/filterCategory 기준으로 BE 호출. 카테고리 변경 시엔 page=1 로 리셋해서 호출. */
async function loadEvents() {
  loadEventsError.value = ''
  try {
    const targetYear = new Date().getFullYear()
    const res = await scoreEventsApi.get({
      year: targetYear,
      page: page.value - 1,        // FE 1-based → BE 0-based 변환
      size: pageSize.value,
      category: filterCategory.value,
    })
    responseData.value = res
    // BE 가 page 를 clamp 했을 수 있어 (요청 page 가 totalPages 초과) FE 도 보정.
    const beTotalPages = Math.max(1, Number(res?.totalPages || 1))
    if (page.value > beTotalPages) page.value = beTotalPages
  } catch (err) {
    loadEventsError.value = extractErrorMessage(err, '점수 이벤트를 불러오지 못했습니다.')
    responseData.value = null
  }
}

async function reload() {
  loading.value = true
  try { await loadEvents() } finally { loading.value = false }
}

// 페이지 이동 / 카테고리 변경 시 BE 재호출
watch(page, () => { loadEvents() })
watch(filterCategory, () => {
  // 필터 변경 시 첫 페이지로 — page watch 가 안 트리거되면 직접 loadEvents 호출
  if (page.value !== 1) page.value = 1
  else loadEvents()
})

onMounted(reload)
</script>

<template>
  <AppLayout
    active-top-menu="ESG 탄소 성과 관리"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <!-- ───────── 헤더 (돌아가기 버튼 + 제목 가로 배치, 그라데이션 카드) ───────── -->
      <div class="overflow-hidden rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-white to-sky-50 shadow-sm">
        <div class="flex items-center justify-between gap-4 px-4 py-3">
          <!-- 좌측: 돌아가기 버튼 + 구분선 + 제목 가로 정렬 -->
          <div class="flex items-center gap-3 min-w-0">
            <button
              type="button"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#004D3C]/30 bg-white/80 px-3 py-1.5 text-[12px] font-bold text-[#004D3C] backdrop-blur transition hover:bg-[#004D3C] hover:text-white"
              @click="router.push('/hq/esg')"
            >
              <ArrowLeft :size="14" />
              ESG 대시보드로 돌아가기
            </button>
            <!-- 세로 구분선 -->
            <div class="h-9 w-px shrink-0 bg-emerald-300/60"></div>
            <!-- 둥근 아이콘 + 제목 + 부제 -->
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 ring-1 ring-emerald-300/50">
                <Sprout :size="22" class="text-emerald-700" />
              </div>
              <div class="min-w-0">
                <h1 class="text-[18px] font-bold leading-tight text-gray-900">
                  친환경 나무 키우기 점수
                </h1>
                <p class="mt-0.5 truncate text-[11px] text-gray-500">
                  순환재고 판매 활동 1건마다 적립되는 ESG 점수 — 5종 점수 요소 합산
                </p>
              </div>
            </div>
          </div>
          <!-- 우측: ESG 활동 뱃지 (md 이상에서만 표시) -->
          <div class="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1.5 ring-1 ring-emerald-600/20 md:inline-flex">
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
            <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-700">ESG 누적</span>
          </div>
        </div>
      </div>

      <!-- ───────── 1. 총점 + 통계 ───────── -->
      <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm xl:col-span-2">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-700/70">
            <Award :size="13" /> 누적 ESG 점수
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <span class="text-[40px] font-black leading-none text-emerald-700">{{ formatNum(totalScore) }}</span>
            <span class="text-[14px] font-bold text-emerald-600">pt</span>
          </div>
          <p class="mt-2 text-[11px] text-emerald-700/70">
            🌳 {{ esgStore.treeCount.toLocaleString() }}그루의 나무를 키웠습니다!
            <span class="ml-1 text-gray-500">(Lv.10 만점 1,500,000pt + 결실 익는 보너스 500,000pt = 2,000,000pt 마다 1그루 + Lv.1 씨앗 재시작)</span>
          </p>
        </div>

        <div class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">순환재고 판매 건수</p>
          <p class="mt-1 text-[22px] font-black text-emerald-700">{{ stats.saleCount }}</p>
          <p class="mt-0.5 text-[10px] text-gray-500">건 (≥10kg)</p>
        </div>
        <div class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400">총 순환재고 판매량</p>
          <p class="mt-1 flex items-baseline gap-1">
            <span class="text-[22px] font-black text-gray-800">{{ formatNum(stats.totalKg) }}</span>
            <span class="text-[11px] font-medium text-gray-500">kg</span>
          </p>
        </div>
      </section>

      <!-- ───────── 2. 카테고리 + 월별 추이 + 점수 요소 + ESG 나무 (2행 그리드) ───────── -->
      <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_13rem]">
        <!-- (1,1) 카테고리별 비중 -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">카테고리별 비중</h2>
            <p class="text-[10px] text-gray-500">5종 점수 요소 — 올해</p>
          </div>
          <div class="min-h-[240px] flex-1 p-4">
            <DoughnutChart :data="categoryDoughnutData" :options="categoryDoughnutOptions" />
          </div>
        </article>

        <!-- (1,2) 월별 점수 추이 -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">월별 점수 추이</h2>
            <p class="text-[10px] text-gray-500">판매 점수 누적</p>
          </div>
          <div class="min-h-[240px] flex-1 p-4">
            <BarChart :data="monthlyScoresData" :options="monthlyScoresOptions" />
          </div>
        </article>

        <!-- (1,3)~(2,3) ESG 나무 (2행 세로 병합) -->
        <aside class="hidden self-stretch xl:flex xl:flex-col xl:row-span-2">
          <EsgTreeWidget :expanded="true" />
        </aside>

        <!-- (2,1)~(2,2) 점수 요소 (2열 가로 병합) -->
        <article class="flex min-w-0 flex-col border border-gray-300 bg-white shadow-sm md:col-span-2 xl:col-span-2">
          <div class="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
            <div>
              <h2 class="text-[14px] font-bold text-gray-800">점수 요소</h2>
              <p class="text-[10px] text-gray-400">5종 점수 요소별 누적 점수와 비중</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center gap-1 border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                @click="openScoreRuleModal"
              >
                <Info :size="13" />
                점수 산정 안내
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-1 border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                @click="openFactorModal"
              >
                <Info :size="13" />
                소재 계수 안내
              </button>
            </div>
          </div>
          <div class="flex-1 divide-y divide-gray-100">
            <div
              v-for="cat in scoreCategories"
              :key="cat.id"
              class="flex items-center gap-3 px-4 py-3"
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
            </div>
          </div>
        </article>
      </section>

      <!-- ───────── 3. 활동 이력 (전체 + 페이지네이션) ───────── -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="inline-flex items-center gap-2 text-[14px] font-bold text-gray-800">
              <Calendar :size="14" class="text-[#004D3C]" />
              활동 이력
            </h2>
            <p class="text-[10px] text-gray-500">이벤트 1건 = 1행 · 점수 분해 표시 · 4개 점수 요소별 필터링 가능</p>
          </div>
          <div class="inline-flex items-center gap-2">
            <Filter :size="13" class="text-gray-500" />
            <!-- 카테고리 변경은 watch(filterCategory) 가 page=1 로 리셋하면서 BE 재호출 -->
            <select
              v-model="filterCategory"
              class="border border-gray-300 bg-white px-2.5 py-1 pr-7 text-[12px] font-medium text-gray-700 focus:border-[#004D3C] focus:outline-none"
            >
              <option v-for="f in LOG_FILTERS" :key="f.v" :value="f.v">{{ f.l }}</option>
            </select>
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
              <!-- Phase 3 — BE 가 점수 4종/total/scoreValid 를 직접 계산해 응답에 포함.
                   FE 는 e.scoreValid, e.saleExecution, e.carbon, e.newBuyer, e.localPartner, e.total 을 그대로 사용. -->
              <tr v-for="e in pagedEvents" :key="e.id" class="border-b border-gray-100 last:border-0">
                <td class="px-3 py-2 font-mono text-gray-700">{{ formatDate(e.date) }}</td>
                <td class="px-3 py-2 text-center">
                  <template v-if="e.type === 'donation'">
                    <span class="inline-flex items-center rounded border border-pink-200 bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-700">기부</span>
                  </template>
                  <template v-else>
                    <span class="inline-flex items-center border px-2 py-0.5 text-[10px] font-bold" :class="typeCls(e.type)">
                      {{ typeLabel(e.type) }}
                    </span>
                  </template>
                </td>
                <td class="px-3 py-2 text-gray-800">{{ e.buyer }}</td>
                <td class="px-3 py-2 text-gray-600">
                  {{ MATERIAL_FACTORS[e.material]?.label }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-gray-700">{{ formatNum(e.weightKg) }} kg</td>
                <td class="px-3 py-2 text-[10.5px] text-gray-500">
                  <template v-if="filterCategory === 'ALL'">
                    <!-- 전체 필터: 모든 점수 요소 분해 표시 (실행만 scoreValid 조건) -->
                    <span v-if="e.scoreValid && e.saleExecution">실행 {{ e.saleExecution }} + </span>
                    <span v-if="e.carbon">탄소 {{ formatNum(e.carbon) }}</span>
                    <span v-if="e.newBuyer" class="text-blue-600"> + 신규 {{ e.newBuyer }}</span>
                    <span v-if="e.localPartner" class="text-amber-600"> + 지역 {{ e.localPartner }}</span>
                    <span v-if="e.donationExecution" class="text-pink-600"> + 기부 {{ formatNum(e.donationExecution) }}</span>
                    <span v-if="!e.saleExecution && !e.carbon && !e.newBuyer && !e.localPartner && !e.donationExecution"
                          class="italic text-red-500">최소 10kg 미달 — 점수 부여 없음</span>
                  </template>
                  <!-- 단일 카테고리 필터: 해당 점수 요소 1개만 표시 -->
                  <template v-else>
                    <span class="font-black" :class="FILTER_BREAKDOWN_META[filterCategory]?.cls">
                      {{ FILTER_BREAKDOWN_META[filterCategory]?.label }}
                      +{{ formatNum(e[filterCategory] || 0) }}
                    </span>
                  </template>
                </td>
                <td class="px-3 py-2 text-right">
                  <div class="font-black"
                       :class="filterCategory === 'ALL' ? 'text-emerald-700' : FILTER_BREAKDOWN_META[filterCategory]?.cls">
                    +{{ formatNum(filterCategory === 'ALL' ? e.total : (e[filterCategory] || 0)) }}
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
          <!-- 서버 페이징 — 카운트는 BE summary 의 totalElements 사용 -->
          <span class="text-gray-500">
            <template v-if="filterCategory !== 'ALL'">
              <span class="font-bold text-[#004D3C]">
                {{ LOG_FILTERS.find(f => f.v === filterCategory)?.l }}
              </span>
              에 기여한 이벤트 <strong>{{ formatNum(totalElements) }}</strong>건 표시 중
            </template>
            <template v-else>
              전체 활동 <strong>{{ formatNum(totalElements) }}</strong>건 — {{ page }} / {{ totalPages }} 페이지
            </template>
          </span>
          <div v-if="totalPages > 1" class="inline-flex items-center gap-1">
            <!-- 5페이지 이전 -->
            <button
              type="button"
              :disabled="page === 1"
              class="h-7 min-w-[28px] border border-gray-300 bg-white px-2 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              title="5페이지 이전"
              @click="goJumpBack"
            >
              «
            </button>
            <!-- 이전 -->
            <button
              type="button"
              :disabled="page === 1"
              class="h-7 min-w-[28px] border border-gray-300 bg-white px-2 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              title="이전 페이지"
              @click="goPrev"
            >
              ‹
            </button>
            <!-- 페이지 번호 (최대 5개) -->
            <button
              v-for="p in pageNumbers"
              :key="p"
              type="button"
              class="h-7 min-w-[28px] border border-gray-300 px-2 text-[11px] font-medium transition"
              :class="p === page ? 'bg-[#004D3C] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
              @click="changePage(p)"
            >
              {{ p }}
            </button>
            <!-- 다음 -->
            <button
              type="button"
              :disabled="page === totalPages"
              class="h-7 min-w-[28px] border border-gray-300 bg-white px-2 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              title="다음 페이지"
              @click="goNext"
            >
              ›
            </button>
            <!-- 5페이지 이후 -->
            <button
              type="button"
              :disabled="page === totalPages"
              class="h-7 min-w-[28px] border border-gray-300 bg-white px-2 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              title="5페이지 이후"
              @click="goJumpForward"
            >
              »
            </button>
          </div>
        </div>
      </section>

    </div>

    <!-- 점수 산정 안내 모달 -->
    <Teleport to="body">
      <div
        v-if="showScoreRuleModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        @click.self="closeScoreRuleModal"
      >
        <div class="flex max-h-[90vh] w-full max-w-2xl flex-col border border-gray-300 bg-white shadow-2xl">
          <!-- 헤더 -->
          <div class="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3">
            <h3 class="inline-flex items-center gap-2 text-[15px] font-bold text-gray-900">
              <Info :size="18" class="text-emerald-600" />
              점수 산정 안내
            </h3>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              @click="closeScoreRuleModal"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- 본문 -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <p class="mb-3 text-[11px] leading-relaxed text-gray-500">
              순환재고 판매 활동 1건마다 아래 4개 점수 요소가 산정되어 합산됩니다.
              <span class="font-bold text-gray-700">최소 10kg 미만</span> 활동은 점수 부여 대상이 아닙니다 (어뷰징 방지).
            </p>

            <ul class="space-y-2.5">
              <li
                v-for="(rule, idx) in SCORE_RULE_ROWS"
                :key="rule.id"
                class="border border-gray-200 bg-gray-50/40 px-3 py-2.5"
              >
                <div class="mb-1 flex items-baseline gap-2">
                  <span class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">{{ idx + 1 }}</span>
                  <span class="text-[13px] font-bold text-gray-900">{{ rule.label }}</span>
                  <span :class="['ml-auto inline-block h-2 w-2 shrink-0 rounded-full', rule.barCls]"></span>
                </div>
                <div class="ml-7 space-y-1">
                  <p class="text-[12px] font-bold text-emerald-700">{{ rule.base }}</p>
                  <p class="text-[11px] font-medium text-gray-600">조건: {{ rule.cond }}</p>
                  <p class="text-[11px] leading-relaxed text-gray-500">{{ rule.detail }}</p>
                </div>
              </li>
            </ul>

            <!-- 공통 안내 -->
            <div class="mt-4 border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
              <p class="text-[11px] font-bold text-emerald-800">공통 적용 룰</p>
              <ul class="mt-1 space-y-0.5 text-[11px] text-emerald-700">
                <li>· 최소 중량 <span class="font-bold">10kg</span> 미만 활동은 모든 점수 0점 (탄소 점수 포함)</li>
                <li>· 탄소 점수는 <span class="font-bold">무게(kg) × 소재 계수</span> 단순 곱 — 별도 보정계수 없음</li>
                <li>· 혼방(소재 2종 이상)은 구성 소재 무관 <span class="font-bold">일괄 2.0</span> 계수 적용</li>
              </ul>
            </div>
          </div>

          <!-- 푸터 -->
          <div class="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-5 py-3">
            <button
              type="button"
              class="border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-100"
              @click="closeScoreRuleModal"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 소재 계수 안내 모달 -->
    <Teleport to="body">
      <div
        v-if="showFactorModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
        @click.self="closeFactorModal"
      >
        <div class="flex max-h-[90vh] w-full max-w-xl flex-col border border-gray-300 bg-white shadow-2xl">
          <!-- 헤더 -->
          <div class="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-3">
            <h3 class="inline-flex items-center gap-2 text-[15px] font-bold text-gray-900">
              <Info :size="18" class="text-emerald-600" />
              소재 계수 안내
            </h3>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              @click="closeFactorModal"
            >
              <X :size="16" />
            </button>
          </div>

          <!-- 본문 -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <!-- 소재별 탄소 계수 표 -->
            <div class="mb-3">
              <p class="mb-1.5 text-[11px] font-bold text-gray-700">소재별 탄소 계수 (kgCO₂/kg)</p>
              <table class="w-full border border-gray-200 text-[12px]">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">소재</th>
                    <th class="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">구분</th>
                    <th class="border-b border-gray-200 px-3 py-2 text-right font-semibold text-gray-600">계수</th>
                    <th class="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600">비고</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in MATERIAL_FACTOR_ROWS"
                    :key="row.code"
                    class="border-b border-gray-100 last:border-b-0"
                  >
                    <td class="px-3 py-1.5 font-medium text-gray-800">
                      {{ row.label }} <span class="text-[10px] text-gray-400">({{ row.code }})</span>
                    </td>
                    <td class="px-3 py-1.5 text-gray-600">{{ MATERIAL_GROUP_LABEL[row.group] || '—' }}</td>
                    <td class="px-3 py-1.5 text-right font-bold text-emerald-700">{{ row.factor.toFixed(1) }}</td>
                    <td class="px-3 py-1.5 text-gray-500">{{ row.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 산식 안내 -->
            <p class="text-[11px] leading-relaxed text-gray-500">
              <span class="font-bold text-gray-700">탄소 점수 = 무게(kg) × 소재 계수</span> — 별도 보정계수 미적용.
              혼방(소재 2종 이상)은 구성 소재 종류와 무관하게 <span class="font-bold">일괄 2.0</span> 계수가 적용됩니다.
            </p>
          </div>

          <!-- 푸터 -->
          <div class="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-5 py-3">
            <button
              type="button"
              class="border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-100"
              @click="closeFactorModal"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

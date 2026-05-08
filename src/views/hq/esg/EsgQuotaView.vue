<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import {
  TrendingUp, AlertCircle, AlertTriangle,
  ArrowLeft, Scale, Gauge, CheckCircle2,
  Edit3, Save, X,
  Leaf, Recycle,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEmissionQuotaStore } from '@/stores/emissionQuota.js'
const auth = useAuthStore()
const quotaStore = useEmissionQuotaStore()
const {
  fiscalYear,
  yearlyAllocation,
  warnThresholdPct,
  quotaUpdatedAt,
  quotaUpdatedBy,
  monthlyEmissions,
  ytdEmissions,
  remaining,
  utilizationPct,
  utilizationStatus,
  quarterly,
  ytdAvoided,
  costSavingsWon,
  externalUnitPriceWon,
} = storeToRefs(quotaStore)

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

// ─────────── AppLayout props ───────────
const topMenus = computed(() => roleMenus.hq ?? [])
const sideMenus = ref([])
const activeSideMenu = ref('')

// 할당량 편집 상태
const editingQuota = ref(false)
const quotaDraft = reactive({
  yearlyAllocation: 0,
  warnThresholdPct: 75,
  monthly: ['', '', '', '', '', '', '', '', '', '', '', ''],   // 12 인풋용 (빈 문자열 = 미입력)
})
function startEditQuota() {
  quotaDraft.yearlyAllocation = yearlyAllocation.value
  quotaDraft.warnThresholdPct = warnThresholdPct.value
  quotaDraft.monthly = (monthlyEmissions.value ?? []).map(v => v == null ? '' : String(v))
  while (quotaDraft.monthly.length < 12) quotaDraft.monthly.push('')
  editingQuota.value = true
}
async function saveQuota() {
  try {
    const monthly = quotaDraft.monthly.map(v =>
      v === '' || v === null || isNaN(Number(v)) ? null : Number(v),
    )
    await quotaStore.saveQuota({
      allocation: Number(quotaDraft.yearlyAllocation) || 0,
      warnPct:    Number(quotaDraft.warnThresholdPct) || 75,
      monthly,
    })
    editingQuota.value = false
  } catch (err) {
    alert('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
  }
}

// 사용률 상태 → 아이콘 매핑 (store 는 아이콘 없음)
const STATUS_ICONS = { red: AlertTriangle, amber: AlertTriangle, yellow: AlertCircle, emerald: CheckCircle2 }
const utilizationStatusIcon = computed(() => STATUS_ICONS[utilizationStatus.value.tone])
const statusToneClasses = {
  red:     'border-red-200 bg-red-50 text-red-700',
  amber:   'border-amber-200 bg-amber-50 text-amber-700',
  yellow:  'border-yellow-200 bg-yellow-50 text-yellow-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

// ─────────── 차트 ───────────
const doughnutData = computed(() => ({
  labels: ['사용', '잔여'],
  datasets: [{
    data: [ytdEmissions.value, remaining.value],
    backgroundColor: ['#004D3C', '#cfe2dc'],
    borderColor: '#ffffff',
    borderWidth: 2,
  }],
}))

const doughnutOptions = {
  responsive: true, maintainAspectRatio: false, cutout: '68%',
  plugins: {
    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } },
    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed.toFixed(2)} tCO₂` } },
  },
}

const quarterBarData = computed(() => ({
  labels: quarterly.value.map(q => `${q.q} (${q.period})`),
  datasets: [{
    label: '분기별 배출량',
    data: quarterly.value.map(q => Number(q.emissions.toFixed(2))),
    backgroundColor: quarterly.value.map(q =>
      q.status === 'upcoming' ? 'rgba(0,77,60,0.15)' :
      q.status === 'in-progress' ? 'rgba(217,119,6,0.85)' :
      'rgba(0,77,60,0.85)'),
    borderColor: quarterly.value.map(q =>
      q.status === 'upcoming' ? '#cfe2dc' :
      q.status === 'in-progress' ? '#d97706' : '#004D3C'),
    borderWidth: 1.5, borderRadius: 4,
    maxBarThickness: 24,
    categoryPercentage: 0.5,
    barPercentage: 0.7,
  }],
}))
const quarterBarOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#004D3C', titleColor: '#fff', bodyColor: '#fff', padding: 10,
      callbacks: { label: (ctx) => `${ctx.parsed.y.toFixed(2)} tCO₂` },
    },
  },
  scales: {
    y: { beginAtZero: true, ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
  },
}

// ─────────── 포맷터 ───────────
const formatNum = (n, digits = 0) => Number(n ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: digits, minimumFractionDigits: digits })
const formatPct = (n) => `${n.toFixed(1)}%`

// ─────────── 페이지 로드 ───────────
const loading = ref(false)
async function loadAll() {
  loading.value = true
  try {
    await quotaStore.fetchQuota(fiscalYear.value)
  } catch (err) {
    console.error('[EsgQuotaView.loadAll] failed:', err)
  } finally {
    loading.value = false
  }
}
onMounted(loadAll)
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
          <h1 class="text-[20px] font-bold text-gray-900">자발적 탄소중립 관리</h1>
          <p class="mt-0.5 text-[12px] text-gray-500">
            {{ fiscalYear }} 회계연도 — 자발적 탄소중립 목표 · 실효 배출 · 순환재고 절감 · 비용 절감 효과
          </p>
        </div>
      </div>

      <!-- 비즈니스 모델 안내 -->
      <div class="border-l-4 border-[#004D3C] bg-[#eef7f4] px-3 py-2 text-[11px] leading-relaxed text-gray-700">
        <span class="mr-1 font-bold text-[#004D3C]">자발적 탄소중립 모델</span>
        — Stockit 의 순환재고 시스템은 폐기 소각으로 발생할 배출을 회피시켜
        <strong>자발적 탄소시장(KAU/KOC) 매수 비용을 절감</strong>합니다.
        본 페이지는 자발적 목표 대비 실효 배출과 절감 효과를 추적합니다.
      </div>

      <!-- ───────── 1. KPI 카드 4개 ───────── -->
      <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <!-- ① 정부 할당량 -->
        <div class="border border-gray-300 bg-white p-5 shadow-sm">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            <Scale :size="12" /> 정부 할당량
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[24px] font-black leading-none text-gray-800">{{ formatNum(yearlyAllocation) }}</span>
            <span class="text-[12px] text-gray-400">tCO₂</span>
          </div>
          <p class="mt-2 text-[11px] text-gray-500">{{ fiscalYear }} 회계연도 부여량</p>
        </div>

        <!-- ② YTD 실효 배출 -->
        <div class="border border-gray-300 bg-gradient-to-br from-[#004D3C] to-[#0A6E58] p-5 text-white shadow-sm">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70">
            <TrendingUp :size="12" /> YTD 실효 배출
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[26px] font-black leading-none">{{ formatNum(ytdEmissions, 2) }}</span>
            <span class="text-[12px] text-white/80">tCO₂</span>
          </div>
          <p class="mt-2 text-[11px] text-white/70">활동량 입력 자동 환산</p>
        </div>

        <!-- ③ 잔여 배출 한도 + 사용률 상태 -->
        <div class="border p-5 shadow-sm" :class="statusToneClasses[utilizationStatus.tone]">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest opacity-70">
            <Gauge :size="12" /> 잔여 배출 한도
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[24px] font-black leading-none">{{ formatNum(remaining, 2) }}</span>
            <span class="text-[12px] opacity-70">tCO₂</span>
          </div>
          <p class="mt-2 inline-flex items-center gap-1 text-[11px] font-medium opacity-90">
            <component :is="utilizationStatusIcon" :size="11" />
            {{ utilizationStatus.label }}
            <span class="opacity-60">· 사용률 {{ formatPct(utilizationPct) }}</span>
          </p>
        </div>

        <!-- ④ 회피 배출량 (Avoided Emissions, GHG Protocol 표준 — Stockit 핵심) -->
        <div class="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-700/70">
            <Recycle :size="12" /> 회피 배출량
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[24px] font-black leading-none text-emerald-700">−{{ formatNum(ytdAvoided, 2) }}</span>
            <span class="text-[12px] text-emerald-600/80">tCO₂</span>
          </div>
          <p class="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700/90">
            <Leaf :size="11" />
            순환재고 재활용으로 회피
          </p>
        </div>
      </section>

      <!-- ───────── 2. 한도 사용 현황 | 정부 할당량 관리 (2칸) ───────── -->
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- 좌측: 한도 사용 현황 (도넛 + 분기별 배출 실적 통합 카드) -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">한도 사용 현황</h2>
            <p class="text-[10px] text-gray-500">사용 vs 잔여 (tCO₂) · 분기별 배출 실적</p>
          </div>

          <!-- 도넛 -->
          <div class="p-4" style="height: 280px;">
            <DoughnutChart :data="doughnutData" :options="doughnutOptions" />
          </div>

          <!-- 분기별 배출 실적 (막대) -->
          <div class="border-t border-gray-200 px-4 py-3">
            <div class="mb-1.5 flex items-center justify-between">
              <p class="text-[10px] font-bold uppercase tracking-widest text-gray-500">분기별 배출 실적</p>
              <div class="flex items-center gap-2.5 text-[9px] text-gray-600">
                <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-2 bg-[#004D3C]"></span>확정</span>
                <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-2 bg-amber-500"></span>진행</span>
                <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-2 border border-[#cfe2dc] bg-[#cfe2dc]/40"></span>예정</span>
              </div>
            </div>
            <div style="height: 200px;">
              <BarChart :data="quarterBarData" :options="quarterBarOptions" />
            </div>
          </div>
        </article>

        <!-- 정부 할당량 관리 (HQ 수기 입력) -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h2 class="inline-flex items-center gap-2 text-[14px] font-bold text-gray-800">
                <Scale :size="15" class="text-[#004D3C]" />
                {{ fiscalYear }} 정부 할당량 관리
              </h2>
              <p class="mt-0.5 text-[10px] text-gray-500">
                정부(환경부) 통지서 기준 — 본사 관리자 수기 입력
              </p>
            </div>
            <span class="text-[10px] text-gray-400 whitespace-nowrap">
              {{ quotaUpdatedAt }}
            </span>
          </div>

          <!-- 상단: 연간 할당량 + 경고 임계 (2-col) -->
          <div class="grid grid-cols-2 gap-3 px-4 pt-4">
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">연간 할당량 (tCO₂)</label>
              <div v-if="!editingQuota" class="mt-1.5 text-[18px] font-black text-gray-800">
                {{ formatNum(yearlyAllocation) }}
              </div>
              <input
                v-else
                v-model="quotaDraft.yearlyAllocation"
                type="number"
                min="0"
                class="mt-1.5 h-9 w-full border border-gray-300 bg-gray-50 px-3 text-[13px] font-bold text-gray-800 outline-none focus:border-[#004D3C] focus:bg-white"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold uppercase tracking-widest text-gray-400">경고 임계 (%)</label>
              <div v-if="!editingQuota" class="mt-1.5 text-[18px] font-black text-gray-800">
                {{ warnThresholdPct }}%
              </div>
              <input
                v-else
                v-model="quotaDraft.warnThresholdPct"
                type="number"
                min="0"
                max="100"
                class="mt-1.5 h-9 w-full border border-gray-300 bg-gray-50 px-3 text-[13px] font-bold text-gray-800 outline-none focus:border-[#004D3C] focus:bg-white"
              />
            </div>
          </div>

          <!-- 하단: 월별 실효 배출 12-cell grid (분기별 차트 자동 반영) -->
          <div class="px-4 pt-4">
            <div class="mb-1.5 flex items-baseline justify-between">
              <label class="text-[10px] font-bold uppercase tracking-widest text-blue-600">월별 실효 배출 (tCO₂)</label>
              <span class="text-[10px] text-gray-500">
                YTD 합계 <strong class="text-blue-700">{{ formatNum(ytdEmissions, 2) }}</strong> tCO₂
              </span>
            </div>

            <!-- 비편집 모드: 12개 값 표시 (3-row × 4-col) -->
            <div v-if="!editingQuota" class="grid grid-cols-4 gap-1.5">
              <div
                v-for="(v, i) in monthlyEmissions"
                :key="i"
                class="flex flex-col items-center border border-gray-200 bg-gray-50/60 px-2 py-1.5"
              >
                <span class="text-[9px] font-bold text-gray-400">{{ MONTH_LABELS[i] }}</span>
                <span class="text-[12px] font-black"
                      :class="v == null ? 'text-gray-300' : 'text-blue-700'">
                  {{ v == null ? '—' : formatNum(v, 2) }}
                </span>
              </div>
            </div>

            <!-- 편집 모드: 12 input box (3-row × 4-col) -->
            <div v-else class="grid grid-cols-4 gap-1.5">
              <label
                v-for="(_, i) in 12"
                :key="i"
                class="flex flex-col gap-0.5 border border-blue-200 bg-blue-50/40 px-1.5 py-1"
              >
                <span class="text-[9px] font-bold text-blue-600/70">{{ MONTH_LABELS[i] }}</span>
                <input
                  v-model="quotaDraft.monthly[i]"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="—"
                  class="h-7 w-full border border-blue-300 bg-white px-1.5 text-[12px] font-bold text-blue-700 outline-none focus:border-blue-600"
                />
              </label>
            </div>

            <!-- 분기별 합계 미리보기 -->
            <div class="mt-2 grid grid-cols-4 gap-1.5">
              <div
                v-for="(q, i) in quarterly"
                :key="q.q"
                class="flex items-baseline justify-between border-l-2 border-emerald-300 bg-emerald-50/40 px-2 py-1 text-[10px]"
              >
                <span class="font-bold text-emerald-700/80">{{ q.q }}</span>
                <span class="font-mono font-bold text-emerald-800">{{ formatNum(q.emissions, 2) }}</span>
              </div>
            </div>
            <p class="mt-1 text-[9px] text-gray-500">
              매달 입력하면 분기별 배출 실적 차트에 자동 반영됩니다.
              <span v-if="editingQuota" class="text-gray-400">· 빈 칸은 미입력으로 저장됩니다.</span>
            </p>
          </div>

          <div class="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2.5">
            <span class="text-[10px] text-gray-500">
              마지막 수정자: <span class="font-mono font-bold text-gray-700">{{ quotaUpdatedBy }}</span>
            </span>
            <div class="flex items-center gap-2">
              <template v-if="!editingQuota">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#0A6E58]"
                  @click="startEditQuota"
                >
                  <Edit3 :size="12" />
                  수정
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50"
                  @click="editingQuota = false"
                >
                  <X :size="12" />
                  취소
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#0A6E58]"
                  @click="saveQuota"
                >
                  <Save :size="12" />
                  저장
                </button>
              </template>
            </div>
          </div>
          <!-- YTD 실효 배출 산출 공식 안내 -->
          <div class="border-t border-blue-200 bg-blue-50/50 px-4 py-2.5 text-[11px] leading-relaxed text-blue-900/80">
            <p class="font-bold">ⓘ YTD 실효 배출 산출식 (GHG Protocol Scope 1+2)</p>
            <p class="mt-1 font-mono text-[10.5px] text-blue-900/70">
              = 전력(kWh) × 0.4153
              + 도시가스(m³) × 2.176
              + 차량연료(L) × 2.582
              + 폐기물(t) × 1,500
              <span class="text-blue-700/60">[단위: kgCO₂ → ÷1000 = tCO₂]</span>
            </p>
            <p class="mt-0.5 text-[10px] text-gray-500">
              4종 활동량 × 환경부 공식 배출계수(2024) 합산 후 월말에 매달 1회 입력.
              <span class="text-blue-700/60">YTD = 12개월 합계 / 분기 차트 = 3개월씩 자동 합계</span>
            </p>
          </div>

          <!-- 경고 임계 안내 -->
          <p class="border-t border-amber-200 bg-amber-50/50 px-4 py-2 text-[11px] text-amber-900/80">
            <span class="mr-0.5 font-bold">ⓘ</span>
            경고 임계 <strong>{{ warnThresholdPct }}%</strong>
            — 순배출이 정부 할당량의 <strong>{{ warnThresholdPct }}%</strong> 도달 시 경고
          </p>

          <!-- Stockit 도입 효과: 회피 vs 외부 매수 비교 (공백 채움 — 카드 높이 유지) -->
          <div class="flex flex-1 flex-col border-t border-gray-200 bg-gradient-to-r from-red-50/30 via-white to-emerald-50/40 px-4 py-3">
            <div class="mb-2 flex items-center justify-between">
              <p class="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-800">
                <span class="text-[13px]">💡</span>
                Stockit 도입 효과
                <span class="text-[10px] font-normal text-gray-500">— 회피 vs 외부 매수 비교</span>
              </p>
              <span class="text-[9px] font-bold uppercase tracking-widest text-emerald-700/70">YTD</span>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <!-- Without Stockit (좌, 빨강) -->
              <div class="border border-red-200 bg-red-50/60 px-2.5 py-2">
                <p class="text-[9px] font-bold uppercase tracking-wider text-red-700/80">
                  ✕ Without Stockit
                </p>
                <p class="mt-1 text-[10px] text-red-900/80">폐기 소각으로 발생</p>
                <p class="text-[14px] font-black text-red-700">+{{ formatNum(ytdAvoided, 2) }} tCO₂ ⬆</p>
                <p class="mt-1 text-[10px] text-red-900/80">자발적 시장 매수 필요</p>
                <p class="text-[12px] font-bold text-red-700">₩{{ formatNum(costSavingsWon) }} ⬆</p>
              </div>

              <!-- With Stockit (우, 에메랄드) -->
              <div class="border-2 border-emerald-300 bg-emerald-50/70 px-2.5 py-2">
                <p class="text-[9px] font-bold uppercase tracking-wider text-emerald-700/80">
                  ✓ With Stockit
                </p>
                <p class="mt-1 text-[10px] text-emerald-900/80">순환재고로 회피</p>
                <p class="text-[14px] font-black text-emerald-700">−{{ formatNum(ytdAvoided, 2) }} tCO₂ ⬇</p>
                <p class="mt-1 text-[10px] text-emerald-900/80">외부 매수 회피</p>
                <p class="text-[12px] font-bold text-emerald-700">₩{{ formatNum(costSavingsWon) }} ⬇ 절감</p>
              </div>
            </div>
          </div>

        </article>
      </section>

      <!-- ───────── 푸터 안내 ───────── -->
      <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div class="border-l-2 border-amber-300 bg-amber-50/50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900/80">
          <span class="font-bold">ⓘ 배출계수 (환경부 공식, 2024 기준):</span>
          전력 0.4153 kgCO₂/kWh · 도시가스 2.176 kgCO₂/m³ ·
          경유 2.582 kgCO₂/L · 폐기물 1,500 kgCO₂/t —
          실서비스 시 정부 공시값 갱신에 따라 매년 업데이트 필요.
        </div>
        <div class="border-l-2 border-emerald-300 bg-emerald-50/50 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-900/80">
          <span class="font-bold">ⓘ 절감 계수 (소각 회피 기준, IPCC/환경부 기준 추정):</span>
          의류 5.5 · 종이 2.5 · 플라스틱 6.0 · 식품 2.5 · 기타 3.0 kgCO₂/kg —
          순환재고 판매로 폐기/소각을 회피한 무게 × 계수 = 회피 배출량.
        </div>
      </div>
    </div>
  </AppLayout>
</template>

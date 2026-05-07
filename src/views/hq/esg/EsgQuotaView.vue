<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import {
  TrendingUp, TrendingDown, AlertCircle, AlertTriangle,
  RefreshCw, ArrowLeft, Scale, Gauge, CheckCircle2,
  Plus, Edit3, Save, X, Zap, Flame, Truck, Trash2, Building2,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import DoughnutChart from '@/components/common/charts/DoughnutChart.vue'
import BarChart from '@/components/common/charts/BarChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import {
  useEmissionQuotaStore,
  EMISSION_FACTORS as STORE_FACTORS,
  FACTOR_KEYS as STORE_FACTOR_KEYS,
  INFRASTRUCTURES as STORE_INFRA,
} from '@/stores/emissionQuota.js'

const router = useRouter()
const auth = useAuthStore()
const quotaStore = useEmissionQuotaStore()
const {
  fiscalYear,
  yearlyAllocation,
  warnThresholdPct,
  quotaUpdatedAt,
  quotaUpdatedBy,
  activityRecords,
  ytdEmissions,
  remaining,
  utilizationPct,
  utilizationStatus,
  quarterly,
  breakdownByFactor,
  locationRanking,
} = storeToRefs(quotaStore)

// ─────────── AppLayout props ───────────
const topMenus = computed(() => roleMenus.hq ?? [])
const sideMenus = ref([])
const activeSideMenu = ref('')
function handleLogout() { auth.logout(); router.push('/dev-login') }

// ─────────── store 데이터 보강 (아이콘 매핑) ───────────
// store 의 EMISSION_FACTORS 에는 아이콘이 없으므로 컴포넌트에서 매핑
const FACTOR_ICONS = { ELECTRICITY: Zap, CITY_GAS: Flame, FUEL: Truck, WASTE: Trash2 }
const EMISSION_FACTORS = Object.fromEntries(
  Object.entries(STORE_FACTORS).map(([k, v]) => [k, { ...v, icon: FACTOR_ICONS[k] }]),
)
const FACTOR_KEYS = STORE_FACTOR_KEYS
const infrastructures = STORE_INFRA

// 할당량 편집 상태
const editingQuota = ref(false)
const quotaDraft = reactive({ yearlyAllocation: 0, warnThresholdPct: 75 })
function startEditQuota() {
  quotaDraft.yearlyAllocation = yearlyAllocation.value
  quotaDraft.warnThresholdPct = warnThresholdPct.value
  editingQuota.value = true
}
function saveQuota() {
  quotaStore.updateQuota({
    allocation: Number(quotaDraft.yearlyAllocation) || 0,
    warnPct: Number(quotaDraft.warnThresholdPct) || 75,
    by: auth.user?.employeeCode ?? 'unknown',
  })
  editingQuota.value = false
}

// 활동량 입력 폼
const activityForm = reactive({
  loc: 'ST-SL-0001',
  y: 2026,
  m: 5,
  electricity: 0,
  gas: 0,
  fuel: 0,
  waste: 0,
})
const activitySaveError = ref('')

function submitActivity() {
  activitySaveError.value = ''
  if (!FACTOR_KEYS.some(k => Number(activityForm[mapKey(k)]) > 0)) {
    activitySaveError.value = '최소 한 개 이상의 활동량을 입력해주세요.'
    return
  }
  try {
    quotaStore.addActivity({
      loc: activityForm.loc,
      y: activityForm.y,
      m: activityForm.m,
      electricity: activityForm.electricity,
      gas: activityForm.gas,
      fuel: activityForm.fuel,
      waste: activityForm.waste,
    })
    // 폼 초기화 (사업장 / 연도는 유지)
    activityForm.electricity = 0
    activityForm.gas = 0
    activityForm.fuel = 0
    activityForm.waste = 0
  } catch (e) {
    activitySaveError.value = e.message
  }
}

function deleteActivity(id) {
  if (!confirm('이 입력을 삭제하시겠습니까?')) return
  quotaStore.deleteActivity(id)
}

// ─────────── 헬퍼 ───────────
function mapKey(factorKey) {
  return ({ ELECTRICITY: 'electricity', CITY_GAS: 'gas', FUEL: 'fuel', WASTE: 'waste' })[factorKey]
}
function recordCo2Kg(r) { return quotaStore.recordCo2Kg(r) }

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
    y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
  },
}

// ─────────── 포맷터 ───────────
const formatNum = (n, digits = 0) => Number(n ?? 0).toLocaleString('ko-KR', { maximumFractionDigits: digits, minimumFractionDigits: digits })
const formatPct = (n) => `${n.toFixed(1)}%`

// ─────────── 활동량 입력 자동 환산 미리보기 ───────────
const activityPreviewCo2Kg = computed(() => {
  return (Number(activityForm.electricity) || 0) * EMISSION_FACTORS.ELECTRICITY.factor
       + (Number(activityForm.gas) || 0)         * EMISSION_FACTORS.CITY_GAS.factor
       + (Number(activityForm.fuel) || 0)        * EMISSION_FACTORS.FUEL.factor
       + (Number(activityForm.waste) || 0)       * EMISSION_FACTORS.WASTE.factor
})

// ─────────── 페이지 로드 ───────────
const loading = ref(false)
async function loadAll() {
  loading.value = true
  try {
    await new Promise(r => setTimeout(r, 100))   // BE 연동 시 실제 호출
  } finally {
    loading.value = false
  }
}
onMounted(loadAll)

// 매장/창고 라벨
const locationLabel = (code) => {
  const i = infrastructures.find(x => x.code === code)
  return i ? `${i.name} (${i.code})` : code
}
const locationTypeLabel = (type) => ({ STORE: '매장', WAREHOUSE: '창고' })[type] ?? '-'

// 입력 이력 — 최신 순, 페이지네이션 단순화 (보기 좋게 latest 20개)
const recentRecordsView = computed(() =>
  [...activityRecords.value]
    .sort((a, b) => (b.y - a.y) || (b.m - a.m) || (b.id - a.id))
    .slice(0, 20),
)
</script>

<template>
  <AppLayout
    active-top-menu="ESG"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
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
          <h1 class="text-[20px] font-bold text-gray-900">온실가스 배출 관리</h1>
          <p class="mt-0.5 text-[12px] text-gray-500">
            {{ fiscalYear }} 회계연도 — 할당량 · 실적 · 사업장별 활동량 통합 관리
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50"
          @click="loadAll"
          :disabled="loading"
        >
          <RefreshCw :size="13" :class="{ 'animate-spin': loading }" />
          새로고침
        </button>
      </div>

      <!-- Mock 안내 -->
      <div class="border-l-4 border-gray-400 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
        ⓘ 현재 화면은 Mock 데이터로 동작합니다. BE 연동 후 실제 입력값/배출계수로 교체 예정 (emission_factor / emission_activity 테이블)
      </div>

      <!-- ───────── 1. KPI 카드 4개 ───────── -->
      <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="border border-gray-300 bg-white p-5 shadow-sm">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            <Scale :size="12" /> 연간 할당량
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[24px] font-black leading-none text-gray-800">{{ formatNum(yearlyAllocation) }}</span>
            <span class="text-[12px] text-gray-400">tCO₂</span>
          </div>
          <p class="mt-2 text-[11px] text-gray-500">{{ fiscalYear }} 회계연도 부여량</p>
        </div>

        <div class="border border-gray-300 bg-gradient-to-br from-[#004D3C] to-[#0A6E58] p-5 text-white shadow-sm">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70">
            <TrendingUp :size="12" /> YTD 누적 배출
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[26px] font-black leading-none">{{ formatNum(ytdEmissions, 2) }}</span>
            <span class="text-[12px] text-white/80">tCO₂</span>
          </div>
          <p class="mt-2 text-[11px] text-white/70">활동량 입력 자동 환산</p>
        </div>

        <div class="border p-5 shadow-sm" :class="statusToneClasses[utilizationStatus.tone]">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest opacity-70">
            <Gauge :size="12" /> 사용률
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[24px] font-black leading-none">{{ formatPct(utilizationPct) }}</span>
          </div>
          <p class="mt-2 inline-flex items-center gap-1 text-[11px] font-medium opacity-90">
            <component :is="utilizationStatusIcon" :size="11" />
            {{ utilizationStatus.label }}
            <span class="opacity-60">· 경고 {{ warnThresholdPct }}%</span>
          </p>
        </div>

        <div class="border border-gray-300 bg-white p-5 shadow-sm">
          <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
            <TrendingDown :size="12" /> 잔여 한도
          </div>
          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="text-[24px] font-black leading-none text-gray-800">{{ formatNum(remaining, 2) }}</span>
            <span class="text-[12px] text-gray-400">tCO₂</span>
          </div>
          <p class="mt-2 text-[11px] text-gray-500">연말까지 사용 가능</p>
        </div>
      </section>

      <!-- ───────── 2. 도넛 + 분기 막대 + 활동별 비중 (3칸 동일 폭) ───────── -->
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <!-- 한도 사용 현황 (도넛) -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">한도 사용 현황</h2>
            <p class="text-[10px] text-gray-500">사용 vs 잔여 (tCO₂)</p>
          </div>
          <div class="p-4" style="height: 300px;">
            <DoughnutChart :data="doughnutData" :options="doughnutOptions" />
          </div>
        </article>

        <!-- 분기별 배출 실적 (막대) -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">분기별 배출 실적</h2>
            <p class="text-[10px] text-gray-500">분기 단독 합계 (tCO₂)</p>
          </div>
          <div class="p-4" style="height: 252px;">
            <BarChart :data="quarterBarData" :options="quarterBarOptions" :height="232" />
          </div>
          <div class="flex items-center justify-center gap-3 border-t border-gray-200 px-3 py-2 text-[10px] text-gray-600">
            <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-2 bg-[#004D3C]"></span>확정</span>
            <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-2 bg-amber-500"></span>진행</span>
            <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-2 border border-[#cfe2dc] bg-[#cfe2dc]/40"></span>예정</span>
          </div>
        </article>

        <!-- 활동 종류별 배출 비중 -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">활동 종류별 배출 비중</h2>
            <p class="text-[10px] text-gray-500">YTD 누적 (tCO₂)</p>
          </div>
          <div class="divide-y divide-gray-100">
            <div
              v-for="b in breakdownByFactor"
              :key="b.key"
              class="flex items-center gap-2.5 px-3 py-2"
            >
              <component :is="EMISSION_FACTORS[b.key].icon" :size="14" :style="{ color: b.color }" />
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline justify-between gap-2">
                  <span class="text-[11px] font-bold text-gray-800 truncate">{{ b.label }}</span>
                  <span class="text-[11px] font-bold text-gray-900 whitespace-nowrap">{{ formatNum(b.co2Ton, 2) }} t</span>
                </div>
                <div class="mt-1 h-1.5 overflow-hidden bg-gray-100">
                  <div
                    class="h-full transition-all"
                    :style="{
                      width: ytdEmissions > 0 ? (b.co2Ton / ytdEmissions * 100).toFixed(1) + '%' : '0%',
                      backgroundColor: b.color,
                    }"
                  ></div>
                </div>
                <p class="mt-0.5 text-[9px] text-gray-500">
                  ×{{ b.factor }} {{ b.unit }} ·
                  {{ ytdEmissions > 0 ? formatPct(b.co2Ton / ytdEmissions * 100) : '0%' }}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- ───────── 3. 연간 할당량 관리 + 매장·창고별 랭킹 (2칸 동일 폭) ───────── -->
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- 연간 할당량 관리 (HQ 수기 입력) -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h2 class="inline-flex items-center gap-2 text-[14px] font-bold text-gray-800">
                <Scale :size="15" class="text-[#004D3C]" />
                {{ fiscalYear }} 연간 할당량 관리
              </h2>
              <p class="mt-0.5 text-[10px] text-gray-500">
                정부(환경부) 통지서 기준 — 본사 관리자 수기 입력
              </p>
            </div>
            <span class="text-[10px] text-gray-400 whitespace-nowrap">
              {{ quotaUpdatedAt }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 p-4">
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
          <!-- 경고 임계 안내 -->
          <p class="border-t border-amber-200 bg-amber-50/50 px-4 py-2 text-[11px] text-amber-900/80">
            <span class="mr-0.5 font-bold">ⓘ</span>
            경고 임계 <strong>{{ warnThresholdPct }}%</strong>
            — 사용률이 <strong>{{ warnThresholdPct }}%</strong> 도달 시 경고
          </p>
        </article>

        <!-- 매장·창고별 배출 순위 -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">매장·창고별 배출 순위</h2>
            <p class="text-[10px] text-gray-500">YTD 누적 (tCO₂) — 상위 사업장</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-[12px]">
              <thead class="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th class="px-3 py-2 font-bold text-gray-600">순위</th>
                  <th class="px-3 py-2 font-bold text-gray-600">사업장</th>
                  <th class="px-3 py-2 text-center font-bold text-gray-600">유형</th>
                  <th class="px-3 py-2 text-right font-bold text-gray-600">배출량</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, idx) in locationRanking" :key="r.loc" class="border-b border-gray-100 last:border-0">
                  <td class="px-3 py-2 font-mono font-bold text-gray-700">#{{ idx + 1 }}</td>
                  <td class="px-3 py-2">
                    <div class="font-semibold text-gray-800">{{ r.name }}</div>
                    <div class="font-mono text-[10px] text-gray-400">{{ r.loc }}</div>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span
                      class="inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-bold"
                      :class="r.type === 'STORE' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-purple-200 bg-purple-50 text-purple-700'"
                    >
                      {{ locationTypeLabel(r.type) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-right font-bold text-gray-900">{{ formatNum(r.co2Ton, 2) }}</td>
                </tr>
                <tr v-if="!locationRanking.length">
                  <td colspan="4" class="px-3 py-6 text-center text-[12px] text-gray-400">입력된 활동량 없음</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <!-- ───────── 5. 월별 활동량 입력 ───────── -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-4 py-3">
          <h2 class="inline-flex items-center gap-2 text-[14px] font-bold text-gray-800">
            <Plus :size="15" class="text-[#004D3C]" />
            월별 활동량 입력
          </h2>
          <p class="mt-0.5 text-[10px] text-gray-500">
            매장·창고별 매월 사용량 입력 → 환경부 배출계수로 자동 환산
          </p>
        </div>

        <div class="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr]">
          <!-- 좌측: 사업장/연월 -->
          <div class="flex flex-col gap-3 border-r border-gray-200 pr-4">
            <label class="flex flex-col gap-1">
              <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400">사업장</span>
              <div class="flex h-9 items-center border border-gray-300 bg-gray-50 px-3 focus-within:bg-white focus-within:border-[#004D3C]">
                <Building2 :size="13" class="mr-2 text-gray-400" />
                <select v-model="activityForm.loc" class="w-full bg-transparent text-[12px] outline-none">
                  <optgroup label="매장">
                    <option v-for="i in infrastructures.filter(x => x.type === 'STORE')" :key="i.code" :value="i.code">
                      {{ i.code }} · {{ i.name }}
                    </option>
                  </optgroup>
                  <optgroup label="창고">
                    <option v-for="i in infrastructures.filter(x => x.type === 'WAREHOUSE')" :key="i.code" :value="i.code">
                      {{ i.code }} · {{ i.name }}
                    </option>
                  </optgroup>
                </select>
              </div>
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex flex-col gap-1">
                <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400">연도</span>
                <input v-model="activityForm.y" type="number" class="h-9 border border-gray-300 bg-gray-50 px-3 text-[12px] outline-none focus:border-[#004D3C] focus:bg-white" />
              </label>
              <label class="flex flex-col gap-1">
                <span class="text-[11px] font-bold uppercase tracking-widest text-gray-400">월</span>
                <select v-model="activityForm.m" class="h-9 border border-gray-300 bg-gray-50 px-3 text-[12px] outline-none focus:border-[#004D3C] focus:bg-white">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
                </select>
              </label>
            </div>

            <!-- 자동 환산 미리보기 -->
            <div class="mt-1 border border-[#004D3C]/20 bg-[#eef7f4] p-3">
              <p class="text-[10px] font-bold uppercase tracking-widest text-[#004D3C]/70">자동 환산 미리보기</p>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-[20px] font-black text-[#004D3C]">{{ formatNum(activityPreviewCo2Kg / 1000, 3) }}</span>
                <span class="text-[12px] text-[#004D3C]/70">tCO₂</span>
              </div>
              <p class="mt-0.5 text-[10px] text-[#004D3C]/70">{{ formatNum(activityPreviewCo2Kg, 1) }} kgCO₂</p>
            </div>
          </div>

          <!-- 우측: 활동량 4개 -->
          <div class="flex flex-col gap-3">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label
                v-for="k in FACTOR_KEYS"
                :key="k"
                class="flex flex-col gap-1.5"
              >
                <span class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  <component :is="EMISSION_FACTORS[k].icon" :size="13" :style="{ color: EMISSION_FACTORS[k].color }" />
                  {{ EMISSION_FACTORS[k].label }}
                </span>
                <div class="flex h-10 items-center border border-gray-300 bg-gray-50 px-3 focus-within:bg-white focus-within:border-[#004D3C]">
                  <input
                    v-model="activityForm[mapKey(k)]"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full bg-transparent text-[14px] outline-none"
                  />
                  <span class="ml-2 text-[11px] text-gray-400">{{ EMISSION_FACTORS[k].unit }}</span>
                </div>
                <p class="text-[10px] text-gray-400">
                  ×{{ EMISSION_FACTORS[k].factor }} kgCO₂/{{ EMISSION_FACTORS[k].unit }}
                  =
                  <span class="font-bold text-gray-700">
                    {{ formatNum((Number(activityForm[mapKey(k)]) || 0) * EMISSION_FACTORS[k].factor, 1) }} kgCO₂
                  </span>
                </p>
              </label>
            </div>

            <!-- 에러 -->
            <p v-if="activitySaveError" class="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600">
              <AlertCircle :size="12" />
              {{ activitySaveError }}
            </p>

            <div class="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-[12px] font-bold text-white transition hover:bg-[#0A6E58]"
                @click="submitActivity"
              >
                <Save :size="13" />
                저장
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- ───────── 6. 입력 이력 테이블 ───────── -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-4 py-3">
          <h2 class="text-[14px] font-bold text-gray-800">입력 이력 (최근 20건)</h2>
          <p class="text-[10px] text-gray-500">사업장 · 연월 · 활동량 · 환산 결과</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-[12px]">
            <thead class="border-b border-gray-200 bg-gray-50">
              <tr>
                <th class="px-3 py-2 font-bold text-gray-600">사업장</th>
                <th class="px-3 py-2 text-center font-bold text-gray-600">연월</th>
                <th class="px-3 py-2 text-right font-bold text-gray-600">전력 (kWh)</th>
                <th class="px-3 py-2 text-right font-bold text-gray-600">가스 (m³)</th>
                <th class="px-3 py-2 text-right font-bold text-gray-600">연료 (L)</th>
                <th class="px-3 py-2 text-right font-bold text-gray-600">폐기물 (t)</th>
                <th class="px-3 py-2 text-right font-bold text-gray-600">총 CO₂ (t)</th>
                <th class="px-3 py-2 text-center font-bold text-gray-600">관리</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in recentRecordsView" :key="r.id" class="border-b border-gray-100 last:border-0">
                <td class="px-3 py-2">
                  <div class="font-semibold text-gray-800">{{ infrastructures.find(i => i.code === r.loc)?.name ?? r.loc }}</div>
                  <div class="font-mono text-[10px] text-gray-400">{{ r.loc }}</div>
                </td>
                <td class="px-3 py-2 text-center font-mono text-gray-700">{{ r.y }}-{{ String(r.m).padStart(2, '0') }}</td>
                <td class="px-3 py-2 text-right text-gray-700">{{ formatNum(r.electricity) }}</td>
                <td class="px-3 py-2 text-right text-gray-700">{{ formatNum(r.gas) }}</td>
                <td class="px-3 py-2 text-right text-gray-700">{{ formatNum(r.fuel) }}</td>
                <td class="px-3 py-2 text-right text-gray-700">{{ formatNum(r.waste, 2) }}</td>
                <td class="px-3 py-2 text-right font-bold text-[#004D3C]">{{ formatNum(recordCo2Kg(r) / 1000, 3) }}</td>
                <td class="px-3 py-2 text-center">
                  <button
                    type="button"
                    class="inline-flex h-6 w-6 items-center justify-center border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                    @click="deleteActivity(r.id)"
                    title="삭제"
                  >
                    <X :size="11" />
                  </button>
                </td>
              </tr>
              <tr v-if="!recentRecordsView.length">
                <td colspan="8" class="px-3 py-6 text-center text-[12px] text-gray-400">입력된 데이터 없음</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ───────── 푸터 안내 ───────── -->
      <div class="border-l-2 border-amber-300 bg-amber-50/50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-900/80">
        <span class="font-bold">ⓘ 배출계수 (환경부 공식, 2024 기준):</span>
        전력 0.4153 kgCO₂/kWh · 도시가스 2.176 kgCO₂/m³ ·
        경유 2.582 kgCO₂/L · 폐기물 1,500 kgCO₂/t —
        실서비스 시 정부 공시값 갱신에 따라 매년 업데이트 필요.
      </div>
    </div>
  </AppLayout>
</template>

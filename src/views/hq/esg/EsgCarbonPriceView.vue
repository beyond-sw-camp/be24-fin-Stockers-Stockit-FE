<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  TrendingUp, TrendingDown, ArrowUpDown,
  AlertCircle, RefreshCw, Building2, ArrowLeft,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { carbonPriceApi } from '@/api/hq/esg.js'
import { extractErrorMessage } from '@/api/axios.js'

// Chart.js
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Line as ChartJsLine } from 'vue-chartjs'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)
const router = useRouter()
const auth = useAuthStore()

// ─────────── AppLayout props ───────────
const topMenus = computed(() => roleMenus.hq ?? [])
const sideMenus = computed(
  () => (roleMenus.hq ?? []).find((menu) => menu.label === 'ESG 대시보드')?.children ?? [],
)
const activeSideMenu = ref('배출권 시장 가치')

// ─────────── 기간 필터 ───────────
const PERIOD_OPTIONS = [
  { key: 'SEVEN_DAYS', label: '7일' },
  { key: 'ONE_MONTH',  label: '1개월' },
  { key: 'SIX_MONTHS', label: '6개월' },
]
const selectedPeriod = ref('SEVEN_DAYS')

// ─────────── 페이징 (일자별 상세 테이블) ───────────
const PAGE_SIZE = 15
const currentPage = ref(1)

// 최신 → 과거 순 정렬된 전체 데이터 (테이블용)
const sortedDesc = computed(() => [...trend.value].reverse())

// 전체 페이지 수
const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedDesc.value.length / PAGE_SIZE)),
)

// 현재 페이지의 데이터 슬라이스
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedDesc.value.slice(start, start + PAGE_SIZE)
})

// 표시할 페이지 번호 목록 (현재 ±2, 양 끝 + 줄임표)
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, 2, total - 1, total, cur - 1, cur, cur + 1])
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b)

  // 사이에 끊김 있으면 ... 삽입
  const result = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('...')
    result.push(p)
    prev = p
  }
  return result
})

function goToPage(p) {
  if (p === '...') return
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}

// 기간 필터 변경 시 페이지 1로 리셋 (아래 watch 통합)

// ─────────── 데이터 로드 ───────────
const latest = ref(null)
const trend  = ref([])
const loading = ref(false)
const loadError = ref('')

/** latest 와 trend 둘 다 로드 (초기 진입 / 새로고침 버튼) */
async function loadAll() {
  loading.value = true
  loadError.value = ''
  try {
    const [latestRes, trendRes] = await Promise.all([
      carbonPriceApi.getLatest(),
      carbonPriceApi.getTrend(selectedPeriod.value),
    ])
    latest.value = latestRes
    trend.value = trendRes ?? []
  } catch (err) {
    loadError.value = extractErrorMessage(err, '배출권 시세를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

/** 기간 탭 변경 시 trend 만 다시 로드 (latest 는 그대로) */
async function loadTrendOnly(period) {
  loading.value = true
  loadError.value = ''
  try {
    const trendRes = await carbonPriceApi.getTrend(period)
    trend.value = trendRes ?? []
  } catch (err) {
    loadError.value = extractErrorMessage(err, '배출권 시세를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

watch(selectedPeriod, (next) => {
  currentPage.value = 1   // 기간 바꾸면 페이지 1로 리셋
  loadTrendOnly(next)
})

onMounted(loadAll)

// ─────────── 포맷터 ───────────
const formatPrice = (n) => (n ?? 0).toLocaleString('ko-KR')
const formatPct = (s) => {
  if (s === null || s === undefined || s === '') return '0%'
  const n = parseFloat(s)
  if (Number.isNaN(n)) return s
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}
const formatBasDt = (yyyymmdd) => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd ?? '-'
  return `${yyyymmdd.slice(0,4)}-${yyyymmdd.slice(4,6)}-${yyyymmdd.slice(6,8)}`
}
const shortDt = (yyyymmdd) => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd ?? ''
  return `${yyyymmdd.slice(4,6)}/${yyyymmdd.slice(6,8)}`
}

// ─────────── 기간 메타 ───────────
const trendStartDate = computed(() => trend.value.length ? formatBasDt(trend.value[0].basDt) : '')
const trendEndDate   = computed(() => trend.value.length ? formatBasDt(trend.value[trend.value.length - 1].basDt) : '')

// ─────────── KPI 계산 ───────────
const sevenDay = computed(() => trend.value.slice(-7))

const high7d = computed(() => {
  if (!sevenDay.value.length) return 0
  return Math.max(...sevenDay.value.map(d => d.pricePerTon))
})
const low7d = computed(() => {
  if (!sevenDay.value.length) return 0
  return Math.min(...sevenDay.value.map(d => d.pricePerTon))
})
const avg7d = computed(() => {
  if (!sevenDay.value.length) return 0
  const sum = sevenDay.value.reduce((acc, d) => acc + d.pricePerTon, 0)
  return Math.round(sum / sevenDay.value.length)
})

const fltRtNum = computed(() => parseFloat(latest.value?.fltRt ?? '0') || 0)
const isUp = computed(() => fltRtNum.value > 0)
const isDown = computed(() => fltRtNum.value < 0)

// ─────────── Chart.js 설정 ───────────
const chartData = computed(() => ({
  labels: trend.value.map(d => shortDt(d.basDt)),
  datasets: [
    {
      label: 'KAU25 종가 (원/톤)',
      data: trend.value.map(d => d.pricePerTon),
      borderColor: '#004D3C',
      backgroundColor: 'rgba(0, 77, 60, 0.08)',
      pointBackgroundColor: '#004D3C',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.25,
      fill: true,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#004D3C',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      callbacks: {
        label: (ctx) => `${ctx.parsed.y.toLocaleString('ko-KR')}원/톤`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: { callback: (v) => v.toLocaleString('ko-KR') + '원' },
      grid: { color: 'rgba(0,0,0,0.05)' },
    },
    x: {
      grid: { display: false },
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        // 최근 거래일(마지막)과 첫 거래일은 항상 표시, 중간은 균등 압축
        callback: function (value, index) {
          const labels = this.chart?.data?.labels ?? []
          const total = labels.length
          if (total === 0) return ''
          if (index === 0 || index === total - 1) return labels[index]
          const skipN = Math.max(1, Math.ceil(total / 10))
          return index % skipN === 0 ? labels[index] : ''
        },
      },
    },
  },
}
</script>

<template>
  <AppLayout
    active-top-menu="ESG 대시보드"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <!-- 헤더 -->
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
          <h1 class="text-[20px] font-bold text-gray-900">
            탄소 배출권 시장
          </h1>
          <p class="mt-0.5 text-[12px] text-gray-500">
            KRX 한국거래소 배출권 시장(KAU25) 시세 — 공공데이터포털 연동
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

      <!-- 로딩 / 에러 -->
      <div v-if="loading && !latest" class="border border-gray-300 bg-white p-12 text-center text-[13px] text-gray-500">
        시세를 불러오는 중...
      </div>
      <div v-else-if="loadError" class="flex items-center gap-2 border border-red-200 bg-red-50 p-4 text-[13px] text-red-600">
        <AlertCircle :size="16" />
        {{ loadError }}
      </div>

      <template v-else-if="latest">
        <!-- 폴백 알림 -->
        <div
          v-if="latest.fallback"
          class="flex items-start gap-2 border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12px] font-medium text-amber-800"
        >
          <AlertCircle :size="14" class="mt-0.5 shrink-0" />
          외부 시세 API 응답이 일시적으로 지연되어 예비값(fallback)을 표시 중입니다. 새로고침으로 재시도해 보세요.
        </div>

        <!-- KPI 카드 4개 -->
        <section class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <!-- 현재 시세 -->
          <div class="border border-gray-300 bg-gradient-to-br from-[#004D3C] to-[#0A6E58] p-5 text-white shadow-sm">
            <div class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/70">
              <Building2 :size="12" />
              현재 시세
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-[26px] font-black leading-none">{{ formatPrice(latest.pricePerTon) }}</span>
              <span class="text-[12px] text-white/80">원/톤</span>
            </div>
            <div class="mt-2 text-[11px] text-white/70">
              {{ formatBasDt(latest.basDt) }} · {{ latest.symbol }}
            </div>
          </div>

          <!-- 전일 대비 -->
          <div class="border border-gray-300 bg-white p-5 shadow-sm">
            <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <ArrowUpDown :size="12" />
              전일 대비
            </div>
            <div
              class="mt-2 flex items-baseline gap-1.5"
              :class="isUp ? 'text-red-600' : isDown ? 'text-blue-600' : 'text-gray-700'"
            >
              <component :is="isUp ? TrendingUp : isDown ? TrendingDown : ArrowUpDown" :size="22" />
              <span class="text-[24px] font-black leading-none">
                {{ formatPct(latest.fltRt) }}
              </span>
            </div>
            <p class="mt-2 text-[11px] text-gray-500">전일 종가 대비 등락률</p>
          </div>

          <!-- 7일 최고 -->
          <div class="border border-gray-300 bg-white p-5 shadow-sm">
            <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <TrendingUp :size="12" class="text-red-500" />
              7거래일 최고
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-[24px] font-black leading-none text-gray-800">{{ formatPrice(high7d) }}</span>
              <span class="text-[12px] text-gray-400">원/톤</span>
            </div>
            <p class="mt-2 text-[11px] text-gray-500">최근 7거래일 종가 중 최고가</p>
          </div>

          <!-- 7일 최저 -->
          <div class="border border-gray-300 bg-white p-5 shadow-sm">
            <div class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <TrendingDown :size="12" class="text-blue-500" />
              7거래일 최저
            </div>
            <div class="mt-2 flex items-baseline gap-1.5">
              <span class="text-[24px] font-black leading-none text-gray-800">{{ formatPrice(low7d) }}</span>
              <span class="text-[12px] text-gray-400">원/톤</span>
            </div>
            <p class="mt-2 text-[11px] text-gray-500">평균 {{ formatPrice(avg7d) }}원/톤</p>
          </div>
        </section>

        <!-- 시계열 차트 -->
        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h2 class="text-[14px] font-bold text-gray-800">시세 추이 ({{ trend.length }}거래일)</h2>
              <p class="text-[10px] text-gray-500">KAU25 일별 종가 (원/톤) · 거래량 0 인 날짜는 제외</p>
              <p v-if="trend.length" class="mt-0.5 text-[10.5px] text-gray-600">
                기간: <span class="font-mono">{{ trendStartDate }}</span>
                <span class="mx-1 text-gray-400">~</span>
                <span class="font-mono font-bold text-[#004D3C]">{{ trendEndDate }}</span>
                <span class="ml-1 text-gray-400">(최근 거래일)</span>
              </p>
            </div>
            <!-- 기간 필터 탭 -->
            <div class="flex gap-1">
              <button
                v-for="opt in PERIOD_OPTIONS"
                :key="opt.key"
                type="button"
                :class="[
                  'border px-3 py-1 text-[12px] font-bold transition',
                  selectedPeriod === opt.key
                    ? 'border-[#004D3C] bg-[#004D3C] text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                ]"
                :disabled="loading"
                @click="selectedPeriod = opt.key"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div class="p-4" style="height: 360px;">
            <ChartJsLine v-if="trend.length" :data="chartData" :options="chartOptions" />
            <div v-else class="flex h-full items-center justify-center text-[12px] text-gray-400">
              데이터 없음
            </div>
          </div>
          <!-- 휴장일 안내 footer -->
          <div class="border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-[11px] leading-relaxed text-gray-500">
            <span class="mr-1 font-bold text-gray-700">ⓘ</span>
            한국거래소 배출권 시장은 <strong class="text-gray-700">평일 오전 10:00~12:00</strong>만 운영됩니다.
            <strong class="text-gray-700">주말·공휴일</strong>은 휴장이라 시세가 형성되지 않아
            그래프와 표에서 제외됩니다.
          </div>
        </section>

        <!-- 일자별 상세 테이블 (15건/페이지 페이징) -->
        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 class="text-[14px] font-bold text-gray-800">
              일자별 상세
              <span class="ml-1 font-normal text-gray-500">총 {{ trend.length }}거래일</span>
            </h2>
            <span class="text-[11px] font-medium text-gray-500">
              {{ currentPage }} / {{ totalPages }} 페이지
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-[12px]">
              <thead class="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th class="px-4 py-2 font-bold text-gray-600">기준일</th>
                  <th class="px-4 py-2 font-bold text-gray-600">종목</th>
                  <th class="px-4 py-2 text-right font-bold text-gray-600">종가</th>
                  <th class="px-4 py-2 text-right font-bold text-gray-600">등락률</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(d, idx) in pagedRows"
                  :key="d.basDt + idx"
                  class="border-b border-gray-100 last:border-0"
                >
                  <td class="px-4 py-2 font-mono text-gray-800">{{ formatBasDt(d.basDt) }}</td>
                  <td class="px-4 py-2 font-mono text-gray-600">{{ d.symbol }}</td>
                  <td class="px-4 py-2 text-right font-bold text-gray-900">{{ formatPrice(d.pricePerTon) }}원</td>
                  <td
                    class="px-4 py-2 text-right font-medium"
                    :class="parseFloat(d.fltRt) > 0 ? 'text-red-600' : parseFloat(d.fltRt) < 0 ? 'text-blue-600' : 'text-gray-500'"
                  >
                    {{ formatPct(d.fltRt) }}
                  </td>
                </tr>
                <tr v-if="!pagedRows.length">
                  <td colspan="4" class="px-4 py-6 text-center text-[12px] text-gray-400">데이터 없음</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 페이지네이션 -->
          <div
            v-if="totalPages > 1"
            class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2.5"
          >
            <span class="text-[11px] text-gray-500">
              {{ (currentPage - 1) * 15 + 1 }}–{{ Math.min(currentPage * 15, trend.length) }}
              / 총 {{ trend.length }}건
            </span>

            <div class="flex items-center gap-1">
              <!-- 이전 -->
              <button
                type="button"
                class="h-7 border border-gray-300 bg-white px-2.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                이전
              </button>

              <!-- 페이지 번호 -->
              <button
                v-for="(p, idx) in pageNumbers"
                :key="idx"
                type="button"
                :disabled="p === '...'"
                :class="[
                  'h-7 min-w-[28px] px-2 text-[11px] font-medium transition',
                  p === currentPage
                    ? 'border border-[#004D3C] bg-[#004D3C] text-white'
                    : p === '...'
                      ? 'cursor-default text-gray-400'
                      : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                ]"
                @click="goToPage(p)"
              >
                {{ p }}
              </button>

              <!-- 다음 -->
              <button
                type="button"
                class="h-7 border border-gray-300 bg-white px-2.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                다음
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
  </AppLayout>
</template>

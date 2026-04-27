<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Truck,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'

const router = useRouter()
const auth = useAuthStore()
const poStore = usePurchaseOrderStore()

const sideMenus = roleMenus.warehouse
const activeSideMenu = ref('대시보드')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function goTo(path) {
  router.push(path)
}

// ─── 헤더 시각 ───────────────────────────────────────────────────────────────
const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date()),
)

// ─── 기간 토글 ──────────────────────────────────────────────────────────────
const RANGE_TABS = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '이번 주' },
  { key: 'month', label: '이번 달' },
  { key: 'all', label: '전체' },
]
const range = ref('all')

function todayStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
function weekStartStr() {
  const d = new Date()
  d.setDate(d.getDate() - 6)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
function monthStartStr() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${m}-01`
}
function inRange(iso) {
  if (!iso) return false
  const date = iso.slice(0, 10)
  switch (range.value) {
    case 'today':
      return date === todayStr()
    case 'week':
      return date >= weekStartStr() && date <= todayStr()
    case 'month':
      return date >= monthStartStr() && date <= todayStr()
    default:
      return true
  }
}

// ─── computed ──────────────────────────────────────────────────────────────
const filteredOrders = computed(() =>
  poStore.purchaseOrders.filter(
    (o) => inRange(o.createdAt) && (o.status === 'SHIPPING' || o.status === 'COMPLETED'),
  ),
)

const shippingCount = computed(
  () => filteredOrders.value.filter((o) => o.status === 'SHIPPING').length,
)
const completedCount = computed(
  () => filteredOrders.value.filter((o) => o.status === 'COMPLETED').length,
)

const progressRate = computed(() => {
  const total = shippingCount.value + completedCount.value
  if (total === 0) return null
  return Math.round((completedCount.value / total) * 100)
})

const avgProcessingDays = computed(() => {
  const completed = filteredOrders.value.filter(
    (o) => o.status === 'COMPLETED' && Array.isArray(o.statusHistory),
  )
  const diffs = []
  for (const o of completed) {
    const shipping = o.statusHistory.find((h) => h.status === 'SHIPPING')
    const done = o.statusHistory.find((h) => h.status === 'COMPLETED')
    if (!shipping?.at || !done?.at) continue
    const ms = new Date(done.at).getTime() - new Date(shipping.at).getTime()
    if (Number.isNaN(ms) || ms < 0) continue
    diffs.push(ms / (1000 * 60 * 60 * 24))
  }
  if (diffs.length === 0) return null
  return diffs.reduce((sum, v) => sum + v, 0) / diffs.length
})

// KPI 카드 — 본사 대시보드 패턴 (라벨 + 값/단위 + 우상단 점 + 캡션)
const kpiStats = computed(() => [
  {
    label: '입고 진행률',
    value: progressRate.value !== null ? String(progressRate.value) : '—',
    unit: progressRate.value !== null ? '%' : '',
    caption:
      progressRate.value !== null
        ? `총 ${shippingCount.value + completedCount.value}건 중 ${completedCount.value}건 완료`
        : '데이터 없음',
    tone: 'green',
  },
  {
    label: '입고 예정',
    value: String(shippingCount.value),
    unit: '건',
    caption: 'SHIPPING',
    tone: 'blue',
  },
  {
    label: '입고 완료',
    value: String(completedCount.value),
    unit: '건',
    caption: 'COMPLETED',
    tone: 'emerald',
  },
  {
    label: '평균 처리',
    value: avgProcessingDays.value !== null ? avgProcessingDays.value.toFixed(1) : '—',
    unit: avgProcessingDays.value !== null ? '일' : '',
    caption: 'SHIPPING → COMPLETED',
    tone: 'gray',
  },
])

function dotClass(tone) {
  return (
    {
      green: 'bg-[#004D3C]',
      blue: 'bg-sky-400',
      emerald: 'bg-emerald-400',
      gray: 'bg-gray-300',
    }[tone] ?? 'bg-gray-300'
  )
}

// 입고 예정 SHIPPING 발주 (도착 임박 — 오래된 순)
const shippingOrders = computed(() =>
  filteredOrders.value
    .filter((o) => o.status === 'SHIPPING')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
)

// 단계 비율 (세그먼트 스택 막대용)
const stageTotal = computed(() => shippingCount.value + completedCount.value)
const shippingPct = computed(() => {
  if (stageTotal.value === 0) return 0
  return Math.round((shippingCount.value / stageTotal.value) * 100)
})
const completedPct = computed(() => {
  if (stageTotal.value === 0) return 0
  return 100 - shippingPct.value
})

function formatDate(iso) {
  if (!iso) return '-'
  return iso.replace('T', ' ').slice(0, 16)
}
</script>

<template>
  <AppLayout
    active-top-menu="대시보드"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <!-- 헤더 -->
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p
              class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400"
            >
              WH Operation Dashboard
            </p>
            <h1 class="mt-1 text-xl font-black text-gray-950">물류창고 운영 현황</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              입고 흐름과 처리 현황을 한 화면에서 확인합니다.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex h-8 items-center gap-1 border border-[#D6EAEA] bg-[#EBF5F5] px-3 text-[11px] font-black text-[#004D3C]"
            >
              <Clock :size="13" />
              {{ dateLabel }}
            </span>
            <span
              class="inline-flex h-8 items-center gap-1 border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-black text-emerald-700"
            >
              <CheckCircle2 :size="13" />
              실시간 모니터링
            </span>
          </div>
        </div>
        <!-- 기간 토글 -->
        <div class="mt-3 flex flex-wrap gap-1">
          <button
            v-for="r in RANGE_TABS"
            :key="r.key"
            type="button"
            class="border px-3 py-1.5 text-[11px] font-black transition-colors"
            :class="
              range === r.key
                ? 'border-[#004D3C] bg-[#004D3C] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="range = r.key"
          >
            {{ r.label }}
          </button>
        </div>
      </section>

      <!-- KPI 카드 -->
      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article
          v-for="stat in kpiStats"
          :key="stat.label"
          class="border border-gray-200 bg-white p-3 shadow-sm"
        >
          <p class="text-[11px] font-bold text-gray-500">{{ stat.label }}</p>
          <div class="mt-3 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <span class="text-2xl font-black text-gray-950">{{ stat.value }}</span>
              <span v-if="stat.unit" class="ml-1 text-xs font-black text-gray-400">{{ stat.unit }}</span>
            </div>
            <span class="h-2.5 w-2.5 shrink-0" :class="dotClass(stat.tone)" />
          </div>
          <p class="mt-2 text-[11px] font-bold text-gray-400">{{ stat.caption }}</p>
        </article>
      </section>

      <!-- 본문: 입고 예정 테이블 (좌) + 단계별 진행 막대 (우) -->
      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <!-- 좌: 입고 예정 발주 -->
        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <Truck :size="16" class="text-blue-500" />
              입고 예정
            </h2>
            <button
              type="button"
              class="text-xs font-black text-[#004D3C] hover:underline"
              @click="goTo('/warehouse/inbound')"
            >
              입고 관리 가기
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-left text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-4 py-3 font-black">발주번호</th>
                  <th class="px-4 py-3 font-black">거래처</th>
                  <th class="px-4 py-3 font-black">입고 창고</th>
                  <th class="px-4 py-3 font-black">출발일</th>
                  <th class="px-4 py-3 text-right font-black">품목/총액</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="o in shippingOrders"
                  :key="o.id"
                  class="cursor-pointer hover:bg-[#EBF5F5]/60"
                  @click="goTo('/warehouse/inbound')"
                >
                  <td class="px-4 py-3 font-black text-gray-900">{{ o.id }}</td>
                  <td class="px-4 py-3 font-bold text-gray-700">{{ o.vendorName }}</td>
                  <td class="px-4 py-3 font-bold text-gray-700">{{ o.warehouseName }}</td>
                  <td class="px-4 py-3 font-bold text-gray-500">
                    {{ formatDate(o.createdAt) }}
                  </td>
                  <td class="px-4 py-3 text-right font-black text-gray-900">
                    {{ o.items.length }}품목 / ₩{{ o.totalPrice.toLocaleString() }}
                  </td>
                </tr>
                <tr v-if="shippingOrders.length === 0">
                  <td colspan="5" class="px-4 py-8 text-center text-xs text-gray-400">
                    입고 예정 발주가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <!-- 우: 단계별 현황 -->
        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <TrendingUp :size="16" />
              입고 단계별 현황
            </h2>
          </div>
          <div class="space-y-4 px-4 py-4">
            <!-- 큰 진행률 -->
            <div class="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <p class="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  진행률
                </p>
                <p class="mt-1 text-xs font-bold text-gray-500">
                  총 {{ stageTotal }}건 중 {{ completedCount }}건 완료
                </p>
              </div>
              <p
                v-if="progressRate !== null"
                class="text-3xl font-black text-[#004D3C]"
              >
                {{ progressRate }}%
              </p>
              <p v-else class="text-3xl font-black text-gray-400">—</p>
            </div>

            <!-- 세그먼트 스택 막대: SHIPPING + COMPLETED 비율 한 줄 -->
            <div>
              <p
                class="mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500"
              >
                단계 분포
              </p>
              <div
                v-if="stageTotal > 0"
                class="flex h-9 w-full overflow-hidden border border-gray-100"
              >
                <div
                  v-if="shippingCount > 0"
                  class="flex items-center justify-center bg-blue-400 transition-all duration-300"
                  :style="{ width: shippingPct + '%' }"
                >
                  <span
                    v-if="shippingPct >= 18"
                    class="text-[11px] font-black text-white"
                  >
                    {{ shippingCount }}건 · {{ shippingPct }}%
                  </span>
                </div>
                <div
                  v-if="completedCount > 0"
                  class="flex items-center justify-center bg-emerald-500 transition-all duration-300"
                  :style="{ width: completedPct + '%' }"
                >
                  <span
                    v-if="completedPct >= 18"
                    class="text-[11px] font-black text-white"
                  >
                    {{ completedCount }}건 · {{ completedPct }}%
                  </span>
                </div>
              </div>
              <div
                v-else
                class="flex h-9 w-full items-center justify-center border border-gray-100 bg-gray-50 text-[11px] font-bold text-gray-400"
              >
                데이터 없음
              </div>
            </div>

            <!-- 색 범례 + 단계별 수치 -->
            <div class="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <div class="flex items-start gap-2">
                <span class="mt-1 block h-2.5 w-2.5 shrink-0 bg-blue-400" />
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-bold uppercase text-gray-500">입고 예정</p>
                  <p class="mt-0.5 text-sm font-black text-blue-600">
                    {{ shippingCount }}건
                    <span class="ml-0.5 text-[10px] font-bold text-gray-400">
                      ({{ shippingPct }}%)
                    </span>
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <span class="mt-1 block h-2.5 w-2.5 shrink-0 bg-emerald-500" />
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-bold uppercase text-gray-500">입고 완료</p>
                  <p class="mt-0.5 text-sm font-black text-emerald-600">
                    {{ completedCount }}건
                    <span class="ml-0.5 text-[10px] font-bold text-gray-400">
                      ({{ completedPct }}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

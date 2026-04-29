<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Package,
  TrendingUp,
  Truck,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useWarehouseDashboardStore } from '@/stores/warehouseDashboard.js'
import { useWarehouseSpaceStore } from '@/stores/warehouseSpace.js'
import { useVendorStore } from '@/stores/vendor.js'
import { useWarehouseStockStore } from '@/stores/warehouseStock.js'

const router = useRouter()
const auth = useAuthStore()
const dashStore = useWarehouseDashboardStore()
const vendorStore = useVendorStore()
const stockStore = useWarehouseStockStore()

const topMenus = roleMenus.warehouse
const sideMenus = roleMenus.warehouse.find((menu) => menu.label === '대시보드')?.children ?? []
const activeTopMenu = computed(() => '대시보드')
const activeSideMenu = ref('창고 대시보드')

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

// range key → BE from/to 파라미터. all 은 둘 다 미지정.
const rangeParams = computed(() => {
  switch (range.value) {
    case 'today':
      return { from: todayStr(), to: todayStr() }
    case 'week':
      return { from: weekStartStr(), to: todayStr() }
    case 'month':
      return { from: monthStartStr(), to: todayStr() }
    default:
      return {}
  }
})

onMounted(() => {
  dashStore.fetchInboundProgress(rangeParams.value)
  // 안전재고 미달 KPI 산출용 — vendor_product 카탈로그 fetch (이미 있으면 no-op)
  vendorStore.fetchAllVendorProducts('ACTIVE').catch(() => {})
})

watch(range, () => {
  dashStore.fetchInboundProgress(rangeParams.value)
})

// ─── 단일 창고 컨텍스트 (창고관리자가 본인 창고 1개 담당, 인증 도입 시 me.warehouseId 로 교체) ──
const space = useWarehouseSpaceStore()

// 안전재고 미달 카운트 — 이 창고의 vendor_product 중 가용재고 < safetyStock × 1.5 행 개수
const shortageCount = computed(() => {
  const codes = (vendorStore.allVendorProducts ?? []).map((vp) => vp.productCode)
  return stockStore.getShortageCount(space.warehouseId, codes)
})

// ─── KPI / breakdown — store getter 직접 사용 ───────────────────────────────
const shippingCount = computed(() => dashStore.shippingCount)
const completedCount = computed(() => dashStore.completedCount)
const stageTotal = computed(() => dashStore.stageTotal)
const shippingPct = computed(() => dashStore.shippingPct)
const completedPct = computed(() => dashStore.completedPct)
const progressRate = computed(() => dashStore.progressPercent)

const totalCount = computed(() => dashStore.kpi.totalCount ?? 0)
const avgProcessingHours = computed(() => {
  const v = dashStore.kpi.avgProcessingHours
  return v === null || v === undefined ? null : v
})

// 안전재고 미달 카운트 — 이 창고의 vendor_product 중 가용재고 < safetyStock × 1.5 행 개수
// (space.warehouseId 가 단일 창고 시드 — 인증 도입 후 me.warehouseId 로 마이그레이션)
// 주: useWarehouseSpaceStore 인스턴스는 아래 공간 점유율 섹션에서 const space 로 선언됨

// KPI 카드 — 본사 대시보드 패턴 (라벨 + 값/단위 + 우상단 점 + 캡션)
const kpiStats = computed(() => [
  {
    label: '입고 진행률',
    value: progressRate.value !== null ? String(progressRate.value) : '—',
    unit: progressRate.value !== null ? '%' : '',
    caption:
      progressRate.value !== null
        ? `총 ${totalCount.value}건 중 ${completedCount.value}건 완료`
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
    value: avgProcessingHours.value !== null ? avgProcessingHours.value.toFixed(1) : '—',
    unit: avgProcessingHours.value !== null ? '시간' : '',
    caption: '발주 → 입고완료',
    tone: 'gray',
  },
  {
    label: '안전재고 미달',
    value: String(shortageCount.value),
    unit: '품목',
    caption: shortageCount.value > 0 ? '추가 발주 검토 필요' : '재고 충분',
    tone: shortageCount.value > 0 ? 'red' : 'gray',
  },
])

function dotClass(tone) {
  return (
    {
      green: 'bg-[#004D3C]',
      blue: 'bg-sky-400',
      emerald: 'bg-emerald-400',
      gray: 'bg-gray-300',
      red: 'bg-red-500',
    }[tone] ?? 'bg-gray-300'
  )
}

// 입고 예정 SHIPPING 발주 — store 가 도착 임박(오래된 순) 으로 정렬해서 줌
const shippingOrders = computed(() => dashStore.shippingOrders)

function formatDate(iso) {
  if (!iso) return '-'
  return iso.replace('T', ' ').slice(0, 16)
}

// ─── 공간 점유율 (WHS-003) ──────────────────────────────────────────────────
const thresholdLabel = computed(
  () =>
    ({
      normal: '정상',
      warning: '주의',
      critical: '경고',
    })[space.threshold],
)
const thresholdChipClass = computed(
  () =>
    ({
      normal: 'bg-emerald-50 text-emerald-700',
      warning: 'bg-amber-50 text-amber-700',
      critical: 'bg-red-50 text-red-700',
    })[space.threshold],
)
const thresholdTextClass = computed(
  () =>
    ({
      normal: 'text-emerald-600',
      warning: 'text-amber-600',
      critical: 'text-red-600',
    })[space.threshold],
)
const thresholdBarClass = computed(
  () =>
    ({
      normal: 'bg-emerald-500',
      warning: 'bg-amber-500',
      critical: 'bg-red-500',
    })[space.threshold],
)
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="topMenus"
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
      <section class="grid grid-cols-2 gap-3 lg:grid-cols-5">
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
                    {{ o.itemCount }}품목 / ₩{{ o.totalPrice.toLocaleString() }}
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
                  총 {{ totalCount }}건 중 {{ completedCount }}건 완료
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

      <!-- 공간 점유율 (WHS-003) -->
      <section class="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
        <!-- 좌: 큰 % + 진행 바 + 임계 칩 -->
        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <Package :size="16" />
              공간 점유율
            </h2>
            <span
              class="px-2 py-1 text-[11px] font-black"
              :class="thresholdChipClass"
            >
              {{ thresholdLabel }}
            </span>
          </div>
          <div class="space-y-3 p-4">
            <p class="text-xs font-bold text-gray-500">
              {{ space.warehouseName }} ({{ space.warehouseId }})
            </p>
            <div class="flex items-baseline gap-2">
              <p class="text-3xl font-black" :class="thresholdTextClass">
                {{ space.percent }}%
              </p>
              <p class="text-xs font-bold text-gray-500">
                {{ space.totalUsed.toLocaleString() }} /
                {{ space.maxCapacity.toLocaleString() }} EA
              </p>
            </div>
            <div class="h-3 w-full bg-gray-100">
              <div
                class="h-full transition-all duration-300"
                :class="thresholdBarClass"
                :style="{ width: Math.min(space.percent, 100) + '%' }"
              />
            </div>
            <p class="text-[11px] font-bold text-gray-400">
              80% 주의 · 90% 경고
            </p>
          </div>
        </article>

        <!-- 우: 카테고리별 분포 -->
        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <BarChart3 :size="16" />
              카테고리별 분포
            </h2>
            <span class="text-[11px] font-bold text-gray-400">
              합계 {{ space.totalUsed.toLocaleString() }} EA
            </span>
          </div>
          <div class="space-y-4 p-4">
            <!-- 세그먼트 스택 막대 -->
            <div
              v-if="space.totalUsed > 0"
              class="flex h-9 w-full overflow-hidden border border-gray-100"
            >
              <div
                v-for="c in space.categoryWithPct"
                :key="c.name"
                class="flex items-center justify-center transition-all duration-300"
                :class="c.color"
                :style="{ width: (c.used / space.totalUsed) * 100 + '%' }"
              >
                <span
                  v-if="(c.used / space.totalUsed) * 100 >= 12"
                  class="text-[11px] font-black text-white"
                >
                  {{ c.name }}
                </span>
              </div>
            </div>
            <!-- 색 범례 grid -->
            <div class="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <div
                v-for="c in space.categoryWithPct"
                :key="c.name"
                class="flex items-start gap-2"
              >
                <span class="mt-1 block h-2.5 w-2.5 shrink-0" :class="c.color" />
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-bold uppercase text-gray-500">
                    {{ c.name }}
                  </p>
                  <p class="mt-0.5 text-sm font-black text-gray-900">
                    {{ c.used.toLocaleString() }} EA
                    <span class="ml-0.5 text-[10px] font-bold text-gray-400">
                      ({{ c.pct }}%)
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

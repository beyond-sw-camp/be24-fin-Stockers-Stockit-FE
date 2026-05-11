<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Repeat } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import ChartTooltip from '@/components/common/charts/ChartTooltip.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { turnoverAnalyticsApi } from '@/api/hq/analytics.js'
import { getInfrastructures } from '@/api/hq/infrastructure.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('재고 회전율 통계')

// ─── 필터 ──────────────────────────────────────────────────────────────
const periodUnit = ref('연간')
const scopeFilter = ref('전사 통합')        // '전사 통합' | '매장' | '창고'
const locationCode = ref('')                // 특정 위치 한정 (옵션, '' = 전체)

const PERIOD_MAP = { '일간': 'DAY', '월간': 'MONTH', '연간': 'YEAR' }
const SCOPE_MAP  = { '전사 통합': 'ALL', '매장': 'STORE', '창고': 'WAREHOUSE' }

// ─── 인프라 마스터 (위치 드롭다운 동적 옵션) ─────────────────────────
const stores = ref([])
const warehouses = ref([])

async function loadInfrastructures() {
  try {
    const [s, w] = await Promise.all([
      getInfrastructures({ type: 'STORE', status: 'ACTIVE' }),
      getInfrastructures({ type: 'WAREHOUSE', status: 'ACTIVE' }),
    ])
    stores.value = Array.isArray(s) ? s : []
    warehouses.value = Array.isArray(w) ? w : []
  } catch (e) {
    console.error('[TurnoverView] loadInfrastructures failed', e)
    stores.value = []
    warehouses.value = []
  }
}

// 그룹 따라 위치 옵션 동적 노출
const locationOptions = computed(() => {
  if (scopeFilter.value === '매장') return stores.value
  if (scopeFilter.value === '창고') return warehouses.value
  return []  // 전사 통합: 개별 위치 선택 불가
})

// ─── BE 연동 — 회전율 통계 ─────────────────────────────────────────────
const statsData = ref(null)
const loading = ref(false)
const loadError = ref('')

// 기간 단위 → from/to 산출 (이번 주기는 단순화: 최근 N개월)
function resolveDateRange() {
  const today = new Date()
  const pad2 = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  // 회전율 통계는 보통 최근 1~12개월 윈도우. 단위별 윈도우:
  //   일간 → 최근 30일 / 월간 → 최근 60일 (전월+당월) / 연간 → 최근 365일
  let fromDate
  if (periodUnit.value === '일간') {
    fromDate = new Date(today)
    fromDate.setDate(fromDate.getDate() - 29)
  } else if (periodUnit.value === '연간') {
    fromDate = new Date(today)
    fromDate.setDate(fromDate.getDate() - 364)
  } else {
    // 월간 — 전월 1일 ~ 오늘
    fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  }
  return { from: fmt(fromDate), to: fmt(today) }
}

async function fetchTurnoverStats() {
  loading.value = true
  loadError.value = ''
  try {
    const { from, to } = resolveDateRange()
    statsData.value = await turnoverAnalyticsApi.get({
      period: PERIOD_MAP[periodUnit.value] ?? 'MONTH',
      from, to,
      scope: SCOPE_MAP[scopeFilter.value] ?? 'ALL',
      locationCode: locationCode.value || null,
    })
  } catch (e) {
    console.error('[TurnoverView] fetch failed', e)
    loadError.value = '재고 회전율 통계를 불러오지 못했습니다.'
    statsData.value = null
  } finally {
    loading.value = false
  }
}

// scope 변경 시 locationCode 자동 리셋 (옛 그룹의 위치코드가 새 그룹엔 없을 수 있음)
watch(scopeFilter, () => { locationCode.value = '' })
watch([periodUnit, scopeFilter, locationCode], fetchTurnoverStats)

onMounted(async () => {
  await loadInfrastructures()
  await fetchTurnoverStats()
})

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// ─── 금액 표기 — 풀 콤마 원 단위 (₩X,XXX,XXX) — 통계 페이지 통일 ──────
//   BE 응답의 value/totalValue/lockedValue 는 백만원 단위 (예: 808.4 = 8.084억원)
function formatKoreanMoney(won) {
  if (won == null || isNaN(won)) return '₩0'
  return `₩${Number(won).toLocaleString('ko-KR')}`
}
function formatMillionWon(million) {
  if (million == null || isNaN(million)) return '₩0'
  return formatKoreanMoney(Math.round(Number(million) * 1_000_000))
}

// ─── 매장·창고별 회전율 (BE 응답 → FE 매핑) ──────────────────────────
const filteredData = computed(() => {
  return (statsData.value?.locationStats ?? []).map((d) => ({
    name: d.name,
    type: d.type,
    avgInventory: d.avgInventory ?? 0,
    sales: d.sales ?? 0,
    turnover: Number(d.turnover ?? 0),
    daysOnHand: Number(d.daysOnHand ?? 0),
    status: d.status ?? '품절',
  }))
})

// 재고 건강 진단 영역의 안내 텍스트에서 사용
const avgDaysOnHand = computed(() => {
  const list = filteredData.value
  if (list.length === 0) return '0.0'
  return (list.reduce((s, d) => s + d.daysOnHand, 0) / list.length).toFixed(1)
})

const maxTurnover = computed(() => Math.max(...filteredData.value.map((d) => d.turnover), 1))

// ─── 재고 건강도 진단 + 신호등 분포 (BE 응답 그대로) ─────────────────
const inventoryHealth = computed(() => {
  const h = statsData.value?.inventoryHealth
  if (!h) {
    return {
      totalSku: 0, healthy: 0, caution: 0, warning: 0, danger: 0,
      totalValue: 0, lockedValue: 0,
    }
  }
  return {
    totalSku: h.totalSku ?? 0,
    healthy: h.healthy ?? 0,
    caution: h.caution ?? 0,
    warning: h.warning ?? 0,
    danger: h.danger ?? 0,
    totalValue: Number(h.totalValue ?? 0),
    lockedValue: Number(h.lockedValue ?? 0),
  }
})

const overallDiagnosis = computed(() => {
  const dangerRatio = (inventoryHealth.value.danger / inventoryHealth.value.totalSku) * 100
  if (dangerRatio > 10) return {
    emoji: '😱', status: '위험', borderColor: 'border-red-300', bgColor: 'bg-gradient-to-br from-red-50 to-white',
    textColor: 'text-red-700', message: '즉시 조치가 필요합니다',
  }
  if (dangerRatio > 5) return {
    emoji: '😟', status: '주의', borderColor: 'border-amber-300', bgColor: 'bg-gradient-to-br from-amber-50 to-white',
    textColor: 'text-amber-700', message: '악성 재고 관리가 필요합니다',
  }
  if (dangerRatio > 2) return {
    emoji: '🙂', status: '양호', borderColor: 'border-blue-300', bgColor: 'bg-gradient-to-br from-blue-50 to-white',
    textColor: 'text-blue-700', message: '대체로 건강합니다',
  }
  return {
    emoji: '😊', status: '건강', borderColor: 'border-emerald-300', bgColor: 'bg-gradient-to-br from-emerald-50 to-white',
    textColor: 'text-emerald-700', message: '재고가 잘 회전되고 있어요',
  }
})

// 팀 컨벤션 통일 — 정상/부족/품절 3단계 (BE 응답 4단계 caution+warning 합산)
const healthSegments = computed(() => {
  const h = inventoryHealth.value
  return [
    { key: 'normal', label: '🟢 정상', count: h.healthy,                desc: '잘 팔리고 있어요',         range: '회전율 4x+ · 90일 이내',     cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { key: 'short',  label: '🟡 부족', count: h.caution + h.warning,    desc: '회전이 느려요',             range: '회전율 1~4x · 90~365일',     cls: 'bg-amber-50 border-amber-200 text-amber-700' },
    { key: 'out',    label: '🔴 품절', count: h.danger,                 desc: '1년 넘게 안 팔림',          range: '회전율 1x 미만 · 악성',     cls: 'bg-red-50 border-red-300 text-red-700' },
  ]
})

// ─── 신호등 단계별 SKU 리스트 (BE 4단계 → FE 3단계 통합) ──────────
//   short = caution + warning 합쳐서 회전율 오름차순 (악성 가까운 순)
const skuByHealth = computed(() => {
  const h = statsData.value?.inventoryHealth
  if (!h) return { normal: [], short: [], out: [] }
  const cautionList = h.cautionSkus ?? []
  const warningList = h.warningSkus ?? []
  const merged = [...warningList, ...cautionList].sort(
    (a, b) => Number(a.turnover ?? 0) - Number(b.turnover ?? 0)
  )
  return {
    normal: h.healthySkus ?? [],
    short: merged,
    out: h.dangerSkus ?? [],
  }
})

// ─── 신호등 모달 ──────────────────────────────────────────────────────
const segmentModalOpen = ref(false)
const segmentModalKey = ref(null)

const segmentModalData = computed(() => {
  if (!segmentModalKey.value) return null
  const seg = healthSegments.value.find((s) => s.key === segmentModalKey.value)
  if (!seg) return null
  return {
    ...seg,
    items: skuByHealth.value[segmentModalKey.value] ?? [],
  }
})

function openSegmentModal(key) {
  segmentModalKey.value = key
  segmentModalOpen.value = true
}

function closeSegmentModal() {
  segmentModalOpen.value = false
  segmentModalKey.value = null
}

// ─── 악성 재고 TOP 5 (BE dangerSkus 회전율 오름차순 + units 큰 순 = 묶인 자금 大 순) ──────
//   체크박스 선택 상태는 클라사이드. 순환재고 전환 액션 (POST) 은 다음 사이클.
const deadStockSelected = ref(new Set())  // skuCode + location 조합으로 식별

const deadStockList = computed(() => {
  const dangers = statsData.value?.inventoryHealth?.dangerSkus ?? []
  // value 내림차순 (묶인 자금 큰 순) Top 5
  return [...dangers]
    .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))
    .slice(0, 5)
    .map((d, i) => {
      const id = `${d.skuCode}__${d.location}`
      return {
        id,
        rank: i + 1,
        sku: d.skuCode,
        name: d.productName,
        category: d.category,
        location: d.location,
        daysHeld: d.daysOnHand,
        units: d.units,
        value: Number(d.value ?? 0),
        turnover: Number(d.turnover ?? 0),
        selected: deadStockSelected.value.has(id),
      }
    })
})

const selectedDeadStock = computed(() => deadStockList.value.filter((d) => d.selected))
const selectedTotalValue = computed(() =>
  selectedDeadStock.value.reduce((s, d) => s + d.value, 0).toFixed(1),
)
const selectedTotalUnits = computed(() =>
  selectedDeadStock.value.reduce((s, d) => s + d.units, 0),
)

const allSelected = computed({
  get: () => deadStockList.value.length > 0 && deadStockList.value.every((d) => d.selected),
  set: (v) => {
    if (v) deadStockList.value.forEach((d) => deadStockSelected.value.add(d.id))
    else deadStockSelected.value.clear()
  },
})

function toggleDeadStock(item) {
  if (deadStockSelected.value.has(item.id)) deadStockSelected.value.delete(item.id)
  else deadStockSelected.value.add(item.id)
}

function transferToCirculation(items) {
  const list = Array.isArray(items) ? items : [items]
  if (!list.length) {
    alert('전환할 품목을 선택해주세요.')
    return
  }
  const totalValueMillion = list.reduce((s, d) => s + d.value, 0)
  const totalUnits = list.reduce((s, d) => s + d.units, 0)
  alert(
    `🔄 ${list.length}개 품목을 순환재고로 전환합니다\n` +
    `총 ${totalUnits}개 / ${formatMillionWon(totalValueMillion)}\n\n` +
    `→ 순환재고 후보 목록으로 이동합니다.`,
  )
  router.push('/hq/circular-inventory/candidates')
}

// 팀 컨벤션 통일: 재고 페이지의 "정상/부족/품절" 3단계 라벨 사용
const statusCls = {
  정상: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  부족: 'bg-amber-50 text-amber-700 border-amber-200',
  품절: 'bg-red-50 text-red-700 border-red-200',
}

</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-3">

      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Repeat :size="18" class="text-emerald-600" />
            재고 회전율 통계
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
        </div>
        <div class="flex flex-col items-end gap-0.5 text-[10px] text-gray-500">
          <span><b class="text-gray-700">재고 회전율</b> = 판매량 ÷ 평균 재고</span>
          <span><b class="text-gray-700">재고 보유일수</b> = 평균 재고 ÷ 하루 평균 판매량</span>
        </div>
      </section>

      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">기간</span>
          <div class="flex border border-gray-200">
            <button
              v-for="opt in ['일간', '월간', '연간']"
              :key="opt"
              type="button"
              class="px-3 py-1 text-[11px] font-semibold transition-colors"
              :class="periodUnit === opt ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
              @click="periodUnit = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">유형</span>
          <select v-model="scopeFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option>전사 통합</option>
            <option>매장</option>
            <option>창고</option>
          </select>
        </div>
        <div v-if="scopeFilter !== '전사 통합'" class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">위치</span>
          <select v-model="locationCode" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option value="">전체</option>
            <option v-for="opt in locationOptions" :key="opt.code" :value="opt.code">{{ opt.name }}</option>
          </select>
        </div>
        <span v-if="loading" class="text-[11px] font-medium text-emerald-600">불러오는 중…</span>
        <span v-else-if="loadError" class="text-[11px] font-medium text-rose-600">{{ loadError }}</span>
      </section>


      <!-- ━━━━━━━ 재고 건강 진단 배너 + 회전율 의미 ━━━━━━━ -->
      <section
        :class="[overallDiagnosis.borderColor, overallDiagnosis.bgColor]"
        class="border-2 px-5 py-4 shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <span class="text-5xl">{{ overallDiagnosis.emoji }}</span>
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">재고 건강 진단</p>
              <h2 class="mt-0.5 text-lg font-black text-gray-900">
                현재 재고 상태:
                <span :class="overallDiagnosis.textColor">{{ overallDiagnosis.status }}</span>
              </h2>
              <p class="mt-1 text-xs text-gray-600">
                💡 평균 <span class="font-bold">{{ avgDaysOnHand }}일</span>에 한 번 다 팔리고 새 재고가 들어와요
                ({{ overallDiagnosis.message }})
              </p>
              <p class="mt-1 text-[11px] text-gray-500">
                ⚠️ 단, <span class="font-bold text-red-600">{{ inventoryHealth.danger }}개 품목</span>이
                1년 넘게 안 팔리고 있어요 (묶인 자금 <span class="font-bold text-red-600">{{ formatMillionWon(inventoryHealth.lockedValue) }}</span>)
              </p>
            </div>
          </div>
          <div class="rounded border border-gray-200 bg-white/70 px-4 py-3 text-[10px] text-gray-600">
            <p class="font-bold text-gray-700">📚 회전율이란?</p>
            <p class="mt-1">1년에 같은 재고가 <b>몇 번 팔리고 다시 채워지는지</b></p>
            <p class="mt-1.5 grid grid-cols-2 gap-x-3">
              <span>6x =</span><span class="font-bold text-emerald-600">60일 보유 (빠름)</span>
              <span>4x =</span><span class="font-bold text-blue-600">90일 보유 (정상)</span>
              <span>2x =</span><span class="font-bold text-amber-600">180일 보유 (느림)</span>
              <span>1x↓ =</span><span class="font-bold text-red-600">악성 재고</span>
            </p>
          </div>
        </div>
      </section>

      <!-- ━━━━━━━ 신호등 분포 3구간 (정상/부족/품절, 클릭 시 모달) ━━━━━━━ -->
      <section class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          v-for="seg in healthSegments"
          :key="seg.key"
          type="button"
          :class="[seg.cls]"
          class="cursor-pointer border-2 px-4 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1"
          @click="openSegmentModal(seg.key)"
        >
          <p class="text-[11px] font-black uppercase tracking-wider">{{ seg.label }}</p>
          <p class="mt-2 text-3xl font-black">{{ seg.count }}<span class="ml-1 text-xs font-bold opacity-70">품목</span></p>
          <p class="mt-1 text-[11px] font-bold opacity-90">{{ seg.desc }}</p>
          <p class="mt-2 border-t border-current/20 pt-2 text-[10px] opacity-60">{{ seg.range }}</p>
          <p class="mt-2 text-[10px] font-bold opacity-70">📋 클릭하여 품목 보기 →</p>
        </button>
      </section>

      <!-- ━━━━━━━ 악성 재고 TOP 5 ━━━━━━━ -->
      <section class="border border-red-300 bg-white shadow-sm">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50/50 px-4 py-3">
          <div>
            <h3 class="flex items-center gap-2 text-sm font-black text-red-700">
              🚨 악성 재고 TOP 5
            </h3>
            <p class="mt-0.5 text-[10px] text-gray-500">
              1년 이상 회전이 멈춘 재고 — 묶인 자금 큰 순 상위 5건 ·
              총 묶인 자금 <span class="font-bold text-red-600">{{ formatMillionWon(inventoryHealth.lockedValue) }}</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-[#003d30]"
              @click="router.push('/hq/circular-inventory')"
            >
              🔄 전체 순환재고 보기
            </button>
          </div>
        </header>
        <div class="overflow-auto">
          <table class="w-full min-w-[820px] text-xs">
            <thead class="bg-gray-100 text-[10px] text-gray-500">
              <tr>
                <th class="w-10 px-2 py-2 text-center font-bold">
                  <input type="checkbox" v-model="allSelected" class="cursor-pointer accent-[#004D3C]" />
                </th>
                <th class="w-12 px-3 py-2 text-center font-bold">순위</th>
                <th class="w-28 px-3 py-2 text-left font-bold">SKU</th>
                <th class="px-3 py-2 text-left font-bold">품명</th>
                <th class="w-20 px-3 py-2 text-center font-bold">카테고리</th>
                <th class="w-24 px-3 py-2 text-left font-bold">위치</th>
                <th class="w-20 px-3 py-2 text-right font-bold">보유일</th>
                <th class="w-20 px-3 py-2 text-right font-bold">회전율</th>
                <th class="w-20 px-3 py-2 text-right font-bold">수량</th>
                <th class="w-24 px-3 py-2 text-right font-bold">묶인 금액</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="d in deadStockList"
                :key="d.id"
                class="hover:bg-red-50/30"
                :class="d.selected ? 'bg-emerald-50/40' : ''"
              >
                <td class="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    :checked="d.selected"
                    @change="toggleDeadStock(d)"
                    class="cursor-pointer accent-[#004D3C]"
                  />
                </td>
                <td class="px-3 py-2 text-center font-black text-red-600">{{ d.rank }}</td>
                <td class="px-3 py-2 font-mono text-[10px] text-gray-600">{{ d.sku }}</td>
                <td class="px-3 py-2 font-bold text-gray-800">{{ d.name }}</td>
                <td class="px-3 py-2 text-center text-gray-600">{{ d.category }}</td>
                <td class="px-3 py-2 text-gray-700">{{ d.location }}</td>
                <td class="px-3 py-2 text-right font-mono">
                  <span class="font-bold text-red-600">{{ d.daysHeld }}</span>
                  <span class="text-gray-400">일</span>
                </td>
                <td class="px-3 py-2 text-right font-mono">
                  <span class="font-bold text-red-600">{{ d.turnover }}x</span>
                </td>
                <td class="px-3 py-2 text-right font-mono text-gray-700">{{ d.units }}개</td>
                <td class="px-3 py-2 text-right font-mono font-bold text-red-700">{{ formatMillionWon(d.value) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-[10px] text-gray-500">
          <span>💡 1년 이상 회전이 멈춘 SKU 입니다. 순환재고 운영 정책은 <b>순환재고 메뉴</b>에서 결정하세요.</span>
        </footer>
      </section>

      <section class="grid gap-3 xl:grid-cols-3">
        <article class="border border-gray-300 bg-white shadow-sm xl:col-span-2">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">매장·창고별 회전율 비교</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">단위: 회 (회전율 = 기간 내 판매량 / 평균 재고)</p>
          </div>
          <div class="px-3 py-3">
            <div class="space-y-2">
              <div
                v-for="d in filteredData"
                :key="d.name"
                class="group relative flex items-center gap-3 rounded px-1 py-0.5 transition-colors hover:bg-violet-50/40"
              >
                <div class="w-44 shrink-0">
                  <p class="truncate text-[12px] font-medium text-gray-700">{{ d.name }}</p>
                  <p class="text-[9px] text-gray-400">{{ d.type }}</p>
                </div>
                <div class="h-3 flex-1 overflow-hidden bg-gray-100">
                  <div
                    class="h-3 transition-all group-hover:brightness-110"
                    :class="d.turnover >= 4.5 ? 'bg-emerald-500' : d.turnover >= 3 ? 'bg-blue-500' : d.turnover >= 2.5 ? 'bg-amber-500' : 'bg-red-500'"
                    :style="{ width: (d.turnover / maxTurnover * 100) + '%' }"
                  />
                </div>
                <span class="w-12 shrink-0 text-right text-[11px] font-bold text-gray-700">{{ d.turnover }}x</span>
                <span class="w-14 shrink-0 text-right text-[10px] text-gray-400">{{ d.daysOnHand }}일</span>
                <ChartTooltip>
                  <p class="text-[11px] font-bold text-violet-300">{{ d.name }}</p>
                  <p class="text-[9px] text-gray-300">{{ d.type }}</p>
                  <div class="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-gray-700 pt-1 text-[10px]">
                    <span class="text-gray-400">회전율</span>
                    <span class="text-right font-bold text-violet-300">{{ d.turnover }}x</span>
                    <span class="text-gray-400">보유일수</span>
                    <span class="text-right font-semibold">{{ d.daysOnHand }}일</span>
                    <span class="text-gray-400">평균 재고</span>
                    <span class="text-right font-semibold">{{ d.avgInventory.toLocaleString() }}</span>
                    <span class="text-gray-400">판매량</span>
                    <span class="text-right font-semibold">{{ d.sales.toLocaleString() }}</span>
                    <span class="text-gray-400">상태</span>
                    <span class="text-right font-bold" :class="d.status === '정상' ? 'text-emerald-400' : d.status === '부족' ? 'text-amber-400' : 'text-red-400'">{{ d.status }}</span>
                  </div>
                </ChartTooltip>
              </div>
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">매장·창고 상세</h3>
          </div>
          <div class="overflow-auto">
            <table class="w-full text-[12px]">
              <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">대상</th>
                  <th class="px-3 py-2 text-right font-semibold">회전율</th>
                  <th class="px-3 py-2 text-right font-semibold">보유일수</th>
                  <th class="px-3 py-2 text-center font-semibold">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 border-t border-gray-200">
                <tr v-for="d in filteredData" :key="d.name" class="hover:bg-gray-50/60">
                  <td class="px-3 py-2 font-medium text-gray-800">{{ d.name }}</td>
                  <td class="px-3 py-2 text-right font-bold text-gray-700">{{ d.turnover }}x</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ d.daysOnHand }}일</td>
                  <td class="px-3 py-2 text-center">
                    <span class="inline-flex border px-1.5 py-0.5 text-[10px] font-bold" :class="statusCls[d.status]">
                      {{ d.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>


    </div>

    <!-- ━━━━━━━ 신호등 단계별 SKU 모달 ━━━━━━━ -->
    <Teleport to="body">
      <div
        v-if="segmentModalOpen && segmentModalData"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        @click.self="closeSegmentModal"
      >
        <div class="flex max-h-[85vh] w-full max-w-4xl flex-col border border-gray-300 bg-white shadow-xl">
          <!-- Header -->
          <header
            :class="[segmentModalData.cls]"
            class="flex items-center justify-between border-b-2 px-5 py-3"
          >
            <div>
              <p class="text-[11px] font-black uppercase tracking-wider">{{ segmentModalData.label }}</p>
              <h3 class="mt-0.5 text-base font-black">
                {{ segmentModalData.count }}품목 — {{ segmentModalData.desc }}
              </h3>
              <p class="mt-0.5 text-[10px] opacity-70">{{ segmentModalData.range }}</p>
            </div>
            <button
              type="button"
              class="border border-current/30 bg-white/60 px-2 py-1 text-[11px] font-bold hover:bg-white"
              @click="closeSegmentModal"
            >
              ✕ 닫기
            </button>
          </header>

          <!-- Body -->
          <div class="flex-1 overflow-auto">
            <table class="w-full min-w-[760px] text-[12px]">
              <thead class="sticky top-0 bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">SKU</th>
                  <th class="px-3 py-2 text-left font-semibold">상품명</th>
                  <th class="px-3 py-2 text-left font-semibold">카테고리</th>
                  <th class="px-3 py-2 text-left font-semibold">위치</th>
                  <th class="px-3 py-2 text-right font-semibold">회전율</th>
                  <th class="px-3 py-2 text-right font-semibold">보유일</th>
                  <th class="px-3 py-2 text-right font-semibold">재고</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 border-t border-gray-200">
                <tr
                  v-for="item in segmentModalData.items"
                  :key="item.skuCode"
                  class="hover:bg-gray-50/60"
                >
                  <td class="px-3 py-2 font-mono text-[11px] text-gray-600">{{ item.skuCode }}</td>
                  <td class="px-3 py-2 font-medium text-gray-800">{{ item.productName }}</td>
                  <td class="px-3 py-2 text-gray-600">{{ item.category }}</td>
                  <td class="px-3 py-2 text-gray-600">{{ item.location }}</td>
                  <td class="px-3 py-2 text-right font-bold text-gray-700">{{ item.turnover }}x</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ item.daysOnHand }}일</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ item.units }}개</td>
                </tr>
                <tr v-if="!segmentModalData.items.length">
                  <td colspan="7" class="px-3 py-8 text-center text-xs text-gray-400">
                    표시할 품목이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <footer class="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-5 py-2.5 text-[10px] text-gray-500">
            <span>
              표시 중: <b>{{ segmentModalData.items.length }}</b>개 / 전체 <b>{{ segmentModalData.count }}</b>품목
              <span v-if="segmentModalData.items.length < segmentModalData.count" class="ml-1 text-gray-400">(샘플)</span>
            </span>
            <button
              type="button"
              class="border border-gray-300 bg-white px-3 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-100"
              @click="closeSegmentModal"
            >
              닫기
            </button>
          </footer>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

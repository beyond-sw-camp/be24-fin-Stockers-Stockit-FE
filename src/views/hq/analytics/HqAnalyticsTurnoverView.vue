<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Repeat, Timer, TrendingUp, AlertTriangle } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import ChartTooltip from '@/components/common/charts/ChartTooltip.vue'
import LineChart from '@/components/common/charts/LineChart.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('재고 회전율 통계')

const periodUnit = ref('월간')
const scopeFilter = ref('전사 통합')
const categoryFilter = ref('전체')
const sizeFilter = ref('전체')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// 매장·창고별 회전율 (CEN-047: 본사 창고 + 가맹점)
const turnoverData = [
  { name: '본사 인천 제1창고', type: '본사 창고', avgInventory: 18420, sales: 92100, turnover: 5.0, daysOnHand: 6.0, status: '우수' },
  { name: '본사 이천 풀필먼트', type: '본사 창고', avgInventory: 12640, sales: 50560, turnover: 4.0, daysOnHand: 7.5, status: '정상' },
  { name: '본사 부산 물류창고', type: '본사 창고', avgInventory: 9820, sales: 27496, turnover: 2.8, daysOnHand: 10.7, status: '저조' },
  { name: '스톡잇 강남점', type: '직영점', avgInventory: 1240, sales: 8060, turnover: 6.5, daysOnHand: 4.6, status: '우수' },
  { name: '판교 테크노점', type: '직영점', avgInventory: 1080, sales: 5832, turnover: 5.4, daysOnHand: 5.6, status: '우수' },
  { name: '여의도 IFC몰점', type: '직영점', avgInventory: 1340, sales: 6432, turnover: 4.8, daysOnHand: 6.3, status: '정상' },
  { name: '성수 리빙샵', type: '직영점', avgInventory: 980, sales: 2842, turnover: 2.9, daysOnHand: 10.3, status: '저조' },
  { name: '부산 센텀점', type: '직영점', avgInventory: 1450, sales: 3045, turnover: 2.1, daysOnHand: 14.3, status: '경고' },
]

const filteredData = computed(() => {
  if (scopeFilter.value === '본사 창고만') return turnoverData.filter((d) => d.type === '본사 창고')
  if (scopeFilter.value === '직영점만') return turnoverData.filter((d) => d.type === '직영점')
  return turnoverData
})

const avgTurnover = computed(() => {
  const list = filteredData.value
  if (list.length === 0) return '0.00'
  return (list.reduce((s, d) => s + d.turnover, 0) / list.length).toFixed(2)
})

const avgDaysOnHand = computed(() => {
  const list = filteredData.value
  if (list.length === 0) return '0.0'
  return (list.reduce((s, d) => s + d.daysOnHand, 0) / list.length).toFixed(1)
})

const bestTurnover = computed(() =>
  filteredData.value.length ? filteredData.value.reduce((a, b) => (a.turnover > b.turnover ? a : b)) : { name: '-', turnover: 0 },
)

const worstTurnover = computed(() =>
  filteredData.value.length ? filteredData.value.reduce((a, b) => (a.turnover < b.turnover ? a : b)) : { name: '-', daysOnHand: 0 },
)

const maxTurnover = computed(() => Math.max(...filteredData.value.map((d) => d.turnover), 1))

// 6개월 추이
const trendByMonth = [
  { m: '11월', value: 4.2 },
  { m: '12월', value: 4.5 },
  { m: '1월', value: 4.0 },
  { m: '2월', value: 4.3 },
  { m: '3월', value: 4.6 },
  { m: '4월', value: 4.2 },
]

// 카테고리별 회전율
const categoryTurnover = [
  { category: '상의', avgInventory: 8420, sales: 51360, turnover: 6.1, daysOnHand: 4.9 },
  { category: '바지', avgInventory: 6240, sales: 31200, turnover: 5.0, daysOnHand: 6.0 },
  { category: '치마', avgInventory: 1820, sales: 6916, turnover: 3.8, daysOnHand: 7.9 },
  { category: '아우터', avgInventory: 5240, sales: 13624, turnover: 2.6, daysOnHand: 11.5 },
]

const kpiMetrics = computed(() => [
  { label: '평균 회전율', value: avgTurnover.value, unit: 'x', sub: `목표 4.5x ${parseFloat(avgTurnover.value) >= 4.5 ? '상회' : '미달'}`, icon: Repeat, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '평균 보유일', value: avgDaysOnHand.value, unit: '일', sub: '평균 재고 ÷ 일 평균 판매', icon: Timer, valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
  { label: '회전율 1위', value: bestTurnover.value.turnover, unit: 'x', sub: bestTurnover.value.name, icon: TrendingUp, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
  { label: '주의 필요', value: worstTurnover.value.daysOnHand, unit: '일', sub: worstTurnover.value.name, icon: AlertTriangle, valueCls: 'text-red-700', iconBg: 'bg-red-50', iconCls: 'text-red-600' },
])

// ─── 재고 건강도 진단 + 신호등 분포 ────────────────────────────────────
const inventoryHealth = ref({
  totalSku: 217,
  healthy: 150,   // 🟢 회전율 4x+ (보유 90일 이내)
  caution: 35,    // 🟡 회전율 2~4x (보유 90~180일)
  warning: 20,    // 🟠 회전율 1~2x (보유 180~365일)
  danger: 12,     // 🔴 회전율 1x 미만 (보유 365일 초과 = 악성)
  totalValue: 412.5,    // 단위 M원
  lockedValue: 22.4,    // 악성재고 묶인 금액 M원
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

const healthSegments = computed(() => [
  { key: 'healthy', label: '🟢 정상', count: inventoryHealth.value.healthy, desc: '잘 팔리고 있어요',         range: '회전율 4x+ · 90일 이내', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { key: 'caution', label: '🟡 주의', count: inventoryHealth.value.caution, desc: '살짝 느려요',              range: '회전율 2~4x · 90~180일', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
  { key: 'warning', label: '🟠 경고', count: inventoryHealth.value.warning, desc: '6개월 이상 보유',           range: '회전율 1~2x · 180~365일', cls: 'bg-orange-50 border-orange-300 text-orange-700' },
  { key: 'danger',  label: '🔴 위험', count: inventoryHealth.value.danger,  desc: '1년 넘게 안 팔림',          range: '회전율 1x 미만 · 악성', cls: 'bg-red-50 border-red-300 text-red-700' },
])

// ─── 악성 재고 리스트 (순환재고 전환 워크플로우) ──────────────────────
const deadStockList = ref([
  { rank: 1, sku: 'SKU-OUT-001', name: '롱 패딩 (블랙, L)',     category: '아우터', location: '강남점',    daysHeld: 245, units: 120, value: 9.6, turnover: 0.5, selected: true },
  { rank: 2, sku: 'SKU-OUT-088', name: '캐시미어 가디건 (베이지)', category: '아우터', location: '부산 센텀점', daysHeld: 198, units: 85,  value: 4.2, turnover: 0.8, selected: true },
  { rank: 3, sku: 'SKU-SKR-012', name: '미니 스커트 (네이비)',    category: '치마',    location: '여의도점',  daysHeld: 178, units: 60,  value: 1.8, turnover: 1.0, selected: true },
  { rank: 4, sku: 'SKU-OUT-042', name: '울 자켓 (그레이, M)',     category: '아우터', location: '판교점',    daysHeld: 165, units: 38,  value: 2.5, turnover: 1.1, selected: false },
  { rank: 5, sku: 'SKU-SKR-007', name: '플레어 롱스커트 (블랙)',  category: '치마',    location: '성수점',    daysHeld: 152, units: 45,  value: 1.4, turnover: 1.3, selected: false },
])

const selectedDeadStock = computed(() => deadStockList.value.filter((d) => d.selected))
const selectedTotalValue = computed(() =>
  selectedDeadStock.value.reduce((s, d) => s + d.value, 0).toFixed(1),
)
const selectedTotalUnits = computed(() =>
  selectedDeadStock.value.reduce((s, d) => s + d.units, 0),
)

const allSelected = computed({
  get: () => deadStockList.value.every((d) => d.selected),
  set: (v) => deadStockList.value.forEach((d) => { d.selected = v }),
})

function transferToCirculation(items) {
  const list = Array.isArray(items) ? items : [items]
  if (!list.length) {
    alert('전환할 품목을 선택해주세요.')
    return
  }
  const totalValue = list.reduce((s, d) => s + d.value, 0).toFixed(1)
  const totalUnits = list.reduce((s, d) => s + d.units, 0)
  alert(
    `🔄 ${list.length}개 품목을 순환재고로 전환합니다\n` +
    `총 ${totalUnits}개 / ₩${totalValue}M\n\n` +
    `→ 순환재고 후보 목록으로 이동합니다.`,
  )
  router.push('/hq/circular-inventory/candidates')
}

const statusCls = {
  우수: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  정상: 'bg-blue-50 text-blue-700 border-blue-200',
  저조: 'bg-amber-50 text-amber-700 border-amber-200',
  경고: 'bg-red-50 text-red-700 border-red-200',
}

const turnoverTrendChartData = computed(() => ({
  labels: trendByMonth.map((p) => p.m),
  datasets: [
    {
      label: '평균 회전율',
      data: trendByMonth.map((p) => p.value),
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(139, 92, 246, 0.12)',
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#7c3aed',
      pointBorderWidth: 2,
      tension: 0.35,
      fill: true,
    },
    {
      label: '목표 (4.5x)',
      data: trendByMonth.map(() => 4.5),
      borderColor: '#f59e0b',
      borderDash: [4, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
      fill: false,
    },
  ],
}))

const turnoverTrendChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: { font: { size: 10 }, boxWidth: 12, usePointStyle: true },
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#c4b5fd',
      titleFont: { size: 11, weight: 'bold' },
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 6,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}x`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
    y: {
      grid: { color: '#f3f4f6' },
      ticks: {
        font: { size: 10 },
        stepSize: 1,
        autoSkip: false,
        callback: (v) => v + 'x',
      },
      beginAtZero: true,
      min: 0,
      max: 9,
    },
  },
  interaction: { mode: 'index', intersect: false },
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
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
              v-for="opt in ['월간', '분기', '연간']"
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
          <span class="text-[10px] font-bold uppercase text-gray-400">범위</span>
          <select v-model="scopeFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option>전사 통합</option>
            <option>본사 창고만</option>
            <option>직영점만</option>
          </select>
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">카테고리</span>
          <select v-model="categoryFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option>전체</option>
            <option>상의</option>
            <option>바지</option>
            <option>치마</option>
            <option>아우터</option>
          </select>
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">사이즈</span>
          <select v-model="sizeFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option>전체</option>
            <option>XS</option>
            <option>S</option>
            <option>M</option>
            <option>L</option>
            <option>XL</option>
            <option>XXL</option>
          </select>
        </div>
      </section>

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
            <p class="mt-1 truncate text-[10px] text-gray-400">{{ m.sub }}</p>
          </div>
        </article>
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
                1년 넘게 안 팔리고 있어요 (묶인 자금 <span class="font-bold text-red-600">₩{{ inventoryHealth.lockedValue }}M</span>)
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

      <!-- ━━━━━━━ 신호등 분포 4구간 (한눈에 어디에 뭐가 많은지) ━━━━━━━ -->
      <section class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <article
          v-for="seg in healthSegments"
          :key="seg.key"
          :class="[seg.cls]"
          class="border-2 px-4 py-4 shadow-sm transition-transform hover:-translate-y-0.5"
        >
          <p class="text-[11px] font-black uppercase tracking-wider">{{ seg.label }}</p>
          <p class="mt-2 text-3xl font-black">{{ seg.count }}<span class="ml-1 text-xs font-bold opacity-70">품목</span></p>
          <p class="mt-1 text-[11px] font-bold opacity-90">{{ seg.desc }}</p>
          <p class="mt-2 border-t border-current/20 pt-2 text-[10px] opacity-60">{{ seg.range }}</p>
        </article>
      </section>

      <!-- ━━━━━━━ 악성 재고 TOP 5 → 순환재고 전환 워크플로우 ━━━━━━━ -->
      <section class="border border-red-300 bg-white shadow-sm">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-red-200 bg-red-50/50 px-4 py-3">
          <div>
            <h3 class="flex items-center gap-2 text-sm font-black text-red-700">
              🚨 악성 재고 TOP 5 → 순환재고 전환
            </h3>
            <p class="mt-0.5 text-[10px] text-gray-500">
              1년 이상 묶인 재고를 <b>순환재고</b>로 전환해 매장 간 재배치/특별 채널로 처분합니다 ·
              묶인 자금 <span class="font-bold text-red-600">₩{{ inventoryHealth.lockedValue }}M</span>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-gray-500">
              선택 {{ selectedDeadStock.length }}건 · {{ selectedTotalUnits }}개 ·
              <span class="text-red-600">₩{{ selectedTotalValue }}M</span>
            </span>
            <button
              class="border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-[11px] font-black text-white shadow-sm transition-colors hover:bg-[#003d30] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:border-gray-300"
              :disabled="!selectedDeadStock.length"
              @click="transferToCirculation(selectedDeadStock)"
            >
              🔄 선택 항목 순환재고 전환
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
                <th class="w-32 px-3 py-2 text-center font-bold">전환</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="d in deadStockList"
                :key="d.sku"
                class="hover:bg-red-50/30"
                :class="d.selected ? 'bg-emerald-50/40' : ''"
              >
                <td class="px-2 py-2 text-center">
                  <input type="checkbox" v-model="d.selected" class="cursor-pointer accent-[#004D3C]" />
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
                <td class="px-3 py-2 text-right font-mono font-bold text-red-700">₩{{ d.value }}M</td>
                <td class="px-3 py-2 text-center">
                  <button
                    class="inline-flex items-center gap-1 border border-[#004D3C] bg-white px-2 py-1 text-[10px] font-bold text-[#004D3C] transition-colors hover:bg-[#004D3C] hover:text-white"
                    @click="transferToCirculation(d)"
                  >
                    🔄 순환재고 전환
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <footer class="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-2 text-[10px] text-gray-500">
          <span>💡 순환재고로 전환된 품목은 <b>순환 재고 후보 조회</b>에서 매장 재배치/특별 처분 정책을 결정합니다.</span>
          <button
            class="font-bold text-[#004D3C] hover:underline"
            @click="router.push('/hq/circular-inventory')"
          >
            전체 순환재고 보기 →
          </button>
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
                    <span class="text-right font-bold" :class="d.status === '우수' ? 'text-emerald-400' : d.status === '정상' ? 'text-blue-400' : d.status === '저조' ? 'text-amber-400' : 'text-red-400'">{{ d.status }}</span>
                  </div>
                </ChartTooltip>
              </div>
            </div>
          </div>
        </article>

        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">전사 회전율 추이</h3>
            <p class="mt-0.5 text-[10px] text-gray-400">최근 6개월 (목표선 4.5x)</p>
          </div>
          <div class="flex flex-1 items-center px-3 py-3">
            <LineChart :data="turnoverTrendChartData" :options="turnoverTrendChartOptions" :height="320" />
          </div>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-2">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">카테고리별 회전율</h3>
          </div>
          <div class="overflow-auto">
            <table class="w-full text-[12px]">
              <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th class="px-3 py-2 text-left font-semibold">카테고리</th>
                  <th class="px-3 py-2 text-right font-semibold">평균 재고</th>
                  <th class="px-3 py-2 text-right font-semibold">판매량</th>
                  <th class="px-3 py-2 text-right font-semibold">회전율</th>
                  <th class="px-3 py-2 text-right font-semibold">보유일수</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 border-t border-gray-200">
                <tr v-for="c in categoryTurnover" :key="c.category" class="hover:bg-gray-50/60">
                  <td class="px-3 py-2 font-medium text-gray-800">{{ c.category }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ c.avgInventory.toLocaleString() }}</td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ c.sales.toLocaleString() }}</td>
                  <td class="px-3 py-2 text-right font-bold text-emerald-700">{{ c.turnover }}x</td>
                  <td class="px-3 py-2 text-right font-medium text-gray-700">{{ c.daysOnHand }}일</td>
                </tr>
              </tbody>
            </table>
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
  </AppLayout>
</template>

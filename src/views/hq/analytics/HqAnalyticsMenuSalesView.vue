<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BarChart3, ShoppingBag, TrendingUp, Award, Leaf } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import ChartTooltip from '@/components/common/charts/ChartTooltip.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '정산/통계')?.children ?? []

const activeTopMenu = computed(() => '정산/통계')
const activeSideMenu = ref('소재별 판매량 및 판매 비중')

const periodUnit = ref('월간')
const storeFilter = ref('전사 통합')
const categoryFilter = ref('전체')
const sizeFilter = ref('전체')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
)

// 소재별 매출 데이터 (마진율: SPA 패션 업계 표준 / 프리미엄 소재 高 / 합성·범용 低)
const materialSalesData = [
  { name: '면 (Cotton)', category: '상의', units: 4500, sales: 65000000, marginPct: 28, eco: false },
  { name: 'Organic Cotton', category: '상의', units: 1800, sales: 32000000, marginPct: 38, eco: true, ecoLabel: '유기농 인증' },
  { name: '데님 (Denim)', category: '바지', units: 2500, sales: 52000000, marginPct: 30, eco: false },
  { name: '울 (Wool)', category: '아우터', units: 1200, sales: 48000000, marginPct: 48, eco: false },
  { name: 'Recycled Polyester', category: '아우터', units: 2100, sales: 36000000, marginPct: 38, eco: true, ecoLabel: 'RPET 재활용' },
  { name: '캐시미어 (Cashmere)', category: '상의', units: 380, sales: 45000000, marginPct: 58, eco: false },
  { name: '폴리에스터 (Polyester)', category: '아우터', units: 3400, sales: 42000000, marginPct: 25, eco: false },
  { name: '나일론 (Nylon)', category: '아우터', units: 1800, sales: 39000000, marginPct: 28, eco: false },
  { name: '린넨 (Linen)', category: '상의', units: 1500, sales: 28000000, marginPct: 42, eco: true, ecoLabel: '천연 식물성' },
  { name: 'TENCEL™ Lyocell', category: '치마', units: 900, sales: 18000000, marginPct: 42, eco: true, ecoLabel: '비건 셀룰로오스' },
  { name: 'Recycled Nylon (ECONYL)', category: '아우터', units: 600, sales: 16000000, marginPct: 35, eco: true, ecoLabel: '폐어망 재활용' },
  { name: '트위드 (Tweed)', category: '아우터', units: 620, sales: 15000000, marginPct: 48, eco: false },
  { name: 'Organic Denim', category: '바지', units: 700, sales: 14000000, marginPct: 38, eco: true, ecoLabel: '유기농 면 데님' },
  { name: 'Recycled Wool', category: '아우터', units: 350, sales: 11000000, marginPct: 40, eco: true, ecoLabel: '재활용 모직' },
]

// 카테고리 필터링
const filteredItems = computed(() => {
  if (categoryFilter.value === '전체') return materialSalesData
  return materialSalesData.filter((m) => m.category === categoryFilter.value)
})

// ABC 분석 (Pareto 80/20) + 매출총이익 계산
const itemsWithABC = computed(() => {
  const sorted = [...filteredItems.value].sort((a, b) => b.sales - a.sales)
  const totalSalesSum = sorted.reduce((s, x) => s + x.sales, 0) || 1
  let cum = 0
  return sorted.map((item) => {
    cum += item.sales
    const cumPct = (cum / totalSalesSum) * 100
    const sharePct = (item.sales / totalSalesSum) * 100
    const grade = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C'
    const grossProfit = Math.round(item.sales * (item.marginPct / 100))
    return {
      ...item,
      sharePct: parseFloat(sharePct.toFixed(1)),
      cumPct: parseFloat(cumPct.toFixed(1)),
      grade,
      grossProfit,
    }
  })
})

const totalSales = computed(() => itemsWithABC.value.reduce((sum, m) => sum + m.sales, 0))
const totalUnits = computed(() => itemsWithABC.value.reduce((sum, m) => sum + m.units, 0))
const totalGrossProfit = computed(() => itemsWithABC.value.reduce((sum, m) => sum + m.grossProfit, 0))
const avgMarginPct = computed(() => {
  const sales = totalSales.value
  return sales > 0 ? ((totalGrossProfit.value / sales) * 100).toFixed(1) : '0.0'
})

// 친환경 소재 통계
const ecoStats = computed(() => {
  const eco = itemsWithABC.value.filter((i) => i.eco)
  const regular = itemsWithABC.value.filter((i) => !i.eco)
  const ecoSales = eco.reduce((s, x) => s + x.sales, 0)
  const regularSales = regular.reduce((s, x) => s + x.sales, 0)
  const total = ecoSales + regularSales || 1
  return {
    ecoCount: eco.length,
    regularCount: regular.length,
    ecoSales,
    regularSales,
    ecoSharePct: ((ecoSales / total) * 100).toFixed(1),
    regularSharePct: ((regularSales / total) * 100).toFixed(1),
  }
})

const kpiMetrics = computed(() => [
  { label: '총 판매량', value: totalUnits.value.toLocaleString(), unit: 'EA', sub: `${itemsWithABC.value.length}종 소재 합계`, icon: ShoppingBag, valueCls: 'text-emerald-700', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600' },
  { label: '총 매출', value: (totalSales.value / 100000000).toFixed(2), unit: '억원', sub: '기간 내 누적', icon: TrendingUp, valueCls: 'text-blue-700', iconBg: 'bg-blue-50', iconCls: 'text-blue-600' },
  { label: '베스트 소재', value: (itemsWithABC.value[0]?.sharePct ?? 0) + '%', unit: '점유율', sub: itemsWithABC.value[0]?.name ?? '-', icon: Award, valueCls: 'text-amber-700', iconBg: 'bg-amber-50', iconCls: 'text-amber-600' },
  { label: '친환경 소재 비중', value: ecoStats.value.ecoSharePct, unit: '%', sub: `${ecoStats.value.ecoCount}종 / 매출 ${(ecoStats.value.ecoSales / 100000000).toFixed(2)}억`, icon: Leaf, valueCls: 'text-violet-700', iconBg: 'bg-violet-50', iconCls: 'text-violet-600' },
])

const periodOptions = ['일간', '주간', '월간', '분기']
const storeOptions = ['전사 통합', '직영점', '강남점', '판교 테크노점', '여의도 IFC몰점', '성수 리빙샵', '부산 센텀점']
const categoryOptions = ['전체', '상의', '바지', '치마', '아우터']
const sizeOptions = ['전체', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
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
            <BarChart3 :size="18" class="text-emerald-600" />
            소재별 판매량 및 판매 비중
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
            기준: {{ dateLabel }}
          </span>
        </div>
        <span class="text-[11px] text-gray-500">소재 단위 매출 분석 + ABC 분석(Pareto 80/20) + ESG 친환경 소재 비중</span>
      </section>

      <section class="flex flex-wrap items-center gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">기간 단위</span>
          <div class="flex border border-gray-200">
            <button
              v-for="opt in periodOptions"
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
          <span class="text-[10px] font-bold uppercase text-gray-400">매장</span>
          <select v-model="storeFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option v-for="opt in storeOptions" :key="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">카테고리</span>
          <select v-model="categoryFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option v-for="opt in categoryOptions" :key="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="h-4 w-px bg-gray-200" />
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-bold uppercase text-gray-400">사이즈</span>
          <select v-model="sizeFilter" class="border border-gray-200 bg-white px-2 py-1 text-[11px]">
            <option v-for="opt in sizeOptions" :key="opt">{{ opt }}</option>
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

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">소재별 판매 상세</h3>
          <p class="mt-0.5 text-[10px] text-gray-400">{{ itemsWithABC.length }}종 소재 · 매출 기준 정렬</p>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[920px] text-[12px]">
            <thead class="bg-gray-50 text-[10px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-semibold">소재명</th>
                <th class="px-3 py-2 text-left font-semibold">카테고리</th>
                <th class="px-3 py-2 text-right font-semibold">판매수량</th>
                <th class="px-3 py-2 text-right font-semibold">매출액</th>
                <th class="px-3 py-2 text-right font-semibold">매출총이익</th>
                <th class="px-3 py-2 text-right font-semibold">마진율</th>
                <th class="px-3 py-2 text-right font-semibold">비중</th>
                <th class="px-3 py-2 text-right font-semibold">누적 비중</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr
                v-for="item in itemsWithABC"
                :key="item.name"
                class="hover:bg-gray-50/60"
              >
                <td class="px-3 py-2.5 font-medium text-gray-800">{{ item.name }}</td>
                <td class="px-3 py-2.5 text-gray-500">{{ item.category }}</td>
                <td class="px-3 py-2.5 text-right text-gray-700">{{ item.units.toLocaleString() }}</td>
                <td class="px-3 py-2.5 text-right font-medium text-gray-800">₩{{ item.sales.toLocaleString() }}</td>
                <td class="px-3 py-2.5 text-right font-medium text-gray-700">₩{{ item.grossProfit.toLocaleString() }}</td>
                <td
                  class="px-3 py-2.5 text-right font-bold"
                  :class="item.marginPct >= 45 ? 'text-emerald-700' : item.marginPct >= 30 ? 'text-blue-700' : 'text-amber-700'"
                >
                  {{ item.marginPct }}%
                </td>
                <td class="px-3 py-2.5 text-right font-bold text-emerald-700">{{ item.sharePct }}%</td>
                <td class="px-3 py-2.5 text-right font-medium text-amber-700">{{ item.cumPct }}%</td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-gray-200 bg-gray-50">
              <tr class="text-[11px]">
                <td class="px-3 py-2 font-semibold text-gray-600" colspan="2">합계</td>
                <td class="px-3 py-2 text-right font-semibold text-gray-700">{{ totalUnits.toLocaleString() }}</td>
                <td class="px-3 py-2 text-right font-bold text-emerald-700">₩{{ totalSales.toLocaleString() }}</td>
                <td class="px-3 py-2 text-right font-bold text-gray-700">₩{{ totalGrossProfit.toLocaleString() }}</td>
                <td class="px-3 py-2 text-right font-bold text-blue-700">{{ avgMarginPct }}%</td>
                <td class="px-3 py-2 text-right font-bold text-emerald-700">100%</td>
                <td class="px-3 py-2 text-right font-bold text-amber-700">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

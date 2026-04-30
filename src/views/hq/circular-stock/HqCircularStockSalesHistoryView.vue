<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCircularStockStore } from '@/stores/circularStock.js'
import { useCircularStockBuyerStore } from '@/stores/circularStockBuyers.js'

const router = useRouter()
const auth = useAuthStore()
const circularStockStore = useCircularStockStore()
const buyerStore = useCircularStockBuyerStore()

const hqMenus = roleMenus.hq
const circularStockMenus = roleMenus.hq.find((menu) => menu.label === '순환 재고 관리')?.children ?? []
const periodTabs = [
  { key: 'all', label: '전체' },
  { key: 'week', label: '주별' },
  { key: 'month', label: '월별' },
  { key: 'year', label: '연별' },
]

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 판매 내역')
const searchTerm = ref('')
const activePeriod = ref('all')

const referenceDate = computed(() => {
  const latestSale = circularStockStore.sortedSales[0]
  return latestSale?.soldAt ? new Date(latestSale.soldAt) : new Date()
})

const periodRange = computed(() => {
  const base = new Date(referenceDate.value)
  const rangeStart = new Date(base)
  const rangeEnd = new Date(base)

  if (activePeriod.value === 'all') {
    return {
      start: new Date('2000-01-01T00:00:00'),
      end: new Date('2999-12-31T23:59:59.999'),
    }
  }

  if (activePeriod.value === 'week') {
    const day = rangeStart.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    rangeStart.setDate(rangeStart.getDate() + diffToMonday)
    rangeStart.setHours(0, 0, 0, 0)

    rangeEnd.setTime(rangeStart.getTime())
    rangeEnd.setDate(rangeEnd.getDate() + 6)
    rangeEnd.setHours(23, 59, 59, 999)
  } else if (activePeriod.value === 'month') {
    rangeStart.setDate(1)
    rangeStart.setHours(0, 0, 0, 0)

    rangeEnd.setMonth(rangeEnd.getMonth() + 1, 0)
    rangeEnd.setHours(23, 59, 59, 999)
  } else {
    rangeStart.setMonth(0, 1)
    rangeStart.setHours(0, 0, 0, 0)

    rangeEnd.setMonth(11, 31)
    rangeEnd.setHours(23, 59, 59, 999)
  }

  return {
    start: rangeStart,
    end: rangeEnd,
  }
})

const periodFilteredSales = computed(() =>
  circularStockStore.sortedSales.filter((sale) => {
    const soldAt = new Date(sale.soldAt)
    return soldAt >= periodRange.value.start && soldAt <= periodRange.value.end
  }),
)

const filteredSales = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return periodFilteredSales.value.filter((sale) => {
    if (!keyword) return true

    const headline = sale.items.length > 1
      ? `${sale.items[0].itemName} 외 ${sale.items.length - 1}건`
      : sale.items[0]?.itemName ?? ''

    return [
      sale.saleId,
      sale.buyerName,
      headline,
      ...sale.items.map((item) => [item.itemCode, item.itemName, item.mainCategory, item.subCategory].join(' ')),
    ].join(' ').toLowerCase().includes(keyword)
  })
})

const filteredSummary = computed(() => ({
  totalSalesAmount: filteredSales.value.reduce((sum, sale) => sum + (Number(sale.totalActualAmount) || 0), 0),
  totalDeductedQuantity: filteredSales.value.reduce((sum, sale) => sum + (Number(sale.totalDeductedQuantity) || 0), 0),
  totalActualWeightKg: filteredSales.value.reduce((sum, sale) => sum + (Number(sale.totalActualWeightKg) || 0), 0),
  totalSalesCount: filteredSales.value.length,
}))

function setPeriod(periodKey) {
  activePeriod.value = periodKey
}

function headlineLabel(sale) {
  if (!sale || sale.items.length === 0) return '-'
  return sale.items.length > 1 ? `${sale.items[0].itemName} 외 ${sale.items.length - 1}건` : sale.items[0].itemName
}

function materialTypeLabel(sale) {
  const itemMaterialType = sale?.items?.[0]?.materialType
  if (itemMaterialType) return itemMaterialType

  if (sale?.buyerPrimaryMaterialFit === 'natural-single') return '천연 단일 섬유'
  if (sale?.buyerPrimaryMaterialFit === 'synthetic') return '합성 섬유'
  if (sale?.buyerPrimaryMaterialFit === 'blended') return '혼방'
  return '-'
}

function industryGroupLabel(sale) {
  if (sale?.buyerIndustryGroup) return sale.buyerIndustryGroup
  return buyerStore.getBuyerById(sale?.buyerId)?.industryGroup ?? '-'
}

function formatDateTime(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDate(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatPeriodLabel() {
  if (activePeriod.value === 'all') return '전체 판매 이력'
  if (activePeriod.value === 'year') return `${referenceDate.value.getFullYear()}년 기준`
  return `${formatDate(periodRange.value.start)} ~ ${formatDate(periodRange.value.end)}`
}

function formatKg(value) {
  return `${Number(value || 0).toFixed(2)}kg`
}

function formatCurrency(value) {
  return `₩${Number(value || 0).toLocaleString()}`
}

function formatQuantity(value) {
  return `${Number(value || 0).toLocaleString()}벌`
}

function openSaleDetail(saleId) {
  router.push({
    name: 'hq-circular-inventory-sales-history-detail',
    params: { saleId },
  })
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory Sales</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 판매 내역</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">판매건 헤더 기준으로 이력을 조회하고, 한 건을 누르면 상세 페이지로 이동합니다.</p>
          </div>
          <label class="flex min-w-[280px] flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#111827]"
              placeholder="판매번호, 거래처명, 품목명"
            />
          </label>
        </div>
      </section>

      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="inline-flex flex-wrap items-center gap-1 rounded-[14px] border border-[#E5E7EB] bg-[#F7F7F8] p-1">
            <button
              v-for="tab in periodTabs"
              :key="tab.key"
              type="button"
              class="rounded-[12px] px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] transition-all duration-150"
              :class="activePeriod === tab.key
                ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.06)]'
                : 'bg-transparent text-[#6B7280] hover:bg-white hover:text-[#374151]'"
              @click="setPeriod(tab.key)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="text-right">
            <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Current Range</p>
            <p class="mt-1 text-xs font-black text-gray-700">{{ formatPeriodLabel() }}</p>
          </div>
        </div>

        <div class="pt-3">
          <div class="grid gap-3 md:grid-cols-4">
            <div class="border border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">판매건 수</p>
              <p class="mt-1.5 text-lg font-black text-slate-700">{{ filteredSummary.totalSalesCount.toLocaleString() }}건</p>
            </div>
            <div class="border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">총 판매 KG</p>
              <p class="mt-1.5 text-lg font-black text-emerald-700">{{ formatKg(filteredSummary.totalActualWeightKg) }}</p>
            </div>
            <div class="border border-amber-100 bg-amber-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">총 판매 금액</p>
              <p class="mt-1.5 text-lg font-black text-amber-700">{{ formatCurrency(filteredSummary.totalSalesAmount) }}</p>
            </div>
            <div class="border border-sky-100 bg-sky-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">총 판매 재고 수량</p>
              <p class="mt-1.5 text-lg font-black text-sky-700">{{ formatQuantity(filteredSummary.totalDeductedQuantity) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-4 py-3">
          <h2 class="text-sm font-extrabold text-gray-900">판매 이력 목록</h2>
          <p class="mt-1 text-[11px] font-bold text-gray-400">행을 클릭하면 판매 상세 페이지로 이동합니다.</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[1200px] w-full border-collapse text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-4 py-3 text-left font-black">판매일시</th>
                <th class="px-4 py-3 text-left font-black">판매번호</th>
                <th class="px-4 py-3 text-left font-black">거래처</th>
                <th class="px-4 py-3 text-left font-black">산업군</th>
                <th class="px-4 py-3 text-left font-black">소재 분류</th>
                <th class="px-4 py-3 text-left font-black">대표 품목</th>
                <th class="px-4 py-3 text-right font-black">확정 반영 KG</th>
                <th class="px-4 py-3 text-right font-black">총 판매 재고 수량</th>
                <th class="px-4 py-3 text-right font-black">확정 거래 금액</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="sale in filteredSales"
                :key="sale.saleId"
                class="cursor-pointer transition-colors hover:bg-gray-50"
                @click="openSaleDetail(sale.saleId)"
              >
                <td class="px-4 py-3 font-bold text-gray-600">{{ formatDateTime(sale.soldAt) }}</td>
                <td class="px-4 py-3 font-mono font-black text-gray-800">{{ sale.saleId }}</td>
                <td class="px-4 py-3 font-black text-gray-900">{{ sale.buyerName }}</td>
                <td class="px-4 py-3 font-bold text-gray-700">{{ industryGroupLabel(sale) }}</td>
                <td class="px-4 py-3 font-black text-gray-700">{{ materialTypeLabel(sale) }}</td>
                <td class="px-4 py-3 font-black text-gray-900">{{ headlineLabel(sale) }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-700">{{ formatKg(sale.totalActualWeightKg) }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-700">{{ formatQuantity(sale.totalDeductedQuantity) }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-900">{{ formatCurrency(sale.totalActualAmount) }}</td>
              </tr>
              <tr v-if="filteredSales.length === 0">
                <td colspan="9" class="px-4 py-12 text-center text-gray-400">조회 가능한 판매 이력이 없습니다.</td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-gray-200 bg-gray-50 text-xs">
              <tr>
                <td colspan="6" class="px-4 py-4 text-right font-black text-gray-600">총 집계</td>
                <td class="px-4 py-4 text-right font-black text-emerald-700">{{ formatKg(filteredSummary.totalActualWeightKg) }}</td>
                <td class="px-4 py-4 text-right font-black text-sky-700">{{ formatQuantity(filteredSummary.totalDeductedQuantity) }}</td>
                <td class="px-4 py-4 text-right font-black text-amber-700">{{ formatCurrency(filteredSummary.totalSalesAmount) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

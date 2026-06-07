<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useCircularStockSaleStore } from '@/stores/hq/circularStock/circularStockSale.js'
import {
  circularSaleOutboundStatusBadgeClass,
  circularSaleOutboundStatusLabel,
} from '@/stores/hq/circularStock/circularStockCommon.js'

const router = useRouter()
const circularStockStore = useCircularStockSaleStore()

const hqMenus = roleMenus.hq
const circularStockMenus =
  roleMenus.hq.find((menu) => menu.label === '순환 재고 관리')?.children ?? []
const saleTypeTabs = [
  { key: 'SALE',     label: '판매' },
  { key: 'DONATION', label: '기부' },
]
const activeSaleType = ref('SALE')

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
const currentPage = ref(1)
const pageSize = ref(20)

const referenceDate = ref(new Date())

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

const periodFilteredSales = computed(() => circularStockStore.sortedSales)

const filteredSales = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return periodFilteredSales.value.filter((sale) => {
    if (!keyword) return true

    const headline = sale.headline || ''

    return [sale.saleNo, sale.buyerName, headline, sale.materialType]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })
})

const filteredSummary = computed(() => ({
  totalSalesAmount: filteredSales.value.reduce(
    (sum, sale) => sum + (Number(sale.totalAmount) || 0),
    0,
  ),
  totalDeductedQuantity: filteredSales.value.reduce(
    (sum, sale) => sum + (Number(sale.totalSoldQuantity) || 0),
    0,
  ),
  totalActualWeightKg: filteredSales.value.reduce(
    (sum, sale) => sum + (Number(sale.totalActualWeightKg) || 0),
    0,
  ),
  totalSalesCount: filteredSales.value.length,
}))

const pagination = computed(() => circularStockStore.salesPage || {})
const totalPages = computed(() => Math.max(1, Number(pagination.value.totalPages || 0)))
const pageNumbers = computed(() => {
  const total = totalPages.value
  const page = currentPage.value
  const windowSize = 5
  const half = Math.floor(windowSize / 2)
  let start = Math.max(1, page - half)
  let end = Math.min(total, start + windowSize - 1)
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1)
  }
  const pages = []
  for (let p = start; p <= end; p += 1) pages.push(p)
  return pages
})

function setPeriod(periodKey) {
  activePeriod.value = periodKey
}

function headlineLabel(sale) {
  return sale?.headline || '-'
}

function materialTypeLabel(sale) {
  const type = String(sale?.materialType || '').trim()
  if (type === '혼방') return '혼방'
  if (type === '합성 섬유') return '합성섬유'
  if (type === '천연 단일 섬유') return '천연 단일 섬유'
  return '-'
}

function materialTypeBadgeClass(sale) {
  const type = String(sale?.materialType || '').trim()
  if (type === '혼방') {
    return 'border-[#FBCFE8] bg-[#FDF2F8] text-[#9D174D]'
  }
  if (type === '합성 섬유') {
    return 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
  }
  if (type === '천연 단일 섬유') {
    return 'border-[#E5D5FF] bg-[#F5EEFF] text-[#6D28D9]'
  }
  return 'border-gray-200 bg-gray-100 text-gray-500'
}

function buyerIndustryGroupLabel(sale) {
  if (!sale) return '-'
  return sale.buyerIndustryGroup ?? '-'
}

function outboundStatusLabel(sale) {
  return circularSaleOutboundStatusLabel(sale?.outboundStatus)
}

function outboundStatusBadgeClass(sale) {
  return circularSaleOutboundStatusBadgeClass(sale?.outboundStatus)
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
  if (activePeriod.value === 'all') return activeSaleType.value === 'DONATION' ? '전체 기부 내역' : '전체 판매 내역'
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

function displayName(sale) {
  return sale.saleType === 'DONATION' ? (sale.doneeName || '-') : (sale.buyerName || '-')
}

function isDonation(sale) {
  return sale.saleType === 'DONATION'
}

function openSaleDetail(saleId) {
  router.push({
    name: 'hq-circular-inventory-sales-history-detail',
    params: { saleId },
  })
}

function toDateParam(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

async function loadSales(options = {}) {
  const { preserveScroll = false } = options
  const scrollRoot = preserveScroll
    ? (document.scrollingElement || document.documentElement)
    : null
  const scrollY = preserveScroll ? window.scrollY : null
  const scrollTop = preserveScroll ? Number(scrollRoot?.scrollTop || 0) : null
  const range = periodRange.value
  await circularStockStore.fetchCircularSalesPage({
    page: currentPage.value - 1,
    size: pageSize.value,
    sort: 'soldAt,desc',
    from: activePeriod.value === 'all' ? undefined : toDateParam(range.start),
    to: activePeriod.value === 'all' ? undefined : toDateParam(range.end),
    keyword: searchTerm.value?.trim() || undefined,
    saleType: activeSaleType.value === 'all' ? undefined : activeSaleType.value,
  })
  const latest = circularStockStore.sortedSales[0]
  if (latest?.soldAt) {
    referenceDate.value = new Date(latest.soldAt)
  }
  const serverPage = Number(circularStockStore.salesPage?.page ?? 0) + 1
  if (serverPage !== currentPage.value) currentPage.value = serverPage
  if (preserveScroll && scrollY !== null) {
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY })
      if (scrollRoot && scrollTop !== null) scrollRoot.scrollTop = scrollTop
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY })
        if (scrollRoot && scrollTop !== null) scrollRoot.scrollTop = scrollTop
      })
    })
  }
}

function goToPage(page) {
  const safePage = Math.min(totalPages.value, Math.max(1, Number(page || 1)))
  if (safePage === currentPage.value) return
  currentPage.value = safePage
  loadSales({ preserveScroll: true })
}

function goToPrevPage() {
  if (currentPage.value <= 1) return
  goToPage(currentPage.value - 1)
}

function goToNextPage() {
  if (currentPage.value >= totalPages.value) return
  goToPage(currentPage.value + 1)
}

watch([activePeriod, searchTerm], () => {
  currentPage.value = 1
  loadSales()
})

watch(activeSaleType, () => {
  currentPage.value = 1
  loadSales()
})

onMounted(() => {
  loadSales()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Circular Inventory Sales
            </p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 판매 내역</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              판매건 헤더 기준으로 이력을 조회하고, 한 건을 누르면 상세 페이지로 이동합니다.
            </p>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <div class="inline-flex flex-wrap items-center gap-1 rounded-[14px] border border-[#E5E7EB] bg-[#F7F7F8] p-1">
              <button
                v-for="tab in saleTypeTabs"
                :key="tab.key"
                type="button"
                class="rounded-[12px] px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] transition-all duration-150"
                :class="
                  activeSaleType === tab.key
                    ? (tab.key === 'DONATION'
                        ? 'bg-pink-500 text-white shadow-[0_1px_2px_rgba(17,24,39,0.06)]'
                        : tab.key === 'SALE'
                        ? 'bg-emerald-500 text-white shadow-[0_1px_2px_rgba(17,24,39,0.06)]'
                        : 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.06)]')
                    : 'bg-transparent text-[#6B7280] hover:bg-white hover:text-[#374151]'
                "
                @click="activeSaleType = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="inline-flex flex-wrap items-center gap-1 rounded-[14px] border border-[#E5E7EB] bg-[#F7F7F8] p-1">
              <button
                v-for="tab in periodTabs"
                :key="tab.key"
                type="button"
                class="rounded-[12px] px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em] transition-all duration-150"
                :class="
                  activePeriod === tab.key
                    ? 'bg-white text-[#111827] shadow-[0_1px_2px_rgba(17,24,39,0.06)]'
                    : 'bg-transparent text-[#6B7280] hover:bg-white hover:text-[#374151]'
                "
                @click="setPeriod(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <div class="text-right">
            <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
              Current Range
            </p>
            <p class="mt-1 text-xs font-black text-gray-700">{{ formatPeriodLabel() }}</p>
          </div>
        </div>

        <Transition name="tab-fade" mode="out-in">
        <div :key="activeSaleType" class="pt-3">
          <div :class="activeSaleType === 'DONATION' ? 'grid gap-3 md:grid-cols-3' : 'grid gap-3 md:grid-cols-4'">
            <div class="border border-slate-100 bg-slate-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                {{ activeSaleType === 'DONATION' ? '기부건 수' : '판매건 수' }}
              </p>
              <p class="mt-1.5 text-lg font-black text-slate-700">
                {{ filteredSummary.totalSalesCount.toLocaleString() }}건
              </p>
            </div>
            <div class="border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                {{ activeSaleType === 'DONATION' ? '총 기부 KG' : '총 판매 KG' }}
              </p>
              <p class="mt-1.5 text-lg font-black text-emerald-700">
                {{ formatKg(filteredSummary.totalActualWeightKg) }}
              </p>
            </div>
            <div v-if="activeSaleType !== 'DONATION'" class="border border-amber-100 bg-amber-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                총 판매 금액
              </p>
              <p class="mt-1.5 text-lg font-black text-amber-700">
                {{ formatCurrency(filteredSummary.totalSalesAmount) }}
              </p>
            </div>
            <div class="border border-sky-100 bg-sky-50 px-4 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                {{ activeSaleType === 'DONATION' ? '총 기부 수량' : '총 판매 수량' }}
              </p>
              <p class="mt-1.5 text-lg font-black text-sky-700">
                {{ formatQuantity(filteredSummary.totalDeductedQuantity) }}
              </p>
            </div>
          </div>
        </div>
        </Transition>
      </section>

      <Transition name="tab-fade" mode="out-in">
      <section :key="activeSaleType" class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-4 py-3">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-gray-900">{{ activeSaleType === 'DONATION' ? '기부 이력 목록' : '판매 이력 목록' }}</h2>
              <p class="mt-1 text-[11px] font-bold text-gray-400">
                {{ activeSaleType === 'DONATION' ? '행을 클릭하면 기부 상세 페이지로 이동합니다.' : '행을 클릭하면 판매 상세 페이지로 이동합니다.' }}
              </p>
            </div>
            <label class="flex min-w-[300px] items-center gap-2">
              <Search class="h-4 w-4 text-gray-500" />
              <input
                v-model="searchTerm"
                type="search"
                class="h-9 flex-1 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#111827]"
                :placeholder="activeSaleType === 'DONATION' ? '기부번호, 기부처명, 대표품목' : '판매번호, 거래처명, 대표품목'"
              />
            </label>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table :class="['w-full border-collapse text-xs', activeSaleType === 'DONATION' ? 'min-w-[900px]' : 'min-w-[1200px]']">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 text-left font-black">판매번호</th>
                <th class="px-3 py-3 text-left font-black">출고 창고</th>
                <th class="px-3 py-3 text-left font-black">{{ activeSaleType === 'DONATION' ? '기부처' : '거래처' }}</th>
                <th v-if="activeSaleType !== 'DONATION'" class="pl-5 pr-4 py-3 text-left font-black">산업군</th>
                <th class="px-4 py-3 text-center font-black">소재 분류</th>
                <th class="px-4 py-3 text-left font-black">대표 품목</th>
                <th class="px-4 py-3 text-right font-black">{{ activeSaleType === 'DONATION' ? '기부 KG' : '판매 KG' }}</th>
                <th class="px-4 py-3 text-right font-black">{{ activeSaleType === 'DONATION' ? '기부 수량' : '판매 수량' }}</th>
                <th v-if="activeSaleType !== 'DONATION'" class="px-4 py-3 text-right font-black">판매 금액</th>
                <th class="px-4 py-3 text-center font-black">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="sale in filteredSales"
                :key="sale.saleId"
                class="cursor-pointer transition-colors hover:bg-gray-50"
                @click="openSaleDetail(sale.saleId)"
              >
                <td class="px-3 py-3 font-mono font-black text-gray-800">
                  <span class="flex items-center gap-1.5">
                    {{ sale.saleNo }}
                    <span v-if="isDonation(sale)" class="rounded bg-pink-100 px-1 text-xs text-pink-700">기부</span>
                  </span>
                </td>
                <td class="px-3 py-3 font-bold text-gray-700">
                  {{ sale.outboundWarehouseName || '-' }}
                </td>
                <td class="px-3 py-3 font-black text-gray-900">{{ displayName(sale) }}</td>
                <td v-if="activeSaleType !== 'DONATION'" class="pl-5 pr-4 py-3 font-bold text-gray-700">
                  {{ buyerIndustryGroupLabel(sale) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold"
                    :class="materialTypeBadgeClass(sale)"
                  >
                    {{ materialTypeLabel(sale) }}
                  </span>
                </td>
                <td class="px-4 py-3 font-black text-gray-900">{{ headlineLabel(sale) }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-700">
                  {{ formatKg(sale.totalActualWeightKg) }}
                </td>
                <td class="px-4 py-3 text-right font-black text-gray-700">
                  {{ formatQuantity(sale.totalSoldQuantity) }}
                </td>
                <td v-if="activeSaleType !== 'DONATION'" class="px-4 py-3 text-right font-black text-gray-900">
                  {{ formatCurrency(sale.totalAmount) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-extrabold"
                    :class="outboundStatusBadgeClass(sale)"
                  >
                    {{ outboundStatusLabel(sale) }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredSales.length === 0">
                <td :colspan="activeSaleType === 'DONATION' ? 8 : 10" class="px-4 py-12 text-center text-gray-400">{{ activeSaleType === 'DONATION' ? '조회 가능한 기부 이력이 없습니다.' : '조회 가능한 판매 이력이 없습니다.' }}</td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-gray-200 bg-gray-50 text-xs">
              <tr v-if="activeSaleType !== 'DONATION'">
                <td colspan="6" class="px-4 py-4 text-right font-black text-gray-600">총 집계</td>
                <td class="px-4 py-4 text-right font-black text-emerald-700">{{ formatKg(filteredSummary.totalActualWeightKg) }}</td>
                <td class="px-4 py-4 text-right font-black text-sky-700">{{ formatQuantity(filteredSummary.totalDeductedQuantity) }}</td>
                <td class="px-4 py-4 text-right font-black text-amber-700">{{ formatCurrency(filteredSummary.totalSalesAmount) }}</td>
                <td class="px-4 py-4"></td>
              </tr>
              <tr v-else>
                <td colspan="5" class="px-4 py-4 text-right font-black text-gray-600">총 집계</td>
                <td class="px-4 py-4 text-right font-black text-emerald-700">{{ formatKg(filteredSummary.totalActualWeightKg) }}</td>
                <td class="px-4 py-4 text-right font-black text-sky-700">{{ formatQuantity(filteredSummary.totalDeductedQuantity) }}</td>
                <td class="px-4 py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="border-t border-gray-200 px-4 py-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-[11px] font-bold text-gray-500">
              총 {{ Number(pagination.totalElements || 0).toLocaleString() }}건
            </p>
            <div class="inline-flex items-center gap-1">
              <button
                type="button"
                class="h-8 min-w-8 rounded border border-gray-300 px-2 text-xs font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentPage <= 1"
                @click="goToPrevPage"
              >
                이전
              </button>
              <button
                v-for="page in pageNumbers"
                :key="page"
                type="button"
                class="h-8 min-w-8 rounded border px-2 text-xs font-bold"
                :class="
                  currentPage === page
                    ? 'border-[#0F7C62] bg-[#EAF8F3] text-[#0F7C62]'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                "
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button
                type="button"
                class="h-8 min-w-8 rounded border border-gray-300 px-2 text-xs font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="currentPage >= totalPages"
                @click="goToNextPage"
              >
                다음
              </button>
            </div>
          </div>
        </div>
      </section>
      </Transition>
    </div>
  </AppLayout>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>


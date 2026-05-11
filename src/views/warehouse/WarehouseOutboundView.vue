<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { getWarehouseOutboundList } from '@/api/warehouse/outbound.js'
import { extractErrorMessage } from '@/api/axios.js'
import { formatDateTime } from '@/features/store/common/ui.js'

const router = useRouter()

const topMenus = roleMenus.warehouse

const STATUS_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'READY_TO_SHIP', label: '출고 준비중' },
  { key: 'IN_TRANSIT', label: '배송 중' },
  { key: 'ARRIVED', label: '배송 완료' },
]

const TYPE_OPTIONS = [
  { value: 'ALL', label: '?꾩껜 ?좏삎' },
  { value: 'STORE_OUTBOUND', label: '留ㅼ옣 異쒓퀬' },
  { value: 'WH_TRANSFER', label: '李쎄퀬媛??대룞' },
  { value: 'CIRCULAR_SALE', label: '?쒗솚?ш퀬 ?먮ℓ' },
]

const PERIOD_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'DAY', label: '일' },
  { key: 'MONTH', label: '월' },
  { key: 'YEAR', label: '년' },
]

const loading = ref(false)
const errorMessage = ref('')
const outboundRows = ref([])

const activeStatusTab = ref('ALL')
const activeTypeTab = ref('ALL')
const searchKeyword = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const activePeriod = ref('ALL')

function normalizeOutboundType(sourceType) {
  if (sourceType === 'STORE_ORDER' || sourceType === 'STORE_OUTBOUND') return 'STORE_OUTBOUND'
  if (sourceType === 'WAREHOUSE_TRANSFER' || sourceType === 'WH_TRANSFER') return 'WH_TRANSFER'
  if (sourceType === 'CIRCULAR_SALE') return 'CIRCULAR_SALE'
  return sourceType
}

function outboundTypeLabel(sourceType) {
  return {
    STORE_OUTBOUND: '留ㅼ옣 異쒓퀬',
    WH_TRANSFER: '李쎄퀬媛??대룞',
    CIRCULAR_SALE: '?쒗솚?ш퀬 ?먮ℓ',
  }[normalizeOutboundType(sourceType)] ?? sourceType
}

function outboundTypeClass(sourceType) {
  return (
    {
      STORE_OUTBOUND: 'bg-blue-50 text-blue-700 border-blue-200',
      WH_TRANSFER: 'bg-orange-50 text-orange-700 border-orange-200',
      CIRCULAR_SALE: 'bg-violet-50 text-violet-700 border-violet-200',
    }[normalizeOutboundType(sourceType)] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  )
}

const visibleRows = computed(() => {
  if (activeTypeTab.value === 'ALL') return outboundRows.value
  return outboundRows.value.filter((row) => normalizeOutboundType(row.sourceType) === activeTypeTab.value)
})

const statusCounts = computed(() => ({
  ALL: outboundRows.value.length,
  READY_TO_SHIP: outboundRows.value.filter((row) => row.status === 'READY_TO_SHIP').length,
  IN_TRANSIT: outboundRows.value.filter((row) => row.status === 'IN_TRANSIT').length,
  ARRIVED: outboundRows.value.filter((row) => row.status === 'ARRIVED').length,
}))

function toYmd(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function applyPeriod(periodKey) {
  const now = new Date()
  let fromDate = new Date(now)

  if (periodKey === 'ALL') {
    activePeriod.value = periodKey
    dateFrom.value = ''
    dateTo.value = ''
    return
  }

  if (periodKey === 'MONTH') fromDate.setMonth(now.getMonth() - 1)
  if (periodKey === 'YEAR') fromDate.setFullYear(now.getFullYear() - 1)

  activePeriod.value = periodKey
  dateFrom.value = toYmd(fromDate)
  dateTo.value = toYmd(now)
}

function statusClass(status) {
  return (
    {
      READY_TO_SHIP: 'bg-amber-50 text-amber-700',
      IN_TRANSIT: 'bg-blue-50 text-blue-700',
      ARRIVED: 'bg-emerald-50 text-emerald-700',
    }[status] ?? 'bg-gray-100 text-gray-600'
  )
}

function statusLabel(status) {
  return (
    {
      READY_TO_SHIP: '출고 준비중',
      IN_TRANSIT: '배송 중',
      ARRIVED: '배송 완료',
    }[status] ?? status
  )
}

function destinationLabel(row) {
  if (row.destinationName && String(row.destinationName).trim()) return row.destinationName
  if (!row.destinationType) return '-'
  return row.destinationId ? `${row.destinationType} (${row.destinationId})` : row.destinationType
}

function openDetail(outboundNo) {
  router.push({ name: 'wh-outbound-detail', params: { id: outboundNo } })
}

async function fetchOutboundList() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await getWarehouseOutboundList({
      status: activeStatusTab.value === 'ALL' ? undefined : activeStatusTab.value,
      from: dateFrom.value || undefined,
      to: dateTo.value || undefined,
      keyword: searchKeyword.value.trim() || undefined,
    })
    outboundRows.value = Array.isArray(result) ? result : []
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, '異쒓퀬 紐⑸줉 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.')
  } finally {
    loading.value = false
  }
}

watch([activeStatusTab, dateFrom, dateTo], fetchOutboundList)
watch(searchKeyword, fetchOutboundList)

onMounted(() => {
  applyPeriod('ALL')
  fetchOutboundList()
})
</script>

<template>
  <AppLayout
    active-top-menu="출고 관리"
    :top-menus="topMenus"
    :side-menus="[]"
  >
    <div class="flex flex-col gap-3">
      <section class="border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 p-5 shadow-sm">
        <p class="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Warehouse Outbound</p>
        <h1 class="mt-1 text-xl font-black text-slate-900">출고 리스트</h1>
        <p class="mt-1 text-sm font-semibold text-slate-600">李쎄퀬 異쒓퀬 紐⑸줉??議고쉶?섍퀬 ?곹깭 ?꾩씠瑜?愿由ы빀?덈떎.</p>
      </section>

      <section class="border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div class="mb-2 flex flex-col gap-2 pb-0">
          <div class="grid gap-1 lg:items-center">
            <div class="inline-flex w-max flex-wrap gap-1 rounded-xl bg-slate-100/80 px-1 py-1">
              <button
                v-for="tab in STATUS_TABS"
                :key="tab.key"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-black transition-colors"
                :class="activeStatusTab === tab.key
                  ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                  : 'border-transparent bg-white text-slate-600 hover:bg-slate-50'"
                @click="activeStatusTab = tab.key"
              >
                <span>{{ tab.label }}</span>
                <span
                  class="min-w-[20px] rounded-md px-1.5 py-0.5 text-center text-[10px]"
                  :class="activeStatusTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'"
                >
                  {{ statusCounts[tab.key] }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mt-1 overflow-hidden border border-slate-200 bg-white shadow-sm">
        <p v-if="errorMessage" class="border-b border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700">
          {{ errorMessage }}
        </p>

        <div class="flex min-h-[40px] flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <span class="text-xs font-bold text-gray-600">총 {{ visibleRows.length }}건</span>
        </div>

        <div class="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-2.5">
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div class="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white">
              <button
                v-for="period in PERIOD_TABS"
                :key="period.key"
                type="button"
                class="px-3 py-1.5 text-xs font-extrabold transition-colors"
                :class="activePeriod === period.key ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'"
                @click="applyPeriod(period.key)"
              >
                {{ period.label }}
              </button>
            </div>
            <input
              v-model="dateFrom"
              type="date"
              class="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700"
            />
            <span class="text-xs font-bold text-slate-400">~</span>
            <input
              v-model="dateTo"
              type="date"
              class="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700"
            />
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="출고번호/발주번호 검색"
              class="h-8 min-w-[260px] w-[260px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-700"
            />
          </div>
          <div class="flex shrink-0 items-center">
            <select
              v-model="activeTypeTab"
              class="h-8 w-[150px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition-colors focus:border-emerald-700"
            >
              <option v-for="option in TYPE_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="overflow-auto">
          <table class="w-full table-fixed border-collapse text-xs">
            <thead class="bg-slate-100/90 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              <tr>
                <th class="w-[16%] px-4 py-3 text-left font-black">異쒓퀬踰덊샇</th>
                <th class="w-[14%] px-4 py-3 text-left font-black">?먯쿇諛쒖＜踰덊샇</th>
                <th class="w-[12%] px-4 py-3 text-left font-black">異쒓퀬?좏삎</th>
                <th class="w-[16%] px-4 py-3 text-left font-black">紐⑹쟻吏</th>
                <th class="w-[12%] px-4 py-3 text-right font-black">珥??섎웾</th>
                <th class="w-[10%] px-4 py-3 text-center font-black">?곹깭</th>
                <th class="w-[20%] px-4 py-3 text-left font-black">?붿껌?쇱떆</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="loading">
                <td colspan="7" class="px-4 py-14 text-center text-sm font-semibold text-slate-400">議고쉶 以묒엯?덈떎.</td>
              </tr>
              <tr
                v-for="row in visibleRows"
                v-else
                :key="row.outboundNo"
                class="cursor-pointer transition-colors hover:bg-emerald-50/40"
                @click="openDetail(row.outboundNo)"
              >
                <td class="whitespace-nowrap px-4 py-3 font-bold text-slate-500">{{ row.outboundNo }}</td>
                <td class="px-4 py-3 font-black text-slate-900">{{ row.sourceRefNo }}</td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-md border px-2.5 py-1 text-[10px] font-black" :class="outboundTypeClass(row.sourceType)">
                    {{ outboundTypeLabel(row.sourceType) }}
                  </span>
                </td>
                <td class="px-4 py-3 font-bold text-slate-700">{{ destinationLabel(row) }}</td>
                <td class="px-4 py-3 text-right font-black text-slate-700">{{ row.totalRequestedQuantity ?? 0 }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="inline-flex rounded-md px-2.5 py-1 text-[10px] font-black" :class="statusClass(row.status)">
                    {{ statusLabel(row.status) }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-3 font-bold text-slate-500">{{ formatDateTime(row.requestedAt) }}</td>
              </tr>
              <tr v-if="!loading && visibleRows.length === 0">
                <td colspan="7" class="px-4 py-14 text-center text-sm font-semibold text-slate-400">
                  議곌굔??留욌뒗 異쒓퀬 由ъ뒪?멸? ?놁뒿?덈떎.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>


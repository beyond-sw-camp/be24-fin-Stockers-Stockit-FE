<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { getStoreInboundList } from '@/api/store/inbound.js'
import { extractErrorMessage } from '@/api/axios.js'
import { formatDate, formatDateTime } from '@/features/store/common/ui.js'

const router = useRouter()

const storeMenus = roleMenus.store
const inboundMenuGroup = roleMenus.store.find((menu) => menu.path === '/store/inbound/list')
const inboundMenus = inboundMenuGroup?.children ?? []
const activeTopMenu = computed(() => inboundMenuGroup?.label ?? '입고 관리')
const activeSideMenu = ref(inboundMenus[0]?.label ?? '')

const STATUS_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'PENDING_RECEIPT', label: '입고 대기' },
  { key: 'RECEIVED', label: '입고 완료' },
]

const loading = ref(false)
const errorMessage = ref('')
const inboundRows = ref([])

const activeStatusTab = ref('ALL')
const searchKeyword = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const sortBy = ref('latest')

const statusCounts = computed(() => ({
  ALL: inboundRows.value.length,
  PENDING_RECEIPT: inboundRows.value.filter((row) => row.status === 'PENDING_RECEIPT').length,
  RECEIVED: inboundRows.value.filter((row) => row.status === 'RECEIVED').length,
}))

const pendingReceiptRows = computed(() =>
  inboundRows.value.filter((row) => row.status === 'PENDING_RECEIPT'),
)

const filteredRows = computed(() => {
  let list = [...inboundRows.value]
  if (activeStatusTab.value !== 'ALL') list = list.filter((row) => row.status === activeStatusTab.value)

  const sorted = [...list]
  if (sortBy.value === 'oldest') sorted.sort((a, b) => String(a.requestedAt).localeCompare(String(b.requestedAt)))
  if (sortBy.value === 'latest') sorted.sort((a, b) => String(b.requestedAt).localeCompare(String(a.requestedAt)))
  if (sortBy.value === 'qtyDesc') sorted.sort((a, b) => Number(b.totalExpectedQuantity || 0) - Number(a.totalExpectedQuantity || 0))
  if (sortBy.value === 'qtyAsc') sorted.sort((a, b) => Number(a.totalExpectedQuantity || 0) - Number(b.totalExpectedQuantity || 0))
  return sorted
})

function inboundStatusClass(status) {
  return {
    PENDING_RECEIPT: 'bg-amber-100 text-amber-700',
    RECEIVED: 'bg-[#EBF5F5] text-black',
  }[status] ?? 'bg-gray-100 text-gray-600'
}

function inboundStatusLabel(status) {
  return {
    PENDING_RECEIPT: '입고 대기',
    RECEIVED: '입고 완료',
  }[status] ?? status
}

async function fetchInbounds() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await getStoreInboundList({
      status: activeStatusTab.value === 'ALL' ? undefined : activeStatusTab.value,
      from: dateFrom.value || undefined,
      to: dateTo.value || undefined,
      keyword: searchKeyword.value.trim() || undefined,
    })
    inboundRows.value = Array.isArray(result) ? result : []
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, '입고 목록 조회 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

function goToInboundDetail(inboundNo) {
  router.push({ name: 'store-inbound-detail', params: { id: inboundNo } })
}

function focusPendingReceiptRows() {
  activeStatusTab.value = 'PENDING_RECEIPT'
}

function goToFirstPendingReceiptRow() {
  const firstInboundNo = pendingReceiptRows.value[0]?.inboundNo
  if (!firstInboundNo) return
  goToInboundDetail(firstInboundNo)
}

watch([activeStatusTab, dateFrom, dateTo], fetchInbounds)
watch(searchKeyword, fetchInbounds)

onMounted(fetchInbounds)
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="inboundMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Inbound</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">입고 리스트</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">입고 목록을 조회하고 상세에서 입고 확정을 처리합니다.</p>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>입고 전체 {{ statusCounts.ALL }}건</p>
            <p class="mt-1 text-gray-400">입고 완료 {{ statusCounts.RECEIVED }}건</p>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white p-3 shadow-sm">
        <div class="flex flex-wrap gap-1">
          <button
            v-for="tab in STATUS_TABS"
            :key="tab.key"
            type="button"
            class="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-black transition-colors"
            :class="activeStatusTab === tab.key ? 'border-[#004D3C] bg-[#004D3C] text-white' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'"
            @click="activeStatusTab = tab.key"
          >
            <span>{{ tab.label }}</span>
            <span class="min-w-[18px] px-1 py-0.5 text-center text-[10px]" :class="activeStatusTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'">
              {{ statusCounts[tab.key] }}
            </span>
          </button>
        </div>
      </section>

      <section
        v-if="pendingReceiptRows.length > 0"
        class="border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-amber-600">
              Inbound Action
            </p>
            <p class="mt-1 text-sm font-black text-amber-900">
              입고 확정이 필요한 입고건이 {{ pendingReceiptRows.length }}건 있습니다.
            </p>
            <p class="mt-1 text-xs font-bold text-amber-700">
              배송 완료된 입고건은 매장 재고 반영 전 단계입니다. 상세로 들어가 입고 확정을 진행하세요.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800 hover:bg-amber-100"
              @click="focusPendingReceiptRows"
            >
              배송 완료만 보기
            </button>
            <button
              type="button"
              class="border border-amber-700 bg-amber-700 px-3 py-2 text-xs font-black text-white hover:bg-amber-800"
              @click="goToFirstPendingReceiptRow"
            >
              첫 건 바로 처리
            </button>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <p v-if="errorMessage" class="border-b border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">
          {{ errorMessage }}
        </p>
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <span class="text-xs font-bold text-gray-600">총 {{ filteredRows.length }}건</span>
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="searchKeyword"
              type="search"
              placeholder="입고번호/원천번호/출고번호"
              class="w-64 border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-[#004D3C]"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <input v-model="dateFrom" type="date" class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]" />
          <span class="text-xs text-gray-400">~</span>
          <input v-model="dateTo" type="date" class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]" />
          <select v-model="sortBy" class="ml-auto border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]">
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="qtyDesc">수량 많은순</option>
            <option value="qtyAsc">수량 적은순</option>
          </select>
        </div>

        <div class="min-w-0">
          <table class="w-full table-fixed border-collapse text-xs">
            <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
              <tr>
                <th class="w-[18%] px-2 py-2 text-left font-black">요청일시</th>
                <th class="w-[16%] px-2 py-2 text-left font-black">입고번호</th>
                <th class="w-[16%] px-2 py-2 text-left font-black">원천번호</th>
                <th class="w-[16%] px-2 py-2 text-left font-black">출고번호</th>
                <th class="w-[10%] px-2 py-2 text-right font-black">예정수량</th>
                <th class="w-[12%] px-2 py-2 text-center font-black">상태</th>
                <th class="w-[12%] px-2 py-2 text-center font-black">도착예정일</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="loading">
                <td colspan="7" class="px-4 py-12 text-center text-gray-400">조회 중입니다.</td>
              </tr>
              <tr
                v-for="row in filteredRows"
                v-else
                :key="row.inboundNo"
                class="cursor-pointer transition-colors hover:bg-gray-50"
                @click="goToInboundDetail(row.inboundNo)"
              >
                <td class="px-2 py-2.5 font-bold text-gray-600">{{ formatDateTime(row.requestedAt) }}</td>
                <td class="px-2 py-2.5 font-mono font-black text-gray-800">{{ row.inboundNo }}</td>
                <td class="px-2 py-2.5 font-black text-gray-900">{{ row.sourceRefNo }}</td>
                <td class="px-2 py-2.5 font-black text-gray-700">{{ row.outboundNo }}</td>
                <td class="px-2 py-2.5 text-right font-black text-gray-900">{{ row.totalExpectedQuantity || 0 }}</td>
                <td class="px-2 py-2.5 text-center">
                  <span class="inline-flex px-2 py-1 text-[10px] font-black" :class="inboundStatusClass(row.status)">
                    {{ inboundStatusLabel(row.status) }}
                  </span>
                </td>
                <td class="px-2 py-2.5 text-center font-bold text-gray-700">{{ formatDate(row.expectedArrivalAt) }}</td>
              </tr>
              <tr v-if="!loading && filteredRows.length === 0">
                <td colspan="7" class="px-4 py-12 text-center text-gray-400">조회 가능한 입고 내역이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

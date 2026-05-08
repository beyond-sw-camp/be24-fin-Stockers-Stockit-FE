<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { formatDateTime, storeOrderStatusClass } from '@/features/store/common/ui.js'
import { getStoreOrders } from '@/api/store/orders.js'

/**
 * ==============================================================================
 * 2. STATE & REFS
 * ==============================================================================
 */
const router = useRouter()
const auth = useAuthStore()

const activeSideMenu = ref('발주 내역')
const loading = ref(false)
const errorMessage = ref('')
const orders = ref([])
const activeStatusTab = ref('전체')
const searchKeyword = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const sortBy = ref('latest')

/**
 * ==============================================================================
 * 3. COMPUTED
 * ==============================================================================
 */
const storeMenus = roleMenus.store
const orderMenus = roleMenus.store.find((menu) => menu.label === '발주 관리')?.children ?? []
const activeTopMenu = computed(() => '발주 관리')

const statusCounts = computed(() => ({
  전체: orders.value.length,
  REQUESTED: orders.value.filter((order) => order.status === 'REQUESTED').length,
  APPROVED: orders.value.filter((order) => order.status === 'APPROVED').length,
  COMPLETED: orders.value.filter((order) => order.status === 'COMPLETED').length,
  CANCELLED: orders.value.filter((order) => order.status === 'CANCELLED').length,
}))

const filteredOrders = computed(() => {
  let list = [...orders.value]

  if (activeStatusTab.value !== '전체') {
    list = list.filter((order) => order.status === activeStatusTab.value)
  }

  if (sortBy.value === 'oldest') list.sort((a, b) => new Date(a.requestedAt) - new Date(b.requestedAt))
  if (sortBy.value === 'latest') list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
  if (sortBy.value === 'qtyDesc') list.sort((a, b) => Number(b.totalRequestedQuantity) - Number(a.totalRequestedQuantity))
  if (sortBy.value === 'qtyAsc') list.sort((a, b) => Number(a.totalRequestedQuantity) - Number(b.totalRequestedQuantity))

  return list
})

const summary = computed(() => ({
  totalOrders: orders.value.length,
  totalRequestedQuantity: orders.value.reduce((sum, order) => sum + Number(order.totalRequestedQuantity ?? 0), 0),
}))

/**
 * ==============================================================================
 * 4. CONSTANTS
 * ==============================================================================
 */
const STATUS_TABS = [
  { label: '전체', key: '전체' },
  { label: '승인 대기', key: 'REQUESTED' },
  { label: '승인 완료', key: 'APPROVED' },
  { label: '완료', key: 'COMPLETED' },
  { label: '취소', key: 'CANCELLED' },
]

const statusLabelMap = {
  REQUESTED: '승인 대기',
  APPROVED: '승인 완료',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

/**
 * ==============================================================================
 * 5. METHODS - UI STATE
 * ==============================================================================
 */
// [함수] 발주 상태값에 맞는 칩 스타일 클래스를 반환한다.
function statusClass(status) {
  return storeOrderStatusClass(status)
}

// [함수] 상태 탭을 변경하고 목록을 즉시 재조회한다.
function changeTab(key) {
  activeStatusTab.value = key
}

/**
 * ==============================================================================
 * 6. METHODS - API SERVICE
 * ==============================================================================
 */
// [함수] 매장 발주 목록 API를 호출해 화면 리스트를 갱신한다.
async function fetchOrders() {
  loading.value = true
  errorMessage.value = ''

  try {
    if (!auth.user?.locationCode) {
      throw new Error('로그인 매장 정보가 없어 발주 내역을 조회할 수 없습니다.')
    }

    const result = await getStoreOrders({
      from: dateFrom.value || undefined,
      to: dateTo.value || undefined,
      keyword: searchKeyword.value?.trim() || undefined,
    })

    orders.value = (Array.isArray(result) ? result : []).map((row) => ({
      orderId: row.orderId,
      requestedAt: row.requestedAt,
      status: row.status,
      totalSkuCount: Number(row.totalSkuCount ?? 0),
      totalRequestedQuantity: Number(row.totalRequestedQuantity ?? 0),
      headline: row.headline ?? '-',
    }))
  } catch (error) {
    errorMessage.value = error?.message ?? '발주 내역을 다시 조회해 주세요.'
  } finally {
    loading.value = false
  }
}

/**
 * ==============================================================================
 * 7. METHODS - NAVIGATION
 * ==============================================================================
 */
// [함수] 로그아웃 처리 후 로그인 화면으로 이동한다.
function handleLogout() {
  auth.logout()
  router.push('/dev-login')
}

/**
 * ==============================================================================
 * 8. WATCHERS
 * ==============================================================================
 */
watch([searchKeyword, dateFrom, dateTo, sortBy], fetchOrders)

/**
 * ==============================================================================
 * 9. LIFECYCLE
 * ==============================================================================
 */
onMounted(fetchOrders)
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="orderMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Orders</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">발주 내역</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              발주건 목록을 먼저 확인하고, 원하는 발주건을 눌러 상세 페이지로 이동합니다.
            </p>
            <p class="mt-2 text-[11px] font-bold text-blue-800">
              발주 승인 처리 시점: 기본적으로 전날(00:00~23:59) 발주건은 익일 00:00(KST)에 자동 승인되며, 필요한 경우 본사에서 수동 배치 승인으로 즉시 처리될 수 있습니다.
            </p>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>전체 {{ summary.totalOrders }}건</p>
            <p class="mt-1 text-gray-400">누적 요청 수량 {{ summary.totalRequestedQuantity }}개</p>
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
            :class="
              activeStatusTab === tab.key
                ? 'border-[#004D3C] bg-[#004D3C] text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            "
            @click="changeTab(tab.key)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="min-w-[18px] px-1 py-0.5 text-center text-[10px]"
              :class="
                activeStatusTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-500'
              "
            >
              {{ statusCounts[tab.key] }}
            </span>
          </button>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <p v-if="errorMessage" class="border-b border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700">
          {{ errorMessage }}
        </p>
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <span class="text-xs font-bold text-gray-600">총 {{ filteredOrders.length }}건</span>
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="searchKeyword"
              type="search"
              placeholder="발주번호, 상품명, 카테고리"
              class="w-60 border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold outline-none focus:border-[#004D3C]"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <input
            v-model="dateFrom"
            type="date"
            class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
          />
          <span class="text-xs text-gray-400">~</span>
          <input
            v-model="dateTo"
            type="date"
            class="border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
          />
          <select
            v-model="sortBy"
            class="ml-auto border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#004D3C]"
          >
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
                <th class="w-[20%] px-2 py-2 text-left font-black">요청일시</th>
                <th class="w-[18%] px-2 py-2 text-left font-black">발주번호</th>
                <th class="w-[30%] px-2 py-2 text-left font-black">대표 상품명</th>
                <th class="w-[10%] px-2 py-2 text-right font-black">총 SKU</th>
                <th class="w-[12%] px-2 py-2 text-right font-black">총요청</th>
                <th class="w-[10%] px-2 py-2 text-center font-black">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="order in filteredOrders"
                :key="order.orderId"
                class="cursor-pointer transition-colors hover:bg-gray-50"
                @click="router.push({ name: 'store-order-detail', params: { orderNo: order.orderId } })"
              >
                <td class="px-2 py-2.5 font-bold text-gray-600">{{ formatDateTime(order.requestedAt) }}</td>
                <td class="px-2 py-2.5 font-mono font-black text-gray-800">{{ order.orderId }}</td>
                <td class="px-2 py-2.5 font-black text-gray-900">
                  <p class="truncate">{{ order.headline }}</p>
                </td>
                <td class="px-2 py-2.5 text-right font-black text-gray-700">{{ order.totalSkuCount }}</td>
                <td class="px-2 py-2.5 text-right font-black text-gray-900">{{ order.totalRequestedQuantity }}</td>
                <td class="px-2 py-2.5 text-center">
                  <span class="inline-flex px-2 py-1 text-[10px] font-black" :class="statusClass(order.status)">
                    {{ statusLabelMap[order.status] }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredOrders.length === 0">
                <td colspan="6" class="px-4 py-12 text-center text-gray-400">조회 가능한 발주 내역이 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

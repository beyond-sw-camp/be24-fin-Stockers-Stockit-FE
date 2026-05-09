<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getStoreOrderAnalytics } from '@/api/store/orders.js'

/**
 * ==============================================================================
 * 2. STATE & REFS
 * ==============================================================================
 */
const router = useRouter()
const auth = useAuthStore()

const activeSideMenu = ref('발주 분석')
const analyticsSummary = ref({
  totalOrders: 0,
  totalRequestedQuantity: 0,
  requestedCount: 0,
  approvedCount: 0,
  completedCount: 0,
  cancelledCount: 0,
})
const analyticsTopSkus = ref([])
const analyticsCategoryBreakdown = ref([])

/**
 * ==============================================================================
 * 3. COMPUTED
 * ==============================================================================
 */
const storeMenus = roleMenus.store
const orderMenus = roleMenus.store.find((menu) => menu.label === '발주 관리')?.children ?? []
const activeTopMenu = computed(() => '발주 관리')

/**
 * ==============================================================================
 * 5. METHODS - UI STATE
 * ==============================================================================
 */

/**
 * ==============================================================================
 * 6. METHODS - API SERVICE
 * ==============================================================================
 */
// [함수] 발주 분석 API를 호출해 요약/랭킹 데이터를 갱신한다.
async function fetchAnalytics() {
  try {
    if (!auth.user?.locationCode) return

    const res = await getStoreOrderAnalytics()
    analyticsSummary.value = {
      totalOrders: Number(res?.totalOrders ?? 0),
      totalRequestedQuantity: Number(res?.totalRequestedQuantity ?? 0),
      requestedCount: Number(res?.requestedCount ?? 0),
      approvedCount: Number(res?.approvedCount ?? 0),
      completedCount: Number(res?.completedCount ?? 0),
      cancelledCount: Number(res?.cancelledCount ?? 0),
    }
    analyticsTopSkus.value = Array.isArray(res?.topSkus) ? res.topSkus : []
    analyticsCategoryBreakdown.value = Array.isArray(res?.categoryBreakdown) ? res.categoryBreakdown : []
  } catch {
    analyticsSummary.value = {
      totalOrders: 0,
      totalRequestedQuantity: 0,
      requestedCount: 0,
      approvedCount: 0,
      completedCount: 0,
      cancelledCount: 0,
    }
    analyticsTopSkus.value = []
    analyticsCategoryBreakdown.value = []
  }
}



/**
 * ==============================================================================
 * 9. LIFECYCLE
 * ==============================================================================
 */
onMounted(fetchAnalytics)
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="orderMenus"
    v-model:active-side-menu="activeSideMenu"

  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Orders</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">발주 분석</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">
          이번 단계에서는 발주 집계 뼈대만 제공합니다. 이후 판매량 대비 발주량과 월별 추이로 확장할 수 있습니다.
        </p>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">발주건 수</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ analyticsSummary.totalOrders }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">누적 요청 수량</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ analyticsSummary.totalRequestedQuantity }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">승인 대기</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ analyticsSummary.requestedCount }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">승인 완료</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ analyticsSummary.approvedCount }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">종료</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ analyticsSummary.completedCount }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">취소</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ analyticsSummary.cancelledCount }}</p>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">SKU별 누적 발주량</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-[720px] w-full border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-4 py-3 text-left font-black">상품명</th>
                  <th class="px-4 py-3 text-left font-black">옵션</th>
                  <th class="px-4 py-3 text-left font-black">카테고리</th>
                  <th class="px-4 py-3 text-right font-black">발주 수량</th>
                  <th class="px-4 py-3 text-right font-black">발주 건수</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in analyticsTopSkus" :key="row.skuCode">
                  <td class="px-4 py-3 font-black text-gray-900">{{ row.productName }}</td>
                  <td class="px-4 py-3 font-bold text-gray-700">{{ row.skuCode }}</td>
                  <td class="px-4 py-3 font-bold text-gray-600">{{ row.categoryLabel }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-900">{{ row.requestedQuantity }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-700">{{ row.orderCount }}</td>
                </tr>
                <tr v-if="analyticsTopSkus.length === 0">
                  <td colspan="5" class="px-4 py-12 text-center text-gray-400">
                    아직 분석할 발주 데이터가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">카테고리별 발주 비중</h2>
          </div>
          <div class="flex flex-col gap-3 p-4">
            <div
              v-for="row in analyticsCategoryBreakdown"
              :key="row.label"
              class="border border-gray-200 bg-gray-50 px-3 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-black text-gray-900">{{ row.label }}</p>
                <span class="text-xs font-black text-[#004D3C]">{{ row.requestedQuantity }}개</span>
              </div>
            </div>
            <div
              v-if="analyticsCategoryBreakdown.length === 0"
              class="flex min-h-[220px] items-center justify-center text-center text-sm font-bold text-gray-400"
            >
              아직 분석할 발주 데이터가 없습니다.
            </div>
          </div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>


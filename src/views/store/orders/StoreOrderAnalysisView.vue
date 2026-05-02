<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useStoreOrderStore } from '@/stores/storeOrder.js'

const router = useRouter()
const auth = useAuthStore()
const storeOrders = useStoreOrderStore()

const storeMenus = roleMenus.store
const orderMenus = roleMenus.store.find((menu) => menu.label === '발주 관리')?.children ?? []
const activeTopMenu = computed(() => '발주 관리')
const activeSideMenu = ref('발주 분석')

function handleLogout() {
  auth.logout()
  router.push('/login')
}
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
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Orders</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">발주 분석</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">
          이번 단계에서는 발주 집계 뼈대만 제공합니다. 이후 판매량 대비 발주량과 월별 추이로 확장할 수 있습니다.
        </p>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">발주건 수</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.summary.totalOrders }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">누적 요청 수량</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.summary.totalRequestedQuantity }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">승인 대기</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.summary.requestedCount }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">승인 완료</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.summary.approvedCount }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">종료</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.summary.completedCount }}</p>
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
                <tr v-for="row in storeOrders.analytics.topSkus" :key="row.skuId">
                  <td class="px-4 py-3 font-black text-gray-900">{{ row.productName }}</td>
                  <td class="px-4 py-3 font-bold text-gray-700">{{ row.optionLabel }}</td>
                  <td class="px-4 py-3 font-bold text-gray-600">{{ row.categoryLabel }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-900">{{ row.requestedQuantity }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-700">{{ row.orderCount }}</td>
                </tr>
                <tr v-if="storeOrders.analytics.topSkus.length === 0">
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
              v-for="row in storeOrders.analytics.categoryBreakdown"
              :key="row.label"
              class="border border-gray-200 bg-gray-50 px-3 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-black text-gray-900">{{ row.label }}</p>
                <span class="text-xs font-black text-[#004D3C]">{{ row.requestedQuantity }}개</span>
              </div>
            </div>
            <div
              v-if="storeOrders.analytics.categoryBreakdown.length === 0"
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

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useStoreInboundStore } from '@/stores/storeInbound.js'

const router = useRouter()
const auth = useAuthStore()
const storeOrders = useStoreInboundStore()

const storeMenus = roleMenus.store
const inboundMenus = roleMenus.store.find((menu) => menu.label === '입고 관리')?.children ?? []
const activeTopMenu = computed(() => '입고 관리')
const activeSideMenu = ref('입고 분석')

const statusRows = computed(() => [
  { label: '배송 준비중', value: storeOrders.inboundAnalytics.statusCounts.READY_TO_SHIP },
  { label: '배송 중', value: storeOrders.inboundAnalytics.statusCounts.IN_TRANSIT },
  { label: '배송 완료', value: storeOrders.inboundAnalytics.statusCounts.ARRIVED },
  { label: '입고 완료', value: storeOrders.inboundAnalytics.statusCounts.RECEIVED },
])

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="inboundMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Inbound</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">입고 분석</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">
          이번 단계에서는 입고 진행 현황과 카테고리별 입고 수량 뼈대만 제공합니다.
        </p>
      </section>

      <section class="grid gap-4 md:grid-cols-4">
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">입고 완료 건수</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.inboundSummary.totalCompletedOrders }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">누적 입고 수량</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.inboundSummary.totalCompletedQuantity }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">배송 중</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.inboundSummary.inTransitCount }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">배송 완료</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ storeOrders.inboundSummary.arrivedCount }}</p>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">상태별 건수</h2>
          </div>
          <div class="flex flex-col gap-3 p-4">
            <div
              v-for="row in statusRows"
              :key="row.label"
              class="flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-3"
            >
              <p class="text-xs font-black text-gray-900">{{ row.label }}</p>
              <span class="text-sm font-black text-[#004D3C]">{{ row.value }}건</span>
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">카테고리별 입고 수량</h2>
          </div>
          <div class="flex flex-col gap-3 p-4">
            <div
              v-for="row in storeOrders.inboundAnalytics.categoryBreakdown"
              :key="row.label"
              class="border border-gray-200 bg-gray-50 px-3 py-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-black text-gray-900">{{ row.label }}</p>
                <span class="text-xs font-black text-[#004D3C]">{{ row.quantity }}개</span>
              </div>
            </div>
            <div
              v-if="storeOrders.inboundAnalytics.categoryBreakdown.length === 0"
              class="flex min-h-[220px] items-center justify-center text-center text-sm font-bold text-gray-400"
            >
              아직 분석할 입고 데이터가 없습니다.
            </div>
          </div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

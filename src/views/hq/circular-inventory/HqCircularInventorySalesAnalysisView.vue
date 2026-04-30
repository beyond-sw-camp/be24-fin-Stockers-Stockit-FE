<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCircularInventoryStore } from '@/stores/circularInventory.js'

const router = useRouter()
const auth = useAuthStore()
const circularInventoryStore = useCircularInventoryStore()

const hqMenus = roleMenus.hq
const circularInventoryMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 판매 분석')

const summary = computed(() => circularInventoryStore.salesSummary)
const analytics = computed(() => circularInventoryStore.salesAnalytics)

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularInventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory Sales Analytics</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 판매 분석</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">등록된 순환 재고 판매 이력을 기준으로 거래처, 카테고리, 소재 판매 비중을 확인합니다.</p>
      </section>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">총 판매건수</p>
          <p class="mt-3 text-2xl font-black text-gray-900">{{ summary.totalSalesCount }}</p>
        </article>
        <article class="border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">총 실제 판매 kg</p>
          <p class="mt-3 text-2xl font-black text-gray-900">{{ summary.totalWeightKg.toFixed(2) }}kg</p>
        </article>
        <article class="border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">총 실제 판매 금액</p>
          <p class="mt-3 text-2xl font-black text-gray-900">₩{{ summary.totalAmount.toLocaleString() }}</p>
        </article>
        <article class="border border-gray-200 bg-white px-4 py-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">거래처 수</p>
          <p class="mt-3 text-2xl font-black text-gray-900">{{ summary.totalBuyerCount }}</p>
        </article>
      </section>

      <div class="grid gap-4 xl:grid-cols-3">
        <section class="border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">카테고리별 판매</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-3 py-3 text-left font-black">카테고리</th>
                  <th class="px-3 py-3 text-right font-black">실제 판매 kg</th>
                  <th class="px-3 py-3 text-right font-black">금액</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in analytics.categoryBreakdown" :key="row.label">
                  <td class="px-3 py-3 font-black text-gray-900">{{ row.label }}</td>
                  <td class="px-3 py-3 text-right font-black text-gray-700">{{ row.totalWeightKg.toFixed(2) }}kg</td>
                  <td class="px-3 py-3 text-right font-black text-gray-900">₩{{ row.totalAmount.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">거래처별 판매</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-3 py-3 text-left font-black">거래처</th>
                  <th class="px-3 py-3 text-right font-black">실제 판매 kg</th>
                  <th class="px-3 py-3 text-right font-black">금액</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in analytics.buyerBreakdown" :key="row.buyerId">
                  <td class="px-3 py-3 font-black text-gray-900">{{ row.buyerName }}</td>
                  <td class="px-3 py-3 text-right font-black text-gray-700">{{ row.totalWeightKg.toFixed(2) }}kg</td>
                  <td class="px-3 py-3 text-right font-black text-gray-900">₩{{ row.totalAmount.toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">소재별 실제 판매 환산 kg</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-3 py-3 text-left font-black">소재</th>
                  <th class="px-3 py-3 text-right font-black">실제 환산 kg</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="row in analytics.materialBreakdown" :key="row.materialName">
                  <td class="px-3 py-3 font-black text-gray-900">{{ row.materialName }}</td>
                  <td class="px-3 py-3 text-right font-black text-gray-700">{{ row.totalWeightKg.toFixed(2) }}kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

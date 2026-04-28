<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSalesStore } from '@/stores/sales.js'

const router = useRouter()
const auth = useAuthStore()
const sales = useSalesStore()

const storeMenus = roleMenus.store
const salesMenus = roleMenus.store.find((menu) => menu.label === '판매 관리')?.children ?? []
const activeTopMenu = computed(() => '판매 관리')
const activeSideMenu = ref('판매 분석')

const topProducts = computed(() => {
  const map = new Map()
  sales.sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const key = `${item.productName}|${item.mainCategory}|${item.subCategory}`
      const previous = map.get(key) ?? {
        productName: item.productName,
        category: `${item.mainCategory} > ${item.subCategory}`,
        quantity: 0,
        amount: 0,
      }
      previous.quantity += item.quantity
      previous.amount += item.lineAmount
      map.set(key, previous)
    })
  })
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="salesMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Sales</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">판매 분석</h1>
        <p class="mt-1 text-xs font-bold text-gray-500">
          이번 단계에서는 분석 구조만 고정합니다. 저장된 판매건을 바탕으로 추후 함께 팔린 상품, 시간대별 판매, 카테고리별 매출 분석으로 확장합니다.
        </p>
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">판매건 수</p>
          <p class="mt-2 text-2xl font-black text-gray-900">{{ sales.sales.length }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">누적 판매 수량</p>
          <p class="mt-2 text-2xl font-black text-gray-900">
            {{ sales.sales.reduce((sum, sale) => sum + sale.totalQuantity, 0) }}
          </p>
        </article>
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">누적 판매 금액</p>
          <p class="mt-2 text-2xl font-black text-gray-900">
            ₩{{ sales.sales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString() }}
          </p>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">분석 준비 데이터 미리보기</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-[720px] w-full border-collapse text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-4 py-3 text-left font-black">상품명</th>
                <th class="px-4 py-3 text-left font-black">카테고리</th>
                <th class="px-4 py-3 text-right font-black">판매 수량</th>
                <th class="px-4 py-3 text-right font-black">판매 금액</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in topProducts" :key="`${row.productName}-${row.category}`">
                <td class="px-4 py-3 font-black text-gray-900">{{ row.productName }}</td>
                <td class="px-4 py-3 font-bold text-gray-600">{{ row.category }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-700">{{ row.quantity }}</td>
                <td class="px-4 py-3 text-right font-black text-gray-900">₩{{ row.amount.toLocaleString() }}</td>
              </tr>
              <tr v-if="topProducts.length === 0">
                <td colspan="4" class="px-4 py-12 text-center text-gray-400">
                  아직 분석할 판매 데이터가 없습니다. 판매 등록부터 시작해주세요.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

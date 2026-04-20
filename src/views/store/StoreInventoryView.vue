<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AlertCircle, PackageSearch, Search } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { storeSideMenusByTopMenu, storeTopMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useInventoryStore } from '@/stores/inventory.js'

const router = useRouter()
const auth = useAuthStore()
const inventory = useInventoryStore()

const activeTopMenu = '재고 관리'
const activeSideMenu = ref('매장 보유 재고 조회')
const sideMenus = storeSideMenusByTopMenu[activeTopMenu]
const searchTerm = ref('')

const visibleProducts = computed(() => {
  const keyword = searchTerm.value.trim()
  return inventory.products.filter((product) => {
    const matchSearch = product.name.includes(keyword) || product.category.includes(keyword) || product.id.includes(keyword)
    const matchStatus = activeSideMenu.value === '매장 보유 재고 조회' || inventory.stockStatus(product) !== 'normal'
    return matchSearch && matchStatus
  })
})

const statusLabel = { out: '품절', low: '부족', normal: '정상' }
const statusClass = {
  out: 'bg-red-100 text-red-700',
  low: 'bg-orange-100 text-orange-700',
  normal: 'bg-green-100 text-green-700',
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeTopMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">
      <section class="flex flex-wrap items-center justify-between gap-4 border border-gray-300 bg-white px-5 py-5 shadow-sm">
        <div>
          <h1 class="inline-flex items-center gap-2 text-lg font-black text-gray-900">
            <PackageSearch :size="20" />
            {{ activeSideMenu }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">매장 보유 재고와 품절/부족 재고를 조회합니다.</p>
        </div>
        <div class="relative w-full sm:w-72">
          <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="품목, 카테고리, 코드 검색"
            class="w-full border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#004D3C]"
          />
        </div>
      </section>

      <section class="grid gap-3 md:grid-cols-3">
        <article class="border border-gray-300 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold text-gray-500">전체 SKU</p>
          <p class="mt-3 text-3xl font-semibold text-gray-950">{{ inventory.products.length }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold text-gray-500">부족 재고</p>
          <p class="mt-3 text-3xl font-semibold text-orange-700">{{ inventory.products.filter((p) => inventory.stockStatus(p) === 'low').length }}</p>
        </article>
        <article class="border border-gray-300 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold text-gray-500">품절</p>
          <p class="mt-3 text-3xl font-semibold text-red-700">{{ inventory.products.filter((p) => inventory.stockStatus(p) === 'out').length }}</p>
        </article>
      </section>

      <section class="overflow-hidden border border-gray-300 bg-white shadow-sm">
        <table class="w-full min-w-[860px] text-sm">
          <thead class="border-b border-gray-200 bg-gray-100 text-xs text-gray-500">
            <tr>
              <th class="px-4 py-3 text-left font-bold">품목 코드</th>
              <th class="px-4 py-3 text-left font-bold">카테고리</th>
              <th class="px-4 py-3 text-left font-bold">상품명</th>
              <th class="px-4 py-3 text-right font-bold">현재 재고</th>
              <th class="px-4 py-3 text-right font-bold">안전 재고</th>
              <th class="px-4 py-3 text-center font-bold">상태</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="product in visibleProducts" :key="product.id" class="hover:bg-gray-50">
              <td class="px-4 py-4 font-medium text-gray-400">{{ product.id }}</td>
              <td class="px-4 py-4 text-gray-600">{{ product.category }}</td>
              <td class="px-4 py-4 font-bold text-gray-800">{{ product.name }}</td>
              <td class="px-4 py-4 text-right font-bold text-gray-900">{{ product.stock.toLocaleString() }}</td>
              <td class="px-4 py-4 text-right text-gray-500">{{ product.safetyStock.toLocaleString() }}</td>
              <td class="px-4 py-4 text-center">
                <span class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold" :class="statusClass[inventory.stockStatus(product)]">
                  <AlertCircle v-if="inventory.stockStatus(product) !== 'normal'" :size="12" />
                  {{ statusLabel[inventory.stockStatus(product)] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </AppLayout>
</template>

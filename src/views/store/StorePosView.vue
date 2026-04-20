<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ShoppingCart } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { storeSideMenusByTopMenu, storeTopMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useInventoryStore } from '@/stores/inventory.js'

const router = useRouter()
const auth = useAuthStore()
const inventory = useInventoryStore()

const activeTopMenu = '판매'
const activeSideMenu = ref('판매 페이지')
const sideMenus = storeSideMenusByTopMenu[activeTopMenu]

const activeCategory = ref('전체')
const searchTerm = ref('')
const quantities = ref({})

const filteredProducts = computed(() =>
  inventory.products.filter((product) => {
    const matchCategory = activeCategory.value === '전체' || product.category === activeCategory.value
    const matchSearch = product.name.includes(searchTerm.value.trim())
    return matchCategory && matchSearch
  }),
)

const statusLabel = { out: '품절', low: '부족', normal: '정상' }
const statusClass = {
  out: 'bg-red-100 text-red-700',
  low: 'bg-orange-100 text-orange-700',
  normal: 'bg-green-100 text-green-700',
}

function getQty(productId) {
  return quantities.value[productId] ?? 1
}

function setQty(productId, value) {
  const num = parseInt(value)
  quantities.value[productId] = Number.isNaN(num) || num < 1 ? 1 : num
}

function isOverStock(product) {
  return getQty(product.id) > product.stock
}

function handleSell(product) {
  const result = inventory.sell(product.id, getQty(product.id))
  if (result.success) quantities.value[product.id] = 1
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
          <h1 class="text-lg font-black text-gray-900">판매 페이지</h1>
          <p class="mt-1 text-sm text-gray-500">상품을 검색하고 판매 수량만큼 매장 재고를 즉시 차감합니다.</p>
        </div>
        <div class="relative w-full sm:w-72">
          <Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="상품명 검색"
            class="w-full border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#004D3C]"
          />
        </div>
      </section>

      <section class="flex flex-wrap gap-1 border-b border-gray-200">
        <button
          v-for="category in inventory.categories"
          :key="category"
          type="button"
          class="border-b-2 px-4 py-2 text-xs font-bold transition-colors"
          :class="activeCategory === category ? 'border-[#004D3C] text-[#004D3C]' : 'border-transparent text-gray-400 hover:text-gray-600'"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </section>

      <section class="overflow-hidden border border-gray-300 bg-white shadow-sm">
        <table class="w-full min-w-[860px] text-sm">
          <thead class="border-b border-gray-200 bg-gray-100 text-xs text-gray-500">
            <tr>
              <th class="px-4 py-3 text-left font-bold">카테고리</th>
              <th class="px-4 py-3 text-left font-bold">상품명</th>
              <th class="px-4 py-3 text-right font-bold">단가</th>
              <th class="px-4 py-3 text-center font-bold">재고</th>
              <th class="px-4 py-3 text-center font-bold">판매 수량</th>
              <th class="px-4 py-3 text-center font-bold">판매</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50">
              <td class="px-4 py-4 text-gray-500">{{ product.category }}</td>
              <td class="px-4 py-4 font-bold text-gray-800">{{ product.name }}</td>
              <td class="px-4 py-4 text-right text-gray-700">₩{{ product.unitPrice.toLocaleString() }}</td>
              <td class="px-4 py-4 text-center">
                <span class="mr-2 px-2 py-0.5 text-xs font-bold" :class="statusClass[inventory.stockStatus(product)]">
                  {{ statusLabel[inventory.stockStatus(product)] }}
                </span>
                <span class="font-bold text-gray-700">{{ product.stock.toLocaleString() }}</span>
              </td>
              <td class="px-4 py-4 text-center">
                <input
                  type="number"
                  min="1"
                  :max="product.stock"
                  :value="getQty(product.id)"
                  :disabled="inventory.stockStatus(product) === 'out'"
                  class="w-20 border px-2 py-1 text-center outline-none disabled:bg-gray-100"
                  :class="isOverStock(product) ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[#004D3C]'"
                  @input="setQty(product.id, $event.target.value)"
                />
                <p v-if="isOverStock(product)" class="mt-1 text-xs text-red-500">재고 초과</p>
              </td>
              <td class="px-4 py-4 text-center">
                <button
                  type="button"
                  :disabled="inventory.stockStatus(product) === 'out' || isOverStock(product)"
                  class="inline-flex items-center gap-1.5 bg-[#004D3C] px-3 py-1.5 text-xs font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
                  @click="handleSell(product)"
                >
                  <ShoppingCart :size="13" />
                  판매
                </button>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-sm text-gray-400">검색 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </AppLayout>
</template>

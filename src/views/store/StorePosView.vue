<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useInventoryStore } from '@/stores/inventory.js'

const router = useRouter()
const auth = useAuthStore()
const inventory = useInventoryStore()

const activeSideMenu = ref('POS / 판매')
const sideMenus = roleMenus.store

const activeCategory = ref('전체')
const searchTerm = ref('')
const quantities = ref({})

const filteredProducts = computed(() => {
  return inventory.products.filter(p => {
    const matchCat = activeCategory.value === '전체' || p.category === activeCategory.value
    const matchSearch = p.name.includes(searchTerm.value.trim())
    return matchCat && matchSearch
  })
})

function getQty(productId) {
  return quantities.value[productId] ?? 1
}


function setQty(productId, val) {
  const num = parseInt(val)
  quantities.value[productId] = isNaN(num) || num < 1 ? 1 : num
}

function isOverStock(product) {
  return getQty(product.id) > product.stock
}

function handleSell(product) {
  const qty = getQty(product.id)
  const result = inventory.sell(product.id, qty)
  if (result.success) {
    quantities.value[product.id] = 1
  }
}

const statusLabel = { out: '품절', low: '부족', normal: '정상' }
const statusClass = {
  out:    'bg-red-100 text-red-700',
  low:    'bg-orange-100 text-orange-700',
  normal: 'bg-green-100 text-green-700',
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    active-top-menu="POS / 판매"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="space-y-4">
      <!-- 헤더 -->
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-sm font-black text-gray-800 uppercase tracking-widest">POS / 판매</h1>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="제품명 검색..."
          class="w-56 px-3 py-1.5 border border-gray-300 text-xs bg-white outline-none focus:border-[#004D3C] transition-colors"
        />
      </div>

      <!-- 카테고리 탭 -->
      <div class="flex gap-1 border-b border-gray-200">
        <button
          v-for="cat in inventory.categories"
          :key="cat"
          type="button"
          class="px-4 py-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors"
          :class="activeCategory === cat
            ? 'border-[#004D3C] text-[#004D3C]'
            : 'border-transparent text-gray-400 hover:text-gray-600'"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <!-- 제품 테이블 -->
      <div class="bg-white border border-gray-200 overflow-hidden">
        <table class="w-full text-xs">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-wider w-24">카테고리</th>
              <th class="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-wider">제품명</th>
              <th class="px-4 py-2.5 text-right font-black text-gray-500 uppercase tracking-wider w-28">단가</th>
              <th class="px-4 py-2.5 text-center font-black text-gray-500 uppercase tracking-wider w-28">재고</th>
              <th class="px-4 py-2.5 text-center font-black text-gray-500 uppercase tracking-wider w-28">판매 수량</th>
              <th class="px-4 py-2.5 text-center font-black text-gray-500 uppercase tracking-wider w-20">판매</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="product in filteredProducts"
              :key="product.id"
              class="hover:bg-gray-50 transition-colors"
              :class="inventory.stockStatus(product) === 'out' ? 'opacity-50' : ''"
            >
              <!-- 카테고리 -->
              <td class="px-4 py-3 text-gray-500">{{ product.category }}</td>

              <!-- 제품명 -->
              <td class="px-4 py-3 font-bold text-gray-800">{{ product.name }}</td>

              <!-- 단가 -->
              <td class="px-4 py-3 text-right text-gray-700">
                ₩{{ product.unitPrice.toLocaleString() }}
              </td>

              <!-- 재고 + 상태 배지 -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <span
                    class="inline-block px-2 py-0.5 text-xs font-bold"
                    :class="statusClass[inventory.stockStatus(product)]"
                  >
                    {{ inventory.stockStatus(product) === 'out' ? '품절' : statusLabel[inventory.stockStatus(product)] }}
                  </span>
                  <span v-if="inventory.stockStatus(product) !== 'out'" class="text-gray-700 font-bold">
                    {{ product.stock.toLocaleString() }}
                  </span>
                </div>
              </td>

              <!-- 판매 수량 input -->
              <td class="px-4 py-3 text-center">
                <div class="flex flex-col items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    :max="product.stock"
                    :value="getQty(product.id)"
                    :disabled="inventory.stockStatus(product) === 'out'"
                    class="w-20 px-2 py-1 border text-center outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    :class="isOverStock(product) ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-[#004D3C]'"
                    @input="setQty(product.id, $event.target.value)"
                  />
                  <span v-if="isOverStock(product)" class="text-red-500 text-xs">재고 초과</span>
                </div>
              </td>

              <!-- 판매 버튼 -->
              <td class="px-4 py-3 text-center">
                <button
                  type="button"
                  :disabled="inventory.stockStatus(product) === 'out' || isOverStock(product)"
                  class="px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  :class="inventory.stockStatus(product) === 'out' || isOverStock(product)
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-[#004D3C] text-white hover:bg-[#003d30]'"
                  @click="handleSell(product)"
                >
                  판매
                </button>
              </td>
            </tr>

            <!-- 검색 결과 없음 -->
            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="px-4 py-12 text-center text-gray-400 text-xs">
                검색 결과가 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 하단 요약 -->
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>총 {{ filteredProducts.length }}개 제품</span>
        <span>품절 {{ filteredProducts.filter(p => inventory.stockStatus(p) === 'out').length }}개</span>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useInventoryStore } from '@/stores/inventory.js'
import { useSalesStore } from '@/stores/sales.js'

const router = useRouter()
const auth = useAuthStore()
const inventory = useInventoryStore()
const sales = useSalesStore()

const storeMenus = roleMenus.store
const salesMenus = roleMenus.store.find((menu) => menu.label === '판매 관리')?.children ?? []
const activeTopMenu = computed(() => '판매 관리')
const activeSideMenu = ref('판매 등록')

const selectedMainCategory = ref('전체')
const selectedSubCategory = ref('전체')
const selectedColor = ref('전체')
const searchTerm = ref('')
const salesLines = ref([])
const feedbackMessage = ref('')

const subCategoryOptions = computed(() => inventory.getSubCategories(selectedMainCategory.value))

const filteredSkus = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  return inventory.skus.filter((sku) => {
    const matchMain =
      selectedMainCategory.value === '전체' || sku.mainCategory === selectedMainCategory.value
    const matchSub =
      selectedSubCategory.value === '전체' || sku.subCategory === selectedSubCategory.value
    const matchColor = selectedColor.value === '전체' || sku.color === selectedColor.value
    const matchKeyword =
      !keyword ||
      [sku.productName, sku.mainCategory, sku.subCategory, sku.color, sku.size]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    return matchMain && matchSub && matchColor && matchKeyword
  })
})

const totalQuantity = computed(() => salesLines.value.reduce((sum, line) => sum + line.quantity, 0))

const totalAmount = computed(() =>
  salesLines.value.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
)

function resetSubCategoryIfNeeded() {
  if (!subCategoryOptions.value.includes(selectedSubCategory.value)) {
    selectedSubCategory.value = '전체'
  }
}

function addToSalesList(sku) {
  feedbackMessage.value = ''

  if (sku.stock === 0) {
    feedbackMessage.value = '품절된 상품은 판매 목록에 추가할 수 없습니다.'
    return
  }

  const existing = salesLines.value.find((line) => line.skuId === sku.skuId)
  if (existing) {
    if (existing.quantity + 1 > sku.stock) {
      feedbackMessage.value = '재고를 초과해 추가할 수 없습니다.'
      return
    }
    existing.quantity += 1
    return
  }

  salesLines.value = [
    ...salesLines.value,
    {
      skuId: sku.skuId,
      productId: sku.productId,
      productName: sku.productName,
      mainCategory: sku.mainCategory,
      subCategory: sku.subCategory,
      color: sku.color,
      size: sku.size,
      unitPrice: sku.unitPrice,
      quantity: 1,
    },
  ]
}

function updateLineQuantity(line, value) {
  const sku = inventory.getSkuById(line.skuId)
  const next = Number.parseInt(value, 10)
  if (!sku) return
  if (Number.isNaN(next) || next < 1) {
    line.quantity = 1
    return
  }
  line.quantity = Math.min(next, sku.stock)
}

function increaseLine(line) {
  const sku = inventory.getSkuById(line.skuId)
  if (!sku || line.quantity >= sku.stock) return
  line.quantity += 1
}

function decreaseLine(line) {
  if (line.quantity <= 1) return
  line.quantity -= 1
}

function removeLine(skuId) {
  salesLines.value = salesLines.value.filter((line) => line.skuId !== skuId)
}

function clearSalesList() {
  salesLines.value = []
}

function confirmSale() {
  feedbackMessage.value = ''
  const result = sales.createSale({
    items: salesLines.value.map((line) => ({ skuId: line.skuId, quantity: line.quantity })),
  })

  if (!result.success) {
    feedbackMessage.value = result.message
    return
  }

  salesLines.value = []
  feedbackMessage.value = `${result.sale.saleId} 판매가 등록되었습니다.`
}

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
    :top-menus="storeMenus"
    :side-menus="salesMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Sales</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">판매 등록</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              카테고리 우선 탐색으로 SKU를 추가하고 판매 목록 전체를 한 번에 판매합니다.
            </p>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>판매 목록 {{ salesLines.length }}건</p>
            <p class="mt-1 text-gray-400">
              총 수량 {{ totalQuantity }}개 · 총 금액 ₩{{ totalAmount.toLocaleString() }}
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.82fr)_minmax(300px,0.9fr)]">
        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">상품 검색</h2>
          </div>

          <div class="grid gap-3 border-b border-gray-200 bg-gray-50/80 px-4 py-4 md:grid-cols-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">대분류</span>
              <select
                v-model="selectedMainCategory"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
                @change="resetSubCategoryIfNeeded"
              >
                <option
                  v-for="category in inventory.mainCategories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">소분류</span>
              <select
                v-model="selectedSubCategory"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              >
                <option v-for="category in subCategoryOptions" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">색상</span>
              <select
                v-model="selectedColor"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              >
                <option v-for="color in inventory.colorOptions" :key="color" :value="color">
                  {{ color }}
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">검색</span>
              <input
                v-model="searchTerm"
                type="search"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
                placeholder="상품명, 색상, 사이즈"
              />
            </label>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-[840px] w-full border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-4 py-3 text-left font-black">상품명</th>
                  <th class="px-4 py-3 text-left font-black">카테고리</th>
                  <th class="px-4 py-3 text-left font-black">옵션</th>
                  <th class="px-4 py-3 text-right font-black">가격</th>
                  <th class="px-4 py-3 text-center font-black">재고</th>
                  <th class="px-4 py-3 text-center font-black">상태</th>
                  <th class="px-4 py-3 text-center font-black">추가</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="sku in filteredSkus"
                  :key="sku.skuId"
                  class="transition-colors hover:bg-gray-50"
                >
                  <td class="px-4 py-3">
                    <p class="font-black text-gray-900">{{ sku.productName }}</p>
                  </td>
                  <td class="px-4 py-3 font-bold text-gray-600">
                    {{ sku.mainCategory }} &gt; {{ sku.subCategory }}
                  </td>
                  <td class="px-4 py-3 font-bold text-gray-700">
                    {{ sku.color }} / {{ sku.size }}
                  </td>
                  <td class="px-4 py-3 text-right font-black text-gray-900">
                    ₩{{ sku.unitPrice.toLocaleString() }}
                  </td>
                  <td class="px-4 py-3 text-center font-black text-gray-700">{{ sku.stock }}</td>
                  <td class="px-4 py-3 text-center">
                    <span
                      class="inline-flex min-w-12 justify-center px-2 py-1 text-[11px] font-black"
                      :class="statusClass[inventory.stockStatus(sku)]"
                    >
                      {{ statusLabel[inventory.stockStatus(sku)] }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      type="button"
                      class="inline-flex min-w-[72px] items-center justify-center border px-3 py-2 text-[11px] font-black shadow-sm transition-all"
                      :class="
                        sku.stock === 0
                          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 shadow-none'
                          : 'border-[#004D3C] bg-[#004D3C] !text-white hover:-translate-y-px hover:bg-[#003d30] hover:shadow-[0_8px_18px_rgba(32,140,28,0.22)]'
                      "
                      :disabled="sku.stock === 0"
                      @click="addToSalesList(sku)"
                    >
                      담기
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredSkus.length === 0">
                  <td colspan="7" class="px-4 py-12 text-center text-gray-400">
                    조건에 맞는 상품이 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h2 class="text-sm font-black text-gray-900">판매 목록</h2>
              <p class="mt-1 text-[11px] font-bold text-gray-400">
                선택한 SKU를 한 판매건으로 저장합니다.
              </p>
            </div>
            <button
              type="button"
              class="text-[11px] font-black text-gray-500 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="salesLines.length === 0"
              @click="clearSalesList"
            >
              전체 비우기
            </button>
          </div>

          <div class="flex max-h-[560px] flex-col overflow-y-auto">
            <div
              v-if="salesLines.length === 0"
              class="flex min-h-[280px] items-center justify-center px-6 text-center text-sm font-bold text-gray-400"
            >
              판매할 상품을 추가하면 이곳에 판매 목록이 쌓입니다.
            </div>

            <div
              v-for="line in salesLines"
              :key="line.skuId"
              class="border-b border-gray-100 px-4 py-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-black text-gray-900">{{ line.productName }}</p>
                  <p class="mt-1 text-[11px] font-bold text-gray-500">
                    {{ line.mainCategory }} &gt; {{ line.subCategory }} · {{ line.color }} /
                    {{ line.size }}
                  </p>
                </div>
                <button
                  type="button"
                  class="text-sm font-black text-gray-300 transition hover:text-red-500"
                  @click="removeLine(line.skuId)"
                >
                  ×
                </button>
              </div>

              <div class="mt-3 flex items-center justify-between gap-3">
                <div class="inline-flex items-center border border-gray-300">
                  <button
                    type="button"
                    class="h-8 w-8 text-sm font-black text-gray-600 hover:bg-gray-50"
                    @click="decreaseLine(line)"
                  >
                    −
                  </button>
                  <input
                    :value="line.quantity"
                    type="number"
                    min="1"
                    :max="inventory.getSkuById(line.skuId)?.stock ?? 1"
                    class="h-8 w-16 border-x border-gray-300 text-center text-xs font-black text-gray-900 outline-none"
                    @input="updateLineQuantity(line, $event.target.value)"
                  />
                  <button
                    type="button"
                    class="h-8 w-8 text-sm font-black text-gray-600 hover:bg-gray-50"
                    @click="increaseLine(line)"
                  >
                    +
                  </button>
                </div>
                <div class="text-right">
                  <p class="text-[11px] font-bold text-gray-400">라인 금액</p>
                  <p class="text-sm font-black text-gray-900">
                    ₩{{ (line.quantity * line.unitPrice).toLocaleString() }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 bg-gray-50 px-4 py-4">
            <div class="flex items-center justify-between text-xs font-bold text-gray-500">
              <span>총 수량</span>
              <span>{{ totalQuantity }}개</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-sm font-black text-gray-900">
              <span>총 금액</span>
              <span>₩{{ totalAmount.toLocaleString() }}</span>
            </div>

            <p
              v-if="feedbackMessage"
              class="mt-3 border px-3 py-2 text-[11px] font-black"
              :class="
                feedbackMessage.includes('등록')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              "
            >
              {{ feedbackMessage }}
            </p>

            <button
              type="button"
              class="mt-4 h-11 w-full text-sm font-black transition-colors"
              :class="
                salesLines.length === 0
                  ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-[#004D3C] text-white hover:bg-[#003d30]'
              "
              :disabled="salesLines.length === 0"
              @click="confirmSale"
            >
              판매 확정
            </button>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

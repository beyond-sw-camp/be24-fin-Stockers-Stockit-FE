<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useStoreOrderStore } from '@/stores/storeOrder.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const storeOrders = useStoreOrderStore()

const storeMenus = roleMenus.store
const orderMenus = roleMenus.store.find((menu) => menu.label === '발주 관리')?.children ?? []
const activeTopMenu = computed(() => '발주 관리')
const activeSideMenu = ref('발주 요청')

const selectedMainCategory = ref('전체')
const selectedSubCategory = ref('전체')
const selectedColor = ref('전체')
const selectedSize = ref('전체')
const searchTerm = ref('')
const requestLines = ref([])
const memo = ref('')
const feedbackMessage = ref('')
const feedbackType = ref('info')

const isEditMode = computed(() => route.name === 'store-order-edit')
const editingOrderId = computed(() => String(route.params.id ?? ''))
const editingOrder = computed(() =>
  isEditMode.value && editingOrderId.value ? storeOrders.getOrderById(editingOrderId.value) : null,
)

const MAIN_CATEGORY_ORDER = ['상의', '바지', '치마', '아우터']

function compareMainCategory(aCategory, bCategory) {
  const rankA = MAIN_CATEGORY_ORDER.indexOf(aCategory)
  const rankB = MAIN_CATEGORY_ORDER.indexOf(bCategory)
  const normalizedRankA = rankA === -1 ? MAIN_CATEGORY_ORDER.length : rankA
  const normalizedRankB = rankB === -1 ? MAIN_CATEGORY_ORDER.length : rankB

  if (normalizedRankA !== normalizedRankB) return normalizedRankA - normalizedRankB
  return String(aCategory ?? '').localeCompare(String(bCategory ?? ''), 'ko')
}

const availableMainCategories = computed(() => [
  '전체',
  ...[...new Set(storeOrders.requestableSkus.map((sku) => sku.mainCategory))].sort(compareMainCategory),
])

const availableSubCategories = computed(() => {
  if (selectedMainCategory.value === '전체') return ['전체']
  return [
    '전체',
    ...new Set(
      storeOrders.requestableSkus
        .filter((sku) => sku.mainCategory === selectedMainCategory.value)
        .map((sku) => sku.subCategory),
    ),
  ]
})

const availableColors = computed(() => [
  '전체',
  ...new Set(storeOrders.requestableSkus.map((sku) => sku.color)),
])

const availableSizes = computed(() => [
  '전체',
  ...new Set(storeOrders.requestableSkus.map((sku) => sku.size)),
])

const filteredSkus = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  return storeOrders.requestableSkus.filter((sku) => {
    const matchMain =
      selectedMainCategory.value === '전체' || sku.mainCategory === selectedMainCategory.value
    const matchSub =
      selectedSubCategory.value === '전체' || sku.subCategory === selectedSubCategory.value
    const matchColor = selectedColor.value === '전체' || sku.color === selectedColor.value
    const matchSize = selectedSize.value === '전체' || sku.size === selectedSize.value
    const matchKeyword =
      !keyword ||
      [sku.productName, sku.mainCategory, sku.subCategory, sku.color, sku.size]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    return matchMain && matchSub && matchColor && matchSize && matchKeyword
  })
})

const totalRequestedQuantity = computed(() =>
  requestLines.value.reduce((sum, line) => sum + line.requestedQuantity, 0),
)

const totalRecommendedQuantity = computed(() =>
  requestLines.value.reduce((sum, line) => sum + line.recommendedQuantity, 0),
)

function syncSubCategory() {
  if (!availableSubCategories.value.includes(selectedSubCategory.value)) {
    selectedSubCategory.value = '전체'
  }
}

function showFeedback(message, type = 'info') {
  feedbackMessage.value = message
  feedbackType.value = type
}

function addToRequest(sku) {
  feedbackMessage.value = ''
  const existing = requestLines.value.find((line) => line.skuId === sku.skuId)
  if (existing) {
    existing.requestedQuantity += 1
    return
  }

  requestLines.value = [
    ...requestLines.value,
    {
      skuId: sku.skuId,
      productId: sku.productId,
      itemCode: sku.itemCode,
      productName: sku.productName,
      mainCategory: sku.mainCategory,
      subCategory: sku.subCategory,
      color: sku.color,
      size: sku.size,
      currentStoreStock: sku.stock,
      inboundExpectedQuantity: sku.inboundExpectedQuantity,
      availableStoreStock: sku.availableStoreStock,
      safetyStock: sku.safetyStock,
      recommendedQuantity: sku.recommendedQuantity,
      requestedQuantity: Math.max(1, sku.recommendedQuantity || 1),
    },
  ]
}

function removeLine(skuId) {
  requestLines.value = requestLines.value.filter((line) => line.skuId !== skuId)
}

function clearRequest() {
  requestLines.value = []
  memo.value = ''
  feedbackMessage.value = ''
}

function updateRequestedQuantity(line, value) {
  const next = Number.parseInt(value, 10)
  if (Number.isNaN(next) || next < 1) {
    line.requestedQuantity = 1
    return
  }
  line.requestedQuantity = next
}

function increaseLine(line) {
  line.requestedQuantity += 1
}

function decreaseLine(line) {
  if (line.requestedQuantity <= 1) return
  line.requestedQuantity -= 1
}

function submitRequest() {
  feedbackMessage.value = ''
  if (requestLines.value.length === 0) {
    showFeedback('발주 요청서를 먼저 채워주세요.', 'error')
    return
  }

  if (isEditMode.value) {
    const currentOrder = editingOrder.value
    if (!currentOrder) {
      showFeedback('수정할 발주건을 찾을 수 없습니다.', 'error')
      return
    }
    if (currentOrder.status !== 'REQUESTED') {
      showFeedback('요청 상태에서만 수정할 수 있습니다.', 'error')
      return
    }

    const result = storeOrders.updateOrder(currentOrder.orderId, {
      items: requestLines.value,
      memo: memo.value,
    })

    if (!result.success) {
      showFeedback(result.message, 'error')
      return
    }

    showFeedback(`${currentOrder.orderId} 발주 요청이 수정되었습니다.`, 'success')
    router.push({ name: 'store-order-history' })
    return
  }

  const result = storeOrders.createOrder({
    items: requestLines.value,
    memo: memo.value,
    storeId: auth.user?.storeId,
    storeName: auth.user?.storeName,
    requestedBy: auth.user?.name,
  })

  if (!result.success) {
    showFeedback(result.message, 'error')
    return
  }

  requestLines.value = []
  memo.value = ''
  showFeedback(`${result.order.orderId} 발주 요청이 등록되었습니다.`, 'success')
  router.push({ name: 'store-order-history' })
}

function loadEditingOrder() {
  const order = editingOrder.value
  if (!isEditMode.value) return
  if (!order) {
    showFeedback('수정할 발주건을 찾을 수 없습니다.', 'error')
    return
  }
  if (order.status !== 'REQUESTED') {
    showFeedback('요청 상태에서만 수정할 수 있습니다.', 'error')
    return
  }
  requestLines.value = order.items.map((item) => ({
    skuId: item.skuId,
    productId: item.productId,
    itemCode: item.itemCode,
    productName: item.productName,
    mainCategory: item.mainCategory,
    subCategory: item.subCategory,
    color: item.color,
    size: item.size,
    currentStoreStock: item.currentStoreStock,
    inboundExpectedQuantity: item.inboundExpectedQuantity ?? 0,
    availableStoreStock: item.availableStoreStock ?? item.currentStoreStock,
    safetyStock: item.safetyStock,
    recommendedQuantity: item.recommendedQuantity,
    requestedQuantity: item.requestedQuantity,
  }))
  memo.value = order.memo
}

loadEditingOrder()

const statusClass = {
  out: 'bg-red-100 text-red-700',
  low: 'bg-orange-100 text-orange-700',
  normal: 'bg-[#EBF5F5] text-black',
}

const statusLabel = {
  out: '품절',
  low: '부족',
  normal: '정상',
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
    :side-menus="orderMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Store Orders
            </p>
            <h1 class="mt-1 text-lg font-black text-gray-900">
              {{ isEditMode ? '발주 요청 수정' : '발주 요청' }}
            </h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              기본은 부족 SKU 우선 정렬입니다. 가용재고는 실재고 + 입고예정 수량 기준이며 일반
              정렬로도 전환할 수 있습니다.
            </p>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>{{ auth.user?.storeName ?? '매장' }} · 요청서 {{ requestLines.length }}건</p>
            <p class="mt-1 text-gray-400">
              총 요청 수량 {{ totalRequestedQuantity }}개 · 권장 수량
              {{ totalRecommendedQuantity }}개
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.86fr)_minmax(280px,0.78fr)]">
        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-black text-gray-900">매장 발주 검색</h2>
          </div>

          <div class="grid gap-2.5 border-b border-gray-200 bg-gray-50/80 px-3 py-3 md:grid-cols-6">
            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">대분류</span>
              <select
                v-model="selectedMainCategory"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
                @change="syncSubCategory"
              >
                <option
                  v-for="category in availableMainCategories"
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
                <option
                  v-for="category in availableSubCategories"
                  :key="category"
                  :value="category"
                >
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
                <option v-for="color in availableColors" :key="color" :value="color">
                  {{ color }}
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">사이즈</span>
              <select
                v-model="selectedSize"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              >
                <option v-for="size in availableSizes" :key="size" :value="size">
                  {{ size }}
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">검색</span>
              <input
                v-model="searchTerm"
                type="search"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
                placeholder="상품명, 옵션"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">정렬</span>
              <select
                v-model="storeOrders.requestSortBy"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              >
                <option value="priority">부족 SKU 우선</option>
                <option value="category">카테고리순</option>
                <option value="name">상품명순</option>
                <option value="stockAsc">재고 부족한순</option>
                <option value="stockDesc">재고 많은순</option>
              </select>
            </label>
          </div>

          <div class="min-w-0">
            <table class="w-full table-fixed border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="w-[12%] px-3 py-2.5 text-left font-black">품목코드</th>
                  <th class="w-[20%] px-1.5 py-2.5 text-left font-black">상품명</th>
                  <th class="w-[12%] px-1 py-2.5 text-left font-black">옵션</th>
                  <th class="w-[12%] px-1 py-2.5 text-left font-black">카테고리</th>
                  <th class="w-[6.5%] px-1 py-2.5 text-center font-black">실재고</th>
                  <th class="w-[6.5%] px-1 py-2.5 text-center font-black">가용재고</th>
                  <th class="w-[6.5%] px-1 py-2.5 text-center font-black">안전재고</th>
                  <th class="w-[8%] px-1 py-2.5 text-center font-black">권장 발주량</th>
                  <th class="w-[8%] px-1 py-2.5 text-center font-black">상태</th>
                  <th class="w-[8%] px-1 py-2.5 text-center font-black">추가</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="sku in filteredSkus"
                  :key="sku.skuId"
                  class="transition-colors hover:bg-gray-50"
                >
                  <td class="px-3 py-2.5 font-mono font-bold text-gray-500">{{ sku.itemCode }}</td>
                  <td class="px-2 py-2.5">
                    <p class="truncate font-black text-gray-900">{{ sku.productName }}</p>
                  </td>
                  <td class="px-1 py-2.5 font-bold text-gray-700">
                    {{ sku.color }} / {{ sku.size }}
                  </td>
                  <td class="px-1 py-2.5 font-bold text-gray-600">
                    <p class="truncate">{{ sku.mainCategory }} &gt; {{ sku.subCategory }}</p>
                  </td>
                  <td class="px-1 py-2.5 text-center font-black text-gray-700">{{ sku.stock }}</td>
                  <td class="px-1 py-2.5 text-center font-black text-gray-900">
                    {{ sku.availableStoreStock }}
                  </td>
                  <td class="px-1 py-2.5 text-center font-black text-gray-700">
                    {{ sku.safetyStock }}
                  </td>
                  <td
                    class="px-1 py-2.5 text-center font-black"
                    :class="sku.recommendedQuantity > 0 ? 'text-orange-600' : 'text-gray-500'"
                  >
                    {{ sku.recommendedQuantity }}
                  </td>
                  <td class="px-1 py-2.5 text-center">
                    <span
                      class="inline-flex min-w-9 justify-center px-1 py-1 text-[10px] font-black"
                      :class="statusClass[sku.stockStatus]"
                    >
                      {{ statusLabel[sku.stockStatus] }}
                    </span>
                  </td>
                  <td class="px-1 py-2.5 text-center">
                    <button
                      type="button"
                      class="inline-flex min-w-[48px] items-center justify-center border border-[#004D3C] bg-[#004D3C] px-1 py-1.5 text-[10px] font-black !text-white shadow-sm transition-all hover:-translate-y-px hover:bg-[#003d30]"
                      @click="addToRequest(sku)"
                    >
                      + 담기
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredSkus.length === 0">
                  <td colspan="10" class="px-4 py-12 text-center text-gray-400">
                    조건에 맞는 SKU가 없습니다.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div>
              <h2 class="text-sm font-black text-gray-900">발주 요청서</h2>
              <p class="mt-1 text-[11px] font-bold text-gray-400">
                요청 상태에서만 수정/취소가 가능합니다.
              </p>
            </div>
            <button
              type="button"
              class="text-[11px] font-black text-gray-500 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="requestLines.length === 0"
              @click="clearRequest"
            >
              전체 비우기
            </button>
          </div>

          <div class="flex max-h-[540px] flex-col overflow-y-auto">
            <div
              v-if="requestLines.length === 0"
              class="flex min-h-[260px] items-center justify-center px-6 text-center text-sm font-bold text-gray-400"
            >
              좌측 SKU 목록에서 발주 요청 대상을 담아주세요.
            </div>

            <div
              v-for="line in requestLines"
              :key="line.skuId"
              class="border-b border-gray-100 px-4 py-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-mono text-[10px] font-bold text-gray-400">
                    {{ line.itemCode }}
                  </p>
                  <p class="mt-1 truncate text-sm font-black text-gray-900">{{ line.productName }}</p>
                  <p class="mt-1 text-[11px] font-bold text-gray-500">
                    {{ line.mainCategory }} &gt; {{ line.subCategory }} · {{ line.color }} /
                    {{ line.size }}
                  </p>
                  <p class="mt-1 text-[11px] font-bold text-gray-400">
                    실재고 {{ line.currentStoreStock }} · 가용재고 {{ line.availableStoreStock }} ·
                    안전재고 {{ line.safetyStock }} · 권장 {{ line.recommendedQuantity }}
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
                    :value="line.requestedQuantity"
                    type="number"
                    min="1"
                    class="h-8 w-16 border-x border-gray-300 text-center text-xs font-black text-gray-900 outline-none"
                    @input="updateRequestedQuantity(line, $event.target.value)"
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
                  <p class="text-[11px] font-bold text-gray-400">요청 수량</p>
                  <p class="text-sm font-black text-gray-900">{{ line.requestedQuantity }}개</p>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 bg-gray-50 px-4 py-4">
            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">요청 메모</span>
              <textarea
                v-model="memo"
                rows="3"
                class="resize-none border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
                placeholder="예: 주말 행사 대비 / 특정 사이즈 부족 보충"
              />
            </label>

            <div
              class="mt-6 flex items-center justify-between gap-6 pt-2 text-xs font-bold text-gray-500"
            >
              <span>총 SKU</span>
              <span>{{ requestLines.length }}건</span>
            </div>
            <div
              class="mt-6 flex items-center justify-between gap-6 pt-4 pb-2 text-sm font-black text-gray-900"
            >
              <span>총 요청 수량</span>
              <span>{{ totalRequestedQuantity }}개</span>
            </div>

            <p
              v-if="feedbackMessage"
              class="mt-3 border px-3 py-2 text-[11px] font-black"
              :class="
                feedbackType === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              "
            >
              {{ feedbackMessage }}
            </p>

            <div class="mt-4 border-t border-gray-200 pt-4">
              <div class="grid gap-2" :class="isEditMode ? 'grid-cols-2' : 'grid-cols-1'">
              <button
                v-if="isEditMode"
                type="button"
                class="h-11 border border-gray-300 bg-white text-sm font-black text-gray-700 transition-colors hover:bg-gray-100"
                @click="router.push({ name: 'store-order-history' })"
              >
                수정 취소
              </button>
              <button
                type="button"
                class="h-11 text-sm font-black transition-colors"
                :class="
                  requestLines.length === 0
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                    : 'bg-[#004D3C] text-white hover:bg-[#003d30]'
                "
                :disabled="requestLines.length === 0"
                @click="submitRequest"
              >
                {{ isEditMode ? '발주 요청 수정 저장' : '발주 요청 등록' }}
              </button>
              </div>

              <p
                class="mt-5 border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-700"
              >
                운영 정책: 요청된 발주는 익일 12시 배치 승인 대상으로 안내합니다. 가용재고는 실재고
                + 입고예정 수량 기준입니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import PaginationNav from '@/components/common/PaginationNav.vue'
import SkuFacetChips from '@/components/store/SkuFacetChips.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { STORE_CATEGORY_MAP, STORE_MAIN_CATEGORY_ORDER } from '@/constants/storeCategoryMap.js'
import { useAuthStore } from '@/stores/auth.js'
import { createStoreOrder, getStoreOrderDetail, updateStoreOrder } from '@/api/store/orders.js'
import { getStoreInventorySkuFacets, getStoreInventorySkus } from '@/api/store/inventory.js'

/**
 * ==============================================================================
 * 2. STATE & REFS
 * ==============================================================================
 */
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const selectedMainCategory = ref('전체')
const selectedSubCategory = ref('전체')
const selectedStatus = ref('')
const selectedColor = ref('')
const selectedSize = ref('')
const searchTerm = ref('')
const requestLines = ref([])
const memo = ref('')
const feedbackMessage = ref('')
const feedbackType = ref('info')
const requestSortBy = ref('priority')
const skuRows = ref([])
const facetColors = ref([])
const facetSizes = ref([])
const currentPage = ref(0)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)
const hasNext = ref(false)
const hasPrevious = ref(false)
const editingOrder = ref(null)
const activeSideMenu = ref('발주 요청')

/**
 * ==============================================================================
 * 3. COMPUTED
 * ==============================================================================
 */
const storeMenus = roleMenus.store
const orderMenus = roleMenus.store.find((menu) => menu.label === '발주 관리')?.children ?? []
const activeTopMenu = computed(() => '발주 관리')
const isEditMode = computed(() => route.name === 'store-order-edit')
const editingOrderNo = computed(() => String(route.params.orderNo ?? ''))

const availableMainCategories = computed(() => [
  '전체',
  ...Object.keys(STORE_CATEGORY_MAP),
])

const availableSubCategories = computed(() => {
  if (selectedMainCategory.value === '전체') return ['전체']
  return [
    '전체',
    ...(STORE_CATEGORY_MAP[selectedMainCategory.value] ?? []),
  ]
})

const filteredSkus = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  const list = skuRows.value.filter((sku) => {
    const matchMain = selectedMainCategory.value === '전체' || sku.parentCategory === selectedMainCategory.value
    const matchSub = selectedSubCategory.value === '전체' || sku.childCategory === selectedSubCategory.value
    const matchColor = !selectedColor.value || sku.color === selectedColor.value
    const matchSize = !selectedSize.value || sku.size === selectedSize.value
    const matchKeyword =
      !keyword ||
      [sku.itemName, sku.parentCategory, sku.childCategory, sku.color, sku.size]
        .join(' ')
        .toLowerCase()
        .includes(keyword)

    return matchMain && matchSub && matchColor && matchSize && matchKeyword
  })

  const sorted = [...list]
  if (requestSortBy.value === 'category') {
    sorted.sort(
      (a, b) =>
        compareMainCategory(a.parentCategory, b.parentCategory) ||
        String(a.childCategory ?? '').localeCompare(String(b.childCategory ?? ''), 'ko') ||
        String(a.itemName ?? '').localeCompare(String(b.itemName ?? ''), 'ko'),
    )
  } else if (requestSortBy.value === 'name') {
    sorted.sort((a, b) => String(a.itemName ?? '').localeCompare(String(b.itemName ?? ''), 'ko'))
  } else if (requestSortBy.value === 'stockAsc') {
    sorted.sort((a, b) => Number(a.actualStock ?? 0) - Number(b.actualStock ?? 0))
  } else if (requestSortBy.value === 'stockDesc') {
    sorted.sort((a, b) => Number(b.actualStock ?? 0) - Number(a.actualStock ?? 0))
  } else {
    sorted.sort((a, b) => {
      const aPriority = Number(a.recommendedQuantity ?? 0) > 0 || a.stockStatus !== 'normal' ? 0 : 1
      const bPriority = Number(b.recommendedQuantity ?? 0) > 0 || b.stockStatus !== 'normal' ? 0 : 1
      if (aPriority !== bPriority) return aPriority - bPriority
      return Number(b.recommendedQuantity ?? 0) - Number(a.recommendedQuantity ?? 0)
    })
  }

  return sorted
})

const totalRequestedQuantity = computed(() => requestLines.value.reduce((sum, line) => sum + line.requestedQuantity, 0))
const totalRecommendedQuantity = computed(() => requestLines.value.reduce((sum, line) => sum + line.recommendedQuantity, 0))

/**
 * ==============================================================================
 * 4. CONSTANTS
 * ==============================================================================
 */
const MAIN_CATEGORY_ORDER = STORE_MAIN_CATEGORY_ORDER

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

/**
 * ==============================================================================
 * 5. METHODS - UI STATE
 * ==============================================================================
 */
// [함수] 대분류 정렬 우선순위와 이름순 비교를 수행한다.
function compareMainCategory(aCategory, bCategory) {
  const rankA = MAIN_CATEGORY_ORDER.indexOf(aCategory)
  const rankB = MAIN_CATEGORY_ORDER.indexOf(bCategory)
  const normalizedRankA = rankA === -1 ? MAIN_CATEGORY_ORDER.length : rankA
  const normalizedRankB = rankB === -1 ? MAIN_CATEGORY_ORDER.length : rankB

  if (normalizedRankA !== normalizedRankB) return normalizedRankA - normalizedRankB
  return String(aCategory ?? '').localeCompare(String(bCategory ?? ''), 'ko')
}

// [함수] 대분류 변경 시 소분류 선택값을 유효한 값으로 맞춘다.
function syncSubCategory() {
  if (!availableSubCategories.value.includes(selectedSubCategory.value)) {
    selectedSubCategory.value = '전체'
  }
}

// [함수] 화면 피드백 메시지와 타입을 갱신한다.
function showFeedback(message, type = 'info') {
  feedbackMessage.value = message
  feedbackType.value = type
}

// [함수] SKU를 발주 요청 라인에 추가한다.
function addToRequest(sku) {
  feedbackMessage.value = ''
  const existing = requestLines.value.find((line) => line.skuCode === sku.skuCode)
  if (existing) {
    existing.requestedQuantity += 1
    return
  }

  requestLines.value = [
    ...requestLines.value,
    {
      skuCode: sku.skuCode,
      itemCode: sku.itemCode,
      itemName: sku.itemName,
      parentCategory: sku.parentCategory,
      childCategory: sku.childCategory,
      color: sku.color,
      size: sku.size,
      actualStock: sku.actualStock,
      inboundExpectedQuantity: sku.inboundExpectedQuantity,
      availableStock: sku.availableStock,
      safetyStock: sku.safetyStock,
      recommendedQuantity: sku.recommendedQuantity,
      requestedQuantity: Math.max(1, sku.recommendedQuantity || 1),
    },
  ]
}

// [함수] 발주 요청 라인에서 특정 SKU를 제거한다.
function removeLine(skuCode) {
  requestLines.value = requestLines.value.filter((line) => line.skuCode !== skuCode)
}

// [함수] 요청 라인과 메모/피드백 상태를 초기화한다.
function clearRequest() {
  requestLines.value = []
  memo.value = ''
  feedbackMessage.value = ''
}

// [함수] 요청 수량 입력값을 검증해 최소 1 이상으로 보정한다.
function updateRequestedQuantity(line, value) {
  const next = Number.parseInt(value, 10)
  if (Number.isNaN(next) || next < 1) {
    line.requestedQuantity = 1
    return
  }
  line.requestedQuantity = next
}

// [함수] 발주 요청 라인의 수량을 1 증가시킨다.
function increaseLine(line) {
  line.requestedQuantity += 1
}

// [함수] 발주 요청 라인의 수량을 1 감소시킨다.
function decreaseLine(line) {
  if (line.requestedQuantity <= 1) return
  line.requestedQuantity -= 1
}

async function loadSkuFacets() {
  try {
    const params = {}
    const category = selectedSubCategory.value !== '전체'
      ? selectedSubCategory.value
      : (selectedMainCategory.value !== '전체' ? selectedMainCategory.value : '')
    if (category) params.category = category
    if (selectedStatus.value) params.status = selectedStatus.value
    if (searchTerm.value.trim()) params.keyword = searchTerm.value.trim()
    const res = await getStoreInventorySkuFacets(params)
    facetColors.value = Array.isArray(res?.colors) ? res.colors : []
    facetSizes.value = Array.isArray(res?.sizes) ? res.sizes : []
  } catch {
    facetColors.value = []
    facetSizes.value = []
  }
}

/**
 * ==============================================================================
 * 6. METHODS - API SERVICE
 * ==============================================================================
 */
// [함수] 발주 생성 또는 수정 API를 호출하고 완료 후 목록 화면으로 이동한다.
async function submitRequest() {
  feedbackMessage.value = ''

  if (!auth.user?.locationCode) {
    showFeedback('로그인 매장 정보가 없어 발주를 진행할 수 없습니다.', 'error')
    return
  }

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

    try {
      await updateStoreOrder(currentOrder.orderId, {
        items: requestLines.value.map((line) => ({
          skuCode: line.skuCode,
          requestedQuantity: Number(line.requestedQuantity),
        })),
        memo: memo.value,
      })
      showFeedback(`${currentOrder.orderId} 발주 요청이 수정되었습니다.`, 'success')
      router.push({ name: 'store-order-history' })
      return
    } catch (error) {
      showFeedback(error?.message ?? '발주 수정 중 오류가 발생했습니다.', 'error')
      return
    }
  }

  try {
    const result = await createStoreOrder({
      requestedByMemberId: auth.user.employeeCode ?? '',
      requestedByName: auth.user.name ?? '매장 관리자',
      memo: memo.value,
      items: requestLines.value.map((line) => ({
        skuCode: line.skuCode,
        requestedQuantity: Number(line.requestedQuantity),
      })),
    })

    requestLines.value = []
    memo.value = ''
    showFeedback(`${result.orderId} 발주 요청이 등록되었습니다.`, 'success')
    router.push({ name: 'store-order-history' })
  } catch (error) {
    showFeedback(error?.message ?? '발주 등록 중 오류가 발생했습니다.', 'error')
  }
}

// [함수] 수정 모드인 경우 발주 상세를 조회해 요청 라인 초기값을 구성한다.
async function loadEditingOrder() {
  if (!isEditMode.value) return

  try {
    const res = await getStoreOrderDetail(editingOrderNo.value)
    const order = res?.order
    if (!order) throw new Error('수정할 발주건을 찾을 수 없습니다.')
    if (order.status !== 'REQUESTED') throw new Error('요청 상태에서만 수정할 수 있습니다.')

    editingOrder.value = order
    requestLines.value = (order.items ?? []).map((item) => ({
      skuCode: item.skuCode,
      itemCode: item.productCode,
      itemName: item.productName ?? item.itemName,
      parentCategory: item.mainCategory ?? item.parentCategory,
      childCategory: item.subCategory ?? item.childCategory,
      color: item.color,
      size: item.size,
      actualStock: 0,
      inboundExpectedQuantity: 0,
      availableStock: 0,
      safetyStock: 0,
      recommendedQuantity: 0,
      requestedQuantity: item.requestedQuantity,
    }))
    memo.value = order.memo ?? ''
  } catch (error) {
    showFeedback(error?.message ?? '발주 상세를 불러오지 못했습니다.', 'error')
  }
}

// [함수] 로그인 매장 기준으로 발주 가능 SKU 목록을 조회해 화면 상태를 갱신한다.
async function loadSkuRows() {
  if (!auth.user?.locationCode) {
    showFeedback('매장 위치 정보가 없어 SKU 목록을 불러올 수 없습니다.', 'error')
    skuRows.value = []
    return
  }

  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
    }
    const category = selectedSubCategory.value !== '전체'
      ? selectedSubCategory.value
      : (selectedMainCategory.value !== '전체' ? selectedMainCategory.value : '')
    if (category) params.category = category
    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedColor.value) params.color = selectedColor.value
    if (selectedSize.value) params.skuSize = selectedSize.value
    if (searchTerm.value.trim()) params.keyword = searchTerm.value.trim()

    const res = await getStoreInventorySkus(params)
    const pageItems = Array.isArray(res?.items) ? res.items : []
    const rows = []
    pageItems.forEach((sku) => {
      const stock = Number(sku.actualStock ?? 0)
      const safetyStock = Number(sku.safetyStock ?? 0)

      rows.push({
        skuCode: sku.skuCode,
        itemCode: sku.itemCode,
        itemName: sku.itemName,
        parentCategory: sku.parentCategory,
        childCategory: sku.childCategory,
        color: sku.color,
        size: sku.size,
        unitPrice: Number(sku.unitPrice ?? 0),
        actualStock: stock,
        safetyStock,
        inboundExpectedQuantity: Number(sku.inboundExpectedQuantity ?? 0),
        availableStock: Number(sku.availableStock ?? 0),
        recommendedQuantity: Math.max(0, safetyStock - stock),
        stockStatus: stock === 0 ? 'out' : stock <= safetyStock ? 'low' : 'normal',
      })
    })

    skuRows.value = rows
    totalElements.value = Number(res?.totalElements ?? 0)
    totalPages.value = Number(res?.totalPages ?? 0)
    hasNext.value = Boolean(res?.hasNext)
    hasPrevious.value = Boolean(res?.hasPrevious)
  } catch (error) {
    showFeedback(error?.message ?? 'SKU 목록을 불러오지 못했습니다.', 'error')
    skuRows.value = []
    totalElements.value = 0
    totalPages.value = 0
    hasNext.value = false
    hasPrevious.value = false
  }
}

/**
 * ==============================================================================
 * 7. METHODS - NAVIGATION
 * ==============================================================================
 */
// [함수] 로그아웃 처리 후 로그인 화면으로 이동한다.

/**
 * ==============================================================================
 * 8. WATCHERS
 * ==============================================================================
 */
watch(
  [selectedMainCategory, selectedSubCategory, selectedStatus, selectedColor, selectedSize, searchTerm],
  async ([mainCategory, subCategory], [prevMainCategory]) => {
    if (mainCategory !== prevMainCategory && !availableSubCategories.value.includes(subCategory)) {
      selectedSubCategory.value = '전체'
      return
    }
    currentPage.value = 0
    await loadSkuRows()
    await loadSkuFacets()
  },
)
watch([currentPage, pageSize], async () => {
  await loadSkuRows()
})

/**
 * ==============================================================================
 * 9. LIFECYCLE
 * ==============================================================================
 */
onMounted(async () => {
  await loadEditingOrder()
  await loadSkuRows()
  await loadSkuFacets()
})
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
            <p>{{ auth.user?.locationName ?? '매장' }} · 요청서 {{ requestLines.length }}건</p>
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

          <div class="grid gap-2.5 border-b border-gray-200 bg-gray-50/80 px-3 py-3 md:grid-cols-[135px_135px_135px_135px_minmax(220px,1fr)]">
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
              <span class="text-[11px] font-bold text-gray-500">상태</span>
              <select
                v-model="selectedStatus"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              >
                <option value="">전체</option>
                <option value="정상">정상</option>
                <option value="부족">부족</option>
                <option value="품절">품절</option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">정렬</span>
              <select
                v-model="requestSortBy"
                class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              >
                <option value="priority">부족 SKU 우선</option>
                <option value="category">카테고리순</option>
                <option value="name">상품명순</option>
                <option value="stockAsc">재고 부족한순</option>
                <option value="stockDesc">재고 많은순</option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-bold text-gray-500">검색</span>
              <input
                v-model="searchTerm"
                type="search"
                class="h-9 w-full min-w-0 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
                placeholder="상품명, 옵션"
              />
            </label>
          </div>
          <SkuFacetChips
            v-model:selectedColor="selectedColor"
            v-model:selectedSize="selectedSize"
            :colors="facetColors"
            :sizes="facetSizes"
            wrapper-class="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50/60 px-3 py-2.5"
          />

          <div class="min-w-0">
            <table class="w-full table-fixed border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="w-[12%] px-3 py-2.5 text-left font-black">품목코드</th>
                  <th class="w-[16%] px-1.5 py-2.5 text-left font-black">상품명</th>
                  <th class="w-[12%] px-1 py-2.5 text-left font-black">옵션</th>
                  <th class="w-[11%] px-1 py-2.5 text-left font-black">카테고리</th>
                  <th class="w-[6%] px-1 py-2.5 text-center font-black">실재고</th>
                  <th class="w-[6%] px-1 py-2.5 text-center font-black">가용재고</th>
                  <th class="w-[6%] px-1 py-2.5 text-center font-black">안전재고</th>
                  <th class="w-[7%] px-1 py-2.5 text-center font-black">권장 발주량</th>
                  <th class="w-[6%] px-1 py-2.5 text-center font-black">상태</th>
                  <th class="w-[10%] px-2 py-2.5 text-center font-black">추가</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="sku in filteredSkus"
                  :key="sku.skuCode"
                  class="transition-colors hover:bg-gray-50"
                >
                  <td class="px-3 py-2.5 font-mono font-bold text-gray-500">{{ sku.itemCode }}</td>
                  <td class="px-2 py-2.5">
                    <p class="truncate font-black text-gray-900">{{ sku.itemName }}</p>
                  </td>
                  <td class="px-1 py-2.5 font-bold text-gray-700">
                    {{ sku.color }} / {{ sku.size }}
                  </td>
                  <td class="px-1 py-2.5 font-bold text-gray-600">
                    <p class="truncate">{{ sku.parentCategory }} &gt; {{ sku.childCategory }}</p>
                  </td>
                  <td class="px-1 py-2.5 text-center font-black text-gray-700">{{ sku.actualStock }}</td>
                  <td class="px-1 py-2.5 text-center font-black text-gray-900">
                    {{ sku.availableStock }}
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
                  <td class="px-2 py-2.5 text-center">
                    <button
                      type="button"
                      class="group inline-flex h-8 min-w-[70px] items-center justify-center gap-1.5 rounded-full border border-[#97BFB4]/30 bg-[#97BFB4]/10 px-3 text-[11px] font-bold text-[#5A7F75] transition-all duration-200 cursor-pointer hover:scale-105 hover:border-[#97BFB4]/50 hover:bg-[#97BFB4]/20 hover:text-[#4A6860] active:scale-95"
                      @click="addToRequest(sku)"
                    >
                      <span class="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-[#97BFB4] shadow-sm transition-colors group-hover:bg-[#004D3C] group-hover:text-white">+</span>
                      <span>담기</span>
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
          <PaginationNav
            :page="currentPage"
            :size="pageSize"
            :total-pages="totalPages"
            :total-elements="totalElements"
            :has-previous="hasPrevious"
            :has-next="hasNext"
            @update:page="currentPage = $event"
            @update:size="pageSize = $event"
          />
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
              :key="line.skuCode"
              class="border-b border-gray-100 px-4 py-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-mono text-[10px] font-bold text-gray-400">
                    {{ line.itemCode }}
                  </p>
                  <p class="mt-1 truncate text-sm font-black text-gray-900">{{ line.itemName }}</p>
                  <p class="mt-1 text-[11px] font-bold text-gray-500">
                    {{ line.parentCategory }} &gt; {{ line.childCategory }} · {{ line.color }} /
                    {{ line.size }}
                  </p>
                  <p class="mt-1 text-[11px] font-bold text-gray-400">
                    실재고 {{ line.actualStock }} · 가용재고 {{ line.availableStock }} ·
                    안전재고 {{ line.safetyStock }} · 권장 {{ line.recommendedQuantity }}
                  </p>
                </div>
                <button
                  type="button"
                  class="text-sm font-black text-gray-300 transition hover:text-red-500"
                  @click="removeLine(line.skuCode)"
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
                class="h-11 text-sm font-black transition-all duration-200"
                :class="
                  requestLines.length === 0
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                    : 'cursor-pointer bg-[#004D3C] text-white hover:bg-[#003d30] hover:shadow-lg active:scale-[0.98]'
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

<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSalesStore } from '@/stores/store/storeSales.js'
import { getCompanyWideInventories, getCompanyWideInventorySkus } from '@/api/hq/inventory.js'
import { createSale } from '@/api/store/sales.js'

import { Plus, Ban } from 'lucide-vue-next'

/**
 * ==============================================================================
 * 2. STATE & REFS
 * ==============================================================================
 */

const router = useRouter()
const auth = useAuthStore()
const sales = useSalesStore()

const storeMenus = roleMenus.store
const salesMenus = roleMenus.store.find((menu) => menu.label === '판매 관리')?.children ?? []
const activeMainMenu = computed(() => '판매 관리')
const activeSubMenu = ref('POS / 판매 등록')

const selectedMainCategory = ref('전체')
const selectedSubCategory = ref('전체')
const selectedColor = ref('전체')
const searchTerm = ref('')
const salesLines = ref([])
const saleRequest = reactive({
  storeCode: '',
  items: [],
})
const feedbackMessage = ref('')
const isSuccessModalOpen = ref(false)
const completedSale = ref(null)
const loadingSkus = ref(false)
const submitState = ref('idle')
const skuRows = ref([])

/**
 * ==============================================================================
 * 3. COMPUTED
 * ==============================================================================
 */
const mainCategories = computed(() => [
  '전체',
  ...new Set(skuRows.value.map((sku) => sku.mainCategory)),
])

const subCategoryOptions = computed(() => {
  if (!selectedMainCategory.value || selectedMainCategory.value === '전체') return ['전체']
  return [
    '전체',
    ...new Set(
      skuRows.value
        .filter((sku) => sku.mainCategory === selectedMainCategory.value)
        .map((sku) => sku.subCategory),
    ),
  ]
})

const colorOptions = computed(() => [
  '전체',
  ...new Set(skuRows.value.map((sku) => sku.color)),
])

const filteredSkus = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  return skuRows.value.filter((sku) => {
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

/**
 * ==============================================================================
 * 4. CONSTANTS
 * ==============================================================================
 */
const statusLabel = { out: '품절', low: '부족', normal: '정상' }
const statusClass = {
  out: 'bg-red-100 text-red-700',
  low: 'bg-orange-100 text-orange-700',
  normal: 'bg-[#EBF5F5] text-black',
}

/**
 * ==============================================================================
 * 5. METHODS - UI STATE
 * ==============================================================================
 */
// [함수] 대분류 변경 시 소분류 선택값 유효성을 보정한다.
function resetSubCategoryIfNeeded() {
  if (!subCategoryOptions.value.includes(selectedSubCategory.value)) {
    selectedSubCategory.value = '전체'
  }
}

// [함수] 선택한 SKU를 판매 목록에 추가한다.
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

// [함수] SKU 코드로 화면의 SKU 행 데이터를 찾는다.
function getSkuById(skuId) {
  return skuRows.value.find((sku) => sku.skuId === skuId) ?? null
}

// [함수] 판매 라인의 수량 입력값을 검증 후 반영한다.
function updateLineQuantity(line, value) {
  const sku = getSkuById(line.skuId)
  const next = Number.parseInt(value, 10)
  if (!sku) return
  if (Number.isNaN(next) || next < 1) {
    line.quantity = 1
    return
  }
  line.quantity = Math.min(next, sku.stock)
}

// [함수] 판매 라인의 수량을 1 증가시킨다.
function increaseLine(line) {
  const sku = getSkuById(line.skuId)
  if (!sku || line.quantity >= sku.stock) return
  line.quantity += 1
}

// [함수] 판매 라인의 수량을 1 감소시킨다.
function decreaseLine(line) {
  if (line.quantity <= 1) return
  line.quantity -= 1
}

// [함수] 판매 목록에서 특정 SKU 라인을 제거한다.
function removeLine(skuId) {
  salesLines.value = salesLines.value.filter((line) => line.skuId !== skuId)
}

// [함수] 현재 판매 목록을 전체 비운다.
function clearSalesList() {
  salesLines.value = []
}

/**
 * ==============================================================================
 * 6. METHODS - API SERVICE
 * ==============================================================================
 */
// [함수] 판매 등록 API를 호출하고 성공/실패 상태를 처리한다.
async function confirmSale() {
  feedbackMessage.value = ''
  saleRequest.storeCode = auth.user?.storeCode ?? ''
  saleRequest.items = salesLines.value.map((line) => ({ skuCode: line.skuId, quantity: line.quantity }))
  if (!saleRequest.storeCode) {
    feedbackMessage.value = '매장 코드가 없어 판매를 진행할 수 없습니다.'
    return
  }
  if (saleRequest.items.length === 0) {
    feedbackMessage.value = '판매 목록이 비어 있습니다.'
    return
  }

  try {
    submitState.value = 'submitting'
    sales.setLoading(true)
    sales.setError('')
    const created = await createSale(saleRequest)
    const sale = {
      saleNo: created.saleNo,
      saleId: created.saleNo,
      storeCode: created.storeCode,
      soldAt: created.soldAt,
      totalQuantity: created.totalQuantity,
      totalAmount: created.totalAmount,
      headline: (created.items?.[0]?.productName ?? '') + ((created.items?.length ?? 0) > 1 ? ` 외 ${created.items.length - 1}건` : ''),
      items: (created.items ?? []).map((item) => ({
        skuCode: item.skuCode,
        skuId: item.skuCode,
        productCode: item.productCode,
        productId: item.productCode,
        productName: item.productName,
        mainCategory: item.mainCategory,
        subCategory: item.subCategory,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineAmount: item.lineAmount,
      })),
    }
    sales.prependSale({
      saleNo: sale.saleNo,
      saleId: sale.saleId,
      storeCode: sale.storeCode,
      soldAt: sale.soldAt,
      totalQuantity: sale.totalQuantity,
      totalAmount: sale.totalAmount,
      headline: sale.headline,
      items: [],
    })
    sales.setSelectedSale(sale)
    completedSale.value = sale
    salesLines.value = []
    saleRequest.items = []
    isSuccessModalOpen.value = true
    submitState.value = 'success'
    feedbackMessage.value = `${sale.saleNo} 판매가 등록되었습니다.`
    await loadStoreSkus()
  } catch (e) {
    const message = e?.message ?? '판매 등록에 실패했습니다.'
    sales.setError(message)
    submitState.value = 'error'
    feedbackMessage.value = message
  } finally {
    sales.setLoading(false)
    if (submitState.value === 'submitting') submitState.value = 'idle'
  }
}

// [함수] 판매 완료 모달 상태를 초기화하고 닫는다.
function closeSuccessModal() {
  isSuccessModalOpen.value = false
  completedSale.value = null
}

// [함수] 현재 재고/안전재고 기준으로 재고 상태(out/low/normal)를 계산한다.
function stockStatus(sku) {
  if (sku.stock === 0) return 'out'
  if (sku.stock <= sku.safetyStock) return 'low'
  return 'normal'
}

// [함수] 로그인 매장의 상품/SKU 재고 데이터를 조회해 POS 테이블 모델로 매핑한다.
async function loadStoreSkus() {
  const locationId = auth.user?.storeLocationId
  if (!locationId) {
    feedbackMessage.value = '매장 위치 정보가 없어 상품/재고를 불러올 수 없습니다.'
    return
  }

  loadingSkus.value = true
  feedbackMessage.value = ''
  try {
    const params = { locationType: 'STORE', locationIds: [locationId] }
    const page = await getCompanyWideInventories(params)
    const items = page?.items ?? []

    const skuLists = await Promise.all(
      items.map((item) => getCompanyWideInventorySkus(item.itemCode, params)),
    )

    const rows = []
    items.forEach((item, idx) => {
      const skus = skuLists[idx] ?? []
      skus.forEach((sku) => {
        rows.push({
          skuId: sku.skuCode,
          productId: item.itemCode,
          productName: item.itemName,
          mainCategory: item.parentCategory,
          subCategory: item.childCategory,
          color: sku.color,
          size: sku.size,
          unitPrice: 0,
          stock: sku.actualStock ?? 0,
          safetyStock: sku.safetyStock ?? 0,
          status: sku.status,
        })
      })
    })
    skuRows.value = rows
  } catch (e) {
    feedbackMessage.value = e?.message ?? '상품/재고 조회에 실패했습니다.'
  } finally {
    loadingSkus.value = false
  }
}

/**
 * ==============================================================================
 * 7. METHODS - NAVIGATION
 * ==============================================================================
 */
// [함수] 로그아웃 후 로그인 화면으로 이동한다.
function handleLogout() {
  auth.logout()
  router.push('/login')
}

/**
 * ==============================================================================
 * 8. LIFECYCLE
 * ==============================================================================
 */
onMounted(async () => {
  await loadStoreSkus()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeMainMenu"
    :top-menus="storeMenus"
    :side-menus="salesMenus"
    v-model:active-side-menu="activeSubMenu"
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
                <option v-for="category in mainCategories" :key="category" :value="category">
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
                <option v-for="color in colorOptions" :key="color" :value="color">
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
                  <th class="px-4 py-3 text-left font-black">SKU 코드</th>
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
                  <td class="px-4 py-3 font-mono font-bold text-gray-500">
                    {{ sku.skuId }}
                  </td>
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
                      :class="statusClass[stockStatus(sku)]"
                    >
                      {{ statusLabel[stockStatus(sku)] }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <button
                      type="button"
                      class="group inline-flex h-8 min-w-[74px] items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-100"
                      :class="
                        sku.stock === 0
                          ? 'border-red-100 bg-red-50/50 text-red-400 shadow-none'
                          : 'border-[#97BFB4]/30 bg-[#97BFB4]/10 text-[#6B8E85] hover:border-[#97BFB4]/50 hover:bg-[#97BFB4]/20 hover:text-[#5A7F75] active:scale-95'
                      "
                      :disabled="sku.stock === 0"
                      @click="addToSalesList(sku)"
                    >
                      <span
                        class="flex h-4 w-4 items-center justify-center rounded-full shadow-sm transition-colors"
                        :class="
                          sku.stock === 0
                            ? 'bg-white/50 text-red-300'
                            : 'bg-white text-[#97BFB4] group-hover:bg-[#004D3C] group-hover:text-white'
                        "
                      >
                        <Plus v-if="sku.stock > 0" :size="10" stroke-width="3" />
                        <Ban v-else :size="10" stroke-width="3" />
                      </span>
                      <span>{{ sku.stock === 0 ? '품절' : '담기' }}</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredSkus.length === 0">
                  <td colspan="8" class="px-4 py-12 text-center text-gray-400">
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
                    :max="getSkuById(line.skuId)?.stock ?? 1"
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

    <!-- Success Modal -->
    <div
      v-if="isSuccessModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div class="w-full max-w-sm border border-gray-300 bg-white shadow-2xl">
        <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h3 class="text-sm font-black text-gray-900">판매 등록 완료</h3>
        </div>
        <div class="p-6 text-center">
          <div
            class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p class="text-sm font-bold text-gray-500">정상적으로 판매가 등록되었습니다.</p>
          <div class="mt-4 border-y border-gray-100 py-3">
            <p class="text-[10px] font-black uppercase tracking-widest text-gray-400">판매번호</p>
            <p class="mt-1 font-mono text-lg font-black text-gray-900">
              {{ completedSale?.saleId }}
            </p>
          </div>
          <div class="mt-3 flex items-center justify-between text-xs font-bold text-gray-600">
            <span>결제 금액</span>
            <span class="text-sm font-black text-[#004D3C]"
              >₩{{ completedSale?.totalAmount.toLocaleString() }}</span
            >
          </div>
        </div>
        <div class="p-4">
          <button
            type="button"
            class="h-11 w-full bg-[#004D3C] text-sm font-black text-white transition-colors hover:bg-[#003d30]"
            @click="closeSuccessModal"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

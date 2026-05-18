<script setup>
import { computed, ref, toRef, watch } from 'vue'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'
import { usePurchaseOrderStockSim } from '@/composables/hq/purchaseOrder/useStockSim.js'
import { SearchIcon } from '@/components/hq/purchase-order/icons.js'
import PaginationNav from '@/components/common/PaginationNav.vue'

// 새 발주 카탈로그 — ERP 평탄 테이블 (Page<SkuRowRes> 평탄 row 위에 master 헤더 inline grouping).
// 검색·공급처·색상·사이즈·부족만·정렬 모두 서버 처리 (store.applyCatalogFilters).
// 본 컴포넌트는 v-model 시그니처(keyword/vendorFilter/sortBy/shortageOnly/selectedSkus/rowQuantities/collapsed)
// 를 호환 유지하되, 카탈로그 필터는 watch 로 store action 트리거.

const props = defineProps({
  selectedWarehouseCode: { type: String, required: true },
  isEditMode: { type: Boolean, default: false },
  cart: { type: Array, required: true },
})

const keyword = defineModel('keyword', { type: String, required: true })
const vendorFilter = defineModel('vendorFilter', { type: String, required: true })
const sortBy = defineModel('sortBy', { type: String, required: true })
const shortageOnly = defineModel('shortageOnly', { type: Boolean, required: true })
const selectedSkus = defineModel('selectedSkus', { type: Set, required: true })
// collapsed 는 평면 테이블에서 사용 안 함 — 부모 v-model 호환 위해 정의만 유지
defineModel('collapsed', { type: Object, required: true })
const rowQuantities = defineModel('rowQuantities', { type: Object, required: true })

const emit = defineEmits(['add-sku-to-cart', 'add-group-to-cart', 'scroll-to-cart-sku'])

const poStore = usePurchaseOrderStore()
const {
  rowStock,
  rowStockLevel,
  rowSuggested,
  stockLevelClass,
  statusChipForSku,
} = usePurchaseOrderStockSim(toRef(props, 'selectedWarehouseCode'))

const searchInputRef = ref(null)

// FE sortBy → BE Pageable.sort 키 매핑 (화이트리스트)
const SORT_MAP = {
  vendorAsc: 'vendorName,asc',
  nameAsc: 'productName,asc',
  priceAsc: 'unitPrice,asc',
  priceDesc: 'unitPrice,desc',
  shortage: 'availableQty,asc',
}

// vendorFilter 'all' → '' (store 는 빈 문자열 = 전체)
function normalizeVendor(v) {
  return v && v !== 'all' ? v : ''
}

// selectedWarehouseCode → warehouseId Long (store.warehouses 에서 매핑)
const selectedWarehouseId = computed(() => {
  const code = props.selectedWarehouseCode
  if (!code) return null
  const wh = poStore.warehouses.find((w) => w.code === code)
  return wh?.id ?? null
})

// ── watch 모음 — 변경 시 server fetch 트리거 ───────────────────────────
// keyword 는 300ms 디바운스. 그 외는 즉시 (드롭다운/칩/토글이라 매 변경 빈번 X).
let keywordTimer = null
watch(keyword, (v) => {
  if (keywordTimer) clearTimeout(keywordTimer)
  keywordTimer = setTimeout(() => {
    poStore.applyCatalogFilters({ keyword: v ?? '' })
  }, 300)
})

watch(vendorFilter, (v) => {
  poStore.applyCatalogFilters({ vendor: normalizeVendor(v) })
})

watch(sortBy, (v) => {
  poStore.applyCatalogFilters({ sort: SORT_MAP[v] ?? 'id,asc' })
})

watch(shortageOnly, (v) => {
  poStore.applyCatalogFilters({ shortageOnly: !!v })
})

watch(selectedWarehouseId, (v) => {
  poStore.applyCatalogFilters({ warehouseId: v })
})

// ── 색상/사이즈 facet — single select (현재 같은 값 다시 클릭하면 해제) ──
function selectColor(c) {
  const next = poStore.catalogColor === c ? '' : c
  poStore.applyCatalogFilters({ color: next })
}
function selectSize(s) {
  const next = poStore.catalogSkuSize === s ? '' : s
  poStore.applyCatalogFilters({ skuSize: next })
}
function clearFacets() {
  poStore.applyCatalogFilters({ color: '', skuSize: '' })
}

// ── 표시용 computed ───────────────────────────────────────────────────
const catalogRows = computed(() => poStore.catalogRows)
const catalogColors = computed(() => poStore.catalogColors)
const catalogSizes = computed(() => poStore.catalogSizes)
const catalogLoading = computed(() => poStore.catalogLoading)

// 페이지 안 vendor distinct — 한 페이지 안 vendor 만 보이는 한계는 별 phase 개선 예정
const vendorOptions = computed(() => {
  const seen = new Map()
  for (const r of catalogRows.value) {
    if (!seen.has(r.vendorCode)) {
      seen.set(r.vendorCode, { id: r.vendorCode, code: r.vendorCode, name: r.vendorName })
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
})

const skuRows = computed(() => catalogRows.value)

const matchedSkuCount = computed(() => poStore.catalogTotalElements)

// 카탈로그 응답에 safetyStock 미포함 — 품절(availableQty === 0) row 개수만 카운트.
const shortageCount = computed(() => {
  if (!props.selectedWarehouseCode) return 0
  return catalogRows.value.filter((r) => Number(r.availableQty ?? 0) === 0).length
})

function isInCart(skuCode) {
  return props.cart.some((it) => it.skuCode === skuCode)
}

function toggleSkuSelected(skuCode) {
  const set = new Set(selectedSkus.value)
  if (set.has(skuCode)) set.delete(skuCode)
  else set.add(skuCode)
  selectedSkus.value = set
}

function toggleAllVisible() {
  const set = new Set(selectedSkus.value)
  const allOn = skuRows.value.every((r) => set.has(r.skuCode))
  if (allOn) {
    for (const r of skuRows.value) set.delete(r.skuCode)
  } else {
    for (const r of skuRows.value) set.add(r.skuCode)
  }
  selectedSkus.value = set
}

const isAllSelected = computed(
  () =>
    skuRows.value.length > 0 && skuRows.value.every((r) => selectedSkus.value.has(r.skuCode)),
)
const isSomeSelected = computed(
  () => skuRows.value.some((r) => selectedSkus.value.has(r.skuCode)) && !isAllSelected.value,
)

function applySuggestedToSku(row) {
  const suggested = rowSuggested(row.skuCode)
  if (suggested <= 0) return
  rowQuantities.value = { ...rowQuantities.value, [row.skuCode]: suggested }
}

function focusSearch() {
  searchInputRef.value?.focus?.()
}

function scrollToSku(skuCode) {
  const el = document.querySelector(`[data-sku-code="${skuCode}"]`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

defineExpose({ focusSearch, scrollToSku })

// add-group-to-cart 는 평면 테이블에선 사용 안 함 — 호환 보존
void emit
</script>

<template>
  <div
    class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm"
  >
    <!-- 필터 바 -->
    <div
      class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2 pr-[15px]"
    >
      <label class="relative block">
        <SearchIcon :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref="searchInputRef"
          v-model="keyword"
          type="text"
          placeholder='제품명/SKU/공급처/옵션 검색  ("/" 로 포커스)'
          class="w-72 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-[#004D3C]"
        />
      </label>
      <select
        v-model="vendorFilter"
        :disabled="isEditMode"
        class="border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#004D3C] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      >
        <option value="all">전체 공급처</option>
        <option v-for="v in vendorOptions" :key="v.code" :value="v.code">{{ v.name }}</option>
      </select>
      <select
        v-model="sortBy"
        class="border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#004D3C]"
        title="정렬 기준"
      >
        <option value="vendorAsc">공급처명 ↑</option>
        <option value="nameAsc">제품명 ↑</option>
        <option value="priceAsc">단가 ↑</option>
        <option value="priceDesc">단가 ↓</option>
        <option value="shortage">재고 부족 우선</option>
      </select>
      <button
        type="button"
        class="border px-3 py-1.5 text-xs font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          shortageOnly
            ? 'border-red-400 bg-red-50 text-red-700'
            : shortageCount > 0
              ? 'border-red-300 bg-white text-red-600 hover:bg-red-50'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        "
        :disabled="!selectedWarehouseCode"
        :title="
          !selectedWarehouseCode
            ? '먼저 창고를 선택하세요'
            : '안전재고 미만 SKU 만 표시 (서버 필터)'
        "
        @click="shortageOnly = !shortageOnly"
      >
        {{ shortageOnly ? '✓ 부족만' : '부족만 보기' }}
      </button>
      <span class="ml-auto text-xs font-bold text-gray-500">SKU {{ matchedSkuCount }}건</span>
    </div>

    <!-- Facet 필터 칩 (색상/사이즈) — single select -->
    <div
      v-if="catalogColors.length > 0 || catalogSizes.length > 0"
      class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-2 py-2 pr-[15px]"
    >
      <div v-if="catalogColors.length > 0" class="flex items-center gap-1">
        <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">색상</span>
        <button
          v-for="value in catalogColors"
          :key="`color-${value}`"
          type="button"
          class="border px-2 py-0.5 text-[11px] font-bold transition-colors"
          :class="
            poStore.catalogColor === value
              ? 'border-[#004D3C] bg-[#004D3C] text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          "
          @click="selectColor(value)"
        >
          {{ value }}
        </button>
      </div>
      <div v-if="catalogSizes.length > 0" class="flex items-center gap-1">
        <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">사이즈</span>
        <button
          v-for="value in catalogSizes"
          :key="`size-${value}`"
          type="button"
          class="border px-2 py-0.5 text-[11px] font-bold transition-colors"
          :class="
            poStore.catalogSkuSize === value
              ? 'border-[#004D3C] bg-[#004D3C] text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          "
          @click="selectSize(value)"
        >
          {{ value }}
        </button>
      </div>
      <button
        v-if="poStore.catalogColor || poStore.catalogSkuSize"
        type="button"
        class="ml-auto text-[11px] font-bold text-gray-500 underline hover:text-gray-700"
        @click="clearFacets"
      >
        필터 초기화
      </button>
    </div>

    <!-- 창고 미선택 안내 -->
    <div
      v-if="!selectedWarehouseCode"
      class="border-b border-amber-200 bg-amber-50 px-3 py-2 pr-[15px] text-xs font-bold text-amber-700"
    >
      입고 창고를 먼저 선택해주세요. 창고가 정해져야 발주서를 만들 수 있습니다.
    </div>

    <!-- 카탈로그 테이블 — master 헤더 inline. -->
    <div class="min-h-0 flex-1 overflow-auto">
      <table class="w-full table-fixed border-collapse text-sm">
        <thead class="sticky top-0 z-10 bg-gray-100 text-sm text-gray-600 shadow-sm">
          <tr>
            <th class="w-8 px-1 py-2 text-center font-black">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isSomeSelected"
                :disabled="skuRows.length === 0"
                class="cursor-pointer disabled:cursor-not-allowed"
                title="현재 페이지 SKU 전체 선택"
                @change="toggleAllVisible"
              />
            </th>
            <th class="w-28 px-2 py-2 text-left font-black">공급처</th>
            <th class="px-2 py-2 text-left font-black">제품</th>
            <th class="w-24 px-2 py-2 text-right font-black">단가</th>
            <th class="w-14 px-2 py-2 text-right font-black" title="가용재고">재고</th>
            <th
              class="w-14 px-2 py-2 text-right font-black"
              title="안전재고 × 1.5 까지 채우는 권장 발주 수량"
            >
              권장
            </th>
            <th class="w-16 px-1 py-2 text-center font-black">상태</th>
            <th class="w-16 px-1 py-2 text-center font-black">수량</th>
            <th class="w-16 px-1 py-2 text-center font-black">담기</th>
          </tr>
        </thead>
        <tbody :class="!selectedWarehouseCode ? 'pointer-events-none opacity-50' : ''">
          <tr
            v-for="row in catalogRows"
            :key="row.skuCode"
            class="border-b border-gray-100 hover:bg-[#F4FAF8]"
            :class="selectedSkus.has(row.skuCode) ? 'bg-emerald-50' : ''"
            :data-sku-code="row.skuCode"
          >
              <td class="px-1 py-2 text-center align-middle">
                <input
                  type="checkbox"
                  :checked="selectedSkus.has(row.skuCode)"
                  class="cursor-pointer"
                  @change="toggleSkuSelected(row.skuCode)"
                />
              </td>
              <td class="truncate px-2 py-2 align-middle" :title="row.vendorName">
                <span class="text-xs font-black text-gray-700">{{ row.vendorName }}</span>
              </td>
              <td class="px-2 py-2 align-middle" :title="`${row.productName} · ${row.skuCode}`">
                <div class="flex flex-col gap-0.5">
                  <div class="flex flex-wrap items-baseline gap-x-2">
                    <span class="whitespace-normal break-words text-sm font-black leading-tight text-gray-800">
                      {{ row.productName }}
                    </span>
                    <span v-if="row.displayOption" class="text-xs font-bold text-[#004D3C]">
                      {{ row.displayOption }}
                    </span>
                  </div>
                  <span class="font-mono text-[11px] text-gray-400">{{ row.skuCode }}</span>
                </div>
              </td>
              <td class="px-2 py-2 text-right align-middle font-bold text-[#004D3C]">
                ₩{{ row.unitPrice.toLocaleString() }}
              </td>
              <td
                class="px-2 py-2 text-right align-middle font-bold"
                :class="stockLevelClass(rowStockLevel(row.skuCode))"
                :title="`가용재고 ${row.availableQty}`"
              >
                {{ row.availableQty }}
              </td>
              <td class="px-2 py-2 text-right align-middle">
                <template v-if="rowStock(row.skuCode)">
                  <button
                    v-if="rowSuggested(row.skuCode) > 0"
                    type="button"
                    class="text-sm font-black text-[#004D3C] hover:underline"
                    :title="`클릭 시 수량 입력란에 ${rowSuggested(row.skuCode)} 채움`"
                    @click="applySuggestedToSku(row)"
                  >
                    {{ rowSuggested(row.skuCode) }}
                  </button>
                  <span v-else class="text-gray-300">—</span>
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-1 py-2 text-center align-middle">
                <template v-if="statusChipForSku(row.skuCode)">
                  <span
                    class="inline-flex min-w-9 justify-center px-1.5 py-0.5 text-[11px] font-black"
                    :class="statusChipForSku(row.skuCode).class"
                  >
                    {{ statusChipForSku(row.skuCode).label }}
                  </span>
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-1 py-2 align-middle">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  class="w-full border border-gray-300 px-1 py-1 text-center text-sm outline-none focus:border-[#004D3C]"
                  :value="rowQuantities[row.skuCode] ?? ''"
                  @input="
                    rowQuantities = {
                      ...rowQuantities,
                      [row.skuCode]: Number($event.target.value) || 0,
                    }
                  "
                  @keydown.enter.exact="$emit('add-sku-to-cart', row)"
                />
              </td>
              <td class="px-1 py-2 text-center align-middle">
                <button
                  v-if="isInCart(row.skuCode)"
                  type="button"
                  class="inline-flex items-center justify-center border border-[#004D3C] bg-[#E6F2F0] px-2 py-0.5 text-[11px] font-black text-[#004D3C] hover:bg-[#D6EAE6]"
                  title="장바구니에서 보기"
                  @click="$emit('scroll-to-cart-sku', row.skuCode)"
                >
                  ✓ 담김
                </button>
                <button
                  v-else
                  type="button"
                  class="inline-flex items-center justify-center border border-[#004D3C] bg-white px-2 py-0.5 text-[11px] font-black text-[#004D3C] hover:bg-[#E6F2F0] disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!(Number(rowQuantities[row.skuCode]) > 0)"
                  title="장바구니 담기 (Enter)"
                  @click="$emit('add-sku-to-cart', row)"
                >
                  담기
                </button>
              </td>
          </tr>
          <tr v-if="!catalogLoading && skuRows.length === 0">
            <td colspan="9" class="px-3 py-8 text-center text-sm text-gray-400">
              검색 결과가 없습니다.
            </td>
          </tr>
          <tr v-if="catalogLoading">
            <td colspan="9" class="px-3 py-8 text-center text-sm text-gray-400">
              카탈로그를 불러오는 중...
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 페이지네이션 -->
    <PaginationNav
      :page="poStore.catalogPage"
      :size="poStore.catalogSize"
      :total-pages="poStore.catalogTotalPages"
      :total-elements="poStore.catalogTotalElements"
      :has-previous="poStore.catalogHasPrevious"
      :has-next="poStore.catalogHasNext"
      @update:page="poStore.setCatalogPage"
      @update:size="poStore.setCatalogSize"
    />
  </div>
</template>

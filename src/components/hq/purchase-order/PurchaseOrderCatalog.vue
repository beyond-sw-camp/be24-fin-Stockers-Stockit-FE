<script setup>
import { computed, ref, toRef } from 'vue'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'
import { useFacets } from '@/composables/hq/purchaseOrder/useFacets.js'
import { usePurchaseOrderStockSim } from '@/composables/hq/purchaseOrder/useStockSim.js'
import { PlusIcon, SearchIcon } from '@/components/hq/purchase-order/icons.js'

// 새 발주 카탈로그 — ERP 테이블 스타일.
// 한 행 = 1 SKU. 공급처/제품/옵션이 컬럼으로 평면화 → 그룹 헤더 제거.
// 멀티 공급처 카트 흐름 (BE batch API) 과 일관 — 사용자가 자유롭게 여러 공급처 SKU 를 담는다.

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
// collapsed 는 평면 테이블에선 사용 안 함 — 부모 v-model 호환 위해 정의만 유지
defineModel('collapsed', { type: Object, required: true })
const rowQuantities = defineModel('rowQuantities', { type: Object, required: true })

const emit = defineEmits(['add-sku-to-cart', 'add-group-to-cart', 'scroll-to-cart-sku'])

const poStore = usePurchaseOrderStore()
const { activeFacetFilters, toggleFacet, isFacetActive, clearFacets, skuMatchesFacets } =
  useFacets()
const {
  stockStore,
  rowStock,
  rowStockLevel,
  rowSuggested,
  stockLevelClass,
  statusChipForSku,
  shortageRank,
} = usePurchaseOrderStockSim(toRef(props, 'selectedWarehouseCode'))

const searchInputRef = ref(null)

const catalogSkuRows = computed(() => poStore.catalogSkuRows)
const catalogFacets = computed(() => poStore.catalogFacets)
const catalogLoading = computed(() => poStore.catalogLoading)

const vendorOptions = computed(() => {
  const seen = new Map()
  for (const r of catalogSkuRows.value) {
    if (r.type === 'header' && !seen.has(r.vendorCode)) {
      seen.set(r.vendorCode, { id: r.vendorCode, code: r.vendorCode, name: r.vendorName })
    }
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
})

// 평면 SKU 행 — 검색/공급처필터/facet/부족/정렬 적용한 SKU 행만 반환.
const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  let skus = catalogSkuRows.value.filter((r) => r.type === 'sku')
  if (skus.length === 0) return []

  // 공급처 필터 (server-side fetch 와 별개로 client 도 안전망)
  if (vendorFilter.value && vendorFilter.value !== 'all') {
    skus = skus.filter((r) => r.vendorCode === vendorFilter.value)
  }

  // 키워드
  if (kw) {
    skus = skus.filter((r) =>
      [
        r.vendorName,
        r.vendorCode,
        r.productName,
        r.productCode,
        r.skuCode,
        r.color,
        r.size,
        r.displayOption,
      ].some((s) => (s ?? '').toLowerCase().includes(kw)),
    )
  }

  // Facet (색상·사이즈)
  skus = skus.filter(skuMatchesFacets)

  // 부족만
  if (shortageOnly.value && props.selectedWarehouseCode) {
    skus = skus.filter((r) => {
      const level = rowStockLevel(r.skuCode)
      return level === 'critical' || level === 'warning'
    })
  }

  // 정렬
  switch (sortBy.value) {
    case 'shortage':
      skus = [...skus].sort((a, b) => {
        const rankDiff = shortageRank(a.skuCode) - shortageRank(b.skuCode)
        if (rankDiff !== 0) return rankDiff
        return (
          a.productName.localeCompare(b.productName, 'ko') ||
          (a.displayOption ?? '').localeCompare(b.displayOption ?? '', 'ko')
        )
      })
      break
    case 'priceAsc':
      skus = [...skus].sort((a, b) => a.unitPrice - b.unitPrice)
      break
    case 'priceDesc':
      skus = [...skus].sort((a, b) => b.unitPrice - a.unitPrice)
      break
    case 'nameAsc':
      skus = [...skus].sort(
        (a, b) =>
          a.productName.localeCompare(b.productName, 'ko') ||
          (a.displayOption || '').localeCompare(b.displayOption || '', 'ko'),
      )
      break
    case 'vendorAsc':
      skus = [...skus].sort(
        (a, b) =>
          a.vendorName.localeCompare(b.vendorName, 'ko') ||
          a.productName.localeCompare(b.productName, 'ko'),
      )
      break
    default:
      // 기본 정렬 — 공급처 → 제품명 → 옵션
      skus = [...skus].sort(
        (a, b) =>
          a.vendorName.localeCompare(b.vendorName, 'ko') ||
          a.productName.localeCompare(b.productName, 'ko') ||
          (a.displayOption || '').localeCompare(b.displayOption || '', 'ko'),
      )
  }

  return skus
})

const matchedSkuCount = computed(() => filteredRows.value.length)

const shortageCount = computed(() => {
  if (!props.selectedWarehouseCode) return 0
  const skuCodes = catalogSkuRows.value.filter((r) => r.type === 'sku').map((r) => r.skuCode)
  return stockStore.getSkuShortageCount(props.selectedWarehouseCode, skuCodes)
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
  const allOn = filteredRows.value.every((r) => set.has(r.skuCode))
  if (allOn) {
    for (const r of filteredRows.value) set.delete(r.skuCode)
  } else {
    for (const r of filteredRows.value) set.add(r.skuCode)
  }
  selectedSkus.value = set
}

const isAllSelected = computed(
  () =>
    filteredRows.value.length > 0 &&
    filteredRows.value.every((r) => selectedSkus.value.has(r.skuCode)),
)
const isSomeSelected = computed(
  () =>
    filteredRows.value.some((r) => selectedSkus.value.has(r.skuCode)) && !isAllSelected.value,
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

// 평면 테이블에선 그룹 단위 액션 의미 없음 — add-group-to-cart 는 emit 안 함.
// 부모의 addGroupToCart 핸들러는 unused (호환 보존, 향후 제거 후보).
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
          class="w-72 border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-[#004D3C]"
        />
      </label>
      <select
        v-model="vendorFilter"
        :disabled="isEditMode"
        class="border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
      >
        <option value="all">전체 공급처</option>
        <option v-for="v in vendorOptions" :key="v.code" :value="v.code">{{ v.name }}</option>
      </select>
      <select
        v-model="sortBy"
        class="border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#004D3C]"
      >
        <option value="default">정렬: 공급처 → 제품</option>
        <option value="vendorAsc">공급처명</option>
        <option value="nameAsc">제품명</option>
        <option value="priceAsc">단가 ↑</option>
        <option value="priceDesc">단가 ↓</option>
        <option value="shortage">부족 SKU 우선</option>
      </select>
      <button
        type="button"
        class="border px-3 py-1.5 text-[11px] font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          shortageOnly
            ? 'border-red-400 bg-red-50 text-red-700'
            : shortageCount > 0
              ? 'border-red-300 bg-white text-red-600 hover:bg-red-50'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        "
        :disabled="!selectedWarehouseCode || shortageCount === 0"
        :title="
          !selectedWarehouseCode
            ? '먼저 창고를 선택하세요'
            : shortageCount === 0
              ? '재고 부족 SKU 없음'
              : '가용재고가 안전재고 1.5배 미만인 SKU만 표시'
        "
        @click="shortageOnly = !shortageOnly"
      >
        {{
          shortageOnly
            ? `✓ 부족만 (${shortageCount})`
            : selectedWarehouseCode && shortageCount > 0
              ? `부족만 보기 (${shortageCount})`
              : '부족만 보기'
        }}
      </button>
      <span class="ml-auto text-[11px] font-bold text-gray-500">SKU {{ matchedSkuCount }}건</span>
    </div>

    <!-- Facet 필터 칩 (색상/사이즈) -->
    <div
      v-if="catalogFacets.length > 0"
      class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-2 py-2 pr-[15px]"
    >
      <div v-for="facet in catalogFacets" :key="facet.name" class="flex items-center gap-1">
        <span class="text-[10px] font-black uppercase tracking-wider text-gray-400">
          {{ facet.name }}
        </span>
        <button
          v-for="value in facet.values"
          :key="`${facet.name}-${value}`"
          type="button"
          class="border px-2 py-0.5 text-[10px] font-bold transition-colors"
          :class="
            isFacetActive(facet.name, value)
              ? 'border-[#004D3C] bg-[#004D3C] text-white'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          "
          @click="toggleFacet(facet.name, value)"
        >
          {{ value }}
        </button>
      </div>
      <button
        v-if="Object.keys(activeFacetFilters).length > 0"
        type="button"
        class="ml-auto text-[10px] font-bold text-gray-500 underline hover:text-gray-700"
        @click="clearFacets"
      >
        필터 초기화
      </button>
    </div>

    <!-- 창고 미선택 안내 -->
    <div
      v-if="!selectedWarehouseCode"
      class="border-b border-amber-200 bg-amber-50 px-3 py-2 pr-[15px] text-[11px] font-bold text-amber-700"
    >
      입고 창고를 먼저 선택해주세요. 창고가 정해져야 발주서를 만들 수 있습니다.
    </div>

    <!-- 카탈로그 테이블 — ERP 스타일 평면. 헤더 sticky. -->
    <div class="min-h-0 flex-1 overflow-auto">
      <table class="w-full table-fixed border-collapse text-xs">
        <thead class="sticky top-0 z-10 bg-gray-100 text-xs text-gray-600 shadow-sm">
          <tr>
            <th class="w-8 px-1 py-2 text-center font-black">
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate.prop="isSomeSelected"
                :disabled="filteredRows.length === 0"
                class="cursor-pointer disabled:cursor-not-allowed"
                title="화면에 보이는 SKU 전체 선택"
                @change="toggleAllVisible"
              />
            </th>
            <th class="w-28 px-2 py-2 text-left font-black">공급처</th>
            <th class="w-24 px-2 py-2 text-left font-black">제품코드</th>
            <th class="px-2 py-2 text-left font-black">제품명</th>
            <th class="w-20 px-2 py-2 text-left font-black">옵션</th>
            <th class="w-32 px-2 py-2 text-left font-black">SKU</th>
            <th class="w-20 px-2 py-2 text-right font-black">단가</th>
            <th
              class="w-12 px-2 py-2 text-right font-black"
              title="가용재고 (실재고 + 입고예정 - 출고예정)"
            >
              재고
            </th>
            <th
              class="w-14 px-2 py-2 text-right font-black"
              title="안전재고 × 1.5 까지 채우는 권장 발주 수량"
            >
              권장
            </th>
            <th class="w-14 px-1 py-2 text-center font-black">상태</th>
            <th class="w-16 px-1 py-2 text-center font-black">수량</th>
            <th class="w-12 px-2 py-2 text-center font-black"></th>
          </tr>
        </thead>
        <tbody :class="!selectedWarehouseCode ? 'pointer-events-none opacity-50' : ''">
          <tr
            v-for="row in filteredRows"
            :key="`s-${row.skuCode}`"
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
              <span class="text-[11px] font-black text-gray-700">{{ row.vendorName }}</span>
            </td>
            <td
              class="truncate px-2 py-2 align-middle font-mono text-[10px] text-gray-500"
              :title="row.productCode"
            >
              {{ row.productCode }}
            </td>
            <td class="px-2 py-2 align-middle" :title="row.productName">
              <span class="block whitespace-normal break-words text-xs font-black leading-tight text-gray-800">
                {{ row.productName }}
              </span>
            </td>
            <td class="px-2 py-2 align-middle">
              <span class="text-[11px] font-bold text-[#004D3C]">{{ row.displayOption }}</span>
            </td>
            <td class="px-2 py-2 align-middle font-mono text-[10px] text-gray-500">
              {{ row.skuCode }}
            </td>
            <td class="px-2 py-2 text-right align-middle font-bold text-[#004D3C]">
              ₩{{ row.unitPrice.toLocaleString() }}
            </td>
            <td
              class="px-2 py-2 text-right align-middle font-bold"
              :class="stockLevelClass(rowStockLevel(row.skuCode))"
              :title="
                rowStock(row.skuCode)
                  ? `실재고 ${rowStock(row.skuCode).onHand} · 안전 ${rowStock(row.skuCode).safetyStock}`
                  : ''
              "
            >
              <template v-if="rowStock(row.skuCode)">{{ rowStock(row.skuCode).available }}</template>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-2 py-2 text-right align-middle">
              <template v-if="rowStock(row.skuCode)">
                <button
                  v-if="rowSuggested(row.skuCode) > 0"
                  type="button"
                  class="border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700 hover:bg-red-100"
                  :title="`권장 발주 ${rowSuggested(row.skuCode)}개를 수량 입력란에 채웁니다`"
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
                  class="inline-flex min-w-9 justify-center px-1.5 py-0.5 text-[10px] font-black"
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
                class="w-full border border-gray-300 px-1 py-1 text-center text-xs outline-none focus:border-[#004D3C]"
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
            <td class="px-2 py-2 text-center align-middle">
              <div class="inline-flex items-center gap-1">
                <button
                  type="button"
                  class="inline-flex items-center justify-center border border-[#004D3C] bg-white p-1 text-[#004D3C] hover:bg-[#E6F2F0] disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="!(Number(rowQuantities[row.skuCode]) > 0)"
                  title="장바구니 담기 (Enter)"
                  @click="$emit('add-sku-to-cart', row)"
                >
                  <PlusIcon :size="12" />
                </button>
                <button
                  v-if="isInCart(row.skuCode)"
                  type="button"
                  class="text-[10px] font-bold text-[#004D3C] hover:underline"
                  title="장바구니에서 보기"
                  @click="$emit('scroll-to-cart-sku', row.skuCode)"
                >
                  ●
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!catalogLoading && catalogSkuRows.length === 0">
            <td colspan="12" class="px-3 py-8 text-center text-xs text-gray-400">
              노출 가능한 계약 제품이 없습니다.
            </td>
          </tr>
          <tr v-else-if="!catalogLoading && filteredRows.length === 0">
            <td colspan="12" class="px-3 py-8 text-center text-xs text-gray-400">
              검색 결과가 없습니다.
            </td>
          </tr>
          <tr v-if="catalogLoading">
            <td colspan="12" class="px-3 py-8 text-center text-xs text-gray-400">
              카탈로그를 불러오는 중...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

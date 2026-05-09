<script setup>
import { computed, nextTick, ref, toRef } from 'vue'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'
import { useFacets } from '@/composables/hq/purchaseOrder/useFacets.js'
import { usePurchaseOrderStockSim } from '@/composables/hq/purchaseOrder/useStockSim.js'
import { PlusIcon, SearchIcon } from '@/components/hq/purchase-order/icons.js'

// 새 발주 카탈로그 — 좌측 표시 + 검색·정렬·필터·그룹 접힘·부족만 보기·SKU 다중 선택까지 자체 책임.
// 부모와의 통신은 v-model 7개(키워드/필터/정렬/부족/선택/접힘/수량) + cart 액션 emit 2개로 좁혀짐.
// store/composable 은 자식이 직접 import — 부모의 카탈로그 관련 의존이 사라짐.

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
const collapsed = defineModel('collapsed', { type: Object, required: true })
const rowQuantities = defineModel('rowQuantities', { type: Object, required: true })

const emit = defineEmits(['add-sku-to-cart', 'add-group-to-cart', 'scroll-to-cart-sku'])

const poStore = usePurchaseOrderStore()
const { activeFacetFilters, toggleFacet, isFacetActive, clearFacets, skuMatchesFacets } = useFacets()
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

const filteredRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const all = catalogSkuRows.value
  if (all.length === 0) return []

  let skus = all.filter((r) => r.type === 'sku')
  if (kw) {
    skus = skus.filter((r) =>
      [r.vendorName, r.productName, r.productCode, r.skuCode, r.color, r.size, r.displayOption]
        .some((s) => (s ?? '').toLowerCase().includes(kw)),
    )
  }
  skus = skus.filter(skuMatchesFacets)

  if (shortageOnly.value && props.selectedWarehouseCode) {
    skus = skus.filter((r) => {
      const level = rowStockLevel(r.skuCode)
      return level === 'critical' || level === 'warning'
    })
  }

  switch (sortBy.value) {
    case 'shortage':
      skus = [...skus].sort((a, b) => {
        const rankDiff = shortageRank(a.skuCode) - shortageRank(b.skuCode)
        if (rankDiff !== 0) return rankDiff
        return a.productName.localeCompare(b.productName, 'ko')
          || (a.optionValue ?? '').localeCompare(b.optionValue ?? '', 'ko')
      })
      break
    case 'priceAsc':
      skus = [...skus].sort((a, b) => a.unitPrice - b.unitPrice)
      break
    case 'priceDesc':
      skus = [...skus].sort((a, b) => b.unitPrice - a.unitPrice)
      break
    case 'nameAsc':
      skus = [...skus].sort((a, b) =>
        a.productName.localeCompare(b.productName, 'ko')
          || (a.displayOption || '').localeCompare(b.displayOption || '', 'ko'),
      )
      break
    default:
      break
  }

  const skusByMaster = new Map()
  for (const s of skus) {
    if (!skusByMaster.has(s.masterKey)) skusByMaster.set(s.masterKey, [])
    skusByMaster.get(s.masterKey).push(s)
  }
  const headerByMaster = new Map()
  for (const r of all) {
    if (r.type === 'header') headerByMaster.set(r.masterKey, r)
  }

  const result = []
  for (const [masterKey, skuList] of skusByMaster) {
    const header = headerByMaster.get(masterKey)
    if (!header) continue
    result.push(header)
    if (!collapsed.value[masterKey]) result.push(...skuList)
  }
  return result
})

const matchedSkuCount = computed(() => filteredRows.value.filter((r) => r.type === 'sku').length)

const shortageCount = computed(() => {
  if (!props.selectedWarehouseCode) return 0
  const skuCodes = catalogSkuRows.value
    .filter((r) => r.type === 'sku')
    .map((r) => r.skuCode)
  return stockStore.getSkuShortageCount(props.selectedWarehouseCode, skuCodes)
})

function rowKey(row) {
  if (row.type === 'vendor') return `v-${row.vendorCode}`
  if (row.type === 'header') return `h-${row.masterKey}`
  return `s-${row.skuCode}`
}

function isInCart(skuCode) {
  return props.cart.some((it) => it.skuCode === skuCode)
}

function isGroupAllSelected(masterKey) {
  const skus = filteredRows.value.filter((r) => r.type === 'sku' && r.masterKey === masterKey)
  if (skus.length === 0) return false
  return skus.every((s) => selectedSkus.value.has(s.skuCode))
}

function isGroupSomeSelected(masterKey) {
  const skus = filteredRows.value.filter((r) => r.type === 'sku' && r.masterKey === masterKey)
  return skus.some((s) => selectedSkus.value.has(s.skuCode)) && !isGroupAllSelected(masterKey)
}

function toggleSkuSelected(skuCode) {
  const set = new Set(selectedSkus.value)
  if (set.has(skuCode)) set.delete(skuCode)
  else set.add(skuCode)
  selectedSkus.value = set
}

function toggleGroupSelected(masterKey, evt) {
  evt?.stopPropagation?.()
  const skus = filteredRows.value.filter((r) => r.type === 'sku' && r.masterKey === masterKey)
  const set = new Set(selectedSkus.value)
  const allSelected = skus.every((s) => set.has(s.skuCode))
  for (const s of skus) {
    if (allSelected) set.delete(s.skuCode)
    else set.add(s.skuCode)
  }
  selectedSkus.value = set
}

function toggleGroup(masterKey) {
  collapsed.value = { ...collapsed.value, [masterKey]: !collapsed.value[masterKey] }
}

function expandAll() {
  collapsed.value = {}
}

function collapseAll() {
  const next = {}
  for (const r of catalogSkuRows.value) {
    if (r.type === 'header') next[r.masterKey] = true
  }
  collapsed.value = next
}

function applySuggestedToSku(row) {
  const suggested = rowSuggested(row.skuCode)
  if (suggested <= 0) return
  rowQuantities.value = { ...rowQuantities.value, [row.skuCode]: suggested }
  nextTick(() => {
    const el = document.querySelector(`[data-sku-code="${row.skuCode}"] input[type="number"]`)
    if (el) {
      el.focus()
      el.select?.()
    }
  })
}

function focusSearch() {
  searchInputRef.value?.focus?.()
}

function scrollToSku(skuCode) {
  const skuRow = catalogSkuRows.value.find((r) => r.type === 'sku' && r.skuCode === skuCode)
  if (skuRow && collapsed.value[skuRow.masterKey]) {
    collapsed.value = { ...collapsed.value, [skuRow.masterKey]: false }
  }
  nextTick(() => {
    const el = document.querySelector(`[data-sku-code="${skuCode}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

defineExpose({ focusSearch, scrollToSku })
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm">
    <!-- 필터 헤더 -->
    <div class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2 pr-[15px]">
      <label class="relative block">
        <SearchIcon :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref="searchInputRef"
          v-model="keyword"
          type="text"
          placeholder='제품명/SKU코드/옵션값 검색  ("/" 로 포커스)'
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
        <option value="default">정렬: 기본</option>
        <option value="shortage">부족 SKU 우선</option>
        <option value="priceAsc">단가 ↑</option>
        <option value="priceDesc">단가 ↓</option>
        <option value="nameAsc">제품명 ㄱ-ㄴ</option>
      </select>
      <button
        type="button"
        class="border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
        @click="expandAll"
      >
        전체 펼치기
      </button>
      <button
        type="button"
        class="border border-gray-300 bg-white px-2 py-1.5 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
        @click="collapseAll"
      >
        전체 접기
      </button>
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
        :title="!selectedWarehouseCode ? '먼저 창고를 선택하세요' : (shortageCount === 0 ? '재고 부족 품목 없음' : '가용재고가 안전재고 1.5배 미만인 마스터만 표시')"
        @click="shortageOnly = !shortageOnly"
      >
        {{ shortageOnly ? `✓ 부족만 (${shortageCount})` : (selectedWarehouseCode && shortageCount > 0 ? `부족만 보기 (${shortageCount})` : '부족만 보기') }}
      </button>
      <span class="ml-auto text-[11px] font-bold text-gray-500">SKU {{ matchedSkuCount }}건</span>
    </div>

    <!-- Facet 필터 칩 (옵션 axis 별) -->
    <div
      v-if="catalogFacets.length > 0"
      class="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-2 py-2 pr-[15px]"
    >
      <div v-for="facet in catalogFacets" :key="facet.name" class="flex items-center gap-1">
        <span class="text-[10px] font-black uppercase tracking-wider text-gray-400">{{ facet.name }}</span>
        <button
          v-for="value in facet.values"
          :key="`${facet.name}-${value}`"
          type="button"
          class="border px-2 py-0.5 text-[10px] font-bold transition-colors"
          :class="isFacetActive(facet.name, value)
            ? 'border-[#004D3C] bg-[#004D3C] text-white'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
          @click="toggleFacet(facet.name, value)"
        >
          {{ value }}
        </button>
      </div>
      <button
        v-if="Object.keys(activeFacetFilters).length > 0"
        type="button"
        class="ml-auto text-[10px] font-bold text-gray-500 hover:text-gray-700 underline"
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

    <!-- 카탈로그 테이블 — 카드 내부 자체 스크롤. 그룹 헤더 sticky. -->
    <div class="min-h-0 flex-1 overflow-auto">
      <table class="w-full table-fixed border-collapse text-xs">
        <thead class="bg-gray-100 text-xs text-gray-500">
          <tr>
            <th class="w-8 px-1 py-2 text-center font-black"></th>
            <th class="w-44 px-2 py-2 text-left font-black">옵션</th>
            <th class="w-28 px-2 py-2 text-left font-black">SKU 코드</th>
            <th class="w-20 px-2 py-2 text-right font-black">단가</th>
            <th class="w-12 px-2 py-2 text-right font-black" title="실재고 + 입고예정 - 출고예정">가용</th>
            <th class="w-12 px-2 py-2 text-right font-black" title="실재고 (현재 보유)">실</th>
            <th class="w-12 px-2 py-2 text-right font-black" title="안전재고 (이 밑으로 떨어지면 안 됨)">안전</th>
            <th class="w-14 px-2 py-2 text-right font-black" title="안전재고 × 1.5 까지 채우는 권장 발주 수량">권장</th>
            <th class="w-14 px-1 py-2 text-center font-black">상태</th>
            <th class="w-14 px-1 py-2 text-center font-black">수량</th>
            <th class="w-12 px-2 py-2 text-center font-black"></th>
          </tr>
        </thead>
        <tbody :class="!selectedWarehouseCode ? 'pointer-events-none opacity-50' : ''">
          <template v-for="row in filteredRows" :key="rowKey(row)">
            <tr
              v-if="row.type === 'header'"
              class="bg-gray-50 hover:bg-gray-100 border-t border-gray-200 cursor-pointer select-none"
              @click="toggleGroup(row.masterKey)"
            >
              <td class="px-1 py-2.5 text-center">
                <input
                  v-if="!collapsed[row.masterKey]"
                  type="checkbox"
                  :checked="isGroupAllSelected(row.masterKey)"
                  :indeterminate.prop="isGroupSomeSelected(row.masterKey)"
                  class="cursor-pointer"
                  @click.stop
                  @change="toggleGroupSelected(row.masterKey, $event)"
                />
              </td>
              <td colspan="10" class="px-3 py-2.5">
                <div class="flex items-center gap-3 flex-wrap">
                  <span class="text-[11px] font-black text-gray-500 shrink-0">
                    {{ collapsed[row.masterKey] ? '▸' : '▾' }}
                  </span>
                  <span class="text-xs font-black text-gray-900 truncate">{{ row.productName }}</span>
                  <span class="font-mono text-[10px] font-bold text-gray-400 shrink-0">{{ row.productCode }}</span>
                  <span class="ml-auto text-[10px] font-bold text-gray-400 shrink-0">
                    공급처
                    <span class="ml-1 font-black text-gray-700">{{ row.vendorName }}</span>
                  </span>
                </div>
              </td>
            </tr>
            <tr
              v-else
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
              <td class="px-2 py-2 align-middle">
                <div class="text-xs font-bold text-gray-800">{{ row.displayOption }}</div>
              </td>
              <td class="px-2 py-2 text-[11px] text-gray-500 align-middle">{{ row.skuCode }}</td>
              <td class="px-2 py-2 text-right font-bold text-[#004D3C] align-middle">
                ₩{{ row.unitPrice.toLocaleString() }}
              </td>
              <td class="px-2 py-2 text-right font-bold align-middle" :class="stockLevelClass(rowStockLevel(row.skuCode))">
                <template v-if="rowStock(row.skuCode)">{{ rowStock(row.skuCode).available }}</template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-2 py-2 text-right font-bold text-gray-500 align-middle">
                <template v-if="rowStock(row.skuCode)">{{ rowStock(row.skuCode).onHand }}</template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-2 py-2 text-right font-bold text-gray-500 align-middle">
                <template v-if="rowStock(row.skuCode)">{{ rowStock(row.skuCode).safetyStock }}</template>
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
                  @input="rowQuantities = { ...rowQuantities, [row.skuCode]: Number($event.target.value) || 0 }"
                  @keydown.enter.exact="emit('add-sku-to-cart', row)"
                  @keydown.enter.shift.prevent="emit('add-group-to-cart', row.masterKey)"
                />
              </td>
              <td class="px-2 py-2 text-center align-middle">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center border border-[#004D3C] bg-white p-1 text-[#004D3C] hover:bg-[#E6F2F0] disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!(Number(rowQuantities[row.skuCode]) > 0)"
                    title="장바구니 담기 (Enter)"
                    @click="emit('add-sku-to-cart', row)"
                  >
                    <PlusIcon :size="12" />
                  </button>
                  <button
                    v-if="isInCart(row.skuCode)"
                    type="button"
                    class="text-[10px] font-bold text-[#004D3C] hover:underline"
                    title="장바구니에서 보기"
                    @click="emit('scroll-to-cart-sku', row.skuCode)"
                  >
                    ●
                  </button>
                </div>
              </td>
            </tr>
          </template>
          <tr v-if="!catalogLoading && catalogSkuRows.length === 0">
            <td colspan="11" class="px-3 py-8 text-center text-xs text-gray-400">
              노출 가능한 계약 제품이 없습니다.
            </td>
          </tr>
          <tr v-else-if="!catalogLoading && filteredRows.length === 0">
            <td colspan="11" class="px-3 py-8 text-center text-xs text-gray-400">
              검색 결과가 없습니다.
            </td>
          </tr>
          <tr v-if="catalogLoading">
            <td colspan="11" class="px-3 py-8 text-center text-xs text-gray-400">
              카탈로그를 불러오는 중...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

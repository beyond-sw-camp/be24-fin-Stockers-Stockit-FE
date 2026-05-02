<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '순환 재고 리스트',
  },
  description: {
    type: String,
    default: '',
  },
  summaryText: {
    type: String,
    default: '',
  },
  actionColumnLabel: {
    type: String,
    default: '작업',
  },
  actionColumnPosition: {
    type: String,
    default: 'end',
    validator: value => ['start', 'end'].includes(value),
  },
  selectedRowIds: {
    type: Array,
    default: () => [],
  },
  highlightedRowIds: {
    type: Array,
    default: () => [],
  },
  highlightedInventoryIds: {
    type: Array,
    default: () => [],
  },
  enableRowClick: {
    type: Boolean,
    default: false,
  },
  showCircularSalePriceColumn: {
    type: Boolean,
    default: false,
  },
  inventoryRows: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['row-click', 'toggle-all-visible'])
const slots = useSlots()

const searchTerm = ref('')
const materialFilters = ref([])
const isMaterialDropdownOpen = ref(false)
const materialDropdownRef = ref(null)
const sortKey = ref('')
const sortDirection = ref('asc')
const hoveredRowId = ref(null)
const visibleColumns = ref({
  color: true,
  size: true,
  perItemWeight: true,
})

const naturalSingleMaterials = ['면', '울', '캐시미어', '실크', '리넨']
const syntheticMaterials = ['폴리에스터', '아크릴', '나일론', '스판덱스']
const materialGroupOptions = ['천연 단일 섬유', '합성 섬유', '혼방']
const materialNameAliasMap = {
  코튼: '면',
  cotton: '면',
  폴리: '폴리에스터',
  polyester: '폴리에스터',
  acrylic: '아크릴',
  polyamide: '나일론',
  nylon: '나일론',
  elastane: '스판덱스',
  스판: '스판덱스',
  spandex: '스판덱스',
  wool: '울',
  cashmere: '캐시미어',
  silk: '실크',
  linen: '리넨',
}
const materialOptions = [...naturalSingleMaterials, ...syntheticMaterials, '혼방']
const materialOptionsByGroup = {
  '천연 단일 섬유': naturalSingleMaterials,
  '합성 섬유': syntheticMaterials,
  혼방: [...naturalSingleMaterials, ...syntheticMaterials],
}
const materialKgPriceMap = {
  면: 5000,
  울: 10000,
  캐시미어: 35000,
  실크: 20000,
  리넨: 5000,
  폴리에스터: 3000,
  아크릴: 2000,
  나일론: 4000,
  스판덱스: 2000,
}
const blendKgPrice = 1000
const colorOptions = ['검정', '흰색', '네이비', '그레이']
const colorCodeMap = { 검정: 'BLK', 흰색: 'WHT', 네이비: 'NVY', 그레이: 'GRY' }
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL']

const hasActionColumn = computed(() => Boolean(slots['header-action'] || slots['row-action']))

const activeMaterialFilters = computed(() =>
  materialFilters.value.filter(filter => filter.materialGroup),
)

const circularStockData = computed(() =>
  props.inventoryRows.map((item) => ({
    id: item.id,
    itemCode: item.itemCode,
    productCode: buildProductCode(item),
    parentCategory: item.parentCategory,
    childCategory: item.childCategory,
    itemName: item.itemName,
    unitPrice: resolveEstimatedUnitPrice(item),
    materials: Array.isArray(item.materials) ? item.materials : [],
    quantity: Number(item.quantity) || 0,
    weight: `${Number(item.weightKg || 0).toFixed(1)}kg`,
  })),
)

const normalizedInventoryData = computed(() =>
  circularStockData.value.map(item => ({
    ...item,
    materials: item.materials.map(material => ({
      ...material,
      name: normalizeMaterialName(material.name),
    })),
  })),
)

const materialFilterSummary = computed(() => {
  if (activeMaterialFilters.value.length === 0) return '소재 조건 없음'

  const [firstFilter] = activeMaterialFilters.value
  const materialLabel = firstFilter.material
    ? `${firstFilter.materialGroup || '소재 구분'} / ${firstFilter.material}`
    : (firstFilter.materialGroup || '소재 구분')
  const firstLabel = firstFilter.material && firstFilter.minRatio
    ? `${materialLabel} ${firstFilter.minRatio}% 이상`
    : materialLabel
  const restCount = activeMaterialFilters.value.length - 1

  return restCount > 0 ? `${firstLabel} 외 ${restCount}건` : firstLabel
})

const skuInventoryData = computed(() => {
  const partitionRatios = [
    0.08, 0.05, 0.06, 0.05, 0.04,
    0.07, 0.06, 0.07, 0.06, 0.05,
    0.05, 0.04, 0.05, 0.04, 0.04,
    0.06, 0.04, 0.05, 0.04, 0.05,
  ]

  return normalizedInventoryData.value.flatMap((item) => {
    const totalWeight = parseWeight(item.weight)
    const sourceQuantity = Math.max(0, Number(item.quantity) || 0)
    if (sourceQuantity <= 0 || totalWeight <= 0) {
      return []
    }
    const perUnitWeight = totalWeight / sourceQuantity
    const distributedQuantities = distributeWeightedIntegerByRatios(sourceQuantity, partitionRatios, String(item.id))

    return colorOptions.flatMap((color, colorIndex) =>
      sizeOptions.map((size, sizeIndex) => {
        const partitionIndex = colorIndex * sizeOptions.length + sizeIndex
        const quantity = distributedQuantities[partitionIndex] ?? 0
        if (quantity <= 0) {
          return null
        }
        const skuWeight = quantity * perUnitWeight

        return {
          id: `${item.id}-${color}-${size}`,
          inventoryId: item.id,
          skuCode: `${item.productCode}-${colorCodeMap[color]}-${size}`,
          productCode: item.productCode,
          itemCode: item.itemCode,
          itemName: item.itemName,
          color,
          size,
          materials: item.materials,
          unitPrice: item.unitPrice,
          quantity,
          weight: `${skuWeight.toFixed(1)}kg`,
        }
      }),
    ).filter(Boolean)
  })
})

const filteredRowsBase = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return skuInventoryData.value
    .map(item => ({
      ...item,
      materialType: deriveMaterialType(item.materials),
      materialDetail: formatMaterialDetail(item.materials),
      materialKgPrice: resolveMaterialKgPrice(item.materials),
      circularSalePrice: resolveCircularSalePrice(item),
    }))
    .filter((item) => {
      const matchesMaterial = activeMaterialFilters.value.every((filter) => {
        if (!filter.materialGroup) return false

        const matchesGroup = filter.materialGroup === '혼방'
          ? item.materialType === '혼방'
          : item.materialType === filter.materialGroup
        if (!matchesGroup) return false

        if (!filter.material) return true

        const itemMaterial = item.materials.find(material => material.name === filter.material)
        if (!itemMaterial) return false

        const minRatio = Number(filter.minRatio) || 0
        return minRatio === 0 || itemMaterial.ratio >= minRatio
      })

      const matchesSearch = !keyword || [item.itemCode, item.itemName, item.materialDetail]
        .join(' ')
        .toLowerCase()
        .includes(keyword)

      return matchesMaterial && matchesSearch
    })
})

const filteredRows = computed(() => {
  const rows = [...filteredRowsBase.value]
  if (!sortKey.value) return rows

  return rows.sort((a, b) => {
    const aValue = sortKey.value === 'weight'
      ? parseWeight(a.weight)
      : sortKey.value === 'materialKgPrice'
        ? a.materialKgPrice
      : sortKey.value === 'circularSalePrice'
        ? a.circularSalePrice
      : sortKey.value === 'unitPrice'
        ? a.unitPrice
      : sortKey.value === 'skuCode'
        ? a.skuCode
        : a[sortKey.value]
    const bValue = sortKey.value === 'weight'
      ? parseWeight(b.weight)
      : sortKey.value === 'materialKgPrice'
        ? b.materialKgPrice
      : sortKey.value === 'circularSalePrice'
        ? b.circularSalePrice
      : sortKey.value === 'unitPrice'
        ? b.unitPrice
      : sortKey.value === 'skuCode'
        ? b.skuCode
        : b[sortKey.value]
    const direction = sortDirection.value === 'asc' ? 1 : -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue, 'ko') * direction
    }

    return (aValue - bValue) * direction
  })
})

const filteredItemCount = computed(() =>
  new Set(filteredRows.value.map(item => item.itemCode)).size,
)

const isAllVisibleSelected = computed(() =>
  filteredRows.value.length > 0
  && filteredRows.value.every(item => props.selectedRowIds.includes(item.id)),
)

const visibleDataColumnCount = computed(() => {
  let count = 4 // SKU, 품목명, 소재 구분, 수량
  if (props.showCircularSalePriceColumn) count += 1
  if (visibleColumns.value.color) count += 1
  if (visibleColumns.value.size) count += 1
  if (visibleColumns.value.perItemWeight) count += 1
  count += 3 // 소재 상세, 단가, 무게 (항상 표시)
  return count
})

function normalizeMaterialName(name) {
  const normalized = String(name ?? '').trim()
  const lower = normalized.toLowerCase()
  return materialNameAliasMap[lower] ?? materialNameAliasMap[normalized] ?? normalized
}

function buildProductCode(item) {
  const categoryCodeMap = {
    상의: 'TOP',
    바지: 'PNT',
    치마: 'SKT',
    아우터: 'OUT',
  }
  const childCategoryCodeMap = {
    반팔: 'SS',
    긴팔: 'LS',
    셔츠: 'SH',
    니트: 'KN',
    후드티: 'HD',
    청바지: 'DN',
    반바지: 'ST',
    긴바지: 'LG',
    트레이닝: 'TR',
    미니스커트: 'MN',
    롱스커트: 'LG',
    패딩: 'PD',
    후드집업: 'HZ',
    자켓: 'JK',
    가디건: 'CD',
  }

  const categoryCode = categoryCodeMap[item.parentCategory] ?? 'ETC'
  const childCode = childCategoryCodeMap[item.childCategory] ?? 'GEN'
  const numericPart = String(item.id ?? '').replace(/\D/g, '').padStart(3, '0').slice(-3)
  return `PRD-${categoryCode}-${childCode}-${numericPart}`
}

function distributeWeightedIntegerByRatios(total, ratios, seedText = '') {
  if (!Number.isFinite(total) || total <= 0) {
    return ratios.map(() => 0)
  }

  const weightedRatios = ratios.map((ratio, index) => {
    const variance = 0.8 + ((index * 11 + String(seedText).length * 7) % 6) * 0.1
    return ratio * variance
  })
  const ratioSum = weightedRatios.reduce((sum, value) => sum + value, 0) || 1
  const base = weightedRatios.map((ratio) => (total * ratio) / ratioSum)
  const quantities = base.map(value => Math.floor(value))
  let remainder = total - quantities.reduce((sum, value) => sum + value, 0)

  const seed = String(seedText).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const rankedIndexes = base
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
      tieBreaker: (seed + index * 17) % 97,
    }))
    .sort((a, b) => (
      b.fraction - a.fraction
      || a.tieBreaker - b.tieBreaker
      || a.index - b.index
    ))

  let cursor = 0
  while (remainder > 0 && rankedIndexes.length > 0) {
    const target = rankedIndexes[cursor % rankedIndexes.length]
    quantities[target.index] += 1
    remainder -= 1
    cursor += 1
  }

  return quantities
}

function resolveEstimatedUnitPrice(item) {
  const baseWeight = Number(item.weightKg) || 0
  const quantity = Number(item.quantity) || 0
  const materialPrice = resolveMaterialKgPrice(item.materials)
  const perItemWeight = quantity > 0 ? baseWeight / quantity : 0
  return Math.round(perItemWeight * materialPrice * 5)
}

function deriveMaterialType(materials) {
  if (!Array.isArray(materials) || materials.length === 0) return '혼방'
  if (materials.length >= 2) return '혼방'

  const [single] = materials
  const isPureSingle = Number(single.ratio) === 100
  if (!isPureSingle) return '혼방'

  if (naturalSingleMaterials.includes(single.name)) return '천연 단일 섬유'
  if (syntheticMaterials.includes(single.name)) return '합성 섬유'
  return '혼방'
}

function formatMaterialDetail(materials) {
  if (!Array.isArray(materials) || materials.length === 0) return '-'
  const sorted = [...materials].sort((a, b) => b.ratio - a.ratio)
  if (sorted.length === 1 && Number(sorted[0].ratio) === 100) return `${sorted[0].name} 100%`
  if (sorted.length >= 3) {
    const primary = sorted[0]
    const restRatio = sorted.slice(1).reduce((sum, material) => sum + Number(material.ratio || 0), 0)
    return `${primary.name} ${primary.ratio}% + 기타 ${restRatio}%`
  }
  return sorted.map(material => `${material.name} ${material.ratio}%`).join(' + ')
}

function parseWeight(weight) {
  return Number(String(weight).replace('kg', '')) || 0
}

function formatCurrency(value) {
  return `₩${Number(value || 0).toLocaleString()}`
}

function formatPerItemWeight(weight, quantity) {
  if (!quantity || quantity <= 0) return '0kg'
  const perItemWeight = parseWeight(weight) / quantity
  return `${perItemWeight.toFixed(2)}kg`
}

function resolveMaterialKgPrice(materials) {
  const materialType = deriveMaterialType(materials)
  if (materialType === '혼방') return blendKgPrice

  const [single] = Array.isArray(materials) ? materials : []
  if (!single) return blendKgPrice
  return materialKgPriceMap[single.name] ?? blendKgPrice
}

function resolveCircularSalePrice(item) {
  const kgPrice = resolveMaterialKgPrice(item.materials)
  const weight = parseWeight(item.weight)
  return Math.round(weight * kgPrice)
}

function isMaterialDisabled(material, index) {
  const currentFilter = materialFilters.value[index]
  return materialFilters.value.some((filter, filterIndex) =>
    filterIndex !== index
    && filter.materialGroup === currentFilter?.materialGroup
    && filter.material === material,
  )
}

function addMaterialFilter() {
  const maxFilterCount = materialGroupOptions.length + materialOptions.length
  if (materialFilters.value.length >= maxFilterCount) return
  materialFilters.value = [...materialFilters.value, { materialGroup: '', material: '', minRatio: '' }]
}

function removeMaterialFilter(index) {
  materialFilters.value = materialFilters.value.filter((_, filterIndex) => filterIndex !== index)
}

function clearMaterialFilters() {
  materialFilters.value = []
}

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = 'asc'
}

function sortIcon(key) {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

function resetFilters() {
  searchTerm.value = ''
  materialFilters.value = []
  isMaterialDropdownOpen.value = false
}

function handleDocumentClick(event) {
  if (!materialDropdownRef.value?.contains(event.target)) {
    isMaterialDropdownOpen.value = false
  }
}

function handleRowClick(row) {
  if (!props.enableRowClick) return
  emit('row-click', row)
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <section class="border border-gray-200 bg-white p-4 shadow-sm">
      <div class="grid items-end gap-3 xl:grid-cols-[minmax(24rem,1fr)_minmax(16rem,1fr)_auto]">
        <div ref="materialDropdownRef" class="relative flex flex-col gap-1.5">
          <span class="text-[11px] font-bold text-gray-500">소재 조건</span>
          <button
            type="button"
            class="flex h-9 w-full items-center justify-between gap-2 border border-gray-300 bg-white px-3 text-left text-xs font-bold text-gray-900 outline-none transition hover:bg-[#EBF5F5] focus:border-[#004D3C]"
            @click="isMaterialDropdownOpen = !isMaterialDropdownOpen"
          >
            <span
              class="min-w-0 truncate px-2 py-1 text-[11px]"
              :class="activeMaterialFilters.length > 0 ? 'bg-[#EBF5F5] text-[#004D3C]' : 'text-gray-500'"
            >
              {{ materialFilterSummary }}
            </span>
            <span class="shrink-0 text-[10px] text-gray-500">{{ isMaterialDropdownOpen ? '▲' : '▼' }}</span>
          </button>

          <div
            v-if="isMaterialDropdownOpen"
            class="absolute left-0 top-full z-30 mt-1 w-[min(26rem,calc(100vw-2rem))] border border-gray-200 bg-white p-3 shadow-lg xl:w-full xl:min-w-[26rem]"
          >
            <div class="flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
              <div>
                <p class="text-xs font-black text-gray-900">소재 조건</p>
                <p class="mt-0.5 text-[10px] font-bold text-gray-400">여러 조건을 모두 만족하는 항목만 조회합니다.</p>
              </div>
              <button
                type="button"
                class="text-[10px] font-black text-gray-500 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300"
                :disabled="materialFilters.length === 0"
                @click="clearMaterialFilters"
              >
                전체 해제
              </button>
            </div>

            <div class="mt-3 max-h-56 space-y-2 overflow-y-auto">
              <div
                v-for="(filter, index) in materialFilters"
                :key="index"
                class="grid grid-cols-[minmax(8rem,1fr)_minmax(8rem,1fr)_6rem_auto_2rem] items-center gap-2"
              >
                <select
                  v-model="filter.materialGroup"
                  class="h-8 border border-gray-200 bg-gray-50 px-2 text-[11px] font-bold text-gray-900 outline-none focus:border-[#004D3C] focus:bg-white"
                  @change="filter.material = ''"
                >
                  <option value="">소재 구분 선택</option>
                  <option v-for="group in materialGroupOptions" :key="group" :value="group">
                    {{ group }}
                  </option>
                </select>

                <select
                  v-model="filter.material"
                  class="h-8 border border-gray-200 bg-gray-50 px-2 text-[11px] font-bold text-gray-900 outline-none focus:border-[#004D3C] focus:bg-white"
                  :disabled="!filter.materialGroup"
                >
                  <option value="">소재 상세 선택</option>
                  <option
                    v-for="material in (materialOptionsByGroup[filter.materialGroup] ?? [])"
                    :key="material"
                    :value="material"
                    :disabled="isMaterialDisabled(material, index)"
                  >
                    {{ material }}
                  </option>
                </select>

                <input
                  v-model="filter.minRatio"
                  type="number"
                  min="0"
                  max="100"
                  class="h-8 border border-gray-200 bg-gray-50 px-2 text-right text-[11px] font-bold text-gray-900 outline-none focus:border-[#004D3C] focus:bg-white"
                  placeholder="0"
                />
                <span class="text-[10px] font-black text-gray-400">% 이상</span>
                <button
                  type="button"
                  class="h-8 border border-gray-200 text-[12px] font-black text-gray-400 hover:bg-gray-50 hover:text-black"
                  :aria-label="`${index + 1}번째 소재 조건 제거`"
                  @click="removeMaterialFilter(index)"
                >
                  ×
                </button>
              </div>

              <div
                v-if="materialFilters.length === 0"
                class="border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-[11px] font-bold text-gray-400"
              >
                추가된 소재 조건이 없습니다.
              </div>
            </div>

            <button
              type="button"
              class="mt-3 h-8 w-full border border-[#D6EAEA] bg-[#EBF5F5] text-xs font-black text-[#004D3C] transition hover:bg-[#dff0f0] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              :disabled="materialFilters.length >= materialGroupOptions.length + materialOptions.length"
              @click="addMaterialFilter"
            >
              + 조건 추가
            </button>
          </div>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-[11px] font-bold text-gray-500">검색</span>
          <input
            v-model="searchTerm"
            type="search"
            class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
            placeholder="품목 코드, 품목명, 소재 상세"
          />
        </label>

        <button
          type="button"
          class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
          @click="resetFilters"
        >
          초기화
        </button>
      </div>
    </section>

    <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h2 class="text-sm font-black text-gray-900">{{ title }}</h2>
          <p v-if="description" class="mt-1 text-[11px] font-bold text-gray-400">{{ description }}</p>
          <p class="mt-1 text-[11px] font-bold text-gray-400">
            조회 품목 {{ filteredItemCount.toLocaleString() }}건 · 조회 SKU {{ filteredRows.length.toLocaleString() }}건
            <template v-if="summaryText"> · {{ summaryText }}</template>
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-[11px] font-bold text-gray-500">
          <span class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">열 표시</span>
          <label class="inline-flex items-center gap-1.5">
            <input v-model="visibleColumns.color" type="checkbox" class="h-3.5 w-3.5 accent-[#004D3C]">
            색상
          </label>
          <label class="inline-flex items-center gap-1.5">
            <input v-model="visibleColumns.size" type="checkbox" class="h-3.5 w-3.5 accent-[#004D3C]">
            사이즈
          </label>
          <label class="inline-flex items-center gap-1.5">
            <input v-model="visibleColumns.perItemWeight" type="checkbox" class="h-3.5 w-3.5 accent-[#004D3C]">
            개당 무게
          </label>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] table-fixed border-collapse text-left text-xs">
          <colgroup>
            <col v-if="hasActionColumn && actionColumnPosition === 'start'" class="w-[4%]" />
            <col class="w-[14%]" />
            <col class="w-[14%]" />
            <col v-if="visibleColumns.color" class="w-[5%]" />
            <col v-if="visibleColumns.size" class="w-[6%]" />
            <col class="w-[10%]" />
            <col class="w-[17%]" />
            <col class="w-[7%]" />
            <col v-if="props.showCircularSalePriceColumn" class="w-[9%]" />
            <col class="w-[9%]" />
            <col class="w-[7%]" />
            <col v-if="visibleColumns.perItemWeight" class="w-[8%]" />
            <col v-if="hasActionColumn && actionColumnPosition === 'end'" class="w-[9%]" />
          </colgroup>
          <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
            <tr>
              <th v-if="hasActionColumn && actionColumnPosition === 'start'" class="w-10 px-3 py-3 text-center font-black">
                <slot
                  name="header-action"
                  :rows="filteredRows"
                  :is-all-visible-selected="isAllVisibleSelected"
                >
                  {{ actionColumnLabel }}
                </slot>
              </th>
              <th class="sticky left-0 z-20 bg-gray-50 px-3 py-3 font-black">
                <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('skuCode')">
                  SKU 코드
                  <span class="text-[9px]">{{ sortIcon('skuCode') }}</span>
                </button>
              </th>
              <th class="sticky left-[170px] z-20 bg-gray-50 px-3 py-3 font-black">품목명</th>
              <th v-if="visibleColumns.color" class="px-3 py-3 text-center font-black">색상</th>
              <th v-if="visibleColumns.size" class="px-3 py-3 text-center font-black">사이즈</th>
              <th class="px-3 py-3 font-black">소재 구분</th>
              <th class="px-3 py-3 font-black">소재 상세</th>
              <th class="px-3 py-3 text-right font-black">
                <button type="button" class="flex w-full items-center justify-end gap-1 hover:text-gray-900" @click="toggleSort('quantity')">
                  수량
                  <span class="text-[9px]">{{ sortIcon('quantity') }}</span>
                </button>
              </th>
              <th class="px-3 py-3 text-right font-black">
                <button type="button" class="flex w-full items-center justify-end gap-1 hover:text-gray-900" @click="toggleSort('materialKgPrice')">
                  kg 당 단가
                  <span class="text-[9px]">{{ sortIcon('materialKgPrice') }}</span>
                </button>
              </th>
              <th v-if="props.showCircularSalePriceColumn" class="px-3 py-3 text-right font-black">
                <button type="button" class="flex w-full items-center justify-end gap-1 hover:text-gray-900" @click="toggleSort('circularSalePrice')">
                  환산 금액
                  <span class="text-[9px]">{{ sortIcon('circularSalePrice') }}</span>
                </button>
              </th>
              <th class="px-3 py-3 text-right font-black">
                <button type="button" class="flex w-full items-center justify-end gap-1 hover:text-gray-900" @click="toggleSort('weight')">
                  총 무게
                  <span class="text-[9px]">{{ sortIcon('weight') }}</span>
                </button>
              </th>
              <th v-if="visibleColumns.perItemWeight" class="px-3 py-3 text-right font-black">개당 무게</th>
              <th v-if="hasActionColumn && actionColumnPosition === 'end'" class="px-3 py-3 text-center font-black">
                <slot name="header-action" :rows="filteredRows" :is-all-visible-selected="isAllVisibleSelected">
                  {{ actionColumnLabel }}
                </slot>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="item in filteredRows"
              :key="item.id"
              class="transition-colors"
              :class="[
                highlightedRowIds.includes(item.id) || highlightedInventoryIds.includes(item.inventoryId)
                  ? 'bg-[#EBF5F5] font-bold'
                  : hoveredRowId === item.id
                    ? 'bg-[#EBF5F5]/60'
                    : '',
                enableRowClick ? 'cursor-pointer' : '',
              ]"
              @mouseenter="hoveredRowId = item.id"
              @mouseleave="hoveredRowId = null"
              @click="handleRowClick(item)"
            >
              <td v-if="hasActionColumn && actionColumnPosition === 'start'" class="px-3 py-3 text-center">
                <slot
                  name="row-action"
                  :row="item"
                  :selected="selectedRowIds.includes(item.id)"
                  :highlighted="highlightedRowIds.includes(item.id) || highlightedInventoryIds.includes(item.inventoryId)"
                />
              </td>
              <td
                class="sticky left-0 z-10 whitespace-nowrap px-3 py-3 font-mono font-bold text-gray-600 transition-colors"
                :class="highlightedRowIds.includes(item.id) || highlightedInventoryIds.includes(item.inventoryId)
                  ? 'bg-[#EBF5F5]'
                  : hoveredRowId === item.id
                    ? 'bg-[#EBF5F5]/60'
                    : 'bg-white'"
              >{{ item.skuCode }}</td>
              <td
                class="sticky left-[170px] z-10 truncate px-3 py-3 font-black text-gray-900 transition-colors"
                :class="highlightedRowIds.includes(item.id) || highlightedInventoryIds.includes(item.inventoryId)
                  ? 'bg-[#EBF5F5]'
                  : hoveredRowId === item.id
                    ? 'bg-[#EBF5F5]/60'
                    : 'bg-white'"
              >{{ item.itemName }}</td>
              <td v-if="visibleColumns.color" class="px-3 py-3 text-center font-black text-gray-900">{{ item.color }}</td>
              <td v-if="visibleColumns.size" class="px-3 py-3 text-center font-black text-gray-900">{{ item.size }}</td>
              <td class="px-3 py-3 font-black text-gray-900">{{ item.materialType }}</td>
              <td class="truncate px-3 py-3 font-black text-gray-900">{{ item.materialDetail }}</td>
              <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.quantity.toLocaleString() }}</td>
              <td class="px-3 py-3 text-right font-black text-gray-900">{{ formatCurrency(item.materialKgPrice) }}</td>
              <td v-if="props.showCircularSalePriceColumn" class="px-3 py-3 text-right font-black text-gray-900">
                {{ formatCurrency(item.circularSalePrice) }}
              </td>
              <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.weight }}</td>
              <td v-if="visibleColumns.perItemWeight" class="px-3 py-3 text-right font-black text-gray-900">{{ formatPerItemWeight(item.weight, item.quantity) }}</td>
              <td v-if="hasActionColumn && actionColumnPosition === 'end'" class="px-3 py-3 text-center">
                <slot
                  name="row-action"
                  :row="item"
                  :selected="selectedRowIds.includes(item.id)"
                  :highlighted="highlightedRowIds.includes(item.id) || highlightedInventoryIds.includes(item.inventoryId)"
                />
              </td>
            </tr>
            <tr v-if="filteredRows.length === 0">
              <td :colspan="visibleDataColumnCount + (hasActionColumn ? 1 : 0)" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                조건에 맞는 순환 재고가 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

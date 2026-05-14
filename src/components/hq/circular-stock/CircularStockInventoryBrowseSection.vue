<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { getInfrastructures } from '@/api/hq/infrastructure.js'

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
  useFixedColumnWidths: {
    type: Boolean,
    default: false,
  },
  pinLeadColumns: {
    type: Boolean,
    default: true,
  },
  serverMode: {
    type: Boolean,
    default: false,
  },
  page: {
    type: Number,
    default: 0,
  },
  size: {
    type: Number,
    default: 20,
  },
  totalPages: {
    type: Number,
    default: 0,
  },
  totalElements: {
    type: Number,
    default: 0,
  },
  inventoryRows: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['row-click', 'toggle-all-visible', 'query-change', 'page-change', 'size-change', 'sort-change'])
const slots = useSlots()

const searchTerm = ref('')
const selectedMaterialGroup = ref('')
const isMaterialGroupDropdownOpen = ref(false)
const materialGroupDropdownRef = ref(null)
const selectedMaterialNames = ref([])
const isMaterialDetailDropdownOpen = ref(false)
const materialDetailDropdownRef = ref(null)
const selectedWarehouseCodes = ref([])
const warehouseOptions = ref([])
const isWarehouseDropdownOpen = ref(false)
const warehouseDropdownRef = ref(null)
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

const hasActionColumn = computed(() => Boolean(slots['header-action'] || slots['row-action']))

const selectedWarehouseNames = computed(() =>
  warehouseOptions.value
    .filter(option => selectedWarehouseCodes.value.includes(option.code))
    .map(option => option.name),
)
const warehouseSummaryLabel = computed(() => {
  if (selectedWarehouseCodes.value.length === 0) return '전체 창고'
  if (selectedWarehouseCodes.value.length === 1) return selectedWarehouseNames.value[0]
  return `${selectedWarehouseCodes.value.length}개 창고 선택됨`
})
const materialGroupSummaryLabel = computed(() =>
  selectedMaterialGroup.value || '전체',
)
const materialDetailSummaryLabel = computed(() => {
  const count = selectedMaterialNames.value.length
  if (count === 0) return '전체'
  if (count === 1) return selectedMaterialNames.value[0]
  return `${count}개 선택`
})
const COLOR_LABEL_BY_CODE = {
  BLK: '검정',
  WHT: '흰색',
  NVY: '네이비',
  GRY: '그레이',
}

const pageSizeOptions = [20, 50, 100]
const pageNumbers = computed(() => {
  if (!props.serverMode || props.totalPages <= 0) return []
  const current = props.page + 1
  const start = Math.max(1, current - 2)
  const end = Math.min(props.totalPages, start + 4)
  const adjustedStart = Math.max(1, end - 4)
  return Array.from({ length: end - adjustedStart + 1 }, (_, idx) => adjustedStart + idx)
})

const normalizedInventoryData = computed(() =>
  (Array.isArray(props.inventoryRows) ? props.inventoryRows : [])
    .map((row) => {
      const compositions = Array.isArray(row.materialCompositions)
        ? row.materialCompositions
        : Array.isArray(row.materials) ? row.materials : []
      const materials = compositions.map(comp => ({
        name: normalizeMaterialName(comp.materialNameKo ?? comp.name ?? ''),
        ratio: Number(comp.ratio ?? 0),
      }))
      const totalWeightKg = Number(row.totalWeightKg ?? row.weightKg ?? 0)
      const availableQuantity = Number(row.availableQuantity ?? row.quantity ?? 0)
      const materialKgPrice = Number(row.materialKgPrice ?? resolveMaterialKgPrice(materials))

      return {
        id: String(row.id ?? row.inventoryId ?? ''),
        inventoryId: String(row.inventoryId ?? row.id ?? ''),
        skuCode: String(row.skuCode ?? ''),
        itemCode: String(row.itemCode ?? ''),
        itemName: String(row.itemName ?? ''),
        warehouseCode: String(row.warehouseCode ?? ''),
        warehouseName: String(row.warehouseName ?? ''),
        parentCategory: String(row.parentCategory ?? ''),
        childCategory: String(row.childCategory ?? ''),
        color: String(row.color ?? ''),
        colorLabel: COLOR_LABEL_BY_CODE[String(row.color ?? '').toUpperCase()] ?? String(row.color ?? ''),
        size: String(row.size ?? ''),
        materialType: String(row.materialType ?? deriveMaterialType(materials)),
        materials,
        quantity: availableQuantity,
        weight: `${Number(totalWeightKg || 0).toFixed(3)}kg`,
        unitPrice: materialKgPrice,
        materialKgPrice,
        circularSalePrice: Number(row.circularSalePrice ?? Math.round(totalWeightKg * materialKgPrice)),
      }
    })
    .filter(row => row.skuCode && row.inventoryId),
)

const skuInventoryData = computed(() => normalizedInventoryData.value)

const filteredRowsBase = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return skuInventoryData.value
    .map(item => ({
      ...item,
      materialType: item.materialType || deriveMaterialType(item.materials),
      materialDetail: formatMaterialDetail(item.materials),
      materialKgPrice: Number(item.materialKgPrice ?? resolveMaterialKgPrice(item.materials)),
      circularSalePrice: Number(item.circularSalePrice ?? resolveCircularSalePrice(item)),
    }))
    .filter((item) => {
      const matchesGroup = !selectedMaterialGroup.value
        || item.materialType === selectedMaterialGroup.value
      const matchesMaterial = selectedMaterialNames.value.length === 0
        || item.materials.some(material => selectedMaterialNames.value.includes(material.name))

      const matchesSearch = !keyword || [item.itemCode, item.itemName, item.materialDetail]
        .join(' ')
        .toLowerCase()
        .includes(keyword)
      const matchesWarehouse = selectedWarehouseCodes.value.length === 0
        || selectedWarehouseCodes.value.includes(item.warehouseCode)

      return matchesGroup && matchesMaterial && matchesSearch && matchesWarehouse
    })
})

const filteredRows = computed(() => {
  if (props.serverMode) return filteredRowsBase.value

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
  let count = 5 // SKU, 품목명, 창고, 소재 구분, 수량
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

function updateMaterialGroup(group) {
  selectedMaterialGroup.value = selectedMaterialGroup.value === group ? '' : group
  selectedMaterialNames.value = []
  isMaterialDetailDropdownOpen.value = false
  isMaterialGroupDropdownOpen.value = false
  emitQueryChange()
}

function clearMaterialGroup() {
  if (!selectedMaterialGroup.value) return
  selectedMaterialGroup.value = ''
  selectedMaterialNames.value = []
  isMaterialDetailDropdownOpen.value = false
  emitQueryChange()
}

function toggleMaterialName(name) {
  selectedMaterialNames.value = selectedMaterialNames.value.includes(name)
    ? selectedMaterialNames.value.filter(value => value !== name)
    : [...selectedMaterialNames.value, name]
  emitQueryChange()
}

function clearMaterialNames() {
  if (selectedMaterialNames.value.length === 0) return
  selectedMaterialNames.value = []
  emitQueryChange()
}

function toggleWarehouseDropdown() {
  isWarehouseDropdownOpen.value = !isWarehouseDropdownOpen.value
}

function toggleWarehouseCode(code) {
  selectedWarehouseCodes.value = selectedWarehouseCodes.value.includes(code)
    ? selectedWarehouseCodes.value.filter(value => value !== code)
    : [...selectedWarehouseCodes.value, code]
  emitQueryChange()
}

function clearWarehouseCodes() {
  selectedWarehouseCodes.value = []
  emitQueryChange()
}

function toggleSort(key) {
  if (props.serverMode) {
    const nextDirection = sortKey.value === key && sortDirection.value === 'asc' ? 'desc' : 'asc'
    sortKey.value = key
    sortDirection.value = nextDirection
    emit('sort-change', { sort: `${key},${nextDirection}` })
    return
  }

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
  selectedMaterialGroup.value = ''
  isMaterialGroupDropdownOpen.value = false
  selectedMaterialNames.value = []
  isMaterialDetailDropdownOpen.value = false
  selectedWarehouseCodes.value = []
  isWarehouseDropdownOpen.value = false
  if (props.serverMode) {
    emit('query-change', {
      keyword: '',
      warehouseCodes: [],
      materialGroup: '',
      materialName: '',
      materialNames: [],
    })
  }
}

function handleDocumentClick(event) {
  if (!materialGroupDropdownRef.value?.contains(event.target)) {
    isMaterialGroupDropdownOpen.value = false
  }
  if (!materialDetailDropdownRef.value?.contains(event.target)) {
    isMaterialDetailDropdownOpen.value = false
  }
  if (!warehouseDropdownRef.value?.contains(event.target)) {
    isWarehouseDropdownOpen.value = false
  }
}

function handleRowClick(row) {
  if (!props.enableRowClick) return
  emit('row-click', row)
}

async function loadWarehouseOptions() {
  try {
    const rows = await getInfrastructures({ type: 'WAREHOUSE', status: 'ACTIVE' })
    warehouseOptions.value = Array.isArray(rows)
      ? rows
        .map(row => ({ code: String(row.code ?? ''), name: String(row.name ?? '') }))
        .filter(row => row.code && row.name)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      : []
  } catch {
    warehouseOptions.value = []
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
  loadWarehouseOptions()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})

function emitQueryChange() {
  if (!props.serverMode) return
  const materialName = selectedMaterialNames.value.length === 1
    ? selectedMaterialNames.value[0]
    : ''
  emit('query-change', {
    keyword: searchTerm.value.trim(),
    warehouseCodes: [...selectedWarehouseCodes.value],
    materialGroup: selectedMaterialGroup.value,
    materialName,
    materialNames: [...selectedMaterialNames.value],
  })
}

function goToPage(pageNumber) {
  if (!props.serverMode) return
  const nextPage = Math.max(0, pageNumber)
  if (nextPage === props.page) return
  emit('page-change', nextPage)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <section class="border border-gray-200 bg-white p-4 shadow-sm">
      <div class="grid items-end gap-3 xl:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(14rem,1fr)_minmax(16rem,1fr)_auto]">
        <div ref="materialGroupDropdownRef" class="relative flex flex-col gap-1.5">
          <span class="text-[11px] font-bold text-gray-500">소재 구분</span>
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-3 text-left text-xs font-bold text-gray-900 outline-none hover:bg-gray-50 focus:border-[#004D3C]"
            @click.stop="isMaterialGroupDropdownOpen = !isMaterialGroupDropdownOpen"
          >
            <span>{{ materialGroupSummaryLabel }}</span>
            <span class="float-right text-[11px] text-gray-500">{{ isMaterialGroupDropdownOpen ? '▲' : '▼' }}</span>
          </button>
          <div
            v-if="isMaterialGroupDropdownOpen"
            class="absolute top-[58px] z-20 w-full border border-gray-200 bg-white p-2 shadow-lg"
            @click.stop
          >
            <div class="mb-2 flex items-center justify-between">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Material Group</p>
              <button
                type="button"
                class="text-[10px] font-black text-gray-500 hover:text-gray-700"
                @click="clearMaterialGroup"
              >
                전체 해제
              </button>
            </div>
            <button
              v-for="group in materialGroupOptions"
              :key="group"
              type="button"
              class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] font-bold hover:bg-[#EBF5F5]/60"
              @click="updateMaterialGroup(group)"
            >
              <span class="text-gray-700">{{ group }}</span>
              <span v-if="selectedMaterialGroup === group" class="text-[#004D3C]">✓</span>
            </button>
          </div>
        </div>

        <div ref="materialDetailDropdownRef" class="relative flex flex-col gap-1.5">
          <span class="text-[11px] font-bold text-gray-500">소재 상세</span>
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-3 text-left text-xs font-bold text-gray-900 outline-none disabled:bg-gray-50 disabled:text-gray-400 focus:border-[#004D3C]"
            :disabled="!selectedMaterialGroup"
            @click.stop="isMaterialDetailDropdownOpen = !isMaterialDetailDropdownOpen"
          >
            <span>{{ materialDetailSummaryLabel }}</span>
            <span class="float-right text-[11px] text-gray-500">{{ isMaterialDetailDropdownOpen ? '▲' : '▼' }}</span>
          </button>
          <div
            v-if="isMaterialDetailDropdownOpen && selectedMaterialGroup"
            class="absolute top-[58px] z-20 w-full border border-gray-200 bg-white p-2 shadow-lg"
            @click.stop
          >
            <div class="mb-2 flex items-center justify-between">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Material</p>
              <button
                type="button"
                class="text-[10px] font-black text-gray-500 hover:text-gray-700"
                @click="clearMaterialNames"
              >
                전체 해제
              </button>
            </div>
            <label
              v-for="material in (materialOptionsByGroup[selectedMaterialGroup] ?? [])"
              :key="material"
              class="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 hover:bg-[#EBF5F5]/60"
            >
              <input
                type="checkbox"
                class="mt-0.5 h-3.5 w-3.5 accent-[#004D3C]"
                :checked="selectedMaterialNames.includes(material)"
                @change="toggleMaterialName(material)"
              />
              <span class="text-[11px] font-bold text-gray-700">{{ material }}</span>
            </label>
          </div>
        </div>

        <div ref="warehouseDropdownRef" class="relative flex flex-col gap-1.5">
          <span class="text-[11px] font-bold text-gray-500">창고</span>
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-3 text-left text-xs font-bold text-gray-900 outline-none hover:bg-gray-50 focus:border-[#004D3C]"
            @click.stop="toggleWarehouseDropdown"
          >
            <span>{{ warehouseSummaryLabel }}</span>
            <span class="float-right text-[11px] text-gray-500">{{ isWarehouseDropdownOpen ? '▲' : '▼' }}</span>
          </button>
          <div
            v-if="isWarehouseDropdownOpen"
            class="absolute top-[58px] z-20 w-full border border-gray-200 bg-white p-2 shadow-lg"
            @click.stop
          >
            <div class="mb-2 flex items-center justify-between">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Warehouse</p>
              <button
                type="button"
                class="text-[10px] font-black text-gray-500 hover:text-gray-700"
                @click="clearWarehouseCodes"
              >
                전체 해제
              </button>
            </div>
            <label
              v-for="option in warehouseOptions"
              :key="option.code"
              class="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 hover:bg-[#EBF5F5]/60"
            >
              <input
                type="checkbox"
                class="mt-0.5 h-3.5 w-3.5 accent-[#004D3C]"
                :checked="selectedWarehouseCodes.includes(option.code)"
                @change="toggleWarehouseCode(option.code)"
              />
              <span class="text-[11px] font-bold text-gray-700">{{ option.name }}</span>
            </label>
          </div>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-[11px] font-bold text-gray-500">검색</span>
          <input
            v-model="searchTerm"
            type="search"
            class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
            placeholder="품목 코드, 품목명, 소재 상세"
            @keyup.enter="emitQueryChange"
            @change="emitQueryChange"
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
            <template v-if="serverMode">
              전체 SKU {{ totalElements.toLocaleString() }}건 · 현재 페이지 {{ filteredRows.length.toLocaleString() }}건
            </template>
            <template v-else>
              조회 품목 {{ filteredItemCount.toLocaleString() }}건 · 조회 SKU {{ filteredRows.length.toLocaleString() }}건
            </template>
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
        <table
          class="w-full table-fixed border-collapse text-left text-xs"
          :class="props.useFixedColumnWidths ? 'min-w-max' : 'min-w-[980px]'"
        >
          <colgroup v-if="props.useFixedColumnWidths">
            <col v-if="hasActionColumn && actionColumnPosition === 'start'" class="w-[140px]" />
            <col class="w-[170px]" />
            <col class="w-[170px]" />
            <col class="w-[170px]" />
            <col v-if="visibleColumns.color" class="w-[80px]" />
            <col v-if="visibleColumns.size" class="w-[90px]" />
            <col class="w-[130px]" />
            <col class="w-[160px]" />
            <col class="w-[95px]" />
            <col class="w-[110px]" />
            <col v-if="props.showCircularSalePriceColumn" class="w-[110px]" />
            <col class="w-[95px]" />
            <col v-if="visibleColumns.perItemWeight" class="w-[95px]" />
            <col v-if="hasActionColumn && actionColumnPosition === 'end'" class="w-[140px]" />
          </colgroup>
          <colgroup v-else>
            <col v-if="hasActionColumn && actionColumnPosition === 'start'" class="w-[4%]" />
            <col class="w-[13%]" />
            <col class="w-[13%]" />
            <col class="w-[10%]" />
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
              <th
                class="px-3 py-3 font-black"
                :class="props.pinLeadColumns ? 'sticky left-0 z-20 bg-gray-50' : ''"
              >
                <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('skuCode')">
                  SKU 코드
                  <span class="text-[9px]">{{ sortIcon('skuCode') }}</span>
                </button>
              </th>
              <th
                class="px-3 py-3 font-black"
                :class="props.pinLeadColumns ? 'sticky left-[170px] z-20 bg-gray-50' : ''"
              >
                품목명
              </th>
              <th class="px-3 py-3 font-black">창고</th>
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
                class="whitespace-nowrap px-3 py-3 font-mono font-bold text-gray-600 transition-colors"
                :class="props.pinLeadColumns
                  ? (highlightedRowIds.includes(item.id) || highlightedInventoryIds.includes(item.inventoryId)
                    ? 'sticky left-0 z-10 bg-[#EBF5F5]'
                    : hoveredRowId === item.id
                      ? 'sticky left-0 z-10 bg-[#EBF5F5]/60'
                      : 'sticky left-0 z-10 bg-white')
                  : ''"
              >{{ item.skuCode }}</td>
              <td
                class="truncate px-3 py-3 font-black text-gray-900 transition-colors"
                :class="props.pinLeadColumns
                  ? (highlightedRowIds.includes(item.id) || highlightedInventoryIds.includes(item.inventoryId)
                    ? 'sticky left-[170px] z-10 bg-[#EBF5F5]'
                    : hoveredRowId === item.id
                      ? 'sticky left-[170px] z-10 bg-[#EBF5F5]/60'
                      : 'sticky left-[170px] z-10 bg-white')
                  : ''"
              >{{ item.itemName }}</td>
              <td class="px-3 py-3 font-bold text-gray-700">{{ item.warehouseName || '-' }}</td>
              <td v-if="visibleColumns.color" class="px-3 py-3 text-center font-black text-gray-900">{{ item.colorLabel }}</td>
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

      <div
        v-if="serverMode"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3"
      >
        <div class="flex items-center gap-2 text-xs font-bold text-gray-600">
          <span>페이지 크기</span>
          <select
            :value="size"
            class="h-8 border border-gray-300 bg-white px-2 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
            @change="emit('size-change', Number($event.target.value))"
          >
            <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="h-8 border border-gray-300 px-3 text-xs font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="page <= 0"
            @click="goToPage(page - 1)"
          >
            이전
          </button>
          <button
            v-for="num in pageNumbers"
            :key="num"
            type="button"
            class="h-8 min-w-8 border px-2 text-xs font-bold"
            :class="num - 1 === page ? 'border-[#004D3C] bg-[#004D3C] text-white' : 'border-gray-300 text-gray-700'"
            @click="goToPage(num - 1)"
          >
            {{ num }}
          </button>
          <button
            type="button"
            class="h-8 border border-gray-300 px-3 text-xs font-bold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="page >= totalPages - 1"
            @click="goToPage(page + 1)"
          >
            다음
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

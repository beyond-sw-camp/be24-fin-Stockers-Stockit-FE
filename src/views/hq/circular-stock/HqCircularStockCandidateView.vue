<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Info } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import PaginationNav from '@/components/common/PaginationNav.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { convertCircularCandidates, getCircularCandidates, refreshCircularCandidates } from '@/api/hq/inventory.js'
import { getInfrastructures } from '@/api/hq/infrastructure.js'

const auth = useAuthStore()
const hqMenus = roleMenus.hq
const circularStockMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 전환')
const hasRefreshed = ref(false)
const candidateSkus = ref([])
const selectedRowIds = ref([])
const selectedParentCategory = ref('')
const selectedChildCategory = ref('')
const selectedWarehouseCodes = ref([])
const selectedConditionCodes = ref([])
const searchTerm = ref('')
const warehouseOptions = ref([])
const isWarehouseDropdownOpen = ref(false)
const warehouseDropdownRef = ref(null)
const isConditionDropdownOpen = ref(false)
const conditionDropdownRef = ref(null)
const isLoading = ref(false)
const loadError = ref('')
const convertNotice = ref('')
const isConvertModalOpen = ref(false)
const isConverting = ref(false)
const conversionInputs = ref({})
const COLOR_LABEL_BY_CODE = {
  BLK: '검정',
  WHT: '흰색',
  NVY: '네이비',
  GRY: '그레이',
}

const PAGE_SIZE_OPTIONS = [20, 50, 100]
const pageSize = ref(20)
const currentPage = ref(1)
const totalPages = ref(1)
const totalElements = ref(0)
const sortKey = ref('convertibleStock')
const sortDirection = ref('desc')
const isBulkUpdatingFilters = ref(false)

const conditionItems = [
  {
    label: '최근 24개월 이상 판매 이력이 없는 SKU',
    description: '마지막 재고 이동일 기준 730일 이상 경과한 SKU입니다.',
  },
  {
    label: '안전재고 대비 초과 누적 SKU',
    description: '가용재고가 창고 안전재고의 2.5배를 초과하면 후보로 선별됩니다.',
  },
  {
    label: '극단 사이즈 재고 또는 특정 컬러 재고에 편중된 SKU',
    description: '같은 상품·창고 기준으로 특정 사이즈나 컬러의 가용재고 비중이 60%를 초과하면 후보로 선별됩니다.',
  },
]
const conditionOptions = computed(() =>
  conditionItems.map((item, index) => ({
    code: String(index + 1),
    label: item.label,
    description: item.description,
  })),
)
const selectedConditionLabels = computed(() =>
  conditionOptions.value
    .filter(option => selectedConditionCodes.value.includes(option.code))
    .map(option => `${option.code}. ${option.label}`),
)
const conditionSummaryLabel = computed(() => {
  if (selectedConditionCodes.value.length === 0) return '전체 조건'
  if (selectedConditionCodes.value.length === 1) return selectedConditionLabels.value[0]
  return `${selectedConditionCodes.value.length}개 조건 모두 만족`
})
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

const buildMatchedConditionIndexes = (matchedConditionCodes = []) =>
  matchedConditionCodes
    .map(code => Number(code))
    .filter(code => Number.isInteger(code) && code >= 1 && code <= conditionItems.length)

const buildMatchedConditionTooltip = (matchedConditionIndexes = []) =>
  matchedConditionIndexes
    .map(index => `${index}. ${conditionItems[index - 1]?.label ?? ''}`)
    .join(' / ')

const mapCandidateRow = (row) => {
  const matchedConditionIndexes = buildMatchedConditionIndexes(row.matchedConditionCodes)
  return {
    id: String(row.inventoryId ?? row.skuCode ?? ''),
    skuCode: String(row.skuCode ?? ''),
    itemCode: String(row.itemCode ?? ''),
    category: `${row.parentCategory ?? ''} > ${row.childCategory ?? ''}`.replace(/^ > | > $/g, ''),
    itemName: String(row.itemName ?? ''),
    warehouseCode: String(row.warehouseCode ?? ''),
    warehouseName: String(row.warehouseName ?? ''),
    color: String(row.color ?? ''),
    colorLabel: COLOR_LABEL_BY_CODE[String(row.color ?? '').toUpperCase()] ?? String(row.color ?? ''),
    size: String(row.size ?? ''),
    actualStock: Number(row.actualStock ?? 0),
    availableStock: Number(row.availableStock ?? 0),
    convertibleStock: Number(row.convertibleStock ?? 0),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toLocaleString('ko-KR', { hour12: false }) : '-',
    matchedConditionIndexes,
    matchedConditionLabel: matchedConditionIndexes.join('·'),
    matchedConditionTooltip: buildMatchedConditionTooltip(matchedConditionIndexes),
  }
}

const parseCategory = (categoryLabel) => {
  const [parent = '', child = ''] = String(categoryLabel ?? '').split('>').map(part => part.trim())
  return { parentCategory: parent, childCategory: child }
}

const parentCategoryOptions = computed(() =>
  [...new Set(candidateSkus.value.map(row => parseCategory(row.category).parentCategory).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ko')),
)

const childCategoryOptions = computed(() => {
  if (!selectedParentCategory.value) return []

  return [...new Set(
    candidateSkus.value
      .map((row) => {
        const parsed = parseCategory(row.category)
        return parsed.parentCategory === selectedParentCategory.value ? parsed.childCategory : ''
      })
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, 'ko'))
})

const sortedSkus = computed(() => candidateSkus.value)
const paginatedSkus = computed(() => sortedSkus.value)
const selectableRowIdsOnPage = computed(() =>
  paginatedSkus.value
    .filter(row => Number(row.convertibleStock ?? 0) > 0)
    .map(row => row.id),
)

const canConvertInventory = computed(() => selectedRowIds.value.length > 0)
const selectedRows = computed(() => {
  const selectedSet = new Set(selectedRowIds.value)
  return selectedRowsSnapshot.value.filter(row => selectedSet.has(row.id))
})

const conversionRows = computed(() =>
  selectedRows.value.map((row) => {
    const rawInput = conversionInputs.value[row.id]
    const quantity = Number(rawInput)
    const maxQuantity = Math.max(0, Number(row.convertibleStock ?? 0))
    const hasInvalidNumber = !Number.isInteger(quantity)
    const hasRangeError = quantity < 1 || quantity > maxQuantity
    const error = hasInvalidNumber
      ? '정수를 입력하세요.'
      : hasRangeError
        ? `1 ~ ${maxQuantity.toLocaleString()} 사이로 입력하세요.`
        : ''
    return {
      ...row,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      maxQuantity,
      error,
    }
  }),
)
const totalRequestedQuantity = computed(() =>
  conversionRows.value.reduce((sum, row) => sum + (row.error ? 0 : row.quantity), 0),
)
const canSubmitConversion = computed(() =>
  conversionRows.value.length > 0
  && !conversionRows.value.some(row => row.error),
)

const isAllCurrentPageSelected = computed(() =>
  selectableRowIdsOnPage.value.length > 0
  && selectableRowIdsOnPage.value.every(id => selectedRowIds.value.includes(id)),
)

const rangeStart = computed(() => {
  if (totalElements.value === 0) return 0
  return (currentPage.value - 1) * pageSize.value + 1
})
const rangeEnd = computed(() => {
  if (totalElements.value === 0) return 0
  return Math.min(rangeStart.value + paginatedSkus.value.length - 1, totalElements.value)
})

const selectedRowsSnapshot = ref([])
const mergeSelectedRowsSnapshot = (rows) => {
  const map = new Map(selectedRowsSnapshot.value.map(row => [row.id, row]))
  for (const row of rows) {
    if (selectedRowIds.value.includes(row.id)) {
      map.set(row.id, row)
    }
  }
  selectedRowsSnapshot.value = [...map.values()]
}
const syncSelectedRowsSnapshot = () => {
  const selectedSet = new Set(selectedRowIds.value)
  const currentPageMap = new Map(candidateSkus.value.map(row => [row.id, row]))
  const merged = new Map(selectedRowsSnapshot.value.map(row => [row.id, row]))

  for (const [id, row] of currentPageMap) {
    if (selectedSet.has(id)) {
      merged.set(id, row)
    } else {
      merged.delete(id)
    }
  }

  for (const id of [...merged.keys()]) {
    if (!selectedSet.has(id)) merged.delete(id)
  }

  selectedRowsSnapshot.value = [...merged.values()]
}

watch(selectedParentCategory, () => {
  selectedChildCategory.value = ''
})

watch([selectedParentCategory, selectedChildCategory, selectedWarehouseCodes, selectedConditionCodes], () => {
  if (!hasRefreshed.value || isBulkUpdatingFilters.value) return
  requestCandidates({ resetPage: true })
}, { deep: true })

const buildCandidateQueryParams = () => ({
  page: Math.max(0, currentPage.value - 1),
  size: pageSize.value,
  sort: `${sortKey.value},${sortDirection.value}`,
  keyword: searchTerm.value.trim() || undefined,
  parentCategory: selectedParentCategory.value || undefined,
  childCategory: selectedChildCategory.value || undefined,
  warehouseCodes: selectedWarehouseCodes.value.length > 0 ? selectedWarehouseCodes.value : undefined,
  conditionCodes: selectedConditionCodes.value.length > 0
    ? selectedConditionCodes.value.map(code => Number(code))
    : undefined,
})

const toggleWarehouseDropdown = () => {
  isWarehouseDropdownOpen.value = !isWarehouseDropdownOpen.value
}

const toggleWarehouseCode = (code) => {
  selectedWarehouseCodes.value = selectedWarehouseCodes.value.includes(code)
    ? selectedWarehouseCodes.value.filter(value => value !== code)
    : [...selectedWarehouseCodes.value, code]
}

const clearWarehouseCodes = () => {
  selectedWarehouseCodes.value = []
}

const toggleConditionDropdown = () => {
  isConditionDropdownOpen.value = !isConditionDropdownOpen.value
}

const toggleConditionCode = (code) => {
  selectedConditionCodes.value = selectedConditionCodes.value.includes(code)
    ? selectedConditionCodes.value.filter(value => value !== code)
    : [...selectedConditionCodes.value, code]
}

const clearConditionCodes = () => {
  selectedConditionCodes.value = []
}

const applySearch = () => {
  if (!hasRefreshed.value) return
  requestCandidates({ resetPage: true })
}

const changePageSize = (value) => {
  const next = Number(value)
  if (!PAGE_SIZE_OPTIONS.includes(next)) return
  pageSize.value = next
  // 페이지당 수가 바뀌면 항상 1페이지부터 다시 조회한다.
  requestCandidates({ resetPage: true })
}

const handleDocumentClick = (event) => {
  if (!warehouseDropdownRef.value?.contains(event.target)) {
    isWarehouseDropdownOpen.value = false
  }
  if (!conditionDropdownRef.value?.contains(event.target)) {
    isConditionDropdownOpen.value = false
  }
}

const loadWarehouseOptions = async () => {
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

const loadCandidates = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    const result = await getCircularCandidates(buildCandidateQueryParams())
    const rows = Array.isArray(result?.content) ? result.content : []
    candidateSkus.value = rows.map(mapCandidateRow)
    totalElements.value = Number(result?.totalElements ?? 0)
    totalPages.value = Math.max(1, Number(result?.totalPages ?? 1))
    currentPage.value = Number(result?.page ?? 0) + 1
    pageSize.value = Number(result?.size ?? pageSize.value)
    mergeSelectedRowsSnapshot(candidateSkus.value)
    hasRefreshed.value = true
  } catch (e) {
    loadError.value = e.message || '순환 재고 후보 조회에 실패했습니다.'
    candidateSkus.value = []
    totalElements.value = 0
    totalPages.value = 1
    hasRefreshed.value = true
  } finally {
    isLoading.value = false
  }
}

const requestCandidates = async ({ resetPage = false } = {}) => {
  // 후보 조회 화면은 내부적으로 1-based 페이지 상태를 사용하므로 리셋 목표는 page=1이다.
  if (resetPage) currentPage.value = 1
  await loadCandidates()
}

const refreshCandidates = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    await refreshCircularCandidates()
    isBulkUpdatingFilters.value = true
    selectedRowIds.value = []
    selectedParentCategory.value = ''
    selectedChildCategory.value = ''
    selectedWarehouseCodes.value = []
    selectedConditionCodes.value = []
    convertNotice.value = ''
    currentPage.value = 1
    pageSize.value = 20
    sortKey.value = 'convertibleStock'
    sortDirection.value = 'desc'
    selectedRowsSnapshot.value = []
    isBulkUpdatingFilters.value = false
    await requestCandidates()
  } catch (e) {
    loadError.value = e.message || '순환 재고 후보 갱신에 실패했습니다.'
    isBulkUpdatingFilters.value = false
  } finally {
    isLoading.value = false
  }
}

const openConvertModal = () => {
  if (!canConvertInventory.value) return
  syncSelectedRowsSnapshot()
  if (selectedRows.value.length === 0) {
    convertNotice.value = '선택된 전환 대상이 없습니다.'
    return
  }
  conversionInputs.value = Object.fromEntries(
    selectedRows.value.map(row => [row.id, Math.max(1, Number(row.convertibleStock ?? 0))]),
  )
  convertNotice.value = ''
  isConvertModalOpen.value = true
}

const closeConvertModal = () => {
  if (isConverting.value) return
  isConvertModalOpen.value = false
}

const submitConversion = async () => {
  if (!canSubmitConversion.value || isConverting.value) return

  isConverting.value = true
  convertNotice.value = ''
  try {
    const payload = conversionRows.value.map(row => ({
      inventoryId: Number(row.id),
      convertQuantity: row.quantity,
    }))
    const result = await convertCircularCandidates(payload)
    const convertedCount = Number(result?.convertedCount ?? 0)
    const skippedCount = Number(result?.skippedCount ?? 0)
    convertNotice.value = skippedCount > 0
      ? `부분 전환 완료: 성공 ${convertedCount}건, 실패 ${skippedCount}건`
      : `전환 완료: ${convertedCount}건`

    await requestCandidates()
    selectedRowIds.value = []
    selectedRowsSnapshot.value = []
    conversionInputs.value = {}
    isConvertModalOpen.value = false
  } catch (e) {
    convertNotice.value = e.message || '순환 재고 전환에 실패했습니다.'
  } finally {
    isConverting.value = false
  }
}

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
  requestCandidates({ resetPage: true })
}

const sortIcon = (key) => {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '▲' : '▼'
}

const toggleRow = (rowId) => {
  const row = candidateSkus.value.find(item => item.id === rowId)
  if (!row || Number(row.convertibleStock ?? 0) <= 0) return
  selectedRowIds.value = selectedRowIds.value.includes(rowId)
    ? selectedRowIds.value.filter(id => id !== rowId)
    : [...selectedRowIds.value, rowId]
  syncSelectedRowsSnapshot()
}

const toggleAllCurrentPage = () => {
  const pageRowIds = selectableRowIdsOnPage.value

  selectedRowIds.value = isAllCurrentPageSelected.value
    ? selectedRowIds.value.filter(id => !pageRowIds.includes(id))
    : [...new Set([...selectedRowIds.value, ...pageRowIds])]
  syncSelectedRowsSnapshot()
}

const changePage = (nextPageZeroBased) => {
  // PaginationNav(0-based) 값을 화면 내부 상태(1-based)로 변환한다.
  const total = Math.max(1, Number(totalPages.value || 1))
  const next = Math.min(Math.max(0, Number(nextPageZeroBased || 0)), total - 1)
  currentPage.value = next + 1
  requestCandidates()
}


onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  loadWarehouseOptions()
  loadCandidates()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 후보 조회</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">SKU 단위 후보를 조회하고 바로 순환 재고로 전환합니다.</p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
              :disabled="isLoading"
              @click="refreshCandidates"
            >
              {{ isLoading ? '갱신 중...' : '재고 새로고침' }}
            </button>
            <button
              type="button"
              class="h-9 px-4 text-xs font-black transition"
              :class="canConvertInventory ? 'bg-[#004D3C] text-white hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-100 text-gray-400'"
              :disabled="!canConvertInventory"
              @click="openConvertModal"
            >
              순환 재고로 전환
            </button>
          </div>
        </div>

        <div class="mt-4 border border-[#D6EAEA] bg-[#F7FBFB] px-3 py-3">
          <p class="text-[11px] font-black text-[#004D3C]">후보 조건</p>
          <p class="mt-1 text-[11px] font-bold text-gray-500">
            아래 조건에 해당하는 SKU를 우선 후보로 선별해 전환 검토합니다.
          </p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="(condition, index) in conditionItems"
              :key="condition.label"
              class="inline-flex items-center gap-1 bg-white px-2 py-1 text-[11px] font-bold text-gray-700 ring-1 ring-[#D6EAEA]"
            >
              {{ index + 1 }}. {{ condition.label }}
              <span class="group relative inline-flex">
                <button
                  type="button"
                  class="inline-flex h-4 w-4 items-center justify-center text-gray-400 outline-none hover:text-[#004D3C] focus:text-[#004D3C]"
                  aria-label="후보 조건 기준 보기"
                  @click.stop.prevent
                >
                  <Info class="h-3.5 w-3.5" :stroke-width="2.2" />
                </button>
                <span
                  class="invisible absolute left-1/2 top-full z-30 mt-1 w-[17.5rem] -translate-x-1/2 rounded bg-gray-900 px-3 py-2 text-[11px] font-bold leading-relaxed text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                  role="tooltip"
                >
                  {{ condition.description }}
                </span>
              </span>
            </span>
          </div>
        </div>
        <p v-if="loadError" class="mt-3 text-xs font-bold text-red-600">{{ loadError }}</p>
        <p v-if="convertNotice" class="mt-2 text-xs font-bold text-[#004D3C]">{{ convertNotice }}</p>
      </section>

      <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 class="text-sm font-black text-gray-900">전환 후보 SKU 리스트</h2>
            <p class="mt-1 text-[11px] font-bold text-gray-400">
              {{ hasRefreshed ? `조회 ${totalElements.toLocaleString()}건 · 선택 ${selectedRowIds.length.toLocaleString()}건` : '재고 새로고침 후 후보가 표시됩니다.' }}
            </p>
          </div>
        </div>

        <div
          v-if="hasRefreshed"
          class="grid gap-3 border-b border-gray-100 px-4 py-3 xl:grid-cols-[0.85fr_0.85fr_0.95fr_1.5fr_1.1fr]"
        >
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">대분류</span>
            <select
              v-model="selectedParentCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
            >
              <option value="">전체 대분류</option>
              <option v-for="category in parentCategoryOptions" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">소분류</span>
            <select
              v-model="selectedChildCategory"
              :disabled="!selectedParentCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-[#004D3C]"
            >
              <option value="">전체 소분류</option>
              <option v-for="category in childCategoryOptions" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

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

          <div ref="conditionDropdownRef" class="relative flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">후보 조건 (모두 만족)</span>
            <button
              type="button"
              class="h-9 border border-gray-300 bg-white px-3 text-left text-xs font-bold text-gray-900 outline-none hover:bg-gray-50 focus:border-[#004D3C]"
              @click.stop="toggleConditionDropdown"
            >
              <span>{{ conditionSummaryLabel }}</span>
              <span class="float-right text-[11px] text-gray-500">{{ isConditionDropdownOpen ? '▲' : '▼' }}</span>
            </button>

            <div
              v-if="isConditionDropdownOpen"
              class="absolute top-[58px] z-20 w-full border border-gray-200 bg-white p-2 shadow-lg"
              @click.stop
            >
              <div class="mb-2 flex items-center justify-between">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">AND 조건</p>
                <button
                  type="button"
                  class="text-[10px] font-black text-gray-500 hover:text-gray-700"
                  @click="clearConditionCodes"
                >
                  전체 해제
                </button>
              </div>
              <div
                v-for="option in conditionOptions"
                :key="option.code"
                class="flex items-start justify-between gap-2 rounded px-2 py-1.5 hover:bg-[#EBF5F5]/60"
              >
                <label class="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    class="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#004D3C]"
                    :checked="selectedConditionCodes.includes(option.code)"
                    @change="toggleConditionCode(option.code)"
                  />
                  <span class="text-[11px] font-bold text-gray-700">{{ option.code }}. {{ option.label }}</span>
                </label>
                <span class="group relative shrink-0">
                  <button
                    type="button"
                    class="mt-0.5 inline-flex h-4 w-4 items-center justify-center text-gray-400 outline-none hover:text-[#004D3C] focus:text-[#004D3C]"
                    aria-label="후보 조건 기준 보기"
                    @click.stop.prevent
                  >
                    <Info class="h-3.5 w-3.5" :stroke-width="2.2" />
                  </button>
                  <span
                    class="invisible absolute right-0 top-full z-30 mt-1 w-[17.5rem] rounded bg-gray-900 px-3 py-2 text-[11px] font-bold leading-relaxed text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                    role="tooltip"
                  >
                    {{ option.description }}
                  </span>
                </span>
              </div>
            </div>

          </div>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="SKU 코드, 품목 코드, 품목명"
              @keyup.enter="applySearch"
              @change="applySearch"
            />
          </label>
        </div>

        <div v-if="!hasRefreshed" class="flex min-h-64 flex-col items-center justify-center px-4 py-14 text-center">
          <p class="text-sm font-black text-gray-900">아직 조회된 순환 재고 후보가 없습니다.</p>
          <p class="mt-2 text-xs font-bold text-gray-400">상단의 재고 새로고침 버튼을 눌러 SKU 후보를 조회하세요.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-[1180px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="w-16 px-3 py-3 text-center font-black">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="isAllCurrentPageSelected"
                    @change="toggleAllCurrentPage"
                  />
                </th>
                <th class="px-3 py-3 font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('skuCode')">
                    SKU 코드
                    <span class="text-[9px]">{{ sortIcon('skuCode') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">카테고리</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">창고</th>
                <th class="px-3 py-3 text-center font-black">색상</th>
                <th class="px-3 py-3 text-center font-black">사이즈</th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('availableStock')">
                    가용재고
                    <span class="text-[9px]">{{ sortIcon('availableStock') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('convertibleStock')">
                    전환 가능 재고
                    <span class="text-[9px]">{{ sortIcon('convertibleStock') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 font-black">후보 조건</th>
                <th class="px-3 py-3 font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('updatedAt')">
                    최종 업데이트
                    <span class="text-[9px]">{{ sortIcon('updatedAt') }}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in paginatedSkus"
                :key="row.id"
                class="transition"
                :class="selectedRowIds.includes(row.id) ? 'bg-[#EBF5F5] font-bold' : 'hover:bg-[#EBF5F5]/60'"
                :style="Number(row.convertibleStock ?? 0) <= 0 ? 'cursor:not-allowed; opacity:0.6;' : 'cursor:pointer;'"
                @click="toggleRow(row.id)"
              >
                <td class="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="selectedRowIds.includes(row.id)"
                    :disabled="Number(row.convertibleStock ?? 0) <= 0"
                    @click.stop="toggleRow(row.id)"
                  />
                </td>
                <td class="px-3 py-3 font-mono font-bold text-gray-600">{{ row.skuCode }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.itemCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ row.category }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ row.warehouseName }}</td>
                <td class="px-3 py-3 text-center font-black text-gray-900">{{ row.colorLabel }}</td>
                <td class="px-3 py-3 text-center font-black text-gray-900">{{ row.size }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.convertibleStock.toLocaleString() }}</td>
                <td class="px-3 py-3" :title="row.matchedConditionTooltip">
                  <span class="inline-flex items-center bg-[#EBF5F5] px-2 py-1 text-[10px] font-black text-[#004D3C]">
                    {{ row.matchedConditionLabel }}
                  </span>
                </td>
                <td class="px-3 py-3 font-bold text-gray-500">{{ row.updatedAt }}</td>
              </tr>
              <tr v-if="paginatedSkus.length === 0">
                <td colspan="12" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                  조건에 맞는 순환 재고 후보가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="hasRefreshed"
          class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3"
        >
          <PaginationNav
            class="circular-pagination-nav"
            :page="Math.max(0, currentPage - 1)"
            :size="pageSize"
            :total-pages="totalPages"
            :total-elements="totalElements"
            :has-previous="currentPage > 1"
            :has-next="currentPage < totalPages"
            :size-options="PAGE_SIZE_OPTIONS"
            @update:page="changePage"
            @update:size="changePageSize"
          />
        </div>
      </section>
    </div>

    <div
      v-if="isConvertModalOpen"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 md:items-center"
    >
      <div class="w-full max-w-4xl border border-gray-200 bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p class="text-sm font-black text-gray-900">순환 재고 전환</p>
            <p class="mt-1 text-[11px] font-bold text-gray-500">
              선택 {{ conversionRows.length.toLocaleString() }}건 · 입력 합계 {{ totalRequestedQuantity.toLocaleString() }}개
            </p>
          </div>
          <button
            type="button"
            class="h-8 border border-gray-300 bg-white px-3 text-[11px] font-black text-gray-600 hover:bg-gray-50"
            :disabled="isConverting"
            @click="closeConvertModal"
          >
            닫기
          </button>
        </div>

        <div class="max-h-[58vh] overflow-y-auto p-4">
          <table class="w-full border-collapse text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.1em] text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-black">SKU</th>
                <th class="px-3 py-2 text-left font-black">창고</th>
                <th class="px-3 py-2 text-right font-black">전환 가능</th>
                <th class="px-3 py-2 text-right font-black">전환 수량</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in conversionRows" :key="`convert-${row.id}`">
                <td class="px-3 py-2 font-mono font-bold text-gray-700">{{ row.skuCode }}</td>
                <td class="px-3 py-2 font-bold text-gray-700">{{ row.warehouseName }}</td>
                <td class="px-3 py-2 text-right font-black text-gray-900">{{ row.maxQuantity.toLocaleString() }}</td>
                <td class="px-3 py-2">
                  <div class="flex flex-col items-end gap-1">
                    <input
                      v-model.number="conversionInputs[row.id]"
                      type="number"
                      min="1"
                      :max="row.maxQuantity"
                      class="h-8 w-32 border border-gray-300 px-2 text-right text-xs font-black text-gray-900 outline-none focus:border-[#004D3C]"
                    />
                    <span v-if="row.error" class="text-[10px] font-bold text-red-600">{{ row.error }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-100"
            :disabled="isConverting"
            @click="closeConvertModal"
          >
            취소
          </button>
          <button
            type="button"
            class="h-9 px-4 text-xs font-black text-white transition"
            :class="canSubmitConversion ? 'bg-[#004D3C] hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-300'"
            :disabled="!canSubmitConversion || isConverting"
            @click="submitConversion"
          >
            {{ isConverting ? '전환 중...' : '전환 확정' }}
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
:deep(.circular-pagination-nav) {
  /* 순환재고 전환(후보) 화면 전용 페이지네이션 배치 */
  display: grid;
  width: 100%;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

:deep(.circular-pagination-nav > p) {
  justify-self: start;
}

:deep(.circular-pagination-nav > div) {
  justify-self: center;
}

:deep(.circular-pagination-nav > label) {
  justify-self: end;
}
</style>

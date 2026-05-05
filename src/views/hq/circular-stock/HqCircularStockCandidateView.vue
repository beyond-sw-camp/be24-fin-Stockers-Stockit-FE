<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getCircularCandidates, refreshCircularCandidates } from '@/api/hq/inventory.js'
import { getInfrastructures } from '@/api/hq/infrastructure.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const circularStockMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 후보 조회')
const hasRefreshed = ref(false)
const candidateSkus = ref([])
const selectedSkuCodes = ref([])
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

const PAGE_SIZE = 20
const currentPage = ref(1)
const sortKey = ref('convertibleStock')
const sortDirection = ref('desc')

const conditionItems = [
  '최근 24개월 이상 판매 이력이 없는 SKU',
  '안전재고 대비 초과 누적 SKU',
  '극단 사이즈 재고 또는 특정 컬러 재고에 편중된 SKU',
]
const conditionOptions = computed(() =>
  conditionItems.map((label, index) => ({
    code: String(index + 1),
    label,
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
  return `${selectedConditionCodes.value.length}개 조건 선택됨`
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
    .map(index => `${index}. ${conditionItems[index - 1]}`)
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

const filteredSkus = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return candidateSkus.value.filter((row) => {
    const { parentCategory, childCategory } = parseCategory(row.category)
    const matchesParentCategory = !selectedParentCategory.value || parentCategory === selectedParentCategory.value
    const matchesChildCategory = !selectedChildCategory.value || childCategory === selectedChildCategory.value
    const matchesWarehouse = selectedWarehouseCodes.value.length === 0
      || selectedWarehouseCodes.value.includes(row.warehouseCode)
    const matchesCondition = selectedConditionCodes.value.length === 0
      || selectedConditionCodes.value.every(code => row.matchedConditionIndexes.includes(Number(code)))
    const matchesKeyword = !keyword
      || [row.skuCode, row.itemCode, row.itemName].join(' ').toLowerCase().includes(keyword)

    return matchesParentCategory && matchesChildCategory && matchesWarehouse && matchesCondition && matchesKeyword
  })
})

const sortedSkus = computed(() => {
  const rows = [...filteredSkus.value]
  const direction = sortDirection.value === 'asc' ? 1 : -1

  const getComparable = (row) => {
    switch (sortKey.value) {
      case 'skuCode':
        return row.skuCode
      case 'availableStock':
        return row.availableStock
      case 'convertibleStock':
        return row.convertibleStock
      case 'updatedAt':
        return row.updatedAt
      default:
        return row.convertibleStock
    }
  }

  rows.sort((a, b) => {
    const aValue = getComparable(a)
    const bValue = getComparable(b)

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue, 'ko') * direction
    }

    return (aValue - bValue) * direction
  })

  return rows
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedSkus.value.length / PAGE_SIZE)))

const paginatedSkus = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedSkus.value.slice(start, start + PAGE_SIZE)
})

const canConvertInventory = computed(() => selectedSkuCodes.value.length > 0)

const isAllCurrentPageSelected = computed(() =>
  paginatedSkus.value.length > 0
  && paginatedSkus.value.every(row => selectedSkuCodes.value.includes(row.skuCode)),
)

const rangeStart = computed(() => (sortedSkus.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1))
const rangeEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, sortedSkus.value.length))

watch(totalPages, (pageCount) => {
  if (currentPage.value > pageCount) currentPage.value = pageCount
})

watch(selectedParentCategory, () => {
  selectedChildCategory.value = ''
})

watch([selectedParentCategory, selectedChildCategory, selectedWarehouseCodes, selectedConditionCodes, searchTerm], () => {
  currentPage.value = 1
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
    const rows = await getCircularCandidates()
    candidateSkus.value = Array.isArray(rows) ? rows.map(mapCandidateRow) : []
    hasRefreshed.value = true
  } catch (e) {
    loadError.value = e.message || '순환 재고 후보 조회에 실패했습니다.'
    candidateSkus.value = []
    hasRefreshed.value = true
  } finally {
    isLoading.value = false
  }
}

const refreshCandidates = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    await refreshCircularCandidates()
    await loadCandidates()
    selectedSkuCodes.value = []
    selectedParentCategory.value = ''
    selectedChildCategory.value = ''
    selectedWarehouseCodes.value = []
    selectedConditionCodes.value = []
    currentPage.value = 1
    sortKey.value = 'convertibleStock'
    sortDirection.value = 'desc'
  } catch (e) {
    loadError.value = e.message || '순환 재고 후보 갱신에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }

  currentPage.value = 1
}

const sortIcon = (key) => {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '▲' : '▼'
}

const toggleSku = (skuCode) => {
  selectedSkuCodes.value = selectedSkuCodes.value.includes(skuCode)
    ? selectedSkuCodes.value.filter(code => code !== skuCode)
    : [...selectedSkuCodes.value, skuCode]
}

const toggleAllCurrentPage = () => {
  const pageCodes = paginatedSkus.value.map(row => row.skuCode)

  selectedSkuCodes.value = isAllCurrentPageSelected.value
    ? selectedSkuCodes.value.filter(code => !pageCodes.includes(code))
    : [...new Set([...selectedSkuCodes.value, ...pageCodes])]
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

function handleLogout() {
  auth.logout()
  router.push('/login')
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
    @logout="handleLogout"
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
              :key="condition"
              class="inline-flex items-center gap-1 bg-white px-2 py-1 text-[11px] font-bold text-gray-700 ring-1 ring-[#D6EAEA]"
            >
              {{ index + 1 }}. {{ condition }}
            </span>
          </div>
        </div>
        <p v-if="loadError" class="mt-3 text-xs font-bold text-red-600">{{ loadError }}</p>
      </section>

      <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 class="text-sm font-black text-gray-900">전환 후보 SKU 리스트</h2>
            <p class="mt-1 text-[11px] font-bold text-gray-400">
              {{ hasRefreshed ? `조회 ${sortedSkus.length.toLocaleString()}건 · 선택 ${selectedSkuCodes.length.toLocaleString()}건` : '재고 새로고침 후 후보가 표시됩니다.' }}
            </p>
          </div>
          <p v-if="hasRefreshed" class="text-[11px] font-bold text-gray-400">
            {{ rangeStart.toLocaleString() }}-{{ rangeEnd.toLocaleString() }} / 전체 {{ sortedSkus.length.toLocaleString() }}건
          </p>
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
            <span class="text-[11px] font-bold text-gray-500">후보 조건</span>
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
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Condition</p>
                <button
                  type="button"
                  class="text-[10px] font-black text-gray-500 hover:text-gray-700"
                  @click="clearConditionCodes"
                >
                  전체 해제
                </button>
              </div>
              <label
                v-for="option in conditionOptions"
                :key="option.code"
                class="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 hover:bg-[#EBF5F5]/60"
              >
                <input
                  type="checkbox"
                  class="mt-0.5 h-3.5 w-3.5 accent-[#004D3C]"
                  :checked="selectedConditionCodes.includes(option.code)"
                  @change="toggleConditionCode(option.code)"
                />
                <span class="text-[11px] font-bold text-gray-700">{{ option.code }}. {{ option.label }}</span>
              </label>
            </div>

          </div>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="SKU 코드, 품목 코드, 품목명"
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
                class="cursor-pointer transition"
                :class="selectedSkuCodes.includes(row.skuCode) ? 'bg-[#EBF5F5] font-bold' : 'hover:bg-[#EBF5F5]/60'"
                @click="toggleSku(row.skuCode)"
              >
                <td class="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="selectedSkuCodes.includes(row.skuCode)"
                    @click.stop="toggleSku(row.skuCode)"
                  />
                </td>
                <td class="px-3 py-3 font-mono font-bold text-gray-600">{{ row.skuCode }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.itemCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ row.category }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ row.warehouseName }}</td>
                <td class="px-3 py-3 text-center font-black text-gray-900">{{ row.color }}</td>
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
          class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-2"
        >
          <span class="text-[11px] font-medium text-gray-400">
            {{ rangeStart.toLocaleString() }}-{{ rangeEnd.toLocaleString() }} / 전체 {{ sortedSkus.length.toLocaleString() }}건
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              :disabled="currentPage === 1"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goToPage(currentPage - 1)"
            >
              ‹
            </button>
            <button
              v-for="page in totalPages"
              :key="page"
              type="button"
              class="flex h-7 min-w-[28px] items-center justify-center border text-[12px] font-medium transition"
              :class="page === currentPage ? 'border-[#004D3C] bg-[#004D3C] text-white' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <button
              type="button"
              :disabled="currentPage === totalPages"
              class="flex h-7 w-7 items-center justify-center border border-gray-300 bg-white text-[12px] text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              @click="goToPage(currentPage + 1)"
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

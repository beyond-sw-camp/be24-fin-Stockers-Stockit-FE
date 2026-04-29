<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const circularInventoryMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 조회')
const searchTerm = ref('')
const materialFilters = ref([])
const isMaterialDropdownOpen = ref(false)
const materialDropdownRef = ref(null)
const selectedInventoryIds = ref([])
const sortKey = ref('')
const sortDirection = ref('asc')

const circularInventoryData = [
  { id: 'CI-001', itemCode: 'SPA-TOP-001', parentCategory: '상의', childCategory: '반팔', itemName: '코튼 베이직 반팔 티셔츠', materials: [{ name: '면', ratio: 100 }], quantity: 184, weight: '92.0kg' },
  { id: 'CI-002', itemCode: 'SPA-TOP-002', parentCategory: '상의', childCategory: '긴팔', itemName: '슬림핏 긴팔 티셔츠', materials: [{ name: '면', ratio: 100 }], quantity: 52, weight: '31.2kg' },
  { id: 'CI-003', itemCode: 'SPA-TOP-003', parentCategory: '상의', childCategory: '셔츠', itemName: '오버핏 옥스포드 셔츠', materials: [{ name: '면', ratio: 70 }, { name: '폴리에스터', ratio: 30 }], quantity: 76, weight: '53.2kg' },
  { id: 'CI-004', itemCode: 'SPA-TOP-004', parentCategory: '상의', childCategory: '니트', itemName: '라운드넥 소프트 니트', materials: [{ name: '울', ratio: 50 }, { name: '아크릴', ratio: 50 }], quantity: 86, weight: '43.0kg' },
  { id: 'CI-005', itemCode: 'SPA-TOP-005', parentCategory: '상의', childCategory: '후드티', itemName: '헤비웨이트 로고 후드티', materials: [{ name: '면', ratio: 80 }, { name: '폴리에스터', ratio: 20 }], quantity: 44, weight: '48.4kg' },
  { id: 'CI-006', itemCode: 'SPA-PNT-001', parentCategory: '바지', childCategory: '청바지', itemName: '스트레이트 워싱 데님', materials: [{ name: '데님', ratio: 100 }], quantity: 39, weight: '42.9kg' },
  { id: 'CI-007', itemCode: 'SPA-PNT-002', parentCategory: '바지', childCategory: '반바지', itemName: '라이트 코튼 쇼츠', materials: [{ name: '면', ratio: 100 }], quantity: 68, weight: '30.6kg' },
  { id: 'CI-008', itemCode: 'SPA-PNT-003', parentCategory: '바지', childCategory: '긴바지', itemName: '와이드 밴딩 팬츠', materials: [{ name: '나일론', ratio: 100 }], quantity: 24, weight: '18.6kg' },
  { id: 'CI-009', itemCode: 'SPA-PNT-004', parentCategory: '바지', childCategory: '츄리닝', itemName: '데일리 조거 트레이닝 팬츠', materials: [{ name: '폴리', ratio: 90 }, { name: '스판', ratio: 10 }], quantity: 57, weight: '39.9kg' },
  { id: 'CI-010', itemCode: 'SPA-SKT-001', parentCategory: '치마', childCategory: '미니스커트', itemName: 'A라인 데님 미니스커트', materials: [{ name: '폴리에스터', ratio: 100 }], quantity: 33, weight: '16.5kg' },
  { id: 'CI-011', itemCode: 'SPA-SKT-002', parentCategory: '치마', childCategory: '롱스커트', itemName: '플리츠 롱스커트', materials: [{ name: '폴리에스터', ratio: 100 }], quantity: 19, weight: '12.4kg' },
  { id: 'CI-012', itemCode: 'SPA-OUT-001', parentCategory: '아우터', childCategory: '패딩', itemName: '라이트 숏 패딩', materials: [{ name: '나일론', ratio: 80 }, { name: '덕다운', ratio: 20 }], quantity: 21, weight: '29.4kg' },
  { id: 'CI-013', itemCode: 'SPA-OUT-002', parentCategory: '아우터', childCategory: '후드집업', itemName: '스웨트 후드 집업', materials: [{ name: '면', ratio: 70 }, { name: '폴리에스터', ratio: 30 }], quantity: 47, weight: '42.3kg' },
  { id: 'CI-014', itemCode: 'SPA-OUT-003', parentCategory: '아우터', childCategory: '자켓', itemName: '싱글 브레스트 자켓', materials: [{ name: '합성피혁', ratio: 100 }], quantity: 18, weight: '23.4kg' },
  { id: 'CI-015', itemCode: 'SPA-OUT-004', parentCategory: '아우터', childCategory: '가디건', itemName: '브이넥 니트 가디건', materials: [{ name: '아크릴', ratio: 50 }, { name: '폴리', ratio: 30 }, { name: '나일론', ratio: 20 }], quantity: 37, weight: '29.6kg' },
]

const naturalSingleMaterials = ['면', '울', '캐시미어', '실크', '린넨']
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
  linen: '린넨',
}
const materialOptions = [
  ...naturalSingleMaterials,
  ...syntheticMaterials,
  '혼방',
]
const materialOptionsByGroup = {
  '천연 단일 섬유': naturalSingleMaterials,
  '합성 섬유': syntheticMaterials,
  혼방: [...naturalSingleMaterials, ...syntheticMaterials],
}
const colorOptions = ['검정', '흰색', '그레이', '아이보리']
const colorCodeMap = { 검정: 'BLK', 흰색: 'WHT', 그레이: 'GRY', 아이보리: 'IVR' }
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL']

const normalizeMaterialName = (name) => {
  const normalized = String(name ?? '').trim()
  const lower = normalized.toLowerCase()
  return materialNameAliasMap[lower] ?? materialNameAliasMap[normalized] ?? normalized
}

const normalizedInventoryData = computed(() =>
  circularInventoryData.map((item) => ({
    ...item,
    materials: item.materials.map(material => ({
      ...material,
      name: normalizeMaterialName(material.name),
    })),
  })),
)

const deriveMaterialType = (materials) => {
  if (!Array.isArray(materials) || materials.length === 0) return '혼방'
  if (materials.length >= 2) return '혼방'

  const [single] = materials
  const isPureSingle = Number(single.ratio) === 100
  if (!isPureSingle) return '혼방'

  if (naturalSingleMaterials.includes(single.name)) return '천연 단일 섬유'
  if (syntheticMaterials.includes(single.name)) return '합성 섬유'
  return '혼방'
}

const formatMaterialDetail = (materials) => {
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

const parseWeight = (weight) => Number(String(weight).replace('kg', '')) || 0
const formatPerItemWeight = (weight, quantity) => {
  if (!quantity || quantity <= 0) return '0kg'
  const perItemWeight = parseWeight(weight) / quantity
  return `${perItemWeight.toFixed(2)}kg`
}

const activeMaterialFilters = computed(() =>
  materialFilters.value.filter(filter => filter.materialGroup),
)

const materialFilterSummary = computed(() => {
  if (activeMaterialFilters.value.length === 0) return '소재 조건 없음'

  const [firstFilter] = activeMaterialFilters.value
  const materialLabel = firstFilter.material
    ? `${firstFilter.materialGroup || '섬유 구분'} / ${firstFilter.material}`
    : (firstFilter.materialGroup || '섬유 구분')
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
    const perUnitWeight = item.quantity > 0 ? totalWeight / item.quantity : 0

    return colorOptions.flatMap((color, colorIndex) =>
      sizeOptions.map((size, sizeIndex) => {
        const partitionIndex = colorIndex * sizeOptions.length + sizeIndex
        const quantity = Math.max(1, Math.round(item.quantity * partitionRatios[partitionIndex]))
        const skuWeight = (quantity * perUnitWeight).toFixed(1)

        return {
          id: `${item.id}-${color}-${size}`,
          skuCode: `${item.itemCode}-${colorCodeMap[color]}-${size}`,
          itemCode: item.itemCode,
          category: `${item.parentCategory} > ${item.childCategory}`,
          itemName: item.itemName,
          color,
          size,
          materials: item.materials,
          quantity,
          weight: `${skuWeight}kg`,
        }
      }),
    )
  })
})

const filteredInventoryBase = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return skuInventoryData.value
    .map(item => ({
      ...item,
      materialType: deriveMaterialType(item.materials),
      materialDetail: formatMaterialDetail(item.materials),
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

const filteredInventory = computed(() => {
  const rows = [...filteredInventoryBase.value]
  if (!sortKey.value) return rows

  return rows.sort((a, b) => {
    const aValue = sortKey.value === 'weight'
      ? parseWeight(a.weight)
      : sortKey.value === 'skuCode'
        ? a.skuCode
        : a[sortKey.value]
    const bValue = sortKey.value === 'weight'
      ? parseWeight(b.weight)
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

const isAllSelected = computed(() =>
  filteredInventory.value.length > 0
  && filteredInventory.value.every(item => selectedInventoryIds.value.includes(item.id)),
)

const canRegisterSale = computed(() => selectedInventoryIds.value.length > 0)
const filteredItemCount = computed(() => new Set(filteredInventory.value.map(item => item.itemCode)).size)

const toggleInventory = (itemId) => {
  selectedInventoryIds.value = selectedInventoryIds.value.includes(itemId)
    ? selectedInventoryIds.value.filter(id => id !== itemId)
    : [...selectedInventoryIds.value, itemId]
}

const toggleAllInventory = () => {
  const filteredIds = filteredInventory.value.map(item => item.id)

  selectedInventoryIds.value = isAllSelected.value
    ? selectedInventoryIds.value.filter(id => !filteredIds.includes(id))
    : [...new Set([...selectedInventoryIds.value, ...filteredIds])]
}

const isMaterialDisabled = (material, index) => {
  const currentFilter = materialFilters.value[index]
  return materialFilters.value.some((filter, filterIndex) =>
    filterIndex !== index
    && filter.materialGroup === currentFilter?.materialGroup
    && filter.material === material,
  )
}

const addMaterialFilter = () => {
  const maxFilterCount = materialGroupOptions.length + materialOptions.length
  if (materialFilters.value.length >= maxFilterCount) return
  materialFilters.value = [...materialFilters.value, { materialGroup: '', material: '', minRatio: '' }]
}

const removeMaterialFilter = (index) => {
  materialFilters.value = materialFilters.value.filter((_, filterIndex) => filterIndex !== index)
}

const clearMaterialFilters = () => {
  materialFilters.value = []
}

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = 'asc'
}

const sortIcon = (key) => {
  if (sortKey.value !== key) return '↕'
  return sortDirection.value === 'asc' ? '▲' : '▼'
}

const resetFilters = () => {
  searchTerm.value = ''
  materialFilters.value = []
  isMaterialDropdownOpen.value = false
}

const handleDocumentClick = (event) => {
  if (!materialDropdownRef.value?.contains(event.target)) {
    isMaterialDropdownOpen.value = false
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularInventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 조회</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              순환 재고로 전환된 품목을 소재와 함량 기준으로 조회합니다.
            </p>
          </div>

          <button
            type="button"
            class="h-9 px-4 text-xs font-black transition"
            :class="canRegisterSale ? 'bg-[#004D3C] text-white hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-100 text-gray-400'"
            :disabled="!canRegisterSale"
          >
            판매 등록
          </button>
        </div>

        <div class="mt-4 grid items-end gap-3 xl:grid-cols-[minmax(24rem,1fr)_minmax(16rem,1fr)_auto]">
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
                  <p class="mt-0.5 text-[10px] font-bold text-gray-400">여러 조건은 모두 만족하는 품목만 조회됩니다.</p>
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
                    <option value="">섬유 구분 선택</option>
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
                  <button
                    type="button"
                    class="h-8 border border-gray-200 text-[12px] font-black text-gray-400 hover:bg-gray-50 hover:text-black"
                    :aria-label="`${index + 1}번째 소재 조건 삭제`"
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
            <h2 class="text-sm font-black text-gray-900">순환 재고 리스트</h2>
            <p class="mt-1 text-[11px] font-bold text-gray-400">
              조회 품목 {{ filteredItemCount.toLocaleString() }}건 · 조회 SKU {{ filteredInventory.length.toLocaleString() }}건 · 선택 SKU {{ selectedInventoryIds.length.toLocaleString() }}건
            </p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full table-fixed border-collapse text-left text-xs min-w-[1200px]">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="w-10 px-3 py-3 text-center font-black">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="isAllSelected"
                    @change="toggleAllInventory"
                  />
                </th>
                <th class="w-[176px] px-3 py-3 font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('skuCode')">
                    SKU 코드
                    <span class="text-[9px]">{{ sortIcon('skuCode') }}</span>
                  </button>
                </th>
                <th class="w-[120px] px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="w-[72px] px-3 py-3 text-center font-black">색상</th>
                <th class="w-[56px] px-3 py-3 text-center font-black">사이즈</th>
                <th class="w-[120px] px-3 py-3 font-black">소재 구분</th>
                <th class="w-[160px] px-3 py-3 font-black">소재 상세</th>
                <th class="w-[84px] px-3 py-3 text-right font-black">
                  <button type="button" class="flex w-full items-center justify-end gap-1 hover:text-gray-900" @click="toggleSort('quantity')">
                    수량
                    <span class="text-[9px]">{{ sortIcon('quantity') }}</span>
                  </button>
                </th>
                <th class="w-[80px] px-3 py-3 text-right font-black">
                  <button type="button" class="flex w-full items-center justify-end gap-1 hover:text-gray-900" @click="toggleSort('weight')">
                    무게
                    <span class="text-[9px]">{{ sortIcon('weight') }}</span>
                  </button>
                </th>
                <th class="w-[110px] px-3 py-3 text-right font-black">옷 하나당 무게</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="item in filteredInventory"
                :key="item.id"
                class="cursor-pointer transition"
                :class="selectedInventoryIds.includes(item.id) ? 'bg-[#EBF5F5] font-bold' : 'hover:bg-[#EBF5F5]/60'"
                @click="toggleInventory(item.id)"
              >
                <td class="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="selectedInventoryIds.includes(item.id)"
                    @click.stop="toggleInventory(item.id)"
                  />
                </td>
                <td class="px-3 py-3 font-mono font-bold text-gray-600 whitespace-nowrap">{{ item.skuCode }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500 whitespace-nowrap">{{ item.itemCode }}</td>
                <td class="px-3 py-3 font-black text-gray-900 truncate">{{ item.itemName }}</td>
                <td class="px-3 py-3 text-center font-black text-gray-900">{{ item.color }}</td>
                <td class="px-3 py-3 text-center font-black text-gray-900">{{ item.size }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ item.materialType }}</td>
                <td class="px-3 py-3 font-black text-gray-900 truncate">{{ item.materialDetail }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.quantity.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.weight }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ formatPerItemWeight(item.weight, item.quantity) }}</td>
              </tr>
              <tr v-if="filteredInventory.length === 0">
                <td colspan="11" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                  조건에 맞는 순환 재고가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

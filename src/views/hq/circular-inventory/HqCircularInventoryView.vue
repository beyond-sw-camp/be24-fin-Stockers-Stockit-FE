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
const selectedCategory = ref('')
const selectedChildCategory = ref('')
const materialFilters = ref([])
const isMaterialDropdownOpen = ref(false)
const materialDropdownRef = ref(null)
const selectedInventoryIds = ref([])
const sortKey = ref('')
const sortDirection = ref('asc')

const circularInventoryData = [
  { id: 'CI-001', itemCode: 'SPA-TOP-001', parentCategory: '상의', childCategory: '반팔', itemName: '코튼 베이직 반팔 티셔츠', materials: [{ name: '면', ratio: 100 }], warehouseName: '인천 제1창고', quantity: 184, weight: '92.0kg' },
  { id: 'CI-002', itemCode: 'SPA-TOP-002', parentCategory: '상의', childCategory: '긴팔', itemName: '슬림핏 긴팔 티셔츠', materials: [{ name: '면', ratio: 100 }], warehouseName: '경기 물류창고', quantity: 52, weight: '31.2kg' },
  { id: 'CI-003', itemCode: 'SPA-TOP-003', parentCategory: '상의', childCategory: '셔츠', itemName: '오버핏 옥스포드 셔츠', materials: [{ name: '면', ratio: 70 }, { name: '폴리에스터', ratio: 30 }], warehouseName: '부산 보관창고', quantity: 76, weight: '53.2kg' },
  { id: 'CI-004', itemCode: 'SPA-TOP-004', parentCategory: '상의', childCategory: '니트', itemName: '라운드넥 소프트 니트', materials: [{ name: '울', ratio: 50 }, { name: '아크릴', ratio: 50 }], warehouseName: '인천 제1창고', quantity: 86, weight: '43.0kg' },
  { id: 'CI-005', itemCode: 'SPA-TOP-005', parentCategory: '상의', childCategory: '후드티', itemName: '헤비웨이트 로고 후드티', materials: [{ name: '면', ratio: 80 }, { name: '폴리에스터', ratio: 20 }], warehouseName: '대전 중앙창고', quantity: 44, weight: '48.4kg' },
  { id: 'CI-006', itemCode: 'SPA-PNT-001', parentCategory: '바지', childCategory: '청바지', itemName: '스트레이트 워싱 데님', materials: [{ name: '데님', ratio: 100 }], warehouseName: '경기 물류창고', quantity: 39, weight: '42.9kg' },
  { id: 'CI-007', itemCode: 'SPA-PNT-002', parentCategory: '바지', childCategory: '반바지', itemName: '라이트 코튼 쇼츠', materials: [{ name: '면', ratio: 100 }], warehouseName: '부산 보관창고', quantity: 68, weight: '30.6kg' },
  { id: 'CI-008', itemCode: 'SPA-PNT-003', parentCategory: '바지', childCategory: '긴바지', itemName: '와이드 밴딩 팬츠', materials: [{ name: '나일론', ratio: 100 }], warehouseName: '인천 제1창고', quantity: 24, weight: '18.6kg' },
  { id: 'CI-009', itemCode: 'SPA-PNT-004', parentCategory: '바지', childCategory: '츄리닝', itemName: '데일리 조거 트레이닝 팬츠', materials: [{ name: '폴리', ratio: 90 }, { name: '스판', ratio: 10 }], warehouseName: '대전 중앙창고', quantity: 57, weight: '39.9kg' },
  { id: 'CI-010', itemCode: 'SPA-SKT-001', parentCategory: '치마', childCategory: '미니스커트', itemName: 'A라인 데님 미니스커트', materials: [{ name: '폴리에스터', ratio: 100 }], warehouseName: '부산 보관창고', quantity: 33, weight: '16.5kg' },
  { id: 'CI-011', itemCode: 'SPA-SKT-002', parentCategory: '치마', childCategory: '롱스커트', itemName: '플리츠 롱스커트', materials: [{ name: '폴리에스터', ratio: 100 }], warehouseName: '경기 물류창고', quantity: 19, weight: '12.4kg' },
  { id: 'CI-012', itemCode: 'SPA-OUT-001', parentCategory: '아우터', childCategory: '패딩', itemName: '라이트 숏 패딩', materials: [{ name: '나일론', ratio: 80 }, { name: '덕다운', ratio: 20 }], warehouseName: '인천 제1창고', quantity: 21, weight: '29.4kg' },
  { id: 'CI-013', itemCode: 'SPA-OUT-002', parentCategory: '아우터', childCategory: '후드집업', itemName: '스웨트 후드 집업', materials: [{ name: '면', ratio: 70 }, { name: '폴리에스터', ratio: 30 }], warehouseName: '대전 중앙창고', quantity: 47, weight: '42.3kg' },
  { id: 'CI-014', itemCode: 'SPA-OUT-003', parentCategory: '아우터', childCategory: '자켓', itemName: '싱글 브레스트 자켓', materials: [{ name: '합성피혁', ratio: 100 }], warehouseName: '부산 보관창고', quantity: 18, weight: '23.4kg' },
  { id: 'CI-015', itemCode: 'SPA-OUT-004', parentCategory: '아우터', childCategory: '가디건', itemName: '브이넥 니트 가디건', materials: [{ name: '아크릴', ratio: 50 }, { name: '폴리', ratio: 30 }, { name: '나일론', ratio: 20 }], warehouseName: '경기 물류창고', quantity: 37, weight: '29.6kg' },
]

const categoryOptions = ['상의', '바지', '치마', '아우터']
const childCategoryMap = {
  상의: ['반팔', '긴팔', '셔츠', '니트', '후드티'],
  바지: ['청바지', '반바지', '긴바지', '츄리닝'],
  치마: ['미니스커트', '롱스커트'],
  아우터: ['패딩', '후드집업', '자켓', '가디건'],
}
const materialOptions = ['면', '폴리에스터', '울', '아크릴', '데님', '나일론', '폴리', '스판', '덕다운', '합성피혁']

const childCategoryOptions = computed(() =>
  selectedCategory.value ? childCategoryMap[selectedCategory.value] : [],
)

const activeMaterialFilters = computed(() =>
  materialFilters.value.filter(filter => filter.material),
)

const materialFilterSummary = computed(() => {
  if (activeMaterialFilters.value.length === 0) return '소재 조건 없음'

  const [firstFilter] = activeMaterialFilters.value
  const firstLabel = firstFilter.minRatio
    ? `${firstFilter.material} ${firstFilter.minRatio}% 이상`
    : firstFilter.material
  const restCount = activeMaterialFilters.value.length - 1

  return restCount > 0 ? `${firstLabel} 외 ${restCount}건` : firstLabel
})

const filteredInventoryBase = computed(() => {
  return circularInventoryData.filter((item) => {
    const matchesCategory = !selectedCategory.value || item.parentCategory === selectedCategory.value
    const matchesChildCategory = !selectedChildCategory.value || item.childCategory === selectedChildCategory.value
    const matchesMaterial = activeMaterialFilters.value.every((filter) => {
      const itemMaterial = item.materials.find(material => material.name === filter.material)
      if (!itemMaterial) return false

      const minRatio = Number(filter.minRatio) || 0
      return minRatio === 0 || itemMaterial.ratio >= minRatio
    })

    return matchesCategory && matchesChildCategory && matchesMaterial
  })
})

const parseWeight = (weight) => Number(String(weight).replace('kg', '')) || 0

const filteredInventory = computed(() => {
  const rows = [...filteredInventoryBase.value]
  if (!sortKey.value) return rows

  return rows.sort((a, b) => {
    const aValue = sortKey.value === 'weight' ? parseWeight(a.weight) : a[sortKey.value]
    const bValue = sortKey.value === 'weight' ? parseWeight(b.weight) : b[sortKey.value]
    const direction = sortDirection.value === 'asc' ? 1 : -1

    return (aValue - bValue) * direction
  })
})

const isAllSelected = computed(() =>
  filteredInventory.value.length > 0
  && filteredInventory.value.every(item => selectedInventoryIds.value.includes(item.id)),
)

const canRegisterSale = computed(() => selectedInventoryIds.value.length > 0)

const formatMaterials = (materials) =>
  materials.map(material => `${material.name} ${material.ratio}%`).join(', ')

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

const isMaterialDisabled = (material, index) =>
  materialFilters.value.some((filter, filterIndex) => filterIndex !== index && filter.material === material)

const addMaterialFilter = () => {
  if (materialFilters.value.length >= materialOptions.length) return
  materialFilters.value = [...materialFilters.value, { material: '', minRatio: '' }]
}

const removeMaterialFilter = (index) => {
  materialFilters.value = materialFilters.value.filter((_, filterIndex) => filterIndex !== index)
}

const clearMaterialFilters = () => {
  materialFilters.value = []
}

const handleCategoryChange = () => {
  selectedChildCategory.value = ''
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
  selectedCategory.value = ''
  selectedChildCategory.value = ''
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

        <div class="mt-4 grid items-end gap-3 xl:grid-cols-[8.5rem_9rem_minmax(18rem,1fr)_auto]">
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">카테고리</span>
            <select
              v-model="selectedCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              @change="handleCategoryChange"
            >
              <option value="">전체</option>
              <option v-for="category in categoryOptions" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">하위 카테고리</span>
            <select
              v-model="selectedChildCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C] disabled:bg-gray-50 disabled:text-gray-400"
              :disabled="!selectedCategory"
            >
              <option value="">전체</option>
              <option v-for="category in childCategoryOptions" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

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
                  class="grid grid-cols-[minmax(8rem,1fr)_6rem_auto_2rem] items-center gap-2"
                >
                  <select
                    v-model="filter.material"
                    class="h-8 border border-gray-200 bg-gray-50 px-2 text-[11px] font-bold text-gray-900 outline-none focus:border-[#004D3C] focus:bg-white"
                  >
                    <option value="">소재 선택</option>
                    <option
                      v-for="material in materialOptions"
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
                :disabled="materialFilters.length >= materialOptions.length"
                @click="addMaterialFilter"
              >
                + 조건 추가
              </button>
            </div>
          </div>

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
              조회 {{ filteredInventory.length.toLocaleString() }}건 · 선택 {{ selectedInventoryIds.length.toLocaleString() }}건
            </p>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[1080px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="w-16 px-3 py-3 text-center font-black">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="isAllSelected"
                    @change="toggleAllInventory"
                  />
                </th>
                <th class="px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">카테고리</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">소재</th>
                <th class="px-3 py-3 font-black">창고</th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('quantity')">
                    수량
                    <span class="text-[9px]">{{ sortIcon('quantity') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-900" @click="toggleSort('weight')">
                    총 옷 무게
                    <span class="text-[9px]">{{ sortIcon('weight') }}</span>
                  </button>
                </th>
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
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ item.itemCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ item.parentCategory }} &gt; {{ item.childCategory }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ item.itemName }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ formatMaterials(item.materials) }}</td>
                <td class="px-3 py-3 font-bold text-gray-700">{{ item.warehouseName }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.quantity.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.weight }}</td>
              </tr>
              <tr v-if="filteredInventory.length === 0">
                <td colspan="8" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
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

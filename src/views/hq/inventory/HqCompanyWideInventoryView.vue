<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getCompanyWideInventories } from '@/api/inventory.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find(menu => menu.label === '재고 관리')?.children ?? []

const activeTopMenu = computed(() => '재고 관리')
const activeSideMenu = ref('전사 재고 조회')

const locationType = ref('매장')
const selectedLocations = ref([])
const selectedParentCategory = ref('')
const selectedChildCategory = ref('')
const selectedStatus = ref('')
const searchTerm = ref('')
const isLocationDropdownOpen = ref(false)
const locationDropdownRef = ref(null)
const isLoading = ref(false)
const loadError = ref('')

const categoryMap = {
  상의: ['반팔', '긴팔', '셔츠', '니트', '후드티'],
  바지: ['청바지', '반바지', '긴바지', '츄리닝'],
  치마: ['미니스커트', '롱스커트'],
  아우터: ['패딩', '후드집업', '자켓', '가디건'],
}

const locationTypeOptions = ['매장', '창고']
const locationOptionsRaw = ref([])
const inventoryData = ref([])

const childCategoryOptions = computed(() =>
  selectedParentCategory.value ? categoryMap[selectedParentCategory.value] : [],
)

const currentLocationOptions = computed(() => {
  const current = locationType.value === '창고' ? 'WAREHOUSE' : 'STORE'
  return locationOptionsRaw.value
    .filter(l => l.locationType === current)
    .map(l => l.name)
})

const parseQueryList = (value) => {
  if (typeof value !== 'string') return []
  return value.split(',').map(v => v.trim()).filter(Boolean)
}

const initializeFiltersFromQuery = () => {
  const queryType = typeof route.query.type === 'string' ? route.query.type : ''
  locationType.value = locationTypeOptions.includes(queryType) ? queryType : '매장'

  selectedParentCategory.value = typeof route.query.parent === 'string' ? route.query.parent : ''
  selectedChildCategory.value = typeof route.query.child === 'string' ? route.query.child : ''
  selectedStatus.value = typeof route.query.status === 'string' ? route.query.status : ''
  searchTerm.value = typeof route.query.search === 'string' ? route.query.search : ''

  const queryLocations = parseQueryList(route.query.locations)
  selectedLocations.value = queryLocations
}

initializeFiltersFromQuery()

const isAllLocationSelected = computed(() =>
  currentLocationOptions.value.length > 0
  && currentLocationOptions.value.every(location => selectedLocations.value.includes(location)),
)

const locationChipItems = computed(() =>
  selectedLocations.value.length >= 3 ? selectedLocations.value.slice(0, 1) : selectedLocations.value,
)

const hiddenLocationCount = computed(() =>
  selectedLocations.value.length >= 3 ? selectedLocations.value.length - 1 : 0,
)

const filteredInventory = computed(() => {
  if (!selectedStatus.value) return inventoryData.value
  return inventoryData.value.filter(item => item.status === selectedStatus.value)
})

const locationSummary = computed(() => {
  if (selectedLocations.value.length === 0) return `전체 ${locationType.value}`
  return selectedLocations.value.join(', ')
})

const handleLocationTypeChange = () => {
  selectedLocations.value = []
  isLocationDropdownOpen.value = false
}

const handleParentCategoryChange = () => {
  selectedChildCategory.value = ''
}

const toggleLocationDropdown = () => {
  isLocationDropdownOpen.value = !isLocationDropdownOpen.value
}

const toggleLocation = (location) => {
  selectedLocations.value = selectedLocations.value.includes(location)
    ? selectedLocations.value.filter(selectedLocation => selectedLocation !== location)
    : [...selectedLocations.value, location]
}

const selectAllLocations = () => {
  selectedLocations.value = [...currentLocationOptions.value]
}

const clearLocations = () => {
  selectedLocations.value = []
}

const removeLocation = (location) => {
  selectedLocations.value = selectedLocations.value.filter(selectedLocation => selectedLocation !== location)
}

const mapLocationNamesToIds = () => {
  const typeCode = locationType.value === '창고' ? 'WAREHOUSE' : 'STORE'
  const nameSet = new Set(selectedLocations.value)
  return locationOptionsRaw.value
    .filter(l => l.locationType === typeCode && (nameSet.size === 0 || nameSet.has(l.name)))
    .map(l => l.id)
}

async function fetchCompanyWideInventory() {
  isLoading.value = true
  loadError.value = ''
  try {
    const typeCode = locationType.value === '창고' ? 'WAREHOUSE' : 'STORE'
    const locationIds = mapLocationNamesToIds()
    const payload = {
      locationType: typeCode,
      parentCategory: selectedParentCategory.value || undefined,
      childCategory: selectedChildCategory.value || undefined,
      keyword: searchTerm.value || undefined,
    }
    if (selectedLocations.value.length > 0) payload.locationIds = locationIds

    const res = await getCompanyWideInventories(payload)
    const items = Array.isArray(res?.items) ? res.items : []
    const options = Array.isArray(res?.locationOptions) ? res.locationOptions : []

    locationOptionsRaw.value = options.map(o => ({
      id: o.id,
      code: o.code,
      name: o.name,
      locationType: o.code?.startsWith('WH-') ? 'WAREHOUSE' : 'STORE',
    }))

    inventoryData.value = items.map(item => ({
      itemCode: item.itemCode,
      parentCategory: item.parentCategory,
      childCategory: item.childCategory,
      itemName: item.itemName,
      actualStock: item.actualStock,
      availableStock: item.availableStock,
      safetyStock: item.safetyStock,
      status: item.status,
      updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString('ko-KR', { hour12: false }) : '-',
    }))
  } catch (e) {
    loadError.value = e.message || '전사 재고 조회에 실패했습니다.'
    inventoryData.value = []
  } finally {
    isLoading.value = false
  }
}

const moveToSkuDetail = (item) => {
  router.push({
    name: 'hq-inventory-sku-detail',
    params: { itemCode: item.itemCode },
    query: {
      itemCode: item.itemCode,
      itemName: item.itemName,
      parentCategory: item.parentCategory,
      childCategory: item.childCategory,
      locationType: locationType.value,
      locationName: locationSummary.value,
      type: locationType.value,
      locations: selectedLocations.value.length > 0 ? selectedLocations.value.join(',') : undefined,
      parent: selectedParentCategory.value || undefined,
      child: selectedChildCategory.value || undefined,
      status: selectedStatus.value || undefined,
      search: searchTerm.value || undefined,
    },
  })
}

const handleDocumentClick = (event) => {
  if (!locationDropdownRef.value?.contains(event.target)) {
    isLocationDropdownOpen.value = false
  }
}

watch([locationType, selectedParentCategory, selectedChildCategory, selectedStatus, searchTerm, selectedLocations], () => {
  fetchCompanyWideInventory()
})

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  fetchCompanyWideInventory()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const statusClass = (status) => ({
  정상: 'bg-[#EBF5F5] text-black',
  부족: 'bg-amber-50 text-amber-700',
  품절: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="inventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">전사 재고 조회</h1>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>조회 결과 {{ filteredInventory.length.toLocaleString() }}건</p>
            <p class="mt-1 text-gray-400">{{ locationSummary }}</p>
          </div>
        </div>

        <div class="grid gap-3 xl:grid-cols-[0.8fr_1.3fr_0.9fr_0.9fr_0.8fr_1.3fr]">
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">거점 유형</span>
            <select
              v-model="locationType"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              @change="handleLocationTypeChange"
            >
              <option>매장</option>
              <option>창고</option>
            </select>
          </label>

          <div ref="locationDropdownRef" class="relative flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">{{ locationType }} 선택</span>
            <div
              class="flex min-h-9 cursor-pointer items-center justify-between gap-2 border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-900 outline-none transition hover:bg-[#EBF5F5]/50"
              :class="isLocationDropdownOpen ? 'border-[#004D3C]' : ''"
              role="button"
              tabindex="0"
              @click="toggleLocationDropdown"
              @keydown.enter.prevent="toggleLocationDropdown"
              @keydown.space.prevent="toggleLocationDropdown"
            >
              <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <span v-if="selectedLocations.length === 0" class="text-gray-400">
                  전체 {{ locationType }}
                </span>
                <template v-else>
                  <span
                    v-for="location in locationChipItems"
                    :key="location"
                    class="inline-flex max-w-full items-center gap-1 bg-[#EBF5F5] px-2 py-1 text-[11px] font-black text-black"
                  >
                    <span class="truncate">{{ location }}</span>
                    <button
                      type="button"
                      class="text-[13px] leading-none text-gray-500 hover:text-black"
                      :aria-label="`${location} 선택 해제`"
                      @click.stop="removeLocation(location)"
                    >
                      ×
                    </button>
                  </span>
                  <span
                    v-if="hiddenLocationCount > 0"
                    class="inline-flex items-center bg-gray-100 px-2 py-1 text-[11px] font-black text-gray-600"
                  >
                    외 {{ hiddenLocationCount }}건
                  </span>
                </template>
              </div>
              <span class="shrink-0 text-[10px] text-gray-500" :class="isLocationDropdownOpen ? 'rotate-180' : ''">
                ▼
              </span>
            </div>
            <div
              v-if="isLocationDropdownOpen"
              class="absolute left-0 right-0 top-full z-20 mt-1 border border-gray-300 bg-white p-2 shadow-lg"
            >
              <div class="mb-2 flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <button
                  type="button"
                  class="flex-1 bg-[#EBF5F5] px-2 py-1.5 text-[11px] font-black text-black hover:bg-[#D6EAEA] disabled:cursor-not-allowed disabled:text-gray-400"
                  :disabled="isAllLocationSelected"
                  @click.stop="selectAllLocations"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  class="flex-1 border border-gray-200 px-2 py-1.5 text-[11px] font-black text-gray-600 hover:bg-gray-50 hover:text-black"
                  @click.stop="clearLocations"
                >
                  전체 해제
                </button>
              </div>
              <div class="max-h-48 overflow-y-auto">
                <label
                  v-for="location in currentLocationOptions"
                  :key="location"
                  class="flex cursor-pointer items-center gap-2 px-2 py-2 text-xs font-bold text-black hover:bg-[#EBF5F5]/70"
                  @click.stop
                >
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="selectedLocations.includes(location)"
                    @change="toggleLocation(location)"
                  />
                  <span>{{ location }}</span>
                </label>
              </div>
              <p class="mt-2 px-1 text-[10px] font-bold text-gray-400">
                {{ selectedLocations.length === 0 ? `전체 ${locationType} 조회 중` : `${selectedLocations.length}개 ${locationType} 선택됨` }}
              </p>
            </div>
          </div>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">카테고리 1단계</span>
            <select
              v-model="selectedParentCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              @change="handleParentCategoryChange"
            >
              <option value="">전체</option>
              <option v-for="category in Object.keys(categoryMap)" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">카테고리 2단계</span>
            <select
              v-model="selectedChildCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C] disabled:bg-gray-50 disabled:text-gray-400"
              :disabled="!selectedParentCategory"
            >
              <option value="">전체</option>
              <option v-for="category in childCategoryOptions" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">상태</span>
            <select
              v-model="selectedStatus"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
            >
              <option value="">전체</option>
              <option>정상</option>
              <option>부족</option>
              <option>품절</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="품목 코드, 품목명, 위치명"
            />
          </label>
        </div>
      </section>

      <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-[1060px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">카테고리</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 text-right font-black">실재고</th>
                <th class="px-3 py-3 text-right font-black">가용재고</th>
                <th class="px-3 py-3 text-right font-black">안전재고</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
                <th class="px-3 py-3 font-black">최종 업데이트</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="item in filteredInventory"
                :key="item.itemCode"
                class="cursor-pointer hover:bg-[#EBF5F5]/60"
                @click="moveToSkuDetail(item)"
              >
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ item.itemCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-800">{{ item.parentCategory }} &gt; {{ item.childCategory }}</td>
                <td class="px-3 py-3 font-bold text-gray-900">{{ item.itemName }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.actualStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold text-gray-500">{{ item.safetyStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-12 justify-center px-2 py-1 text-[11px] font-black" :class="statusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-3 py-3 font-bold text-gray-500">{{ item.updatedAt }}</td>
              </tr>
              <tr v-if="filteredInventory.length === 0">
                <td colspan="8" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                  조건에 맞는 전사 재고가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

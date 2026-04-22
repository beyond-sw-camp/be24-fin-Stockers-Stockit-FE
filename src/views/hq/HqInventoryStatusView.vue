<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
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

const categoryMap = {
  상의: ['반팔', '긴팔', '셔츠', '니트', '후드티'],
  바지: ['청바지', '반바지', '긴바지', '츄리닝'],
  치마: ['미니스커트', '롱스커트'],
  아우터: ['패딩', '후드집업', '자켓', '가디건'],
}

const locationOptions = {
  매장: ['강남 플래그십', '홍대 스토어', '성수 쇼룸', '부산 센텀점', '대구 동성로점'],
  창고: ['인천 제1창고', '이천 풀필먼트', '부산 물류창고', '대전 허브창고'],
}

const inventoryData = [
  { itemCode: 'SPA-TOP-001', parentCategory: '상의', childCategory: '반팔', itemName: '코튼 베이직 반팔 티셔츠', locationType: '매장', locationName: '강남 플래그십', actualStock: 184, availableStock: 172, safetyStock: 60, status: '정상', updatedAt: '2026.04.22 09:20' },
  { itemCode: 'SPA-TOP-002', parentCategory: '상의', childCategory: '긴팔', itemName: '슬림핏 긴팔 티셔츠', locationType: '매장', locationName: '홍대 스토어', actualStock: 38, availableStock: 32, safetyStock: 45, status: '부족', updatedAt: '2026.04.22 09:10' },
  { itemCode: 'SPA-TOP-003', parentCategory: '상의', childCategory: '셔츠', itemName: '오버핏 옥스포드 셔츠', locationType: '창고', locationName: '인천 제1창고', actualStock: 420, availableStock: 402, safetyStock: 120, status: '정상', updatedAt: '2026.04.22 08:50' },
  { itemCode: 'SPA-TOP-004', parentCategory: '상의', childCategory: '니트', itemName: '라운드넥 소프트 니트', locationType: '창고', locationName: '이천 풀필먼트', actualStock: 0, availableStock: 0, safetyStock: 80, status: '품절', updatedAt: '2026.04.22 08:30' },
  { itemCode: 'SPA-TOP-005', parentCategory: '상의', childCategory: '후드티', itemName: '헤비웨이트 로고 후드티', locationType: '매장', locationName: '성수 쇼룸', actualStock: 76, availableStock: 68, safetyStock: 50, status: '정상', updatedAt: '2026.04.22 08:15' },
  { itemCode: 'SPA-PNT-001', parentCategory: '바지', childCategory: '청바지', itemName: '스트레이트 워싱 데님', locationType: '매장', locationName: '부산 센텀점', actualStock: 28, availableStock: 21, safetyStock: 35, status: '부족', updatedAt: '2026.04.21 18:40' },
  { itemCode: 'SPA-PNT-002', parentCategory: '바지', childCategory: '반바지', itemName: '라이트 코튼 쇼츠', locationType: '창고', locationName: '부산 물류창고', actualStock: 310, availableStock: 296, safetyStock: 90, status: '정상', updatedAt: '2026.04.21 18:10' },
  { itemCode: 'SPA-PNT-003', parentCategory: '바지', childCategory: '긴바지', itemName: '와이드 밴딩 팬츠', locationType: '매장', locationName: '대구 동성로점', actualStock: 0, availableStock: 0, safetyStock: 30, status: '품절', updatedAt: '2026.04.21 17:35' },
  { itemCode: 'SPA-PNT-004', parentCategory: '바지', childCategory: '츄리닝', itemName: '데일리 조거 트레이닝 팬츠', locationType: '창고', locationName: '대전 허브창고', actualStock: 144, availableStock: 130, safetyStock: 70, status: '정상', updatedAt: '2026.04.21 16:55' },
  { itemCode: 'SPA-SKT-001', parentCategory: '치마', childCategory: '미니스커트', itemName: 'A라인 데님 미니스커트', locationType: '매장', locationName: '강남 플래그십', actualStock: 52, availableStock: 47, safetyStock: 40, status: '정상', updatedAt: '2026.04.21 15:45' },
  { itemCode: 'SPA-SKT-002', parentCategory: '치마', childCategory: '롱스커트', itemName: '플리츠 롱스커트', locationType: '창고', locationName: '인천 제1창고', actualStock: 24, availableStock: 18, safetyStock: 55, status: '부족', updatedAt: '2026.04.21 15:20' },
  { itemCode: 'SPA-OUT-001', parentCategory: '아우터', childCategory: '패딩', itemName: '라이트 숏 패딩', locationType: '창고', locationName: '이천 풀필먼트', actualStock: 98, availableStock: 92, safetyStock: 45, status: '정상', updatedAt: '2026.04.21 14:30' },
  { itemCode: 'SPA-OUT-002', parentCategory: '아우터', childCategory: '후드집업', itemName: '스웨트 후드 집업', locationType: '매장', locationName: '홍대 스토어', actualStock: 17, availableStock: 12, safetyStock: 30, status: '부족', updatedAt: '2026.04.21 13:50' },
  { itemCode: 'SPA-OUT-003', parentCategory: '아우터', childCategory: '자켓', itemName: '싱글 브레스트 자켓', locationType: '매장', locationName: '성수 쇼룸', actualStock: 64, availableStock: 58, safetyStock: 25, status: '정상', updatedAt: '2026.04.21 13:15' },
  { itemCode: 'SPA-OUT-004', parentCategory: '아우터', childCategory: '가디건', itemName: '브이넥 니트 가디건', locationType: '창고', locationName: '대전 허브창고', actualStock: 0, availableStock: 0, safetyStock: 35, status: '품절', updatedAt: '2026.04.21 12:40' },
]

const childCategoryOptions = computed(() =>
  selectedParentCategory.value ? categoryMap[selectedParentCategory.value] : [],
)

const currentLocationOptions = computed(() => locationOptions[locationType.value])

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
  const keyword = searchTerm.value.trim().toLowerCase()

  return inventoryData.filter((item) => {
    const matchesType = item.locationType === locationType.value
    const matchesLocation = selectedLocations.value.length === 0 || selectedLocations.value.includes(item.locationName)
    const matchesParentCategory = !selectedParentCategory.value || item.parentCategory === selectedParentCategory.value
    const matchesChildCategory = !selectedChildCategory.value || item.childCategory === selectedChildCategory.value
    const matchesStatus = !selectedStatus.value || item.status === selectedStatus.value
    const matchesKeyword = !keyword || [item.itemCode, item.itemName, item.locationName].join(' ').toLowerCase().includes(keyword)

    return matchesType && matchesLocation && matchesParentCategory && matchesChildCategory && matchesStatus && matchesKeyword
  })
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

const handleDocumentClick = (event) => {
  if (!locationDropdownRef.value?.contains(event.target)) {
    isLocationDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
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
                <th class="px-3 py-3 font-black">위치</th>
                <th class="px-3 py-3 text-right font-black">실제고</th>
                <th class="px-3 py-3 text-right font-black">가용재고</th>
                <th class="px-3 py-3 text-right font-black">안전재고</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
                <th class="px-3 py-3 font-black">최종 업데이트</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in filteredInventory" :key="`${item.itemCode}-${item.locationName}`" class="hover:bg-[#EBF5F5]/60">
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ item.itemCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-800">{{ item.parentCategory }} &gt; {{ item.childCategory }}</td>
                <td class="px-3 py-3 font-bold text-gray-900">{{ item.itemName }}</td>
                <td class="px-3 py-3 text-gray-700">{{ item.locationType }}: {{ item.locationName }}</td>
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
                <td colspan="9" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
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

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'
import PaginationNav from '@/components/common/PaginationNav.vue'
import LocationTreeFilter from '@/components/common/LocationTreeFilter.vue'
import InventoryModeToggle from '@/components/common/InventoryModeToggle.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { getCompanyWideInventories, getCompanyWideInventorySkus, getCompanyWideInventorySkuFacets } from '@/api/hq/inventory.js'

const hqMenus = roleMenus.hq
const inventoryMenus = []

const activeTopMenu = computed(() => '전사 재고 조회')

// BE SQL 매칭 호환 — 한글 이름 그대로 사용 (Category.name 매칭).
const categoryMap = {
  상의: ['반팔', '긴팔', '셔츠', '니트', '후드티'],
  바지: ['청바지', '반바지', '긴바지', '츄리닝'],
  치마: ['미니스커트', '롱스커트'],
  아우터: ['패딩', '후드집업', '자켓', '가디건'],
}

// 지역: '' = 전체, 그 외 한글 지역명 (BE locationOptions 의 region)
const selectedRegion = ref('')
// 거점 유형: '' = 전체, 'STORE' = 매장, 'WAREHOUSE' = 창고
const locationType = ref('')
const selectedLocationIds = ref([])
const selectedParentCategory = ref('')         // 대분류 (한글 이름) — 예: '상의'/'바지'/''
const selectedChildCategory = ref('')          // 소분류 (한글 이름) — 예: '반팔'/''
const selectedStatus = ref('')                 // '정상'/'부족'/'품절'/''
const searchTerm = ref('')
const currentMode = ref('master')              // 'master' | 'sku'
const selectedColor = ref('')
const selectedSize = ref('')

const isLoading = ref(false)
const loadError = ref('')

// 검색 입력 디바운스 (300ms) — 글자 칠 때마다 SQL 폭발 방지
const debouncedSearchTerm = ref('')
let searchDebounceTimer = null
watch(searchTerm, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchTerm.value = val
  }, 300)
})

const inventoryData = ref([])                  // 마스터 모드 행
const skuData = ref([])                        // SKU 모드 행
const locationOptionsRaw = ref([])             // BE 응답 locationOptions (region 포함)
const facetColors = ref([])                    // SKU 모드 칩 필터 — 거점/카테고리/검색 조건 안 distinct 색상
const facetSizes = ref([])                     //   동일 — 사이즈

// 페이징 상태
const currentPage = ref(0)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)
const hasNext = ref(false)
const hasPrevious = ref(false)

const locationTypeOptions = [
  { value: '', label: '전체' },
  { value: 'STORE', label: '매장' },
  { value: 'WAREHOUSE', label: '창고' },
]

// 지역 옵션 — BE locationOptions 의 distinct region (가나다 정렬)
const regionOptions = computed(() => {
  const set = new Set()
  for (const o of locationOptionsRaw.value) {
    if (o.region) set.add(o.region)
  }
  return [...set].sort((a, b) => a.localeCompare(b))
})

// LocationTreeFilter 에 넘길 옵션 — 지역 + 거점 유형 필터로 거른 후 전달.
const treeOptions = computed(() => {
  let list = locationOptionsRaw.value
  if (selectedRegion.value) list = list.filter(o => o.region === selectedRegion.value)
  if (locationType.value) list = list.filter(o => o.locationType === locationType.value)
  return list
})

// BE 로 보낼 locationIds 결정 — 개별 거점 선택이 우선, 없으면 지역(+유형)으로 좁힌 거점 전체.
// 지역만 선택한 경우 해당 지역 거점 id 를 모아 보내 BE region 파라미터 없이도 지역 단위 조회가 된다.
function resolveLocationIds() {
  if (selectedLocationIds.value.length > 0) return selectedLocationIds.value
  if (selectedRegion.value) {
    const ids = treeOptions.value.map(o => o.id)
    return ids.length > 0 ? ids : null
  }
  return null
}

// 소분류 옵션 — 대분류 선택 시 활성화
const childCategoryOptions = computed(() =>
  selectedParentCategory.value ? (categoryMap[selectedParentCategory.value] ?? []) : [],
)

// 지역 변경 시 선택된 거점 리셋 (다른 지역 거점 id 가 남으면 안 됨)
function handleRegionChange() {
  selectedLocationIds.value = []
}

// 거점 유형 변경 시 선택된 거점 리셋 (다른 type 의 id 가 그대로 남으면 의미 X)
function handleLocationTypeChange() {
  selectedLocationIds.value = []
}

// 대분류 변경 시 소분류 리셋
function handleParentCategoryChange() {
  selectedChildCategory.value = ''
}

function resetFilters() {
  selectedRegion.value = ''
  locationType.value = ''
  selectedLocationIds.value = []
  selectedParentCategory.value = ''
  selectedChildCategory.value = ''
  selectedStatus.value = ''
  searchTerm.value = ''
  selectedColor.value = ''
  selectedSize.value = ''
}

function locationTypeFromCode(code) {
  if (typeof code !== 'string') return null
  if (code.startsWith('WH-')) return 'WAREHOUSE'
  if (code.startsWith('ST-')) return 'STORE'
  return null
}

function buildCommonParams() {
  const params = {
    page: currentPage.value,
    size: pageSize.value,
  }
  if (locationType.value) params.locationType = locationType.value
  const locIds = resolveLocationIds()
  if (locIds) params.locationIds = locIds
  if (selectedParentCategory.value) params.parentCategory = selectedParentCategory.value
  if (selectedChildCategory.value) params.childCategory = selectedChildCategory.value
  // 마스터 모드 status 는 클라 필터(filteredInventory computed)에서 처리. SKU 모드만 BE 전송.
  // 마스터 endpoint 의 status 파라미터는 InventoryStatus enum (NORMAL/CIRCULAR_CANDIDATE/CIRCULAR) 으로
  // 한글 라벨("정상"/"부족"/"품절") 전송 시 변환 실패 → 400 Bad Request.
  if (selectedStatus.value && currentMode.value === 'sku') params.status = selectedStatus.value
  if (debouncedSearchTerm.value.trim()) params.keyword = debouncedSearchTerm.value.trim()
  return params
}

function applyLocationOptions(options) {
  locationOptionsRaw.value = (Array.isArray(options) ? options : []).map(o => ({
    id: o.id,
    code: o.code,
    name: o.name,
    region: o.region ?? '',
    locationType: locationTypeFromCode(o.code),
  }))
}

function applyPagingMeta(res) {
  totalElements.value = Number(res?.totalElements ?? 0)
  totalPages.value = Number(res?.totalPages ?? 0)
  hasNext.value = Boolean(res?.hasNext)
  hasPrevious.value = Boolean(res?.hasPrevious)
}

function clearPagingMeta() {
  totalElements.value = 0
  totalPages.value = 0
  hasNext.value = false
  hasPrevious.value = false
}

async function fetchMaster() {
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await getCompanyWideInventories(buildCommonParams())
    const items = Array.isArray(res?.items) ? res.items : []
    applyLocationOptions(res?.locationOptions)
    inventoryData.value = items.map(item => ({
      itemCode: item.itemCode,
      parentCategory: item.parentCategory,
      childCategory: item.childCategory,
      itemName: item.itemName,
      actualStock: Number(item.actualStock ?? 0),
      availableStock: Number(item.availableStock ?? 0),
      safetyStock: Number(item.safetyStock ?? 0),
      status: item.status,
    }))
    applyPagingMeta(res)
  } catch (e) {
    loadError.value = e?.message || '전사 재고 조회에 실패했습니다.'
    inventoryData.value = []
    clearPagingMeta()
  } finally {
    isLoading.value = false
  }
}

async function fetchSku() {
  isLoading.value = true
  loadError.value = ''
  try {
    const params = buildCommonParams()
    if (selectedColor.value) params.color = selectedColor.value
    // 주의: BE Pageable 의 size 와 충돌 방지 위해 SKU 사이즈는 skuSize 키로 전송
    if (selectedSize.value) params.skuSize = selectedSize.value
    const res = await getCompanyWideInventorySkus(params)
    const items = Array.isArray(res?.items) ? res.items : []
    applyLocationOptions(res?.locationOptions)
    skuData.value = items.map(item => ({
      skuCode: item.skuCode,
      itemCode: item.itemCode,
      itemName: item.itemName,
      parentCategory: item.parentCategory,
      childCategory: item.childCategory,
      color: item.color,
      size: item.size,
      actualStock: Number(item.actualStock ?? 0),
      availableStock: Number(item.availableStock ?? 0),
      safetyStock: Number(item.safetyStock ?? 0),
      status: item.status,
    }))
    applyPagingMeta(res)
  } catch (e) {
    loadError.value = e?.message || 'SKU 재고 조회에 실패했습니다.'
    skuData.value = []
    clearPagingMeta()
  } finally {
    isLoading.value = false
  }
}

function fetchByMode() {
  if (currentMode.value === 'sku') return fetchSku()
  return fetchMaster()
}

// 필터 변경 시 page 0 리셋 후 fetch (page 가 이미 0 이면 직접 fetch — page watch 안 트리거)
function resetPageOrFetch() {
  if (currentPage.value === 0) fetchByMode()
  else currentPage.value = 0
}

// 마스터 모드 status 는 클라 필터 (기존 동작 유지 — InventoryStatus enum 이 한글 라벨과 매핑 안 됨)
const filteredInventory = computed(() => {
  if (!selectedStatus.value || currentMode.value !== 'master') return inventoryData.value
  return inventoryData.value.filter(item => item.status === selectedStatus.value)
})

async function fetchFacets() {
  if (currentMode.value !== 'sku') return
  try {
    const params = {}
    if (locationType.value) params.locationType = locationType.value
    const locIds = resolveLocationIds()
    if (locIds) params.locationIds = locIds
    if (selectedParentCategory.value) params.parentCategory = selectedParentCategory.value
    if (selectedChildCategory.value) params.childCategory = selectedChildCategory.value
    if (debouncedSearchTerm.value.trim()) params.keyword = debouncedSearchTerm.value.trim()
    const res = await getCompanyWideInventorySkuFacets(params)
    facetColors.value = Array.isArray(res?.colors) ? res.colors : []
    facetSizes.value = Array.isArray(res?.sizes) ? res.sizes : []
  } catch {
    facetColors.value = []
    facetSizes.value = []
  }
}

const locationSummary = computed(() => {
  const regionLabel = selectedRegion.value ? `${selectedRegion.value} ` : ''
  if (selectedLocationIds.value.length === 0) {
    if (!locationType.value) return `${regionLabel}전체 거점`
    return `${regionLabel}전체 ${locationType.value === 'WAREHOUSE' ? '창고' : '매장'}`
  }
  return `${selectedLocationIds.value.length}개 거점`
})

// 메인 fetch 트리거 — searchTerm 대신 debouncedSearchTerm 사용 (300ms 디바운스)
watch([selectedRegion, locationType, selectedLocationIds, selectedParentCategory, selectedChildCategory, debouncedSearchTerm, currentMode, selectedColor, selectedSize], () => {
  resetPageOrFetch()
})

// facets 갱신 — sku 모드 전환 또는 facets-relevant 필터 변경 시 (color/size 자체 변경은 facets 갱신 X — 자기 칩 사라지면 어색)
watch([currentMode, selectedRegion, locationType, selectedLocationIds, selectedParentCategory, selectedChildCategory, debouncedSearchTerm], () => {
  fetchFacets()
})

// 마스터 status 는 클라 필터 (BE 호출 안 함). SKU status 는 BE HAVING 필터.
watch(selectedStatus, () => {
  if (currentMode.value === 'sku') resetPageOrFetch()
})

watch(currentPage, () => {
  fetchByMode()
})

watch(pageSize, () => {
  resetPageOrFetch()
})

onMounted(() => {
  fetchByMode()
  fetchFacets()
})

const statusClass = (status) => ({
  정상: 'bg-[#EBF5F5] text-black',
  부족: 'bg-amber-50 text-amber-700',
  품절: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="inventoryMenus"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">전사 재고 조회</h1>
          </div>
          <div class="text-right text-xs font-bold text-gray-500">
            <p>조회 결과 {{ totalElements.toLocaleString() }}건</p>
            <p class="mt-1 text-gray-400">{{ locationSummary }}</p>
          </div>
        </div>

        <!-- 필터 영역 (한 줄, 8칸) — 지역 → 거점 유형 → 거점 선택 순 (큰 단위 → 작은 단위) -->
        <div class="grid gap-3 xl:grid-cols-[120px_120px_minmax(200px,1.4fr)_120px_120px_120px_minmax(160px,1.3fr)_auto]">
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">지역</span>
            <select
              v-model="selectedRegion"
              class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              @change="handleRegionChange"
            >
              <option value="">전체</option>
              <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">거점 유형</span>
            <select
              v-model="locationType"
              class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              @change="handleLocationTypeChange"
            >
              <option v-for="opt in locationTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>

          <div class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">거점 선택</span>
            <LocationTreeFilter
              v-model="selectedLocationIds"
              :options="treeOptions"
              :placeholder="locationType ? `전체 ${locationType === 'WAREHOUSE' ? '창고' : '매장'}` : '전체'"
            />
          </div>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">대분류</span>
            <select
              v-model="selectedParentCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              @change="handleParentCategoryChange"
            >
              <option value="">전체</option>
              <option v-for="c in Object.keys(categoryMap)" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">소분류</span>
            <select
              v-model="selectedChildCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C] disabled:bg-gray-50 disabled:text-gray-400"
              :disabled="!selectedParentCategory"
            >
              <option value="">전체</option>
              <option v-for="c in childCategoryOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">상태</span>
            <select
              v-model="selectedStatus"
              class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C]"
            >
              <option value="">전체</option>
              <option>정상</option>
              <option>부족</option>
              <option>품절</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">검색</span>
            <input
              :value="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="품목 코드, 품목명, SKU 코드"
              @input="searchTerm = $event.target.value"
              @compositionupdate="searchTerm = $event.target.value"
            />
          </label>

          <div class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">&nbsp;</span>
            <button
              type="button"
              class="h-9 border border-gray-200 bg-white px-3 text-xs font-black text-gray-600 hover:bg-gray-50 hover:text-black"
              @click="resetFilters"
            >필터 초기화</button>
          </div>
        </div>

        <!-- 3줄: 보기 + SKU 칩 영역 -->
        <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
          <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">보기</span>
          <InventoryModeToggle v-model="currentMode" />
          <div
            v-if="currentMode === 'sku' && (facetColors.length > 0 || facetSizes.length > 0)"
            class="flex flex-wrap items-center gap-3"
          >
            <div v-if="facetColors.length > 0" class="flex flex-wrap items-center gap-1">
              <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">색상</span>
              <button
                v-for="c in facetColors"
                :key="`color-${c}`"
                type="button"
                class="border px-2 py-0.5 text-[11px] font-bold transition-colors"
                :class="selectedColor === c
                  ? 'border-[#004D3C] bg-[#004D3C] text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
                @click="selectedColor = (selectedColor === c ? '' : c)"
              >{{ c }}</button>
            </div>
            <div v-if="facetSizes.length > 0" class="flex flex-wrap items-center gap-1">
              <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">사이즈</span>
              <button
                v-for="s in facetSizes"
                :key="`size-${s}`"
                type="button"
                class="border px-2 py-0.5 text-[11px] font-bold transition-colors"
                :class="selectedSize === s
                  ? 'border-[#004D3C] bg-[#004D3C] text-white'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
                @click="selectedSize = (selectedSize === s ? '' : s)"
              >{{ s }}</button>
            </div>
            <button
              v-if="selectedColor || selectedSize"
              type="button"
              class="ml-auto text-[11px] font-bold text-gray-500 underline hover:text-gray-700"
              @click="selectedColor = ''; selectedSize = ''"
            >색상/사이즈 초기화</button>
          </div>
        </div>
      </section>

      <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
        <div v-if="loadError" class="bg-red-50 px-4 py-2 text-xs font-bold text-red-700">{{ loadError }}</div>
        <div class="overflow-x-auto">
          <table v-if="currentMode === 'master'" class="w-full min-w-[960px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col class="w-[14%]" />  <!-- 품목코드 -->
              <col class="w-[16%]" />  <!-- 카테고리 -->
              <col />                  <!-- 품목명 — 잔여 (가장 넓음) -->
              <col class="w-[10%]" />  <!-- 실재고 -->
              <col class="w-[10%]" />  <!-- 가용재고 -->
              <col class="w-[10%]" />  <!-- 안전재고 -->
              <col class="w-[10%]" />  <!-- 상태 -->
            </colgroup>
            <thead class="bg-gray-50 text-[11px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">카테고리</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 text-right font-black">실재고</th>
                <th class="px-3 py-3 text-right font-black">가용재고</th>
                <th class="px-3 py-3 text-right font-black">안전재고</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in filteredInventory" :key="item.itemCode" class="hover:bg-[#EBF5F5]/60">
                <td class="truncate px-3 py-3 font-mono text-gray-400">{{ item.itemCode }}</td>
                <td class="truncate px-3 py-3 font-bold text-gray-800">{{ item.parentCategory }} &gt; {{ item.childCategory }}</td>
                <td class="truncate px-3 py-3 font-bold text-gray-900">{{ item.itemName }}</td>
                <td class="px-3 py-3 text-right font-black tabular-nums text-gray-900">{{ item.actualStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black tabular-nums text-gray-900">{{ item.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold tabular-nums text-gray-500">{{ item.safetyStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-12 justify-center px-2 py-1 text-xs font-black" :class="statusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredInventory.length === 0">
                <td colspan="7" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                  조건에 맞는 전사 재고가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>

          <table v-else class="w-full min-w-[1040px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col class="w-[20%]" />  <!-- SKU 코드 (긴 식별자) -->
              <col />                  <!-- 품목명 — 잔여 -->
              <col class="w-[8%]" />   <!-- 색상 -->
              <col class="w-[8%]" />   <!-- 사이즈 -->
              <col class="w-[10%]" />  <!-- 실재고 -->
              <col class="w-[10%]" />  <!-- 가용재고 -->
              <col class="w-[10%]" />  <!-- 안전재고 -->
              <col class="w-[10%]" />  <!-- 상태 -->
            </colgroup>
            <thead class="bg-gray-50 text-[11px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 font-black">SKU 코드</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">색상</th>
                <th class="px-3 py-3 font-black">사이즈</th>
                <th class="px-3 py-3 text-right font-black">실재고</th>
                <th class="px-3 py-3 text-right font-black">가용재고</th>
                <th class="px-3 py-3 text-right font-black">안전재고</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in skuData" :key="row.skuCode" class="hover:bg-[#EBF5F5]/60">
                <td class="truncate px-3 py-3 font-mono text-gray-400">{{ row.skuCode }}</td>
                <td class="truncate px-3 py-3 font-bold text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-800">{{ row.color }}</td>
                <td class="px-3 py-3 font-bold text-gray-800">{{ row.size }}</td>
                <td class="px-3 py-3 text-right font-black tabular-nums text-gray-900">{{ row.actualStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black tabular-nums text-gray-900">{{ row.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold tabular-nums text-gray-500">{{ row.safetyStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-12 justify-center px-2 py-1 text-xs font-black" :class="statusClass(row.status)">
                    {{ row.status }}
                  </span>
                </td>
              </tr>
              <tr v-if="skuData.length === 0">
                <td colspan="8" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                  조건에 맞는 SKU 재고가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <PaginationNav
          :page="currentPage"
          :size="pageSize"
          :total-pages="totalPages"
          :total-elements="totalElements"
          :has-previous="hasPrevious"
          :has-next="hasNext"
          @update:page="currentPage = $event"
          @update:size="pageSize = $event"
        />
      </section>
    </div>
  </AppLayout>
</template>

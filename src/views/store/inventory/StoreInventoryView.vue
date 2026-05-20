<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'
import PaginationNav from '@/components/common/PaginationNav.vue'
import InventoryModeToggle from '@/components/common/InventoryModeToggle.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { STORE_CATEGORY_MAP } from '@/constants/storeCategoryMap.js'
import { useAuthStore } from '@/stores/auth.js'
import {
  getStoreInventories,
  getStoreInventorySkus,
  getStoreInventorySkuFacets,
} from '@/api/store/inventory.js'
import { extractErrorMessage } from '@/api/axios.js'
import SkuFacetChips from '@/components/store/SkuFacetChips.vue'

const auth = useAuthStore()
const storeTopMenus = roleMenus.store
const activeTopMenu = computed(() => '매장 재고 조회')

const selectedParentCategory = ref('')
const selectedChildCategory = ref('')
const selectedStatus = ref('')
const searchTerm = ref('')
const currentMode = ref('master')
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

const inventoryData = ref([])
const skuData = ref([])
const facetColors = ref([])
const facetSizes = ref([])

// 페이징 상태
const currentPage = ref(0)
const pageSize = ref(20)
const totalElements = ref(0)
const totalPages = ref(0)
const hasNext = ref(false)
const hasPrevious = ref(false)

const childCategoryOptions = computed(() =>
  selectedParentCategory.value ? (STORE_CATEGORY_MAP[selectedParentCategory.value] ?? []) : [],
)

const statusClass = (status) => ({
  정상: 'bg-[#EBF5F5] text-black',
  부족: 'bg-amber-50 text-amber-700',
  품절: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

function handleParentCategoryChange() {
  selectedChildCategory.value = ''
}

function resetFilters() {
  selectedParentCategory.value = ''
  selectedChildCategory.value = ''
  selectedStatus.value = ''
  searchTerm.value = ''
  selectedColor.value = ''
  selectedSize.value = ''
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
    // 마스터 endpoint 는 category 단일 파라미터 — child 우선, 없으면 parent.
    const params = {
      page: currentPage.value,
      size: pageSize.value,
    }
    const category = selectedChildCategory.value || selectedParentCategory.value
    if (category) params.category = category
    if (selectedStatus.value) params.status = selectedStatus.value
    if (debouncedSearchTerm.value.trim()) params.keyword = debouncedSearchTerm.value.trim()
    const res = await getStoreInventories(params)
    const items = Array.isArray(res?.items) ? res.items : []
    inventoryData.value = items.map((row) => ({
      itemCode: row.itemCode,
      parentCategory: row.parentCategory,
      childCategory: row.childCategory,
      itemName: row.itemName,
      actualStock: Number(row.actualStock ?? 0),
      availableStock: Number(row.availableStock ?? 0),
      safetyStock: Number(row.safetyStock ?? 0),
      status: row.status,
    }))
    applyPagingMeta(res)
  } catch (e) {
    loadError.value = extractErrorMessage(e, '매장 재고를 불러오지 못했습니다.')
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
    const params = { page: currentPage.value, size: pageSize.value }
    const category = selectedChildCategory.value || selectedParentCategory.value
    if (category) params.category = category
    if (selectedStatus.value) params.status = selectedStatus.value
    if (debouncedSearchTerm.value.trim()) params.keyword = debouncedSearchTerm.value.trim()
    if (selectedColor.value) params.color = selectedColor.value
    // 주의: BE Pageable 의 size 와 충돌 방지 위해 SKU 사이즈는 skuSize 키로 전송
    if (selectedSize.value) params.skuSize = selectedSize.value
    const res = await getStoreInventorySkus(params)
    const items = Array.isArray(res?.items) ? res.items : []
    skuData.value = items.map((row) => ({
      skuCode: row.skuCode,
      itemCode: row.itemCode,
      itemName: row.itemName,
      parentCategory: row.parentCategory,
      childCategory: row.childCategory,
      color: row.color,
      size: row.size,
      actualStock: Number(row.actualStock ?? 0),
      availableStock: Number(row.availableStock ?? 0),
      safetyStock: Number(row.safetyStock ?? 0),
      status: row.status,
    }))
    applyPagingMeta(res)
  } catch (e) {
    loadError.value = extractErrorMessage(e, 'SKU 재고를 불러오지 못했습니다.')
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

async function fetchFacets() {
  if (currentMode.value !== 'sku') return
  try {
    const params = {}
    const category = selectedChildCategory.value || selectedParentCategory.value
    if (category) params.category = category
    if (debouncedSearchTerm.value.trim()) params.keyword = debouncedSearchTerm.value.trim()
    const res = await getStoreInventorySkuFacets(params)
    facetColors.value = Array.isArray(res?.colors) ? res.colors : []
    facetSizes.value = Array.isArray(res?.sizes) ? res.sizes : []
  } catch {
    facetColors.value = []
    facetSizes.value = []
  }
}

// 메인 fetch 트리거 — searchTerm 대신 debouncedSearchTerm (300ms 디바운스)
watch([selectedParentCategory, selectedChildCategory, selectedStatus, debouncedSearchTerm, currentMode, selectedColor, selectedSize], () => {
  resetPageOrFetch()
})

// facets — sku 모드 전환 또는 facets-relevant 필터 변경 시 (color/size 자체 변경은 facets 갱신 X)
watch([currentMode, selectedParentCategory, selectedChildCategory, debouncedSearchTerm], () => {
  fetchFacets()
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
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeTopMenus"
    :side-menus="[]"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">매장 재고 조회</h1>
          </div>
          <div class="text-right text-xs font-bold text-gray-500">
            <p>내 매장: {{ auth.user?.locationCode ?? 'STORE' }} · {{ auth.user?.locationName ?? '매장' }}</p>
            <p class="mt-1 text-gray-400">조회 결과 {{ totalElements.toLocaleString() }}건</p>
          </div>
        </div>

        <!-- 필터 영역 (한 줄, 5칸) — 창고재고와 동일 grid 패턴 -->
        <div class="grid gap-3 xl:grid-cols-[120px_120px_120px_minmax(160px,1.3fr)_auto]">
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">대분류</span>
            <select
              v-model="selectedParentCategory"
              class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C]"
              @change="handleParentCategoryChange"
            >
              <option value="">전체</option>
              <option v-for="c in Object.keys(STORE_CATEGORY_MAP)" :key="c" :value="c">{{ c }}</option>
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
            <select v-model="selectedStatus" class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold">
              <option value="">전체</option>
              <option>정상</option>
              <option>부족</option>
              <option>품절</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">검색</span>
            <input :value="searchTerm" type="search" class="h-9 border border-gray-300 bg-white px-3 text-sm font-bold" placeholder="품목 코드, 품목명, SKU 코드" @input="searchTerm = $event.target.value" />
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

        <!-- 보기 + SKU 칩 영역 -->
        <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
          <span class="text-[11px] font-black uppercase tracking-wider text-gray-400">보기</span>
          <InventoryModeToggle v-model="currentMode" />
          <SkuFacetChips v-if="currentMode === 'sku'" :colors="facetColors" :sizes="facetSizes" v-model:selected-color="selectedColor" v-model:selected-size="selectedSize" />
        </div>
      </section>

      <section class="min-w-0 border border-gray-200 bg-white shadow-sm">
        <div v-if="loadError" class="bg-red-50 px-4 py-2 text-xs font-bold text-red-700">{{ loadError }}</div>
        <div class="overflow-x-auto">
          <table v-if="currentMode === 'master'" class="w-full min-w-[960px] table-fixed border-collapse text-left text-sm">
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
              <tr v-for="item in inventoryData" :key="item.itemCode" class="hover:bg-[#EBF5F5]/60">
                <td class="px-3 py-3 font-mono text-gray-500">{{ item.itemCode }}</td>
                <td class="px-3 py-3 font-bold">{{ item.parentCategory }} > {{ item.childCategory }}</td>
                <td class="px-3 py-3 font-bold">{{ item.itemName }}</td>
                <td class="px-3 py-3 text-right font-black">{{ item.actualStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black">{{ item.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold">{{ item.safetyStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center"><span class="inline-flex min-w-12 justify-center px-2 py-1 text-xs font-black" :class="statusClass(item.status)">{{ item.status }}</span></td>
              </tr>
              <tr v-if="inventoryData.length === 0">
                <td colspan="7" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                  {{ isLoading ? '매장 재고를 불러오는 중입니다.' : '조건에 맞는 매장 재고가 없습니다.' }}
                </td>
              </tr>
            </tbody>
          </table>

          <table v-else class="w-full min-w-[1040px] table-fixed border-collapse text-left text-sm">
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
                <td class="px-3 py-3 font-mono text-gray-500">{{ row.skuCode }}</td>
                <td class="px-3 py-3 font-bold">{{ row.itemName }}</td>
                <td class="px-3 py-3">{{ row.color }}</td>
                <td class="px-3 py-3">{{ row.size }}</td>
                <td class="px-3 py-3 text-right font-black">{{ row.actualStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black">{{ row.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold">{{ row.safetyStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center"><span class="inline-flex min-w-12 justify-center px-2 py-1 text-xs font-black" :class="statusClass(row.status)">{{ row.status }}</span></td>
              </tr>
              <tr v-if="skuData.length === 0"><td colspan="8" class="px-3 py-14 text-center text-sm font-bold text-gray-400">{{ isLoading ? 'SKU 재고를 불러오는 중입니다.' : '조건에 맞는 SKU 재고가 없습니다.' }}</td></tr>
            </tbody>
          </table>
        </div>

        <PaginationNav
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-elements="totalElements"
          :page-size="pageSize"
          :has-next="hasNext"
          :has-previous="hasPrevious"
          @update:current-page="(v) => (currentPage = v)"
          @update:page-size="(v) => (pageSize = v)"
        />
      </section>
    </div>
  </AppLayout>
</template>

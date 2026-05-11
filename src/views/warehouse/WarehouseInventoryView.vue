<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getWarehouseInventories } from '@/api/warehouse/inventory.js'
import { extractErrorMessage } from '@/api/axios.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const warehouseTopMenus = roleMenus.warehouse
const activeTopMenu = computed(() => '창고 재고 조회')

const categoryMap = {
  상의: ['반팔', '긴팔', '셔츠', '니트', '후드티'],
  바지: ['청바지', '반바지', '긴바지', '츄리닝'],
  치마: ['미니스커트', '롱스커트'],
  아우터: ['패딩', '후드집업', '자켓', '가디건'],
}

const inventoryData = ref([])
const isLoading = ref(false)
const loadError = ref('')

const selectedParentCategory = ref(typeof route.query.parent === 'string' ? route.query.parent : '')
const selectedChildCategory = ref(typeof route.query.child === 'string' ? route.query.child : '')
const selectedStatus = ref(typeof route.query.status === 'string' ? route.query.status : '')
const searchTerm = ref(typeof route.query.search === 'string' ? route.query.search : '')

const childCategoryOptions = computed(() =>
  selectedParentCategory.value ? categoryMap[selectedParentCategory.value] : [],
)

const filteredInventory = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  return inventoryData.value.filter((item) => {
    const matchesParent = !selectedParentCategory.value || item.parentCategory === selectedParentCategory.value
    const matchesChild = !selectedChildCategory.value || item.childCategory === selectedChildCategory.value
    const matchesStatus = !selectedStatus.value || item.status === selectedStatus.value
    const matchesKeyword = !keyword || [item.itemCode, item.itemName].join(' ').toLowerCase().includes(keyword)
    return matchesParent && matchesChild && matchesStatus && matchesKeyword
  })
})

const statusClass = (status) => ({
  정상: 'bg-[#EBF5F5] text-black',
  부족: 'bg-amber-50 text-amber-700',
  품절: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

const today = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

function handleParentCategoryChange() {
  selectedChildCategory.value = ''
}

function resetFilters() {
  selectedParentCategory.value = ''
  selectedChildCategory.value = ''
  selectedStatus.value = ''
  searchTerm.value = ''
}

function moveToSkuDetail(item) {
  router.push({
    name: 'wh-inventory-sku-detail',
    params: { itemCode: item.itemCode },
    query: {
      itemCode: item.itemCode,
      itemName: item.itemName,
      parentCategory: item.parentCategory,
      childCategory: item.childCategory,
      search: searchTerm.value || undefined,
      parent: selectedParentCategory.value || undefined,
      child: selectedChildCategory.value || undefined,
      status: selectedStatus.value || undefined,
    },
  })
}




async function loadInventories() {
  isLoading.value = true
  loadError.value = ''
  try {
    const rows = await getWarehouseInventories()
    inventoryData.value = Array.isArray(rows)
      ? rows.map(row => ({
        ...row,
        actualStock: Number(row.actualStock ?? 0),
        availableStock: Number(row.availableStock ?? 0),
        safetyStock: Number(row.safetyStock ?? 0),
      }))
      : []
  } catch (e) {
    inventoryData.value = []
    loadError.value = extractErrorMessage(e, '창고 재고를 불러오지 못했습니다.')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadInventories()
})

</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="warehouseTopMenus"
    :side-menus="[]"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">창고 재고 조회</h1>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>{{ auth.user?.locationCode ?? 'WAREHOUSE' }} · {{ auth.user?.locationName ?? '창고' }}</p>
            <p class="mt-1 text-gray-400">기준일 {{ today }} · 조회 {{ filteredInventory.length }}건</p>
          </div>
        </div>
        <p v-if="loadError" class="mb-3 text-xs font-bold text-red-600">{{ loadError }}</p>

        <div class="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr]">
          <label class="flex flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="품목 코드, 품목명"
            />
          </label>

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
            <span class="text-[11px] font-bold text-gray-500">재고 상태</span>
            <select
              v-model="selectedStatus"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
            >
              <option value="">전체</option>
              <option value="정상">정상</option>
              <option value="부족">부족</option>
              <option value="품절">품절</option>
            </select>
          </label>

          <div class="flex items-end">
            <button
              type="button"
              class="h-9 w-full border border-gray-300 bg-white px-3 text-xs font-black text-gray-600 hover:bg-gray-50"
              @click="resetFilters"
            >
              필터 초기화
            </button>
          </div>
        </div>
      </section>

      <section class="min-h-0">
        <div class="min-w-0 border border-gray-200 bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-[1100px] w-full border-collapse text-left text-xs">
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
                  <td class="px-3 py-3 font-bold text-gray-500">{{ item.updatedAt ? new Date(item.updatedAt).toLocaleString('ko-KR', { hour12: false }) : '-' }}</td>
                </tr>
                <tr v-if="filteredInventory.length === 0">
                  <td colspan="8" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                    {{ isLoading ? '창고 재고를 불러오는 중입니다.' : '조건에 맞는 창고 재고가 없습니다.' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

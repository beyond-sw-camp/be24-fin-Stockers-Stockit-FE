<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const storeMenus = roleMenus.store
const sideMenus = roleMenus.store.find((menu) => menu.label === '재고 관리')?.children ?? []

const activeTopMenu = ref('재고 관리')
const activeSideMenu = ref('매장 재고 조회')

const storeInfo = {
  code: 'ST-SEOUL-01',
  name: '강남 플래그십',
}

const categoryMap = {
  상의: ['반팔', '긴팔', '셔츠', '니트', '후드티'],
  바지: ['청바지', '반바지', '긴바지', '츄리닝'],
  치마: ['미니스커트', '롱스커트'],
  아우터: ['패딩', '후드집업', '자켓', '가디건'],
}

const inventoryData = [
  { itemCode: 'SPA-TOP-001', parentCategory: '상의', childCategory: '반팔', itemName: '코튼 베이직 반팔 티셔츠', actualStock: 64, availableStock: 58, safetyStock: 20, status: '정상', updatedAt: '2026.04.28 09:20' },
  { itemCode: 'SPA-TOP-002', parentCategory: '상의', childCategory: '긴팔', itemName: '슬림핏 긴팔 티셔츠', actualStock: 14, availableStock: 10, safetyStock: 16, status: '부족', updatedAt: '2026.04.28 09:05' },
  { itemCode: 'SPA-TOP-003', parentCategory: '상의', childCategory: '셔츠', itemName: '오버핏 옥스포드 셔츠', actualStock: 42, availableStock: 37, safetyStock: 18, status: '정상', updatedAt: '2026.04.28 08:50' },
  { itemCode: 'SPA-TOP-004', parentCategory: '상의', childCategory: '니트', itemName: '라운드넥 소프트 니트', actualStock: 0, availableStock: 0, safetyStock: 12, status: '품절', updatedAt: '2026.04.28 08:30' },
  { itemCode: 'SPA-PNT-001', parentCategory: '바지', childCategory: '청바지', itemName: '스트레이트 워싱 데님', actualStock: 23, availableStock: 20, safetyStock: 15, status: '정상', updatedAt: '2026.04.27 19:10' },
  { itemCode: 'SPA-PNT-002', parentCategory: '바지', childCategory: '반바지', itemName: '라이트 코튼 쇼츠', actualStock: 9, availableStock: 6, safetyStock: 10, status: '부족', updatedAt: '2026.04.27 18:40' },
  { itemCode: 'SPA-PNT-003', parentCategory: '바지', childCategory: '긴바지', itemName: '와이드 밴딩 팬츠', actualStock: 31, availableStock: 27, safetyStock: 12, status: '정상', updatedAt: '2026.04.27 18:10' },
  { itemCode: 'SPA-SKT-001', parentCategory: '치마', childCategory: '미니스커트', itemName: 'A라인 데님 미니스커트', actualStock: 4, availableStock: 2, safetyStock: 7, status: '부족', updatedAt: '2026.04.27 17:30' },
  { itemCode: 'SPA-SKT-002', parentCategory: '치마', childCategory: '롱스커트', itemName: '플리츠 롱스커트', actualStock: 0, availableStock: 0, safetyStock: 8, status: '품절', updatedAt: '2026.04.27 17:10' },
  { itemCode: 'SPA-OUT-001', parentCategory: '아우터', childCategory: '패딩', itemName: '라이트 숏 패딩', actualStock: 18, availableStock: 16, safetyStock: 8, status: '정상', updatedAt: '2026.04.27 16:45' },
  { itemCode: 'SPA-OUT-002', parentCategory: '아우터', childCategory: '후드집업', itemName: '스웨트 후드 집업', actualStock: 7, availableStock: 5, safetyStock: 9, status: '부족', updatedAt: '2026.04.27 16:15' },
  { itemCode: 'SPA-OUT-003', parentCategory: '아우터', childCategory: '자켓', itemName: '싱글 브레스트 자켓', actualStock: 15, availableStock: 12, safetyStock: 7, status: '정상', updatedAt: '2026.04.27 15:55' },
]

const selectedParentCategory = ref(typeof route.query.parent === 'string' ? route.query.parent : '')
const selectedChildCategory = ref(typeof route.query.child === 'string' ? route.query.child : '')
const selectedStatus = ref(typeof route.query.status === 'string' ? route.query.status : '')
const searchTerm = ref(typeof route.query.search === 'string' ? route.query.search : '')

const childCategoryOptions = computed(() =>
  selectedParentCategory.value ? categoryMap[selectedParentCategory.value] : [],
)

const filteredInventory = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  return inventoryData.filter((item) => {
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
    name: 'store-inventory-sku-detail',
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

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">매장 재고 조회</h1>
          </div>
          <div class="text-right text-[11px] font-bold text-gray-500">
            <p>{{ storeInfo.code }} · {{ storeInfo.name }}</p>
            <p class="mt-1 text-gray-400">기준일 {{ today }} · 조회 {{ filteredInventory.length }}건</p>
          </div>
        </div>

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
                  <td class="px-3 py-3 font-bold text-gray-500">{{ item.updatedAt }}</td>
                </tr>
                <tr v-if="filteredInventory.length === 0">
                  <td colspan="8" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                    조건에 맞는 매장 재고가 없습니다.
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

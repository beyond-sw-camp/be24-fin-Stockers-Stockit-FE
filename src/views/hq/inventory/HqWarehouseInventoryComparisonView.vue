<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { transferSkuCatalog, buildWarehouseRows, getImbalanceMetrics } from '@/constants/hqWarehouseTransferData.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find(menu => menu.label === '재고 관리')?.children ?? []

const activeTopMenu = computed(() => '재고 관리')
const activeSideMenu = ref('창고간 재고 이동')

const searchTerm = ref(String(route.query.search || ''))
const selectedCategory = ref(String(route.query.category || '전체'))
const selectedStatus = ref(String(route.query.status || '전체'))
const selectedWarehouseGroup = ref(String(route.query.warehouseGroup || '전체'))

const categoryOptions = computed(() => ['전체', ...new Set(transferSkuCatalog.map(sku => sku.category))])
const warehouseGroupOptions = ['전체', '수도권', '충청권', '영남권']

const warehouseGroupByCode = {
  'WH-ICN-01': '수도권',
  'WH-ICH-01': '수도권',
  'WH-DJN-01': '충청권',
  'WH-BSN-01': '영남권',
}

const skuRows = computed(() => transferSkuCatalog.map((sku) => {
  const rows = buildWarehouseRows(sku.skuCode)
  const metrics = getImbalanceMetrics(rows)
  const totalOnHand = rows.reduce((sum, row) => sum + row.onHandStock, 0)
  const totalAvailable = rows.reduce((sum, row) => sum + row.availableStock, 0)

  return {
    ...sku,
    totalOnHand,
    totalAvailable,
    ...metrics,
    warehouseGroups: [...new Set(rows.map(row => warehouseGroupByCode[row.warehouseCode]).filter(Boolean))],
  }
}))

const filteredSkuRows = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()

  return skuRows.value
    .filter((row) => {
      if (selectedCategory.value !== '전체' && row.category !== selectedCategory.value) return false
      if (selectedStatus.value !== '전체' && row.status !== selectedStatus.value) return false
      if (selectedWarehouseGroup.value !== '전체' && !row.warehouseGroups.includes(selectedWarehouseGroup.value)) return false
      if (!keyword) return true

      return [row.skuCode, row.itemCode, row.itemName].join(' ').toLowerCase().includes(keyword)
    })
    .sort((a, b) => b.imbalanceScore - a.imbalanceScore)
})

const statusClass = (status) => ({
  정상: 'bg-[#EBF5F5] text-black',
  주의: 'bg-amber-50 text-amber-700',
  불균형: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

const moveToSkuDetail = (sku) => {
  router.push({
    name: 'hq-inventory-warehouse-transfer-detail',
    params: { skuCode: sku.skuCode },
    query: {
      search: searchTerm.value || undefined,
      category: selectedCategory.value !== '전체' ? selectedCategory.value : undefined,
      status: selectedStatus.value !== '전체' ? selectedStatus.value : undefined,
      warehouseGroup: selectedWarehouseGroup.value !== '전체' ? selectedWarehouseGroup.value : undefined,
    },
  })
}

const resetFilters = () => {
  searchTerm.value = ''
  selectedCategory.value = '전체'
  selectedStatus.value = '전체'
  selectedWarehouseGroup.value = '전체'
}

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
        <div class="mb-4">
          <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
          <h1 class="mt-1 text-lg font-black text-gray-900">창고간 재고 이동</h1>
          <p class="mt-1 text-xs font-bold text-gray-500">불균형 SKU를 우선 확인하고 상세에서 창고 간 이동을 실행합니다.</p>
        </div>

        <div class="grid gap-2 md:grid-cols-2 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_auto]">
          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="SKU 코드, 품목 코드, 품목명"
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">카테고리</span>
            <select v-model="selectedCategory" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option v-for="category in categoryOptions" :key="category" :value="category">{{ category }}</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">불균형 상태</span>
            <select v-model="selectedStatus" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option value="전체">전체</option>
              <option value="불균형">불균형</option>
              <option value="주의">주의</option>
              <option value="정상">정상</option>
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-[11px] font-bold text-gray-500">창고군</span>
            <select v-model="selectedWarehouseGroup" class="h-10 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]">
              <option v-for="group in warehouseGroupOptions" :key="group" :value="group">{{ group }}</option>
            </select>
          </label>

          <div class="flex items-end">
            <button type="button" class="h-10 border border-gray-300 px-4 text-xs font-black text-gray-700 transition hover:bg-gray-100" @click="resetFilters">
              초기화
            </button>
          </div>
        </div>
      </section>

      <section class="border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">불균형 SKU 리스트</h2>
          <p class="text-[11px] font-black text-gray-500">총 {{ filteredSkuRows.length }}건</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[1080px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 font-black">SKU 코드</th>
                <th class="px-3 py-3 font-black">품목 코드</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">옵션</th>
                <th class="px-3 py-3 font-black">카테고리</th>
                <th class="px-3 py-3 text-right font-black">총 실재고</th>
                <th class="px-3 py-3 text-right font-black">총 가용재고</th>
                <th class="px-3 py-3 text-right font-black">불균형 점수</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in filteredSkuRows"
                :key="row.skuCode"
                class="cursor-pointer transition hover:bg-[#EBF5F5]/60"
                @click="moveToSkuDetail(row)"
              >
                <td class="px-3 py-3 font-mono font-bold text-gray-700">{{ row.skuCode }}</td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.itemCode }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ row.itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.color }}/{{ row.size }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.category }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.totalOnHand.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.totalAvailable.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.imbalanceScore.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-14 justify-center px-2 py-1 text-[11px] font-black" :class="statusClass(row.status)">{{ row.status }}</span>
                </td>
              </tr>

              <tr v-if="filteredSkuRows.length === 0">
                <td colspan="9" class="px-4 py-10 text-center text-xs font-bold text-gray-400">
                  조건에 맞는 SKU가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/common/AppLayout.vue'
import CircularStockInventoryBrowseSection from '@/components/hq/circular-stock/CircularStockInventoryBrowseSection.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useCircularStockInventoryStore } from '@/stores/hq/circularStock/circularStockInventory.js'

const inventoryStore = useCircularStockInventoryStore()
const hqMenus = roleMenus.hq
const circularStockMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 조회')
const isLoading = ref(false)
const loadError = ref('')

const loadCircularInventory = async (overrides = {}) => {
  isLoading.value = true
  loadError.value = ''
  try {
    await inventoryStore.loadCircularInventoryRows(overrides)
  } catch (e) {
    loadError.value = e.message || '순환 재고 조회에 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

function handlePageChange(page) {
  // PaginationNav 는 0-based 페이지 번호를 emit 하므로 그대로 서버 조회에 전달한다.
  loadCircularInventory({ page })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleSizeChange(size) {
  // 페이지 크기 변경 시 범위 이탈/빈 페이지 방지를 위해 1페이지(page=0)부터 다시 조회한다.
  loadCircularInventory({ page: 0, size })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleSortChange({ sort }) {
  // 정렬 변경 시 UX 일관성을 위해 항상 1페이지로 리셋한다.
  loadCircularInventory({ page: 0, sort })
}

function handleQueryChange(query) {
  // 필터/검색 조건 변경 시에도 항상 1페이지부터 재조회한다.
  loadCircularInventory({
    page: 0,
    keyword: query.keyword,
    warehouseCodes: query.warehouseCodes,
    materialGroup: query.materialGroup,
    materialName: query.materialName,
    materialNames: query.materialNames,
  })
}

onMounted(() => {
  // 요구사항: 순환재고 조회 화면 진입 시 항상 1페이지(0-based page=0)에서 시작한다.
  loadCircularInventory({ page: 0 })
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory</p>
          <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 조회</h1>
          <p class="mt-1 text-xs font-bold text-gray-500">
            순환 재고로 전환된 항목을 소재와 SKU 기준으로 조회합니다.
          </p>
          <p v-if="loadError" class="mt-2 text-xs font-bold text-red-600">{{ loadError }}</p>
        </div>
      </section>

      <CircularStockInventoryBrowseSection
        title="순환 재고 리스트"
        :description="isLoading ? '순환 재고를 불러오는 중입니다.' : '소재와 SKU 기준으로 순환 재고를 탐색하고 판매 대상 SKU를 확인합니다.'"
        :show-circular-sale-price-column="true"
        :use-fixed-column-widths="true"
        :pin-lead-columns="false"
        :server-mode="true"
        :page="inventoryStore.inventoryPage"
        :size="inventoryStore.inventorySize"
        :total-pages="inventoryStore.inventoryTotalPages"
        :total-elements="inventoryStore.inventoryTotalElements"
        :inventory-rows="inventoryStore.inventoryRows"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @sort-change="handleSortChange"
        @query-change="handleQueryChange"
      />
    </div>
  </AppLayout>
</template>

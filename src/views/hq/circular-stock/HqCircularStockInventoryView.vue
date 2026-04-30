<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import CircularStockInventoryBrowseSection from '@/components/hq/circular-stock/CircularStockInventoryBrowseSection.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCircularStockStore } from '@/stores/circularStock.js'

const router = useRouter()
const auth = useAuthStore()
const circularStockStore = useCircularStockStore()
const hqMenus = roleMenus.hq
const circularStockMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 조회')

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory</p>
          <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 조회</h1>
          <p class="mt-1 text-xs font-bold text-gray-500">
            순환 재고로 전환된 항목을 소재와 SKU 기준으로 조회합니다.
          </p>
        </div>
      </section>

      <CircularStockInventoryBrowseSection
        title="순환 재고 리스트"
        description="소재와 SKU 기준으로 순환 재고를 탐색하고 판매 대상 SKU를 확인합니다."
        :show-circular-sale-price-column="true"
        :inventory-rows="circularStockStore.inventoryRows"
      />
    </div>
  </AppLayout>
</template>

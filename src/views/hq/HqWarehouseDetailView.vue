<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getInfrastructureByCode } from '@/api/infrastructure.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeTopMenu = computed(() => '인프라 관리')
const activeSideMenu = ref('매장/창고 정보 관리')
const infraSideMenus = [{ label: '매장/창고 정보 관리', icon: 'store' }]

const warehouse = ref(null)
const isLoading = ref(false)
const loadError = ref('')

const statusToKor = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '점검중',
}

const warehouseCode = computed(() => String(route.params.warehouseId ?? '').trim())

const backQuery = computed(() => ({
  region: typeof route.query.region === 'string' ? route.query.region : undefined,
  status: typeof route.query.status === 'string' ? route.query.status : undefined,
  search: typeof route.query.search === 'string' ? route.query.search : undefined,
}))

const occupancy = computed(() => {
  if (!warehouse.value) return 0
  return Math.min(95, 20 + Number(warehouse.value.mappedStoreCount || 0) * 15)
})

const stockQty = computed(() => {
  if (!warehouse.value) return 0
  return Number(warehouse.value.mappedStoreCount || 0) * 1000
})

const connectedStoresPlaceholder = computed(() => {
  if (!warehouse.value) return []
  return Array.from({ length: Number(warehouse.value.mappedStoreCount || 0) }).map((_, index) => `연결 매장 ${index + 1}`)
})

async function loadWarehouseDetail() {
  isLoading.value = true
  loadError.value = ''
  try {
    const found = await getInfrastructureByCode(warehouseCode.value)
    if (found?.locationType !== 'WAREHOUSE') {
      throw new Error('창고 정보가 아닙니다.')
    }
    warehouse.value = found || null
  } catch (error) {
    loadError.value = error.message || '창고 정보를 불러오지 못했습니다.'
    warehouse.value = null
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({
    name: 'hq-infrastructure',
    query: backQuery.value,
  })
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  loadWarehouseDetail()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="infraSideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Warehouse Detail</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">창고 상세 정보</h1>
            <template v-if="warehouse">
              <p class="mt-2 text-sm font-bold text-gray-700">{{ warehouse.name }}</p>
              <p class="mt-1 text-xs font-bold text-gray-500">{{ warehouse.code }}</p>
            </template>
          </div>
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="goBack"
          >
            목록으로
          </button>
        </div>
      </section>

      <p v-if="loadError" class="border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{{ loadError }}</p>

      <section v-if="isLoading" class="border border-gray-300 bg-white p-10 text-center text-sm font-bold text-gray-400 shadow-sm">
        창고 정보를 불러오는 중입니다.
      </section>

      <section v-else-if="warehouse" class="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">기본 정보</h2>
          <div class="mt-3 grid gap-2 text-xs">
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">창고 코드</span><strong class="font-black text-gray-900">{{ warehouse.code }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">창고명</span><strong class="font-black text-gray-900">{{ warehouse.name }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">주소</span><strong class="font-black text-gray-900">{{ warehouse.address }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">담당 책임자</span><strong class="font-black text-gray-900">{{ warehouse.managerName }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">연락처</span><strong class="font-black text-gray-900">{{ warehouse.contact }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">창고 용량</span><strong class="font-black text-gray-900">{{ warehouse.capacity }}</strong></p>
            <p class="flex items-center justify-between"><span class="font-bold text-gray-500">상태</span><strong class="font-black text-gray-900">{{ statusToKor[warehouse.status] || warehouse.status }}</strong></p>
          </div>
        </article>

        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">공간 점유율 / 현재 재고</h2>
          <div class="mt-4">
            <div class="mb-2 flex items-center justify-between text-xs font-bold text-gray-600">
              <span>공간 점유율(추정)</span>
              <strong class="text-base font-black" :class="occupancy >= 90 ? 'text-red-600' : 'text-gray-900'">{{ occupancy }}%</strong>
            </div>
            <div class="h-3 w-full bg-gray-200">
              <div
                class="h-full"
                :class="occupancy >= 90 ? 'bg-red-500' : occupancy >= 80 ? 'bg-amber-500' : 'bg-[#0f766e]'"
                :style="{ width: `${occupancy}%` }"
              />
            </div>
            <p class="mt-2 text-right text-[11px] font-bold text-gray-500">
              현재 재고(추정) {{ stockQty.toLocaleString() }} EA
            </p>
            <p class="mt-2 text-[10px] font-bold text-gray-400">* 점유율/재고는 mappedStoreCount 기반 임시 추정치입니다.</p>
          </div>
        </article>

        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">연결 매장</h2>
          <ul class="mt-3 space-y-2">
            <li
              v-for="storeName in connectedStoresPlaceholder"
              :key="storeName"
              class="border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700"
            >
              {{ storeName }}
            </li>
            <li
              v-if="connectedStoresPlaceholder.length === 0"
              class="border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-center text-xs font-bold text-gray-400"
            >
              연결된 매장이 없습니다.
            </li>
          </ul>
        </article>

        <article class="border border-gray-300 bg-white p-4 shadow-sm">
          <h2 class="text-xs font-black uppercase tracking-[0.1em] text-gray-500">최근 입출고 이력</h2>
          <div class="mt-3 border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-center text-xs font-bold text-gray-400">
            최근 입출고 이력 API 연동 후 표시됩니다.
          </div>
        </article>
      </section>

      <section v-else class="border border-dashed border-gray-300 bg-white p-10 text-center text-sm font-bold text-gray-400 shadow-sm">
        존재하지 않는 창고입니다.
      </section>
    </div>
  </AppLayout>
</template>

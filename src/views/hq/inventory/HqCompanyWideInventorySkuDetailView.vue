<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getCompanyWideInventorySkus } from '@/api/inventory.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find(menu => menu.label === '재고 관리')?.children ?? []

const activeTopMenu = computed(() => '재고 관리')
const activeSideMenu = ref('전사 재고 조회')
const loadError = ref('')
const isLoading = ref(false)
const skuRows = ref([])

const itemCode = computed(() => String(route.params.itemCode ?? route.query.itemCode ?? ''))
const itemName = computed(() => String(route.query.itemName ?? '선택 품목'))
const parentCategory = computed(() => String(route.query.parentCategory ?? '-'))
const childCategory = computed(() => String(route.query.childCategory ?? '-'))
const locationType = computed(() => String(route.query.locationType ?? '-'))
const locationName = computed(() => String(route.query.locationName ?? '-'))
const filterLocationType = computed(() => {
  const queryType = typeof route.query.type === 'string' ? route.query.type : ''
  return queryType === '창고' ? '창고' : '매장'
})
const filterLocations = computed(() => {
  if (typeof route.query.locations !== 'string') return []
  return route.query.locations.split(',').map(location => location.trim()).filter(Boolean)
})
const filterLocationChips = computed(() =>
  filterLocations.value.length > 3 ? filterLocations.value.slice(0, 2) : filterLocations.value,
)
const hiddenFilterLocationCount = computed(() =>
  filterLocations.value.length > 3 ? filterLocations.value.length - 2 : 0,
)
const filterScopeLabel = computed(() =>
  filterLocations.value.length > 0 ? `${filterLocationType.value} 기준` : `전체${filterLocationType.value}`,
)

const statusClass = (status) => ({
  정상: 'bg-[#EBF5F5] text-black',
  부족: 'bg-amber-50 text-amber-700',
  품절: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

const backQuery = computed(() => ({
  type: typeof route.query.type === 'string' ? route.query.type : undefined,
  locations: typeof route.query.locations === 'string' ? route.query.locations : undefined,
  parent: typeof route.query.parent === 'string' ? route.query.parent : undefined,
  child: typeof route.query.child === 'string' ? route.query.child : undefined,
  status: typeof route.query.status === 'string' ? route.query.status : undefined,
  search: typeof route.query.search === 'string' ? route.query.search : undefined,
}))

async function loadSkuDetails() {
  isLoading.value = true
  loadError.value = ''
  try {
    const type = filterLocationType.value === '창고' ? 'WAREHOUSE' : 'STORE'
    const payload = {
      locationType: type,
      parentCategory: typeof route.query.parent === 'string' ? route.query.parent : undefined,
      childCategory: typeof route.query.child === 'string' ? route.query.child : undefined,
      keyword: typeof route.query.search === 'string' ? route.query.search : undefined,
    }
    const rows = await getCompanyWideInventorySkus(itemCode.value, payload)
    skuRows.value = Array.isArray(rows)
      ? rows.map(r => ({ ...r, updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleString('ko-KR', { hour12: false }) : '-' }))
      : []
  } catch (e) {
    loadError.value = e.message || 'SKU 재고 상세 조회에 실패했습니다.'
    skuRows.value = []
  } finally {
    isLoading.value = false
  }
}

function goBackToInventory() {
  router.push({
    name: 'hq-inventory-company-wide',
    query: backQuery.value,
  })
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  loadSkuDetails()
})
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
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">SKU Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">SKU 재고 상세</h1>
            <p class="mt-2 text-sm font-bold text-gray-700">{{ itemName }}</p>
            <p class="mt-1 text-xs font-bold text-gray-500">
              {{ itemCode }} · {{ parentCategory }} &gt; {{ childCategory }}
            </p>
            <p class="mt-1 text-xs font-bold text-gray-500">
              조회 범위: {{ locationName }}
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <span class="inline-flex items-center bg-[#EBF5F5] px-2 py-1 text-[11px] font-black text-black">
                집계 유형: {{ locationType }}
              </span>
              <span class="inline-flex items-center bg-gray-100 px-2 py-1 text-[11px] font-black text-gray-700">
                조회 기준: {{ filterScopeLabel }}
              </span>
              <template v-if="filterLocations.length > 0">
                <span
                  v-for="location in filterLocationChips"
                  :key="location"
                  class="inline-flex items-center bg-white px-2 py-1 text-[11px] font-black text-gray-700 ring-1 ring-gray-200"
                >
                  {{ location }}
                </span>
                <span
                  v-if="hiddenFilterLocationCount > 0"
                  class="inline-flex items-center bg-gray-100 px-2 py-1 text-[11px] font-black text-gray-600"
                >
                  외 {{ hiddenFilterLocationCount }}개
                </span>
              </template>
            </div>
          </div>
          <button
            type="button"
            class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="goBackToInventory"
          >
            목록으로
          </button>
        </div>
      </section>

      <section class="min-h-0 border border-gray-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-[980px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="px-3 py-3 font-black">SKU 코드</th>
                <th class="px-3 py-3 font-black">색상</th>
                <th class="px-3 py-3 font-black">사이즈</th>
                <th class="px-3 py-3 text-right font-black">실재고</th>
                <th class="px-3 py-3 text-right font-black">가용재고</th>
                <th class="px-3 py-3 text-right font-black">안전재고</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
                <th class="px-3 py-3 font-black">최종 업데이트</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="sku in skuRows" :key="sku.skuCode">
                <td class="px-3 py-3 font-mono font-bold text-gray-600">{{ sku.skuCode }}</td>
                <td class="px-3 py-3 font-bold text-gray-800">{{ sku.color }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ sku.size }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ sku.actualStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ sku.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold text-gray-500">{{ sku.safetyStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-12 justify-center px-2 py-1 text-[11px] font-black" :class="statusClass(sku.status)">
                    {{ sku.status }}
                  </span>
                </td>
                <td class="px-3 py-3 font-bold text-gray-500">{{ sku.updatedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

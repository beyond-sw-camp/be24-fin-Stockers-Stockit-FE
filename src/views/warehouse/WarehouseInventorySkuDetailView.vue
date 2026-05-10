<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { getWarehouseInventorySkus } from '@/api/warehouse/inventory.js'
import { extractErrorMessage } from '@/api/axios.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const warehouseTopMenus = roleMenus.warehouse
const warehouseSideMenus = roleMenus.warehouse.find((menu) => menu.label === '재고 관리')?.children ?? []

const activeSideMenu = ref('창고 재고 조회')
const activeTopMenu = computed(() => '재고 관리')

const itemCode = computed(() => String(route.params.itemCode ?? route.query.itemCode ?? ''))
const itemName = computed(() => String(route.query.itemName ?? '선택 품목'))
const parentCategory = computed(() => String(route.query.parentCategory ?? '-'))
const childCategory = computed(() => String(route.query.childCategory ?? '-'))

const skuData = ref([])
const isLoading = ref(false)
const loadError = ref('')
const requestSeq = ref(0)
const COLOR_LABEL_BY_CODE = {
  BLK: '검정',
  WHT: '흰색',
  NVY: '네이비',
  GRY: '그레이',
}

const skuRows = computed(() =>
  skuData.value
    .map((sku) => ({
      ...sku,
      actualStock: Number(sku.actualStock ?? 0),
      availableStock: Number(sku.availableStock ?? 0),
      safetyStock: Number(sku.safetyStock ?? 0),
      colorLabel: COLOR_LABEL_BY_CODE[String(sku.color ?? '').toUpperCase()] ?? sku.color,
    }))
    .sort((a, b) => String(a.color ?? '').localeCompare(String(b.color ?? ''), 'ko') || String(a.size ?? '').localeCompare(String(b.size ?? ''), 'ko')),
)

const statusClass = (status) => ({
  정상: 'bg-[#EBF5F5] text-black',
  부족: 'bg-amber-50 text-amber-700',
  품절: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

const backQuery = computed(() => ({
  search: typeof route.query.search === 'string' ? route.query.search : undefined,
  parent: typeof route.query.parent === 'string' ? route.query.parent : undefined,
  child: typeof route.query.child === 'string' ? route.query.child : undefined,
  status: typeof route.query.status === 'string' ? route.query.status : undefined,
}))

function goBackToInventory() {
  router.push({
    name: 'wh-inventory',
    query: backQuery.value,
  })
}



async function loadSkuRows() {
  const seq = ++requestSeq.value
  if (!itemCode.value) {
    skuData.value = []
    return
  }
  isLoading.value = true
  loadError.value = ''
  try {
    const rows = await getWarehouseInventorySkus(itemCode.value)
    if (seq !== requestSeq.value) return
    skuData.value = Array.isArray(rows) ? rows : []
  } catch (e) {
    if (seq !== requestSeq.value) return
    skuData.value = []
    loadError.value = extractErrorMessage(e, 'SKU 재고를 불러오지 못했습니다.')
  } finally {
    if (seq !== requestSeq.value) return
    isLoading.value = false
  }
}

onMounted(() => {
  loadSkuRows()
})

watch(
  () => route.fullPath,
  () => {
    loadSkuRows()
  },
)

</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="warehouseTopMenus"
    :side-menus="warehouseSideMenus"
    v-model:active-side-menu="activeSideMenu"
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
            <p v-if="loadError" class="mt-2 text-xs font-bold text-red-600">{{ loadError }}</p>
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
                <th class="px-3 py-3 font-black">품목명</th>
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
                <td class="px-3 py-3 font-bold text-gray-900">{{ itemName }}</td>
                <td class="px-3 py-3 font-bold text-gray-800">{{ sku.colorLabel }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ sku.size }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ sku.actualStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ sku.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold text-gray-500">{{ sku.safetyStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-12 justify-center px-2 py-1 text-[11px] font-black" :class="statusClass(sku.status)">
                    {{ sku.status }}
                  </span>
                </td>
                <td class="px-3 py-3 font-bold text-gray-500">{{ sku.updatedAt ? new Date(sku.updatedAt).toLocaleString('ko-KR', { hour12: false }) : '-' }}</td>
              </tr>
              <tr v-if="skuRows.length === 0">
                <td colspan="9" class="px-3 py-14 text-center text-sm font-bold text-gray-400">
                  {{ isLoading ? 'SKU 재고를 불러오는 중입니다.' : '조회 가능한 SKU 재고가 없습니다.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

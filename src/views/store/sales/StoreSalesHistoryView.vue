<script setup>
/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useSalesStore } from '@/stores/store/storeSales.js'
import { getSaleDetail, getSales } from '@/api/store/sales.js'
import { buildHeadline, formatDateTime } from '@/features/store/common/ui.js'

/**
 * ==============================================================================
 * 2. STATE & REFS
 * ==============================================================================
 */

const router = useRouter()
const auth = useAuthStore()
const sales = useSalesStore()

const storeMenus = roleMenus.store
const salesMenus = roleMenus.store.find((menu) => menu.label === '판매 관리')?.children ?? []
const activeMainMenu = computed(() => '판매 관리')
const activeSubMenu = ref('판매 내역')

const searchTerm = ref('')
const selectedSaleId = ref('')
const listQuery = reactive({
  storeCode: '',
  from: '',
  to: '',
  keyword: '',
})

/**
 * ==============================================================================
 * 3. COMPUTED
 * ==============================================================================
 */
const filteredSales = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  return sales.sortedSales.filter((sale) => {
    if (!keyword) return true
    return [sale.saleId, sale.headline, sale.storeCode]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })
})

const selectedSale = computed(() => {
  if (!sales.selectedSale) return null
  const id = sales.selectedSale.saleId ?? sales.selectedSale.saleNo
  return id === selectedSaleId.value ? sales.selectedSale : null
})

/**
 * ==============================================================================
 * 4. METHODS - UI STATE
 * ==============================================================================
 */
// [함수] 판매 건의 대표 문구를 생성한다.
function headlineLabel(sale) {
  if (sale?.headline) return sale.headline
  return buildHeadline(sale?.items)
}

/**
 * ==============================================================================
 * 5. METHODS - API SERVICE
 * ==============================================================================
 */
// [함수] 판매 목록 API를 호출하고 화면 상태를 갱신한다.
async function loadSales() {
  listQuery.storeCode = auth.user?.storeCode ?? ''
  listQuery.keyword = searchTerm.value.trim()
  try {
    sales.setLoading(true)
    sales.setError('')
    const params = {}
    if (listQuery.storeCode) params.storeCode = listQuery.storeCode
    if (listQuery.from) params.from = listQuery.from
    if (listQuery.to) params.to = listQuery.to
    if (listQuery.keyword) params.keyword = listQuery.keyword
    const list = await getSales(params)
    sales.setSales(
      (list ?? []).map((row) => ({
        saleNo: row.saleNo,
        saleId: row.saleNo,
        storeCode: row.storeCode,
        soldAt: row.soldAt,
        totalQuantity: row.totalQuantity,
        totalAmount: row.totalAmount,
        headline: row.headline ?? '',
        items: [],
      })),
    )
    if (filteredSales.value.length > 0) {
      selectedSaleId.value = filteredSales.value[0].saleId
    }
  } catch (e) {
    sales.setError(e?.message ?? '판매 목록 조회에 실패했습니다.')
  } finally {
    sales.setLoading(false)
  }
}

// [함수] 선택된 판매번호 기준으로 상세 API를 호출해 상세 패널 상태를 갱신한다.
async function loadSaleDetail(nextId) {
  if (!nextId) return
  try {
    sales.setLoading(true)
    sales.setError('')
    const detail = await getSaleDetail(nextId)
    sales.setSelectedSale({
      saleNo: detail.saleNo,
      saleId: detail.saleNo,
      storeCode: detail.storeCode,
      soldAt: detail.soldAt,
      totalQuantity: detail.totalQuantity,
      totalAmount: detail.totalAmount,
      status: detail.status,
      items: (detail.items ?? []).map((item) => ({
        skuCode: item.skuCode,
        skuId: item.skuCode,
        productCode: item.productCode,
        productId: item.productCode,
        productName: item.productName,
        mainCategory: item.mainCategory,
        subCategory: item.subCategory,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineAmount: item.lineAmount,
      })),
    })
  } catch (e) {
    sales.setError(e?.message ?? '판매 상세 조회에 실패했습니다.')
    sales.setSelectedSale(null)
  } finally {
    sales.setLoading(false)
  }
}

/**
 * ==============================================================================
 * 6. METHODS - NAVIGATION
 * ==============================================================================
 */
// [함수] 로그아웃 후 로그인 화면으로 이동한다.
function handleLogout() {
  auth.logout()
  router.push('/dev-login')
}

/**
 * ==============================================================================
 * 7. WATCHERS
 * ==============================================================================
 */
// [함수] 선택된 판매번호가 바뀌면 상세 API를 호출해 상세 패널 상태를 갱신한다.
watch(selectedSaleId, async (nextId) => {
  await loadSaleDetail(nextId)
})

// [함수] 검색어가 바뀌면 판매 목록 API를 다시 호출한다.
watch(searchTerm, async () => {
  await loadSales()
})

/**
 * ==============================================================================
 * 8. LIFECYCLE
 * ==============================================================================
 */
onMounted(async () => {
  await loadSales()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeMainMenu"
    :top-menus="storeMenus"
    :side-menus="salesMenus"
    v-model:active-side-menu="activeSubMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Sales</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">판매 내역</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">판매건 중심으로 조회하고 상세에서 함께 팔린 상품을 확인합니다.</p>
          </div>
          <label class="flex min-w-[280px] flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="판매번호, 상품명, 카테고리"
            />
          </label>
        </div>
      </section>

      <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <section class="min-w-0 self-start border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-extrabold text-gray-900">판매건 목록</h2>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-[680px] w-full border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-4 py-3 text-left font-black">판매시각</th>
                  <th class="px-4 py-3 text-left font-black">판매번호</th>
                  <th class="px-4 py-3 text-left font-black">대표 상품명</th>
                  <th class="px-4 py-3 text-right font-black">총수량</th>
                  <th class="px-4 py-3 text-right font-black">총금액</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="sale in filteredSales"
                  :key="sale.saleId"
                  class="cursor-pointer transition-colors hover:bg-gray-50"
                  :class="selectedSale?.saleId === sale.saleId ? 'bg-[#EBF5F5] [&_td]:font-black [&_td]:text-black': ''"
                  @click="selectedSaleId = sale.saleId"
                >
                  <td class="px-4 py-3 font-bold text-gray-600">{{ formatDateTime(sale.soldAt) }}</td>
                  <td class="px-4 py-3 font-mono font-black text-gray-800">{{ sale.saleId }}</td>
                  <td class="px-4 py-3 font-black text-gray-900">
                    <p class="truncate">{{ headlineLabel(sale) }}</p>
                  </td>
                  <td class="px-4 py-3 text-right font-black text-gray-700">{{ sale.totalQuantity }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-900">₩{{ sale.totalAmount.toLocaleString() }}</td>
                </tr>
                <tr v-if="filteredSales.length === 0">
                  <td colspan="5" class="px-4 py-12 text-center text-gray-400">조회 가능한 판매 내역이 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="min-w-0 border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-extrabold text-gray-900">판매 상세</h2>
          </div>

          <div v-if="selectedSale" class="flex flex-col gap-4 p-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">판매번호</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedSale.saleId }}</p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">판매시각</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ formatDateTime(selectedSale.soldAt) }}</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-[520px] w-full border-collapse text-xs">
                <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th class="px-3 py-3 text-left font-black">상품명</th>
                    <th class="px-3 py-3 text-left font-black">카테고리</th>
                    <th class="px-2 py-3 text-left font-black">옵션</th>
                    <th class="px-2 py-3 text-right font-black">수량</th>
                    <th class="px-2 py-3 text-right font-black">단가</th>
                    <th class="px-2 py-3 text-right font-black">금액</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in selectedSale.items" :key="`${selectedSale.saleId}-${item.skuId}`">
                    <td class="px-3 py-3 font-black text-gray-900">
                      <p class="text-[9px] font-bold text-gray-400 leading-none mb-0.5">{{ item.skuId }}</p>
                      <p class="truncate">{{ item.productName }}</p>
                    </td>
                    <td class="px-3 py-3 font-bold text-gray-600">
                      <p class="truncate">{{ item.mainCategory }} &gt; {{ item.subCategory }}</p>
                    </td>
                    <td class="px-2 py-3 font-bold text-gray-700">
                      <p class="truncate">{{ item.color }} / {{ item.size }}</p>
                    </td>
                    <td class="px-2 py-3 text-right font-black text-gray-700">{{ item.quantity }}</td>
                    <td class="px-2 py-3 text-right font-black text-gray-700">₩{{ item.unitPrice.toLocaleString() }}</td>
                    <td class="px-2 py-3 text-right font-black text-gray-900">₩{{ item.lineAmount.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-3">
              <span class="text-xs font-bold text-gray-500">총 금액</span>
              <span class="text-sm font-black text-gray-900">₩{{ selectedSale.totalAmount.toLocaleString() }}</span>
            </div>
          </div>

          <div v-else class="flex min-h-[320px] items-center justify-center px-6 text-center text-sm font-bold text-gray-400">
            판매건을 선택하면 상세 내역이 표시됩니다.
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

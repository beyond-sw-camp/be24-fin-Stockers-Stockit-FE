<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCircularInventoryStore } from '@/stores/circularInventory.js'

const router = useRouter()
const auth = useAuthStore()
const circularInventoryStore = useCircularInventoryStore()

const hqMenus = roleMenus.hq
const circularInventoryMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 판매 내역')
const searchTerm = ref('')
const selectedSaleId = ref('')

const filteredSales = computed(() => {
  const keyword = searchTerm.value.trim().toLowerCase()
  return circularInventoryStore.sortedSales.filter((sale) => {
    if (!keyword) return true
    const headline = sale.items.length > 1
      ? `${sale.items[0].itemName} 외 ${sale.items.length - 1}건`
      : sale.items[0]?.itemName ?? ''
    return [
      sale.saleId,
      sale.buyerName,
      headline,
      ...sale.items.map((item) => [item.itemCode, item.itemName, item.mainCategory, item.subCategory].join(' ')),
    ].join(' ').toLowerCase().includes(keyword)
  })
})

const selectedSale = computed(() =>
  filteredSales.value.find((sale) => sale.saleId === selectedSaleId.value)
  ?? filteredSales.value[0]
  ?? null,
)

function headlineLabel(sale) {
  if (!sale || sale.items.length === 0) return '-'
  return sale.items.length > 1 ? `${sale.items[0].itemName} 외 ${sale.items.length - 1}건` : sale.items[0].itemName
}

function formatDateTime(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatKg(value) {
  return `${Number(value || 0).toFixed(2)}kg`
}

function formatCurrency(value) {
  return `₩${Number(value || 0).toLocaleString()}`
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
    :side-menus="circularInventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory Sales</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 판매 내역</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">거래처별 순환 재고 판매 이력과 품목 상세를 확인합니다.</p>
          </div>
          <label class="flex min-w-[280px] flex-col gap-1.5">
            <span class="text-[11px] font-bold text-gray-500">검색</span>
            <input
              v-model="searchTerm"
              type="search"
              class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
              placeholder="판매번호, 거래처명, 품목명"
            />
          </label>
        </div>
      </section>

      <div class="grid items-start gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <section class="min-w-0 self-start border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-4 py-3">
            <h2 class="text-sm font-extrabold text-gray-900">판매 이력 목록</h2>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-[760px] w-full border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-4 py-3 text-left font-black">판매일시</th>
                  <th class="px-4 py-3 text-left font-black">판매번호</th>
                  <th class="px-4 py-3 text-left font-black">거래처</th>
                  <th class="px-4 py-3 text-left font-black">대표 품목</th>
                  <th class="px-4 py-3 text-right font-black">실제 판매 kg</th>
                  <th class="px-4 py-3 text-right font-black">실제 금액</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="sale in filteredSales"
                  :key="sale.saleId"
                  class="cursor-pointer transition-colors hover:bg-gray-50"
                  :class="selectedSale?.saleId === sale.saleId ? 'bg-[#EBF5F5] [&_td]:font-black [&_td]:text-black' : ''"
                  @click="selectedSaleId = sale.saleId"
                >
                  <td class="px-4 py-3 font-bold text-gray-600">{{ formatDateTime(sale.soldAt) }}</td>
                  <td class="px-4 py-3 font-mono font-black text-gray-800">{{ sale.saleId }}</td>
                  <td class="px-4 py-3 font-black text-gray-900">{{ sale.buyerName }}</td>
                  <td class="px-4 py-3 font-black text-gray-900">{{ headlineLabel(sale) }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-700">{{ formatKg(sale.totalActualWeightKg) }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-900">{{ formatCurrency(sale.totalActualAmount) }}</td>
                </tr>
                <tr v-if="filteredSales.length === 0">
                  <td colspan="6" class="px-4 py-12 text-center text-gray-400">조회 가능한 판매 이력이 없습니다.</td>
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
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">판매일시</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ formatDateTime(selectedSale.soldAt) }}</p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">거래처</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedSale.buyerName }}</p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">등록자</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ selectedSale.soldBy }}</p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">요청 / 실제 KG</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ formatKg(selectedSale.totalRequestedWeightKg) }} / <span class="text-[#0F5C4D]">{{ formatKg(selectedSale.totalActualWeightKg) }}</span></p>
              </div>
              <div class="border border-gray-200 bg-gray-50 px-3 py-3">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">예상 / 실제 금액</p>
                <p class="mt-1 text-sm font-black text-gray-900">{{ formatCurrency(selectedSale.totalRequestedAmount) }} / <span class="text-[#0F5C4D]">{{ formatCurrency(selectedSale.totalActualAmount) }}</span></p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-[980px] w-full border-collapse text-xs">
                <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th class="px-3 py-3 text-left font-black">품목명</th>
                    <th class="px-3 py-3 text-left font-black">카테고리</th>
                    <th class="px-3 py-3 text-right font-black">요청 kg</th>
                    <th class="px-3 py-3 text-right font-black">참고 벌 수량</th>
                    <th class="px-3 py-3 text-right font-black">실차감</th>
                    <th class="px-3 py-3 text-right font-black">실제 kg</th>
                    <th class="px-3 py-3 text-right font-black">예상 금액</th>
                    <th class="px-3 py-3 text-right font-black">실제 금액</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in selectedSale.items" :key="`${selectedSale.saleId}-${item.draftId || item.skuCode || item.inventoryId}`">
                    <td class="px-3 py-3 font-black text-gray-900">
                      <p>{{ item.itemName }}</p>
                      <p class="mt-1 font-mono text-[11px] text-gray-500">{{ item.itemCode }}</p>
                    </td>
                    <td class="px-3 py-3 font-bold text-gray-600">{{ item.mainCategory }} &gt; {{ item.subCategory }}</td>
                    <td class="px-3 py-3 text-right font-black text-gray-900">{{ formatKg(item.requestedWeightKg) }}</td>
                    <td class="px-3 py-3 text-right font-black text-gray-700">{{ item.estimatedQuantity.toFixed(2) }}벌</td>
                    <td class="px-3 py-3 text-right font-black text-amber-700">{{ item.deductedQuantity }}벌</td>
                    <td class="px-3 py-3 text-right font-black text-[#0F5C4D]">{{ formatKg(item.actualWeightKg) }}</td>
                    <td class="px-3 py-3 text-right font-black text-gray-900">{{ formatCurrency(item.requestedAmount) }}</td>
                    <td class="px-3 py-3 text-right font-black text-[#0F5C4D]">{{ formatCurrency(item.actualAmount) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="border border-gray-200 bg-gray-50 px-3 py-3">
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">메모</p>
              <p class="mt-2 text-xs font-bold text-gray-700">{{ selectedSale.memo || '메모 없음' }}</p>
            </div>

            <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-3">
              <span class="text-xs font-bold text-gray-500">실제 총 금액</span>
              <span class="text-sm font-black text-[#0F5C4D]">{{ formatCurrency(selectedSale.totalActualAmount) }}</span>
            </div>
          </div>

          <div v-else class="flex min-h-[320px] items-center justify-center px-6 text-center text-sm font-bold text-gray-400">
            판매 이력을 선택하면 상세 정보가 표시됩니다.
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

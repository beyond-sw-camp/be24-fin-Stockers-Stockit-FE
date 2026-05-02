<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { transferSkuCatalog, buildWarehouseRows } from '@/constants/hqWarehouseTransferData.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find(menu => menu.label === '재고 관리')?.children ?? []

const activeTopMenu = computed(() => '재고 관리')
const activeSideMenu = ref('창고간 재고 이동')

const selectedWarehouseCodes = ref([])
const transferQty = ref('')
const transferReason = ref('재고 불균형 해소')
const transferNote = ref('')
const sheetOpen = ref(false)
const toastMessage = ref('')
let toastTimer = null

const selectedSku = computed(() => transferSkuCatalog.find(sku => sku.skuCode === route.params.skuCode) ?? null)
const warehouseRows = ref([])

watch(selectedSku, (sku) => {
  warehouseRows.value = sku ? buildWarehouseRows(sku.skuCode) : []
  selectedWarehouseCodes.value = []
  transferQty.value = ''
  transferReason.value = '재고 불균형 해소'
  transferNote.value = ''
  sheetOpen.value = false
}, { immediate: true })

const selectedWarehouses = computed(() => warehouseRows.value.filter(row => selectedWarehouseCodes.value.includes(row.warehouseCode)))
const canTransfer = computed(() => selectedWarehouses.value.length === 2)

const fromWarehouse = computed(() => {
  if (!canTransfer.value) return null
  return [...selectedWarehouses.value].sort((a, b) => b.availableStock - a.availableStock)[0]
})

const toWarehouse = computed(() => {
  if (!canTransfer.value) return null
  return [...selectedWarehouses.value].sort((a, b) => a.availableStock - b.availableStock)[0]
})

const maxTransferQty = computed(() => fromWarehouse.value?.availableStock ?? 0)

const transferValidationMessage = computed(() => {
  if (!canTransfer.value) return '이동할 창고 2개를 선택해주세요.'

  const qty = Number(transferQty.value)
  if (!Number.isFinite(qty) || qty <= 0) return '이동 수량은 1 이상이어야 합니다.'
  if (qty > maxTransferQty.value) return `이동 가능 수량(${maxTransferQty.value}개) 이내로 입력해주세요.`
  if (fromWarehouse.value?.warehouseCode === toWarehouse.value?.warehouseCode) return '동일 창고 간 이동은 불가능합니다.'

  return ''
})

const canSubmitTransfer = computed(() => !transferValidationMessage.value)

const expectedStocks = computed(() => {
  if (!canSubmitTransfer.value) return null
  const qty = Number(transferQty.value)

  return {
    fromAfter: fromWarehouse.value.availableStock - qty,
    toAfter: toWarehouse.value.availableStock + qty,
  }
})

const statusClass = (status) => ({
  정상: 'bg-[#EBF5F5] text-black',
  부족: 'bg-amber-50 text-amber-700',
  품절: 'bg-red-50 text-red-700',
})[status] ?? 'bg-gray-100 text-gray-600'

const toggleWarehouseSelection = (warehouseCode) => {
  if (selectedWarehouseCodes.value.includes(warehouseCode)) {
    selectedWarehouseCodes.value = selectedWarehouseCodes.value.filter(code => code !== warehouseCode)
    return
  }

  if (selectedWarehouseCodes.value.length >= 2) return
  selectedWarehouseCodes.value = [...selectedWarehouseCodes.value, warehouseCode]
}

const openSheet = () => {
  if (!canTransfer.value) return
  sheetOpen.value = true
}

const closeSheet = () => {
  sheetOpen.value = false
}

const submitTransfer = () => {
  if (!canSubmitTransfer.value) return

  const qty = Number(transferQty.value)
  const sourceWarehouseName = fromWarehouse.value?.warehouseName ?? ''
  const targetWarehouseName = toWarehouse.value?.warehouseName ?? ''
  const fromIndex = warehouseRows.value.findIndex(row => row.warehouseCode === fromWarehouse.value.warehouseCode)
  const toIndex = warehouseRows.value.findIndex(row => row.warehouseCode === toWarehouse.value.warehouseCode)

  if (fromIndex < 0 || toIndex < 0) return

  warehouseRows.value[fromIndex].onHandStock -= qty
  warehouseRows.value[fromIndex].availableStock -= qty
  warehouseRows.value[toIndex].onHandStock += qty
  warehouseRows.value[toIndex].availableStock += qty

  selectedWarehouseCodes.value = []
  transferQty.value = ''
  transferReason.value = '재고 불균형 해소'
  transferNote.value = ''
  sheetOpen.value = false

  showToast(`재고 이동 완료: ${sourceWarehouseName} → ${targetWarehouseName}`)
}

const showToast = (message) => {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 2600)
}

const moveBack = () => {
  router.push({
    name: 'hq-inventory-warehouse-comparison',
    query: {
      search: route.query.search || undefined,
      category: route.query.category || undefined,
      status: route.query.status || undefined,
      warehouseGroup: route.query.warehouseGroup || undefined,
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
    :top-menus="hqMenus"
    :side-menus="inventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div v-if="selectedSku" class="flex flex-col gap-4 pb-20">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-start justify-between gap-2">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">창고별 SKU 분포 상세</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">창고 2개를 선택한 뒤 하단 바에서 이동 정보를 입력하세요.</p>
          </div>
          <button type="button" class="h-9 border border-gray-300 px-4 text-xs font-black text-gray-700 hover:bg-gray-100" @click="moveBack">
            목록으로
          </button>
        </div>

        <div class="flex flex-wrap gap-2 text-[11px] font-bold text-gray-600">
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.skuCode }}</span>
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.itemCode }}</span>
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.itemName }}</span>
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.category }}</span>
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.color }}/{{ selectedSku.size }}</span>
        </div>
      </section>

      <section class="border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">창고별 재고 분포</h2>
          <p class="text-[11px] font-black text-gray-500">{{ selectedWarehouseCodes.length }}/2개 선택</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[980px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="w-16 px-3 py-3 text-center font-black">선택</th>
                <th class="px-3 py-3 font-black">창고 코드</th>
                <th class="px-3 py-3 font-black">창고명</th>
                <th class="px-3 py-3 font-black">위치</th>
                <th class="px-3 py-3 text-right font-black">실재고</th>
                <th class="px-3 py-3 text-right font-black">예약</th>
                <th class="px-3 py-3 text-right font-black">가용</th>
                <th class="px-3 py-3 text-right font-black">안전재고</th>
                <th class="px-3 py-3 text-center font-black">상태</th>
                <th class="px-3 py-3 font-black">최종 업데이트</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in warehouseRows"
                :key="row.warehouseCode"
                class="cursor-pointer transition"
                :class="selectedWarehouseCodes.includes(row.warehouseCode) ? 'bg-[#EBF5F5] font-bold' : 'hover:bg-[#EBF5F5]/60'"
                @click="toggleWarehouseSelection(row.warehouseCode)"
              >
                <td class="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    class="h-3.5 w-3.5 accent-[#004D3C]"
                    :checked="selectedWarehouseCodes.includes(row.warehouseCode)"
                    @click.stop="toggleWarehouseSelection(row.warehouseCode)"
                  />
                </td>
                <td class="px-3 py-3 font-mono font-bold text-gray-500">{{ row.warehouseCode }}</td>
                <td class="px-3 py-3 font-black text-gray-900">{{ row.warehouseName }}</td>
                <td class="px-3 py-3 font-bold text-gray-600">{{ row.location }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.onHandStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold text-gray-500">{{ row.reservedStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-black text-gray-900">{{ row.availableStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-right font-bold text-gray-500">{{ row.safetyStock.toLocaleString() }}</td>
                <td class="px-3 py-3 text-center">
                  <span class="inline-flex min-w-12 justify-center px-2 py-1 text-[11px] font-black" :class="statusClass(row.status)">{{ row.status }}</span>
                </td>
                <td class="px-3 py-3 font-bold text-gray-500">{{ row.updatedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div class="flex items-center gap-3 px-4 py-3">
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-black text-gray-500">선택 창고</p>
            <p v-if="selectedWarehouseCodes.length === 0" class="text-xs font-bold text-gray-400">
              창고를 2개 선택해주세요.
            </p>
            <p v-else-if="selectedWarehouseCodes.length === 1" class="text-xs font-bold text-gray-400">
              {{ selectedWarehouses[0].warehouseName }} 선택됨 · 1개 더 선택해주세요.
            </p>
            <p v-else class="truncate text-xs font-bold text-gray-800">
              {{ fromWarehouse.warehouseName }}
              <span class="mx-1 text-gray-400">→</span>
              {{ toWarehouse.warehouseName }}
              <span class="ml-2 text-gray-400">(2/2)</span>
            </p>
          </div>
          <button
            type="button"
            class="ml-auto flex h-10 shrink-0 items-center gap-1.5 px-4 text-xs font-black transition"
            :class="canTransfer ? 'bg-[#004D3C] text-white hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-100 text-gray-400'"
            :disabled="!canTransfer"
            @click="openSheet"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="18 15 12 9 6 15" />
            </svg>
            이동 정보 입력
          </button>
        </div>
      </div>

      <div v-if="sheetOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/35" @click="closeSheet" />
        <section class="absolute bottom-0 left-0 right-0 max-h-[84vh] overflow-y-auto border-t border-gray-200 bg-white shadow-2xl">
          <div class="w-full px-6 py-5 lg:px-8">
            <div class="mb-5 flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 class="text-base font-black text-gray-900">재고 이동 정보 입력</h2>
                <p class="mt-1 text-[11px] font-bold text-gray-500">출발/도착 창고를 확인하고 이동 수량과 사유를 입력하세요.</p>
              </div>
              <button type="button" class="h-8 shrink-0 border border-gray-300 px-3 text-xs font-black text-gray-700 hover:bg-gray-100" @click="closeSheet">닫기</button>
            </div>

            <div class="grid w-full gap-6 lg:grid-cols-2 lg:items-start">
              <div class="space-y-4 border border-gray-200 bg-gray-50 p-4">
                <div class="grid gap-3 text-xs sm:grid-cols-2">
                  <div class="border border-gray-200 bg-white p-3">
                    <p class="text-[11px] font-black text-gray-500">출발 창고</p>
                    <p class="mt-1 text-sm font-black text-gray-900">{{ fromWarehouse?.warehouseName || '-' }}</p>
                    <p class="mt-2 text-base font-black text-gray-800">가용 {{ fromWarehouse?.availableStock?.toLocaleString?.() ?? 0 }}개</p>
                  </div>
                  <div class="border border-gray-200 bg-white p-3">
                    <p class="text-[11px] font-black text-gray-500">도착 창고</p>
                    <p class="mt-1 text-sm font-black text-gray-900">{{ toWarehouse?.warehouseName || '-' }}</p>
                    <p class="mt-2 text-base font-black text-gray-800">가용 {{ toWarehouse?.availableStock?.toLocaleString?.() ?? 0 }}개</p>
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] font-black text-gray-500">이동 수량</span>
                    <div class="flex h-11 items-center border border-gray-300 bg-white focus-within:border-[#004D3C]">
                      <input
                        v-model="transferQty"
                        type="number"
                        min="1"
                        :max="maxTransferQty"
                        class="h-full w-full px-3 text-sm font-black text-gray-900 outline-none"
                        placeholder="수량 입력"
                      />
                      <span class="pr-3 text-[11px] font-black text-gray-500">개</span>
                    </div>
                    <span class="text-[11px] font-bold text-gray-500">최대 {{ maxTransferQty.toLocaleString() }}개 이동 가능</span>
                  </label>

                  <label class="flex flex-col gap-1">
                    <span class="text-[11px] font-black text-gray-500">이동 사유</span>
                    <select v-model="transferReason" class="h-11 border border-gray-300 bg-white px-3 text-sm font-black text-gray-900 outline-none focus:border-[#004D3C]">
                      <option value="재고 불균형 해소">재고 불균형 해소</option>
                      <option value="프로모션 대응">프로모션 대응</option>
                      <option value="품절 예방">품절 예방</option>
                      <option value="기타">기타</option>
                    </select>
                  </label>
                </div>

                <label class="flex flex-col gap-1">
                  <span class="text-[11px] font-black text-gray-500">메모</span>
                  <textarea
                    v-model="transferNote"
                    rows="3"
                    class="border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-[#004D3C]"
                    placeholder="이동 목적 또는 특이사항"
                  />
                </label>
              </div>

              <div class="space-y-3 self-start">
                <div class="border border-[#D6EAEA] bg-[#EBF5F5] p-4">
                  <p class="text-[11px] font-black text-gray-600">이동 후 가용재고 예상</p>
                  <template v-if="expectedStocks">
                    <p class="mt-2 text-[11px] font-bold text-gray-700">{{ fromWarehouse?.warehouseName }}: {{ expectedStocks.fromAfter.toLocaleString() }}개</p>
                    <p class="mt-1 text-[11px] font-bold text-gray-700">{{ toWarehouse?.warehouseName }}: {{ expectedStocks.toAfter.toLocaleString() }}개</p>
                  </template>
                  <p v-else class="mt-2 text-[11px] font-bold text-gray-500">수량 입력 후 예상 재고를 확인할 수 있습니다.</p>
                </div>

                <div class="border border-gray-200 bg-gray-50 p-4">
                  <p class="mb-2 text-[11px] font-black text-gray-500">이동 요약</p>
                  <p class="text-[11px] font-bold text-gray-700">SKU: {{ selectedSku.skuCode }}</p>
                  <p class="mt-1 text-[11px] font-bold text-gray-700">선택 창고: {{ selectedWarehouseCodes.length }}/2</p>
                  <p class="mt-1 text-[11px] font-bold text-gray-700">최대 이동 가능: {{ maxTransferQty.toLocaleString() }}개</p>
                </div>

                <p v-if="transferValidationMessage" class="text-[11px] font-bold text-red-600">{{ transferValidationMessage }}</p>

                <div class="mx-auto flex w-full max-w-[360px] gap-2 lg:max-w-none">
                  <button type="button" class="h-10 flex-1 border border-gray-300 px-4 text-xs font-black text-gray-700 hover:bg-gray-100" @click="closeSheet">
                    취소
                  </button>
                  <button
                    type="button"
                    class="h-10 flex-1 px-4 text-xs font-black transition"
                    :class="canSubmitTransfer ? 'bg-[#004D3C] text-white hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-100 text-gray-400'"
                    :disabled="!canSubmitTransfer"
                    @click="submitTransfer"
                  >
                    재고 이동 실행
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <section v-else class="border border-gray-200 bg-white p-10 text-center shadow-sm">
      <p class="text-sm font-black text-gray-700">존재하지 않는 SKU입니다.</p>
      <button type="button" class="mt-4 h-9 border border-gray-300 px-4 text-xs font-black text-gray-700 hover:bg-gray-100" @click="moveBack">
        목록으로
      </button>
    </section>

    <div
      v-if="toastMessage"
      class="fixed bottom-20 right-5 z-50 border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 shadow-sm"
    >
      {{ toastMessage }}
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import WarehouseTransferCartDrawer from '@/components/hq/WarehouseTransferCartDrawer.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useWarehouseTransferCartStore } from '@/stores/hq/warehouseTransferCart.js'
import { executeWarehouseTransfers, getWarehouseSkuDistribution } from '@/api/hq/inventory.js'
import { extractErrorMessage } from '@/api/axios.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const cartStore = useWarehouseTransferCartStore()
const hqMenus = roleMenus.hq
const inventoryMenus = roleMenus.hq.find(menu => menu.label === '물류 창고간 재고이동')?.children ?? []

const activeTopMenu = computed(() => '물류 창고간 재고이동')
const activeSideMenu = ref('재고 이동')

const selectedWarehouseCodes = ref([])
const transferQty = ref('')
const transferReason = ref('재고 불균형 해소')
const transferNote = ref('')
const sortKey = ref('availableStock')
const sortDirection = ref('desc')
const sheetOpen = ref(false)
const cartDrawerOpen = ref(false)
const toastMessage = ref('')
const toastShowHistoryAction = ref(false)
const failedTransfers = ref([])
const failedModalOpen = ref(false)
const warehouseLoading = ref(false)
let toastTimer = null

const selectedSku = computed(() => {
  const skuCode = String(route.params.skuCode || '')
  if (!skuCode) return null

  return {
    skuCode,
    itemCode: String(route.query.itemCode || ''),
    itemName: String(route.query.itemName || ''),
    category: String(route.query.category || route.query.filterCategory || ''),
    color: String(route.query.color || ''),
    size: String(route.query.size || ''),
  }
})
const warehouseRows = ref([])

watch(selectedSku, (sku) => {
  loadWarehouseRows(sku?.skuCode)
  selectedWarehouseCodes.value = []
  transferQty.value = ''
  transferReason.value = '재고 불균형 해소'
  transferNote.value = ''
  sortKey.value = 'availableStock'
  sortDirection.value = 'desc'
  sheetOpen.value = false
}, { immediate: true })

async function loadWarehouseRows(skuCode) {
  if (!skuCode) {
    warehouseRows.value = []
    return
  }
  warehouseLoading.value = true
  try {
    const rows = await getWarehouseSkuDistribution(skuCode)
    warehouseRows.value = (rows || []).map((row) => ({
      warehouseCode: row.warehouseCode,
      warehouseName: row.warehouseName,
      location: row.location,
      onHandStock: Number(row.onHandStock || 0),
      reservedStock: Number(row.reservedStock || 0),
      availableStock: Number(row.availableStock || 0),
      safetyStock: Number(row.safetyStock || 0),
      status: row.status || '정상',
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString().slice(0, 16).replace('T', ' ') : '-',
    }))
  } catch (error) {
    warehouseRows.value = []
    showToast(extractErrorMessage(error, '창고별 SKU 재고를 불러오지 못했습니다.'))
  } finally {
    warehouseLoading.value = false
  }
}

const statusWeight = {
  품절: 3,
  부족: 2,
  정상: 1,
}

const sortedWarehouseRows = computed(() => {
  const direction = sortDirection.value === 'desc' ? -1 : 1

  return [...warehouseRows.value].sort((a, b) => {
    let left = a[sortKey.value]
    let right = b[sortKey.value]

    if (sortKey.value === 'status') {
      left = statusWeight[a.status] ?? 0
      right = statusWeight[b.status] ?? 0
    }

    if (left !== right) {
      return left > right ? direction * -1 : direction
    }

    return a.warehouseCode.localeCompare(b.warehouseCode)
  })
})

const selectedWarehouses = computed(() => warehouseRows.value.filter(row => selectedWarehouseCodes.value.includes(row.warehouseCode)))
const canTransfer = computed(() => selectedWarehouses.value.length === 2)
const cartGroups = computed(() => cartStore.groupedByRoute)
const cartLineCount = computed(() => cartStore.lineCount)

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

const canAddToCart = computed(() => !transferValidationMessage.value)

const expectedStocks = computed(() => {
  if (!canAddToCart.value) return null
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

const toggleSort = (key) => {
  if (sortKey.value !== key) {
    sortKey.value = key
    sortDirection.value = 'desc'
    return
  }

  sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
}

const sortIndicator = (key) => {
  if (sortKey.value !== key) return '△'
  return sortDirection.value === 'desc' ? '▼' : '▲'
}

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

const openCartDrawer = () => {
  cartDrawerOpen.value = true
}

const closeCartDrawer = () => {
  cartDrawerOpen.value = false
}

const closeFailedModal = () => {
  failedModalOpen.value = false
}

const resetTransferForm = () => {
  selectedWarehouseCodes.value = []
  transferQty.value = ''
  transferReason.value = '재고 불균형 해소'
  transferNote.value = ''
}

const addToCart = () => {
  if (!canAddToCart.value || !selectedSku.value || !fromWarehouse.value || !toWarehouse.value) return

  cartStore.addLine({
    skuCode: selectedSku.value.skuCode,
    itemName: selectedSku.value.itemName,
    fromWarehouseCode: fromWarehouse.value.warehouseCode,
    fromWarehouseName: fromWarehouse.value.warehouseName,
    toWarehouseCode: toWarehouse.value.warehouseCode,
    toWarehouseName: toWarehouse.value.warehouseName,
    qty: Number(transferQty.value),
    reason: transferReason.value,
    memo: transferNote.value,
  })

  resetTransferForm()
  sheetOpen.value = false
  showToast('장바구니에 이동 항목을 추가했습니다.')
}

const executeCartTransfers = async () => {
  if (!cartLineCount.value) return
  try {
    const payload = {
      requestedBy: auth.user?.name || '본사 관리자',
      lines: cartStore.lines.map((line) => ({
        lineId: line.lineId,
        skuCode: line.skuCode,
        fromWarehouseCode: line.fromWarehouseCode,
        toWarehouseCode: line.toWarehouseCode,
        qty: Number(line.qty),
        reason: line.reason,
        memo: line.memo,
      })),
    }
    const result = await executeWarehouseTransfers(payload)
    const lineResults = Array.isArray(result?.lineResults) ? result.lineResults : []
    const failed = Array.isArray(result?.failedTransfers) ? result.failedTransfers : []
    const successLineIds = lineResults.filter((row) => row.success).map((row) => row.lineId).filter(Boolean)
    if (successLineIds.length) {
      successLineIds.forEach((lineId) => cartStore.removeLine(lineId))
    }
    failedTransfers.value = failed

    const successCount = Number(result?.successCount || successLineIds.length || 0)
    const failureCount = Number(result?.failureCount || Math.max(0, cartLineCount.value - successCount))
    if (failureCount === 0) {
      showToast(`장바구니 실행 완료: ${successCount}건 처리됨`, true)
    } else {
      showToast(`부분 완료: 성공 ${successCount}건 / 실패 ${failureCount}건`)
      failedModalOpen.value = failed.length > 0
    }
  } catch (error) {
    failedTransfers.value = []
    showToast(extractErrorMessage(error, '재고 이동 실행에 실패했습니다.'))
  }
}

const updateCartLineQty = (lineId, event) => {
  const nextQty = Number(event.target.value)
  if (!Number.isFinite(nextQty) || nextQty < 1) {
    event.target.value = '1'
    cartStore.updateLineQty(lineId, 1)
    return
  }
  cartStore.updateLineQty(lineId, Math.trunc(nextQty))
}

const showToast = (message, showHistoryAction = false) => {
  toastMessage.value = message
  toastShowHistoryAction.value = showHistoryAction
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
    toastShowHistoryAction.value = false
  }, 3000)
}

const moveHistory = () => {
  router.push({ name: 'hq-inventory-warehouse-transfer-history' })
}

const moveBack = () => {
  router.push({
    name: 'hq-inventory-warehouse-comparison',
    query: {
      search: route.query.search || undefined,
      category: route.query.filterCategory || route.query.category || undefined,
      status: route.query.status || undefined,
      warehouseGroup: route.query.warehouseGroup || undefined,
    },
  })
}


</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="inventoryMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div v-if="selectedSku" class="flex flex-col gap-4 pb-20">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-start justify-between gap-2">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Inventory</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">창고별 SKU 분포 상세</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">창고 2개를 선택한 뒤 장바구니에 이동 항목을 담아 한 번에 실행하세요.</p>
          </div>
          <button type="button" class="h-9 border border-gray-300 px-4 text-xs font-black text-gray-700 hover:bg-gray-100" @click="moveBack">
            목록으로
          </button>
        </div>

        <div class="flex flex-wrap gap-2 text-[11px] font-bold text-gray-600">
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.skuCode }}</span>
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.itemCode || '-' }}</span>
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.itemName || '-' }}</span>
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.category || '-' }}</span>
          <span class="bg-gray-100 px-2 py-1">{{ selectedSku.color || '-' }}/{{ selectedSku.size || '-' }}</span>
        </div>
      </section>

      <section class="border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 class="text-sm font-black text-gray-900">창고별 재고 분포</h2>
          <p class="text-[11px] font-black text-gray-500">{{ selectedWarehouseCodes.length }}/2개 선택</p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-[1120px] w-full border-collapse text-left text-xs">
            <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
              <tr>
                <th class="w-16 px-3 py-3 text-center font-black">선택</th>
                <th class="px-3 py-3 font-black">창고 코드</th>
                <th class="px-3 py-3 font-black">품목명</th>
                <th class="px-3 py-3 font-black">창고명</th>
                <th class="px-3 py-3 font-black">위치</th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-700" @click="toggleSort('onHandStock')">
                    실재고
                    <span class="text-[10px]">{{ sortIndicator('onHandStock') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-700" @click="toggleSort('reservedStock')">
                    예약
                    <span class="text-[10px]">{{ sortIndicator('reservedStock') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 text-right font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-700" @click="toggleSort('availableStock')">
                    가용
                    <span class="text-[10px]">{{ sortIndicator('availableStock') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 text-right font-black">안전재고</th>
                <th class="px-3 py-3 text-center font-black">
                  <button type="button" class="inline-flex items-center gap-1 hover:text-gray-700" @click="toggleSort('status')">
                    상태
                    <span class="text-[10px]">{{ sortIndicator('status') }}</span>
                  </button>
                </th>
                <th class="px-3 py-3 font-black">최종 업데이트</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="row in sortedWarehouseRows"
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
                <td class="px-3 py-3 font-bold text-gray-700 whitespace-nowrap max-w-[220px] truncate">{{ selectedSku?.itemName || '-' }}</td>
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
              <tr v-if="warehouseLoading">
                <td colspan="11" class="px-4 py-8 text-center text-xs font-bold text-gray-400">
                  창고별 재고를 불러오는 중입니다.
                </td>
              </tr>
              <tr v-else-if="sortedWarehouseRows.length === 0">
                <td colspan="11" class="px-4 py-8 text-center text-xs font-bold text-gray-400">
                  표시할 창고 재고 데이터가 없습니다.
                </td>
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
            class="flex h-10 shrink-0 items-center gap-1.5 border border-gray-300 px-4 text-xs font-black text-gray-700 transition hover:bg-gray-100"
            @click="openCartDrawer"
          >
            장바구니 열기 ({{ cartLineCount }})
          </button>
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
                <h2 class="text-base font-black text-gray-900">장바구니 항목 입력</h2>
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
                    :class="canAddToCart ? 'bg-[#004D3C] text-white hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-100 text-gray-400'"
                    :disabled="!canAddToCart"
                    @click="addToCart"
                  >
                    장바구니 담기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <WarehouseTransferCartDrawer
        :open="cartDrawerOpen"
        :cart-groups="cartGroups"
        :cart-line-count="cartLineCount"
        @close="closeCartDrawer"
        @clear-all="cartStore.clearAll()"
        @execute="executeCartTransfers"
        @remove-line="cartStore.removeLine($event)"
        @update-line-qty="updateCartLineQty"
      />
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
      <p>{{ toastMessage }}</p>
      <button
        v-if="toastShowHistoryAction"
        type="button"
        class="mt-1 text-[11px] font-black text-emerald-800 underline"
        @click="moveHistory"
      >
        이동내역 보기
      </button>
    </div>

    <div v-if="failedModalOpen" class="fixed inset-0 z-[60]">
      <div class="absolute inset-0 bg-black/40" @click="closeFailedModal" />
      <section class="absolute left-1/2 top-1/2 w-[92%] max-w-[820px] -translate-x-1/2 -translate-y-1/2 border border-gray-200 bg-white shadow-2xl">
        <header class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 class="text-sm font-black text-gray-900">재고 이동 실패 상세</h3>
            <p class="mt-1 text-[11px] font-bold text-gray-500">라우트/라인별 실패 사유를 확인하고 재시도하세요.</p>
          </div>
          <button type="button" class="h-8 border border-gray-300 px-3 text-xs font-black text-gray-700 hover:bg-gray-100" @click="closeFailedModal">닫기</button>
        </header>
        <div class="max-h-[60vh] overflow-y-auto p-5">
          <article v-for="(routeFailure, idx) in failedTransfers" :key="`${routeFailure.fromWarehouseCode}-${routeFailure.toWarehouseCode}-${idx}`" class="mb-4 border border-red-100 bg-red-50/40">
            <div class="border-b border-red-100 px-4 py-3">
              <p class="text-xs font-black text-red-800">
                {{ routeFailure.fromWarehouseCode || '-' }} → {{ routeFailure.toWarehouseCode || '-' }}
              </p>
              <p class="mt-1 text-[11px] font-bold text-red-700">
                {{ routeFailure.errorCode || '-' }} · {{ routeFailure.errorMessage || '실패 사유 없음' }}
              </p>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-[620px] w-full border-collapse text-xs">
                <thead class="bg-red-100/70 text-[10px] uppercase tracking-[0.08em] text-red-700">
                  <tr>
                    <th class="px-3 py-2 text-left font-black">lineId</th>
                    <th class="px-3 py-2 text-left font-black">SKU</th>
                    <th class="px-3 py-2 text-right font-black">수량</th>
                    <th class="px-3 py-2 text-left font-black">실패 사유</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-red-100">
                  <tr v-for="line in routeFailure.failedLines || []" :key="`${line.lineId}-${line.skuCode}`">
                    <td class="px-3 py-2 font-mono font-bold text-red-900">{{ line.lineId || '-' }}</td>
                    <td class="px-3 py-2 font-bold text-gray-800">{{ line.skuCode || '-' }}</td>
                    <td class="px-3 py-2 text-right font-black text-gray-900">{{ Number(line.qty || 0).toLocaleString() }}</td>
                    <td class="px-3 py-2 font-bold text-red-700">{{ line.reason || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

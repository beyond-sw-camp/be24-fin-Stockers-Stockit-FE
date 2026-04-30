<script setup>
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import CircularInventoryBrowseSection from '@/components/hq/circular-inventory/CircularInventoryBrowseSection.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCircularInventoryBuyerStore } from '@/stores/circularInventoryBuyers.js'
import { useCircularInventoryStore } from '@/stores/circularInventory.js'

const router = useRouter()
const auth = useAuthStore()
const buyerStore = useCircularInventoryBuyerStore()
const circularInventoryStore = useCircularInventoryStore()

const hqMenus = roleMenus.hq
const circularInventoryMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 판매 등록')

const buyerSearchTerm = ref('')
const isBuyerDropdownOpen = ref(false)
const buyerDropdownRef = ref(null)
const isDrawerOpen = ref(false)
const showFinalReviewModal = ref(false)
const priceEditModes = ref({})
const toastMessage = ref('')
const toastTone = ref('success')
let toastTimer = null

const saleStep = computed({
  get: () => Number(unref(circularInventoryStore.saleStep) || 1),
  set: (value) => circularInventoryStore.setSaleStep(value),
})
const filteredBuyers = computed(() => circularInventoryStore.filteredBuyers(buyerSearchTerm.value))
const selectedBuyer = computed(() => circularInventoryStore.selectedBuyer)
const drawerSummary = computed(() => circularInventoryStore.draftSummary)
const draftItems = computed(() => circularInventoryStore.draftItems)
const draftRowIds = computed(() => draftItems.value.map(item => item.draftId))
const submitValidation = computed(() => circularInventoryStore.validateCircularInventorySaleDraft())
const lockedMaterialType = computed(() => {
  const raw = unref(circularInventoryStore.lockedMaterialType)
  return typeof raw === 'string' ? raw : ''
})

const canMoveStep2 = computed(() => draftItems.value.length > 0 && Boolean(lockedMaterialType.value))
const canMoveStep3 = computed(() => canMoveStep2.value && Boolean(selectedBuyer.value))
const canSubmit = computed(() => submitValidation.value.success)
const shouldRenderDrawer = computed(() => true)
const browseSummaryText = computed(() => `담긴 SKU ${draftItems.value.length.toLocaleString()}건`)
const includedMaterialNames = computed(() =>
  [...new Set(draftItems.value.flatMap(item => item.materials.map(material => material.name)))],
)
const finalReviewSummary = computed(() => ({
  totalEstimatedQuantity: draftItems.value.reduce((sum, item) => sum + (Number(item.estimatedQuantity) || 0), 0),
  totalDeductedQuantity: draftItems.value.reduce((sum, item) => sum + (Number(item.deductedQuantity) || 0), 0),
  totalRequestedAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.requestedAmount) || 0), 0),
  totalActualAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0),
  totalRequestedWeightKg: draftItems.value.reduce((sum, item) => sum + (Number(item.requestedWeightKg) || 0), 0),
  totalActualWeightKg: draftItems.value.reduce((sum, item) => sum + (Number(item.actualWeightKg) || 0), 0),
}))
const submitDisabledReason = computed(() => (canSubmit.value ? '' : submitValidation.value.message))

function formatMaterials(materials) {
  return materials.map(material => `${material.name} ${material.ratio}%`).join(', ')
}

function formatKg(value) {
  return `${Number(value || 0).toFixed(2)}kg`
}

function formatCurrency(value) {
  return `₩${Number(value || 0).toLocaleString()}`
}

function formatQuantity(value) {
  return Number(value || 0).toLocaleString()
}

function hasWeightAdjustment(item) {
  return Math.abs(Number(item.actualWeightKg || 0) - Number(item.requestedWeightKg || 0)) >= 0.01
}

function isItemAdded(draftId) {
  return Boolean(circularInventoryStore.getDraftItem(draftId))
}

function isRowSelectionDisabled(row) {
  if (isItemAdded(row.id)) return false
  if (!lockedMaterialType.value) return false
  return lockedMaterialType.value !== row.materialType
}

function openDrawer() {
  isDrawerOpen.value = true
}

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value
}

function moveStep(step) {
  if (step === 2 && !canMoveStep2.value) {
    showToast('먼저 판매할 SKU를 선택해주세요.', 'error')
    return
  }
  if (step === 3 && !canMoveStep3.value) {
    showToast('거래처를 먼저 선택해주세요.', 'error')
    return
  }
  saleStep.value = step
}

function addItemToDraft(row) {
  const result = circularInventoryStore.addSaleDraftItem(row)
  if (!result.success) {
    showToast(result.message, 'error')
    return
  }

  isDrawerOpen.value = true
  showToast(
    result.alreadyExists ? '이미 판매 패널에 담긴 SKU입니다.' : '판매 패널에 SKU를 추가했습니다.',
    'success',
  )
}

function updateDraftItemField(draftId, field, value) {
  const normalizedField = field === 'soldWeightKg' ? 'requestedWeightKg' : field
  circularInventoryStore.updateSaleDraftItem(draftId, { [normalizedField]: value, resolvedUnitPrice: Number(field === 'unitPrice' ? value : undefined) || undefined })
}

function removeDraftItem(draftId) {
  circularInventoryStore.removeSaleDraftItem(draftId)
  delete priceEditModes.value[draftId]
  if (draftItems.value.length === 0) {
    isDrawerOpen.value = false
  }
}

function selectBuyer(buyer) {
  circularInventoryStore.selectBuyer(buyer.id)
  buyerSearchTerm.value = buyer.companyName
  isBuyerDropdownOpen.value = false
}

function clearDraftPanel() {
  circularInventoryStore.clearDraft()
  priceEditModes.value = {}
  buyerSearchTerm.value = ''
  saleStep.value = 1
}

function isPriceEditMode(draftId) {
  return Boolean(priceEditModes.value[draftId])
}

function openPriceEditMode(draftId) {
  priceEditModes.value = {
    ...priceEditModes.value,
    [draftId]: true,
  }
}

function closePriceEditMode(draftId) {
  priceEditModes.value = {
    ...priceEditModes.value,
    [draftId]: false,
  }
}

function openFinalReviewModal() {
  if (!submitValidation.value.success) {
    showToast(submitValidation.value.message, 'error')
    return
  }
  showFinalReviewModal.value = true
}

function returnToDrawerEdit() {
  showFinalReviewModal.value = false
  isDrawerOpen.value = true
}

function submitSale() {
  const result = circularInventoryStore.submitCircularInventorySale(auth.user?.name ?? '본사 관리자')
  toastMessage.value = result.success
    ? `${result.sale.saleId} 판매 등록을 완료했습니다.`
    : result.message
  toastTone.value = result.success ? 'success' : 'error'

  if (result.success) {
    buyerSearchTerm.value = ''
    isDrawerOpen.value = false
    showFinalReviewModal.value = false
  }
}

function showToast(message, tone = 'success') {
  toastMessage.value = message
  toastTone.value = tone
}

function handleDocumentClick(event) {
  if (!buyerDropdownRef.value?.contains(event.target)) {
    isBuyerDropdownOpen.value = false
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function materialFitLabel(value) {
  return buyerStore.materialFitLabel(value)
}

watch(toastMessage, (message) => {
  if (!message) return
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
})

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
  if (draftItems.value.length > 0) {
    isDrawerOpen.value = true
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularInventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4 pb-36">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory Sales</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 판매 등록</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              SKU를 먼저 선택하고, 거래처를 매칭한 뒤 판매 kg/단가를 확정해 요청서를 등록합니다.
            </p>
          </div>

          <button
            type="button"
            class="h-9 border border-[#D6EAEA] bg-[#EBF5F5] px-4 text-xs font-black text-[#004D3C] transition hover:bg-[#dff0f0]"
            @click="openDrawer"
          >
            판매 패널 열기
          </button>
        </div>
      </section>

      <CircularInventoryBrowseSection
        title="판매 대상 순환 재고 리스트"
        description="순환 재고 조회 화면과 동일한 기준으로 SKU를 탐색하고, Step 1에 담을 항목을 선택합니다."
        :summary-text="browseSummaryText"
        :show-circular-sale-price-column="true"
        :inventory-rows="circularInventoryStore.inventoryRows"
        action-column-label="추가"
        action-column-position="end"
        :selected-row-ids="draftRowIds"
        :highlighted-row-ids="draftRowIds"
      >
        <template #row-action="{ row }">
          <div class="flex flex-col items-center gap-1">
          <button
            type="button"
            class="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[11px] font-black tracking-[0.01em] transition-all duration-150 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-100"
            :class="isItemAdded(row.id)
              ? 'border-[#B7D8D1] bg-[#F3FAF8] text-[#0F5C4D]'
              : 'border-[#C9D9EE] bg-[#EEF4FB] text-[#24476B]'"
            :disabled="isRowSelectionDisabled(row)"
            :title="isRowSelectionDisabled(row)
              ? `현재 요청서는 ${lockedMaterialType}만 선택 가능합니다.`
              : ''"
            @click.stop="addItemToDraft(row)"
          >
            <span class="flex h-4 w-4 items-center justify-center rounded-full text-[10px]" :class="isItemAdded(row.id) ? 'bg-[#DCEFEA] text-[#0F5C4D]' : 'bg-white text-[#24476B]'">
              {{ isItemAdded(row.id) ? '✓' : '+' }}
            </span>
            <span>{{ isItemAdded(row.id) ? '수정' : '선택' }}</span>
          </button>
            <span
              v-if="isRowSelectionDisabled(row)"
              class="text-[10px] font-black text-gray-400"
            >
              선택 불가
            </span>
          </div>
        </template>
      </CircularInventoryBrowseSection>

      <div
        v-if="shouldRenderDrawer"
        class="fixed bottom-0 right-0 z-20 w-full border-t border-gray-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur"
      >
        <div class="flex w-full flex-col gap-4 px-4 py-3">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-left"
            @click="toggleDrawer"
          >
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-sm font-black text-gray-900">판매 등록 패널</span>
              <span class="text-[11px] font-bold text-gray-500">
                소재 구분 {{ lockedMaterialType || '-' }} · 담긴 SKU {{ drawerSummary.totalItems }}건
              </span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-black text-gray-900">{{ formatCurrency(drawerSummary.totalActualAmount) }}</span>
              <span class="text-xs font-black text-gray-500">{{ isDrawerOpen ? '닫기 ▲' : '열기 ▼' }}</span>
            </div>
          </button>

          <div v-if="isDrawerOpen" class="rounded-md border border-gray-200 bg-white p-4">
            <div class="rounded-md border border-gray-200 bg-[#FAFCFB] p-3">
              <div class="grid gap-2 md:grid-cols-3">
                <button type="button" class="group overflow-hidden rounded-md border text-left transition" :class="saleStep >= 1 ? 'border-[#B7D8D1] bg-[#F3FAF8]' : 'border-gray-200 bg-white'" @click="moveStep(1)">
                  <div class="h-1.5 bg-[#E6ECE9]">
                    <div class="h-full bg-gradient-to-r from-[#2F9E87] to-[#0F5C4D] transition-all duration-500 ease-out" :style="{ width: saleStep >= 1 ? '100%' : '0%' }" />
                  </div>
                  <div class="flex items-center gap-2 px-3 py-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black transition" :class="saleStep >= 1 ? 'bg-[#0F5C4D] text-white' : 'bg-gray-200 text-gray-500'">1</span>
                  <span class="text-xs font-black" :class="saleStep === 1 ? 'text-[#0F5C4D]' : 'text-gray-600'">SKU 선택</span>
                  </div>
                </button>
                <button type="button" class="group overflow-hidden rounded-md border text-left transition" :class="saleStep >= 2 ? 'border-[#B7D8D1] bg-[#F3FAF8]' : 'border-gray-200 bg-white'" @click="moveStep(2)">
                  <div class="h-1.5 bg-[#E6ECE9]">
                    <div class="h-full bg-gradient-to-r from-[#2F9E87] to-[#0F5C4D] transition-all duration-500 ease-out" :style="{ width: saleStep >= 2 ? '100%' : '0%' }" />
                  </div>
                  <div class="flex items-center gap-2 px-3 py-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black transition" :class="saleStep >= 2 ? 'bg-[#0F5C4D] text-white' : 'bg-gray-200 text-gray-500'">2</span>
                  <span class="text-xs font-black" :class="saleStep === 2 ? 'text-[#0F5C4D]' : 'text-gray-600'">거래처 매칭</span>
                  </div>
                </button>
                <button type="button" class="group overflow-hidden rounded-md border text-left transition" :class="saleStep >= 3 ? 'border-[#B7D8D1] bg-[#F3FAF8]' : 'border-gray-200 bg-white'" @click="moveStep(3)">
                  <div class="h-1.5 bg-[#E6ECE9]">
                    <div class="h-full bg-gradient-to-r from-[#2F9E87] to-[#0F5C4D] transition-all duration-500 ease-out" :style="{ width: saleStep >= 3 ? '100%' : '0%' }" />
                  </div>
                  <div class="flex items-center gap-2 px-3 py-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black transition" :class="saleStep >= 3 ? 'bg-[#0F5C4D] text-white' : 'bg-gray-200 text-gray-500'">3</span>
                  <span class="text-xs font-black" :class="saleStep === 3 ? 'text-[#0F5C4D]' : 'text-gray-600'">판매 조건 확정</span>
                  </div>
                </button>
              </div>
            </div>

            <p class="mt-3 text-[11px] font-bold text-gray-500">
              <template v-if="saleStep === 1">요청서에서 같은 소재 구분 SKU만 선택할 수 있습니다.</template>
              <template v-else-if="saleStep === 2">현재 단계는 수동 선택만 지원합니다. (AI 매칭은 이후 확장)</template>
              <template v-else>판매 kg 기준 입력이며, 차감 벌 수량은 항상 올림 처리됩니다.</template>
            </p>

            <div v-if="saleStep === 1" class="mt-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-black text-gray-900">선택 SKU</p>
                  <p class="mt-1 text-[11px] font-bold text-gray-400">소재 구분 고정: {{ lockedMaterialType || '-' }}</p>
                </div>
                <button type="button" class="text-[11px] font-black text-gray-500 hover:text-gray-900" @click="clearDraftPanel">전체 비우기</button>
              </div>
              <div class="max-h-56 overflow-y-auto border border-gray-200">
                <table class="w-full border-collapse text-left text-xs">
                  <thead class="sticky top-0 bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                    <tr>
                      <th class="px-3 py-3 font-black">SKU</th>
                      <th class="px-3 py-3 font-black">품목</th>
                      <th class="px-3 py-3 font-black">소재 구분</th>
                      <th class="px-3 py-3 font-black">소재 상세</th>
                      <th class="px-3 py-3 text-right font-black">재고 수량</th>
                      <th class="px-3 py-3 text-right font-black">kg당 단가</th>
                      <th class="px-3 py-3 text-right font-black">환산 금액</th>
                      <th class="px-3 py-3 text-right font-black">무게</th>
                      <th class="px-3 py-3 text-right font-black">개당 무게</th>
                      <th class="px-3 py-3 text-center font-black">제거</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="item in draftItems" :key="item.draftId">
                      <td class="px-3 py-3 font-mono font-bold text-gray-600">{{ item.skuCode }}</td>
                      <td class="px-3 py-3 font-black text-gray-900">{{ item.itemName }}</td>
                      <td class="px-3 py-3 font-black text-gray-700">{{ item.materialType }}</td>
                      <td class="px-3 py-3 font-bold text-gray-700">{{ formatMaterials(item.materials) }}</td>
                      <td class="px-3 py-3 text-right font-black text-gray-900">{{ item.availableQuantity.toLocaleString() }}벌</td>
                      <td class="px-3 py-3 text-right font-black text-gray-900">₩{{ Number(item.defaultKgUnitPrice || 0).toLocaleString() }}</td>
                      <td class="px-3 py-3 text-right font-black text-gray-900">₩{{ Math.round(Number(item.availableWeightKg || 0) * Number(item.defaultKgUnitPrice || 0)).toLocaleString() }}</td>
                      <td class="px-3 py-3 text-right font-black text-gray-900">{{ Number(item.availableWeightKg || 0).toFixed(2) }}kg</td>
                      <td class="px-3 py-3 text-right font-black text-gray-900">{{ Number(item.unitWeightKg || 0).toFixed(3) }}kg</td>
                      <td class="px-3 py-3 text-center">
                        <button type="button" class="h-7 border border-gray-200 px-2 text-[11px] font-black text-gray-500" @click="removeDraftItem(item.draftId)">삭제</button>
                      </td>
                    </tr>
                    <tr v-if="draftItems.length === 0">
                      <td colspan="10" class="px-3 py-8 text-center text-xs font-bold text-gray-400">선택된 SKU가 없습니다.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mt-4 border-t border-gray-100 pt-2 flex justify-end">
                <button type="button" class="h-9 border border-[#004D3C] bg-[#004D3C] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400" :disabled="!canMoveStep2" @click="moveStep(2)">다음</button>
              </div>
            </div>

            <div v-else-if="saleStep === 2" class="mt-4">
              <div class="grid gap-4 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
                <section ref="buyerDropdownRef" class="relative rounded-md border border-gray-200 bg-white p-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Buyer Search</p>
                  <label class="mt-2 flex flex-col gap-1.5">
                    <span class="text-[11px] font-bold text-gray-500">거래처 검색</span>
                    <input
                      v-model="buyerSearchTerm"
                      type="search"
                      class="h-9 border border-gray-300 bg-white px-3 text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
                      placeholder="업체명, 코드, 담당자명"
                      @focus="isBuyerDropdownOpen = true"
                    />
                  </label>
                  <p class="mt-2 text-[10px] font-bold text-gray-400">소재 구분 {{ lockedMaterialType || '-' }} 기준 후보 {{ filteredBuyers.length }}건</p>
                  <div v-if="isBuyerDropdownOpen" class="absolute left-3 right-3 top-[5.8rem] z-30 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
                    <button
                      v-for="buyer in filteredBuyers"
                      :key="buyer.id"
                      type="button"
                      class="flex w-full flex-col items-start border-b border-gray-100 px-3 py-2 text-left transition hover:bg-[#EBF5F5]"
                      @click="selectBuyer(buyer)"
                    >
                      <span class="text-xs font-black text-gray-900">{{ buyer.companyName }}</span>
                      <span class="mt-0.5 text-[11px] font-bold text-gray-500">{{ buyer.code }} · {{ buyer.managerName }} · {{ buyer.phone }}</span>
                      <span class="mt-1 text-[11px] font-bold text-gray-400">{{ buyer.industryGroup }} · {{ materialFitLabel(buyer.primaryMaterialFit) }}</span>
                    </button>
                    <div v-if="filteredBuyers.length === 0" class="px-3 py-4 text-center text-xs font-bold text-gray-400">검색 결과가 없습니다.</div>
                  </div>
                </section>

                <section class="rounded-md border border-gray-200 bg-[#FAFCFB] p-5">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">Selected Buyer</p>
                  <template v-if="selectedBuyer">
                    <div class="mt-3 flex flex-col gap-4 rounded-md border border-[#DCE8E4] bg-white px-4 py-4">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="text-base font-black text-gray-900">{{ selectedBuyer.companyName }}</p>
                          <p class="mt-1 font-mono text-[11px] font-black text-gray-500">{{ selectedBuyer.code }}</p>
                        </div>
                        <span class="rounded-full bg-[#EAF4F0] px-2.5 py-1 text-[10px] font-black text-[#255F52]">
                          {{ materialFitLabel(selectedBuyer.primaryMaterialFit) }}
                        </span>
                      </div>

                      <div class="grid gap-3 sm:grid-cols-2">
                        <div class="rounded-md bg-gray-50 px-3 py-3">
                          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">담당자</p>
                          <p class="mt-1 text-xs font-black text-gray-800">{{ selectedBuyer.managerName }}</p>
                        </div>
                        <div class="rounded-md bg-gray-50 px-3 py-3">
                          <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">연락처</p>
                          <p class="mt-1 text-xs font-black text-gray-800">{{ selectedBuyer.phone }}</p>
                        </div>
                      </div>

                      <div class="rounded-md bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">산업군</p>
                        <p class="mt-1 text-xs font-black text-gray-800">{{ selectedBuyer.industryGroup }}</p>
                      </div>

                      <div class="rounded-md bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">거래처 설명</p>
                        <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ selectedBuyer.description || '설명 없음' }}</p>
                      </div>
                    </div>
                  </template>
                  <div
                    v-else
                    class="mt-3 flex min-h-[12rem] items-center justify-center rounded-md border border-dashed border-gray-200 bg-white px-4 text-center text-xs font-bold text-gray-400"
                  >
                    왼쪽 검색 목록에서 거래처를 선택하면 요약 정보가 표시됩니다.
                  </div>
                </section>
              </div>
              <div class="mt-6 border-t border-gray-100 pt-3 xl:col-span-2 flex justify-end gap-2">
                <button type="button" class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50" @click="moveStep(1)">이전</button>
                <button type="button" class="h-9 border border-[#004D3C] bg-[#004D3C] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400" :disabled="!canMoveStep3" @click="moveStep(3)">다음</button>
              </div>
            </div>

            <div v-else class="mt-4 grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]">
              <div class="min-w-0">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div>
                  <p class="text-sm font-black text-gray-900">판매 조건 입력</p>
                  <p class="mt-1 text-[11px] font-bold text-gray-400">kg당 단가는 자동 입력되며 수정 가능합니다.</p>
                  </div>
                  <button type="button" class="text-[11px] font-black text-gray-500 hover:text-gray-900" @click="clearDraftPanel">전체 비우기</button>
                </div>
                <div class="max-h-[22rem] overflow-y-auto border border-gray-200">
                  <table class="min-w-[980px] w-full border-collapse text-left text-xs">
                    <thead class="sticky top-0 bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                      <tr>
                        <th class="pl-3 pr-1 py-3 font-black">품목</th>
                        <th class="pl-1 pr-2 py-3 text-center font-black">소재 구분</th>
                        <th class="px-3 py-3 text-center font-black">소재 상세</th>
                        <th class="px-3 py-3 text-center font-black">현재 재고</th>
                        <th class="px-3 py-3 text-center font-black">재고 총 kg</th>
                        <th class="px-3 py-3 text-center font-black">요청 kg</th>
                        <th class="px-3 py-3 text-center font-black">환산 수량</th>
                        <th class="px-3 py-3 text-center font-black">실차감 수량</th>
                        <th class="px-3 py-3 text-center font-black">실제 반영 kg</th>
                        <th class="px-3 py-3 text-center font-black">kg당 단가</th>
                        <th class="px-3 py-3 text-center font-black">예상 금액</th>
                        <th class="px-3 py-3 text-center font-black">실제 금액</th>
                        <th class="px-3 py-3 text-center font-black">삭제</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="item in draftItems" :key="item.draftId">
                        <td class="pl-3 pr-1 py-3 align-top">
                          <p class="font-mono text-[11px] font-black text-gray-400">{{ item.skuCode || '-' }}</p>
                          <p class="font-black text-gray-900">{{ item.itemName }}</p>
                          <p class="mt-1 text-[11px] font-bold text-gray-500">{{ item.mainCategory }} &gt; {{ item.subCategory }} · {{ item.color }}/{{ item.size }}</p>
                        </td>
                        <td class="pl-1 pr-2 py-3 align-top text-center font-black text-gray-700">{{ item.materialType || '-' }}</td>
                        <td class="px-3 py-3 align-top text-center font-bold text-gray-500">{{ formatMaterials(item.materials) }}</td>
                        <td class="px-3 py-3 align-top text-center font-black text-gray-900">{{ item.availableQuantity.toLocaleString() }}벌</td>
                        <td class="px-3 py-3 align-top text-center font-black text-gray-900">{{ circularInventoryStore.formatWeight(item.availableWeightKg) }}</td>
                        <td class="px-3 py-3 align-top text-center">
                          <div class="mx-auto inline-flex items-center gap-1">
                            <input :value="item.requestedWeightKg" type="number" min="0" :max="item.availableWeightKg" step="0.01" class="no-spin h-8 w-16 border border-gray-300 bg-white px-2 text-center text-[11px] font-black text-gray-900 outline-none focus:border-[#004D3C]" @input="updateDraftItemField(item.draftId, 'requestedWeightKg', $event.target.value)" />
                            <span class="text-[11px] font-black text-gray-500">kg</span>
                          </div>
                        </td>
                        <td class="px-3 py-3 align-top text-center font-black text-gray-900">{{ item.estimatedQuantity.toFixed(2) }}벌</td>
                        <td class="px-3 py-3 align-top text-center font-black text-amber-700">{{ item.deductedQuantity }}벌</td>
                        <td class="px-3 py-3 align-top text-center font-black" :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'">
                          {{ formatKg(item.actualWeightKg) }}
                        </td>
                        <td class="px-3 py-3 align-top text-center">
                          <div v-if="!isPriceEditMode(item.draftId)" class="mx-auto inline-flex h-8 min-w-[6.5rem] items-center justify-center gap-0.5 border border-gray-200 bg-gray-50 pl-2 pr-1 text-[11px] font-black text-gray-900">
                            <span>₩{{ Number(item.unitPrice || 0).toLocaleString() }}</span>
                            <button
                              type="button"
                              class="inline-flex h-5 w-5 items-center justify-center text-gray-500 transition hover:text-gray-900"
                              title="kg당 단가 수정"
                              @click="openPriceEditMode(item.draftId)"
                            >
                              ✎
                            </button>
                          </div>
                          <input
                            v-else
                            :value="item.unitPrice"
                            type="number"
                            min="0"
                            step="100"
                            class="no-spin mx-auto h-8 w-24 border border-gray-300 bg-white px-2 text-center text-[11px] font-black text-gray-900 outline-none focus:border-[#004D3C]"
                            @input="updateDraftItemField(item.draftId, 'unitPrice', $event.target.value)"
                            @blur="closePriceEditMode(item.draftId)"
                            @keydown.enter="closePriceEditMode(item.draftId)"
                          />
                          <p class="mt-1 text-center text-[10px] font-bold text-gray-400">기본 {{ Number(item.defaultKgUnitPrice || 0).toLocaleString() }}</p>
                        </td>
                        <td class="px-3 py-3 align-top text-center font-black text-gray-900">{{ formatCurrency(item.requestedAmount) }}</td>
                        <td class="px-3 py-3 align-top text-center font-black" :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'">{{ formatCurrency(item.actualAmount) }}</td>
                        <td class="px-3 py-3 align-top text-center">
                          <button
                            type="button"
                            class="h-7 border border-gray-200 px-2 text-[11px] font-black text-gray-500 hover:bg-gray-50 hover:text-black"
                            @click="removeDraftItem(item.draftId)"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="flex w-full min-w-0 flex-col gap-3">
                <section class="w-full border border-gray-200 bg-gray-50 px-3 py-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">판매 메모</p>
                  <textarea :value="circularInventoryStore.draftMemo" rows="5" maxlength="500" class="mt-2 w-full resize-none border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]" placeholder="거래 조건, 출고 메모 등을 입력하세요." @input="circularInventoryStore.setDraftMemo($event.target.value)" />
                </section>

                <section class="w-full border border-gray-200 bg-white px-3 py-3">
                  <div class="flex items-center justify-between text-xs"><span class="font-bold text-gray-500">소재 구분</span><span class="font-black text-gray-900">{{ lockedMaterialType || '-' }}</span></div>
                  <div class="mt-3 flex items-center justify-between text-xs"><span class="font-bold text-gray-500">거래처</span><span class="font-black text-gray-900">{{ selectedBuyer?.companyName ?? '-' }}</span></div>
                  <div class="mt-3 flex items-center justify-between text-xs"><span class="font-bold text-gray-500">담긴 SKU</span><span class="font-black text-gray-900">{{ drawerSummary.totalItems }}건</span></div>
                  <div class="mt-3 flex items-start justify-between gap-3 text-xs">
                    <span class="font-bold text-gray-500">포함 소재</span>
                    <span class="text-right font-black text-gray-900">
                      {{ includedMaterialNames.join(', ') || '-' }}
                    </span>
                  </div>
                  <div class="mt-3 flex items-center justify-between text-xs"><span class="font-bold text-gray-500">요청 KG</span><span class="font-black text-gray-900">{{ formatKg(drawerSummary.totalRequestedWeightKg) }}</span></div>
                  <div class="mt-3 flex items-center justify-between text-xs"><span class="font-bold text-gray-500">실제 반영 KG</span><span class="font-black text-[#0F5C4D]">{{ formatKg(drawerSummary.totalActualWeightKg) }}</span></div>
                  <div class="mt-3 flex items-center justify-between text-xs"><span class="font-bold text-gray-500">예상 금액</span><span class="font-black text-gray-900">{{ formatCurrency(drawerSummary.totalRequestedAmount) }}</span></div>
                  <div class="mt-3 flex items-center justify-between text-xs"><span class="font-bold text-gray-500">실제 금액</span><span class="font-black text-[#0F5C4D]">{{ formatCurrency(drawerSummary.totalActualAmount) }}</span></div>
                  <div class="mt-3 flex items-center justify-between text-xs"><span class="font-bold text-gray-500">실차감 수량</span><span class="font-black text-amber-700">{{ formatQuantity(drawerSummary.totalDeductedQuantity) }}벌</span></div>
                </section>

                <button type="button" class="h-9 w-full border border-gray-300 bg-white text-xs font-black text-gray-700 hover:bg-gray-50" @click="moveStep(2)">이전</button>
                <button type="button" class="h-10 w-full text-sm font-black transition" :class="canSubmit ? 'bg-[#004D3C] text-white hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-100 text-gray-400'" :disabled="!canSubmit" @click="openFinalReviewModal">최종 판매 등록서 확인</button>
                <p v-if="submitDisabledReason" class="text-[11px] font-bold leading-5 text-red-600">{{ submitDisabledReason }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showFinalReviewModal"
        class="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
        @click.self="showFinalReviewModal = false"
      >
        <div class="flex h-full w-full items-center justify-center p-4">
          <div class="flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-md bg-white shadow-2xl">
            <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Final Review</p>
                <h2 class="mt-1 text-lg font-black text-gray-900">최종 판매 등록서 확인</h2>
              </div>
              <button type="button" class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50" @click="showFinalReviewModal = false">닫기</button>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <section class="border border-gray-200 bg-white">
                <div class="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
                  <div>
                    <div class="flex flex-wrap items-start justify-between gap-3 pb-3">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">거래 요약</p>
                        <p class="mt-1 text-base font-black text-gray-900">{{ selectedBuyer?.companyName ?? '-' }}</p>
                        <p class="mt-1 text-xs font-bold text-gray-500">
                          소재 구분 {{ lockedMaterialType || '-' }} · 담긴 SKU {{ formatQuantity(drawerSummary.totalItems) }}건
                        </p>
                      </div>
                      <div class="rounded-full bg-[#EAF4F0] px-3 py-1 text-[10px] font-black text-[#255F52]">
                        {{ materialFitLabel(selectedBuyer?.primaryMaterialFit) || '-' }}
                      </div>
                    </div>

                    <div class="mt-2 grid gap-3 pb-4 md:grid-cols-2 xl:grid-cols-4">
                      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">요청 / 실제 KG</p>
                        <p class="mt-1 text-sm font-black text-gray-900">{{ formatKg(finalReviewSummary.totalRequestedWeightKg) }}</p>
                        <p class="mt-1 text-sm font-black text-[#0F5C4D]">{{ formatKg(finalReviewSummary.totalActualWeightKg) }}</p>
                      </div>
                      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">환산 / 실차감</p>
                        <p class="mt-1 text-sm font-black text-gray-900">{{ Number(finalReviewSummary.totalEstimatedQuantity).toFixed(2) }}벌</p>
                        <p class="mt-1 text-sm font-black text-amber-700">{{ formatQuantity(finalReviewSummary.totalDeductedQuantity) }}벌</p>
                      </div>
                      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">예상 / 실제 금액</p>
                        <p class="mt-1 text-sm font-black text-gray-900">{{ formatCurrency(finalReviewSummary.totalRequestedAmount) }}</p>
                        <p class="mt-1 text-sm font-black text-[#0F5C4D]">{{ formatCurrency(finalReviewSummary.totalActualAmount) }}</p>
                      </div>
                      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">포함 소재</p>
                        <p class="mt-1 text-sm font-black leading-5 text-gray-900">{{ includedMaterialNames.join(', ') || '-' }}</p>
                      </div>
                    </div>

                    <div v-if="Math.abs(finalReviewSummary.totalActualWeightKg - finalReviewSummary.totalRequestedWeightKg) >= 0.01" class="rounded-md border border-[#D7E9E3] bg-[#F3FAF8] px-3 py-3">
                      <p class="text-xs font-black text-[#0F5C4D]">
                        요청 {{ formatKg(finalReviewSummary.totalRequestedWeightKg) }} → 실재고 차감 기준 {{ formatKg(finalReviewSummary.totalActualWeightKg) }} 반영
                      </p>
                    </div>
                  </div>

                  <aside class="border border-gray-200 bg-gray-50 px-4 py-4">
                    <div class="flex items-start justify-between gap-3 pb-3">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">거래처 정보</p>
                        <div class="mt-1 flex flex-wrap items-center gap-2">
                          <p class="text-sm font-black text-gray-900">{{ selectedBuyer?.companyName ?? '-' }}</p>
                          <p class="font-mono text-[11px] font-black text-gray-500">{{ selectedBuyer?.code ?? '-' }}</p>
                        </div>
                      </div>
                      <span class="text-[11px] font-black text-gray-500">{{ selectedBuyer?.industryGroup ?? '-' }}</span>
                    </div>

                    <div class="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">담당자</p>
                        <p class="mt-1 text-xs font-black text-gray-800">{{ selectedBuyer?.managerName ?? '-' }}</p>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">연락처</p>
                        <p class="mt-1 text-xs font-black text-gray-800">{{ selectedBuyer?.phone ?? '-' }}</p>
                      </div>
                    </div>

                    <div class="mt-4 border-t border-gray-200 pt-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">취급제품 / 생산품</p>
                      <p class="mt-1 text-xs font-bold leading-5 text-gray-700">
                        {{ selectedBuyer?.productTypes?.join(', ') || selectedBuyer?.productNote || '-' }}
                      </p>
                    </div>

                    <div class="mt-4 border-t border-gray-200 pt-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">거래처 설명</p>
                      <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ selectedBuyer?.description || '설명 없음' }}</p>
                    </div>

                    <div class="mt-4 border-t border-gray-200 pt-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">판매 메모</p>
                      <p class="mt-1 text-xs font-bold leading-5 text-gray-700">{{ circularInventoryStore.draftMemo?.trim() || '입력된 메모 없음' }}</p>
                    </div>
                  </aside>
                </div>
              </section>

              <section class="mt-4 min-w-0 border border-gray-200 bg-white">
                <div class="border-b border-gray-100 px-3 py-3">
                  <h3 class="text-sm font-black text-gray-900">판매 SKU 상세</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-[1450px] w-full border-collapse text-left text-xs">
                    <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                      <tr>
                        <th class="px-3 py-3 font-black">SKU 코드</th>
                        <th class="pl-0.5 pr-3 py-3 text-left font-black">품목명</th>
                        <th class="px-3 py-3 text-left font-black">소재 구분</th>
                        <th class="px-3 py-3 font-black">소재 상세</th>
                        <th class="px-3 py-3 text-left font-black">현재 재고</th>
                        <th class="px-3 py-3 text-left font-black">요청 kg</th>
                        <th class="px-3 py-3 text-left font-black">환산 수량</th>
                        <th class="px-3 py-3 text-left font-black">실차감 재고</th>
                        <th class="px-3 py-3 text-left font-black">실제 반영 kg</th>
                        <th class="px-3 py-3 text-left font-black">kg당 단가</th>
                        <th class="px-3 py-3 text-left font-black">예상 금액</th>
                        <th class="px-3 py-3 text-left font-black">실제 금액</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="item in draftItems" :key="item.draftId">
                        <td class="pl-3 pr-0 py-3 font-mono font-bold text-gray-500">{{ item.skuCode }}</td>
                        <td class="pl-0.5 pr-3 py-3 font-black text-gray-900">{{ item.itemName }}</td>
                        <td class="px-3 py-3 text-left font-black text-gray-900">{{ item.materialType }}</td>
                        <td class="px-3 py-3 font-bold text-gray-700">{{ formatMaterials(item.materials) }}</td>
                        <td class="px-3 py-3 text-left font-black text-gray-600">{{ formatQuantity(item.availableQuantity) }}벌 / {{ formatKg(item.availableWeightKg) }}</td>
                        <td class="px-3 py-3 text-left font-black text-gray-900">{{ formatKg(item.requestedWeightKg) }}</td>
                        <td class="px-3 py-3 text-left font-black text-gray-700">{{ Number(item.estimatedQuantity || 0).toFixed(2) }}벌</td>
                        <td class="px-3 py-3 text-left font-black text-amber-700">{{ formatQuantity(item.deductedQuantity) }}벌</td>
                        <td class="px-3 py-3 text-left font-black" :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'">{{ formatKg(item.actualWeightKg) }}</td>
                        <td class="px-3 py-3 text-left font-black text-gray-900">{{ formatCurrency(item.unitPrice) }}</td>
                        <td class="px-3 py-3 text-left font-black text-gray-900">{{ formatCurrency(item.requestedAmount) }}</td>
                        <td class="px-3 py-3 text-left font-black" :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'">{{ formatCurrency(item.actualAmount) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button type="button" class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100" @click="showFinalReviewModal = false">검토 종료</button>
              <button type="button" class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100" @click="returnToDrawerEdit">패널로 돌아가 수정</button>
              <button type="button" class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#00382c]" @click="submitSale">이 내용으로 최종 등록</button>
            </div>
          </div>
        </div>
      </div>

      <p
        v-if="toastMessage"
        class="fixed right-4 top-16 z-30 border px-4 py-2 text-sm font-black shadow-lg"
        :class="toastTone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'"
      >
        {{ toastMessage }}
      </p>
    </div>
  </AppLayout>
</template>

<style scoped>
.no-spin::-webkit-outer-spin-button,
.no-spin::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.no-spin {
  -moz-appearance: textfield;
}
</style>

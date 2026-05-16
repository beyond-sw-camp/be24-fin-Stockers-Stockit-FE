<script setup>
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Info, Loader2, Sprout } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import CircularStockInventoryBrowseSection from '@/components/hq/circular-stock/CircularStockInventoryBrowseSection.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useEsgStore } from '@/stores/esg.js'
import { useCircularStockBuyerStore } from '@/stores/hq/circularStock/circularStockBuyers.js'
import { useCircularStockStore } from '@/stores/hq/circularStock/circularStock.js'

const router = useRouter()
const auth = useAuthStore()
const esgStore = useEsgStore()
const buyerStore = useCircularStockBuyerStore()
const circularStockStore = useCircularStockStore()

const hqMenus = roleMenus.hq
const circularStockMenus =
  roleMenus.hq.find((menu) => menu.label === '순환 재고 관리')?.children ?? []

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
const inventoryLoadError = ref('')
const isInventoryLoading = ref(false)
let toastTimer = null

// ADR-021 AI 거래처 추천 — Step 2 좌측 영역 모드 토글. 'ai' | 'manual'.
const buyerPanelMode = ref('ai')
const expandedRecommendationCode = ref('')
const lastRecommendationKey = ref('')
const visibleRationaleCodes = ref({})
let rationaleTimers = []

const saleStep = computed({
  get: () => Number(unref(circularStockStore.saleStep) || 1),
  set: (value) => circularStockStore.setSaleStep(value),
})
const filteredBuyers = computed(() => circularStockStore.filteredBuyers(buyerSearchTerm.value))
const selectedBuyer = computed(() => circularStockStore.selectedBuyer)
const drawerSummary = computed(() => circularStockStore.draftSummary)
const draftItems = computed(() => circularStockStore.draftItems)
const draftRowIds = computed(() => draftItems.value.map((item) => item.draftId))
const submitValidation = computed(() => circularStockStore.validateCircularStockSaleDraft())
const lockedMaterialType = computed(() => {
  const raw = unref(circularStockStore.lockedMaterialType)
  return typeof raw === 'string' ? raw : ''
})

const canMoveStep2 = computed(
  () => draftItems.value.length > 0 && Boolean(lockedMaterialType.value),
)
const canMoveStep3 = computed(() => canMoveStep2.value && Boolean(selectedBuyer.value))
const canSubmit = computed(() => submitValidation.value.success)
const shouldRenderDrawer = computed(() => true)
const browseSummaryText = computed(() => `담긴 SKU ${draftItems.value.length.toLocaleString()}건`)
const includedMaterialNames = computed(() => [
  ...new Set(draftItems.value.flatMap((item) => item.materials.map((material) => material.name))),
])
const finalReviewSummary = computed(() => ({
  totalEstimatedQuantity: draftItems.value.reduce(
    (sum, item) => sum + (Number(item.estimatedQuantity) || 0),
    0,
  ),
  totalDeductedQuantity: draftItems.value.reduce(
    (sum, item) => sum + (Number(item.deductedQuantity) || 0),
    0,
  ),
  totalRequestedAmount: draftItems.value.reduce(
    (sum, item) => sum + (Number(item.requestedAmount) || 0),
    0,
  ),
  totalActualAmount: draftItems.value.reduce(
    (sum, item) => sum + (Number(item.actualAmount) || 0),
    0,
  ),
  totalRequestedWeightKg: draftItems.value.reduce(
    (sum, item) => sum + (Number(item.requestedWeightKg) || 0),
    0,
  ),
  totalActualWeightKg: draftItems.value.reduce(
    (sum, item) => sum + (Number(item.actualWeightKg) || 0),
    0,
  ),
}))
const submitDisabledReason = computed(() => (canSubmit.value ? '' : submitValidation.value.message))
const topRecommendations = computed(() => circularStockStore.recommendations.slice(0, 5))
const recommendationKey = computed(() =>
  draftItems.value
    .map((item) => `${item.draftId}:${item.skuCode}:${Number(item.requestedWeightKg || 0)}`)
    .sort()
    .join('|'),
)
const matchingMaterialBadges = computed(() => {
  const badgeMap = new Map()
  for (const item of draftItems.value) {
    for (const material of item.materials || []) {
      const name = String(material?.name || '').trim()
      const ratio = Number(material?.ratio || 0)
      if (!name || ratio <= 0) continue
      const key = `${name}-${ratio}`
      if (!badgeMap.has(key)) badgeMap.set(key, `${name} ${ratio}%`)
    }
  }
  return Array.from(badgeMap.values()).slice(0, 3)
})
const matchingContextSummary = computed(() => {
  const totalSkuCount = draftItems.value.length
  const totalQuantity = draftItems.value.reduce(
    (sum, item) => sum + (Number(item.availableQuantity) || 0),
    0,
  )
  const totalWeightKg = draftItems.value.reduce(
    (sum, item) => sum + (Number(item.availableWeightKg) || 0),
    0,
  )

  const carbonFactors = {
    면: 6.5,
    폴리에스터: 6.8,
    나일론: 5.5,
    데님: 6.5,
    울: 20.0,
    캐시미어: 20.0,
    실크: 12.0,
    리넨: 7.0,
    아크릴: 5.8,
    스판덱스: 5.2,
    default: 6.0,
  }

  let estimatedSavedCarbonKg = 0
  for (const item of draftItems.value) {
    const weightKg = Number(item.availableWeightKg) || 0
    const materials =
      Array.isArray(item.materials) && item.materials.length > 0
        ? item.materials
        : [{ name: '기타', ratio: 100 }]
    const totalRatio =
      materials.reduce((sum, material) => sum + (Number(material.ratio) || 0), 0) || 100
    for (const material of materials) {
      const ratio = Number(material.ratio) || 0
      const normalizedName = String(material.name || '').trim()
      const factor = carbonFactors[normalizedName] ?? carbonFactors.default
      estimatedSavedCarbonKg += weightKg * (ratio / totalRatio) * factor
    }
  }

  const roundedCarbonKg = Math.round(estimatedSavedCarbonKg * 100) / 100
  const kauPrice = Number(esgStore.kauPrice || 0)
  const carbonCreditValue = Math.round((roundedCarbonKg / 1000) * kauPrice)

  return {
    totalSkuCount,
    totalQuantity,
    totalWeightKg,
    roundedCarbonKg,
    carbonCreditValue,
  }
})

function formatMaterials(materials) {
  return materials.map((material) => `${material.name} ${material.ratio}%`).join(', ')
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
  return Boolean(circularStockStore.getDraftItem(draftId))
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
  // ADR-021 — Step 2 진입 시 AI 추천 호출
  if (step === 2 && !circularStockStore.isRecommendationLoading) {
    const shouldRefetch =
      circularStockStore.recommendations.length === 0 ||
      recommendationKey.value !== lastRecommendationKey.value
    if (shouldRefetch) {
      lastRecommendationKey.value = recommendationKey.value
      circularStockStore.fetchRecommendations()
    }
  }
}

function onRecommendationSelect(code) {
  const rec = circularStockStore.recommendations.find((r) => r.code === code)
  if (!rec) return
  circularStockStore.selectBuyer(code)
  buyerSearchTerm.value = rec.companyName
}

function toggleRecommendationDetail(code) {
  expandedRecommendationCode.value = expandedRecommendationCode.value === code ? '' : code
}

function clearRationaleTimers() {
  for (const timer of rationaleTimers) clearTimeout(timer)
  rationaleTimers = []
}

function startRationaleProgressiveReveal() {
  clearRationaleTimers()
  visibleRationaleCodes.value = {}
  const list = topRecommendations.value
  list.forEach((rec, index) => {
    const timer = setTimeout(
      () => {
        visibleRationaleCodes.value = {
          ...visibleRationaleCodes.value,
          [rec.code]: true,
        }
      },
      180 + index * 220,
    )
    rationaleTimers.push(timer)
  })
}

function recommendationBonusReason(rec, index) {
  if (isSocialEnterprise(rec)) return '사회적기업 거래 보너스'
  if (isLocalSmallPartner(rec)) return '소규모 기업 거래 보너스'
  if (isNewPartner(rec, index)) return '신규 거래처 보너스'
  return ''
}

function recommendationProductLabel(rec, index = 0) {
  const mockProducts = [
    '가방, 지갑, 혼방',
    '가죽 재가공, 소가죽, 양가죽',
    '거즈, 면 수건, 재생',
    '건설 단열재, 보온재, 재생 합성',
    '건축 마감재, 혼방, 재활용',
    '토목 자재, 건설 부직포, 재생 합성',
  ]
  if (Array.isArray(rec?.productTypes) && rec.productTypes.length > 0) {
    return rec.productTypes.join(', ')
  }
  return rec?.productNote || mockProducts[index % mockProducts.length]
}

function isSocialEnterprise(rec) {
  const partnerType = String(rec?.partnerType || '').toLowerCase()
  const industry = String(rec?.industryGroup || '')
  return partnerType === 'social_enterprise' || industry.includes('사회적')
}

function isLocalSmallPartner(rec) {
  const partnerType = String(rec?.partnerType || '').toLowerCase()
  const industry = String(rec?.industryGroup || '')
  return partnerType === 'local_small' || /소규모|지역 소규모/.test(industry)
}

function isNewPartner(rec, index) {
  const historyCount = Number(rec?.tradeHistoryCount ?? rec?.transactionCount ?? rec?.tradeCount)
  if (Number.isFinite(historyCount)) return historyCount <= 0
  return index === 0
}

function recommendationLocationLabel(rec) {
  const address = String(rec?.address || '').trim()
  if (!address) return '서울 종로구'
  const parts = address.split(/\s+/).filter(Boolean)
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0]
}

function recommendationManagerLabel(rec, index) {
  const mockManagers = ['김재호', '한도훈', '정유민', '이재훈', '조유석', '김윤석']
  return String(rec?.managerName || '').trim() || mockManagers[index % mockManagers.length]
}

function recommendationPhoneLabel(rec, index) {
  return String(rec?.phone || '').trim() || `02-000${index}-000${index}`
}

function companyBadgeText(name) {
  const raw = String(name || '').replace(/\(주\)|주식회사|\s/g, '')
  if (!raw) return '업체'
  return raw.slice(0, 2)
}

function companyBadgeClass(index) {
  const classes = [
    'bg-[#DCEBDD] text-[#2F6A37]',
    'bg-[#DFECE8] text-[#2F6860]',
    'bg-[#E4E7F4] text-[#3F4FAF]',
    'bg-[#F1EBDD] text-[#C97216]',
    'bg-[#EFE3EA] text-[#A33E74]',
  ]
  return classes[index % classes.length]
}

function goToSkuList() {
  router.push({ name: 'hq-circular-inventory-sales-register', query: { fromWorkflow: '1' } })
}

function addItemToDraft(row) {
  const result = circularStockStore.addSaleDraftItem(row)
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
  circularStockStore.updateSaleDraftItem(draftId, {
    [normalizedField]: value,
    resolvedUnitPrice: Number(field === 'unitPrice' ? value : undefined) || undefined,
  })
}

function removeDraftItem(draftId) {
  circularStockStore.removeSaleDraftItem(draftId)
  delete priceEditModes.value[draftId]
  if (draftItems.value.length === 0) {
    isDrawerOpen.value = false
  }
}

function selectBuyer(buyer) {
  circularStockStore.selectBuyer(buyer.id)
  buyerSearchTerm.value = buyer.companyName
  isBuyerDropdownOpen.value = false
}

function clearDraftPanel() {
  circularStockStore.clearDraft()
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
  const result = circularStockStore.submitCircularStockSale(auth.user?.name ?? '본사 관리자')
  toastMessage.value = result.success
    ? `${result.sale.saleId} 판매 등록을 완료했습니다.`
    : result.message
  toastTone.value = result.success ? 'success' : 'error'

  if (result.success) {
    buyerSearchTerm.value = ''
    isDrawerOpen.value = false
    showFinalReviewModal.value = false
    router.push({
      name: 'hq-circular-inventory-sales-history-detail',
      params: { saleId: result.sale.saleId },
    })
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

function materialFitLabel(value) {
  return buyerStore.materialFitLabel(value)
}

async function loadCircularInventoryRows() {
  isInventoryLoading.value = true
  inventoryLoadError.value = ''
  try {
    await circularStockStore.loadCircularInventoryRows({ page: 0, size: 100, sort: 'skuCode,asc' })
  } catch (e) {
    inventoryLoadError.value = e.message || '순환 재고 불러오기에 실패했습니다.'
  } finally {
    isInventoryLoading.value = false
  }
}

watch(toastMessage, (message) => {
  if (!message) return
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
})

watch(
  () => topRecommendations.value.map((rec) => rec.code).join('|'),
  () => {
    if (buyerPanelMode.value === 'ai' && topRecommendations.value.length > 0) {
      startRationaleProgressiveReveal()
    }
  },
)

watch(
  () => buyerPanelMode.value,
  (mode) => {
    if (mode === 'ai' && topRecommendations.value.length > 0) {
      startRationaleProgressiveReveal()
    }
  },
)

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick)
  loadCircularInventoryRows()
  circularStockStore.markWorkflowStarted()
  isDrawerOpen.value = true
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
  if (toastTimer) clearTimeout(toastTimer)
  clearRationaleTimers()
})
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularStockMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4 pb-36">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Circular Inventory Sales
            </p>
            <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 판매 등록</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              SKU를 먼저 선택하고, 거래처를 매칭한 뒤 판매 kg/단가를 확정해 요청서를 등록합니다.
            </p>
            <p v-if="inventoryLoadError" class="mt-2 text-xs font-bold text-red-600">
              {{ inventoryLoadError }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 transition hover:bg-gray-50"
              @click="goToSkuList"
            >
              SKU 목록으로 돌아가기
            </button>
          </div>
        </div>
      </section>

      <div class="w-full">
        <div class="w-full">
          <div class="flex w-full flex-col overflow-hidden border border-gray-200 bg-white">
            <div
              class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-sm font-black text-gray-900">판매 등록</span>
                <span class="text-[11px] font-bold text-gray-500">
                  소재 구분 {{ lockedMaterialType || '-' }} · 담긴 SKU
                  {{ drawerSummary.totalItems }}건
                </span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm font-black text-gray-900">{{
                  formatCurrency(drawerSummary.totalActualAmount)
                }}</span>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4">
              <div class="h-5" />
              <div class="relative">
                <div
                  class="pointer-events-none absolute left-0 right-0 top-5 flex items-center px-[16.666%]"
                >
                  <span class="relative h-[2px] flex-1 rounded-full bg-gray-200">
                    <span
                      class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2F9E87] to-[#0F5C4D] transition-all duration-400 ease-out"
                      :style="{ width: saleStep >= 2 ? '100%' : '0%' }"
                    />
                  </span>
                  <span class="mx-2 h-[2px] w-8 rounded-full bg-transparent" />
                  <span class="relative h-[2px] flex-1 rounded-full bg-gray-200">
                    <span
                      class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2F9E87] to-[#0F5C4D] transition-all duration-400 ease-out"
                      :style="{ width: saleStep >= 3 ? '100%' : '0%' }"
                    />
                  </span>
                </div>

                <div class="relative flex items-start">
                  <button
                    type="button"
                    class="group flex min-w-0 flex-1 flex-col items-center gap-3 text-center"
                    @click="moveStep(1)"
                  >
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all duration-200"
                      :class="
                        saleStep >= 1
                          ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-[0_6px_14px_-8px_rgba(15,92,77,0.75)] ring-2 ring-[#0F5C4D]/15'
                          : 'border-gray-300 bg-white text-gray-500 shadow-sm'
                      "
                      >1</span
                    >
                    <span
                      class="text-xs font-black"
                      :class="saleStep === 1 ? 'text-[#0F5C4D]' : 'text-gray-600'"
                      >선택한 SKU 확인</span
                    >
                  </button>

                  <button
                    type="button"
                    class="group flex min-w-0 flex-1 flex-col items-center gap-3 text-center"
                    @click="moveStep(2)"
                  >
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all duration-200"
                      :class="
                        saleStep >= 2
                          ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-[0_6px_14px_-8px_rgba(15,92,77,0.75)] ring-2 ring-[#0F5C4D]/15'
                          : 'border-gray-300 bg-white text-gray-500 shadow-sm'
                      "
                      >2</span
                    >
                    <span
                      class="text-xs font-black"
                      :class="saleStep === 2 ? 'text-[#0F5C4D]' : 'text-gray-600'"
                      >거래처 매칭</span
                    >
                  </button>

                  <button
                    type="button"
                    class="group flex min-w-0 flex-1 flex-col items-center gap-3 text-center"
                    @click="moveStep(3)"
                  >
                    <span
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all duration-200"
                      :class="
                        saleStep >= 3
                          ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-[0_6px_14px_-8px_rgba(15,92,77,0.75)] ring-2 ring-[#0F5C4D]/15'
                          : 'border-gray-300 bg-white text-gray-500 shadow-sm'
                      "
                      >3</span
                    >
                    <span
                      class="text-xs font-black"
                      :class="saleStep === 3 ? 'text-[#0F5C4D]' : 'text-gray-600'"
                      >판매 조건 확정</span
                    >
                  </button>
                </div>
              </div>

              <div class="h-6" />

              <div v-if="saleStep === 1" class="mt-0">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-black text-gray-900">선택 SKU</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <p class="text-[11px] font-bold text-gray-500">
                      한 건의 판매에서 같은 소재 구분의 SKU만 선택할 수 있습니다.
                    </p>
                    <button
                      type="button"
                      class="text-[11px] font-black text-gray-500 hover:text-gray-900"
                      @click="clearDraftPanel"
                    >
                      전체 비우기
                    </button>
                  </div>
                </div>
                <div class="h-2" />
                <div class="overflow-x-auto border border-gray-200">
                  <table class="w-full border-collapse text-left text-xs">
                    <thead
                      class="sticky top-0 bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500"
                    >
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
                        <td class="px-3 py-3 font-mono font-bold text-gray-600">
                          {{ item.skuCode }}
                        </td>
                        <td class="px-3 py-3 font-black text-gray-900">{{ item.itemName }}</td>
                        <td class="px-3 py-3 font-black text-gray-700">{{ item.materialType }}</td>
                        <td class="px-3 py-3 font-bold text-gray-700">
                          {{ formatMaterials(item.materials) }}
                        </td>
                        <td class="px-3 py-3 text-right font-black text-gray-900">
                          {{ item.availableQuantity.toLocaleString() }}벌
                        </td>
                        <td class="px-3 py-3 text-right font-black text-gray-900">
                          ₩{{ Number(item.defaultKgUnitPrice || 0).toLocaleString() }}
                        </td>
                        <td class="px-3 py-3 text-right font-black text-gray-900">
                          ₩{{
                            Math.round(
                              Number(item.availableWeightKg || 0) *
                                Number(item.defaultKgUnitPrice || 0),
                            ).toLocaleString()
                          }}
                        </td>
                        <td class="px-3 py-3 text-right font-black text-gray-900">
                          {{ Number(item.availableWeightKg || 0).toFixed(2) }}kg
                        </td>
                        <td class="px-3 py-3 text-right font-black text-gray-900">
                          {{ Number(item.unitWeightKg || 0).toFixed(3) }}kg
                        </td>
                        <td class="px-3 py-3 text-center">
                          <button
                            type="button"
                            class="h-7 border border-gray-200 px-2 text-[11px] font-black text-gray-500"
                            @click="removeDraftItem(item.draftId)"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                      <tr v-if="draftItems.length === 0">
                        <td
                          colspan="10"
                          class="px-3 py-8 text-center text-xs font-bold text-gray-400"
                        >
                          선택된 SKU가 없습니다.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="mt-6 border-t border-gray-100 pt-3 flex justify-end">
                  <button
                    type="button"
                    class="h-9 border border-[#004D3C] bg-[#004D3C] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                    :disabled="!canMoveStep2"
                    @click="moveStep(2)"
                  >
                    다음
                  </button>
                </div>
              </div>

              <div v-else-if="saleStep === 2" class="mt-0">
                <section ref="buyerDropdownRef">
                  <!-- 선택된 거래처 컴팩트 카드 (AI/수동 공용) -->
                  <section
                    v-if="selectedBuyer"
                    class="rounded-md border border-[#DCE8E4] bg-[#F3FAF8] px-4 py-3"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="flex items-center gap-2">
                          <p
                            class="text-[9px] font-bold uppercase tracking-[0.14em] text-[#0F5C4D]"
                          >
                            선택된 거래처
                          </p>
                          <span
                            class="rounded-full bg-[#0F5C4D] px-1.5 py-0.5 text-[9px] font-black text-white"
                            >✓</span
                          >
                        </div>
                        <p class="mt-1 text-sm font-black text-gray-900">
                          {{ selectedBuyer.companyName }}
                        </p>
                        <p class="mt-0.5 font-mono text-[11px] font-semibold text-gray-500">
                          {{ selectedBuyer.code }}
                        </p>
                      </div>
                      <span
                        class="rounded-full bg-[#EAF4F0] px-2 py-0.5 text-[10px] font-bold text-[#255F52]"
                      >
                        {{ materialFitLabel(selectedBuyer.primaryMaterialFit) }}
                      </span>
                    </div>
                    <div class="mt-3 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p class="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          담당자
                        </p>
                        <p class="mt-0.5 font-semibold text-gray-800">
                          {{ selectedBuyer.managerName || '-' }}
                        </p>
                      </div>
                      <div>
                        <p class="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          연락처
                        </p>
                        <p class="mt-0.5 font-semibold text-gray-800">
                          {{ selectedBuyer.phone || '-' }}
                        </p>
                      </div>
                      <div>
                        <p class="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          산업군
                        </p>
                        <p class="mt-0.5 font-semibold text-gray-800">
                          {{ selectedBuyer.industryGroup || '-' }}
                        </p>
                      </div>
                    </div>
                    <div
                      v-if="selectedBuyer.description"
                      class="mt-3 border-t border-[#DCE8E4] pt-3"
                    >
                      <p class="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                        거래처 설명
                      </p>
                      <p class="mt-1 text-[11px] font-medium leading-5 text-gray-700">
                        {{ selectedBuyer.description }}
                      </p>
                    </div>
                  </section>
                  <div v-if="selectedBuyer" class="h-6" />

                  <!-- 모드 토글 — AI 추천 (default) / 수동 검색 -->
                  <div
                    class="grid max-w-md grid-cols-2 gap-1 rounded-md border border-gray-200 bg-gray-50 p-1"
                  >
                    <button
                      type="button"
                      class="h-9 text-xs font-black transition"
                      :class="
                        buyerPanelMode === 'ai'
                          ? 'bg-[#004D3C] text-white'
                          : 'bg-transparent text-gray-500 hover:text-gray-700'
                      "
                      @click="buyerPanelMode = 'ai'"
                    >
                      ✨ AI 추천<span
                        v-if="!circularStockStore.isRecommendationLoading"
                        class="ml-1 opacity-80"
                        >· {{ circularStockStore.recommendations.length }}</span
                      >
                    </button>
                    <button
                      type="button"
                      class="h-9 text-xs font-black transition"
                      :class="
                        buyerPanelMode === 'manual'
                          ? 'bg-[#004D3C] text-white'
                          : 'bg-transparent text-gray-500 hover:text-gray-700'
                      "
                      @click="buyerPanelMode = 'manual'"
                    >
                      수동 검색<span class="ml-1 opacity-80">· {{ filteredBuyers.length }}</span>
                    </button>
                  </div>
                  <div class="h-3" />
                <div
                  v-if="buyerPanelMode === 'ai'"
                  class="flex items-start gap-2 rounded-lg border border-[#F1E7CF] bg-[#FFFBF3] px-4 py-2 text-xs font-bold text-[#7D6432]"
                >
                  <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B38A3A]" :stroke-width="2" />
                  <span>
                    선택된 소재 정보를 기반으로 DB에서 가장 적합한 거래처 5곳을 AI가 분석했습니다.
                    각 거래처를 클릭해 AI 추천 상세 이유를 확인하세요
                  </span>
                </div>
                  <div v-if="buyerPanelMode === 'ai'" class="h-3" />

                  <!-- AI 추천 모드 -->
                  <div v-if="buyerPanelMode === 'ai'" class="space-y-5">
                    <div
                      v-if="
                        circularStockStore.isRecommendationLoading &&
                        topRecommendations.length === 0
                      "
                    >
                      <div
                        class="mb-2 flex items-center gap-2 pl-2 text-sm text-gray-700"
                        style="font-weight: 700; margin-bottom: 8px"
                      >
                        <Loader2 class="h-4 w-4 animate-spin text-[#2E5734]" :stroke-width="2.2" />
                        <span>AI가 거래처 추천 이유를 분석중입니다.</span>
                      </div>
                      <template v-for="n in 5" :key="`rec-skeleton-${n}`">
                        <div
                          class="overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-4"
                        >
                          <div
                            class="grid grid-cols-[28px_40px_minmax(0,1fr)_auto] items-start gap-3"
                          >
                            <div class="mt-1 h-7 w-7 animate-pulse rounded-full bg-gray-200" />
                            <div class="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
                            <div>
                              <div class="h-4 w-56 animate-pulse rounded bg-gray-200" />
                              <div
                                class="h-4 w-72 animate-pulse rounded bg-gray-200"
                                style="margin-top: 8px"
                              />
                              <div
                                class="h-4 w-80 animate-pulse rounded bg-gray-200"
                                style="margin-top: 8px"
                              />
                            </div>
                            <div class="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
                          </div>
                        </div>
                        <div v-if="n < 5" class="h-3" />
                      </template>
                    </div>
                    <div
                      v-else-if="circularStockStore.recommendationError"
                      class="rounded-md border border-red-200 bg-red-50 px-3 py-4 text-xs font-bold text-red-700"
                    >
                      {{ circularStockStore.recommendationError }}
                    </div>
                    <div
                      v-else-if="topRecommendations.length === 0"
                      class="rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-xs font-bold text-gray-500"
                    >
                      추천 결과가 없습니다. 수동 검색으로 거래처를 선택하세요.
                    </div>
                    <article
                      v-for="(rec, index) in topRecommendations"
                      :key="rec.code"
                      class="overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-[#9DBCAF] hover:shadow-[0_10px_24px_-14px_rgba(15,92,77,0.45)]"
                      :class="
                        selectedBuyer?.id === rec.code ||
                        selectedBuyer?.code === rec.code ||
                        expandedRecommendationCode === rec.code
                          ? 'bg-[#F9FCFB]'
                          : ''
                      "
                      :style="{
                        marginBottom: index === topRecommendations.length - 1 ? '0px' : '20px',
                        borderColor:
                          selectedBuyer?.id === rec.code ||
                          selectedBuyer?.code === rec.code ||
                          expandedRecommendationCode === rec.code
                            ? '#6EA08F'
                            : undefined,
                        boxShadow:
                          selectedBuyer?.id === rec.code ||
                          selectedBuyer?.code === rec.code ||
                          expandedRecommendationCode === rec.code
                            ? '0 10px 24px -14px rgba(15,92,77,0.35)'
                            : undefined,
                      }"
                    >
                      <div
                        class="grid cursor-pointer grid-cols-[28px_40px_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3"
                        @click="toggleRecommendationDetail(rec.code)"
                      >
                        <span
                          class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black leading-none"
                          :class="
                            selectedBuyer?.id === rec.code || selectedBuyer?.code === rec.code
                              ? 'bg-[#234D31] text-white'
                              : 'bg-gray-100 text-gray-500'
                          "
                        >
                          {{ index + 1 }}
                        </span>
                        <span
                          class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black tracking-tight"
                          :class="companyBadgeClass(index)"
                          style="font-weight: 700"
                        >
                          {{ companyBadgeText(rec.companyName) }}
                        </span>
                        <div class="min-w-0">
                          <div class="flex min-h-10 flex-wrap items-center gap-2">
                            <p
                              class="text-base font-black leading-none text-gray-900"
                              style="font-weight: 600"
                            >
                              {{ rec.companyName }}
                            </p>
                            <span class="text-xs font-bold leading-none text-gray-400">{{
                              rec.code
                            }}</span>
                            <span
                              class="rounded-full border border-[#BFDFFF] bg-[#EAF6FF] px-2.5 py-1.5 text-[11px] font-black leading-none text-[#1F6FAE]"
                            >
                              소재 적합도 상
                            </span>
                            <span
                              v-if="isSocialEnterprise(rec)"
                              class="rounded-full border border-[#D9C6F7] bg-[#F1EAFE] px-2.5 py-1.5 text-[11px] font-black leading-none text-[#6C3FB4]"
                            >
                              사회적기업
                            </span>
                            <span
                              v-if="isLocalSmallPartner(rec)"
                              class="rounded-full border border-[#F3C8D1] bg-[#FCECEF] px-2.5 py-1.5 text-[11px] font-black leading-none text-[#B24563]"
                            >
                              소규모 기업
                            </span>
                            <span
                              v-if="isNewPartner(rec, index)"
                              class="rounded-full border border-[#F2DE9C] bg-[#FFF8DC] px-2.5 py-1.5 text-[11px] font-black leading-none text-[#9A6A00]"
                            >
                              신규 거래처
                            </span>
                          </div>
                          <p class="mt-1 text-sm font-bold text-gray-500">
                            {{ lockedMaterialType || '-' }} ·
                            {{ rec.industryGroup || '재생원사' }} ·
                            {{ recommendationProductLabel(rec, index) }}
                          </p>
                          <p class="mt-1 text-sm font-bold text-gray-500">
                            담당자 {{ recommendationManagerLabel(rec, index) }} ·
                            {{ recommendationPhoneLabel(rec, index) }} ·
                            {{ recommendationLocationLabel(rec) }}
                          </p>
                        </div>
                        <div class="flex shrink-0 flex-col items-end gap-3">
                          <button
                            type="button"
                            class="inline-flex h-9 items-center rounded-xl px-4 text-sm font-extrabold tracking-[0.01em] transition-all duration-200 active:scale-[0.98]"
                            :class="
                              selectedBuyer?.id === rec.code || selectedBuyer?.code === rec.code
                                ? 'border border-[#7FA28A] bg-[#F3FAF4] text-[#2F5E38] font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                                : 'border border-[#2E5734] bg-linear-to-b from-[#3E6C47] to-[#2E5734] text-white shadow-[0_8px_18px_-10px_rgba(26,64,41,0.65)] hover:from-[#467650] hover:to-[#335F3D]'
                            "
                            @click.stop="onRecommendationSelect(rec.code)"
                          >
                            {{
                              selectedBuyer?.id === rec.code || selectedBuyer?.code === rec.code
                                ? '✓ 선택됨'
                                : '선택'
                            }}
                          </button>
                        </div>
                      </div>
                    <div
                      v-if="expandedRecommendationCode === rec.code"
                      class="border-t border-[#E5EEEA] bg-[#F8FBFA] px-4 py-3 text-xs"
                    >
                        <div class="pl-[calc(28px+40px+0.75rem)] pr-20">
                          <p
                            class="font-black text-[#0F5C4D]"
                            style="font-weight: 700; margin-top: 5px; margin-bottom: 5px"
                          >
                            AI 추천 이유
                          </p>
                          <div v-if="!visibleRationaleCodes[rec.code]" class="mt-2 space-y-1.5">
                            <div class="h-3 w-[92%] animate-pulse rounded bg-gray-200" />
                            <div class="h-3 w-[86%] animate-pulse rounded bg-gray-200" />
                            <div class="h-3 w-[74%] animate-pulse rounded bg-gray-200" />
                          </div>
                          <p
                            v-else
                            class="mt-2 whitespace-pre-line font-bold leading-5 text-gray-700"
                          >
                            {{ rec.rationale || '추천 근거 데이터가 없습니다.' }}
                          </p>
                        </div>
                      </div>
                      <div
                        v-if="
                          isSocialEnterprise(rec) ||
                          isLocalSmallPartner(rec) ||
                          isNewPartner(rec, index)
                        "
                        class="border-t border-[#D4E4D6] bg-[#EAF2EC] px-4 py-2 text-sm font-semibold text-[#2C5131]"
                      >
                        <div class="flex items-center gap-2 pl-[calc(28px+40px+0.75rem)] pr-4">
                          <Sprout class="h-4 w-4 shrink-0 text-[#2E5734]" :stroke-width="2" />
                          <span>
                            이 거래처와 거래하면 <span class="font-black">ESG 나무 +150점</span> 추가
                            적립
                            <span class="text-xs font-bold text-[#4E6D54]">
                              ({{ recommendationBonusReason(rec, index) }})
                            </span>
                          </span>
                        </div>
                      </div>
                    </article>
                  </div>

                  <div v-else class="mt-4">
                    <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                      Buyer Search
                    </p>
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
                    <p class="mt-2 text-[10px] font-bold text-gray-400">
                      소재 구분 {{ lockedMaterialType || '-' }} 기준 후보
                      {{ filteredBuyers.length }}건
                    </p>
                    <div
                      v-if="isBuyerDropdownOpen"
                      class="mt-2 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl"
                    >
                      <button
                        v-for="buyer in filteredBuyers"
                        :key="buyer.id"
                        type="button"
                        class="flex w-full flex-col items-start border-b border-gray-100 px-3 py-2 text-left transition hover:bg-[#EBF5F5]"
                        @click="selectBuyer(buyer)"
                      >
                        <span class="text-xs font-black text-gray-900">{{
                          buyer.companyName
                        }}</span>
                        <span class="mt-0.5 text-[11px] font-bold text-gray-500"
                          >{{ buyer.code }} · {{ buyer.managerName }} · {{ buyer.phone }}</span
                        >
                        <span class="mt-1 text-[11px] font-bold text-gray-400"
                          >{{ buyer.industryGroup }} ·
                          {{ materialFitLabel(buyer.primaryMaterialFit) }}</span
                        >
                      </button>
                      <div
                        v-if="filteredBuyers.length === 0"
                        class="px-3 py-4 text-center text-xs font-bold text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </div>
                    </div>
                  </div>
                </section>

                <div class="mt-6 border-t border-gray-100 pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    class="h-9 border border-gray-300 bg-white px-4 text-xs font-black text-gray-700 hover:bg-gray-50"
                    @click="moveStep(1)"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    class="h-9 border border-[#004D3C] bg-[#004D3C] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                    :disabled="!canMoveStep3"
                    @click="moveStep(3)"
                  >
                    다음
                  </button>
                </div>
              </div>

              <div
                v-else
                class="mt-0 grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)]"
              >
                <div class="min-w-0">
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-black text-gray-900">판매 조건 입력</p>
                    </div>
                    <div class="flex items-center gap-3">
                      <p class="text-[11px] font-bold text-gray-500">
                        판매 kg 기준 입력이며, 차감 벌 수량은 항상 올림 처리됩니다.
                      </p>
                      <button
                        type="button"
                        class="text-[11px] font-black text-gray-500 hover:text-gray-900"
                        @click="clearDraftPanel"
                      >
                        전체 비우기
                      </button>
                    </div>
                  </div>
                  <div class="max-h-[22rem] overflow-y-auto border border-gray-200">
                    <table class="min-w-[980px] w-full border-collapse text-left text-xs">
                      <thead
                        class="sticky top-0 bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500"
                      >
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
                            <p class="font-mono text-[11px] font-black text-gray-400">
                              {{ item.skuCode || '-' }}
                            </p>
                            <p class="font-black text-gray-900">{{ item.itemName }}</p>
                            <p class="mt-1 text-[11px] font-bold text-gray-500">
                              {{ item.mainCategory }} &gt; {{ item.subCategory }} ·
                              {{ item.color }}/{{ item.size }}
                            </p>
                          </td>
                          <td class="pl-1 pr-2 py-3 align-top text-center font-black text-gray-700">
                            {{ item.materialType || '-' }}
                          </td>
                          <td class="px-3 py-3 align-top text-center font-bold text-gray-500">
                            {{ formatMaterials(item.materials) }}
                          </td>
                          <td class="px-3 py-3 align-top text-center font-black text-gray-900">
                            {{ item.availableQuantity.toLocaleString() }}벌
                          </td>
                          <td class="px-3 py-3 align-top text-center font-black text-gray-900">
                            {{ circularStockStore.formatWeight(item.availableWeightKg) }}
                          </td>
                          <td class="px-3 py-3 align-top text-center">
                            <div class="mx-auto inline-flex items-center gap-1">
                              <input
                                :value="item.requestedWeightKg"
                                type="number"
                                min="0"
                                :max="item.availableWeightKg"
                                step="0.01"
                                class="no-spin h-8 w-16 border border-gray-300 bg-white px-2 text-center text-[11px] font-black text-gray-900 outline-none focus:border-[#004D3C]"
                                @input="
                                  updateDraftItemField(
                                    item.draftId,
                                    'requestedWeightKg',
                                    $event.target.value,
                                  )
                                "
                              />
                              <span class="text-[11px] font-black text-gray-500">kg</span>
                            </div>
                          </td>
                          <td class="px-3 py-3 align-top text-center font-black text-gray-900">
                            {{ item.estimatedQuantity.toFixed(2) }}벌
                          </td>
                          <td class="px-3 py-3 align-top text-center font-black text-amber-700">
                            {{ item.deductedQuantity }}벌
                          </td>
                          <td
                            class="px-3 py-3 align-top text-center font-black"
                            :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'"
                          >
                            {{ formatKg(item.actualWeightKg) }}
                          </td>
                          <td class="px-3 py-3 align-top text-center">
                            <div
                              v-if="!isPriceEditMode(item.draftId)"
                              class="mx-auto inline-flex h-8 min-w-[6.5rem] items-center justify-center gap-0.5 border border-gray-200 bg-gray-50 pl-2 pr-1 text-[11px] font-black text-gray-900"
                            >
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
                              @input="
                                updateDraftItemField(item.draftId, 'unitPrice', $event.target.value)
                              "
                              @blur="closePriceEditMode(item.draftId)"
                              @keydown.enter="closePriceEditMode(item.draftId)"
                            />
                            <p class="mt-1 text-center text-[10px] font-bold text-gray-400">
                              기본 {{ Number(item.defaultKgUnitPrice || 0).toLocaleString() }}
                            </p>
                          </td>
                          <td class="px-3 py-3 align-top text-center font-black text-gray-900">
                            {{ formatCurrency(item.requestedAmount) }}
                          </td>
                          <td
                            class="px-3 py-3 align-top text-center font-black"
                            :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'"
                          >
                            {{ formatCurrency(item.actualAmount) }}
                          </td>
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
                    <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                      판매 메모
                    </p>
                    <textarea
                      :value="circularStockStore.draftMemo"
                      rows="5"
                      maxlength="500"
                      class="mt-2 w-full resize-none border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 outline-none focus:border-[#004D3C]"
                      placeholder="거래 조건, 출고 메모 등을 입력하세요."
                      @input="circularStockStore.setDraftMemo($event.target.value)"
                    />
                  </section>

                  <section class="w-full border border-gray-200 bg-white px-3 py-3">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-500">소재 구분</span
                      ><span class="font-black text-gray-900">{{ lockedMaterialType || '-' }}</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-500">거래처</span
                      ><span class="font-black text-gray-900">{{
                        selectedBuyer?.companyName ?? '-'
                      }}</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-500">담긴 SKU</span
                      ><span class="font-black text-gray-900"
                        >{{ drawerSummary.totalItems }}건</span
                      >
                    </div>
                    <div class="mt-3 flex items-start justify-between gap-3 text-xs">
                      <span class="font-bold text-gray-500">포함 소재</span>
                      <span class="text-right font-black text-gray-900">
                        {{ includedMaterialNames.join(', ') || '-' }}
                      </span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-500">요청 KG</span
                      ><span class="font-black text-gray-900">{{
                        formatKg(drawerSummary.totalRequestedWeightKg)
                      }}</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-500">실제 반영 KG</span
                      ><span class="font-black text-[#0F5C4D]">{{
                        formatKg(drawerSummary.totalActualWeightKg)
                      }}</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-500">예상 금액</span
                      ><span class="font-black text-gray-900">{{
                        formatCurrency(drawerSummary.totalRequestedAmount)
                      }}</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-500">실제 금액</span
                      ><span class="font-black text-[#0F5C4D]">{{
                        formatCurrency(drawerSummary.totalActualAmount)
                      }}</span>
                    </div>
                    <div class="mt-3 flex items-center justify-between text-xs">
                      <span class="font-bold text-gray-500">실차감 수량</span
                      ><span class="font-black text-amber-700"
                        >{{ formatQuantity(drawerSummary.totalDeductedQuantity) }}벌</span
                      >
                    </div>
                  </section>

                  <button
                    type="button"
                    class="h-9 w-full border border-gray-300 bg-white text-xs font-black text-gray-700 hover:bg-gray-50"
                    @click="moveStep(2)"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    class="h-10 w-full text-sm font-black transition"
                    :class="
                      canSubmit
                        ? 'bg-[#004D3C] text-white hover:bg-[#00382c]'
                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
                    "
                    :disabled="!canSubmit"
                    @click="openFinalReviewModal"
                  >
                    최종 판매 등록서 확인
                  </button>
                  <p
                    v-if="submitDisabledReason"
                    class="text-[11px] font-bold leading-5 text-red-600"
                  >
                    {{ submitDisabledReason }}
                  </p>
                </div>
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
          <div
            class="flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-md bg-white shadow-2xl"
          >
            <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Final Review
                </p>
                <h2 class="mt-1 text-lg font-black text-gray-900">최종 판매 등록서 확인</h2>
              </div>
              <button
                type="button"
                class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
                @click="showFinalReviewModal = false"
              >
                닫기
              </button>
            </div>
            <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <section class="border border-gray-200 bg-white">
                <div
                  class="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]"
                >
                  <div>
                    <div class="flex flex-wrap items-start justify-between gap-3 pb-3">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                          거래 요약
                        </p>
                        <p class="mt-1 text-base font-black text-gray-900">
                          {{ selectedBuyer?.companyName ?? '-' }}
                        </p>
                        <p class="mt-1 text-xs font-bold text-gray-500">
                          소재 구분 {{ lockedMaterialType || '-' }} · 담긴 SKU
                          {{ formatQuantity(drawerSummary.totalItems) }}건
                        </p>
                      </div>
                      <div
                        class="rounded-full bg-[#EAF4F0] px-3 py-1 text-[10px] font-black text-[#255F52]"
                      >
                        {{ materialFitLabel(selectedBuyer?.primaryMaterialFit) || '-' }}
                      </div>
                    </div>

                    <div class="mt-2 grid gap-3 pb-4 md:grid-cols-2 xl:grid-cols-4">
                      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                          요청 / 실제 KG
                        </p>
                        <p class="mt-1 text-sm font-black text-gray-900">
                          {{ formatKg(finalReviewSummary.totalRequestedWeightKg) }}
                        </p>
                        <p class="mt-1 text-sm font-black text-[#0F5C4D]">
                          {{ formatKg(finalReviewSummary.totalActualWeightKg) }}
                        </p>
                      </div>
                      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                          환산 / 실차감
                        </p>
                        <p class="mt-1 text-sm font-black text-gray-900">
                          {{ Number(finalReviewSummary.totalEstimatedQuantity).toFixed(2) }}벌
                        </p>
                        <p class="mt-1 text-sm font-black text-amber-700">
                          {{ formatQuantity(finalReviewSummary.totalDeductedQuantity) }}벌
                        </p>
                      </div>
                      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                          예상 / 실제 금액
                        </p>
                        <p class="mt-1 text-sm font-black text-gray-900">
                          {{ formatCurrency(finalReviewSummary.totalRequestedAmount) }}
                        </p>
                        <p class="mt-1 text-sm font-black text-[#0F5C4D]">
                          {{ formatCurrency(finalReviewSummary.totalActualAmount) }}
                        </p>
                      </div>
                      <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                          포함 소재
                        </p>
                        <p class="mt-1 text-sm font-black leading-5 text-gray-900">
                          {{ includedMaterialNames.join(', ') || '-' }}
                        </p>
                      </div>
                    </div>

                    <div
                      v-if="
                        Math.abs(
                          finalReviewSummary.totalActualWeightKg -
                            finalReviewSummary.totalRequestedWeightKg,
                        ) >= 0.01
                      "
                      class="rounded-md border border-[#D7E9E3] bg-[#F3FAF8] px-3 py-3"
                    >
                      <p class="text-xs font-black text-[#0F5C4D]">
                        요청 {{ formatKg(finalReviewSummary.totalRequestedWeightKg) }} → 실재고 차감
                        기준 {{ formatKg(finalReviewSummary.totalActualWeightKg) }} 반영
                      </p>
                    </div>
                  </div>

                  <aside class="border border-gray-200 bg-gray-50 px-4 py-4">
                    <div class="flex items-start justify-between gap-3 pb-3">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                          거래처 정보
                        </p>
                        <div class="mt-1 flex flex-wrap items-center gap-2">
                          <p class="text-sm font-black text-gray-900">
                            {{ selectedBuyer?.companyName ?? '-' }}
                          </p>
                          <p class="font-mono text-[11px] font-black text-gray-500">
                            {{ selectedBuyer?.code ?? '-' }}
                          </p>
                        </div>
                      </div>
                      <span class="text-[11px] font-black text-gray-500">{{
                        selectedBuyer?.industryGroup ?? '-'
                      }}</span>
                    </div>

                    <div class="mt-2 grid grid-cols-2 gap-3">
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                          담당자
                        </p>
                        <p class="mt-1 text-xs font-black text-gray-800">
                          {{ selectedBuyer?.managerName ?? '-' }}
                        </p>
                      </div>
                      <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                          연락처
                        </p>
                        <p class="mt-1 text-xs font-black text-gray-800">
                          {{ selectedBuyer?.phone ?? '-' }}
                        </p>
                      </div>
                    </div>

                    <div class="mt-4 border-t border-gray-200 pt-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                        취급제품 / 생산품
                      </p>
                      <p class="mt-1 text-xs font-bold leading-5 text-gray-700">
                        {{
                          selectedBuyer?.productTypes?.join(', ') ||
                          selectedBuyer?.productNote ||
                          '-'
                        }}
                      </p>
                    </div>

                    <div class="mt-4 border-t border-gray-200 pt-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                        거래처 설명
                      </p>
                      <p class="mt-1 text-xs font-bold leading-5 text-gray-700">
                        {{ selectedBuyer?.description || '설명 없음' }}
                      </p>
                    </div>

                    <div class="mt-4 border-t border-gray-200 pt-3">
                      <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                        판매 메모
                      </p>
                      <p class="mt-1 text-xs font-bold leading-5 text-gray-700">
                        {{ circularStockStore.draftMemo?.trim() || '입력된 메모 없음' }}
                      </p>
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
                        <td class="pl-3 pr-0 py-3 font-mono font-bold text-gray-500">
                          {{ item.skuCode }}
                        </td>
                        <td class="pl-0.5 pr-3 py-3 font-black text-gray-900">
                          {{ item.itemName }}
                        </td>
                        <td class="px-3 py-3 text-left font-black text-gray-900">
                          {{ item.materialType }}
                        </td>
                        <td class="px-3 py-3 font-bold text-gray-700">
                          {{ formatMaterials(item.materials) }}
                        </td>
                        <td class="px-3 py-3 text-left font-black text-gray-600">
                          {{ formatQuantity(item.availableQuantity) }}벌 /
                          {{ formatKg(item.availableWeightKg) }}
                        </td>
                        <td class="px-3 py-3 text-left font-black text-gray-900">
                          {{ formatKg(item.requestedWeightKg) }}
                        </td>
                        <td class="px-3 py-3 text-left font-black text-gray-700">
                          {{ Number(item.estimatedQuantity || 0).toFixed(2) }}벌
                        </td>
                        <td class="px-3 py-3 text-left font-black text-amber-700">
                          {{ formatQuantity(item.deductedQuantity) }}벌
                        </td>
                        <td
                          class="px-3 py-3 text-left font-black"
                          :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'"
                        >
                          {{ formatKg(item.actualWeightKg) }}
                        </td>
                        <td class="px-3 py-3 text-left font-black text-gray-900">
                          {{ formatCurrency(item.unitPrice) }}
                        </td>
                        <td class="px-3 py-3 text-left font-black text-gray-900">
                          {{ formatCurrency(item.requestedAmount) }}
                        </td>
                        <td
                          class="px-3 py-3 text-left font-black"
                          :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'"
                        >
                          {{ formatCurrency(item.actualAmount) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <div
              class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4"
            >
              <button
                type="button"
                class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
                @click="showFinalReviewModal = false"
              >
                검토 종료
              </button>
              <button
                type="button"
                class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
                @click="returnToDrawerEdit"
              >
                패널로 돌아가 수정
              </button>
              <button
                type="button"
                class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#00382c]"
                @click="submitSale"
              >
                이 내용으로 최종 등록
              </button>
            </div>
          </div>
        </div>
      </div>

      <p
        v-if="toastMessage"
        class="fixed right-4 top-16 z-30 border px-4 py-2 text-sm font-black shadow-lg"
        :class="
          toastTone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-red-200 bg-red-50 text-red-700'
        "
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

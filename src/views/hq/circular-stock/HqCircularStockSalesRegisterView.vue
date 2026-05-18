<script setup>
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import SalesRegisterStepper from '@/components/hq/circular-stock/sales-register/SalesRegisterStepper.vue'
import SalesRegisterStep1SkuTable from '@/components/hq/circular-stock/sales-register/SalesRegisterStep1SkuTable.vue'
import SalesRegisterStep2BuyerSection from '@/components/hq/circular-stock/sales-register/SalesRegisterStep2BuyerSection.vue'
import SalesRegisterStep3ConditionsSection from '@/components/hq/circular-stock/sales-register/SalesRegisterStep3ConditionsSection.vue'
import SalesRegisterStepFooter from '@/components/hq/circular-stock/sales-register/SalesRegisterStepFooter.vue'
import SalesRegisterFinalReviewModal from '@/components/hq/circular-stock/sales-register/SalesRegisterFinalReviewModal.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCircularStockBuyerStore } from '@/stores/hq/circularStock/circularStockBuyers.js'
import { useCircularStockStore } from '@/stores/hq/circularStock/circularStock.js'

const router = useRouter()
const auth = useAuthStore()
const buyerStore = useCircularStockBuyerStore()
const circularStockStore = useCircularStockStore()

const hqMenus = roleMenus.hq
const circularStockMenus =
  roleMenus.hq.find((menu) => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 판매 등록')

const buyerSearchTerm = ref('')
const showFinalReviewModal = ref(false)
const expandedStep3Groups = ref({})
const groupRequestedKg = ref({})
const groupRequestedInputText = ref({})
const manualAdjustedKgBySku = ref({})
const autoAllocatedKgBySku = ref({})
const step3SkuInputText = ref({})
const toastMessage = ref('')
const toastTone = ref('success')
const inventoryLoadError = ref('')
let toastTimer = null

// ADR-021 AI 거래처 추천 — Step 2 좌측 영역 모드 토글. 'ai' | 'manual'.
const buyerPanelMode = ref('ai')
const expandedRecommendationCode = ref('')
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
const submitValidation = computed(() => circularStockStore.validateCircularStockSaleDraft())
const lockedMaterialType = computed(() => {
  const raw = unref(circularStockStore.lockedMaterialType)
  return typeof raw === 'string' ? raw : ''
})
const selectedWarehouseCode = computed(() => String(circularStockStore.selectedWarehouseCode || ''))
const selectedWarehouseName = computed(() => String(circularStockStore.selectedWarehouseName || ''))
const outboundWarehouseLabel = computed(
  () => selectedWarehouseName.value || selectedWarehouseCode.value || '-',
)
const outboundWarehouseRegionLabel = computed(() => {
  const label = outboundWarehouseLabel.value
  if (!label || label === '-') return '-'
  const normalized = String(label).trim().replace(/\s+/g, ' ')
  const [first, second] = normalized.split(' ')
  if (!first) return '-'
  // 예: "서울 종로 물류창고" -> "서울 종로", "익산 1창고" -> "익산"
  if (second && /(시|군|구)$/.test(second)) return `${first} ${second}`
  return first
})

const canMoveStep2 = computed(
  () =>
    draftItems.value.length > 0 &&
    Boolean(lockedMaterialType.value) &&
    Boolean(selectedWarehouseCode.value),
)
const canMoveStep3 = computed(() => canMoveStep2.value && Boolean(selectedBuyer.value))
const canSubmit = computed(() => submitValidation.value.success)
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
const submitDisabledReason = computed(
  () => (canSubmit.value ? '' : submitValidation.value.primaryMessage || submitValidation.value.message || ''),
)
const topRecommendations = computed(() => circularStockStore.recommendations.slice(0, 5))
const recommendationKey = computed(() =>
  draftItems.value
    .map((item) => `${item.draftId}:${item.skuCode}:${Number(item.requestedWeightKg || 0)}`)
    .sort()
    .join('|'),
)

async function ensureRecommendationsUpToDate() {
  if (circularStockStore.isRecommendationLoading) return
  const shouldRefetch =
    circularStockStore.recommendationDirty ||
    circularStockStore.recommendations.length === 0 ||
    circularStockStore.recommendationBasisKey !== circularStockStore.lastRecommendationBasisKey
  if (shouldRefetch) {
    await circularStockStore.fetchRecommendations()
  }
}

function toggleStep3Group(groupKey) {
  expandedStep3Groups.value = {
    ...expandedStep3Groups.value,
    [groupKey]: !expandedStep3Groups.value[groupKey],
  }
}

function isStep3GroupExpanded(groupKey) {
  return expandedStep3Groups.value[groupKey] !== false
}

function normalizeMaterialDetailCompositions(materials = []) {
  return (Array.isArray(materials) ? materials : [])
    .map((material) => ({
      name: String(material?.name || '').trim(),
      ratio: Number(material?.ratio || 0),
    }))
    .filter((material) => material.name && material.ratio > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

function buildMaterialDetailKey(materials = []) {
  const normalized = normalizeMaterialDetailCompositions(materials)
  if (normalized.length === 0) return '기타'
  return normalized.map((material) => `${material.name}:${material.ratio}`).join('|')
}

function buildMaterialDetailLabel(materials = []) {
  const normalized = normalizeMaterialDetailCompositions(materials)
  if (normalized.length === 0) return '기타'
  return normalized
    .map((material) => `${material.name} ${material.ratio}%`)
    .join(normalized.length >= 2 ? ' + ' : ' · ')
}

const step3GroupCards = computed(() => {
  const groups = new Map()
  for (const item of draftItems.value) {
    const key = buildMaterialDetailKey(item.materials)
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        materialType: String(item.materialType || '기타'),
        materialDetailLabel: buildMaterialDetailLabel(item.materials),
        items: [],
        requestedKg: Number(groupRequestedKg.value[key] || 0),
      })
    }
    groups.get(key).items.push(item)
  }
  return Array.from(groups.values()).map((group) => {
    const totalAvailableQty = group.items.reduce((sum, item) => sum + (Number(item.availableQuantity) || 0), 0)
    const totalAvailableKg = group.items.reduce((sum, item) => sum + (Number(item.availableWeightKg) || 0), 0)
    const totalActualQty = group.items.reduce((sum, item) => sum + (Number(item.deductedQuantity) || 0), 0)
    const totalActualKg = group.items.reduce((sum, item) => sum + (Number(item.actualWeightKg) || 0), 0)
    const totalActualAmount = group.items.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0)
    const completedCount = group.items.filter((item) => Number(item.requestedWeightKg) > 0).length
    const unfilledSkuCount = group.items.filter((item) => Number(item.requestedWeightKg) <= 0).length
    const errorSkuCount = group.items.filter((item) => {
      const requested = Number(item.requestedWeightKg) || 0
      const actual = Number(item.actualWeightKg) || 0
      const qty = Number(item.deductedQuantity) || 0
      const availableKg = Number(item.availableWeightKg) || 0
      const availableQty = Number(item.availableQuantity) || 0
      if (requested <= 0) return false
      if (!Number.isFinite(requested) || !Number.isFinite(actual) || !Number.isFinite(qty)) return true
      if (actual > availableKg + 0.0001) return true
      if (qty > availableQty) return true
      return false
    }).length
    const isCompleted = group.items.length > 0 && group.items.every((item) => Number(item.requestedWeightKg) > 0)
    const hasError = errorSkuCount > 0
    const status = hasError ? 'error' : isCompleted ? 'completed' : 'idle'

    return {
      ...group,
      totalAvailableQty,
      totalAvailableKg,
      totalActualQty,
      totalActualKg,
      totalActualAmount,
      completedCount,
      unfilledSkuCount,
      errorSkuCount,
      isCompleted,
      hasError,
      status,
      hasOverLimit: totalActualKg > totalAvailableKg + 0.0001,
    }
  })
})

const step3Summary = computed(() => {
  const totalSku = draftItems.value.length
  const inputCompletedCount = draftItems.value.filter((item) => Number(item.requestedWeightKg) > 0).length
  const totalActualQty = draftItems.value.reduce((sum, item) => sum + (Number(item.deductedQuantity) || 0), 0)
  const totalActualKg = draftItems.value.reduce((sum, item) => sum + (Number(item.actualWeightKg) || 0), 0)
  const totalActualAmount = draftItems.value.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0)
  return { totalSku, inputCompletedCount, totalActualQty, totalActualKg, totalActualAmount }
})

const step3ValidationCounts = computed(() => {
  const counts = submitValidation.value?.counts || {}
  return {
    unfilledSkuCount: Number(counts.unfilledSkuCount || 0),
    errorSkuCount: Number(counts.errorSkuCount || 0),
    overLimitSkuCount: Number(counts.overLimitSkuCount || 0),
  }
})
const step3UnfilledSkuCount = computed(() => step3ValidationCounts.value.unfilledSkuCount)
const step3ErrorSkuCount = computed(() => step3ValidationCounts.value.errorSkuCount)
const step3CanRegisterNow = computed(() => submitValidation.value.success)
const step3FooterWarning = computed(() => {
  if (step3CanRegisterNow.value) return '등록 가능'
  return submitValidation.value.primaryMessage || submitDisabledReason.value || '입력값을 확인해 주세요.'
})

watch(
  step3GroupCards,
  (groups) => {
    const next = {}
    for (const group of groups) {
      next[group.key] = expandedStep3Groups.value[group.key] ?? true
    }
    expandedStep3Groups.value = next
  },
  { immediate: true },
)

function distributeGroupRequestedKg(groupKey, requestedValue, options = {}) {
  const preserveDraftId = options?.preserveDraftId ?? null
  const preserveDraftText = options?.preserveDraftText ?? null
  const group = step3GroupCards.value.find((entry) => entry.key === groupKey)
  if (!group) return

  const maxGroupKg = Math.max(0, Number(group.totalAvailableKg) || 0)
  const normalizedRaw = String(requestedValue ?? '').replace(/[^0-9.]/g, '')
  const firstDotIndex = normalizedRaw.indexOf('.')
  const merged = firstDotIndex === -1
    ? normalizedRaw
    : `${normalizedRaw.slice(0, firstDotIndex + 1)}${normalizedRaw.slice(firstDotIndex + 1).replace(/\./g, '')}`
  const [wholePartRaw = '', decimalRaw = ''] = merged.split('.')
  const wholePart = wholePartRaw.replace(/^0+(?=\d)/, '') || '0'
  const decimalPart = decimalRaw.slice(0, 2)
  const hasDot = merged.includes('.')
  const candidateText = hasDot ? `${wholePart}.${decimalPart}` : wholePart
  const rawNumeric = Number(candidateText)
  let requestedKg = Number.isFinite(rawNumeric) ? rawNumeric : 0
  requestedKg = Math.min(Math.max(0, requestedKg), maxGroupKg)
  const isOverMax = Number.isFinite(rawNumeric) && rawNumeric > maxGroupKg
  groupRequestedInputText.value = {
    ...groupRequestedInputText.value,
    [groupKey]: isOverMax
      ? Number(maxGroupKg).toFixed(2)
      : (hasDot
        ? `${Number(requestedKg).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}${merged.endsWith('.') ? '.' : ''}`
        : String(Math.trunc(requestedKg))),
  }
  groupRequestedKg.value = { ...groupRequestedKg.value, [groupKey]: requestedKg }
  circularStockStore.step3GroupRequestedKg = { ...groupRequestedKg.value }

  const totalAvailable = group.items.reduce((sum, item) => sum + (Number(item.availableWeightKg) || 0), 0)
  let remain = Math.min(requestedKg, totalAvailable)

  const nextAuto = { ...autoAllocatedKgBySku.value }
  const nextManual = { ...manualAdjustedKgBySku.value }
  const nextInputText = { ...step3SkuInputText.value }

  for (const item of group.items) {
    const manual = nextManual[item.draftId]
    if (Number.isFinite(manual)) {
      const clamped = Math.min(Math.max(Number(manual) || 0, 0), Number(item.availableWeightKg) || 0)
      remain = Math.max(0, remain - clamped)
      if (item.draftId !== preserveDraftId) {
        nextInputText[item.draftId] = Number(clamped).toFixed(2)
      }
      updateDraftItemField(item.draftId, 'requestedWeightKg', clamped)
    }
  }

  const autoTargets = group.items.filter((item) => !Number.isFinite(nextManual[item.draftId]))
  const autoTotalAvailable = autoTargets.reduce((sum, item) => sum + (Number(item.availableWeightKg) || 0), 0)

  for (const item of autoTargets) {
    const available = Number(item.availableWeightKg) || 0
    let allocated = 0
    if (autoTotalAvailable > 0 && remain > 0) {
      allocated = (available / autoTotalAvailable) * remain
    }
    const clamped = Math.min(Math.max(allocated, 0), available)
    nextAuto[item.draftId] = clamped
    if (item.draftId !== preserveDraftId) {
      nextInputText[item.draftId] = Number(clamped).toFixed(2)
    }
    updateDraftItemField(item.draftId, 'requestedWeightKg', clamped)
  }

  if (preserveDraftId && preserveDraftText !== null) {
    nextInputText[preserveDraftId] = preserveDraftText
  }
  autoAllocatedKgBySku.value = nextAuto
  step3SkuInputText.value = nextInputText
}

function onGroupRequestedKgBlur(groupKey) {
  const current = Number(groupRequestedKg.value[groupKey] || 0)
  const group = step3GroupCards.value.find((entry) => entry.key === groupKey)
  const maxGroupKg = Math.max(0, Number(group?.totalAvailableKg) || 0)
  const clamped = Math.min(Math.max(current, 0), maxGroupKg)
  groupRequestedKg.value = { ...groupRequestedKg.value, [groupKey]: clamped }
  circularStockStore.step3GroupRequestedKg = { ...groupRequestedKg.value }
  groupRequestedInputText.value = {
    ...groupRequestedInputText.value,
    [groupKey]: Number(clamped).toFixed(2),
  }
}

function onStep3SkuKgInput(groupKey, draftId, rawValue) {
  const item = draftItems.value.find((entry) => entry.draftId === draftId)
  const maxKg = Math.max(0, Number(item?.availableWeightKg) || 0)
  const normalizedRaw = String(rawValue ?? '').replace(/[^0-9.]/g, '')
  if (normalizedRaw === '') {
    step3SkuInputText.value = {
      ...step3SkuInputText.value,
      [draftId]: '',
    }
    manualAdjustedKgBySku.value = {
      ...manualAdjustedKgBySku.value,
      [draftId]: 0,
    }
    updateDraftItemField(draftId, 'requestedWeightKg', 0)
    return
  }
  const firstDotIndex = normalizedRaw.indexOf('.')
  const merged = firstDotIndex === -1
    ? normalizedRaw
    : `${normalizedRaw.slice(0, firstDotIndex + 1)}${normalizedRaw.slice(firstDotIndex + 1).replace(/\./g, '')}`
  if (merged === '.') {
    step3SkuInputText.value = {
      ...step3SkuInputText.value,
      [draftId]: '0.',
    }
    manualAdjustedKgBySku.value = {
      ...manualAdjustedKgBySku.value,
      [draftId]: 0,
    }
    updateDraftItemField(draftId, 'requestedWeightKg', 0)
    return
  }
  const [wholePartRaw = '', decimalRaw = ''] = merged.split('.')
  const wholePart = wholePartRaw.replace(/^0+(?=\d)/, '') || '0'
  const decimalPart = decimalRaw.slice(0, 2)
  const hasDot = merged.includes('.')
  const candidateText = hasDot ? `${wholePart}.${decimalPart}` : wholePart
  const rawNumeric = Number(candidateText)
  let numeric = rawNumeric
  if (!Number.isFinite(numeric)) numeric = 0
  numeric = Math.min(Math.max(numeric, 0), maxKg)
  const isOverMax = Number.isFinite(rawNumeric) && rawNumeric > maxKg
  const clampedText = isOverMax
    ? Number(maxKg).toFixed(2)
    : (hasDot
      ? `${Number(numeric).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}${merged.endsWith('.') ? '.' : ''}`
      : String(Math.trunc(numeric)))

  step3SkuInputText.value = {
    ...step3SkuInputText.value,
    [draftId]: clampedText,
  }
  manualAdjustedKgBySku.value = {
    ...manualAdjustedKgBySku.value,
    [draftId]: numeric,
  }
  updateDraftItemField(draftId, 'requestedWeightKg', numeric)

  const currentGroupRequested = Number(groupRequestedKg.value[groupKey] || 0)
  if (currentGroupRequested > 0) {
    distributeGroupRequestedKg(groupKey, currentGroupRequested, {
      preserveDraftId: draftId,
      preserveDraftText: clampedText,
    })
  }
}

function onStep3SkuKgBlur(draftId) {
  const item = draftItems.value.find((entry) => entry.draftId === draftId)
  if (!item) return
  const value = Math.min(Math.max(Number(item.requestedWeightKg) || 0, 0), Number(item.availableWeightKg) || 0)
  updateDraftItemField(draftId, 'requestedWeightKg', value)
  step3SkuInputText.value = {
    ...step3SkuInputText.value,
    [draftId]: Number(value).toFixed(2),
  }
}

function resetStep3SkuToAuto(groupKey, draftId) {
  const nextManual = { ...manualAdjustedKgBySku.value }
  delete nextManual[draftId]
  manualAdjustedKgBySku.value = nextManual
  distributeGroupRequestedKg(groupKey, Number(groupRequestedKg.value[groupKey] || 0))
}

function isManualAdjusted(draftId) {
  return Number.isFinite(manualAdjustedKgBySku.value[draftId])
}

function syncStep3ZeroWhenNoGroupRequest() {
  const nextAuto = { ...autoAllocatedKgBySku.value }
  const nextManual = { ...manualAdjustedKgBySku.value }
  const nextInputText = { ...step3SkuInputText.value }

  for (const group of step3GroupCards.value) {
    const requested = Number(groupRequestedKg.value[group.key] || 0)
    if (requested > 0) continue
    for (const item of group.items) {
      delete nextAuto[item.draftId]
      delete nextManual[item.draftId]
      nextInputText[item.draftId] = '0'
      updateDraftItemField(item.draftId, 'requestedWeightKg', 0)
    }
  }

  autoAllocatedKgBySku.value = nextAuto
  manualAdjustedKgBySku.value = nextManual
  step3SkuInputText.value = nextInputText
}

function roundedUpQuantityLabel(item) {
  const estimated = Number(item?.estimatedQuantity || 0)
  const deducted = Number(item?.deductedQuantity || 0)
  if (!Number.isFinite(estimated) || !Number.isFinite(deducted)) return ''
  const diff = deducted - estimated
  if (diff <= 0.0001) return ''
  return `${estimated.toFixed(2)}벌 → 올림`
}

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
  if (step === 3) {
    syncStep3ZeroWhenNoGroupRequest()
  }
  // ADR-021 — Step 2 진입 시 AI 추천 호출
  if (step === 2) {
    ensureRecommendationsUpToDate()
  }
}

async function onRecommendationSelect(code) {
  const rec = circularStockStore.recommendations.find((r) => r.code === code)
  if (!rec) return
  if (selectedBuyer.value?.id === code || selectedBuyer.value?.code === code) {
    circularStockStore.selectBuyer('')
    return
  }
  const hydrated = await buyerStore.ensureBuyerByCode(code)
  if (!hydrated) {
    showToast('추천 거래처 상세 정보를 불러오지 못해 선택할 수 없습니다.', 'error')
    return
  }
  circularStockStore.selectBuyer(code)
  buyerSearchTerm.value = ''
}

function toggleRecommendationDetail(code) {
  expandedRecommendationCode.value = expandedRecommendationCode.value === code ? '' : code
  if (!visibleRationaleCodes.value[code]) {
    visibleRationaleCodes.value = {
      ...visibleRationaleCodes.value,
      [code]: true,
    }
  }
}

function clearRationaleTimers() {
  for (const timer of rationaleTimers) clearTimeout(timer)
  rationaleTimers = []
}

function startRationaleProgressiveReveal() {
  clearRationaleTimers()
  const list = topRecommendations.value
  list.forEach((rec, index) => {
    if (visibleRationaleCodes.value[rec.code]) return
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

function revealAllVisibleRationales() {
  if (topRecommendations.value.length === 0) return
  const next = { ...visibleRationaleCodes.value }
  for (const rec of topRecommendations.value) next[rec.code] = true
  visibleRationaleCodes.value = next
}

function recommendationBonusReason(rec, index) {
  if (isSocialEnterprise(rec)) return '사회적기업 거래 보너스'
  if (isLocalSmallPartner(rec)) return '소규모 기업 거래 보너스'
  if (isNewPartner(rec, index)) return '신규 거래처 보너스'
  return ''
}

function recommendationProductLabel(rec) {
  const products = Array.isArray(rec?.factoryProduct)
    ? rec.factoryProduct
    : Array.isArray(rec?.productTypes)
      ? rec.productTypes
      : []
  if (products.length > 0) {
    return products.join(', ')
  }
  return String(rec?.productNote || '').trim() || '-'
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

function isNewPartner(rec) {
  const historyCount = Number(rec?.tradeHistoryCount ?? rec?.transactionCount ?? rec?.tradeCount)
  if (Number.isFinite(historyCount)) return historyCount <= 0
  return false
}

function recommendationLocationLabel(rec) {
  const address = String(rec?.address || '').trim()
  if (!address) return '-'
  const parts = address.split(/\s+/).filter(Boolean)
  return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0]
}

function recommendationManagerLabel(rec) {
  return String(rec?.managerName || '').trim() || '-'
}

function recommendationPhoneLabel(rec) {
  return String(rec?.phone || '').trim() || '-'
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

function step3BuyerBadgeClass() {
  const selectedCode = String(selectedBuyer.value?.code || selectedBuyer.value?.id || '')
  if (!selectedCode) return 'bg-gray-100 text-gray-500'
  const aiIndex = topRecommendations.value.findIndex(
    (rec) => String(rec?.code || rec?.id || '') === selectedCode,
  )
  if (aiIndex >= 0) return companyBadgeClass(aiIndex)
  return 'bg-gray-100 text-gray-500'
}

function goToSkuList() {
  router.push({ name: 'hq-circular-inventory-sales-register', query: { fromWorkflow: '1' } })
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
  const nextManual = { ...manualAdjustedKgBySku.value }
  const nextAuto = { ...autoAllocatedKgBySku.value }
  delete nextManual[draftId]
  delete nextAuto[draftId]
  manualAdjustedKgBySku.value = nextManual
  autoAllocatedKgBySku.value = nextAuto
  if (draftItems.value.length === 0) {
    groupRequestedKg.value = {}
    groupRequestedInputText.value = {}
    circularStockStore.step3GroupRequestedKg = {}
    manualAdjustedKgBySku.value = {}
    autoAllocatedKgBySku.value = {}
  }
}

function selectBuyer(buyer) {
  circularStockStore.selectBuyer(buyer.id)
  buyerSearchTerm.value = ''
}

function clearDraftPanel() {
  circularStockStore.clearDraft()
  buyerSearchTerm.value = ''
  groupRequestedKg.value = {}
  groupRequestedInputText.value = {}
  circularStockStore.step3GroupRequestedKg = {}
  manualAdjustedKgBySku.value = {}
  autoAllocatedKgBySku.value = {}
  saleStep.value = 1
}

function openFinalReviewModal() {
  if (!submitValidation.value.success) {
    showToast(submitValidation.value.primaryMessage || submitValidation.value.message, 'error')
    return
  }
  showFinalReviewModal.value = true
}

function returnToDrawerEdit() {
  showFinalReviewModal.value = false
}

function submitSale() {
  const result = circularStockStore.submitCircularStockSale(auth.user?.name ?? '본사 관리자')
  toastMessage.value = result.success
    ? `${result.sale.saleId} 판매 등록을 완료했습니다.`
    : result.message
  toastTone.value = result.success ? 'success' : 'error'

  if (result.success) {
    buyerSearchTerm.value = ''
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

function materialFitLabel(value) {
  return buyerStore.materialFitLabel(value)
}

async function loadCircularInventoryRows() {
  inventoryLoadError.value = ''
  try {
    await circularStockStore.loadCircularInventoryRows({ page: 0, size: 100, sort: 'skuCode,asc' })
  } catch (e) {
    inventoryLoadError.value = e.message || '순환 재고 불러오기에 실패했습니다.'
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
  () => `${recommendationKey.value}::${topRecommendations.value.map((rec) => rec.code).join('|')}`,
  (next, prev) => {
    if (next !== prev) {
      visibleRationaleCodes.value = {}
    }
    if (buyerPanelMode.value === 'ai' && topRecommendations.value.length > 0) {
      startRationaleProgressiveReveal()
    }
  },
)

// 탭 전환만으로는 이미 표시된 AI 추천 이유를 다시 스켈레톤으로 되돌리지 않는다.

onMounted(() => {
  groupRequestedKg.value = { ...(circularStockStore.step3GroupRequestedKg || {}) }
  groupRequestedInputText.value = Object.fromEntries(
    Object.entries(groupRequestedKg.value).map(([key, value]) => [key, Number(value || 0).toFixed(2)]),
  )
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  loadCircularInventoryRows()
  circularStockStore.markWorkflowStarted()
  if (saleStep.value >= 2) {
    ensureRecommendationsUpToDate()
    revealAllVisibleRationales()
  }
})

onBeforeUnmount(() => {
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
        <div class="flex flex-wrap items-start justify-between gap-6">
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
              class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-5"
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

            <div class="flex-1 overflow-y-auto p-7">
              <SalesRegisterStepper
                :sale-step="saleStep"
                @move-step="moveStep"
              />

              <SalesRegisterStep1SkuTable
                v-if="saleStep === 1"
                :draft-items="draftItems"
                :outbound-warehouse-label="outboundWarehouseLabel"
                @remove-item="removeDraftItem"
                @clear-all="clearDraftPanel"
              />

              <SalesRegisterStep2BuyerSection
                v-else-if="saleStep === 2"
                :buyer-panel-mode="buyerPanelMode"
                :buyer-search-term="buyerSearchTerm"
                :outbound-warehouse-label="outboundWarehouseLabel"
                :locked-material-type="lockedMaterialType"
                :selected-buyer="selectedBuyer"
                :filtered-buyers="filteredBuyers"
                :top-recommendations="topRecommendations"
                :is-recommendation-loading="circularStockStore.isRecommendationLoading"
                :recommendation-error="circularStockStore.recommendationError"
                :recommendation-total-count="circularStockStore.recommendations.length"
                :expanded-recommendation-code="expandedRecommendationCode"
                :visible-rationale-codes="visibleRationaleCodes"
                :material-fit-label="materialFitLabel"
                :recommendation-product-label="recommendationProductLabel"
                :recommendation-manager-label="recommendationManagerLabel"
                :recommendation-phone-label="recommendationPhoneLabel"
                :recommendation-location-label="recommendationLocationLabel"
                :company-badge-text="companyBadgeText"
                :company-badge-class="companyBadgeClass"
                :is-social-enterprise="isSocialEnterprise"
                :is-local-small-partner="isLocalSmallPartner"
                :is-new-partner="isNewPartner"
                :recommendation-bonus-reason="recommendationBonusReason"
                @update:buyer-panel-mode="buyerPanelMode = $event"
                @update:buyer-search-term="buyerSearchTerm = $event"
                @toggle-recommendation-detail="toggleRecommendationDetail"
                @select-recommendation="onRecommendationSelect"
                @select-buyer="selectBuyer"
              />

              <SalesRegisterStep3ConditionsSection
                v-else
                :step3-group-cards="step3GroupCards"
                :group-requested-kg="groupRequestedKg"
                :group-requested-input-text="groupRequestedInputText"
                :step3-sku-input-text="step3SkuInputText"
                :step3-summary="step3Summary"
                :included-material-names="includedMaterialNames"
                :selected-buyer="selectedBuyer"
                :locked-material-type="lockedMaterialType"
                :outbound-warehouse-label="outboundWarehouseLabel"
                :outbound-warehouse-region-label="outboundWarehouseRegionLabel"
                :draft-memo="circularStockStore.draftMemo"
                :is-step3-group-expanded="isStep3GroupExpanded"
                :is-manual-adjusted="isManualAdjusted"
                :step3-buyer-badge-class="step3BuyerBadgeClass"
                :company-badge-text="companyBadgeText"
                :format-kg="formatKg"
                :format-currency="formatCurrency"
                :rounded-up-quantity-label="roundedUpQuantityLabel"
                @group-requested-input="distributeGroupRequestedKg"
                @group-requested-blur="onGroupRequestedKgBlur"
                @toggle-group="toggleStep3Group"
                @sku-kg-input="onStep3SkuKgInput"
                @sku-kg-blur="onStep3SkuKgBlur"
                @reset-sku-auto="resetStep3SkuToAuto"
                @update-draft-memo="circularStockStore.setDraftMemo"
              />
            </div>
            <SalesRegisterStepFooter
              :sale-step="saleStep"
              :can-move-step2="canMoveStep2"
              :can-move-step3="canMoveStep3"
              :selected-buyer="selectedBuyer"
              :step3-footer-warning="step3FooterWarning"
              :step3-can-register-now="step3CanRegisterNow"
              :step3-unfilled-sku-count="step3UnfilledSkuCount"
              :step3-error-sku-count="step3ErrorSkuCount"
              :material-fit-label="materialFitLabel"
              @move-step="moveStep"
              @open-final-review="openFinalReviewModal"
            />
          </div>
        </div>
      </div>

      <SalesRegisterFinalReviewModal
        :open="showFinalReviewModal"
        :selected-buyer="selectedBuyer"
        :locked-material-type="lockedMaterialType"
        :outbound-warehouse-label="outboundWarehouseLabel"
        :outbound-warehouse-region-label="outboundWarehouseRegionLabel"
        :drawer-summary="drawerSummary"
        :final-review-summary="finalReviewSummary"
        :included-material-names="includedMaterialNames"
        :draft-items="draftItems"
        :draft-memo="circularStockStore.draftMemo"
        :format-materials="formatMaterials"
        :format-kg="formatKg"
        :format-currency="formatCurrency"
        :format-quantity="formatQuantity"
        :has-weight-adjustment="hasWeightAdjustment"
        :material-fit-label="materialFitLabel"
        @close="showFinalReviewModal = false"
        @return-edit="returnToDrawerEdit"
        @submit="submitSale"
      />

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

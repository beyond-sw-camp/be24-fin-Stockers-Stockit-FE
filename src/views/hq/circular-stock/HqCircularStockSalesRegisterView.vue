<script setup>
import { computed, onBeforeUnmount, onMounted, ref, unref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowDown, ChevronDown, ChevronUp, BadgeCheck, Bot, Info, Loader2, Package, Ruler, Shirt, Sprout, Tag } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import SalesRegisterStepper from '@/components/hq/circular-stock/sales-register/SalesRegisterStepper.vue'
import SalesRegisterStep1SkuTable from '@/components/hq/circular-stock/sales-register/SalesRegisterStep1SkuTable.vue'
import SalesRegisterStepFooter from '@/components/hq/circular-stock/sales-register/SalesRegisterStepFooter.vue'
import SalesRegisterFinalReviewModal from '@/components/hq/circular-stock/sales-register/SalesRegisterFinalReviewModal.vue'
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
const buyerDropdownRef = ref(null)
const isDrawerOpen = ref(false)
const showFinalReviewModal = ref(false)
const priceEditModes = ref({})
const expandedStep3Rows = ref({})
const expandedStep3Groups = ref({})
const groupRequestedKg = ref({})
const groupRequestedInputText = ref({})
const manualAdjustedKgBySku = ref({})
const autoAllocatedKgBySku = ref({})
const step3SkuInputText = ref({})
const toastMessage = ref('')
const toastTone = ref('success')
const inventoryLoadError = ref('')
const isInventoryLoading = ref(false)
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

function toggleStep3Detail(draftId) {
  expandedStep3Rows.value = {
    ...expandedStep3Rows.value,
    [draftId]: !expandedStep3Rows.value[draftId],
  }
}

function isStep3DetailOpen(draftId) {
  return Boolean(expandedStep3Rows.value[draftId])
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

const step3HasOverLimit = computed(() => step3GroupCards.value.some((group) => group.hasOverLimit))
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
  if (step === 3) {
    syncStep3ZeroWhenNoGroupRequest()
  }
  // ADR-021 — Step 2 진입 시 AI 추천 호출
  if (step === 2) {
    ensureRecommendationsUpToDate()
  }
}

function onRecommendationSelect(code) {
  const rec = circularStockStore.recommendations.find((r) => r.code === code)
  if (!rec) return
  if (selectedBuyer.value?.id === code || selectedBuyer.value?.code === code) {
    circularStockStore.selectBuyer('')
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
  const nextManual = { ...manualAdjustedKgBySku.value }
  const nextAuto = { ...autoAllocatedKgBySku.value }
  delete nextManual[draftId]
  delete nextAuto[draftId]
  manualAdjustedKgBySku.value = nextManual
  autoAllocatedKgBySku.value = nextAuto
  if (draftItems.value.length === 0) {
    isDrawerOpen.value = false
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
  priceEditModes.value = {}
  buyerSearchTerm.value = ''
  groupRequestedKg.value = {}
  groupRequestedInputText.value = {}
  circularStockStore.step3GroupRequestedKg = {}
  manualAdjustedKgBySku.value = {}
  autoAllocatedKgBySku.value = {}
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
    showToast(submitValidation.value.primaryMessage || submitValidation.value.message, 'error')
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
  document.addEventListener('mousedown', handleDocumentClick)
  loadCircularInventoryRows()
  circularStockStore.markWorkflowStarted()
  isDrawerOpen.value = true
  if (saleStep.value >= 2) {
    ensureRecommendationsUpToDate()
    revealAllVisibleRationales()
  }
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

              <template v-else-if="saleStep === 2">
              <div class="mt-0">
                <section ref="buyerDropdownRef">
                  <!-- 모드 토글 — AI 추천 (default) / 수동 검색 -->
                  <div class="border-b border-gray-200">
                    <div class="flex items-end gap-0">
                      <button
                        type="button"
                        class="inline-flex h-11 items-center gap-2 border-b-2 px-8 text-sm font-black transition"
                        :class="
                          buyerPanelMode === 'ai'
                            ? 'border-[#2D5B35] text-[#1F2937]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        "
                        @click="buyerPanelMode = 'ai'"
                      >
                        <Bot class="h-3.5 w-3.5 text-[#7A5A2D]" :stroke-width="2.2" />
                        <span class="text-sm font-black leading-none">AI 추천</span>
                        <span
                          v-if="!circularStockStore.isRecommendationLoading"
                          class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D4E8D2] px-1.5 text-[11px] font-black text-[#2D5B35]"
                        >
                          {{ circularStockStore.recommendations.length }}
                        </span>
                      </button>

                      <button
                        type="button"
                        class="inline-flex h-11 items-center gap-2 border-b-2 px-8 text-sm font-black leading-none transition"
                        :class="
                          buyerPanelMode === 'manual'
                            ? 'border-[#2D5B35] text-[#1F2937]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        "
                        @click="buyerPanelMode = 'manual'"
                      >
                        <span>수동 선택</span>
                        <span class="text-[11px] font-bold text-gray-500">전체</span>
                      </button>
                    </div>
                  </div>
                  <div class="h-4" />
                  <div
                    v-if="buyerPanelMode === 'ai'"
                    class="flex items-start gap-2 rounded-lg border border-[#F1E7CF] bg-[#FFFBF3] px-4 py-2 text-xs font-bold text-[#7D6432]"
                  >
                    <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B38A3A]" :stroke-width="2" />
                    <span>
                      출고 창고 {{ outboundWarehouseLabel }} 기준,
                      선택된 소재 정보를 기반으로 DB에서 가장 적합한 거래처 5곳을 AI가 분석했습니다.
                      각 거래처를 클릭해 AI 거래처 매칭 추천 상세 이유를 확인하세요
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
                            <span class="pt-[1px] text-xs font-bold leading-none text-gray-400">{{
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
                                ? 'border border-[#7FA28A] bg-[#F3FAF4] text-[#285734] font-black shadow-[0_3px_10px_-8px_rgba(34,84,52,0.45)]'
                                : 'border border-[#315E3B] bg-[#315E3B] text-white shadow-[0_8px_16px_-10px_rgba(26,64,41,0.55)] hover:border-[#2A5032] hover:bg-[#2A5032]'
                            "
                            @click.stop="onRecommendationSelect(rec.code)"
                          >
                            <template
                              v-if="
                                selectedBuyer?.id === rec.code || selectedBuyer?.code === rec.code
                              "
                            >
                              <span class="inline-flex items-center gap-1">
                                <BadgeCheck class="h-4 w-4" :stroke-width="2.2" />
                                <span>선택됨</span>
                              </span>
                            </template>
                            <template v-else>선택</template>
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
                            이 거래처와 거래하면
                            <span class="font-black">ESG 나무 +150점</span> 추가 적립
                            <span class="text-xs font-bold text-[#4E6D54]">
                              ({{ recommendationBonusReason(rec, index) }})
                            </span>
                          </span>
                        </div>
                      </div>
                    </article>
                  </div>

                  <div v-else class="mt-4">
                    <div class="flex items-center gap-6">
                      <input
                        v-model="buyerSearchTerm"
                        type="search"
                        class="h-10 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
                        placeholder="거래처명, 거래처 코드, 담당자명, 연락처, 처리 소재, 지역으로 검색..."
                      />
                      <button
                        type="button"
                        class="h-10 min-w-[80px] rounded-xl bg-[#2D5B35] px-5 text-sm font-black text-white transition hover:bg-[#244B2B]"
                      >
                        검색
                      </button>
                    </div>

                    <div class="h-4" />
                    <div class="min-h-[240px] rounded-xl border border-gray-200 bg-[#FBFCFB] px-2 py-2">
                      <div
                        v-if="filteredBuyers.length > 0"
                        class="max-h-[24rem] space-y-1.5 overflow-y-auto pr-1"
                      >
                        <button
                          v-for="buyer in filteredBuyers"
                          :key="buyer.id"
                          type="button"
                          class="flex w-full flex-col items-start rounded-lg border border-gray-200 px-3 py-2 text-left transition hover:border-[#CFE2DA] hover:bg-[#F6FBF9]"
                          @click="selectBuyer(buyer)"
                        >
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-black leading-none text-gray-900">{{ buyer.companyName }}</span>
                            <span class="pt-[1px] text-xs font-bold leading-none text-gray-500">{{ buyer.code }}</span>
                          </div>
                          <div class="h-1.5" />
                          <span class="block text-xs font-bold text-gray-400">
                            {{ materialFitLabel(buyer.primaryMaterialFit) }} ·
                            {{ buyer.industryGroup || '-' }} ·
                            {{ buyer.productNote || '-' }}
                          </span>
                          <div class="h-1.5" />
                          <span class="block text-xs font-bold text-gray-500">
                            담당자 {{ buyer.managerName || '-' }} · {{ buyer.phone || '-' }} ·
                            {{ recommendationLocationLabel(buyer) }}
                          </span>
                        </button>
                      </div>
                      <div
                        v-else
                        class="flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 text-center"
                      >
                        <p class="text-[28px] leading-none text-gray-300">⌕</p>
                        <p class="mt-2 text-lg font-bold text-gray-500">
                          검색어를 입력하면 전체 거래처 DB에서 조회합니다.
                        </p>
                        <p class="mt-1 text-base font-semibold text-gray-400">
                          AI 추천 거래처는 매칭 적합도와 추천 근거가 자동 제공됩니다.
                        </p>
                      </div>
                    </div>
                    <div class="pt-3">
                      <p class="text-right text-xs font-bold text-gray-500">
                        현재 선택된 소재 구분(천연 단일 섬유/합성 섬유/혼방)에 맞는 거래처만
                        표시됩니다.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              </template>

              <div
                v-else
                class="mt-0 space-y-4"
              >
                <div
                  class="flex items-start gap-2 rounded-lg border border-[#CFE0FF] bg-[#F5F9FF] px-4 py-2 text-xs font-bold text-[#2E4E8C]"
                  style="margin-bottom: 1.4%;"
                >
                  <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4A74C9]" :stroke-width="2" />
                  <span>
                    거래처는 kg 단위로 요청합니다. 벌 수 환산 시 요청값과 실제 kg 합계가 다를 수
                    있으며, 재고 한도(수량/무게) 초과 판매는 제한됩니다.
                  </span>
                </div>

                <div class="grid w-full gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
                <div class="min-w-0" style="display: flex; flex-direction: column; row-gap: 24px;">

                  <article
                    v-for="group in step3GroupCards"
                    :key="group.key"
                    class="overflow-hidden rounded-2xl border-[1.5px] transition-shadow duration-200"
                    :class="
                      group.status === 'error'
                        ? 'border-rose-300 bg-white shadow-[0_12px_26px_-12px_rgba(15,23,42,0.34)]'
                        : group.status === 'completed'
                          ? 'border-emerald-400 bg-white shadow-[0_12px_26px_-12px_rgba(15,23,42,0.34)]'
                          : 'border-gray-200 bg-white shadow-[0_10px_22px_-14px_rgba(15,23,42,0.32)]'
                    "
                  >
                    <header class="flex items-center justify-between border-b border-[#DCEDE5] px-5 py-4">
                      <div class="flex items-start gap-3">
                        <div class="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF5EF] text-[#2F6B4F]">
                          <Shirt class="h-4.5 w-4.5" :stroke-width="2.1" />
                        </div>
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="text-base font-black text-gray-900" style="font-weight: 600">
                              {{ group.materialDetailLabel }}
                            </span>
                            <span
                              class="inline-flex h-5 items-center rounded-full px-2 text-[10px] font-black"
                              :class="
                                group.status === 'error'
                                  ? 'bg-rose-100 text-rose-700'
                                  : group.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-gray-100 text-gray-600'
                              "
                            >
                              {{ group.status === 'error' ? '오류' : group.status === 'completed' ? '완료' : '미입력' }}
                            </span>
                          </div>
                          <p class="mt-1 text-sm font-bold text-gray-500">
                            {{ group.materialType }} · SKU {{ group.items.length }}종 ·
                            ₩{{ Number(group.items[0]?.defaultKgUnitPrice || 0).toLocaleString() }}/kg
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <p class="inline-flex items-center gap-1.5 text-sm font-bold text-gray-600">
                          <Package class="h-3.5 w-3.5 text-gray-500" :stroke-width="2.1" />
                          총 재고 <span class="text-gray-900" style="font-weight: 600">{{ group.totalAvailableQty }}벌</span>
                          · 최대
                          <span class="text-gray-900" style="font-weight: 600">{{ formatKg(group.totalAvailableKg) }}</span>
                        </p>
                      </div>
                    </header>

                    <div class="border-b border-[#E6F1EC] px-5 py-4">
                      <div class="flex flex-col gap-1">
                        <div class="flex flex-wrap items-center gap-3 w-full">
                          <span
                            class="inline-flex h-[46px] items-center -translate-y-[1px] text-sm leading-none text-gray-900"
                            style="font-weight: 600"
                            >거래처 요청</span
                          >
                          <div class="inline-flex h-[45px] items-center gap-1 rounded-xl border-2 border-gray-300 bg-white px-3">
                            <input
                              :value="groupRequestedInputText[group.key] ?? (groupRequestedKg[group.key] ?? '')"
                              type="text"
                              inputmode="decimal"
                              class="no-spin border-0 bg-transparent px-0 leading-none text-gray-900 outline-none"
                              style="font-weight: 700; width: 5rem; font-size: 25px;"
                              @input="distributeGroupRequestedKg(group.key, $event.target.value)"
                              @blur="onGroupRequestedKgBlur(group.key)"
                            />
                            <span class="pt-1 text-sm font-bold text-gray-400">kg</span>
                          </div>
                          <span class="inline-flex h-[46px] items-center -translate-y-[1px] text-base leading-none text-gray-300">→</span>
                          <div
                            class="inline-flex items-center self-center -translate-y-[1px] rounded-lg border border-[#D9CCF5] bg-[#F6F1FF] px-3 py-1.5 text-xs font-bold leading-none text-[#5B4A7A]"
                          >
                            <span class="font-black text-[#6E4BB8]">kg 입력 시</span>
                            <span>&nbsp;재고 많은 순으로&nbsp;</span>
                            <span class="font-black text-[#6E4BB8]">자동 배분</span>
                          </div>
                          <button
                            type="button"
                            class="inline-flex h-7 items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 text-[11px] font-black text-gray-600 hover:bg-gray-50"
                            style="margin-left: auto;"
                            @click="toggleStep3Group(group.key)"
                          >
                            <span>{{ isStep3GroupExpanded(group.key) ? '접기' : '펼치기' }}</span>
                            <ChevronUp
                              v-if="isStep3GroupExpanded(group.key)"
                              class="h-3.5 w-3.5"
                              :stroke-width="2.2"
                            />
                            <ChevronDown
                              v-else
                              class="h-3.5 w-3.5"
                              :stroke-width="2.2"
                            />
                          </button>
                        </div>
                        <div class="text-xs font-bold text-gray-400" style="padding-left: 5.8rem; margin-top: 1px;">
                          재고 최대 {{ Number(group.totalAvailableKg || 0).toFixed(2) }}kg
                        </div>
                      </div>
                    </div>

                    <template v-if="isStep3GroupExpanded(group.key)">
                    <div class="overflow-x-auto">
                      <table class="min-w-[800px] w-full border-collapse text-left">
                        <colgroup>
                          <col style="width: 20%" />
                          <col style="width: 12%" />
                          <col style="width: 16%" />
                          <col style="width: 4%" />
                          <col style="width: 12%" />
                          <col style="width: 4%" />
                          <col style="width: 12%" />
                          <col style="width: 13%" />
                        </colgroup>
                        <thead class="bg-[#FCFDFC] text-xs font-black text-gray-500">
                          <tr>
                            <th class="px-5 py-3">SKU</th>
                            <th class="px-3 py-3 text-center">재고</th>
                            <th class="px-3 py-3 text-center">kg</th>
                            <th class="px-1 py-3"></th>
                            <th class="px-3 py-3 text-center">판매 벌 수</th>
                            <th class="px-1 py-3"></th>
                            <th class="px-3 py-3 text-center">실제 무게</th>
                            <th class="px-5 py-3 text-right">금액</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 text-sm">
                          <tr v-for="item in group.items" :key="item.draftId">
                            <td class="px-5 py-4">
                              <p class="text-sm font-black text-gray-900">{{ item.itemName }}</p>
                              <p class="mt-1 font-mono text-xs font-bold text-gray-400">{{ item.skuCode }}</p>
                            </td>
                            <td class="px-3 py-4 text-center">
                              <p class="text-base font-black text-gray-900">{{ item.availableQuantity }}벌</p>
                              <p class="mt-1 text-sm font-bold text-gray-500">{{ formatKg(item.availableWeightKg) }}</p>
                            </td>
                            <td class="px-3 py-4 text-center">
                              <div class="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-1.5">
                                <input
                                  :value="step3SkuInputText[item.draftId] ?? Number(item.requestedWeightKg || 0).toFixed(2)"
                                  type="text"
                                  inputmode="decimal"
                                  class="no-spin w-10 border-0 bg-transparent text-right text-[20px] leading-none text-gray-900 outline-none"
                                  style="font-weight: 500"
                                  @input="onStep3SkuKgInput(group.key, item.draftId, $event.target.value)"
                                  @blur="onStep3SkuKgBlur(item.draftId)"
                                />
                                <span class="text-xs font-bold text-gray-500">kg</span>
                              </div>
                              <div class="mt-1 text-xs font-bold text-gray-400">
                                <button
                                  v-if="isManualAdjusted(item.draftId)"
                                  type="button"
                                  class="ml-2 text-[#0F5C4D] underline"
                                  @click="resetStep3SkuToAuto(group.key, item.draftId)"
                                >
                                  자동으로 되돌리기
                                </button>
                              </div>
                              <p class="mt-0.5 text-[11px] font-bold text-gray-400">
                                1벌당 {{ Number(item.unitWeightKg || 0).toFixed(2) }}kg
                              </p>
                            </td>
                            <td class="px-1 py-4 text-center text-lg font-black text-gray-300">→</td>
                            <td class="px-3 py-4 text-center">
                              <p class="text-lg font-black text-gray-900">{{ item.deductedQuantity }}벌</p>
                              <p
                                v-if="roundedUpQuantityLabel(item)"
                                class="mt-0.5 text-[11px] font-bold text-gray-400"
                              >
                                {{ roundedUpQuantityLabel(item) }}
                              </p>
                            </td>
                            <td class="px-1 py-4 text-center text-lg font-black text-gray-300">→</td>
                            <td class="px-3 py-4 text-center text-lg font-black text-gray-900">
                              {{ formatKg(item.actualWeightKg) }}
                            </td>
                            <td class="px-5 py-4 text-right text-lg text-[#2F8F6A]" style="font-weight: 500">
                              {{ formatCurrency(item.actualAmount) }}
                            </td>
                          </tr>
                          <tr class="bg-[#F7FAF8] text-sm font-black text-gray-700">
                            <td class="px-5 py-3">합계</td>
                            <td />
                            <td />
                            <td />
                            <td class="px-3 py-3 text-center text-base text-gray-900">{{ group.totalActualQty }}벌</td>
                            <td />
                            <td class="px-3 py-3 text-center text-base text-gray-900">{{ formatKg(group.totalActualKg) }}</td>
                            <td class="px-5 py-3 text-right text-base text-[#2F8F6A]" style="font-weight: 500">{{ formatCurrency(group.totalActualAmount) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    </template>
                    <footer class="flex items-center justify-between bg-[#E7F3EC] px-5 py-3 text-sm font-medium text-[#2A5B46]">
                      <div class="flex items-center gap-5">
                        <span class="inline-flex items-center gap-1.5">
                          <Package class="h-3.5 w-3.5" :stroke-width="2.1" />
                          <span class="text-[#1E4B39]" style="font-weight: 600">{{ group.totalActualQty }}벌</span>
                          <span>출고</span>
                        </span>
                        <span class="inline-flex items-center gap-1.5">
                          <Ruler class="h-3.5 w-3.5" :stroke-width="2.1" />
                          <span>실제</span>
                          <span class="text-[#1E4B39]" style="font-weight: 600">{{ formatKg(group.totalActualKg) }}</span>
                        </span>
                        <span class="inline-flex items-center gap-1.5">
                          <Tag class="h-3.5 w-3.5" :stroke-width="2.1" />
                          단가 ₩{{ Number(group.items[0]?.unitPrice || group.items[0]?.defaultKgUnitPrice || 0).toLocaleString() }}/kg
                        </span>
                      </div>
                      <span class="text-sm" style="font-weight: 600">{{ formatCurrency(group.totalActualAmount) }}</span>
                    </footer>
                  </article>

                </div>

                <aside class="rounded-xl border border-gray-200 bg-[#F7F8F7] px-4 py-4">
                  <div class="flex flex-col gap-3">
                  <section>
                    <p class="text-xs text-gray-500" style="font-weight: 600; margin-bottom: 6px">출고 창고</p>
                    <div class="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-3.5">
                      <div class="flex items-center gap-3">
                        <span
                          class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECF7F1] text-xs font-black tracking-tight text-[#2F6B4F]"
                        >
                          {{ outboundWarehouseRegionLabel }}
                        </span>
                        <div class="min-w-0">
                          <p class="truncate text-base font-black text-gray-900">{{ outboundWarehouseLabel }}</p>
                          <p class="mt-0.5 text-xs font-bold text-gray-500">출고지</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div class="flex justify-center py-0">
                    <ArrowDown class="h-4 w-4 text-gray-400" :stroke-width="2.4" />
                  </div>

                  <section style="margin-top: -18px;">
                    <p class="text-xs text-gray-500" style="font-weight: 600; margin-bottom: 6px">거래처</p>
                    <div class="rounded-xl border border-gray-200 bg-white px-3 py-3.5">
                      <div class="flex items-center gap-3">
                        <span
                          class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black tracking-tight"
                          :class="step3BuyerBadgeClass()"
                        >
                          {{ companyBadgeText(selectedBuyer?.companyName || '거래처') }}
                        </span>
                        <div class="min-w-0">
                          <p class="truncate text-base font-black text-gray-900">{{ selectedBuyer?.companyName || '-' }}</p>
                          <p class="mt-0.5 text-xs font-bold text-gray-500">
                            {{ selectedBuyer?.industryGroup || '-' }} 거래처
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div class="py-2">
                    <div class="h-px bg-gray-200" />
                  </div>

                  <section>
                    <p class="text-xs text-gray-500" style="font-weight: 600; margin-bottom: 4px">판매 요약</p>
                    <div class="mt-2 divide-y divide-gray-200 text-xs">
                      <div class="flex items-center justify-between py-2.5">
                        <span class="font-bold text-gray-500">소재 구분</span>
                        <span class="text-sm text-gray-900" style="font-weight: 600">{{ lockedMaterialType || '-' }}</span>
                      </div>
                      <div class="flex items-start justify-between gap-2 py-2.5">
                        <span class="font-bold text-gray-500">포함 소재</span>
                        <span class="text-right text-sm text-gray-900" style="font-weight: 600">
                          {{ includedMaterialNames.join(', ') || '-' }}
                        </span>
                      </div>
                      <div class="flex items-center justify-between py-2.5">
                        <span class="font-bold text-gray-500">담긴 SKU</span>
                        <span class="text-sm text-gray-900" style="font-weight: 600">{{ step3Summary.totalSku }}종</span>
                      </div>
                      <div class="flex items-center justify-between py-2.5">
                        <span class="font-bold text-gray-500">입력 완료</span>
                        <span class="text-sm text-[#7C5A18]" style="font-weight: 600">{{ step3Summary.inputCompletedCount }} / {{ step3Summary.totalSku }}</span>
                      </div>
                      <div class="flex items-center justify-between py-2.5">
                        <span class="font-bold text-gray-500">총 판매 벌 수</span>
                        <span class="text-sm text-gray-900" style="font-weight: 600">{{ step3Summary.totalActualQty }}벌</span>
                      </div>
                      <div class="flex items-center justify-between py-2.5">
                        <span class="font-bold text-gray-500">총 실제 무게</span>
                        <span class="text-sm text-gray-900" style="font-weight: 600">{{ formatKg(step3Summary.totalActualKg) }}</span>
                      </div>
                    </div>
                  </section>

                  <section class="rounded-2xl border border-[#1F4E43] bg-[#1F4E43] px-4 py-4.5 text-white">
                    <p class="text-xs font-bold text-[#BED8CF]">예상 판매 금액</p>
                    <p class="mt-2 text-xl font-black">{{ formatCurrency(step3Summary.totalActualAmount) }}</p>
                    <p class="mt-1 text-xs font-bold text-[#9EC3B8]">
                      실제 무게 기준
                    </p>
                  </section>

                  <div class="py-2">
                    <div class="h-px bg-gray-200" />
                  </div>

                  <section>
                    <p class="text-xs text-gray-500" style="font-weight: 600; margin-bottom: 6px">판매 메모</p>
                    <textarea
                      :value="circularStockStore.draftMemo"
                      rows="4"
                      maxlength="500"
                      class="mt-3 w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-bold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#004D3C]"
                      placeholder="거래 조건, 출고 메모 등을 입력하세요."
                      @input="circularStockStore.setDraftMemo($event.target.value)"
                    />
                  </section>
                  </div>
                </aside>
                </div>
              </div>
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

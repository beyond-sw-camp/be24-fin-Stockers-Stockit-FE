import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useCircularInventoryBuyerStore } from '@/stores/circularInventoryBuyers.js'

const INVENTORY_STORAGE_KEY = 'stockit_circular_inventory_inventory_v2'
const SALES_STORAGE_KEY = 'stockit_circular_inventory_sales_v1'

const RAW_INITIAL_INVENTORY = [
  { id: 'CI-001', itemCode: 'SPA-TOP-001', parentCategory: '상의', childCategory: '반팔', itemName: '코튼 베이직 반팔 티셔츠', materials: [{ name: '면', ratio: 100 }], quantity: 184, weightKg: 92.0 },
  { id: 'CI-002', itemCode: 'SPA-TOP-002', parentCategory: '상의', childCategory: '긴팔', itemName: '슬림핏 긴팔 티셔츠', materials: [{ name: '면', ratio: 100 }], quantity: 52, weightKg: 31.2 },
  { id: 'CI-003', itemCode: 'SPA-TOP-003', parentCategory: '상의', childCategory: '셔츠', itemName: '오버핏 옥스퍼드 셔츠', materials: [{ name: '면', ratio: 70 }, { name: '폴리에스터', ratio: 30 }], quantity: 76, weightKg: 53.2 },
  { id: 'CI-004', itemCode: 'SPA-TOP-004', parentCategory: '상의', childCategory: '니트', itemName: '라운드넥 하프 니트', materials: [{ name: '울', ratio: 50 }, { name: '아크릴', ratio: 50 }], quantity: 86, weightKg: 43.0 },
  { id: 'CI-005', itemCode: 'SPA-TOP-005', parentCategory: '상의', childCategory: '후드티', itemName: '오버사이즈 로고 후드티', materials: [{ name: '면', ratio: 80 }, { name: '폴리에스터', ratio: 20 }], quantity: 44, weightKg: 48.4 },
  { id: 'CI-006', itemCode: 'SPA-PNT-001', parentCategory: '바지', childCategory: '청바지', itemName: '스트레이트 워싱 데님', materials: [{ name: '데님', ratio: 100 }], quantity: 39, weightKg: 42.9 },
  { id: 'CI-007', itemCode: 'SPA-PNT-002', parentCategory: '바지', childCategory: '반바지', itemName: '와이드 코튼 쇼츠', materials: [{ name: '면', ratio: 100 }], quantity: 68, weightKg: 30.6 },
  { id: 'CI-008', itemCode: 'SPA-PNT-003', parentCategory: '바지', childCategory: '긴바지', itemName: '사이드 밴딩 팬츠', materials: [{ name: '나일론', ratio: 100 }], quantity: 24, weightKg: 18.6 },
  { id: 'CI-009', itemCode: 'SPA-PNT-004', parentCategory: '바지', childCategory: '트레이닝', itemName: '스트링 조거 트레이닝 팬츠', materials: [{ name: '폴리', ratio: 90 }, { name: '스판', ratio: 10 }], quantity: 57, weightKg: 39.9 },
  { id: 'CI-010', itemCode: 'SPA-SKT-001', parentCategory: '치마', childCategory: '미니스커트', itemName: 'A라인 데님 미니스커트', materials: [{ name: '폴리에스터', ratio: 100 }], quantity: 33, weightKg: 16.5 },
  { id: 'CI-011', itemCode: 'SPA-SKT-002', parentCategory: '치마', childCategory: '롱스커트', itemName: '플리츠 롱스커트', materials: [{ name: '폴리에스터', ratio: 100 }], quantity: 19, weightKg: 12.4 },
  { id: 'CI-012', itemCode: 'SPA-OUT-001', parentCategory: '아우터', childCategory: '패딩', itemName: '라이트 다운 패딩', materials: [{ name: '나일론', ratio: 80 }, { name: '충전재', ratio: 20 }], quantity: 21, weightKg: 29.4 },
  { id: 'CI-013', itemCode: 'SPA-OUT-002', parentCategory: '아우터', childCategory: '후드집업', itemName: '스웨트 후드 집업', materials: [{ name: '면', ratio: 70 }, { name: '폴리에스터', ratio: 30 }], quantity: 47, weightKg: 42.3 },
  { id: 'CI-014', itemCode: 'SPA-OUT-003', parentCategory: '아우터', childCategory: '자켓', itemName: '싱글 브레스티드 자켓', materials: [{ name: '합성섬유', ratio: 100 }], quantity: 18, weightKg: 23.4 },
  { id: 'CI-015', itemCode: 'SPA-OUT-004', parentCategory: '아우터', childCategory: '가디건', itemName: '브이넥 니트 가디건', materials: [{ name: '아크릴', ratio: 50 }, { name: '폴리', ratio: 30 }, { name: '나일론', ratio: 20 }], quantity: 37, weightKg: 29.6 },
]

const INITIAL_SALES = [
  {
    saleId: 'CIS-20260426-001',
    buyerId: 'RCV-001',
    buyerName: '그린루프 리사이클링',
    buyerCode: 'RCV-001',
    buyerManagerName: '김서연',
    buyerPhone: '02-2100-4100',
    buyerDescription: '면 중심 순환 재고를 고순도 원료사로 전환하는 재생 원사 전문 거래처',
    buyerPrimaryMaterialFit: 'natural-single',
    soldAt: '2026-04-26T11:40:00',
    soldBy: '본사 관리자',
    totalItems: 2,
    totalEstimatedQuantity: 20.56,
    totalDeductedQuantity: 22,
    totalRequestedWeightKg: 10.28,
    totalRequestedAmount: 226160,
    totalActualWeightKg: 10.5,
    totalActualAmount: 231000,
    totalWeightKg: 10.5,
    totalAmount: 231000,
    memo: '면 소재 중단 1차 테스트 판매',
    items: [
      {
        saleId: 'CIS-20260426-001',
        inventoryId: 'CI-001',
        itemCode: 'SPA-TOP-001',
        itemName: '코튼 베이직 반팔 티셔츠',
        mainCategory: '상의',
        subCategory: '반팔',
        materials: [{ name: '면', ratio: 100 }],
        availableQuantity: 184,
        availableWeightKg: 92.0,
        unitWeightKg: 0.5,
        requestedWeightKg: 6.0,
        estimatedQuantity: 12,
        deductedQuantity: 12,
        requestedAmount: 132000,
        actualWeightKg: 6.0,
        unitPrice: 22000,
        actualAmount: 132000,
        soldWeightKg: 6.0,
        lineAmount: 132000,
      },
      {
        saleId: 'CIS-20260426-001',
        inventoryId: 'CI-007',
        itemCode: 'SPA-PNT-002',
        itemName: '와이드 코튼 쇼츠',
        mainCategory: '바지',
        subCategory: '반바지',
        materials: [{ name: '면', ratio: 100 }],
        availableQuantity: 68,
        availableWeightKg: 30.6,
        unitWeightKg: 0.45,
        requestedWeightKg: 4.28,
        estimatedQuantity: 9.51,
        deductedQuantity: 10,
        requestedAmount: 94160,
        actualWeightKg: 4.5,
        unitPrice: 22000,
        actualAmount: 99000,
        soldWeightKg: 4.28,
        lineAmount: 94160,
      },
    ],
  },
]

function roundTo(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function inventoryQuantitySeed(id) {
  return 760 + (String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 520)
}

function expandSeedInventoryItem(item) {
  const originalQuantity = Math.max(1, Number(item.quantity) || 1)
  const originalWeightKg = roundTo(Number(item.weightKg) || 0)
  const unitWeightKg = originalWeightKg > 0 ? originalWeightKg / originalQuantity : 0
  const expandedQuantity = Math.max(originalQuantity, inventoryQuantitySeed(item.id))
  const expandedWeightKg = roundTo(unitWeightKg * expandedQuantity, 1)

  return {
    ...item,
    quantity: expandedQuantity,
    weightKg: expandedWeightKg,
  }
}

const INITIAL_INVENTORY = RAW_INITIAL_INVENTORY.map(expandSeedInventoryItem)

function formatWeight(weightKg) {
  return `${roundTo(weightKg).toFixed(2)}kg`
}

function enrichInventoryItem(item) {
  const quantity = Number(item.quantity) || 0
  const weightKg = roundTo(Number(item.weightKg) || 0)
  const unitWeightKg = quantity > 0 ? roundTo(weightKg / quantity, 4) : 0

  return {
    ...item,
    quantity,
    weightKg,
    unitWeightKg,
  }
}

function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function generateSaleId(list) {
  const now = new Date()
  const prefix = `CIS-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const count = list.filter(sale => sale.saleId.startsWith(prefix)).length + 1
  return `${prefix}-${String(count).padStart(3, '0')}`
}

function deriveRequestedWeightKg(item) {
  return roundTo(Number(item.requestedWeightKg ?? item.soldWeightKg) || 0)
}

function deriveActualWeightKg(item, requestedWeightKg, deductedQuantity) {
  if (Number.isFinite(Number(item.actualWeightKg))) {
    return roundTo(Number(item.actualWeightKg))
  }
  const unitWeightKg = Number(item.unitWeightKg) || 0
  if (deductedQuantity > 0 && unitWeightKg > 0) {
    return roundTo(deductedQuantity * unitWeightKg, 4)
  }
  return requestedWeightKg
}

function deriveRequestedAmount(item, requestedWeightKg, unitPrice) {
  if (Number.isFinite(Number(item.requestedAmount))) {
    return roundTo(Number(item.requestedAmount), 0)
  }
  return roundTo(requestedWeightKg * unitPrice, 0)
}

function deriveActualAmount(item, actualWeightKg, unitPrice) {
  if (Number.isFinite(Number(item.actualAmount))) {
    return roundTo(Number(item.actualAmount), 0)
  }
  return roundTo(actualWeightKg * unitPrice, 0)
}

function normalizeSaleItem(item) {
  const unitWeightKg = roundTo(Number(item.unitWeightKg) || 0, 4)
  const unitPrice = Number(item.unitPrice) || 0
  const requestedWeightKg = deriveRequestedWeightKg(item)
  const estimatedQuantity = unitWeightKg > 0
    ? roundTo(Number(item.estimatedQuantity ?? (requestedWeightKg / unitWeightKg)) || 0, 2)
    : 0
  const deductedQuantity = Math.max(0, Number(item.deductedQuantity) || 0)
  const actualWeightKg = deriveActualWeightKg(item, requestedWeightKg, deductedQuantity)
  const requestedAmount = deriveRequestedAmount(item, requestedWeightKg, unitPrice)
  const actualAmount = deriveActualAmount(item, actualWeightKg, unitPrice)

  return {
    ...item,
    unitWeightKg,
    unitPrice,
    requestedWeightKg,
    estimatedQuantity,
    deductedQuantity,
    requestedAmount,
    actualWeightKg,
    actualAmount,
    soldWeightKg: requestedWeightKg,
    lineAmount: requestedAmount,
  }
}

function normalizeSaleRecord(sale) {
  const items = Array.isArray(sale.items) ? sale.items.map(normalizeSaleItem) : []
  const totalEstimatedQuantity = roundTo(items.reduce((sum, item) => sum + item.estimatedQuantity, 0))
  const totalDeductedQuantity = items.reduce((sum, item) => sum + item.deductedQuantity, 0)
  const totalRequestedWeightKg = roundTo(items.reduce((sum, item) => sum + item.requestedWeightKg, 0))
  const totalRequestedAmount = items.reduce((sum, item) => sum + item.requestedAmount, 0)
  const totalActualWeightKg = roundTo(items.reduce((sum, item) => sum + item.actualWeightKg, 0))
  const totalActualAmount = items.reduce((sum, item) => sum + item.actualAmount, 0)

  return {
    ...sale,
    items,
    totalItems: Number(sale.totalItems) || items.length,
    totalEstimatedQuantity,
    totalDeductedQuantity,
    totalRequestedWeightKg,
    totalRequestedAmount,
    totalActualWeightKg,
    totalActualAmount,
    totalWeightKg: totalActualWeightKg,
    totalAmount: totalActualAmount,
  }
}

function normalizeDraftField(item, updates = {}) {
  const next = {
    ...item,
    ...updates,
  }
  const requestedWeightSource = updates.requestedWeightKg ?? updates.soldWeightKg ?? next.requestedWeightKg ?? next.soldWeightKg
  const rawRequestedWeightKg = Number(requestedWeightSource) || 0
  const requestedWeightKg = Math.min(Math.max(rawRequestedWeightKg, 0), Number(next.availableWeightKg) || 0)
  const unitPrice = Number(next.unitPrice) || 0
  const estimatedQuantity = next.unitWeightKg > 0 ? requestedWeightKg / next.unitWeightKg : 0
  const deductedQuantity = requestedWeightKg > 0 && next.unitWeightKg > 0
    ? Math.ceil(estimatedQuantity)
    : 0
  const actualWeightKg = deductedQuantity > 0 && next.unitWeightKg > 0
    ? roundTo(deductedQuantity * next.unitWeightKg, 4)
    : 0
  const requestedAmount = roundTo(requestedWeightKg * unitPrice, 0)
  const actualAmount = roundTo(actualWeightKg * unitPrice, 0)

  return {
    ...next,
    requestedWeightKg,
    unitPrice: next.unitPrice,
    estimatedQuantity: roundTo(estimatedQuantity, 2),
    deductedQuantity,
    requestedAmount,
    actualWeightKg,
    actualAmount,
    soldWeightKg: requestedWeightKg,
    lineAmount: requestedAmount,
  }
}

function parseWeightLabel(weight) {
  return Number(String(weight ?? '').replace('kg', '')) || 0
}

const NATURAL_SINGLE_MATERIALS = ['면', '울', '캐시미어', '실크', '리넨']
const SYNTHETIC_MATERIALS = ['폴리에스터', '아크릴', '나일론', '스판덱스']

function normalizeMaterialName(name) {
  const normalized = String(name ?? '').trim().toLowerCase()
  const aliasMap = {
    코튼: '면',
    cotton: '면',
    폴리: '폴리에스터',
    polyester: '폴리에스터',
    acrylic: '아크릴',
    polyamide: '나일론',
    nylon: '나일론',
    elastane: '스판덱스',
    스판: '스판덱스',
    spandex: '스판덱스',
    wool: '울',
    cashmere: '캐시미어',
    silk: '실크',
    linen: '리넨',
  }
  return aliasMap[normalized] ?? String(name ?? '').trim()
}

function deriveMaterialType(materials) {
  if (!Array.isArray(materials) || materials.length === 0) return '혼방'
  const normalized = materials.map(material => ({
    ...material,
    name: normalizeMaterialName(material.name),
  }))
  if (normalized.length >= 2) return '혼방'

  const [single] = normalized
  if (Number(single.ratio) !== 100) return '혼방'
  if (NATURAL_SINGLE_MATERIALS.includes(single.name)) return '천연 단일 섬유'
  if (SYNTHETIC_MATERIALS.includes(single.name)) return '합성 섬유'
  return '혼방'
}

function buyerMaterialFitValue(materialType) {
  if (materialType === '천연 단일 섬유') return 'natural-single'
  if (materialType === '합성 섬유') return 'synthetic'
  return 'blended'
}

export const useCircularInventoryStore = defineStore('circularInventory', () => {
  const buyerStore = useCircularInventoryBuyerStore()
  const inventoryItems = ref(loadJson(INVENTORY_STORAGE_KEY, INITIAL_INVENTORY).map(enrichInventoryItem))
  const sales = ref(loadJson(SALES_STORAGE_KEY, INITIAL_SALES).map(normalizeSaleRecord))
  const draftBuyerId = ref('')
  const draftMemo = ref('')
  const draftItems = ref([])
  const saleStep = ref(1)
  const lockedMaterialType = ref('')

  const inventoryRows = computed(() =>
    [...inventoryItems.value].sort((a, b) => (
      a.parentCategory.localeCompare(b.parentCategory, 'ko')
      || a.childCategory.localeCompare(b.childCategory, 'ko')
      || a.itemName.localeCompare(b.itemName, 'ko')
    )),
  )

  const selectedBuyer = computed(() =>
    buyerStore.getBuyerById(draftBuyerId.value) ?? null,
  )

  const sortedSales = computed(() =>
    [...sales.value].sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt)),
  )

  const draftSummary = computed(() => ({
    totalItems: draftItems.value.length,
    totalRequestedWeightKg: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.requestedWeightKg) || 0), 0),
    ),
    totalRequestedAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.requestedAmount) || 0), 0),
    totalEstimatedQuantity: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.estimatedQuantity) || 0), 0),
    ),
    totalDeductedQuantity: draftItems.value.reduce((sum, item) => sum + (Number(item.deductedQuantity) || 0), 0),
    totalActualWeightKg: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.actualWeightKg) || 0), 0),
    ),
    totalActualAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0),
    totalWeightKg: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.requestedWeightKg) || 0), 0),
    ),
    totalAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.requestedAmount) || 0), 0),
  }))

  const matchedBuyerCandidates = computed(() => {
    if (!lockedMaterialType.value) return buyerStore.sortedBuyers
    return buyerStore.filteredBuyers('', {
      primaryMaterialFit: buyerMaterialFitValue(lockedMaterialType.value),
    })
  })

  const salesSummary = computed(() => ({
    totalSalesCount: sales.value.length,
    totalWeightKg: roundTo(sales.value.reduce((sum, sale) => sum + sale.totalActualWeightKg, 0)),
    totalAmount: sales.value.reduce((sum, sale) => sum + sale.totalActualAmount, 0),
    totalBuyerCount: new Set(sales.value.map(sale => sale.buyerId)).size,
  }))

  const salesAnalytics = computed(() => {
    const categoryMap = new Map()
    const buyerMap = new Map()
    const materialMap = new Map()

    for (const sale of sales.value) {
      const buyerEntry = buyerMap.get(sale.buyerId) ?? {
        buyerId: sale.buyerId,
        buyerName: sale.buyerName,
        totalWeightKg: 0,
        totalAmount: 0,
      }
      buyerEntry.totalWeightKg += sale.totalActualWeightKg
      buyerEntry.totalAmount += sale.totalActualAmount
      buyerMap.set(sale.buyerId, buyerEntry)

      for (const item of sale.items) {
        const categoryKey = `${item.mainCategory}|${item.subCategory}`
        const categoryEntry = categoryMap.get(categoryKey) ?? {
          label: `${item.mainCategory} > ${item.subCategory}`,
          totalWeightKg: 0,
          totalAmount: 0,
        }
        categoryEntry.totalWeightKg += item.actualWeightKg
        categoryEntry.totalAmount += item.actualAmount
        categoryMap.set(categoryKey, categoryEntry)

        for (const material of item.materials) {
          const materialEntry = materialMap.get(material.name) ?? {
            materialName: material.name,
            totalWeightKg: 0,
          }
          materialEntry.totalWeightKg += item.actualWeightKg * (material.ratio / 100)
          materialMap.set(material.name, materialEntry)
        }
      }
    }

    return {
      categoryBreakdown: [...categoryMap.values()].sort((a, b) => b.totalWeightKg - a.totalWeightKg),
      buyerBreakdown: [...buyerMap.values()].sort((a, b) => b.totalAmount - a.totalAmount),
      materialBreakdown: [...materialMap.values()].sort((a, b) => b.totalWeightKg - a.totalWeightKg),
    }
  })

  function persistInventory() {
    saveJson(INVENTORY_STORAGE_KEY, inventoryItems.value)
  }

  function persistSales() {
    saveJson(SALES_STORAGE_KEY, sales.value)
  }

  function getInventoryById(inventoryId) {
    return inventoryItems.value.find(item => item.id === inventoryId) ?? null
  }

  function getSaleById(saleId) {
    return sales.value.find(sale => sale.saleId === saleId) ?? null
  }

  function getDraftItem(draftId) {
    return draftItems.value.find(item => item.draftId === draftId) ?? null
  }

  function filteredBuyers(keyword = '') {
    if (!lockedMaterialType.value) return buyerStore.filteredBuyers(keyword)
    return buyerStore.filteredBuyers(keyword, {
      primaryMaterialFit: buyerMaterialFitValue(lockedMaterialType.value),
    })
  }

  function selectBuyer(buyerId) {
    draftBuyerId.value = buyerId
  }

  function setDraftMemo(memo) {
    draftMemo.value = memo
  }

  function addSaleDraftItem(skuRow) {
    const draftId = String(skuRow?.id ?? '')
    const inventoryId = String(skuRow?.inventoryId ?? '')
    const inventory = getInventoryById(inventoryId)
    if (!inventory) {
      return { success: false, message: '순환 재고 품목을 찾을 수 없습니다.' }
    }

    const existing = getDraftItem(draftId)
    if (existing) {
      return { success: true, item: existing, alreadyExists: true }
    }

    const materialType = skuRow?.materialType ?? deriveMaterialType(inventory.materials)
    if (lockedMaterialType.value && lockedMaterialType.value !== materialType) {
      return {
        success: false,
        message: `현재 요청서는 ${lockedMaterialType.value}만 선택할 수 있습니다.`,
      }
    }
    if (!lockedMaterialType.value) {
      lockedMaterialType.value = materialType
    }

    const availableQuantity = Number(skuRow?.quantity) || 0
    const availableWeightKg = roundTo(parseWeightLabel(skuRow?.weight))
    const unitWeightKg = availableQuantity > 0 ? roundTo(availableWeightKg / availableQuantity, 4) : 0
    const defaultKgUnitPrice = Number(skuRow?.materialKgPrice) || 0

    const draftItem = normalizeDraftField({
      draftId,
      skuCode: skuRow?.skuCode ?? '',
      color: skuRow?.color ?? '',
      size: skuRow?.size ?? '',
      materialType,
      defaultKgUnitPrice,
      resolvedUnitPrice: defaultKgUnitPrice,
      inventoryId: inventory.id,
      itemCode: inventory.itemCode,
      itemName: inventory.itemName,
      mainCategory: inventory.parentCategory,
      subCategory: inventory.childCategory,
      materials: inventory.materials,
      availableQuantity,
      availableWeightKg,
      unitWeightKg,
      requestedWeightKg: '',
      estimatedQuantity: 0,
      deductedQuantity: 0,
      requestedAmount: 0,
      actualWeightKg: 0,
      actualAmount: 0,
      unitPrice: defaultKgUnitPrice,
      lineAmount: 0,
    })

    draftItems.value = [...draftItems.value, draftItem]
    return { success: true, item: draftItem }
  }

  function updateSaleDraftItem(draftId, payload) {
    const index = draftItems.value.findIndex(item => item.draftId === draftId)
    if (index === -1) {
      return { success: false, message: '판매 패널에서 항목을 찾을 수 없습니다.' }
    }

    const next = [...draftItems.value]
    next[index] = normalizeDraftField(next[index], payload)
    draftItems.value = next
    return { success: true, item: next[index] }
  }

  function removeSaleDraftItem(draftId) {
    draftItems.value = draftItems.value.filter(item => item.draftId !== draftId)
    if (draftItems.value.length === 0) {
      lockedMaterialType.value = ''
      draftBuyerId.value = ''
      saleStep.value = 1
    }
  }

  function clearDraft() {
    draftBuyerId.value = ''
    draftMemo.value = ''
    draftItems.value = []
    lockedMaterialType.value = ''
    saleStep.value = 1
  }

  function setSaleStep(nextStep) {
    const parsed = Number(nextStep)
    if (![1, 2, 3].includes(parsed)) return
    if (parsed === 2 && draftItems.value.length === 0) return
    if (parsed === 3 && (!draftBuyerId.value || draftItems.value.length === 0)) return
    saleStep.value = parsed
  }

  function validateCircularInventorySaleDraft() {
    if (draftItems.value.length === 0) {
      return { success: false, message: 'Step 1에서 판매할 SKU를 1건 이상 선택해주세요.' }
    }
    if (!draftBuyerId.value) {
      return { success: false, message: 'Step 2에서 거래처를 선택해주세요.' }
    }
    if (!lockedMaterialType.value) {
      return { success: false, message: '요청서 소재 구분이 확정되지 않았습니다. Step 1 선택 상태를 다시 확인해주세요.' }
    }

    const buyer = buyerStore.getBuyerById(draftBuyerId.value)
    if (!buyer) {
      return { success: false, message: '선택한 거래처 정보를 찾을 수 없습니다. Step 2에서 다시 선택해주세요.' }
    }
    const expectedBuyerFit = buyerMaterialFitValue(lockedMaterialType.value)
    if (buyer.primaryMaterialFit !== expectedBuyerFit) {
      return {
        success: false,
        message: `선택한 거래처의 대표 소재 적합도(${buyerStore.materialFitLabel(buyer.primaryMaterialFit)})가 요청 소재 구분(${lockedMaterialType.value})과 맞지 않습니다.`,
      }
    }

    const inventoryAggregate = new Map()
    for (const item of draftItems.value) {
      const requestedWeightKg = Number(item.requestedWeightKg)
      const actualWeightKg = Number(item.actualWeightKg)
      const unitPrice = Number(item.unitPrice)
      const inventory = getInventoryById(item.inventoryId)

      if (!inventory) {
        return { success: false, message: `${item.itemName}(${item.skuCode || item.itemCode}) 재고를 찾을 수 없습니다.` }
      }
      if (Number.isNaN(requestedWeightKg) || requestedWeightKg <= 0) {
        return { success: false, message: `${item.itemName}(${item.skuCode || item.itemCode}) 판매 kg을 입력해주세요.` }
      }
      if (Number.isNaN(unitPrice) || unitPrice <= 0) {
        return { success: false, message: `${item.itemName}(${item.skuCode || item.itemCode}) kg당 단가를 입력해주세요.` }
      }
      if (item.deductedQuantity <= 0) {
        return { success: false, message: `${item.itemName}(${item.skuCode || item.itemCode}) 실차감 수량을 계산할 수 없습니다. 판매 kg과 단위중량을 확인해주세요.` }
      }
      if (actualWeightKg <= 0) {
        return { success: false, message: `${item.itemName}(${item.skuCode || item.itemCode}) 실제 반영 kg을 계산할 수 없습니다.` }
      }
      if (actualWeightKg > item.availableWeightKg) {
        return {
          success: false,
          message: `${item.itemName}(${item.skuCode || item.itemCode}) 요청값은 가능하지만 올림 차감 후 실제 반영 kg이 SKU 재고 kg을 초과합니다.`,
        }
      }
      if (item.deductedQuantity > item.availableQuantity) {
        return { success: false, message: `${item.itemName}(${item.skuCode || item.itemCode}) SKU 재고 수량을 초과할 수 없습니다.` }
      }
      if (item.materialType !== lockedMaterialType.value) {
        return { success: false, message: '요청서 내 SKU의 소재 구분이 일치하지 않습니다. Step 1에서 같은 소재 구분만 남겨주세요.' }
      }

      const aggregate = inventoryAggregate.get(item.inventoryId) ?? { actualWeightKg: 0, deductedQuantity: 0 }
      aggregate.actualWeightKg += actualWeightKg
      aggregate.deductedQuantity += item.deductedQuantity
      inventoryAggregate.set(item.inventoryId, aggregate)
    }

    for (const [inventoryId, aggregate] of inventoryAggregate.entries()) {
      const inventory = getInventoryById(inventoryId)
      if (!inventory) continue
      if (aggregate.actualWeightKg > inventory.weightKg) {
        return { success: false, message: `${inventory.itemName} 품목은 요청값은 가능하지만 올림 차감 후 실제 반영 kg 합계가 재고 kg을 초과합니다.` }
      }
      if (aggregate.deductedQuantity > inventory.quantity) {
        return { success: false, message: `${inventory.itemName} 품목 총 차감 수량이 재고 수량을 초과할 수 없습니다.` }
      }
    }

    return { success: true, buyer }
  }

  function submitCircularInventorySale(soldBy = '본사 관리자') {
    const validation = validateCircularInventorySaleDraft()
    if (!validation.success) {
      return validation
    }

    const { buyer } = validation

    const saleId = generateSaleId(sales.value)
    const soldAt = new Date().toISOString()

    const saleItems = draftItems.value.map(item => ({
      saleId,
      draftId: item.draftId,
      skuCode: item.skuCode,
      color: item.color,
      size: item.size,
      inventoryId: item.inventoryId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      mainCategory: item.mainCategory,
      subCategory: item.subCategory,
      materials: item.materials,
      availableQuantity: item.availableQuantity,
      availableWeightKg: item.availableWeightKg,
      unitWeightKg: item.unitWeightKg,
      requestedWeightKg: roundTo(Number(item.requestedWeightKg)),
      estimatedQuantity: item.estimatedQuantity,
      deductedQuantity: item.deductedQuantity,
      requestedAmount: item.requestedAmount,
      actualWeightKg: roundTo(Number(item.actualWeightKg)),
      unitPrice: Number(item.unitPrice),
      actualAmount: item.actualAmount,
      soldWeightKg: roundTo(Number(item.requestedWeightKg)),
      lineAmount: item.requestedAmount,
    }))

    for (const item of saleItems) {
      const inventory = getInventoryById(item.inventoryId)
      inventory.quantity -= item.deductedQuantity
      inventory.weightKg = roundTo(Math.max(0, inventory.weightKg - item.actualWeightKg))
    }

    inventoryItems.value = inventoryItems.value.map(enrichInventoryItem)
    persistInventory()

    const sale = {
      saleId,
      buyerId: buyer.id,
      buyerName: buyer.companyName,
      buyerCode: buyer.code,
      buyerManagerName: buyer.managerName,
      buyerPhone: buyer.phone,
      buyerDescription: buyer.description,
      buyerPrimaryMaterialFit: buyer.primaryMaterialFit,
      soldAt,
      soldBy,
      totalItems: saleItems.length,
      totalEstimatedQuantity: roundTo(saleItems.reduce((sum, item) => sum + item.estimatedQuantity, 0)),
      totalDeductedQuantity: saleItems.reduce((sum, item) => sum + item.deductedQuantity, 0),
      totalRequestedWeightKg: roundTo(saleItems.reduce((sum, item) => sum + item.requestedWeightKg, 0)),
      totalRequestedAmount: saleItems.reduce((sum, item) => sum + item.requestedAmount, 0),
      totalActualWeightKg: roundTo(saleItems.reduce((sum, item) => sum + item.actualWeightKg, 0)),
      totalActualAmount: saleItems.reduce((sum, item) => sum + item.actualAmount, 0),
      totalWeightKg: roundTo(saleItems.reduce((sum, item) => sum + item.actualWeightKg, 0)),
      totalAmount: saleItems.reduce((sum, item) => sum + item.actualAmount, 0),
      memo: draftMemo.value.trim(),
      items: saleItems,
    }

    sales.value = [normalizeSaleRecord(sale), ...sales.value]
    persistSales()
    clearDraft()
    return { success: true, sale }
  }

  return {
    inventoryRows,
    sortedSales,
    draftBuyerId,
    draftMemo,
    draftItems,
    saleStep,
    lockedMaterialType,
    selectedBuyer,
    matchedBuyerCandidates,
    draftSummary,
    salesSummary,
    salesAnalytics,
    formatWeight,
    filteredBuyers,
    getInventoryById,
    getSaleById,
    getDraftItem,
    selectBuyer,
    setDraftMemo,
    setSaleStep,
    addSaleDraftItem,
    updateSaleDraftItem,
    removeSaleDraftItem,
    clearDraft,
    validateCircularInventorySaleDraft,
    submitCircularInventorySale,
  }
})

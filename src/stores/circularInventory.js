import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useCircularInventoryBuyerStore } from '@/stores/circularInventoryBuyers.js'

const INVENTORY_STORAGE_KEY = 'stockit_circular_inventory_inventory_v1'
const SALES_STORAGE_KEY = 'stockit_circular_inventory_sales_v1'

const INITIAL_INVENTORY = [
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
    totalWeightKg: 10.28,
    totalAmount: 226160,
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
        soldWeightKg: 6.0,
        estimatedQuantity: 12,
        deductedQuantity: 12,
        unitPrice: 22000,
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
        soldWeightKg: 4.28,
        estimatedQuantity: 9.51,
        deductedQuantity: 10,
        unitPrice: 22000,
        lineAmount: 94160,
      },
    ],
  },
]

function roundTo(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

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

function normalizeDraftField(item, updates = {}) {
  const next = {
    ...item,
    ...updates,
  }
  const rawSoldWeightKg = Number(next.soldWeightKg) || 0
  const soldWeightKg = Math.min(Math.max(rawSoldWeightKg, 0), Number(next.availableWeightKg) || 0)
  const unitPrice = Number(next.unitPrice) || 0
  const estimatedQuantity = next.unitWeightKg > 0 ? soldWeightKg / next.unitWeightKg : 0
  const deductedQuantity = soldWeightKg > 0 && next.unitWeightKg > 0
    ? Math.ceil(estimatedQuantity)
    : 0

  return {
    ...next,
    soldWeightKg,
    unitPrice: next.unitPrice,
    estimatedQuantity: roundTo(estimatedQuantity, 2),
    deductedQuantity,
    lineAmount: roundTo(soldWeightKg * unitPrice, 0),
  }
}

export const useCircularInventoryStore = defineStore('circularInventory', () => {
  const buyerStore = useCircularInventoryBuyerStore()
  const inventoryItems = ref(loadJson(INVENTORY_STORAGE_KEY, INITIAL_INVENTORY).map(enrichInventoryItem))
  const sales = ref(loadJson(SALES_STORAGE_KEY, INITIAL_SALES))
  const draftBuyerId = ref('')
  const draftMemo = ref('')
  const draftItems = ref([])

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
    totalWeightKg: roundTo(
      draftItems.value.reduce((sum, item) => sum + (Number(item.soldWeightKg) || 0), 0),
    ),
    totalAmount: draftItems.value.reduce((sum, item) => sum + (Number(item.lineAmount) || 0), 0),
  }))

  const salesSummary = computed(() => ({
    totalSalesCount: sales.value.length,
    totalWeightKg: roundTo(sales.value.reduce((sum, sale) => sum + sale.totalWeightKg, 0)),
    totalAmount: sales.value.reduce((sum, sale) => sum + sale.totalAmount, 0),
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
      buyerEntry.totalWeightKg += sale.totalWeightKg
      buyerEntry.totalAmount += sale.totalAmount
      buyerMap.set(sale.buyerId, buyerEntry)

      for (const item of sale.items) {
        const categoryKey = `${item.mainCategory}|${item.subCategory}`
        const categoryEntry = categoryMap.get(categoryKey) ?? {
          label: `${item.mainCategory} > ${item.subCategory}`,
          totalWeightKg: 0,
          totalAmount: 0,
        }
        categoryEntry.totalWeightKg += item.soldWeightKg
        categoryEntry.totalAmount += item.lineAmount
        categoryMap.set(categoryKey, categoryEntry)

        for (const material of item.materials) {
          const materialEntry = materialMap.get(material.name) ?? {
            materialName: material.name,
            totalWeightKg: 0,
          }
          materialEntry.totalWeightKg += item.soldWeightKg * (material.ratio / 100)
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

  function getDraftItem(inventoryId) {
    return draftItems.value.find(item => item.inventoryId === inventoryId) ?? null
  }

  function filteredBuyers(keyword = '') {
    return buyerStore.filteredBuyers(keyword)
  }

  function selectBuyer(buyerId) {
    draftBuyerId.value = buyerId
  }

  function setDraftMemo(memo) {
    draftMemo.value = memo
  }

  function addSaleDraftItem(inventoryId) {
    const inventory = getInventoryById(inventoryId)
    if (!inventory) {
      return { success: false, message: '순환 재고 품목을 찾을 수 없습니다.' }
    }

    const existing = getDraftItem(inventoryId)
    if (existing) {
      return { success: true, item: existing, alreadyExists: true }
    }

    const draftItem = normalizeDraftField({
      inventoryId: inventory.id,
      itemCode: inventory.itemCode,
      itemName: inventory.itemName,
      mainCategory: inventory.parentCategory,
      subCategory: inventory.childCategory,
      materials: inventory.materials,
      availableQuantity: inventory.quantity,
      availableWeightKg: inventory.weightKg,
      unitWeightKg: inventory.unitWeightKg,
      soldWeightKg: '',
      estimatedQuantity: 0,
      deductedQuantity: 0,
      unitPrice: '',
      lineAmount: 0,
    })

    draftItems.value = [...draftItems.value, draftItem]
    return { success: true, item: draftItem }
  }

  function updateSaleDraftItem(inventoryId, payload) {
    const index = draftItems.value.findIndex(item => item.inventoryId === inventoryId)
    if (index === -1) {
      return { success: false, message: '판매 패널에서 항목을 찾을 수 없습니다.' }
    }

    const next = [...draftItems.value]
    next[index] = normalizeDraftField(next[index], payload)
    draftItems.value = next
    return { success: true, item: next[index] }
  }

  function removeSaleDraftItem(inventoryId) {
    draftItems.value = draftItems.value.filter(item => item.inventoryId !== inventoryId)
  }

  function clearDraft() {
    draftBuyerId.value = ''
    draftMemo.value = ''
    draftItems.value = []
  }

  function submitCircularInventorySale(soldBy = '본사 관리자') {
    if (!draftBuyerId.value) {
      return { success: false, message: '거래처를 선택해주세요.' }
    }

    if (draftItems.value.length === 0) {
      return { success: false, message: '판매할 순환 재고를 추가해주세요.' }
    }

    const buyer = buyerStore.getBuyerById(draftBuyerId.value)
    if (!buyer) {
      return { success: false, message: '선택한 거래처 정보를 찾을 수 없습니다.' }
    }
    for (const item of draftItems.value) {
      const soldWeightKg = Number(item.soldWeightKg)
      const unitPrice = Number(item.unitPrice)
      const inventory = getInventoryById(item.inventoryId)

      if (!inventory) {
        return { success: false, message: `${item.itemName} 재고를 찾을 수 없습니다.` }
      }
      if (Number.isNaN(soldWeightKg) || soldWeightKg <= 0) {
        return { success: false, message: `${item.itemName} 판매 kg을 입력해주세요.` }
      }
      if (soldWeightKg > inventory.weightKg) {
        return { success: false, message: `${item.itemName} 환산 재고 kg을 초과할 수 없습니다.` }
      }
      if (Number.isNaN(unitPrice) || unitPrice <= 0) {
        return { success: false, message: `${item.itemName} 단가를 입력해주세요.` }
      }
      if (item.deductedQuantity <= 0) {
        return { success: false, message: `${item.itemName} 차감 수량을 계산할 수 없습니다.` }
      }
      if (item.deductedQuantity > inventory.quantity) {
        return { success: false, message: `${item.itemName} 재고 수량을 초과할 수 없습니다.` }
      }
    }

    const saleId = generateSaleId(sales.value)
    const soldAt = new Date().toISOString()

    const saleItems = draftItems.value.map(item => ({
      saleId,
      inventoryId: item.inventoryId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      mainCategory: item.mainCategory,
      subCategory: item.subCategory,
      materials: item.materials,
      availableQuantity: item.availableQuantity,
      availableWeightKg: item.availableWeightKg,
      unitWeightKg: item.unitWeightKg,
      soldWeightKg: roundTo(Number(item.soldWeightKg)),
      estimatedQuantity: item.estimatedQuantity,
      deductedQuantity: item.deductedQuantity,
      unitPrice: Number(item.unitPrice),
      lineAmount: item.lineAmount,
    }))

    for (const item of saleItems) {
      const inventory = getInventoryById(item.inventoryId)
      inventory.quantity -= item.deductedQuantity
      inventory.weightKg = roundTo(Math.max(0, inventory.weightKg - item.soldWeightKg))
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
      totalWeightKg: roundTo(saleItems.reduce((sum, item) => sum + item.soldWeightKg, 0)),
      totalAmount: saleItems.reduce((sum, item) => sum + item.lineAmount, 0),
      memo: draftMemo.value.trim(),
      items: saleItems,
    }

    sales.value = [sale, ...sales.value]
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
    selectedBuyer,
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
    addSaleDraftItem,
    updateSaleDraftItem,
    removeSaleDraftItem,
    clearDraft,
    submitCircularInventorySale,
  }
})

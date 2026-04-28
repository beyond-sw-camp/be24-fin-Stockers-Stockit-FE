import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const STORAGE_KEY = 'stockit_inventory_v2'

const INITIAL_SKUS = [
  { skuId: 'SKU-TOP-SS-001-BLK-S', productId: 'PRD-TOP-SS-001', productName: '에센셜 코튼 반팔 티셔츠', mainCategory: '상의', subCategory: '반팔', color: '블랙', size: 'S', unitPrice: 29000, stock: 22, safetyStock: 6 },
  { skuId: 'SKU-TOP-SS-001-BLK-M', productId: 'PRD-TOP-SS-001', productName: '에센셜 코튼 반팔 티셔츠', mainCategory: '상의', subCategory: '반팔', color: '블랙', size: 'M', unitPrice: 29000, stock: 28, safetyStock: 8 },
  { skuId: 'SKU-TOP-SS-001-WHT-L', productId: 'PRD-TOP-SS-001', productName: '에센셜 코튼 반팔 티셔츠', mainCategory: '상의', subCategory: '반팔', color: '화이트', size: 'L', unitPrice: 29000, stock: 7, safetyStock: 8 },
  { skuId: 'SKU-TOP-SH-002-BLU-M', productId: 'PRD-TOP-SH-002', productName: '오버핏 데님 셔츠', mainCategory: '상의', subCategory: '셔츠', color: '블루', size: 'M', unitPrice: 59000, stock: 14, safetyStock: 5 },
  { skuId: 'SKU-TOP-KN-003-CRM-S', productId: 'PRD-TOP-KN-003', productName: '소프트 라운드 니트', mainCategory: '상의', subCategory: '니트', color: '크림', size: 'S', unitPrice: 49000, stock: 0, safetyStock: 4 },
  { skuId: 'SKU-TOP-HD-004-GRY-L', productId: 'PRD-TOP-HD-004', productName: '클래식 후드티', mainCategory: '상의', subCategory: '후드티', color: '그레이', size: 'L', unitPrice: 62000, stock: 10, safetyStock: 4 },
  { skuId: 'SKU-PNT-DN-001-IND-28', productId: 'PRD-PNT-DN-001', productName: '스트레이트 청바지', mainCategory: '바지', subCategory: '청바지', color: '인디고', size: '28', unitPrice: 69000, stock: 12, safetyStock: 5 },
  { skuId: 'SKU-PNT-DN-001-IND-30', productId: 'PRD-PNT-DN-001', productName: '스트레이트 청바지', mainCategory: '바지', subCategory: '청바지', color: '인디고', size: '30', unitPrice: 69000, stock: 18, safetyStock: 5 },
  { skuId: 'SKU-PNT-LG-002-BEI-M', productId: 'PRD-PNT-LG-002', productName: '와이드 린넨 팬츠', mainCategory: '바지', subCategory: '긴바지', color: '베이지', size: 'M', unitPrice: 54000, stock: 9, safetyStock: 4 },
  { skuId: 'SKU-PNT-ST-003-BLK-L', productId: 'PRD-PNT-ST-003', productName: '데일리 조거 팬츠', mainCategory: '바지', subCategory: '츄리닝', color: '블랙', size: 'L', unitPrice: 45000, stock: 16, safetyStock: 6 },
  { skuId: 'SKU-SKT-MN-001-BLK-S', productId: 'PRD-SKT-MN-001', productName: 'A라인 미니스커트', mainCategory: '치마', subCategory: '미니스커트', color: '블랙', size: 'S', unitPrice: 43000, stock: 6, safetyStock: 4 },
  { skuId: 'SKU-SKT-LG-002-NVY-M', productId: 'PRD-SKT-LG-002', productName: '플리츠 롱스커트', mainCategory: '치마', subCategory: '롱스커트', color: '네이비', size: 'M', unitPrice: 52000, stock: 8, safetyStock: 4 },
  { skuId: 'SKU-OUT-PD-001-KHK-M', productId: 'PRD-OUT-PD-001', productName: '라이트 패딩 점퍼', mainCategory: '아우터', subCategory: '패딩', color: '카키', size: 'M', unitPrice: 99000, stock: 5, safetyStock: 3 },
  { skuId: 'SKU-OUT-HZ-002-GRY-L', productId: 'PRD-OUT-HZ-002', productName: '코튼 후드집업', mainCategory: '아우터', subCategory: '후드집업', color: '그레이', size: 'L', unitPrice: 65000, stock: 13, safetyStock: 4 },
  { skuId: 'SKU-OUT-JK-003-BLK-M', productId: 'PRD-OUT-JK-003', productName: '싱글 자켓', mainCategory: '아우터', subCategory: '자켓', color: '블랙', size: 'M', unitPrice: 89000, stock: 4, safetyStock: 3 },
  { skuId: 'SKU-OUT-CD-004-IVR-S', productId: 'PRD-OUT-CD-004', productName: '브이넥 가디건', mainCategory: '아우터', subCategory: '가디건', color: '아이보리', size: 'S', unitPrice: 57000, stock: 11, safetyStock: 4 },
]

function loadStockMap() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function saveStockMap(skus) {
  const stockMap = {}
  skus.forEach((sku) => {
    stockMap[sku.skuId] = sku.stock
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stockMap))
}

export const useInventoryStore = defineStore('inventory', () => {
  const savedStock = loadStockMap()

  const skus = ref(
    INITIAL_SKUS.map((sku) => ({
      ...sku,
      stock: savedStock[sku.skuId] ?? sku.stock,
    })),
  )

  const mainCategories = computed(() => [
    '전체',
    ...new Set(skus.value.map((sku) => sku.mainCategory)),
  ])

  const subCategoryMap = computed(() => {
    const map = {}
    skus.value.forEach((sku) => {
      if (!map[sku.mainCategory]) map[sku.mainCategory] = new Set()
      map[sku.mainCategory].add(sku.subCategory)
    })
    return Object.fromEntries(
      Object.entries(map).map(([mainCategory, values]) => [mainCategory, Array.from(values)]),
    )
  })

  const colorOptions = computed(() => [
    '전체',
    ...new Set(skus.value.map((sku) => sku.color)),
  ])

  function getSubCategories(mainCategory) {
    if (!mainCategory || mainCategory === '전체') return ['전체']
    return ['전체', ...(subCategoryMap.value[mainCategory] ?? [])]
  }

  function stockStatus(sku) {
    if (sku.stock === 0) return 'out'
    if (sku.stock <= sku.safetyStock) return 'low'
    return 'normal'
  }

  function getSkuById(skuId) {
    return skus.value.find((sku) => sku.skuId === skuId) ?? null
  }

  function sellItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: '판매할 상품을 추가해주세요.' }
    }

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        return { success: false, message: '수량을 확인해주세요.' }
      }
      const sku = getSkuById(item.skuId)
      if (!sku) return { success: false, message: '상품 정보를 찾을 수 없습니다.' }
      if (item.quantity > sku.stock) {
        return { success: false, message: `${sku.productName} 재고가 부족합니다.` }
      }
    }

    items.forEach((item) => {
      const sku = getSkuById(item.skuId)
      sku.stock -= item.quantity
    })

    saveStockMap(skus.value)
    return { success: true, message: '판매 완료' }
  }

  return {
    skus,
    mainCategories,
    colorOptions,
    getSubCategories,
    stockStatus,
    getSkuById,
    sellItems,
  }
})

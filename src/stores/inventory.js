import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'stockit_inventory'

const INITIAL_PRODUCTS = [
  { id: 'ITM-E001', category: '전자제품',  name: '고속 충전기 (C타입) 25W',    unitPrice: 24900, stock: 1240, safetyStock: 100 },
  { id: 'ITM-E004', category: '전자제품',  name: '무소음 무선 마우스 (블랙)',   unitPrice: 39900, stock: 0,    safetyStock: 100 },
  { id: 'ITM-E008', category: '전자제품',  name: '대용량 보조배터리 20000mAh', unitPrice: 59900, stock: 240,  safetyStock: 50  },
  { id: 'ITM-H002', category: '위생용품',  name: '휴대용 가글 (중) 250ml',     unitPrice: 4500,  stock: 12,   safetyStock: 50  },
  { id: 'ITM-K003', category: '주방잡화',  name: '유리제 머그컵 350ml',         unitPrice: 12000, stock: 85,   safetyStock: 100 },
  { id: 'ITM-S005', category: '문구/사무', name: 'A4 복사용지 80g (500매)',    unitPrice: 6500,  stock: 1200, safetyStock: 400 },
  { id: 'ITM-S006', category: '문구/사무', name: '리무버블 데코 스티커 셋트',   unitPrice: 3900,  stock: 310,  safetyStock: 300 },
  { id: 'ITM-S007', category: '문구/사무', name: '스테이플러 심 (10호)',        unitPrice: 1500,  stock: 5,    safetyStock: 40  },
]

function loadStockFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function saveStockToStorage(products) {
  const stockMap = {}
  products.forEach(p => { stockMap[p.id] = p.stock })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stockMap))
}

export const useInventoryStore = defineStore('inventory', () => {
  const savedStock = loadStockFromStorage()

  const products = ref(
    INITIAL_PRODUCTS.map(p => ({
      ...p,
      stock: savedStock[p.id] ?? p.stock,
    }))
  )

  const categories = computed(() => [
    '전체',
    ...new Set(products.value.map(p => p.category)),
  ])

  function stockStatus(product) {
    if (product.stock === 0) return 'out'
    if (product.stock <= product.safetyStock) return 'low'
    return 'normal'
  }

  function sell(productId, quantity) {
    if (!quantity || quantity <= 0) return { success: false, message: '수량을 입력해주세요.' }
    const product = products.value.find(p => p.id === productId)
    if (!product) return { success: false, message: '제품을 찾을 수 없습니다.' }
    if (quantity > product.stock) return { success: false, message: '재고가 부족합니다.' }

    product.stock -= quantity
    saveStockToStorage(products.value)
    return { success: true, message: '판매 완료' }
  }

  return { products, categories, stockStatus, sell }
})

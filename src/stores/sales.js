import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useInventoryStore } from '@/stores/inventory.js'

const STORAGE_KEY = 'stockit_sales_v1'
const DEFAULT_STORE_ID = 'STORE-GANGNAM-01'

function loadSales() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveSales(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function generateSaleId(list) {
  const now = new Date()
  const prefix = `SALE-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const count = list.filter((sale) => sale.saleId.startsWith(prefix)).length + 1
  return `${prefix}-${String(count).padStart(3, '0')}`
}

export const useSalesStore = defineStore('sales', () => {
  const inventory = useInventoryStore()
  const sales = ref(loadSales())

  const sortedSales = computed(() =>
    [...sales.value].sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt)),
  )

  function createSale({ items, storeId = DEFAULT_STORE_ID }) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: '판매 목록이 비어 있습니다.' }
    }

    const result = inventory.sellItems(items)
    if (!result.success) return result

    const saleId = generateSaleId(sales.value)
    const soldAt = new Date().toISOString()

    const saleItems = items.map((item) => {
      const sku = inventory.getSkuById(item.skuId)
      return {
        saleId,
        skuId: sku.skuId,
        productId: sku.productId,
        productName: sku.productName,
        mainCategory: sku.mainCategory,
        subCategory: sku.subCategory,
        color: sku.color,
        size: sku.size,
        unitPrice: sku.unitPrice,
        quantity: item.quantity,
        lineAmount: sku.unitPrice * item.quantity,
      }
    })

    const totalQuantity = saleItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = saleItems.reduce((sum, item) => sum + item.lineAmount, 0)

    const sale = {
      saleId,
      storeId,
      soldAt,
      totalQuantity,
      totalAmount,
      items: saleItems,
    }

    sales.value = [sale, ...sales.value]
    saveSales(sales.value)

    return { success: true, sale }
  }

  function getSaleById(saleId) {
    return sales.value.find((sale) => sale.saleId === saleId) ?? null
  }

  return {
    sales,
    sortedSales,
    createSale,
    getSaleById,
  }
})

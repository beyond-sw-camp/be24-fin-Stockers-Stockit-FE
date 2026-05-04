import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { createSale, getSaleDetail, getSales } from '@/api/store/sales.js'
import { useAuthStore } from '@/stores/auth.js'

function mapSaleLine(line) {
  return {
    skuCode: line.skuCode,
    skuId: line.skuCode,
    productCode: line.productCode,
    productId: line.productCode,
    productName: line.productName,
    mainCategory: line.mainCategory,
    subCategory: line.subCategory,
    color: line.color,
    size: line.size,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineAmount: line.lineAmount,
  }
}

function mapSaleSummary(row) {
  return {
    saleNo: row.saleNo,
    saleId: row.saleNo,
    storeCode: row.storeCode,
    soldAt: row.soldAt,
    totalQuantity: row.totalQuantity,
    totalAmount: row.totalAmount,
    headline: row.headline ?? '',
    items: [],
  }
}

function mapSaleDetail(row) {
  return {
    saleNo: row.saleNo,
    saleId: row.saleNo,
    storeCode: row.storeCode,
    soldAt: row.soldAt,
    totalQuantity: row.totalQuantity,
    totalAmount: row.totalAmount,
    status: row.status,
    items: (row.items ?? []).map(mapSaleLine),
  }
}

export const useSalesStore = defineStore('sales', () => {
  const auth = useAuthStore()
  const sales = ref([])
  const selectedSale = ref(null)
  const loading = ref(false)
  const error = ref('')

  const sortedSales = computed(() =>
    [...sales.value].sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt)),
  )

  async function fetchSales(params = {}) {
    loading.value = true
    error.value = ''
    try {
      const list = await getSales(params)
      sales.value = (list ?? []).map(mapSaleSummary)
      return { success: true, sales: sales.value }
    } catch (e) {
      error.value = e?.message ?? '판매 목록 조회에 실패했습니다.'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function fetchSaleDetail(saleNo) {
    if (!saleNo) return null
    loading.value = true
    error.value = ''
    try {
      const detail = await getSaleDetail(saleNo)
      selectedSale.value = mapSaleDetail(detail)
      return selectedSale.value
    } catch (e) {
      error.value = e?.message ?? '판매 상세 조회에 실패했습니다.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createSaleFromPos({ items }) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: '판매 목록이 비어 있습니다.' }
    }

    const storeCode = auth.user?.storeCode
    if (!storeCode) {
      return { success: false, message: '매장 코드가 없어 판매를 진행할 수 없습니다.' }
    }

    loading.value = true
    error.value = ''
    try {
      const payload = {
        storeCode,
        items: items.map((line) => ({
          skuCode: line.skuCode ?? line.skuId,
          quantity: line.quantity,
        })),
      }
      const created = await createSale(payload)
      const sale = mapSaleDetail(created)
      sales.value = [mapSaleSummary(sale), ...sales.value]
      selectedSale.value = sale
      return { success: true, sale }
    } catch (e) {
      error.value = e?.message ?? '판매 등록에 실패했습니다.'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  function getSaleById(saleId) {
    return sales.value.find((sale) => sale.saleId === saleId || sale.saleNo === saleId) ?? null
  }

  return {
    sales,
    selectedSale,
    loading,
    error,
    sortedSales,
    fetchSales,
    fetchSaleDetail,
    createSaleFromPos,
    getSaleById,
  }
})

import { useWarehouseStockStore } from '@/stores/warehouse/warehouseStock.js'

// 카탈로그 행이 SKU 단위라 행마다 가용/실/안전/권장 4값 노출.
// 인벤토리 SKU BE 합류 시 store 의 시뮬레이션 함수만 axios 로 교체하면 view 수정 0.
export function usePurchaseOrderStockSim(selectedWarehouseCode) {
  const stockStore = useWarehouseStockStore()

  function rowStock(skuCode) {
    if (!selectedWarehouseCode.value || !skuCode) return null
    return stockStore.getSkuStock(selectedWarehouseCode.value, skuCode)
  }

  function rowStockLevel(skuCode) {
    return stockStore.getSkuStockLevel(rowStock(skuCode))
  }

  function rowSuggested(skuCode) {
    return stockStore.getSkuSuggestedQuantity(rowStock(skuCode))
  }

  function stockLevelClass(level) {
    if (level === 'critical') return 'text-red-600'
    if (level === 'warning') return 'text-amber-600'
    return 'text-gray-700'
  }

  // 상태 칩 — 매장 발주 요청 페이지(StoreOrderRequestView) 의 패턴을 본사용으로 확장.
  // stockStore 의 stockLevel(critical/warning/normal) + available 0 분리해 4단계.
  function statusChipForSku(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock) return null
    if (stock.available === 0) {
      return { label: '품절', class: 'bg-red-100 text-red-700' }
    }
    const level = stockStore.getSkuStockLevel(stock)
    if (level === 'critical') return { label: '부족', class: 'bg-orange-100 text-orange-700' }
    if (level === 'warning') return { label: '주의', class: 'bg-yellow-50 text-yellow-700' }
    return { label: '정상', class: 'bg-[#EBF5F5] text-gray-700' }
  }

  // 부족 SKU 우선 정렬용 rank — 작을수록 위로.
  function shortageRank(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock) return 4
    if (stock.available === 0) return 0
    const level = stockStore.getSkuStockLevel(stock)
    if (level === 'critical') return 1
    if (level === 'warning') return 2
    return 3
  }

  return {
    stockStore,
    rowStock,
    rowStockLevel,
    rowSuggested,
    stockLevelClass,
    statusChipForSku,
    shortageRank,
  }
}

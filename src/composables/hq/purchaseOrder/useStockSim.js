import { computed } from 'vue'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'

/**
 * 본사 발주 카탈로그 행의 재고 보조 함수.
 *
 * 입력은 BE `PurchaseOrderCatalogRepository.findCatalogPage` 응답의 SKU 평탄 row.
 * 가용재고(`row.availableQty`)는 BE 가 `inventory_status='NORMAL'` + 선택 창고 SUM 으로
 * 정확히 산출 (`PurchaseOrderCatalogRepository.java:35-43`). FE 는 그 값으로만 평가.
 *
 * 안전재고(`safetyStock`)는 BE catalog 응답에 없음 — `availableQty === 0` 만 품절로
 * 단순 평가하는 2단계 (품절/정상). 추후 BE 가 `warehouseSafetyStock` 을 응답에 추가하면
 * 본 composable 만 정교화 — 호출자 시그니처 유지.
 *
 * 호출자 시그니처: `usePurchaseOrderStockSim(selectedWarehouseCode)` 그대로 (호환).
 * 단 선택 창고 변수는 본 composable 안에서 직접 사용하지 않음 — BE 가 store.catalogRows
 * 응답 시점에 이미 그 창고 한정 `availableQty` 를 박아 보내기 때문.
 */
export function usePurchaseOrderStockSim(_selectedWarehouseCode) {
  const poStore = usePurchaseOrderStore()

  // skuCode → catalog row Map (lookup O(1))
  const rowsBySku = computed(() => {
    const map = new Map()
    for (const row of poStore.catalogRows ?? []) {
      if (row?.skuCode) map.set(row.skuCode, row)
    }
    return map
  })

  function rowStock(skuCode) {
    const row = rowsBySku.value.get(skuCode)
    if (!row) return null
    // safetyStock 은 catalog 응답 미포함 — null 로 명시. 호출자는 ?? 0 패턴.
    return {
      onHand: null,
      available: Number(row.availableQty ?? 0),
      safetyStock: null,
    }
  }

  function rowStockLevel(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock) return 'unknown'
    return stock.available === 0 ? 'critical' : 'normal'
  }

  // 안전재고 미상이라 추천 불가 — 0 반환 시 PurchaseOrderCatalog 의 "권장" 버튼 자동 숨김.
  function rowSuggested(_skuCode) {
    return 0
  }

  // 재고 숫자 색상은 중립 회색 — 상태 칩이 시각화 담당.
  function stockLevelClass(_level) {
    return 'text-gray-700'
  }

  // 상태 칩 — 품절(available 0) / 정상 2단계.
  function statusChipForSku(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock) return null
    if (stock.available === 0) {
      return { label: '품절', class: 'bg-red-100 text-red-700' }
    }
    return { label: '정상', class: 'bg-[#EBF5F5] text-gray-700' }
  }

  // 부족 SKU 우선 정렬 rank — 품절(0) / 정상(3).
  function shortageRank(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock) return 4
    if (stock.available === 0) return 0
    return 3
  }

  return {
    rowStock,
    rowStockLevel,
    rowSuggested,
    stockLevelClass,
    statusChipForSku,
    shortageRank,
  }
}

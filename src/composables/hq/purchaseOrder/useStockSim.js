import { computed } from 'vue'
import { usePurchaseOrderStore } from '@/stores/purchaseOrder.js'

/**
 * 본사 발주 카탈로그 행의 재고 보조 함수.
 *
 * 입력은 BE `PurchaseOrderCatalogRepository.findCatalogPage` 응답의 SKU 평탄 row.
 * 가용재고(`row.availableQty`)는 BE 가 `inventory_status='NORMAL'` + 선택 창고 SUM 으로
 * 정확히 산출 (`PurchaseOrderCatalogRepository.java:35-43`). FE 는 그 값으로만 평가.
 *
 * 안전재고(`safetyStock`)는 BE catalog 응답의 `warehouseSafetyStock` 로 옴
 * (`PurchaseOrderCatalogRepository` SELECT). 이를 기준으로 3단계(품절/부족/정상) 상태칩과
 * 권장 발주량을 산출한다. 안전재고가 null(미설정) 인 SKU 는 품절/정상 2단계로 폴백.
 *   - 품절: 가용 ≤ 0
 *   - 부족: 0 < 가용 < 안전재고  (BE shortageOnly 필터와 동일 기준 — 가용 < 안전재고)
 *   - 정상: 가용 ≥ 안전재고
 *   - 권장 발주량: max(0, ceil(안전재고 × 1.5) − 가용)  (헤더 툴팁 정의)
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
    const safety = row.warehouseSafetyStock
    return {
      onHand: null,
      available: Number(row.availableQty ?? 0),
      // 안전재고 — BE catalog 응답(warehouseSafetyStock). 미설정 SKU 는 null.
      safetyStock: safety == null ? null : Number(safety),
    }
  }

  function rowStockLevel(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock) return 'unknown'
    if (stock.available <= 0) return 'critical'
    if (stock.safetyStock != null && stock.available < stock.safetyStock) return 'low'
    return 'normal'
  }

  // 권장 발주량 — 안전재고 × 1.5 까지 채우는 수량. 안전재고 미상이면 0(권장 버튼 숨김).
  function rowSuggested(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock || stock.safetyStock == null || stock.safetyStock <= 0) return 0
    const target = Math.ceil(stock.safetyStock * 1.5)
    return Math.max(0, target - stock.available)
  }

  // 재고 숫자 색상은 중립 회색 — 상태 칩이 시각화 담당.
  function stockLevelClass(_level) {
    return 'text-gray-700'
  }

  // 상태 칩 — 품절(가용 0) / 부족(0<가용<안전재고) / 정상(가용≥안전재고).
  // 안전재고 미설정 SKU 는 품절/정상 2단계로 폴백.
  function statusChipForSku(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock) return null
    if (stock.available <= 0) {
      return { label: '품절', class: 'bg-red-100 text-red-700' }
    }
    if (stock.safetyStock != null && stock.available < stock.safetyStock) {
      return { label: '부족', class: 'bg-amber-100 text-amber-700' }
    }
    return { label: '정상', class: 'bg-[#EBF5F5] text-gray-700' }
  }

  // 부족 SKU 우선 정렬 rank — 품절(0) / 부족(1) / 정상(3).
  function shortageRank(skuCode) {
    const stock = rowStock(skuCode)
    if (!stock) return 4
    if (stock.available <= 0) return 0
    if (stock.safetyStock != null && stock.available < stock.safetyStock) return 1
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

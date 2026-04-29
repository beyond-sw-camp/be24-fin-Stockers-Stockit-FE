import { defineStore } from 'pinia'
import { usePurchaseOrderStore } from './purchaseOrder.js'

/**
 * 발주 카탈로그 전용 창고-제품 재고 store.
 *
 * 김사라 작품 `stores/inventory.js`(SKU 단위, 단일 창고)는 손대지 않고,
 * 본사 발주 카탈로그(`HqPurchaseOrderCreateView`) 가 "선택된 창고에서 이 ProductMaster
 * 의 재고가 얼마인지" 를 빨리 보여주기 위한 별 store. 다중 창고 × productCode lookup.
 *
 * 재고 정의 (사용자 합의):
 *   - 실재고 (onHand)     = 현재 보유 — 시드 정적 값
 *   - 안전재고 (safetyStock) = 이 밑으로 떨어지면 안 됨 — 시드 정적 값
 *   - 가용재고 (available)  = onHand + incoming - outgoing — 동적
 *     · incoming = `purchaseOrder` store 의 SHIPPING 발주 중 같은 (warehouseId, productCode)
 *                  의 quantity 합 (시연 시 발주가 SHIPPING 으로 가면 가용재고 자동 증가)
 *     · outgoing = 0 (매장 주문/출고 도메인 미구현 — Phase 1 모킹)
 *
 * BE 미구현 — inventory + warehouse-stock 도메인 BE 가 만들어지면 이 store 를 axios 로 교체한다.
 *
 * productCode 시드 전략:
 *   - 알려진 시연 의도 값은 KNOWN_SEEDS hard-code
 *   - 그 외는 productCode + warehouseId 해시 기반 deterministic default — 새로고침해도 같은 값
 */

const KNOWN_SEEDS = {
  // 'WH-001:PM-0001': { onHand: 50, safetyStock: 10 },
}

const WAREHOUSE_FACTORS = {
  'WH-001': 1.4, // 서울 1센터 — 가장 많이 비축
  'WH-002': 1.0, // 인천 제1센터
  'WH-003': 0.8, // 경기 남부센터
  'WH-004': 0.6, // 부산 물류센터
  'WH-005': 0.5, // 대구 통합센터 — 가장 적게 비축
}

function hashSeed(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}

function defaultStock(warehouseId, productCode) {
  const seed = hashSeed(`${warehouseId}|${productCode}`)
  const factor = WAREHOUSE_FACTORS[warehouseId] ?? 1.0
  const onHand = Math.round(((seed % 80) + 5) * factor)
  const safetyStock = 5 + ((seed >> 8) % 11) // 5~15
  return { onHand, safetyStock }
}

export const useWarehouseStockStore = defineStore('warehouseStock', () => {
  const poStore = usePurchaseOrderStore()

  function getBaseStock(warehouseId, productCode) {
    if (!warehouseId || !productCode) return null
    const key = `${warehouseId}:${productCode}`
    return KNOWN_SEEDS[key] ?? defaultStock(warehouseId, productCode)
  }

  /**
   * 가용재고 = onHand + incoming - outgoing
   * - incoming = SHIPPING 발주 중 같은 (warehouseId, productCode) 의 quantity 합
   * - outgoing = 0 (매장 주문 도메인 미구현)
   */
  function getStock(warehouseId, productCode) {
    const base = getBaseStock(warehouseId, productCode)
    if (!base) return null

    const incoming = poStore.purchaseOrders
      .filter((o) => o.status === 'SHIPPING' && o.warehouseId === warehouseId)
      .flatMap((o) => o.items ?? [])
      .filter((it) => it.productCode === productCode)
      .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)

    const outgoing = 0
    const available = base.onHand + incoming - outgoing

    return {
      onHand: base.onHand,
      safetyStock: base.safetyStock,
      incoming,
      outgoing,
      available,
    }
  }

  /**
   * 경고 임계 — 가용재고(available) 기준.
   * 발주 결정은 "입고예정 합쳐도 부족인가" 가 핵심이라 available 로 통일 (직전 사이클의 onHand 기준에서 정련).
   *   available < safetyStock        → 'critical' (위험, 빨강)
   *   available < safetyStock × 1.5  → 'warning'  (주의, 주황)
   *   그 외                           → 'normal'   (정상, 회색)
   */
  function getStockLevel(stock) {
    if (!stock) return 'unknown'
    if (stock.available < stock.safetyStock) return 'critical'
    if (stock.available < stock.safetyStock * 1.5) return 'warning'
    return 'normal'
  }

  /**
   * 권장 발주 수량 — 안전재고 × 1.5 까지 채우는 만큼.
   * 부족 아닌 행(가용재고 ≥ safetyStock × 1.5) 은 0 반환. 음수 절대 0 으로 clamp.
   * 셀 클릭 시 cart 수량을 이 값으로 덮어쓰기 (set 모드).
   */
  function getSuggestedQuantity(stock) {
    if (!stock) return 0
    const target = stock.safetyStock * 1.5
    const need = target - stock.available
    if (need <= 0) return 0
    return Math.ceil(need)
  }

  /**
   * 부족 품목 수 — 입력된 productCode 목록 중 안전재고 미달 (critical/warning) 행의 개수.
   * 창고 대시보드 KPI / 발주 카탈로그 토글 헤더 카운트에서 활용.
   */
  function getShortageCount(warehouseId, productCodes = []) {
    if (!warehouseId || !productCodes.length) return 0
    let count = 0
    for (const pc of productCodes) {
      const level = getStockLevel(getStock(warehouseId, pc))
      if (level === 'critical' || level === 'warning') count++
    }
    return count
  }

  /**
   * 입고 확정 후 재고 변화 미리보기 — 한 발주의 items 배열을 받아 품목별 변화 산출.
   * @returns {Array<{productCode, productName, quantity, before:{onHand,available,safetyStock},
   *                  after:{onHand,available}, shortageAfter:boolean}>}
   *   shortageAfter = 입고 후에도 onHand 가 safetyStock 미달인지.
   */
  function getInboundPreview(warehouseId, items = []) {
    if (!warehouseId || !items.length) return []
    return items.map((it) => {
      const stock = getStock(warehouseId, it.productCode)
      if (!stock) {
        return {
          productCode: it.productCode,
          productName: it.productName,
          quantity: it.quantity,
          before: null,
          after: null,
          shortageAfter: false,
        }
      }
      const qty = Number(it.quantity) || 0
      const afterOnHand = stock.onHand + qty
      // 입고 확정 = onHand 증가 + incoming 감소(이 발주분이 더 이상 SHIPPING 아님 — 단, 현재 시연 시드는
      //   DELIVERED 상태에서 incoming 에서 빠졌을 수 있어 단순화)
      const afterAvailable = stock.available + qty
      return {
        productCode: it.productCode,
        productName: it.productName,
        quantity: qty,
        before: {
          onHand: stock.onHand,
          available: stock.available,
          safetyStock: stock.safetyStock,
        },
        after: {
          onHand: afterOnHand,
          available: afterAvailable,
        },
        shortageAfter: afterOnHand < stock.safetyStock,
      }
    })
  }

  return {
    getBaseStock,
    getStock,
    getStockLevel,
    getSuggestedQuantity,
    getShortageCount,
    getInboundPreview,
  }
})

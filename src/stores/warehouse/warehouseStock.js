import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getWarehouseInventories,
  getWarehouseInventorySkus,
} from '@/api/warehouse/inventory.js'

/**
 * 창고 권한군 화면 전용 재고 캐시 store.
 *
 * BE `/api/warehouse/inventories` + `/skus` 응답을 캐시. BE 가 자기 창고 한정 응답이므로
 * (`@AuthenticationPrincipal.locationCode` 로 결정) 단일 자기 창고 캐시로 충분 —
 * warehouseId 인자는 호출자 시그니처 호환을 위해 받지만 lookup 키로는 사용하지 않는다.
 *
 * 재고 의미 (BE 응답 → store 필드):
 *   actualStock    → onHand    (실재고)
 *   availableStock → available  (가용재고)
 *   safetyStock    → safetyStock (안전재고)
 *
 * 본사 발주 카탈로그(`PurchaseOrderCatalog`) 는 본 store 의존하지 않는다 —
 * 본사 권한군이라 `/api/warehouse/inventories` 호출 불가. 카탈로그는 BE catalog
 * 응답의 `row.availableQty` 단독으로 평가 (`useStockSim` composable 참조).
 */
export const useWarehouseStockStore = defineStore('warehouseStock', () => {
  // productCode → { onHand, available, safetyStock }
  const productStocks = ref(new Map())
  // skuCode → { onHand, available, safetyStock }
  const skuStocks = ref(new Map())
  const productLoaded = ref(false)
  const skuLoaded = ref(false)
  const loading = ref(false)
  const error = ref(null)

  /**
   * 자기 창고 ProductMaster 단위 재고 fetch. warehouseId 는 시그니처 호환만 — BE 가
   * locationCode 로 자기 창고 결정. 첫 호출 시만 BE call, 이후 캐시 hit no-op.
   * page=0, size=1000 — 한 창고 상품 수가 1000 미만이라 단일 페이지로 충분.
   */
  async function loadProductStocks(_warehouseId) {
    if (productLoaded.value) return
    loading.value = true
    error.value = null
    try {
      const res = await getWarehouseInventories({ page: 0, size: 1000 })
      const items = Array.isArray(res?.items) ? res.items : []
      const next = new Map()
      for (const row of items) {
        next.set(row.itemCode, {
          onHand: Number(row.actualStock ?? 0),
          available: Number(row.availableStock ?? 0),
          safetyStock: Number(row.safetyStock ?? 0),
        })
      }
      productStocks.value = next
      productLoaded.value = true
    } catch (e) {
      error.value = e?.message ?? '창고 재고를 불러오지 못했습니다.'
      console.error('[warehouseStock] loadProductStocks 실패', e)
    } finally {
      loading.value = false
    }
  }

  async function loadSkuStocks(_warehouseId) {
    if (skuLoaded.value) return
    loading.value = true
    error.value = null
    try {
      const res = await getWarehouseInventorySkus({ page: 0, size: 2000 })
      const items = Array.isArray(res?.items) ? res.items : []
      const next = new Map()
      for (const row of items) {
        next.set(row.skuCode, {
          onHand: Number(row.actualStock ?? 0),
          available: Number(row.availableStock ?? 0),
          safetyStock: Number(row.safetyStock ?? 0),
        })
      }
      skuStocks.value = next
      skuLoaded.value = true
    } catch (e) {
      error.value = e?.message ?? 'SKU 재고를 불러오지 못했습니다.'
      console.error('[warehouseStock] loadSkuStocks 실패', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 입고 확정·발주 배치 등 mutation 직후 호출. 다음 load 시 자동 refetch.
   * warehouseId 인자는 시그니처 호환만.
   */
  function invalidate(_warehouseId) {
    productLoaded.value = false
    skuLoaded.value = false
    productStocks.value = new Map()
    skuStocks.value = new Map()
  }

  function getStock(_warehouseId, productCode) {
    if (!productCode) return null
    return productStocks.value.get(productCode) ?? null
  }

  function getSkuStock(_warehouseId, skuCode) {
    if (!skuCode) return null
    return skuStocks.value.get(skuCode) ?? null
  }

  /**
   * 경고 임계 — 가용재고(available) 기준.
   *   available < safetyStock        → 'critical'
   *   available < safetyStock × 1.5  → 'warning'
   *   그 외                           → 'normal'
   */
  function getStockLevel(stock) {
    if (!stock) return 'unknown'
    if (stock.available < stock.safetyStock) return 'critical'
    if (stock.available < stock.safetyStock * 1.5) return 'warning'
    return 'normal'
  }

  function getSuggestedQuantity(stock) {
    if (!stock) return 0
    const target = stock.safetyStock * 1.5
    const need = target - stock.available
    if (need <= 0) return 0
    return Math.ceil(need)
  }

  function getShortageCount(_warehouseId, productCodes = []) {
    if (!productCodes.length) return 0
    let count = 0
    for (const pc of productCodes) {
      const level = getStockLevel(getStock(null, pc))
      if (level === 'critical' || level === 'warning') count++
    }
    return count
  }

  /**
   * 입고 확정 미리보기 — 발주 items 배열을 받아 품목별 변화 산출.
   * SKU 단위 lookup (skuCode) — 발주 라인이 SKU 단위라 productCode(master 합산)
   * 으로 보면 다른 색상·사이즈의 재고까지 섞여 표기됨.
   * before = 현재 onHand/available/safetyStock.
   * after.onHand    = before.onHand + qty      (실재고 합류)
   * after.available = before.available         (SHIPPING 시 선반영분 유지 — ADR-024 정정 의도)
   *
   * 캐시 미스 시 null before/after — 화면이 그래시 처리.
   */
  function getInboundPreview(warehouseId, items = []) {
    if (!items.length) return []
    return items.map((it) => {
      const stock = getSkuStock(warehouseId, it.skuCode)
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
          available: stock.available,
        },
        shortageAfter: afterOnHand < stock.safetyStock,
      }
    })
  }

  // SKU 단위 wrap — 시그니처 호환.
  function getSkuStockLevel(stock) {
    return getStockLevel(stock)
  }

  function getSkuSuggestedQuantity(stock) {
    return getSuggestedQuantity(stock)
  }

  function getSkuShortageCount(_warehouseId, skuCodes = []) {
    if (!skuCodes.length) return 0
    let count = 0
    for (const sc of skuCodes) {
      const level = getSkuStockLevel(getSkuStock(null, sc))
      if (level === 'critical' || level === 'warning') count++
    }
    return count
  }

  return {
    // state
    loading,
    error,
    productLoaded,
    skuLoaded,
    // actions
    loadProductStocks,
    loadSkuStocks,
    invalidate,
    // getters — 시그니처 유지
    getStock,
    getStockLevel,
    getSuggestedQuantity,
    getShortageCount,
    getInboundPreview,
    getSkuStock,
    getSkuStockLevel,
    getSkuSuggestedQuantity,
    getSkuShortageCount,
  }
})

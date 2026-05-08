// 본사 발주 store BE ↔ FE 변환 레이어.
// store 본체(`stores/purchaseOrder.js`) 의 state/getter/action 흐름과 분리해서
// BE 컨트랙트(PurchaseOrder DetailRes/ListRes/CatalogRes) 매핑 규칙을 한 곳에 모은다.
//
// 매핑:
//   BE code               → FE id
//   BE vendorCode         → FE vendorId
//   BE totalAmount        → FE totalPrice
//   BE items[].vendorProductCode      → FE items[].productId
//   BE statusHistory[].changedAt      → FE statusHistory[].at
//   BE statusHistory[].changedByName  → FE statusHistory[].byName
// 그 외 필드는 동일 이름 그대로.

// SYS-001 배치가 자동 처리하는 공급처 책임 단계 묶음.
// 본사 관리자는 액션 불가 — UI 탭에서 하나로 그루핑한다.
export const VENDOR_PROCESSING_STATUSES = ['APPROVED', 'READY_TO_SHIP', 'IN_TRANSIT', 'ARRIVED']

// ─── BE → FE (DetailRes/ListRes) ────────────────────────────────────────────

export function toFeOrder(beOrder) {
  if (!beOrder) return null
  // BE ListRes 는 itemCount + productNames, DetailRes 는 items 배열만 보내므로 fallback 처리.
  const itemCount = beOrder.itemCount ?? (Array.isArray(beOrder.items) ? beOrder.items.length : 0)
  // ListRes 의 productNames 우선, DetailRes 면 items.productName 으로 fallback (목록 검색·표시 일관성).
  const productNames = Array.isArray(beOrder.productNames)
    ? beOrder.productNames
    : Array.isArray(beOrder.items)
      ? beOrder.items.map((it) => it.productName).filter(Boolean)
      : []
  return {
    id: beOrder.code,
    warehouseId: beOrder.warehouseId ?? '',
    warehouseCode: beOrder.warehouseCode ?? '',
    warehouseName: beOrder.warehouseName ?? '',
    vendorId: beOrder.vendorCode,
    vendorName: beOrder.vendorName ?? '',
    memberId: beOrder.memberId ?? '',
    memberName: beOrder.memberName ?? '',
    status: beOrder.status,
    totalPrice: beOrder.totalAmount ?? 0,
    cancelReason: beOrder.cancelReason ?? '',
    createdAt: beOrder.createdAt ?? '',
    updatedAt: beOrder.updatedAt ?? '',
    itemCount,
    productNames,
    items: Array.isArray(beOrder.items) ? beOrder.items.map(toFeItem) : [],
    statusHistory: Array.isArray(beOrder.statusHistory)
      ? beOrder.statusHistory.map(toFeHistory)
      : [],
  }
}

export function toFeItem(beItem) {
  return {
    productId: beItem.vendorProductCode,
    productCode: beItem.productCode,
    productName: beItem.productName,
    skuCode: beItem.skuCode ?? '',
    color: beItem.color ?? '',
    size: beItem.size ?? '',
    displayOption: beItem.displayOption ?? [beItem.color, beItem.size].filter(Boolean).join('/'),
    quantity: beItem.quantity,
    unitPrice: beItem.unitPrice,
    subtotal: beItem.subtotal,
  }
}

export function toFeHistory(beHistory) {
  return {
    status: beHistory.status,
    at: beHistory.changedAt ?? '',
    byName: beHistory.changedByName ?? '',
    note: beHistory.note ?? '',
  }
}

// ─── BE → FE (CatalogRes) ──────────────────────────────────────────────────
// BE 키 ↔ FE 키 동일 유지 (이름 변환 0). 각 SKU 행에 그룹 컨텍스트 첨부해서
// view 가 그룹 lookup 없이 자체 표시 가능하게.

export function toFeCatalogMaster(beMaster) {
  return {
    masterKey: beMaster.vendorProductCode,
    vendorCode: beMaster.vendorCode,
    vendorName: beMaster.vendorName,
    vendorProductCode: beMaster.vendorProductCode,
    productCode: beMaster.productCode,
    productName: beMaster.productName,
    contractUnitPrice: beMaster.contractUnitPrice,
    minSkuUnitPrice: beMaster.minSkuUnitPrice,
    maxSkuUnitPrice: beMaster.maxSkuUnitPrice,
    skus: Array.isArray(beMaster.skus)
      ? beMaster.skus.map((s) => ({
          skuCode: s.skuCode,
          color: s.color ?? '',
          size: s.size ?? '',
          displayOption: s.displayOption ?? [s.color, s.size].filter(Boolean).join('/'),
          unitPrice: s.unitPrice,
        }))
      : [],
  }
}

export function toFeCatalogFacet(beFacet) {
  return {
    name: beFacet.name,
    values: Array.isArray(beFacet.values) ? [...beFacet.values] : [],
  }
}

// ─── FE → BE (Create/Update Req) ────────────────────────────────────────────
// warehouseCode: vendor 패턴 일관 — code 로 식별, BE 가 findByCode 후 Long ID 박음.
// warehouseName 은 BE 가 lookupWarehouse 후 자동 박음 — FE 가 안 보냄.
// items: SKU 단위 — skuCode 필수.

export function toBeCreateReq({ vendorId, warehouseCode, memberId, memberName, items }) {
  return {
    vendorCode: vendorId,
    warehouseCode: warehouseCode ?? '',
    memberId: memberId ?? '',
    memberName: memberName ?? '',
    items: items.map((item) => ({
      vendorProductCode: item.productId,
      skuCode: item.skuCode,
      quantity: item.quantity,
    })),
  }
}

export function toBeUpdateReq({ warehouseCode, items }) {
  return {
    warehouseCode: warehouseCode ?? '',
    items: items.map((item) => ({
      vendorProductCode: item.productId,
      skuCode: item.skuCode,
      quantity: item.quantity,
    })),
  }
}

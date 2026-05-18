// 본사 발주 멀티 공급처 장바구니 store.
// 사용자가 카탈로그에서 여러 공급처 SKU 를 자유롭게 담아 한 번에 [발주 요청] 하면
// BE 가 vendorProductCode → Vendor 매핑으로 공급처별 PO N건을 단일 트랜잭션 atomic 생성한다.
//
// 패턴: warehouseTransferCart.js 의 groupedByRoute 차용 → groupedByVendor.
// 정렬: vendorName ASC (BE 응답 정렬과 일관, FE 표시 안정성).
// 마운트 자동 fetch 없음 — 카트는 사용자 입력 누적이지 서버 sync 대상이 아니다.

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { purchaseOrderApi } from '@/api/hq/purchaseOrder.js'
import { toBeBatchCreateReq } from '@/stores/purchaseOrder/mappers.js'

export const usePurchaseOrderCartStore = defineStore('purchaseOrderCart', () => {
  // 카트 라인 — { productId, productCode, productName, vendorId, vendorName,
  //              skuCode, color, size, displayOption, unitPrice, quantity }
  // productId 는 vendorProductCode (mapper 와 일관).
  const items = ref([])

  const itemCount = computed(() => items.value.length)

  const totalAmount = computed(() =>
    items.value.reduce(
      (sum, it) => sum + (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0),
      0,
    ),
  )

  // vendor 그룹핑 — Map 첫 등장 순 후 vendorName ASC 정렬.
  // 반환: [{ vendorId, vendorName, items: [...], itemCount, subtotal }, ...]
  const groupedByVendor = computed(() => {
    const map = new Map()
    for (const it of items.value) {
      if (!map.has(it.vendorId)) {
        map.set(it.vendorId, {
          vendorId: it.vendorId,
          vendorName: it.vendorName ?? '',
          items: [],
          itemCount: 0,
          subtotal: 0,
        })
      }
      const g = map.get(it.vendorId)
      g.items.push(it)
      g.itemCount += 1
      g.subtotal += (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.vendorName).localeCompare(String(b.vendorName), 'ko'),
    )
  })

  // 같은 skuCode 면 quantity 합산, 없으면 push.
  function addItem(row, qty = 1) {
    if (!row?.skuCode) return
    const addQty = Math.max(1, Math.trunc(Number(qty) || 1))
    const dup = items.value.find((it) => it.skuCode === row.skuCode)
    if (dup) {
      dup.quantity = (Number(dup.quantity) || 0) + addQty
      return
    }
    items.value.push({
      productId: row.productId ?? row.vendorProductCode ?? '',
      productCode: row.productCode ?? '',
      productName: row.productName ?? '',
      vendorId: row.vendorId ?? row.vendorCode ?? '',
      vendorName: row.vendorName ?? '',
      skuCode: row.skuCode,
      color: row.color ?? '',
      size: row.size ?? '',
      displayOption: row.displayOption ?? [row.color, row.size].filter(Boolean).join('/'),
      unitPrice: Number(row.unitPrice) || 0,
      quantity: addQty,
    })
  }

  function updateQty(skuCode, qty) {
    const target = items.value.find((it) => it.skuCode === skuCode)
    if (!target) return false
    const next = Math.trunc(Number(qty) || 0)
    if (next < 1) {
      removeItem(skuCode)
      return true
    }
    target.quantity = next
    return true
  }

  function removeItem(skuCode) {
    items.value = items.value.filter((it) => it.skuCode !== skuCode)
  }

  function clearAll() {
    items.value = []
  }

  // useDraft 의 loadDraft 가 호출 — store 의 ref 를 직접 reassign 하기보다 action 경유로 안전 sync.
  function setItems(arr) {
    items.value = Array.isArray(arr) ? arr : []
  }

  // BE batch API 호출. 성공 시에만 호출자가 clearAll — 실패 시 카트 보존(atomic 시멘틱).
  async function createBatch({ warehouseCode, memberId, memberName }) {
    const req = toBeBatchCreateReq({
      warehouseCode,
      memberId,
      memberName,
      items: items.value,
    })
    return await purchaseOrderApi.createBatch(req)
  }

  return {
    items,
    itemCount,
    totalAmount,
    groupedByVendor,
    addItem,
    updateQty,
    removeItem,
    clearAll,
    setItems,
    createBatch,
  }
})

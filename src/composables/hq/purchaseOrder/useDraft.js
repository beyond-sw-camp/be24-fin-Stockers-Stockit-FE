// 발주 작성 화면의 localStorage 드래프트 영속화.
// edit 모드(`/edit`)에서는 saveDraft no-op — 수정 화면이 다른 발주의 드래프트와 충돌하지 않도록.
const DEFAULT_KEY = 'stockit:po-cart-draft'

export function usePurchaseOrderDraft({ isEditMode, selectedWarehouseCode, cart, key = DEFAULT_KEY }) {
  function loadDraft() {
    try {
      const saved = localStorage.getItem(key)
      if (!saved) return
      const data = JSON.parse(saved)
      if (data && typeof data === 'object') {
        selectedWarehouseCode.value = data.warehouseCode ?? data.warehouseId ?? ''
        cart.value = Array.isArray(data.items) ? data.items : []
      }
    } catch {
      // 무시 — 드래프트 손상은 빈 상태로 시작.
    }
  }

  function saveDraft() {
    if (isEditMode.value) return
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          warehouseCode: selectedWarehouseCode.value,
          items: cart.value,
        }),
      )
    } catch {
      // 무시 — quota 초과 등은 영속화만 실패, 화면 동작은 유지.
    }
  }

  function clearDraftStorage() {
    try {
      localStorage.removeItem(key)
    } catch {
      // 무시
    }
  }

  return { loadDraft, saveDraft, clearDraftStorage }
}

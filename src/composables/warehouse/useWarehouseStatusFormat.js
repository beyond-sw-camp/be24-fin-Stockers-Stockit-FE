// 창고 시점 발주 상태 라벨/색상 매핑 — COMPLETED = "입고 완료" (본사 화면은 "종료").
// 발주(HqPurchaseOrderView) 측 useStatusFormat 과 라벨만 다르고 7단계 enum 동일.

const STATUS_BADGE = {
  REQUESTED: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  READY_TO_SHIP: 'bg-sky-50 text-sky-700',
  IN_TRANSIT: 'bg-blue-50 text-blue-600',
  ARRIVED: 'bg-violet-50 text-violet-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-50 text-red-600',
}

const STATUS_LABEL_WAREHOUSE = {
  REQUESTED: '승인 대기',
  APPROVED: '승인 완료',
  READY_TO_SHIP: '배송 준비 중',
  IN_TRANSIT: '배송 중',
  ARRIVED: '배송 완료',
  COMPLETED: '입고 완료',
  CANCELLED: '취소',
}

const HISTORY_DOT = {
  REQUESTED: 'bg-amber-500',
  APPROVED: 'bg-emerald-500',
  READY_TO_SHIP: 'bg-sky-500',
  IN_TRANSIT: 'bg-blue-500',
  ARRIVED: 'bg-violet-500',
  COMPLETED: 'bg-gray-700',
  CANCELLED: 'bg-red-600',
}

const HISTORY_TEXT = {
  REQUESTED: 'text-amber-700',
  APPROVED: 'text-emerald-700',
  READY_TO_SHIP: 'text-sky-700',
  IN_TRANSIT: 'text-blue-600',
  ARRIVED: 'text-violet-700',
  COMPLETED: 'text-gray-700',
  CANCELLED: 'text-red-700',
}

const INBOUND_TYPE_BADGE = {
  PURCHASE_ORDER: 'bg-emerald-50 text-emerald-700',
  WAREHOUSE_TRANSFER: 'bg-indigo-50 text-indigo-700',
}

const INBOUND_TYPE_LABEL = {
  PURCHASE_ORDER: '발주',
  WAREHOUSE_TRANSFER: '창고간 이동',
}

export function useWarehouseStatusFormat() {
  function statusClass(status) {
    return STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500'
  }

  function statusLabel(status) {
    return STATUS_LABEL_WAREHOUSE[status] ?? status
  }

  function historyDotClass(status) {
    return HISTORY_DOT[status] ?? 'bg-gray-400'
  }

  function historyTextClass(status) {
    return HISTORY_TEXT[status] ?? 'text-gray-700'
  }

  function inboundTypeClass(type) {
    return INBOUND_TYPE_BADGE[type] ?? 'bg-gray-100 text-gray-500'
  }

  function inboundTypeLabel(type) {
    return INBOUND_TYPE_LABEL[type] ?? type ?? '-'
  }

  function formatDate(iso) {
    if (!iso) return '-'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return {
    statusClass,
    statusLabel,
    historyDotClass,
    historyTextClass,
    inboundTypeClass,
    inboundTypeLabel,
    formatDate,
  }
}

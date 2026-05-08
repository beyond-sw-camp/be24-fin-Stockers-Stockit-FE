// 본사 발주 상태 라벨/색상 매핑 — 본사 시점 (COMPLETED = "종료").
// 진행 이력 타임라인의 점/텍스트 색상도 같은 7단계 enum 매핑.
// 창고 시점 라벨이 다른 곳(WarehouseInboundView 의 COMPLETED = "입고 완료") 은 별 헬퍼 권장.

const STATUS_BADGE = {
  REQUESTED: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  READY_TO_SHIP: 'bg-sky-50 text-sky-700',
  IN_TRANSIT: 'bg-blue-50 text-blue-600',
  ARRIVED: 'bg-violet-50 text-violet-700',
  COMPLETED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-50 text-red-600',
}

const STATUS_LABEL_HQ = {
  REQUESTED: '승인 대기',
  APPROVED: '승인 완료',
  READY_TO_SHIP: '배송 준비 중',
  IN_TRANSIT: '배송 중',
  ARRIVED: '배송 완료',
  COMPLETED: '종료',
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

export function useStatusFormat() {
  function statusClass(status) {
    return STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-500'
  }

  function statusLabel(status) {
    return STATUS_LABEL_HQ[status] ?? status
  }

  function historyDotClass(status) {
    return HISTORY_DOT[status] ?? 'bg-gray-400'
  }

  function historyTextClass(status) {
    return HISTORY_TEXT[status] ?? 'text-gray-700'
  }

  function formatDate(iso) {
    if (!iso) return '-'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '-'
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  return { statusClass, statusLabel, historyDotClass, historyTextClass, formatDate }
}

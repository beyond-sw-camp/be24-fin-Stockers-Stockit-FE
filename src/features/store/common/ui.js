export function formatDateTime(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDate(iso) {
  if (!iso) return '-'
  const date = new Date(iso)
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function buildHeadline(items) {
  if (!Array.isArray(items) || items.length === 0) return '-'
  return items.length > 1
    ? `${items[0].productName} 외 ${items.length - 1}건`
    : items[0].productName
}

export function storeOrderStatusClass(status) {
  return {
    REQUESTED: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-[#EBF5F5] text-black',
    COMPLETED: 'bg-slate-200 text-slate-800',
    CANCELLED: 'bg-red-100 text-red-700',
  }[status] ?? 'bg-gray-100 text-gray-600'
}

export function storeInboundStatusClass(status) {
  return {
    READY_TO_SHIP: 'bg-slate-100 text-slate-700',
    IN_TRANSIT: 'bg-blue-100 text-blue-700',
    ARRIVED: 'bg-amber-100 text-amber-700',
    RECEIVED: 'bg-[#EBF5F5] text-black',
  }[status] ?? 'bg-gray-100 text-gray-600'
}


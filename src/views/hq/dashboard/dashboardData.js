export function formatDate(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

export function getDefaultDateRange(days = 30) {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - days)
  return {
    fromDate: formatDate(from),
    toDate: formatDate(to),
  }
}

export function toUiTransferStatus(status) {
  if (status === 'IN_PROGRESS') return '출고 준비중'
  if (status === 'COMPLETED') return '완료'
  if (status === 'CANCELED') return '취소'
  if (status === 'REQUESTED') return '요청'
  return status || '-'
}

export function toUiPurchaseStatus(status) {
  if (status === 'PENDING') return '발주 요청'
  if (status === 'APPROVED') return '거래처 확인'
  if (status === 'SHIPPING') return '입고 예정'
  if (status === 'COMPLETED') return '입고 완료'
  if (status === 'REJECTED') return '취소/반려'
  return status || '-'
}

export function flattenTransferLines(transfers = []) {
  return (transfers || []).flatMap((transfer) => {
    const requestedAt = formatDateTime(transfer.requestedAt)
    const status = toUiTransferStatus(transfer.status)
    return (transfer.lines || []).map((line, index) => ({
      id: `${transfer.transferNo}-${index + 1}`,
      transferNo: transfer.transferNo,
      requestedAt,
      type: '이동',
      center: `${transfer.fromWarehouseName} → ${transfer.toWarehouseName}`,
      location: `${transfer.fromWarehouseName} → ${transfer.toWarehouseName}`,
      item: line.itemName,
      qty: `-${Number(line.qty || 0).toLocaleString()}`,
      status,
      time: requestedAt ? requestedAt.slice(11, 16) : '-',
    }))
  })
}

export function buildPurchaseRows(purchaseOrders = []) {
  return (purchaseOrders || []).map((order) => ({
    id: order.code,
    type: '입고',
    center: order.warehouseName || '-',
    location: order.warehouseName || '-',
    item: (order.productNames || [])[0] || '-',
    qty: `+${Number(order.itemCount || 0).toLocaleString()}`,
    status: toUiPurchaseStatus(order.status),
    time: formatDateTime(order.createdAt).slice(11, 16) || '-',
    createdAt: formatDateTime(order.createdAt),
  }))
}

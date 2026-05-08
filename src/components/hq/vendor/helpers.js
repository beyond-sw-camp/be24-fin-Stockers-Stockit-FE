// 계약 상태(ACTIVE/SUSPENDED/EXPIRED/DELETED 또는 null=미정) 라벨/뱃지 색상.
const CONTRACT_LABEL = {
  ACTIVE: '활성',
  SUSPENDED: '정지',
  EXPIRED: '만료',
  DELETED: '삭제',
}

export function statusLabel(status) {
  if (!status) return '미정'
  return CONTRACT_LABEL[status] ?? status
}

export function statusClass(status) {
  if (!status) return 'bg-sky-50 text-sky-700'
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-700'
  if (status === 'SUSPENDED') return 'bg-amber-50 text-amber-700'
  if (status === 'EXPIRED') return 'bg-gray-100 text-gray-400'
  return 'bg-gray-100 text-gray-400'
}

// 공급처 자체 status 는 소문자(active/inactive) — vendor store 의 fromApiVendor 가 lowercase 로 변환.
export function vendorStatusLabel(status) {
  return status === 'active' ? '활성' : '비활성'
}

export function vendorStatusClass(status) {
  return status === 'active'
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-gray-100 text-gray-400'
}

export function formatPrice(value) {
  return `₩${Number(value).toLocaleString()}`
}

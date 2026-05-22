export const INVENTORY_STORAGE_KEY = 'stockit_circular_inventory_inventory_v2'


// 소수점 반올림을 공통 규칙으로 맞추기 위한 유틸이다.
export function roundTo(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}


// 재고 항목의 숫자 필드와 단위중량을 정규화해 계산 오차를 줄인다.
export function enrichInventoryItem(item) {
  const quantity = Number(item.quantity) || 0
  const weightKg = roundTo(Number(item.weightKg) || 0)
  const unitWeightKg = quantity > 0 ? roundTo(weightKg / quantity, 4) : 0

  return {
    ...item,
    quantity,
    weightKg,
    unitWeightKg,
  }
}

// localStorage에서 JSON을 안전하게 읽어 상태 복구 실패를 방지한다.
export function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

// localStorage에 JSON 형태로 상태를 저장한다.
export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// `12.3kg` 같은 라벨 문자열을 숫자 무게로 복원한다.
export function parseWeightLabel(weight) {
  return Number(String(weight ?? '').replace('kg', '')) || 0
}

// 출고 상태 코드를 상세/내역 공통 한글 라벨로 변환한다.
export function circularSaleOutboundStatusLabel(status) {
  if (!status) return '-'
  if (status === 'READY_TO_SHIP') return '출고 준비 중'
  if (status === 'IN_TRANSIT') return '배송 중'
  if (status === 'ARRIVED') return '배송 완료'
  return status
}

// 출고 상태 코드에 맞는 공통 배지 스타일 클래스를 반환한다.
export function circularSaleOutboundStatusBadgeClass(status) {
  if (status === 'READY_TO_SHIP') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'IN_TRANSIT') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (status === 'ARRIVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-gray-200 bg-gray-50 text-gray-600'
}

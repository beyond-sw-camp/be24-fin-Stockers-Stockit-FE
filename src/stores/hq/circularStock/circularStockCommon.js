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

const NATURAL_SINGLE_MATERIALS = ['면', '울', '캐시미어', '실크', '리넨']
const SYNTHETIC_MATERIALS = ['폴리에스터', '아크릴', '나일론', '스판덱스']

// 소재명을 동의어 기준으로 정규화해 분류/추천 로직 일관성을 유지한다.
export function normalizeMaterialName(name) {
  const normalized = String(name ?? '').trim().toLowerCase()
  const aliasMap = {
    코튼: '면',
    cotton: '면',
    폴리: '폴리에스터',
    polyester: '폴리에스터',
    acrylic: '아크릴',
    polyamide: '나일론',
    nylon: '나일론',
    elastane: '스판덱스',
    스판: '스판덱스',
    spandex: '스판덱스',
    wool: '울',
    cashmere: '캐시미어',
    silk: '실크',
    linen: '리넨',
  }
  return aliasMap[normalized] ?? String(name ?? '').trim()
}

// 소재 구성비를 기준으로 소재 구분(천연/합성/혼방)을 판정한다.
export function deriveMaterialType(materials) {
  if (!Array.isArray(materials) || materials.length === 0) return '혼방'
  const normalized = materials.map(material => ({
    ...material,
    name: normalizeMaterialName(material.name),
  }))
  if (normalized.length >= 2) return '혼방'

  const [single] = normalized
  if (Number(single.ratio) !== 100) return '혼방'
  if (NATURAL_SINGLE_MATERIALS.includes(single.name)) return '천연 단일 섬유'
  if (SYNTHETIC_MATERIALS.includes(single.name)) return '합성 섬유'
  return '혼방'
}

// 소재 구분값을 거래처 적합도 코드로 변환한다.
export function buyerMaterialFitValue(materialType) {
  if (materialType === '천연 단일 섬유') return 'natural-single'
  if (materialType === '합성 섬유') return 'synthetic'
  return 'blended'
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

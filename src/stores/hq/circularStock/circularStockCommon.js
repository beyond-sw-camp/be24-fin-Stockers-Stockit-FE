export const INVENTORY_STORAGE_KEY = 'stockit_circular_inventory_inventory_v2'

const RAW_INITIAL_INVENTORY = []

export function roundTo(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function inventoryQuantitySeed(id) {
  return 760 + (String(id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 520)
}

function expandSeedInventoryItem(item) {
  const originalQuantity = Math.max(1, Number(item.quantity) || 1)
  const originalWeightKg = roundTo(Number(item.weightKg) || 0)
  const unitWeightKg = originalWeightKg > 0 ? originalWeightKg / originalQuantity : 0
  const expandedQuantity = Math.max(originalQuantity, inventoryQuantitySeed(item.id))
  const expandedWeightKg = roundTo(unitWeightKg * expandedQuantity, 1)

  return {
    ...item,
    quantity: expandedQuantity,
    weightKg: expandedWeightKg,
  }
}

export const INITIAL_INVENTORY = RAW_INITIAL_INVENTORY.map(expandSeedInventoryItem)

export function formatWeight(weightKg) {
  return `${roundTo(weightKg).toFixed(2)}kg`
}

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

export function loadJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : fallback
  } catch {
    return fallback
  }
}

export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function parseWeightLabel(weight) {
  return Number(String(weight ?? '').replace('kg', '')) || 0
}

const NATURAL_SINGLE_MATERIALS = ['면', '울', '캐시미어', '실크', '리넨']
const SYNTHETIC_MATERIALS = ['폴리에스터', '아크릴', '나일론', '스판덱스']

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

export function buyerMaterialFitValue(materialType) {
  if (materialType === '천연 단일 섬유') return 'natural-single'
  if (materialType === '합성 섬유') return 'synthetic'
  return 'blended'
}

import { reactive } from 'vue'

// 옵션 facet 필터: { [axisName]: Set<value> }.
// 같은 axis 안 OR (예: 색상 = 빨강 OR 파랑), 다른 axis 끼리 AND (색상 AND 사이즈).
export function useFacets() {
  const activeFacetFilters = reactive({})

  function toggleFacet(axisName, value) {
    const cur = activeFacetFilters[axisName] ?? new Set()
    const next = new Set(cur)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    if (next.size === 0) delete activeFacetFilters[axisName]
    else activeFacetFilters[axisName] = next
  }

  function isFacetActive(axisName, value) {
    return activeFacetFilters[axisName]?.has(value) ?? false
  }

  function clearFacets() {
    for (const k of Object.keys(activeFacetFilters)) delete activeFacetFilters[k]
  }

  function skuMatchesFacets(row) {
    const filters = Object.entries(activeFacetFilters)
    if (filters.length === 0) return true
    for (const [axisName, valueSet] of filters) {
      const current = axisName === '색상' ? row.color : axisName === '사이즈' ? row.size : ''
      if (!valueSet.has(current)) return false
    }
    return true
  }

  return {
    activeFacetFilters,
    toggleFacet,
    isFacetActive,
    clearFacets,
    skuMatchesFacets,
  }
}

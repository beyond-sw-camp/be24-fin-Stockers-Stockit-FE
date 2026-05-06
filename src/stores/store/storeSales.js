/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * ==============================================================================
 * 2. STATE & REFS
 * ==============================================================================
 */
export const useSalesStore = defineStore('sales', () => {
  const sales = ref([])
  const selectedSale = ref(null)
  const loading = ref(false)
  const error = ref('')

  /**
   * ==============================================================================
   * 3. COMPUTED
   * ==============================================================================
   */
  const sortedSales = computed(() =>
    [...sales.value].sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt)),
  )

  /**
   * ==============================================================================
   * 4. METHODS
   * ==============================================================================
   */
  // [함수] 판매 목록 상태를 통째로 교체한다.
  function setSales(list) {
    sales.value = Array.isArray(list) ? list : []
  }

  // [함수] 신규 판매 건을 목록 맨 앞에 추가한다.
  function prependSale(sale) {
    if (!sale) return
    sales.value = [sale, ...sales.value]
  }

  // [함수] 현재 선택된 판매 건 상태를 갱신한다.
  function setSelectedSale(sale) {
    selectedSale.value = sale ?? null
  }

  // [함수] 로딩 상태를 불리언 값으로 설정한다.
  function setLoading(value) {
    loading.value = !!value
  }

  // [함수] 에러 메시지 상태를 설정한다.
  function setError(message) {
    error.value = message ?? ''
  }

  /**
   * ==============================================================================
   * 5. EXPORTS
   * ==============================================================================
   */
  return {
    sales,
    selectedSale,
    loading,
    error,
    sortedSales,
    setSales,
    prependSale,
    setSelectedSale,
    setLoading,
    setError,
  }
})


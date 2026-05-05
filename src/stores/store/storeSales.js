import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useSalesStore = defineStore('sales', () => {
  const sales = ref([])
  const selectedSale = ref(null)
  const loading = ref(false)
  const error = ref('')

  const sortedSales = computed(() =>
    [...sales.value].sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt)),
  )

  function setSales(list) {
    sales.value = Array.isArray(list) ? list : []
  }

  function prependSale(sale) {
    if (!sale) return
    sales.value = [sale, ...sales.value]
  }

  function setSelectedSale(sale) {
    selectedSale.value = sale ?? null
  }

  function setLoading(value) {
    loading.value = !!value
  }

  function setError(message) {
    error.value = message ?? ''
  }

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


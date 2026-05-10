/**
 * ==============================================================================
 * 1. IMPORTS
 * ==============================================================================
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * ==============================================================================
 * 2. CONSTANTS
 * ==============================================================================
 */
const DEFAULT_REQUESTED_BY = '김지현'

const INBOUND_STATUS_LABEL = {
  READY_TO_SHIP: '출고 준비중',
  IN_TRANSIT: '배송중',
  ARRIVED: '배송완료',
  PENDING_RECEIPT: '입고 대기',
  RECEIVED: '입고 완료',
}

/**
 * ==============================================================================
 * 4. STATE & REFS
 * ==============================================================================
 */
export const useStoreOrderStore = defineStore('storeOrder', () => {
  const orders = ref([])

  const inboundActiveStatusTab = ref('ALL')
  const inboundSearchKeyword = ref('')
  const inboundDateFrom = ref('')
  const inboundDateTo = ref('')
  const inboundSortBy = ref('latest')

  /**
   * ==============================================================================
   * 5. METHODS - QUERY
   * ==============================================================================
   */
  // [함수] 주문 ID로 단건 발주 데이터를 조회한다.
  function getOrderById(orderId) {
    return orders.value.find((order) => order.orderId === orderId) ?? null
  }

  /**
   * ==============================================================================
   * 6. EXPORTS
   * ==============================================================================
   */
  return {
    orders,
    inboundActiveStatusTab,
    inboundSearchKeyword,
    inboundDateFrom,
    inboundDateTo,
    inboundSortBy,
    inboundStatusLabelMap: INBOUND_STATUS_LABEL,
    getOrderById,
  }
})

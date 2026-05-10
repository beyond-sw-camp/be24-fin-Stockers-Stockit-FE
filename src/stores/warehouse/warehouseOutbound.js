import { defineStore } from 'pinia'
import { ref } from 'vue'

const OUTBOUND_STATUS_LABEL = {
  READY_TO_SHIP: '출고 준비중',
  IN_TRANSIT: '배송중',
  ARRIVED: '배송 완료',
}

const OUTBOUND_TYPE_LABEL = {
  STORE_OUTBOUND: '매장 출고',
  WH_TRANSFER: '창고간 이동',
  CIRCULAR_SALE: '순환재고 판매',
}

export const useWarehouseOutboundStore = defineStore('warehouseOutbound', () => {
  const activeStatusTab = ref('ALL')
  const searchKeyword = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')

  return {
    activeStatusTab,
    searchKeyword,
    dateFrom,
    dateTo,
    outboundStatusLabelMap: OUTBOUND_STATUS_LABEL,
    outboundTypeLabelMap: OUTBOUND_TYPE_LABEL,
  }
})

import { computed, reactive } from 'vue'
import { useStoreOrderStore } from '@/stores/storeOrder.js'

export const useStoreInboundStore = () => {
  const storeOrder = useStoreOrderStore()

  const statusTabs = [
    { label: '전체', key: 'ALL' },
    { label: '배송 준비중', key: 'READY_TO_SHIP' },
    { label: '배송 중', key: 'IN_TRANSIT' },
    { label: '배송 완료', key: 'ARRIVED' },
    { label: '입고 완료', key: 'RECEIVED' },
  ]

  const isValidStatusTab = (value) => statusTabs.some((tab) => tab.key === value)

  const arrivedOrders = computed(() =>
    storeOrder.inboundListOrders.filter(
      (order) => order.inboundStatus === 'ARRIVED' && order.status === 'APPROVED',
    ),
  )

  const arrivedOrderCount = computed(() => arrivedOrders.value.length)
  const inboundStatusCounts = computed(() => ({
    ...storeOrder.inboundStatusCounts,
    ALL: storeOrder.inboundStatusCounts?.ALL ?? storeOrder.inboundStatusCounts?.전체 ?? 0,
  }))
  const inboundListOrders = computed(() => storeOrder.inboundListOrders)
  const inboundHistoryOrders = computed(() => storeOrder.inboundHistoryOrders)
  const filteredInboundList = computed(() => storeOrder.filteredInboundList)
  const filteredInboundHistory = computed(() => storeOrder.filteredInboundHistory)
  const inboundSummary = computed(() => storeOrder.inboundSummary)
  const inboundAnalytics = computed(() => storeOrder.inboundAnalytics)
  const inboundStatusLabelMap = computed(() => storeOrder.inboundStatusLabelMap)

  function normalizeStatusTab() {
    if (!isValidStatusTab(storeOrder.inboundActiveStatusTab)) {
      storeOrder.inboundActiveStatusTab = statusTabs[0].key
    }
  }

  function setInboundStatusTab(value) {
    storeOrder.inboundActiveStatusTab = value
  }

  function activateHistoryMode() {
    setInboundStatusTab('RECEIVED')
  }

  function focusArrivedOrders() {
    setInboundStatusTab('ARRIVED')
  }

  function canHandleInbound(order) {
    return order?.inboundStatus === 'ARRIVED' && order?.status === 'APPROVED'
  }

  function inboundActionLabel(order) {
    if (order?.inboundStatus === 'READY_TO_SHIP' || order?.inboundStatus === 'IN_TRANSIT') {
      return '대기'
    }
    if (order?.inboundStatus === 'RECEIVED' || order?.status === 'COMPLETED') {
      return '처리 완료'
    }
    return '-'
  }

  function getFirstArrivedOrderId() {
    return arrivedOrders.value[0]?.orderId ?? ''
  }

  return reactive({
    inboundActiveStatusTab: computed({
      get: () => storeOrder.inboundActiveStatusTab,
      set: (value) => {
        storeOrder.inboundActiveStatusTab = value
      },
    }),
    inboundSearchKeyword: computed({
      get: () => storeOrder.inboundSearchKeyword,
      set: (value) => {
        storeOrder.inboundSearchKeyword = value
      },
    }),
    inboundDateFrom: computed({
      get: () => storeOrder.inboundDateFrom,
      set: (value) => {
        storeOrder.inboundDateFrom = value
      },
    }),
    inboundDateTo: computed({
      get: () => storeOrder.inboundDateTo,
      set: (value) => {
        storeOrder.inboundDateTo = value
      },
    }),
    inboundSortBy: computed({
      get: () => storeOrder.inboundSortBy,
      set: (value) => {
        storeOrder.inboundSortBy = value
      },
    }),
    inboundListOrders,
    inboundHistoryOrders,
    arrivedOrders,
    arrivedOrderCount,
    filteredInboundList,
    filteredInboundHistory,
    inboundStatusCounts,
    inboundSummary,
    inboundAnalytics,
    statusTabs,
    inboundStatusLabelMap,
    getOrderById: storeOrder.getOrderById,
    normalizeStatusTab,
    setInboundStatusTab,
    activateHistoryMode,
    focusArrivedOrders,
    canHandleInbound,
    inboundActionLabel,
    getFirstArrivedOrderId,
    confirmInbound: storeOrder.confirmInbound,
  })
}

import { computed, reactive } from 'vue'
import { useStoreOrderStore } from '@/stores/store/storeOrder.js'

function isAllInboundTab(value) {
  return value === '전체' || value === 'ALL'
}

function buildInboundHeadline(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) return '-'
  return order.items.length > 1
    ? `${order.items[0].productName} 외 ${order.items.length - 1}건`
    : order.items[0].productName
}

export const useStoreInboundStore = () => {
  const storeOrder = useStoreOrderStore()

  const inboundHistoryOrders = computed(() =>
    storeOrder.orders.filter(
      (order) =>
        (order.status === 'APPROVED' || order.status === 'COMPLETED')
        && order.inboundStatus
        && order.status === 'COMPLETED'
        && order.inboundStatus === 'RECEIVED',
    ),
  )

  function filterInboundOrders(baseOrders, includeReceived = false) {
    let list = [...baseOrders]

    if (includeReceived && storeOrder.inboundActiveStatusTab === 'RECEIVED') {
      list = list.filter((order) => order.status === 'COMPLETED' && order.inboundStatus === 'RECEIVED')
    } else if (!includeReceived && !isAllInboundTab(storeOrder.inboundActiveStatusTab)) {
      list = list.filter((order) => order.inboundStatus === storeOrder.inboundActiveStatusTab)
    }

    const keyword = storeOrder.inboundSearchKeyword.trim().toLowerCase()
    if (keyword) {
      list = list.filter((order) => {
        const haystack = [
          order.orderId,
          buildInboundHeadline(order),
          order.memo,
          ...(order.items ?? []).map((item) =>
            [item.itemCode, item.productName, item.mainCategory, item.subCategory].join(' ')),
        ].join(' ').toLowerCase()
        return haystack.includes(keyword)
      })
    }

    const dateField = includeReceived ? 'inboundCompletedAt' : 'requestedAt'
    if (storeOrder.inboundDateFrom) {
      list = list.filter(
        (order) => (order[dateField] || order.requestedAt).slice(0, 10) >= storeOrder.inboundDateFrom,
      )
    }
    if (storeOrder.inboundDateTo) {
      list = list.filter(
        (order) => (order[dateField] || order.requestedAt).slice(0, 10) <= storeOrder.inboundDateTo,
      )
    }

    const sorted = [...list]
    switch (storeOrder.inboundSortBy) {
      case 'oldest':
        sorted.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt))
        break
      case 'qtyDesc':
        sorted.sort((a, b) => b.totalRequestedQuantity - a.totalRequestedQuantity)
        break
      case 'qtyAsc':
        sorted.sort((a, b) => a.totalRequestedQuantity - b.totalRequestedQuantity)
        break
      default:
        sorted.sort((a, b) => {
          const dateA = a.inboundStatus === 'RECEIVED' ? a.inboundCompletedAt || a.requestedAt : a.requestedAt
          const dateB = b.inboundStatus === 'RECEIVED' ? b.inboundCompletedAt || b.requestedAt : b.requestedAt
          return dateB.localeCompare(dateA)
        })
    }
    return sorted
  }

  const filteredInboundHistory = computed(() => filterInboundOrders(inboundHistoryOrders.value, true))

  const inboundSummary = computed(() => ({
    totalCompletedOrders: inboundHistoryOrders.value.length,
    totalCompletedQuantity: inboundHistoryOrders.value.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.expectedInboundQuantity, 0),
      0,
    ),
    readyToShipCount: 0,
    inTransitCount: 0,
    arrivedCount: 0,
    receivedCount: inboundHistoryOrders.value.length,
  }))

  function setInboundStatusTab(value) {
    storeOrder.inboundActiveStatusTab = value
  }

  function activateHistoryMode() {
    setInboundStatusTab('RECEIVED')
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
    inboundHistoryOrders,
    filteredInboundHistory,
    inboundSummary,
    activateHistoryMode,
  })
}

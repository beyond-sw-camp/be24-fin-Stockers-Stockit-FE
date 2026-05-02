import { computed, reactive } from 'vue'
import { useStoreOrderStore } from '@/stores/storeOrder.js'

function isAllInboundTab(value) {
  return value === '전체' || value === 'ALL'
}

function compareMainCategory(aCategory, bCategory) {
  const rankMap = { 상의: 0, 하의: 1, 치마: 2, 아우터: 3 }
  const aRank = rankMap[aCategory] ?? 99
  const bRank = rankMap[bCategory] ?? 99
  if (aRank !== bRank) return aRank - bRank
  return String(aCategory ?? '').localeCompare(String(bCategory ?? ''), 'ko')
}

function buildInboundHeadline(order) {
  if (!order || !Array.isArray(order.items) || order.items.length === 0) return '-'
  return order.items.length > 1
    ? `${order.items[0].productName} 외 ${order.items.length - 1}건`
    : order.items[0].productName
}

export const useStoreInboundStore = () => {
  const storeOrder = useStoreOrderStore()

  const statusTabs = [
    { label: '전체', key: 'ALL' },
    { label: '배송 준비중', key: 'READY_TO_SHIP' },
    { label: '배송 중', key: 'IN_TRANSIT' },
    { label: '배송 완료', key: 'ARRIVED' },
    { label: '입고 완료', key: 'RECEIVED' },
  ]

  const inboundTargetOrders = computed(() =>
    storeOrder.orders.filter(
      (order) => (order.status === 'APPROVED' || order.status === 'COMPLETED') && order.inboundStatus,
    ),
  )

  const inboundListOrders = computed(() => inboundTargetOrders.value)
  const inboundHistoryOrders = computed(() =>
    inboundTargetOrders.value.filter(
      (order) => order.status === 'COMPLETED' && order.inboundStatus === 'RECEIVED',
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

  const filteredInboundList = computed(() => filterInboundOrders(inboundListOrders.value))
  const filteredInboundHistory = computed(() => filterInboundOrders(inboundHistoryOrders.value, true))

  const inboundStatusCounts = computed(() => ({
    ALL: inboundListOrders.value.length,
    READY_TO_SHIP: inboundListOrders.value.filter((order) => order.inboundStatus === 'READY_TO_SHIP').length,
    IN_TRANSIT: inboundListOrders.value.filter((order) => order.inboundStatus === 'IN_TRANSIT').length,
    ARRIVED: inboundListOrders.value.filter((order) => order.inboundStatus === 'ARRIVED').length,
    RECEIVED: inboundListOrders.value.filter(
      (order) => order.status === 'COMPLETED' && order.inboundStatus === 'RECEIVED',
    ).length,
  }))

  const inboundSummary = computed(() => ({
    totalCompletedOrders: inboundHistoryOrders.value.length,
    totalCompletedQuantity: inboundHistoryOrders.value.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.expectedInboundQuantity, 0),
      0,
    ),
    readyToShipCount: inboundListOrders.value.filter((order) => order.inboundStatus === 'READY_TO_SHIP').length,
    inTransitCount: inboundListOrders.value.filter((order) => order.inboundStatus === 'IN_TRANSIT').length,
    arrivedCount: inboundListOrders.value.filter((order) => order.inboundStatus === 'ARRIVED').length,
    receivedCount: inboundHistoryOrders.value.length,
  }))

  const inboundAnalytics = computed(() => {
    const categoryMap = new Map()
    const statusCountMap = {
      READY_TO_SHIP: 0,
      IN_TRANSIT: 0,
      ARRIVED: 0,
      RECEIVED: 0,
    }

    for (const order of inboundTargetOrders.value) {
      if (order.inboundStatus && statusCountMap[order.inboundStatus] !== undefined) {
        statusCountMap[order.inboundStatus] += 1
      }

      for (const item of order.items) {
        const categoryKey = `${item.mainCategory}|${item.subCategory}`
        const previous = categoryMap.get(categoryKey) ?? {
          label: `${item.mainCategory} > ${item.subCategory}`,
          mainCategory: item.mainCategory,
          subCategory: item.subCategory,
          quantity: 0,
        }
        previous.quantity += item.expectedInboundQuantity
        categoryMap.set(categoryKey, previous)
      }
    }

    return {
      statusCounts: statusCountMap,
      categoryBreakdown: [...categoryMap.values()].sort((a, b) => (
        compareMainCategory(a.mainCategory, b.mainCategory)
        || a.subCategory.localeCompare(b.subCategory, 'ko')
        || b.quantity - a.quantity
      )),
    }
  })

  const arrivedOrders = computed(() =>
    inboundListOrders.value.filter(
      (order) => order.inboundStatus === 'ARRIVED' && order.status === 'APPROVED',
    ),
  )
  const arrivedOrderCount = computed(() => arrivedOrders.value.length)

  const inboundStatusLabelMap = computed(() => storeOrder.inboundStatusLabelMap)
  const isValidStatusTab = (value) => statusTabs.some((tab) => tab.key === value)

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
    inboundTargetOrders,
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

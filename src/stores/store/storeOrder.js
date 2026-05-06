import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useInventoryStore } from '@/stores/inventory.js'

const DEFAULT_REQUESTED_BY = '김도현'

const INBOUND_STATUS_LABEL = {
  READY_TO_SHIP: '배송 준비중',
  IN_TRANSIT: '배송 중',
  ARRIVED: '배송 완료',
  RECEIVED: '입고 완료',
}

function appendHistory(list, entry) {
  return [...list, entry]
}

export const useStoreOrderStore = defineStore('storeOrder', () => {
  const inventory = useInventoryStore()

  // 발주 API 연동 이후 로컬 더미 데이터는 제거한다.
  // 입고/출고 화면에서 필요한 상태 전이만 최소 유지한다.
  const orders = ref([])

  const inboundActiveStatusTab = ref('전체')
  const inboundSearchKeyword = ref('')
  const inboundDateFrom = ref('')
  const inboundDateTo = ref('')
  const inboundSortBy = ref('latest')

  function getOrderById(orderId) {
    return orders.value.find((order) => order.orderId === orderId) ?? null
  }

  function updateInboundStatus(orderId, nextStatus, byName, note) {
    const order = orders.value.find((entry) => entry.orderId === orderId)
    if (!order) return { success: false, message: '발주건을 찾을 수 없습니다.' }
    if (order.status !== 'APPROVED') {
      return { success: false, message: '승인 완료된 발주만 입고 흐름을 가집니다.' }
    }

    order.inboundStatus = nextStatus
    order.inboundStatusHistory = appendHistory(order.inboundStatusHistory ?? [], {
      status: nextStatus,
      at: new Date().toISOString(),
      byName,
      note,
    })
    return { success: true, order }
  }

  function markInTransit(orderId, byName = '서울 1센터') {
    const order = getOrderById(orderId)
    if (!order || order.inboundStatus !== 'READY_TO_SHIP') {
      return { success: false, message: '배송 준비중 상태에서만 배송 중으로 변경할 수 있습니다.' }
    }
    return updateInboundStatus(orderId, 'IN_TRANSIT', byName, '배송 출발 처리')
  }

  function confirmInbound(orderId, confirmedBy = DEFAULT_REQUESTED_BY) {
    const order = orders.value.find((entry) => entry.orderId === orderId)
    if (!order) return { success: false, message: '입고 대상을 찾을 수 없습니다.' }
    if (order.status !== 'APPROVED') {
      return { success: false, message: '승인 완료된 발주만 입고 처리할 수 있습니다.' }
    }
    if (order.inboundStatus === 'RECEIVED' || order.status === 'COMPLETED') {
      return { success: false, message: '이미 입고 완료된 발주입니다.' }
    }
    if (order.inboundStatus !== 'ARRIVED') {
      return { success: false, message: '배송 완료 상태에서만 입고 확정할 수 있습니다.' }
    }

    const result = inventory.receiveItems(
      (order.items ?? []).map((item) => ({
        skuId: item.skuId,
        quantity: item.expectedInboundQuantity,
      })),
    )
    if (!result.success) return result

    const now = new Date().toISOString()
    order.status = 'COMPLETED'
    order.inboundStatus = 'RECEIVED'
    order.inboundCompletedAt = now
    order.inboundConfirmedBy = confirmedBy
    order.statusHistory = appendHistory(order.statusHistory ?? [], {
      status: 'COMPLETED',
      at: now,
      byName: confirmedBy,
      note: '매장 입고까지 최종 완료',
    })
    order.inboundStatusHistory = appendHistory(order.inboundStatusHistory ?? [], {
      status: 'RECEIVED',
      at: now,
      byName: confirmedBy,
      note: '매장 입고 확정 완료',
    })
    return { success: true, order }
  }

  return {
    orders,
    inboundActiveStatusTab,
    inboundSearchKeyword,
    inboundDateFrom,
    inboundDateTo,
    inboundSortBy,
    inboundStatusLabelMap: INBOUND_STATUS_LABEL,
    getOrderById,
    markInTransit,
    confirmInbound,
  }
})

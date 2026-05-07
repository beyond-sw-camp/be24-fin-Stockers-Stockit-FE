import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useStoreOrderStore } from '@/stores/store/storeOrder.js'

const OUTBOUND_STATUS_LABEL = {
  READY_TO_SHIP: '출고 준비중',
  IN_TRANSIT: '배송중',
  COMPLETED: '완료',
}

const OUTBOUND_TYPE_LABEL = {
  STORE_OUTBOUND: '매장 출고',
  WH_TRANSFER: '창고간 이동',
  CIRCULAR_SALE: '순환재고 판매',
}

function toIsoDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function mapInboundToOutboundStatus(order) {
  if (order.status === 'COMPLETED' || order.inboundStatus === 'RECEIVED') return 'COMPLETED'
  if (order.inboundStatus === 'IN_TRANSIT' || order.inboundStatus === 'ARRIVED') return 'IN_TRANSIT'
  return 'READY_TO_SHIP'
}

function normalizeHistory(history = []) {
  return history.map((entry) => ({
    status: entry.status === 'RECEIVED'
      ? 'COMPLETED'
      : entry.status === 'IN_TRANSIT' || entry.status === 'ARRIVED'
        ? 'IN_TRANSIT'
        : 'READY_TO_SHIP',
    at: entry.at,
    byName: entry.byName,
    note: entry.note,
    originalStatus: entry.status,
  }))
}

function fromWarehouseTransfersMock() {
  return [
    {
      outboundId: 'OUT-WHT-20260501-001',
      orderId: 'WHT-20260501-001',
      outboundType: 'WH_TRANSFER',
      sourceType: 'WAREHOUSE',
      targetType: 'WAREHOUSE',
      sourceName: '서울 1센터',
      targetName: '인천 제1창고',
      status: 'READY_TO_SHIP',
      requestedAt: '2026-05-01T09:10:00',
      confirmedAt: '2026-05-01T09:20:00',
      confirmedBy: '서울 1센터',
      completedAt: '',
      headlineProduct: '에센셜 코튼 반팔 티셔츠',
      totalSkuCount: 2,
      totalRequestedQuantity: 12,
      actionable: false,
      items: [
        {
          skuId: 'SKU-TOP-SS-001-WHT-L',
          itemCode: 'SPA-TOP-001',
          productName: '에센셜 코튼 반팔 티셔츠',
          color: '화이트',
          size: 'L',
          mainCategory: '상의',
          subCategory: '반팔',
          requestedQuantity: 7,
          unitPrice: 29000,
        },
        {
          skuId: 'SKU-PNT-LG-002-BEI-M',
          itemCode: 'SPA-PNT-002',
          productName: '와이드 린넨 팬츠',
          color: '베이지',
          size: 'M',
          mainCategory: '바지',
          subCategory: '긴바지',
          requestedQuantity: 5,
          unitPrice: 54000,
        },
      ],
      outboundStatusHistory: [
        { status: 'READY_TO_SHIP', at: '2026-05-01T09:20:00', byName: '서울 1센터', note: '창고간 이동 출고 준비 완료', originalStatus: 'READY_TO_SHIP' },
      ],
    },
    {
      outboundId: 'OUT-WHT-20260429-001',
      orderId: 'WHT-20260429-001',
      outboundType: 'WH_TRANSFER',
      sourceType: 'WAREHOUSE',
      targetType: 'WAREHOUSE',
      sourceName: '서울 1센터',
      targetName: '부산 물류창고',
      status: 'IN_TRANSIT',
      requestedAt: '2026-04-29T15:40:00',
      confirmedAt: '2026-04-29T16:00:00',
      confirmedBy: '서울 1센터',
      completedAt: '',
      headlineProduct: '라이트 패딩 점퍼',
      totalSkuCount: 1,
      totalRequestedQuantity: 8,
      actionable: false,
      items: [
        {
          skuId: 'SKU-OUT-PD-001-KHK-M',
          itemCode: 'SPA-OUT-001',
          productName: '라이트 패딩 점퍼',
          color: '카키',
          size: 'M',
          mainCategory: '아우터',
          subCategory: '패딩',
          requestedQuantity: 8,
          unitPrice: 99000,
        },
      ],
      outboundStatusHistory: [
        { status: 'READY_TO_SHIP', at: '2026-04-29T16:00:00', byName: '서울 1센터', note: '창고간 이동 출고 준비 완료', originalStatus: 'READY_TO_SHIP' },
        { status: 'IN_TRANSIT', at: '2026-04-29T18:30:00', byName: '서울 1센터', note: '창고간 이동 배송 출발', originalStatus: 'IN_TRANSIT' },
      ],
    },
  ]
}

function fromCircularSalesMock() {
  return [
    {
      outboundId: 'OUT-CRS-20260427-001',
      orderId: 'CRS-20260427-001',
      outboundType: 'CIRCULAR_SALE',
      sourceType: 'WAREHOUSE',
      targetType: 'BUYER',
      sourceName: '서울 1센터',
      targetName: '리뉴텍스 주식회사',
      status: 'COMPLETED',
      requestedAt: '2026-04-27T10:00:00',
      confirmedAt: '2026-04-27T10:10:00',
      confirmedBy: '서울 1센터',
      completedAt: '2026-04-27T17:50:00',
      headlineProduct: '리사이클 원단 롤',
      totalSkuCount: 2,
      totalRequestedQuantity: 18,
      actionable: false,
      items: [
        {
          skuId: 'CSK-001',
          itemCode: 'CIR-FAB-001',
          productName: '리사이클 원단 롤',
          color: '-',
          size: '10m',
          mainCategory: '순환재고',
          subCategory: '원단',
          requestedQuantity: 10,
          unitPrice: 12000,
        },
        {
          skuId: 'CSK-002',
          itemCode: 'CIR-PKG-004',
          productName: '물류 패키징 보조재',
          color: '-',
          size: 'BOX',
          mainCategory: '순환재고',
          subCategory: '패키징',
          requestedQuantity: 8,
          unitPrice: 7000,
        },
      ],
      outboundStatusHistory: [
        { status: 'READY_TO_SHIP', at: '2026-04-27T10:10:00', byName: '서울 1센터', note: '순환재고 판매 출고 준비 완료', originalStatus: 'READY_TO_SHIP' },
        { status: 'IN_TRANSIT', at: '2026-04-27T13:20:00', byName: '서울 1센터', note: '순환재고 판매 출고 진행', originalStatus: 'IN_TRANSIT' },
        { status: 'COMPLETED', at: '2026-04-27T17:50:00', byName: '리뉴텍스 주식회사', note: '인수 확인 완료', originalStatus: 'COMPLETED' },
      ],
    },
  ]
}

export const useWarehouseOutboundStore = defineStore('warehouseOutbound', () => {
  const storeOrders = useStoreOrderStore()

  const activeStatusTab = ref('전체')
  const activeTypeTab = ref('전체')
  const searchKeyword = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const selectedOutboundId = ref('')

  const warehouseId = ref('WH-001')
  const warehouseName = ref('서울 1센터')

  const storeOutboundEntries = computed(() => {
    const mapped = []
    for (const order of storeOrders.orders) {
      if (!order.inboundStatus) continue
      if (!['APPROVED', 'COMPLETED'].includes(order.status)) continue

      const headlineItem = order.items?.[0]
      mapped.push({
        outboundId: `OUT-${order.orderId}`,
        orderId: order.orderId,
        outboundType: 'STORE_OUTBOUND',
        sourceType: 'WAREHOUSE',
        targetType: 'STORE',
        sourceName: warehouseName.value,
        targetName: order.storeName,
        status: mapInboundToOutboundStatus(order),
        requestedAt: order.requestedAt,
        confirmedAt: order.inboundStatusHistory?.find((history) => history.status === 'READY_TO_SHIP')?.at || '',
        confirmedBy: order.inboundStatusHistory?.find((history) => history.status === 'READY_TO_SHIP')?.byName || '',
        completedAt: order.inboundCompletedAt || '',
        headlineProduct: headlineItem?.productName || '',
        totalSkuCount: order.totalSkuCount,
        totalRequestedQuantity: order.totalRequestedQuantity,
        actionable: true,
        storeId: order.storeId,
        storeName: order.storeName,
        warehouseId: warehouseId.value,
        warehouseName: warehouseName.value,
        items: order.items || [],
        outboundStatusHistory: normalizeHistory(order.inboundStatusHistory || []),
      })
    }
    return mapped
  })

  const outboundEntries = computed(() => [
    ...storeOutboundEntries.value,
    ...fromWarehouseTransfersMock(),
    ...fromCircularSalesMock(),
  ])

  const statusCounts = computed(() => ({
    전체: outboundEntries.value.length,
    READY_TO_SHIP: outboundEntries.value.filter((entry) => entry.status === 'READY_TO_SHIP').length,
    IN_TRANSIT: outboundEntries.value.filter((entry) => entry.status === 'IN_TRANSIT').length,
    COMPLETED: outboundEntries.value.filter((entry) => entry.status === 'COMPLETED').length,
  }))

  const typeCounts = computed(() => ({
    전체: outboundEntries.value.length,
    STORE_OUTBOUND: outboundEntries.value.filter((entry) => entry.outboundType === 'STORE_OUTBOUND').length,
    WH_TRANSFER: outboundEntries.value.filter((entry) => entry.outboundType === 'WH_TRANSFER').length,
    CIRCULAR_SALE: outboundEntries.value.filter((entry) => entry.outboundType === 'CIRCULAR_SALE').length,
  }))

  function applyFilters(list, filters = {}) {
    const next = { ...filters }
    const tab = next.status ?? activeStatusTab.value
    const type = next.type ?? activeTypeTab.value
    const keyword = String(next.keyword ?? searchKeyword.value).trim().toLowerCase()
    const from = next.dateFrom ?? dateFrom.value
    const to = next.dateTo ?? dateTo.value

    let filtered = [...list]

    if (type && type !== '전체') filtered = filtered.filter((entry) => entry.outboundType === type)
    if (tab && tab !== '전체') filtered = filtered.filter((entry) => entry.status === tab)

    if (keyword) {
      filtered = filtered.filter((entry) => {
        const haystack = [
          entry.outboundId,
          entry.orderId,
          entry.sourceName,
          entry.targetName,
          entry.headlineProduct,
        ].join(' ').toLowerCase()
        return haystack.includes(keyword)
      })
    }

    if (from) filtered = filtered.filter((entry) => toIsoDate(entry.requestedAt) >= from)
    if (to) filtered = filtered.filter((entry) => toIsoDate(entry.requestedAt) <= to)

    return filtered.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
  }

  function getOutboundList(filters = {}) {
    return applyFilters(outboundEntries.value, filters)
  }

  function getCompletedHistory(filters = {}) {
    return applyFilters(outboundEntries.value.filter((entry) => entry.status === 'COMPLETED'), filters)
  }

  const filteredOutboundList = computed(() => getOutboundList())

  const selectedOutbound = computed(() =>
    outboundEntries.value.find((entry) => entry.outboundId === selectedOutboundId.value) ?? null,
  )

  function getOutboundById(outboundId) {
    return outboundEntries.value.find((entry) => entry.outboundId === outboundId) ?? null
  }

  function confirmOutbound(outboundId, actor = '서울 1센터') {
    const outbound = getOutboundById(outboundId)
    if (!outbound) return { success: false, message: '출고 건을 찾을 수 없습니다.' }
    if (outbound.outboundType !== 'STORE_OUTBOUND') {
      return { success: false, message: '해당 출고 유형은 현재 조회 전용입니다.' }
    }

    const order = storeOrders.getOrderById(outbound.orderId)
    if (!order) return { success: false, message: '원본 발주 데이터를 찾을 수 없습니다.' }
    if (order.status === 'COMPLETED' || order.inboundStatus === 'RECEIVED') {
      return { success: false, message: '이미 완료된 출고 건입니다.' }
    }
    if (order.inboundStatus !== 'READY_TO_SHIP') {
      return { success: false, message: '출고 준비중 상태에서만 출고확정할 수 있습니다.' }
    }
    return storeOrders.markInTransit(outbound.orderId, actor)
  }

  return {
    activeStatusTab,
    activeTypeTab,
    searchKeyword,
    dateFrom,
    dateTo,
    selectedOutboundId,
    warehouseId,
    warehouseName,
    outboundEntries,
    statusCounts,
    typeCounts,
    filteredOutboundList,
    selectedOutbound,
    outboundStatusLabelMap: OUTBOUND_STATUS_LABEL,
    outboundTypeLabelMap: OUTBOUND_TYPE_LABEL,
    getOutboundList,
    getOutboundById,
    getCompletedHistory,
    confirmOutbound,
  }
})

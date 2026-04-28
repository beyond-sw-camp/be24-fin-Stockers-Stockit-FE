import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useInventoryStore } from '@/stores/inventory.js'

const STORAGE_KEY = 'stockit_store_orders_v3'
const DEFAULT_STORE_ID = 'STORE-GANGNAM-01'
const DEFAULT_STORE_NAME = '강남 서초점'
const DEFAULT_REQUESTED_BY = '김도현'

const STATUS_LABEL = {
  REQUESTED: '승인 대기',
  APPROVED: '승인 완료',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

const INBOUND_STATUS_LABEL = {
  READY_TO_SHIP: '배송 준비중',
  IN_TRANSIT: '배송 중',
  ARRIVED: '배송 완료',
  RECEIVED: '입고 완료',
}

const CATEGORY_ORDER = ['상의', '바지', '치마', '아우터']

function categoryRank(category) {
  const index = CATEGORY_ORDER.indexOf(category)
  return index === -1 ? CATEGORY_ORDER.length : index
}

function compareMainCategory(aCategory, bCategory) {
  const rankDiff = categoryRank(aCategory) - categoryRank(bCategory)
  if (rankDiff !== 0) return rankDiff
  return String(aCategory ?? '').localeCompare(String(bCategory ?? ''), 'ko')
}

function toItemCode(productId, mainCategory) {
  if (productId) {
    const match = productId.match(/^PRD-([A-Z]+)-[A-Z]+-(\d+)$/)
    if (match) return `SPA-${match[1]}-${match[2]}`
  }

  const fallbackMap = {
    상의: 'TOP',
    바지: 'PNT',
    치마: 'SKT',
    아우터: 'OUT',
  }
  return `SPA-${fallbackMap[mainCategory] ?? 'SKU'}-000`
}

function createSeedItem({
  orderId,
  skuId,
  productId,
  productName,
  mainCategory,
  subCategory,
  color,
  size,
  unitPrice,
  currentStoreStock,
  safetyStock,
  requestedQuantity,
  inboundExpectedQuantity = 0,
}) {
  return {
    orderId,
    skuId,
    productId,
    itemCode: toItemCode(productId, mainCategory),
    productName,
    mainCategory,
    subCategory,
    color,
    size,
    unitPrice,
    currentStoreStock,
    inboundExpectedQuantity,
    availableStoreStock: currentStoreStock + inboundExpectedQuantity,
    safetyStock,
    recommendedQuantity: Math.max(0, safetyStock - currentStoreStock),
    requestedQuantity,
    expectedInboundQuantity: requestedQuantity,
  }
}

const SEED_ORDERS = [
  {
    orderId: 'SOR-20260429-001',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-29T09:20:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'REQUESTED',
    totalSkuCount: 2,
    totalRequestedQuantity: 7,
    memo: '주말 행사 대비 반팔 티셔츠와 가디건 선보충 요청',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-29T09:20:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
    ],
    inboundStatus: null,
    inboundCompletedAt: '',
    inboundConfirmedBy: '',
    inboundStatusHistory: [],
    items: [
      createSeedItem({
        orderId: 'SOR-20260429-001',
        skuId: 'SKU-TOP-SS-001-WHT-L',
        productId: 'PRD-TOP-SS-001',
        productName: '에센셜 코튼 반팔 티셔츠',
        mainCategory: '상의',
        subCategory: '반팔',
        color: '화이트',
        size: 'L',
        unitPrice: 29000,
        currentStoreStock: 7,
        safetyStock: 8,
        requestedQuantity: 4,
        inboundExpectedQuantity: 5,
      }),
      createSeedItem({
        orderId: 'SOR-20260429-001',
        skuId: 'SKU-OUT-CD-004-IVR-S',
        productId: 'PRD-OUT-CD-004',
        productName: '브이넥 가디건',
        mainCategory: '아우터',
        subCategory: '가디건',
        color: '아이보리',
        size: 'S',
        unitPrice: 57000,
        currentStoreStock: 11,
        safetyStock: 4,
        requestedQuantity: 3,
      }),
    ],
  },
  {
    orderId: 'SOR-20260428-001',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-28T10:10:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'APPROVED',
    totalSkuCount: 1,
    totalRequestedQuantity: 6,
    memo: '청바지 30사이즈 부족분 보충',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-28T10:10:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-29T12:00:00', byName: '시스템', note: '배치 승인 완료' },
    ],
    inboundStatus: 'READY_TO_SHIP',
    inboundCompletedAt: '',
    inboundConfirmedBy: '',
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-29T12:01:00', byName: '시스템', note: '창고 출고 준비 대기' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260428-001',
        skuId: 'SKU-PNT-DN-001-IND-30',
        productId: 'PRD-PNT-DN-001',
        productName: '스트레이트 청바지',
        mainCategory: '바지',
        subCategory: '청바지',
        color: '인디고',
        size: '30',
        unitPrice: 69000,
        currentStoreStock: 18,
        safetyStock: 5,
        requestedQuantity: 6,
        inboundExpectedQuantity: 2,
      }),
    ],
  },
  {
    orderId: 'SOR-20260427-001',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-27T11:05:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'APPROVED',
    totalSkuCount: 2,
    totalRequestedQuantity: 9,
    memo: '행사 진열용 후드티와 패딩 출고 준비',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-27T11:05:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-28T12:00:00', byName: '시스템', note: '배치 승인 완료' },
    ],
    inboundStatus: 'READY_TO_SHIP',
    inboundCompletedAt: '',
    inboundConfirmedBy: '',
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-28T12:10:00', byName: '시스템', note: '창고 출고 준비 완료' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260427-001',
        skuId: 'SKU-TOP-HD-004-GRY-L',
        productId: 'PRD-TOP-HD-004',
        productName: '클래식 후드티',
        mainCategory: '상의',
        subCategory: '후드티',
        color: '그레이',
        size: 'L',
        unitPrice: 62000,
        currentStoreStock: 10,
        safetyStock: 4,
        requestedQuantity: 5,
      }),
      createSeedItem({
        orderId: 'SOR-20260427-001',
        skuId: 'SKU-OUT-PD-001-KHK-M',
        productId: 'PRD-OUT-PD-001',
        productName: '라이트 패딩 점퍼',
        mainCategory: '아우터',
        subCategory: '패딩',
        color: '카키',
        size: 'M',
        unitPrice: 99000,
        currentStoreStock: 5,
        safetyStock: 3,
        requestedQuantity: 4,
      }),
    ],
  },
  {
    orderId: 'SOR-20260426-001',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-26T15:10:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'APPROVED',
    totalSkuCount: 2,
    totalRequestedQuantity: 10,
    memo: '진열 교체용 셔츠와 데님 보충',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-26T15:10:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-27T12:00:00', byName: '시스템', note: '배치 승인 완료' },
    ],
    inboundStatus: 'IN_TRANSIT',
    inboundCompletedAt: '',
    inboundConfirmedBy: '',
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-27T12:05:00', byName: '시스템', note: '창고 출고 준비 완료' },
      { status: 'IN_TRANSIT', at: '2026-04-27T18:20:00', byName: '서울 1센터', note: '배송 출발 처리' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260426-001',
        skuId: 'SKU-TOP-SH-002-BLU-M',
        productId: 'PRD-TOP-SH-002',
        productName: '오버핏 데님 셔츠',
        mainCategory: '상의',
        subCategory: '셔츠',
        color: '블루',
        size: 'M',
        unitPrice: 59000,
        currentStoreStock: 14,
        safetyStock: 5,
        requestedQuantity: 4,
      }),
      createSeedItem({
        orderId: 'SOR-20260426-001',
        skuId: 'SKU-PNT-DN-001-IND-28',
        productId: 'PRD-PNT-DN-001',
        productName: '스트레이트 청바지',
        mainCategory: '바지',
        subCategory: '청바지',
        color: '인디고',
        size: '28',
        unitPrice: 69000,
        currentStoreStock: 12,
        safetyStock: 5,
        requestedQuantity: 6,
      }),
    ],
  },
  {
    orderId: 'SOR-20260425-001',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-25T09:40:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'APPROVED',
    totalSkuCount: 1,
    totalRequestedQuantity: 7,
    memo: '롱스커트 배송 출발 완료',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-25T09:40:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-26T12:00:00', byName: '시스템', note: '배치 승인 완료' },
    ],
    inboundStatus: 'IN_TRANSIT',
    inboundCompletedAt: '',
    inboundConfirmedBy: '',
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-26T12:05:00', byName: '시스템', note: '창고 출고 준비 완료' },
      { status: 'IN_TRANSIT', at: '2026-04-26T17:00:00', byName: '서울 1센터', note: '배송 출발 처리' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260425-001',
        skuId: 'SKU-SKT-LG-002-NVY-M',
        productId: 'PRD-SKT-LG-002',
        productName: '플리츠 롱스커트',
        mainCategory: '치마',
        subCategory: '롱스커트',
        color: '네이비',
        size: 'M',
        unitPrice: 52000,
        currentStoreStock: 8,
        safetyStock: 4,
        requestedQuantity: 7,
      }),
    ],
  },
  {
    orderId: 'SOR-20260424-001',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-24T16:30:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'APPROVED',
    totalSkuCount: 2,
    totalRequestedQuantity: 9,
    memo: '오늘 도착 예정 입고 대기',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-24T16:30:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-25T12:00:00', byName: '시스템', note: '배치 승인 완료' },
    ],
    inboundStatus: 'ARRIVED',
    inboundCompletedAt: '',
    inboundConfirmedBy: '',
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-25T12:01:00', byName: '시스템', note: '창고 출고 준비 완료' },
      { status: 'IN_TRANSIT', at: '2026-04-25T18:20:00', byName: '서울 1센터', note: '배송 출발 처리' },
      { status: 'ARRIVED', at: '2026-04-26T09:10:00', byName: DEFAULT_STORE_NAME, note: '매장 도착 확인' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260424-001',
        skuId: 'SKU-SKT-MN-001-BLK-S',
        productId: 'PRD-SKT-MN-001',
        productName: 'A라인 미니스커트',
        mainCategory: '치마',
        subCategory: '미니스커트',
        color: '블랙',
        size: 'S',
        unitPrice: 43000,
        currentStoreStock: 6,
        safetyStock: 4,
        requestedQuantity: 4,
      }),
      createSeedItem({
        orderId: 'SOR-20260424-001',
        skuId: 'SKU-OUT-HZ-002-GRY-L',
        productId: 'PRD-OUT-HZ-002',
        productName: '코튼 후드집업',
        mainCategory: '아우터',
        subCategory: '후드집업',
        color: '그레이',
        size: 'L',
        unitPrice: 65000,
        currentStoreStock: 13,
        safetyStock: 4,
        requestedQuantity: 5,
      }),
    ],
  },
  {
    orderId: 'SOR-20260423-002',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-23T14:20:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'APPROVED',
    totalSkuCount: 1,
    totalRequestedQuantity: 6,
    memo: '패딩 도착 후 검수 대기',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-23T14:20:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-24T12:00:00', byName: '시스템', note: '배치 승인 완료' },
    ],
    inboundStatus: 'ARRIVED',
    inboundCompletedAt: '',
    inboundConfirmedBy: '',
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-24T12:01:00', byName: '시스템', note: '창고 출고 준비 완료' },
      { status: 'IN_TRANSIT', at: '2026-04-24T17:30:00', byName: '서울 1센터', note: '배송 출발 처리' },
      { status: 'ARRIVED', at: '2026-04-25T08:50:00', byName: DEFAULT_STORE_NAME, note: '매장 도착 확인' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260423-002',
        skuId: 'SKU-OUT-PD-001-KHK-M',
        productId: 'PRD-OUT-PD-001',
        productName: '라이트 패딩 점퍼',
        mainCategory: '아우터',
        subCategory: '패딩',
        color: '카키',
        size: 'M',
        unitPrice: 99000,
        currentStoreStock: 5,
        safetyStock: 3,
        requestedQuantity: 6,
      }),
    ],
  },
  {
    orderId: 'SOR-20260422-002',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-22T09:00:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'COMPLETED',
    totalSkuCount: 2,
    totalRequestedQuantity: 7,
    memo: '이전 주말 행사분 입고 완료',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-22T09:00:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-23T12:00:00', byName: '시스템', note: '배치 승인 완료' },
      { status: 'COMPLETED', at: '2026-04-25T10:20:00', byName: DEFAULT_REQUESTED_BY, note: '매장 입고까지 최종 완료' },
    ],
    inboundStatus: 'RECEIVED',
    inboundCompletedAt: '2026-04-25T10:20:00',
    inboundConfirmedBy: DEFAULT_REQUESTED_BY,
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-23T12:01:00', byName: '시스템', note: '창고 출고 준비 완료' },
      { status: 'IN_TRANSIT', at: '2026-04-23T18:30:00', byName: '서울 1센터', note: '배송 출발 처리' },
      { status: 'ARRIVED', at: '2026-04-24T08:40:00', byName: DEFAULT_STORE_NAME, note: '매장 도착 확인' },
      { status: 'RECEIVED', at: '2026-04-25T10:20:00', byName: DEFAULT_REQUESTED_BY, note: '매장 입고 확정 완료' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260422-002',
        skuId: 'SKU-TOP-SH-002-BLU-M',
        productId: 'PRD-TOP-SH-002',
        productName: '오버핏 데님 셔츠',
        mainCategory: '상의',
        subCategory: '셔츠',
        color: '블루',
        size: 'M',
        unitPrice: 59000,
        currentStoreStock: 14,
        safetyStock: 5,
        requestedQuantity: 3,
      }),
      createSeedItem({
        orderId: 'SOR-20260422-002',
        skuId: 'SKU-PNT-LG-002-BEI-M',
        productId: 'PRD-PNT-LG-002',
        productName: '와이드 린넨 팬츠',
        mainCategory: '바지',
        subCategory: '긴바지',
        color: '베이지',
        size: 'M',
        unitPrice: 54000,
        currentStoreStock: 9,
        safetyStock: 4,
        requestedQuantity: 4,
      }),
    ],
  },
  {
    orderId: 'SOR-20260421-002',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-21T13:25:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'COMPLETED',
    totalSkuCount: 1,
    totalRequestedQuantity: 5,
    memo: '가디건 긴급 보충 건 입고 완료',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-21T13:25:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-22T12:00:00', byName: '시스템', note: '배치 승인 완료' },
      { status: 'COMPLETED', at: '2026-04-24T09:55:00', byName: DEFAULT_REQUESTED_BY, note: '매장 입고까지 최종 완료' },
    ],
    inboundStatus: 'RECEIVED',
    inboundCompletedAt: '2026-04-24T09:55:00',
    inboundConfirmedBy: DEFAULT_REQUESTED_BY,
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-22T12:02:00', byName: '시스템', note: '창고 출고 준비 완료' },
      { status: 'IN_TRANSIT', at: '2026-04-22T18:10:00', byName: '서울 1센터', note: '배송 출발 처리' },
      { status: 'ARRIVED', at: '2026-04-23T09:00:00', byName: DEFAULT_STORE_NAME, note: '매장 도착 확인' },
      { status: 'RECEIVED', at: '2026-04-24T09:55:00', byName: DEFAULT_REQUESTED_BY, note: '매장 입고 확정 완료' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260421-002',
        skuId: 'SKU-OUT-CD-004-IVR-S',
        productId: 'PRD-OUT-CD-004',
        productName: '브이넥 가디건',
        mainCategory: '아우터',
        subCategory: '가디건',
        color: '아이보리',
        size: 'S',
        unitPrice: 57000,
        currentStoreStock: 11,
        safetyStock: 4,
        requestedQuantity: 5,
      }),
    ],
  },
  {
    orderId: 'SOR-20260420-001',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-20T10:45:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'COMPLETED',
    totalSkuCount: 2,
    totalRequestedQuantity: 8,
    memo: '상의/치마 묶음 발주 입고 종료',
    cancelReason: '',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-20T10:45:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'APPROVED', at: '2026-04-21T12:00:00', byName: '시스템', note: '배치 승인 완료' },
      { status: 'COMPLETED', at: '2026-04-23T11:35:00', byName: DEFAULT_REQUESTED_BY, note: '매장 입고까지 최종 완료' },
    ],
    inboundStatus: 'RECEIVED',
    inboundCompletedAt: '2026-04-23T11:35:00',
    inboundConfirmedBy: DEFAULT_REQUESTED_BY,
    inboundStatusHistory: [
      { status: 'READY_TO_SHIP', at: '2026-04-21T12:04:00', byName: '시스템', note: '창고 출고 준비 완료' },
      { status: 'IN_TRANSIT', at: '2026-04-21T17:40:00', byName: '서울 1센터', note: '배송 출발 처리' },
      { status: 'ARRIVED', at: '2026-04-22T08:15:00', byName: DEFAULT_STORE_NAME, note: '매장 도착 확인' },
      { status: 'RECEIVED', at: '2026-04-23T11:35:00', byName: DEFAULT_REQUESTED_BY, note: '매장 입고 확정 완료' },
    ],
    items: [
      createSeedItem({
        orderId: 'SOR-20260420-001',
        skuId: 'SKU-TOP-SS-001-BLK-S',
        productId: 'PRD-TOP-SS-001',
        productName: '에센셜 코튼 반팔 티셔츠',
        mainCategory: '상의',
        subCategory: '반팔',
        color: '블랙',
        size: 'S',
        unitPrice: 29000,
        currentStoreStock: 22,
        safetyStock: 6,
        requestedQuantity: 4,
      }),
      createSeedItem({
        orderId: 'SOR-20260420-001',
        skuId: 'SKU-SKT-LG-002-NVY-M',
        productId: 'PRD-SKT-LG-002',
        productName: '플리츠 롱스커트',
        mainCategory: '치마',
        subCategory: '롱스커트',
        color: '네이비',
        size: 'M',
        unitPrice: 52000,
        currentStoreStock: 8,
        safetyStock: 4,
        requestedQuantity: 4,
      }),
    ],
  },
  {
    orderId: 'SOR-20260419-001',
    storeId: DEFAULT_STORE_ID,
    storeName: DEFAULT_STORE_NAME,
    requestedAt: '2026-04-19T14:45:00',
    requestedBy: DEFAULT_REQUESTED_BY,
    status: 'CANCELLED',
    totalSkuCount: 1,
    totalRequestedQuantity: 2,
    memo: '중복 요청으로 취소',
    cancelReason: '동일 SKU를 다른 발주건으로 다시 요청하여 취소',
    approvalPolicyNote: '익일 12시 배치 승인 대상',
    statusHistory: [
      { status: 'REQUESTED', at: '2026-04-19T14:45:00', byName: DEFAULT_REQUESTED_BY, note: '매장 발주 요청 등록' },
      { status: 'CANCELLED', at: '2026-04-19T16:12:00', byName: DEFAULT_REQUESTED_BY, note: '매장 요청 취소' },
    ],
    inboundStatus: null,
    inboundCompletedAt: '',
    inboundConfirmedBy: '',
    inboundStatusHistory: [],
    items: [
      createSeedItem({
        orderId: 'SOR-20260419-001',
        skuId: 'SKU-OUT-JK-003-BLK-M',
        productId: 'PRD-OUT-JK-003',
        productName: '싱글 자켓',
        mainCategory: '아우터',
        subCategory: '자켓',
        color: '블랙',
        size: 'M',
        unitPrice: 89000,
        currentStoreStock: 4,
        safetyStock: 3,
        requestedQuantity: 2,
        inboundExpectedQuantity: 1,
      }),
    ],
  },
]

function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveOrders(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function pad(value) {
  return String(value).padStart(2, '0')
}

function generateOrderId(list) {
  const now = new Date()
  const prefix = `SOR-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const count = list.filter((order) => order.orderId.startsWith(prefix)).length + 1
  return `${prefix}-${String(count).padStart(3, '0')}`
}

function inboundExpectedForSku(sku) {
  if (!sku) return 0
  if (sku.stock === 0) return 4
  if (sku.stock <= sku.safetyStock) return 2
  return Math.max(0, sku.safetyStock - sku.stock)
}

function normalizeInboundHistory(order) {
  if (Array.isArray(order.inboundStatusHistory) && order.inboundStatusHistory.length > 0) {
    return order.inboundStatusHistory
  }

  if (order.status === 'APPROVED' || order.status === 'COMPLETED') {
    return [
      {
        status: order.inboundStatus ?? 'READY_TO_SHIP',
        at: order.requestedAt,
        byName: '시스템',
        note: '입고 흐름 생성',
      },
    ]
  }

  return []
}

function plusDays(iso, days) {
  if (!iso) return ''
  const date = new Date(iso)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function resolveInboundExpectedAt(order) {
  if (order.inboundExpectedAt) return order.inboundExpectedAt

  const arrivedHistory = Array.isArray(order.inboundStatusHistory)
    ? order.inboundStatusHistory.find((history) => history.status === 'ARRIVED')
    : null

  if (arrivedHistory?.at) return arrivedHistory.at
  if (order.inboundStatus === 'IN_TRANSIT') return plusDays(order.requestedAt, 1)
  if (order.inboundStatus === 'READY_TO_SHIP') return plusDays(order.requestedAt, 2)
  if (order.inboundStatus === 'RECEIVED') return order.inboundCompletedAt || plusDays(order.requestedAt, 2)
  if (order.inboundStatus === 'ARRIVED') return plusDays(order.requestedAt, 1)
  return ''
}

function normalizeOrder(order) {
  const items = (order.items ?? []).map((item) => {
    const currentStoreStock = Number(item.currentStoreStock ?? 0)
    const inboundExpectedQuantity = Number(item.inboundExpectedQuantity ?? 0)
    const requestedQuantity = Number(item.requestedQuantity ?? 0)
    return {
      orderId: order.orderId,
      ...item,
      itemCode: item.itemCode ?? toItemCode(item.productId, item.mainCategory),
      requestedQuantity,
      expectedInboundQuantity: Number(item.expectedInboundQuantity ?? requestedQuantity),
      currentStoreStock,
      inboundExpectedQuantity,
      availableStoreStock: Number(
        item.availableStoreStock ?? currentStoreStock + inboundExpectedQuantity,
      ),
      safetyStock: Number(item.safetyStock ?? 0),
      recommendedQuantity: Number(item.recommendedQuantity ?? 0),
    }
  })

  const normalized = {
    ...order,
    storeId: order.storeId ?? DEFAULT_STORE_ID,
    storeName: order.storeName ?? DEFAULT_STORE_NAME,
    requestedBy: order.requestedBy ?? DEFAULT_REQUESTED_BY,
    status: order.status ?? 'REQUESTED',
    totalSkuCount: order.totalSkuCount ?? items.length,
    totalRequestedQuantity:
      order.totalRequestedQuantity
      ?? items.reduce((sum, item) => sum + item.requestedQuantity, 0),
    memo: order.memo ?? '',
    cancelReason: order.cancelReason ?? '',
    approvalPolicyNote: order.approvalPolicyNote ?? '익일 12시 배치 승인 대상',
    statusHistory:
      order.statusHistory?.length
        ? order.statusHistory
        : [{ status: order.status ?? 'REQUESTED', at: order.requestedAt, byName: order.requestedBy ?? DEFAULT_REQUESTED_BY, note: '' }],
    items,
    inboundStatus:
      order.status === 'APPROVED' || order.status === 'COMPLETED'
        ? order.inboundStatus ?? 'READY_TO_SHIP'
        : null,
    inboundExpectedAt: order.inboundExpectedAt ?? '',
    inboundCompletedAt: order.inboundCompletedAt ?? '',
    inboundConfirmedBy: order.inboundConfirmedBy ?? '',
  }

  normalized.inboundStatusHistory = normalizeInboundHistory(normalized)
  normalized.inboundExpectedAt = resolveInboundExpectedAt(normalized)
  return normalized
}

function appendHistory(list, entry) {
  return [...list, entry]
}

function headlineLabel(order) {
  if (!order || order.items.length === 0) return '-'
  return order.items.length > 1
    ? `${order.items[0].productName} 외 ${order.items.length - 1}건`
    : order.items[0].productName
}

export const useStoreOrdersStore = defineStore('storeOrders', () => {
  const inventory = useInventoryStore()
  const orders = ref(loadOrders().map(normalizeOrder))

  const activeStatusTab = ref('전체')
  const searchKeyword = ref('')
  const dateFrom = ref('')
  const dateTo = ref('')
  const sortBy = ref('latest')

  const requestSortBy = ref('priority')
  const selectedOrderId = ref('')

  const inboundActiveStatusTab = ref('전체')
  const inboundSearchKeyword = ref('')
  const inboundDateFrom = ref('')
  const inboundDateTo = ref('')
  const inboundSortBy = ref('latest')

  if (orders.value.length === 0) {
    orders.value = SEED_ORDERS.map(normalizeOrder)
    saveOrders(orders.value)
  }

  const sortedOrders = computed(() =>
    [...orders.value].sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)),
  )

  const filteredOrders = computed(() => {
    let list = sortedOrders.value

    if (activeStatusTab.value !== '전체') {
      list = list.filter((order) => order.status === activeStatusTab.value)
    }

    const keyword = searchKeyword.value.trim().toLowerCase()
    if (keyword) {
      list = list.filter((order) => {
        const haystack = [
          order.orderId,
          headlineLabel(order),
          order.memo,
          ...order.items.map((item) =>
            [item.productName, item.mainCategory, item.subCategory, item.color, item.size].join(' ')),
        ].join(' ').toLowerCase()
        return haystack.includes(keyword)
      })
    }

    if (dateFrom.value) {
      list = list.filter((order) => order.requestedAt.slice(0, 10) >= dateFrom.value)
    }
    if (dateTo.value) {
      list = list.filter((order) => order.requestedAt.slice(0, 10) <= dateTo.value)
    }

    const sorted = [...list]
    switch (sortBy.value) {
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
        sorted.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
    }
    return sorted
  })

  const selectedOrder = computed(() =>
    orders.value.find((order) => order.orderId === selectedOrderId.value) ?? null,
  )

  const statusCounts = computed(() => ({
    전체: orders.value.length,
    REQUESTED: orders.value.filter((order) => order.status === 'REQUESTED').length,
    APPROVED: orders.value.filter((order) => order.status === 'APPROVED').length,
    COMPLETED: orders.value.filter((order) => order.status === 'COMPLETED').length,
    CANCELLED: orders.value.filter((order) => order.status === 'CANCELLED').length,
  }))

  const summary = computed(() => ({
    totalOrders: orders.value.length,
    totalRequestedQuantity: orders.value.reduce((sum, order) => sum + order.totalRequestedQuantity, 0),
    requestedCount: orders.value.filter((order) => order.status === 'REQUESTED').length,
    approvedCount: orders.value.filter((order) => order.status === 'APPROVED').length,
    completedCount: orders.value.filter((order) => order.status === 'COMPLETED').length,
  }))

  const analytics = computed(() => {
    const skuMap = new Map()
    const categoryMap = new Map()

    for (const order of orders.value) {
      for (const item of order.items) {
        const skuKey = item.skuId
        const previousSku = skuMap.get(skuKey) ?? {
          skuId: item.skuId,
          itemCode: item.itemCode,
          productName: item.productName,
          optionLabel: `${item.color} / ${item.size}`,
          categoryLabel: `${item.mainCategory} > ${item.subCategory}`,
          requestedQuantity: 0,
          orderCount: 0,
        }
        previousSku.requestedQuantity += item.requestedQuantity
        previousSku.orderCount += 1
        skuMap.set(skuKey, previousSku)

        const categoryKey = `${item.mainCategory}|${item.subCategory}`
        const previousCategory = categoryMap.get(categoryKey) ?? {
          mainCategory: item.mainCategory,
          subCategory: item.subCategory,
          label: `${item.mainCategory} > ${item.subCategory}`,
          requestedQuantity: 0,
        }
        previousCategory.requestedQuantity += item.requestedQuantity
        categoryMap.set(categoryKey, previousCategory)
      }
    }

    return {
      topSkus: [...skuMap.values()].sort((a, b) => b.requestedQuantity - a.requestedQuantity).slice(0, 5),
      categoryBreakdown: [...categoryMap.values()].sort((a, b) => (
        compareMainCategory(a.mainCategory, b.mainCategory)
        || a.subCategory.localeCompare(b.subCategory, 'ko')
        || b.requestedQuantity - a.requestedQuantity
      )),
    }
  })

  const requestableSkus = computed(() =>
    [...inventory.skus]
      .map((sku) => {
        const inboundExpectedQuantity = inboundExpectedForSku(sku)
        return {
          ...sku,
          itemCode: toItemCode(sku.productId, sku.mainCategory),
          inboundExpectedQuantity,
          availableStoreStock: sku.stock + inboundExpectedQuantity,
          recommendedQuantity: Math.max(0, sku.safetyStock - sku.stock),
          stockStatus: inventory.stockStatus(sku),
        }
      })
      .sort((a, b) => {
        if (requestSortBy.value === 'category') {
          return (
            compareMainCategory(a.mainCategory, b.mainCategory)
            || a.subCategory.localeCompare(b.subCategory, 'ko')
            || a.productName.localeCompare(b.productName, 'ko')
          )
        }
        if (requestSortBy.value === 'name') {
          return a.productName.localeCompare(b.productName, 'ko')
        }
        if (requestSortBy.value === 'stockDesc') {
          if (b.stock !== a.stock) return b.stock - a.stock
          if (b.recommendedQuantity !== a.recommendedQuantity) {
            return b.recommendedQuantity - a.recommendedQuantity
          }
          return a.productName.localeCompare(b.productName, 'ko')
        }
        if (requestSortBy.value === 'stockAsc') {
          if (a.stock !== b.stock) return a.stock - b.stock
          if (b.recommendedQuantity !== a.recommendedQuantity) {
            return b.recommendedQuantity - a.recommendedQuantity
          }
          return a.productName.localeCompare(b.productName, 'ko')
        }

        const priorityA = a.recommendedQuantity > 0 || a.stockStatus !== 'normal' ? 0 : 1
        const priorityB = b.recommendedQuantity > 0 || b.stockStatus !== 'normal' ? 0 : 1
        if (priorityA !== priorityB) return priorityA - priorityB
        if (a.recommendedQuantity !== b.recommendedQuantity) return b.recommendedQuantity - a.recommendedQuantity
        return a.productName.localeCompare(b.productName, 'ko')
      }),
  )

  const inboundTargetOrders = computed(() =>
    orders.value.filter(
      (order) => (order.status === 'APPROVED' || order.status === 'COMPLETED') && order.inboundStatus,
    ),
  )

  const inboundListOrders = computed(() => inboundTargetOrders.value)

  const inboundHistoryOrders = computed(() =>
    inboundTargetOrders.value.filter((order) => order.status === 'COMPLETED' && order.inboundStatus === 'RECEIVED'),
  )

  function filterInboundOrders(baseOrders, includeReceived = false) {
    let list = [...baseOrders]

    if (includeReceived && inboundActiveStatusTab.value === 'RECEIVED') {
      list = list.filter((order) => order.status === 'COMPLETED' && order.inboundStatus === 'RECEIVED')
    } else if (!includeReceived && inboundActiveStatusTab.value !== '전체') {
      list = list.filter((order) => order.inboundStatus === inboundActiveStatusTab.value)
    }

    const keyword = inboundSearchKeyword.value.trim().toLowerCase()
    if (keyword) {
      list = list.filter((order) => {
        const haystack = [
          order.orderId,
          headlineLabel(order),
          order.memo,
          ...order.items.map((item) =>
            [item.itemCode, item.productName, item.mainCategory, item.subCategory].join(' ')),
        ].join(' ').toLowerCase()
        return haystack.includes(keyword)
      })
    }

    const dateField = includeReceived ? 'inboundCompletedAt' : 'requestedAt'
    if (inboundDateFrom.value) {
      list = list.filter((order) => (order[dateField] || order.requestedAt).slice(0, 10) >= inboundDateFrom.value)
    }
    if (inboundDateTo.value) {
      list = list.filter((order) => (order[dateField] || order.requestedAt).slice(0, 10) <= inboundDateTo.value)
    }

    const sorted = [...list]
    switch (inboundSortBy.value) {
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
    전체: inboundListOrders.value.length,
    READY_TO_SHIP: inboundListOrders.value.filter((order) => order.inboundStatus === 'READY_TO_SHIP').length,
    IN_TRANSIT: inboundListOrders.value.filter((order) => order.inboundStatus === 'IN_TRANSIT').length,
    ARRIVED: inboundListOrders.value.filter((order) => order.inboundStatus === 'ARRIVED').length,
    RECEIVED: inboundListOrders.value.filter((order) => order.status === 'COMPLETED' && order.inboundStatus === 'RECEIVED').length,
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

  function persist() {
    saveOrders(orders.value)
  }

  function selectOrder(orderId) {
    selectedOrderId.value = orderId
  }

  function createOrder({
    items,
    memo = '',
    storeId = DEFAULT_STORE_ID,
    storeName = DEFAULT_STORE_NAME,
    requestedBy = DEFAULT_REQUESTED_BY,
  }) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: '발주 요청서가 비어 있습니다.' }
    }

    const normalizedItems = []
    for (const input of items) {
      const sku = inventory.getSkuById(input.skuId)
      const requestedQuantity = Number(input.requestedQuantity)
      if (!sku) return { success: false, message: '발주 대상 SKU를 찾을 수 없습니다.' }
      if (Number.isNaN(requestedQuantity) || requestedQuantity < 1) {
        return { success: false, message: '요청 수량은 1 이상이어야 합니다.' }
      }

      const inboundExpectedQuantity = Number(input.inboundExpectedQuantity ?? inboundExpectedForSku(sku))
      normalizedItems.push({
        skuId: sku.skuId,
        productId: sku.productId,
        itemCode: toItemCode(sku.productId, sku.mainCategory),
        productName: sku.productName,
        mainCategory: sku.mainCategory,
        subCategory: sku.subCategory,
        color: sku.color,
        size: sku.size,
        unitPrice: sku.unitPrice,
        currentStoreStock: sku.stock,
        inboundExpectedQuantity,
        availableStoreStock: sku.stock + inboundExpectedQuantity,
        safetyStock: sku.safetyStock,
        recommendedQuantity: Math.max(0, sku.safetyStock - sku.stock),
        requestedQuantity,
        expectedInboundQuantity: requestedQuantity,
      })
    }

    const orderId = generateOrderId(orders.value)
    const requestedAt = new Date().toISOString()
    const order = normalizeOrder({
      orderId,
      storeId,
      storeName,
      requestedAt,
      requestedBy,
      status: 'REQUESTED',
      totalSkuCount: normalizedItems.length,
      totalRequestedQuantity: normalizedItems.reduce((sum, item) => sum + item.requestedQuantity, 0),
      memo: memo.trim(),
      cancelReason: '',
      approvalPolicyNote: '익일 12시 배치 승인 대상',
      statusHistory: [
        { status: 'REQUESTED', at: requestedAt, byName: requestedBy, note: '매장 발주 요청 등록' },
      ],
      inboundStatus: null,
      inboundStatusHistory: [],
      items: normalizedItems,
    })

    orders.value = [order, ...orders.value]
    persist()
    return { success: true, order }
  }

  function updateOrder(orderId, { items, memo = '' }) {
    const order = orders.value.find((entry) => entry.orderId === orderId)
    if (!order) return { success: false, message: '발주건을 찾을 수 없습니다.' }
    if (order.status !== 'REQUESTED') {
      return { success: false, message: '요청 상태에서만 수정할 수 있습니다.' }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, message: '발주 요청서가 비어 있습니다.' }
    }

    const normalizedItems = []
    for (const input of items) {
      const sku = inventory.getSkuById(input.skuId)
      const requestedQuantity = Number(input.requestedQuantity)
      if (!sku) return { success: false, message: '발주 대상 SKU를 찾을 수 없습니다.' }
      if (Number.isNaN(requestedQuantity) || requestedQuantity < 1) {
        return { success: false, message: '요청 수량은 1 이상이어야 합니다.' }
      }

      const inboundExpectedQuantity = Number(input.inboundExpectedQuantity ?? inboundExpectedForSku(sku))
      normalizedItems.push({
        orderId,
        skuId: sku.skuId,
        productId: sku.productId,
        itemCode: toItemCode(sku.productId, sku.mainCategory),
        productName: sku.productName,
        mainCategory: sku.mainCategory,
        subCategory: sku.subCategory,
        color: sku.color,
        size: sku.size,
        unitPrice: sku.unitPrice,
        currentStoreStock: sku.stock,
        inboundExpectedQuantity,
        availableStoreStock: sku.stock + inboundExpectedQuantity,
        safetyStock: sku.safetyStock,
        recommendedQuantity: Math.max(0, sku.safetyStock - sku.stock),
        requestedQuantity,
        expectedInboundQuantity: requestedQuantity,
      })
    }

    order.items = normalizedItems
    order.memo = memo.trim()
    order.totalSkuCount = normalizedItems.length
    order.totalRequestedQuantity = normalizedItems.reduce((sum, item) => sum + item.requestedQuantity, 0)
    order.statusHistory = appendHistory(order.statusHistory, {
      status: 'REQUESTED',
      at: new Date().toISOString(),
      byName: order.requestedBy,
      note: '매장 발주 요청 수정',
    })
    persist()
    return { success: true, order }
  }

  function cancelOrder(orderId, reason = '', cancelledBy = DEFAULT_REQUESTED_BY) {
    const order = orders.value.find((entry) => entry.orderId === orderId)
    if (!order) return { success: false, message: '발주건을 찾을 수 없습니다.' }
    if (order.status !== 'REQUESTED') {
      return { success: false, message: '요청 상태에서만 취소할 수 있습니다.' }
    }

    order.status = 'CANCELLED'
    order.cancelReason = reason.trim()
    order.statusHistory = appendHistory(order.statusHistory, {
      status: 'CANCELLED',
      at: new Date().toISOString(),
      byName: cancelledBy,
      note: '매장 요청 취소',
    })
    order.inboundStatus = null
    order.inboundStatusHistory = []
    persist()
    return { success: true, order }
  }

  function markApproved(orderId, approver = '시스템') {
    const order = orders.value.find((entry) => entry.orderId === orderId)
    if (!order || order.status !== 'REQUESTED') {
      return { success: false, message: '승인 가능한 요청 상태가 아닙니다.' }
    }

    const now = new Date().toISOString()
    order.status = 'APPROVED'
    order.statusHistory = appendHistory(order.statusHistory, {
      status: 'APPROVED',
      at: now,
      byName: approver,
      note: '배치 승인 완료',
    })
    order.inboundStatus = 'READY_TO_SHIP'
    order.inboundStatusHistory = [
      { status: 'READY_TO_SHIP', at: now, byName: approver, note: '창고 출고 준비 대기' },
    ]
    persist()
    return { success: true, order }
  }

  function updateInboundStatus(orderId, nextStatus, byName, note) {
    const order = orders.value.find((entry) => entry.orderId === orderId)
    if (!order) return { success: false, message: '발주건을 찾을 수 없습니다.' }
    if (order.status !== 'APPROVED') {
      return { success: false, message: '승인 완료된 발주만 입고 흐름을 가집니다.' }
    }

    order.inboundStatus = nextStatus
    order.inboundStatusHistory = appendHistory(order.inboundStatusHistory, {
      status: nextStatus,
      at: new Date().toISOString(),
      byName,
      note,
    })
    persist()
    return { success: true, order }
  }

  function markReadyToShip(orderId, byName = '시스템') {
    return updateInboundStatus(orderId, 'READY_TO_SHIP', byName, '창고 출고 준비 완료')
  }

  function markInTransit(orderId, byName = '서울 1센터') {
    const order = getOrderById(orderId)
    if (!order || order.inboundStatus !== 'READY_TO_SHIP') {
      return { success: false, message: '배송 준비중 상태에서만 배송 중으로 변경할 수 있습니다.' }
    }
    return updateInboundStatus(orderId, 'IN_TRANSIT', byName, '배송 출발 처리')
  }

  function markArrived(orderId, byName = DEFAULT_STORE_NAME) {
    const order = getOrderById(orderId)
    if (!order || order.inboundStatus !== 'IN_TRANSIT') {
      return { success: false, message: '배송 중 상태에서만 배송 완료로 변경할 수 있습니다.' }
    }
    return updateInboundStatus(orderId, 'ARRIVED', byName, '매장 도착 확인')
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
      order.items.map((item) => ({
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
    order.statusHistory = appendHistory(order.statusHistory, {
      status: 'COMPLETED',
      at: now,
      byName: confirmedBy,
      note: '매장 입고까지 최종 완료',
    })
    order.inboundStatusHistory = appendHistory(order.inboundStatusHistory, {
      status: 'RECEIVED',
      at: now,
      byName: confirmedBy,
      note: '매장 입고 확정 완료',
    })
    persist()
    return { success: true, order }
  }

  function getOrderById(orderId) {
    return orders.value.find((order) => order.orderId === orderId) ?? null
  }

  return {
    orders,
    activeStatusTab,
    searchKeyword,
    dateFrom,
    dateTo,
    sortBy,
    requestSortBy,
    selectedOrderId,
    inboundActiveStatusTab,
    inboundSearchKeyword,
    inboundDateFrom,
    inboundDateTo,
    inboundSortBy,
    sortedOrders,
    filteredOrders,
    selectedOrder,
    statusCounts,
    summary,
    analytics,
    requestableSkus,
    inboundTargetOrders,
    inboundListOrders,
    inboundHistoryOrders,
    filteredInboundList,
    filteredInboundHistory,
    inboundStatusCounts,
    inboundSummary,
    inboundAnalytics,
    statusLabelMap: STATUS_LABEL,
    inboundStatusLabelMap: INBOUND_STATUS_LABEL,
    selectOrder,
    createOrder,
    updateOrder,
    cancelOrder,
    markApproved,
    markReadyToShip,
    markInTransit,
    markArrived,
    confirmInbound,
    getOrderById,
  }
})

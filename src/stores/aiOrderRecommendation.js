import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// localStorage 키
const STORAGE_KEY = 'stockit:ai-recommendations'

// 시스템 권장 발주 더미 데이터 (5~8건)
const SEED_RECOMMENDATIONS = [
  {
    id: 'AI-001',
    warehouseId: 'WH-002',
    warehouseName: '인천 제1센터',
    productId: 'PRD-004',
    productCode: 'PRD-004',
    productName: 'A4 복사용지 80g (500매)',
    vendorId: 'VND-002',
    vendorName: '글로벌오피스(주)',
    currentQty: 80,
    safetyStock: 200,
    recommendedQty: 300,
    basisPeriodDays: 30,
    avgDailyOutbound: 12,
    status: 'APPROVED', // 이미 PO-20260416-001로 발주 처리됨
    reviewedBy: 'MB-003',
    reviewedAt: '2026-04-16T10:15:00',
    createdAt: '2026-04-16T08:00:00',
  },
  {
    id: 'AI-002',
    warehouseId: 'WH-001',
    warehouseName: '서울 1센터',
    productId: 'PRD-007',
    productCode: 'PRD-007',
    productName: 'KF94 마스크 (50매입)',
    vendorId: 'VND-003',
    vendorName: '헬스케어솔루션(주)',
    currentQty: 120,
    safetyStock: 300,
    recommendedQty: 500,
    basisPeriodDays: 30,
    avgDailyOutbound: 15,
    status: 'APPROVED', // 이미 PO-20260417-001로 발주 처리됨
    reviewedBy: 'MB-003',
    reviewedAt: '2026-04-17T09:00:00',
    createdAt: '2026-04-17T07:00:00',
  },
  {
    id: 'AI-003',
    warehouseId: 'WH-001',
    warehouseName: '서울 1센터',
    productId: 'PRD-012',
    productCode: 'PRD-012',
    productName: '절전형 5구 멀티탭 (3m)',
    vendorId: 'VND-002',
    vendorName: '글로벌오피스(주)',
    currentQty: 50,
    safetyStock: 150,
    recommendedQty: 200,
    basisPeriodDays: 30,
    avgDailyOutbound: 6,
    status: 'APPROVED', // 이미 PO-20260419-001로 발주 처리됨
    reviewedBy: 'MB-003',
    reviewedAt: '2026-04-19T09:15:00',
    createdAt: '2026-04-18T22:00:00',
  },
  {
    id: 'AI-004',
    warehouseId: 'WH-003',
    warehouseName: '경기 남부센터',
    productId: 'PRD-001',
    productCode: 'PRD-001',
    productName: '고속 충전기 (C타입) 25W',
    vendorId: 'VND-001',
    vendorName: '(주)테크서플라이',
    currentQty: 45,
    safetyStock: 150,
    recommendedQty: 250,
    basisPeriodDays: 30,
    avgDailyOutbound: 9,
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-04-20T06:00:00',
  },
  {
    id: 'AI-005',
    warehouseId: 'WH-004',
    warehouseName: '부산 물류센터',
    productId: 'PRD-002',
    productCode: 'PRD-002',
    productName: '대용량 보조배터리 20000mAh',
    vendorId: 'VND-001',
    vendorName: '(주)테크서플라이',
    currentQty: 20,
    safetyStock: 100,
    recommendedQty: 150,
    basisPeriodDays: 30,
    avgDailyOutbound: 5,
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-04-20T06:30:00',
  },
  {
    id: 'AI-006',
    warehouseId: 'WH-002',
    warehouseName: '인천 제1센터',
    productId: 'PRD-008',
    productCode: 'PRD-008',
    productName: '휴대용 가글 (중) 250ml',
    vendorId: 'VND-003',
    vendorName: '헬스케어솔루션(주)',
    currentQty: 60,
    safetyStock: 200,
    recommendedQty: 400,
    basisPeriodDays: 30,
    avgDailyOutbound: 14,
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-04-20T07:00:00',
  },
  {
    id: 'AI-007',
    warehouseId: 'WH-005',
    warehouseName: '대구 통합센터',
    productId: 'PRD-009',
    productCode: 'PRD-009',
    productName: '유리제 머그컵 350ml',
    vendorId: 'VND-004',
    vendorName: '리빙플러스(주)',
    currentQty: 30,
    safetyStock: 120,
    recommendedQty: 200,
    basisPeriodDays: 30,
    avgDailyOutbound: 4,
    status: 'REJECTED',
    reviewedBy: 'MB-003',
    reviewedAt: '2026-04-19T16:00:00',
    createdAt: '2026-04-19T10:00:00',
  },
  {
    id: 'AI-008',
    warehouseId: 'WH-001',
    warehouseName: '서울 1센터',
    productId: 'PRD-006',
    productCode: 'PRD-006',
    productName: '기계식 키보드 (갈축)',
    vendorId: 'VND-001',
    vendorName: '(주)테크서플라이',
    currentQty: 10,
    safetyStock: 50,
    recommendedQty: 80,
    basisPeriodDays: 30,
    avgDailyOutbound: 2,
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-04-20T07:30:00',
  },
]

export const useAiOrderRecommendationStore = defineStore('aiOrderRecommendation', () => {
  // --- 상태(state) ---
  const recommendations = ref([])

  // --- 게터(getters) ---
  const pendingRecommendations = computed(() =>
    recommendations.value.filter((r) => r.status === 'PENDING'),
  )

  // --- 액션(actions) ---

  // SO-030: 시스템 권장 발주량 조회 (BE 연동 전 더미 로딩)
  function fetchRecommendations() {
    // BE 연동 시 api/purchaseOrder.js의 getAiRecommendations() 호출로 교체
    // 현재는 이미 init()에서 로드된 state를 그대로 사용
  }

  function markApproved(id, memberId = 'MB-003') {
    const rec = recommendations.value.find((r) => r.id === id)
    if (!rec) return

    rec.status = 'APPROVED'
    rec.reviewedBy = memberId
    rec.reviewedAt = new Date().toISOString()
    saveToStorage()
  }

  function markRejected(id, memberId = 'MB-003') {
    const rec = recommendations.value.find((r) => r.id === id)
    if (!rec) return

    rec.status = 'REJECTED'
    rec.reviewedBy = memberId
    rec.reviewedAt = new Date().toISOString()
    saveToStorage()
  }

  // --- localStorage 영속화 ---
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recommendations.value))
    } catch (e) {
      console.error('[aiOrderRecommendation] localStorage 저장 실패', e)
    }
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        recommendations.value = JSON.parse(saved)
        return true
      }
    } catch (e) {
      console.error('[aiOrderRecommendation] localStorage 로드 실패', e)
    }
    return false
  }

  function init() {
    const loaded = loadFromStorage()
    if (!loaded) {
      recommendations.value = SEED_RECOMMENDATIONS
      saveToStorage()
    }
  }

  // 스토어 생성 시 자동 초기화
  init()

  return {
    // state
    recommendations,
    // getters
    pendingRecommendations,
    // actions
    fetchRecommendations,
    markApproved,
    markRejected,
    init,
  }
})

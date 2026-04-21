/**
 * purchaseOrder.js — BE 연동 지점 주석 스텁
 *
 * BE에서 PURCHASE_ORDER 관련 Controller/Service/Repository가 완성되면
 * 이 파일의 각 함수를 실제 axios 호출로 채우고,
 * stores/purchaseOrder.js 및 stores/aiOrderRecommendation.js의
 * 각 action에서 이 파일을 import하여 호출하도록 교체한다.
 *
 * 기본 axios 인스턴스: src/api/axios.js (BE 연동 시 신설 예정)
 * baseURL: http://localhost:8080
 */

// ─────────────────────────────────────────────
// 발주(PURCHASE_ORDER) 관련 API
// ─────────────────────────────────────────────

/**
 * 발주 목록 조회 (SO-031)
 * GET /api/v1/purchase-orders?status=&page=&size=
 *
 * @param {{ status?: string, page?: number, size?: number }} params
 * @returns {Promise<{ content: Array, totalElements: number }>}
 */
// export async function getPurchaseOrders(params = {}) {
//   const res = await axios.get('/api/v1/purchase-orders', { params })
//   return res.data.result
// }

/**
 * 발주 상세 조회 (SO-032)
 * GET /api/v1/purchase-orders/{id}
 *
 * @param {string} id — 발주 ID (예: 'PO-20260420-001')
 * @returns {Promise<object>}
 */
// export async function getPurchaseOrderById(id) {
//   const res = await axios.get(`/api/v1/purchase-orders/${id}`)
//   return res.data.result
// }

/**
 * 발주 생성 (SO-027)
 * POST /api/v1/purchase-orders
 *
 * @param {{ warehouseId: string, vendorId: string, items: Array, recommendationId?: string }} payload
 * @returns {Promise<object>} 생성된 발주 객체
 */
// export async function createPurchaseOrder(payload) {
//   const res = await axios.post('/api/v1/purchase-orders', payload)
//   return res.data.result
// }

/**
 * 발주 수정 (SO-028) — PENDING 상태만 허용
 * PUT /api/v1/purchase-orders/{id}
 *
 * @param {string} id
 * @param {{ warehouseId?: string, items?: Array }} payload
 * @returns {Promise<object>}
 */
// export async function updatePurchaseOrder(id, payload) {
//   const res = await axios.put(`/api/v1/purchase-orders/${id}`, payload)
//   return res.data.result
// }

/**
 * 발주 취소 (SO-029) — PENDING 상태만 허용, status를 REJECTED로 전환
 * DELETE /api/v1/purchase-orders/{id}
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
// export async function cancelPurchaseOrder(id) {
//   await axios.delete(`/api/v1/purchase-orders/${id}`)
// }

// ─────────────────────────────────────────────
// AI 발주 추천(AI_ORDER_RECOMMENDATION) 관련 API
// ─────────────────────────────────────────────

/**
 * AI 권장 발주량 조회 (SO-030)
 * GET /api/v1/ai-recommendations?warehouseId=&status=
 *
 * @param {{ warehouseId?: string, status?: string }} params
 * @returns {Promise<Array>}
 */
// export async function getAiRecommendations(params = {}) {
//   const res = await axios.get('/api/v1/ai-recommendations', { params })
//   return res.data.result
// }

// ─────────────────────────────────────────────
// 제품 검색 관련 API (발주 장바구니, SO-026)
// ─────────────────────────────────────────────

/**
 * 제품 검색 — 거래처별 계약 제품 검색
 * GET /api/v1/products/search?keyword=&vendorId=
 *
 * @param {{ keyword: string, vendorId?: string }} params
 * @returns {Promise<Array>}
 */
// export async function searchProducts(params = {}) {
//   const res = await axios.get('/api/v1/products/search', { params })
//   return res.data.result
// }

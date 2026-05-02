/**
 * circularBuyer.js — BE 연동 (ADR-021 순환재고 거래처)
 *
 * BE 엔드포인트:
 *   GET    /api/hq/circular-buyers?keyword=&materialFit=    목록
 *   GET    /api/hq/circular-buyers/{code}                    상세
 *   POST   /api/hq/circular-buyers                           등록 (등록 시 BE 가 임베딩 자동 생성)
 *   PATCH  /api/hq/circular-buyers/{code}                    수정 (의미 필드 변경 시 BE 가 임베딩 재생성)
 *   DELETE /api/hq/circular-buyers/{code}                    삭제 (hard delete)
 *   POST   /api/hq/circular-buyers/embeddings/backfill       embedding NULL 거래처 일괄 임베딩
 *
 * 응답: BaseResponse<T>. unwrap() 으로 result 만 추출, 실패 시 한국어 message throw.
 */

import { apiClient, unwrap } from './axios.js'

const BASE = '/api/hq/circular-buyers'

export const circularBuyerApi = {
  /** @param {{ keyword?: string, materialFit?: 'natural-single'|'synthetic'|'blended' }} [opts] */
  list: ({ keyword, materialFit } = {}) =>
    apiClient.get(BASE, { params: { keyword, materialFit } }).then(unwrap),

  detail: (code) => apiClient.get(`${BASE}/${code}`).then(unwrap),

  /**
   * 등록. BE 가 등록 직후 OpenAI 임베딩 1콜로 embedding 컬럼 자동 채움.
   * @param {{code, companyName, industryGroup, productTypes, productNote, description, primaryMaterialFit, managerName, phone}} req
   */
  create: (req) => apiClient.post(BASE, req).then(unwrap),

  /**
   * 수정. BE 가 의미 필드(companyName/industryGroup/productTypes/productNote/description/primaryMaterialFit) 변경 시 임베딩 재생성.
   * managerName/phone 만 바뀌면 OpenAI 콜 안 감.
   * null 필드는 PATCH 시멘틱 — 변경 안 함.
   */
  update: (code, req) => apiClient.patch(`${BASE}/${code}`, req).then(unwrap),

  /** hard delete — 거래처 행 자체 삭제. */
  delete: (code) => apiClient.delete(`${BASE}/${code}`).then(unwrap),

  /** embedding NULL 거래처 일괄 임베딩 — 시드 backfill 용. */
  backfillEmbeddings: () => apiClient.post(`${BASE}/embeddings/backfill`).then(unwrap),

  /**
   * ADR-021 AI 거래처 추천 — 3층 RAG (SQL 룰 → 임베딩 코사인 → LLM 사유).
   * 판매 등록 페이지 Step 1 → Step 2 [다음] 클릭 1회 호출.
   * LLM 실패 시에도 200 OK + rationale fallback 텍스트 (BE 책임).
   *
   * timeout 30초 — OpenAI 임베딩 1콜 + Chat(gpt-4o-mini) 1콜 합산 BUDGET 1.5~2.5초이지만
   * cold start / 네트워크 지연 / 토큰 길이 변동으로 글로벌 10초 초과 가능 → 추천 호출만 명시 override.
   *
   * @param {{materialFit: 'natural-single'|'synthetic'|'blended', productName?: string, description?: string, quantityHint?: string}} payload
   * @returns {Promise<{recommendations: Array<{code, companyName, primaryMaterialFit, industryGroup, rationale}>}>}
   */
  recommend: (payload) =>
    apiClient.post(`${BASE}/recommend`, payload, { timeout: 30000 }).then(unwrap),
}

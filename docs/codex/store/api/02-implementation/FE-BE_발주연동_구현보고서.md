# FE-BE 매장 발주 연동 구현보고서

## 1. 개요
- 목표: 매장 발주 화면을 로컬 스토어 비즈니스 로직 중심에서 API 연동 중심으로 전환
- 기준: `프론트_공통_API_연동_코딩규칙_컨벤션.md`
- 적용 방식: 하이브리드 전환 (디자인 유지, 로직 전환)

## 2. 반영 내용
- API 사용 고정
  - `createStoreOrder`
  - `updateStoreOrder`
  - `cancelStoreOrder`
  - `getStoreOrders`
  - `getStoreOrderDetail`
  - `getStoreOrderAnalytics`
- View 책임 정리
  - `views/*`에서 API 호출 + `try-catch` 처리
  - `api/*`는 HTTP + `unwrap`만 담당
- 라우팅 식별자 통일
  - `:id` -> `:orderNo`

## 3. 화면별 구현
- 발주 요청 화면
  - 생성/수정 API 연동
  - 요청 payload를 `skuCode/requestedQuantity` 기준으로 전송
  - 로그인 매장 기준 SKU 목록 조회로 변경
- 발주 내역 화면
  - 목록 API 연동 및 필터 조회 흐름 반영
- 발주 상세 화면
  - 상세 API/취소 API 연동
- 발주 분석 화면
  - 분석 API 결과 매핑 반영

## 4. 이번 추가 반영 (중요)
- 대상 파일: `src/views/store/orders/StoreOrderRequestView.vue`
- 변경 목적: 요청 SKU 목록이 로그인 매장 데이터만 조회되도록 보정
- 변경 사항:
  - `StorePosView.vue`와 동일한 조회 패턴 적용
  - `getCompanyWideInventories(params)` 결과를 `page.items` 기준으로 처리
  - `getCompanyWideInventorySkus(itemCode, params)` + `getProductSkus(itemCode)` 병렬 조회
  - item(상품명/카테고리) + sku(옵션/재고/안전재고) 병합 매핑
  - stock 계산을 `sku.actualStock` 기준으로 정렬
  - fallback 매장 ID 제거, `auth.user.storeLocationId` 필수 검증

## 5. 주요 변경 파일
- `src/router/index.js`
- `src/views/store/orders/StoreOrderRequestView.vue`
- `src/views/store/orders/StoreOrderHistoryView.vue`
- `src/views/store/orders/StoreOrderDetailView.vue`
- `src/views/store/orders/StoreOrderAnalysisView.vue`

## 6. 검증
- 기능 검증
  - 요청/수정/취소/목록/상세/분석 API 연동 동작 확인
- 매장 필터 검증 포인트
  - SKU 조회 요청 파라미터에 `locationType=STORE`, `locationIds=[storeLocationId]` 포함 여부
- 참고
  - `.vue` 파일은 `node --check` 직접 대상이 아니므로, 런타임 테스트 기준으로 확인

## 7. 잔여 과제
- 상세 화면의 동적 재고 컬럼 최종 정리
- 발주 화면의 `storeOrder` 스토어 의존 완전 제거 여부 재점검
- FE 빌드 환경 이슈(`oxide/EPERM`) 분리 대응

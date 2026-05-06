# FE-BE 매장 발주 연동 계획 (Store FE 기준, API 전환 v1)

## Summary
- 목표: 매장 발주 화면을 로컬 스토어 비즈니스 로직 중심에서 BE API 연동 중심으로 전환한다.
- 기준 문서: `프론트_공통_API_연동_코딩규칙_컨벤션.md`
- 현재 반영 상태:
  - 발주 생성/수정/취소/목록/상세/분석 API 호출 경로 반영
  - 라우팅 식별키 `orderNo` 기준으로 전환
  - 디자인은 기존 UI 유지, 스크립트 로직 중심 변경
  - 발주 요청 SKU 목록을 로그인 매장 기준으로 조회하도록 POS 방식과 동일하게 정렬

## Key Changes
1. API 연동 기준 고정
- 사용 API (`src/api/store/orders.js`)
  - `createStoreOrder(payload)`
  - `updateStoreOrder(orderNo, payload)`
  - `cancelStoreOrder(orderNo, payload)`
  - `getStoreOrders(params)`
  - `getStoreOrderDetail(orderNo)`
  - `getStoreOrderAnalytics(params)`
- 응답 처리
  - `unwrap()` 규칙 유지 (`BaseResponse.result` 반환, 실패 시 throw)
  - 각 View에서 `try-catch`로 사용자 메시지 처리

2. 라우팅/식별자 규칙
- 발주 상세/수정 라우트 파라미터를 `:orderNo`로 통일
- 화면 내부 식별자도 `id` 혼용 없이 `orderNo` 기준 사용

3. 발주 요청 SKU 목록 로딩 정책 (최신 반영)
- 데이터 소스: HQ 재고 API 재사용
- 조회 파라미터 고정:
  - `locationType: 'STORE'`
  - `locationIds: [auth.user.storeLocationId]`
- 로딩 절차를 `StorePosView.vue`와 동일 패턴으로 통일
  - `getCompanyWideInventories(params)` 호출 후 `page.items` 사용
  - 각 `itemCode`에 대해 `getCompanyWideInventorySkus(itemCode, params)` 병렬 조회
  - 각 `itemCode`에 대해 `getProductSkus(itemCode)` 병렬 조회
  - 화면 매핑은 item(상품명/카테고리) + sku(옵션/재고) 병합
- fallback 제거
  - 임시 매장 ID 하드코딩 없음
  - `auth.user.storeLocationId` 누락 시 에러 메시지 출력 후 조회 중단

4. 화면별 전환 정책
- 발주 요청 화면
  - 생성/수정 API 호출
  - payload: `storeCode`, `storeLocationId`, `requestedBy*`, `items[{skuCode, requestedQuantity}]`
- 발주 내역 화면
  - 목록 조회 API 기반
- 발주 상세 화면
  - 상세 조회/취소 API 기반
- 발주 분석 화면
  - 분석 API 결과(`total*`, `topSkus`, `categoryBreakdown`) 매핑

## Open Items
1. 상세 화면 동적 재고 컬럼 정리
- 정책은 제거이지만, 템플릿 잔여 UI가 있으면 단계적으로 정리

2. `storeOrder` 스토어 의존 완전 제거
- 발주 4개 화면에서 비즈니스 데이터 의존 제거 점검
- 입고/창고 시뮬레이션 영향 분리 점검

## Test Plan
1. 요청/수정/취소
- 정상: 생성 -> 내역 반영, 수정 반영, 취소 반영
- 실패: 빈 items, 수량 오류, 취소 사유 누락, 미존재 `orderNo`

2. 조회
- 목록: 상태/기간/키워드/정렬 동작 확인
- 상세: 아이템/상태 이력, `REQUESTED` 상태 버튼 조건 확인
- 분석: `total*`, `topSkus`, `categoryBreakdown` 렌더링 확인

3. SKU 매장 필터 검증
- 요청 SKU 조회 시 두 API 모두 `locationType=STORE`, `locationIds=[로그인매장ID]` 전송 확인
- 타 매장 SKU 혼입 여부 확인

## Assumptions
- BE 계약은 현재 구현된 `/api/store/orders*` 응답 형식을 기준으로 한다.
- `auth.user`에는 연동 시점에 `storeCode`, `storeLocationId`, `employeeCode`, `name`이 존재한다고 가정한다.

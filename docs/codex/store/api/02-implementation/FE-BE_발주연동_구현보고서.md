# FE-BE 매장 발주 연동 구현보고서

## 1. 개요
- 목표: 매장 발주 화면을 로컬 스토어 비즈니스 로직 중심에서 API 연동 중심으로 전환
- 기준: `프론트_공통_API_연동_코딩규칙_컨벤션.md`
- 적용 방식: 하이브리드 전환

## 2. 반영 내용
- API 사용 고정
  - `createStoreOrder`
  - `updateStoreOrder`
  - `cancelStoreOrder`
  - `getStoreOrders`
  - `getStoreOrderDetail`
  - `getStoreOrderAnalytics`
- 뷰 책임 정리
  - `views/*`에서 API 호출 + `try-catch` 처리
  - `api/*`는 HTTP + `unwrap`만 담당
- 라우팅 식별키 통일
  - `:id` -> `:orderNo`
  - 상세/수정 이동 파라미터도 `orderNo`로 통일

## 3. 화면별 전환
- 발주 요청 화면
  - 생성/수정 API 연동
  - 요청 payload를 `storeCode`, `requestedBy*`, `items[{skuCode, requestedQuantity}]` 기준으로 구성
- 발주 내역 화면
  - 목록 API 연동
  - 상태/기간/키워드/정렬 UI 적용
- 발주 상세 화면
  - 상세 API 연동
  - 취소 API 연동
  - 동적 재고 수치 컬럼 제거 (스냅샷/이력 중심)
- 발주 분석 화면
  - 분석 API 연동
  - `total*`, `topSkus`, `categoryBreakdown` 반영

## 4. 주요 변경 파일
- `src/router/index.js`
- `src/views/store/orders/StoreOrderRequestView.vue`
- `src/views/store/orders/StoreOrderHistoryView.vue`
- `src/views/store/orders/StoreOrderDetailView.vue`
- `src/views/store/orders/StoreOrderAnalysisView.vue`

## 5. 검증 결과
- 라우터 JS 문법 체크
  - `node --check src/router/index.js` 통과
- FE 빌드
  - 환경 이슈로 실패 (`@tailwindcss/oxide` 로드/EPERM)
  - 이번 변경과 무관한 로컬 환경/의존성 이슈로 판단

## 6. 후속 작업
- 발주 화면 API 연동 이후 `storeOrder` 스토어를 UI 상태 중심으로 추가 축소
- 입고/창고 시뮬레이션과의 참조 경로 분리 정리

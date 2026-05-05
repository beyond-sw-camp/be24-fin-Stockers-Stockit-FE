# FE-BE 판매 연동 계획 (Store FE 기준, C/R + POS 재고 API 전환)

## Summary
- 목표: 현재 로컬 스토어 기반 판매 기능을 백엔드 API 기반으로 전환한다.
- 확정 범위:
  - 포함: 판매 등록(C), 판매 목록/상세(R), POS 상품/재고 조회 API 연동
  - 제외: 판매 분석 화면 백엔드 전환(현행 유지)
- 핵심 결정:
  - 응답 포맷은 `BaseResponse` 기준으로 사용
  - FE 인증 사용자 모델에 `storeCode(ST-xxxx)`를 추가해 API 요청에 직접 사용
  - POS 재고 소스는 API 100% 전환(로컬 fallback 없음)

## Key Changes
1. FE API 계층 정리
- `src/api/store/sales.js` 신규 생성:
  - `createSale(payload)` -> `POST /api/store/sales`
  - `getSales(params)` -> `GET /api/store/sales`
  - `getSaleDetail(saleNo)` -> `GET /api/store/sales/{saleNo}`
- 기존 `unwrap()` 사용 규칙 준수 (`BaseResponse.result`만 반환, 실패 시 throw)
- 기존 `src/api/inventory.js`의 company-wide API를 POS/매장 재고 조회에 재사용

2. 인증/매장 식별자 정합
- `src/stores/auth.js` 사용자 모델에 `storeCode`, `storeLocationId` 필드 추가
- store 계정 더미 유저에 `storeCode: "ST-0001"`, `storeLocationId: 2` 반영
- 판매/재고 관련 모든 요청은 `auth.user.storeCode`, `auth.user.storeLocationId` 기반 호출

3. Store 판매 스토어 전환
- `src/stores/store/storeSales.js`를 로컬 저장소 기반에서 API 기반으로 변경:
  - `createSaleFromPos` -> BE 등록 호출 후 응답 매핑
  - `fetchSales`, `fetchSaleDetail` 액션 추가
  - `sales`, `selectedSale`, `loading`, `error` 상태 관리 추가
- 제거/축소:
  - localStorage 저장/생성번호(`generateSaleId`) 제거
  - 로컬 재고 차감(`inventory.sellItems`) 호출 제거
- 호환성:
  - 기존 UI 호환을 위해 `saleNo`와 함께 `saleId` alias 유지

4. POS/판매내역 화면 연동
- `StorePosView.vue`
  - SKU 목록/재고를 inventory API 기반으로 로딩
  - 판매 확정 시 `storeCode + items[{skuCode, quantity}]`로 요청
  - 성공 시 BE 반환 `saleNo` 표시, 실패 시 BE message 표시
- `StoreSalesHistoryView.vue`
  - 목록은 `getSales` 결과 사용
  - 상세는 선택된 `saleNo`로 `getSaleDetail` 호출
- 공통 매핑 규칙:
  - FE 내부 `saleId` 사용 지점은 alias로 유지하되 원천 값은 `saleNo`
  - 라인 식별은 `skuCode` 기준 통일

5. BE 연동 계약 고정
- `POST /api/store/sales` 요청:
  - `{ storeCode: string, items: [{ skuCode: string, quantity: number }] }`
- `GET /api/store/sales` 응답:
  - `BaseResponse<List<SaleListRes>>`
- `GET /api/store/sales/{saleNo}` 응답:
  - `BaseResponse<SaleDetailRes>`
- 에러 처리:
  - 4500~4505 코드를 FE 메시지 매핑 테이블로 처리

## Test Plan
1. 기능 연동
- POS에서 SKU 선택 -> 판매 등록 성공 -> 목록 즉시 반영 -> 상세 진입 확인
- 목록 필터(storeCode/from/to/keyword) 정상 동작 확인
- 상세 라인(수량/단가/라인금액) 정합성 확인

2. 실패 시나리오
- 빈 items, 수량 0/음수, 잘못된 skuCode, 재고 부족, 매장코드 불일치 각각 UI 에러 노출 확인
- `unwrap` 예외 메시지 사용자 노출 확인

3. 데이터 정합
- FE 표기 `saleNo`, `totalQuantity`, `totalAmount`가 BE 결과와 일치
- 동일 매장(`storeCode`) 기준으로만 목록/등록이 수행되는지 확인

## Assumptions
- 판매 목록 API는 `BaseResponse` 래핑을 유지한다.
- 로그인 사용자(store role)는 연동 시점에 `storeCode`, `storeLocationId`를 가진다.
- 분석 화면(`StoreSalesAnalysisView`)은 1차 연동 범위에서 제외한다.
- 초기 테스트 매장은 `ST-0001`/`locationId=2`로 진행한다.


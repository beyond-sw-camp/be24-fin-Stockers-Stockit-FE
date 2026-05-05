# FE-BE 판매 연동 구현 보고서

## 1. 구현 요약
- 판매 도메인 연동을 로컬 스토어 중심에서 API 중심으로 전환했다.
- API 호출과 `try-catch`는 `views`에서 직접 수행하도록 변경했다.
- `storeSales` 스토어는 상태 저장 전용으로 경량화했다.

## 2. 주요 변경 사항
### 2.1 API 모듈
- 신규 파일: `src/api/store/sales.js`
  - `createSale(payload)`
  - `getSales(params)`
  - `getSaleDetail(saleNo)`
- 공통 `unwrap` 규칙(BaseResponse.result 추출)을 사용한다.

### 2.2 인증 상태
- 수정 파일: `src/stores/auth.js`
- 사용자 상태에 `storeCode`, `storeLocationId` 필드 추가
- 더미 store 계정 기준값:
  - `storeCode: ST-0001`
  - `storeLocationId: 2`

### 2.3 스토어 역할 분리
- 수정 파일: `src/stores/store/storeSales.js`
- API 호출 로직 제거
- 상태 전용 메서드만 유지:
  - `setSales`, `prependSale`, `setSelectedSale`
  - `setLoading`, `setError`

### 2.4 POS 화면
- 수정 파일: `src/views/store/sales/StorePosView.vue`
- 재고 조회:
  - `getCompanyWideInventories`
  - `getCompanyWideInventorySkus`
- 판매 등록:
  - 뷰에서 `createSale` 직접 호출 + `try-catch`
- 요청 상태 관리:
  - `saleRequest`(reactive): `{ storeCode, items }`
  - `submitState`: `idle/submitting/success/error`

### 2.5 판매 내역 화면
- 수정 파일: `src/views/store/sales/StoreSalesHistoryView.vue`
- 목록/상세 조회를 뷰에서 직접 호출 + `try-catch`
  - `getSales`
  - `getSaleDetail`
- 조회 파라미터 상태:
  - `listQuery`(reactive): `{ storeCode, from, to, keyword }`

## 3. 응답/모델 매핑
- 백엔드 원천 키는 `saleNo`
- 화면 호환을 위해 FE 상태에 `saleId` alias를 함께 유지
- 라인 식별 키는 `skuCode` 기준으로 통일

## 4. 예외 처리
- API 실패 시 각 뷰의 `catch`에서 사용자 메시지 처리
- 공통적으로 `sales.setError(message)`에 기록하고 화면 메시지에도 반영

## 5. 확인/제한 사항
- 코드 반영은 완료되었고, 빌드 검증은 로컬 환경 권한/의존성 이슈로 완전 확인하지 못함
  - PowerShell execution policy
  - tailwind oxide native dependency 로드 이슈
- 기능 검증은 Postman + FE 수동 시나리오로 추가 확인 필요


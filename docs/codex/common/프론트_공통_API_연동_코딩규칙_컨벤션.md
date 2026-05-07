# 프론트 공통 코딩규칙/컨벤션 (Store FE-BE 연동 기준)

## 1. 목적
- 판매 기능 연동 과정에서 확정된 프론트 구현 규칙을 표준화한다.
- 이후 발주/입고/창고출고/순환재고 연동에도 동일한 코드 스타일과 구조를 적용한다.

## 2. 레이어/역할 분리
- `api/*`: HTTP 호출만 담당한다.
- `views/*`: 화면 이벤트, API 호출, `try-catch`, 사용자 피드백을 담당한다.
- `stores/*`: 상태 저장/갱신만 담당한다. (비즈니스 API 호출 로직 최소화)

## 3. 응답 처리 규칙
- 백엔드 응답은 `BaseResponse` 기준으로 처리한다.
- API 유틸의 `unwrap()` 규칙을 사용해 `result`만 반환한다.
- 실패 시 예외를 throw하고, view에서 `try-catch`로 사용자 메시지를 처리한다.

## 4. 매장 컨텍스트 규칙
- 판매/재고 요청은 로그인 사용자 컨텍스트 기준으로 보낸다.
  - `auth.user.storeCode`
  - `auth.user.storeLocationId`
- 매장 식별자 누락 시 API 호출 전에 즉시 검증하고 사용자 메시지를 노출한다.

## 5. 스토어 규칙
- 판매 스토어는 상태 전용으로 유지한다.
  - `sales`, `selectedSale`, `loading`, `error`
- 스토어 액션은 상태 변경 중심으로 제한한다.
  - `setSales`, `prependSale`, `setSelectedSale`, `setLoading`, `setError`

## 6. API 파일 규칙
- 도메인별 파일 분리
  - 예: `src/api/store/sales.js`
- 함수명은 동사 중심으로 통일
  - `createSale`, `getSales`, `getSaleDetail`
- 엔드포인트 경로는 백엔드 계약과 1:1 매칭한다.

## 7. 화면 데이터 매핑 규칙
- FE 식별자는 `saleNo` 중심으로 사용한다. (기존 `saleId` 호환 필드 필요 시 병행)
- 라인 식별자는 `skuCode` 기준으로 통일한다.
- 화면 모델 매핑 시 null-safe 기본값을 명시한다.
- 수치형 필드는 `Number(...)` 변환으로 타입 안정성을 확보한다.

## 8. 스크립트 구역/주석 규칙
- `<script setup>` 내부는 아래 구역 순서를 기본으로 한다.
  - `1. IMPORTS`
  - `2. STATE & REFS`
  - `3. COMPUTED`
  - `4. CONSTANTS` (필요 시)
  - `5. METHODS - UI STATE`
  - `6. METHODS - API SERVICE`
  - `7. METHODS - NAVIGATION`
  - `8. WATCHERS` (필요 시)
  - `9. LIFECYCLE`
- 모든 함수 상단에 한 줄 헤더 주석을 작성한다.
  - 예: `// [함수] 판매 목록 API를 호출하고 화면 상태를 갱신한다.`

## 9. 네이밍 규칙
- 메뉴 상태 네이밍은 `Top/Side` 대신 `Main/Sub`를 사용한다.
  - `activeMainMenu`, `activeSubMenu`
- Req/Res 성격 변수는 의미가 보이게 작성한다.
  - `saleRequest`, `listQuery`, `submitState`

## 10. 에러/피드백 규칙
- 사용자 메시지는 한국어로 제공한다.
- 메시지 인코딩 깨짐이 있으면 즉시 복구한다.
- 성공/실패 상태는 UI에 명확히 반영한다.
  - 성공: 모달/배너/토스트
  - 실패: 에러 문구 + 재시도 가능 상태

## 11. 인코딩 규칙
- 한글 문자열 수정 후 파일 재열람으로 깨짐 여부를 확인한다.
- 인코딩 문제가 잦은 파일은 작은 단위 패치로 수정한다.

## 12. 문서화 규칙
- 연동 산출물은 `docs/codex/store/api` 하위에 누적한다.
  - `01-plan`, `02-implementation`
- 변경 시 계약(요청/응답/에러코드)도 함께 갱신한다.

## 13. 테스트 기준
- POS: SKU 로딩 -> 판매 등록 -> 성공 응답/목록 반영
- 내역: 목록 조회 -> 상세 조회 -> 라인 금액 정합성
- 실패: 빈 아이템/수량 오류/코드 불일치/재고 부족 메시지 노출
- 데이터: `saleNo`, `totalQuantity`, `totalAmount`가 BE 결과와 일치

## 14. 신규 기능 적용 체크리스트
- [ ] API 호출은 `views`에서 처리했는가
- [ ] store는 상태 전용으로 유지했는가
- [ ] `unwrap` + `try-catch` 규칙을 지켰는가
- [ ] 매장 컨텍스트(`storeCode`, `storeLocationId`)를 사용했는가
- [ ] 스크립트 구역/함수 헤더 주석 규칙을 지켰는가
- [ ] 한글 인코딩 깨짐을 점검했는가
- [ ] docs/codex에 계획/구현/사용 문서를 반영했는가

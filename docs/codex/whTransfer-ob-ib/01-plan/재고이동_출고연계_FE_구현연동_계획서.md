# 재고이동 출고연계 FE 구현/연동 계획서

## 1. 문서 목적
- 재고이동(WH Transfer)과 출고(Outbound) 연계 변경사항을 FE 화면에 정합적으로 반영하기 위한 구현 계획을 정리한다.
- BE 상태 정책 변경(`READY_TO_SHIP/IN_TRANSIT/ARRIVED`)과 부분성공 응답(`failedTransfers`)을 FE UX에 반영한다.
- 더미 데이터/더미 로직 제거 원칙에 따라 재고이동 화면을 API 기반으로 정리한다.

## 2. 현재 전제
- BE 오케스트레이션:
  - 재고이동 실행 시 WH_TRANSFER 출고 생성
  - 출고 상태 전이에 따라 transfer 상태 동기화
- BE 상태 응답:
  - 현재 `READY_TO_SHIP`, `IN_TRANSIT`, `ARRIVED`까지 동작
  - `RECEIVED`는 후속 입고 연계 시점에 확장 예정
- BE 실행 응답:
  - 기존 성공 필드 + `failedTransfers` 확장

## 3. 구현 목표
1. 이력/상세 상태 매핑을 신 enum 기준으로 통일
2. FE에서 4단계 상태 UI(`READY_TO_SHIP -> IN_TRANSIT -> ARRIVED -> RECEIVED`) 표현
3. `RECEIVED`는 표시 전용(미연동 단계)으로 처리
4. 실행 결과 부분실패 상세(`failedTransfers`) 노출
5. 재고이동 화면 더미 데이터/폴백 제거
6. 출고 화면 회귀 보장(`WH_TRANSFER` 필터/라벨)

## 4. 변경 대상
- `src/views/hq/inventory/HqWarehouseTransferHistoryView.vue`
- `src/views/hq/inventory/HqWarehouseTransferHistoryDetailView.vue`
- `src/views/hq/inventory/HqWarehouseSkuTransferDetailView.vue`
- `src/views/warehouse/WarehouseOutboundDetailView.vue`
- `src/constants/hqWarehouseTransferData.js` (삭제 대상)

## 5. 상세 구현 계획
### 5.1 이력 화면 상태 정합
- 상태 매핑 교체
  - `READY_TO_SHIP` -> `출고 준비중`
  - `IN_TRANSIT` -> `배송중`
  - `ARRIVED` -> `배송완료`
  - `RECEIVED` -> `입고완료`
- 필터 옵션 교체
  - 기존 `완료/취소/요청` 제거
  - `출고 준비중/배송중/배송완료/입고완료`로 변경
- API 파라미터 매핑 교체
  - 구 코드(`IN_PROGRESS/COMPLETED/CANCELED`) 제거

### 5.2 상세 화면 4단계 상태 UI
- 상세 상단에 상태 흐름 스텝 추가
  - `READY_TO_SHIP -> IN_TRANSIT -> ARRIVED -> RECEIVED`
- 현재 BE 응답 기준 처리
  - `ARRIVED`까지 활성화
  - `RECEIVED`는 비활성 + “입고 완료 연동 예정” 안내
- 상세 배너/문구를 신 상태 기준으로 재정의

### 5.3 실행 결과 부분실패 상세화
- `executeWarehouseTransfers` 응답에서 `failedTransfers` 수집
- 성공/실패 요약 토스트 유지
- 실패 상세 모달/패널 추가
  - 라우트: from/to 창고
  - 실패코드/메시지
  - 실패 라인: lineId, skuCode, qty, reason
- 성공 라인은 기존대로 장바구니 제거, 실패 라인은 유지

### 5.4 더미 데이터 제거
- `transferSkuCatalog` import/사용 제거
- `hqWarehouseTransferData.js` 삭제
- SKU 메타는 라우트 query + API 응답 기반으로만 렌더
- 누락값은 `-` 처리(더미 보정 없음)

### 5.5 출고 화면 회귀 점검
- Outbound 상세의 sourceType 라벨화
  - raw enum 대신 사용자 라벨 표시
- WH_TRANSFER 타입 필터/표시 기존 동작 유지 확인

## 6. API 연동 영향
- API 엔드포인트 변경 없음
  - `POST /api/hq/warehouse-transfers/execute`
  - `GET /api/hq/warehouse-transfers`
  - `GET /api/hq/warehouse-transfers/{transferNo}`
- FE API 함수 변경 필요 없음
  - `src/api/hq/inventory.js` 유지
- 응답 확장 필드(`failedTransfers`)는 화면에서 선택적으로 소비

## 7. 테스트 계획
### 7.1 상태 표시/필터
- 이력 목록에서 신 상태 라벨 정상 노출
- 필터별 API 요청 status 값 일치

### 7.2 4단계 상세 UI
- 스텝 4단계 렌더 확인
- `ARRIVED`까지 활성, `RECEIVED` 비활성 안내 문구 확인

### 7.3 부분성공 UX
- 성공 전건 처리: 성공 토스트 + 장바구니 제거
- 부분실패: 요약 토스트 + 실패 상세 모달 노출 + 실패 라인 장바구니 잔존

### 7.4 더미 제거 검증
- 상세 진입 시 더미 상수 없이 렌더
- SKU 메타 일부 누락 시 UI 깨짐 없이 `-` 표시

### 7.5 회귀
- 창고 출고 리스트 타입 필터(`WH_TRANSFER`) 정상
- 출고 상세 조회/상태 전이 버튼 동작 영향 없음

## 8. 오픈 이슈 및 후속
1. `RECEIVED` 실제 활성화
  - BE 입고 연계 후 `inboundStatus` 또는 상태 확장 응답 수신 시 활성화
2. 실패 상세 정보 표준화
  - BE 실패 payload 형식 고정 후 FE 상세 컬럼 정교화 가능

## 9. 결론
- FE는 API 엔드포인트 변경 없이, 상태 매핑/화면 로직/UX 개선 중심으로 연동 가능하다.
- 본 계획은 “현재 BE 동작(ARRIVED까지)”과 “향후 입고 완료(RECEIVED) 확장”을 동시에 수용하도록 설계한다.

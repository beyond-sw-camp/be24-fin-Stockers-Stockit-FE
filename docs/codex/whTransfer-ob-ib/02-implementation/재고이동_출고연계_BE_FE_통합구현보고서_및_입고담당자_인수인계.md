# 재고이동-출고연계 BE/FE 통합 구현 보고서 및 입고 담당자 인수인계

## 1. 작업 개요
- 목표: 재고이동 실행 시점에 WH_TRANSFER 출고를 동기 오케스트레이션으로 즉시 생성하고, 출고 상태 흐름과 재고이동 상태를 정합성 있게 연결
- 범위:
  - BE: 재고이동 실행 + 출고 생성/이력/상태동기화/멱등/부분실패
  - FE: 재고이동 이력/상세 상태 UI 개편, 더미 제거, 실패 상세 노출, 화면 정렬/간격 조정
- 제외(후속): 입고 확정 연동에 따른 최종 RECEIVED 상태의 서버 기반 확정 처리

---

## 2. BE 구현 내역

### 2.1 재고이동 실행 시 WH_TRANSFER 출고 생성
- 재고이동 실행 시 라우트(출발창고/도착창고) 단위로 처리
- 라우트별 처리:
  1) transfer header/item 생성
  2) WH_TRANSFER outbound header/item 생성
  3) outbound 최초 상태 이력 READY_TO_SHIP 생성
  4) transfer 상태 READY_TO_SHIP 동기화

### 2.2 WH_TRANSFER 출고 매핑 규칙
- sourceType: WAREHOUSE_TRANSFER
- sourceRefNo: transferNo
- sourceRefId: transferHeader.id
- sourceRefSeq: 1
- warehouseId: fromWarehouseId
- destinationType: WAREHOUSE
- destinationId: toWarehouseId
- outbound status: READY_TO_SHIP
- outboundNo 정책: 기존 WOB-YYYYMMDD-SEQ 재사용

### 2.3 멱등/중복 방지
- 1차 방어: (sourceType, sourceRefNo, sourceRefSeq) 사전 조회
- 2차 방어: DB 유니크 충돌(DataIntegrityViolationException) 시 재조회 후 멱등 성공 처리
- 효과: 동일 transfer 재처리/동시성 상황에서 outbound 중복 생성 방지

### 2.4 출고 상태 전이 시 transfer 상태 동기화
- outbound confirm(출고 확정) -> transfer IN_TRANSIT
- outbound arrive(도착 처리) -> transfer ARRIVED
- 기존 STORE_ORDER 출고 흐름은 유지

### 2.5 부분성공 응답 계약 확장
- execute 응답에 성공/실패 분리
- 실패 항목에 최소 정보 제공:
  - route(from/to)
  - line 식별 정보
  - 실패 코드/메시지
- 성공 라우트는 커밋, 실패 라우트는 사유와 함께 반환

### 2.6 transfer 상태체계 정비
- warehouse_transfer_header.status 기준:
  - READY_TO_SHIP
  - IN_TRANSIT
  - ARRIVED
- 구 상태(IN_PROGRESS/COMPLETED/REQUESTED/CANCELED) 제거

### 2.7 코드 구조 개선
- 재고이동 서비스 메서드 분리/주석 보강
- DTO 변환 규칙 통일:
  - req DTO: toEntity(...)
  - res DTO: from(...)

### 2.8 이동번호 정책 변경
- transferNo prefix: STF -> WTF

---

## 3. FE 구현 내역

### 3.1 상태 매핑 개편
- 재고이동 이력/상세를 신 상태로 매핑:
  - READY_TO_SHIP -> 출고 준비중
  - IN_TRANSIT -> 배송중
  - ARRIVED -> 배송완료
  - RECEIVED -> 입고완료(표시 전용)

### 3.2 4단계 상태 UI 도입
- 상세에 4단계 스텝 UI 적용:
  - READY_TO_SHIP -> IN_TRANSIT -> ARRIVED -> RECEIVED
- 현재 BE 연동 범위는 ARRIVED까지이므로 RECEIVED는 비활성(연동 예정) 표시

### 3.3 부분실패 상세 노출
- execute 응답의 failedTransfers를 상세 모달/패널에 표시
- 성공/실패 요약 + 실패 라우트/라인 사유 확인 가능
- 실패 라인은 재시도 가능 상태로 유지

### 3.4 더미 제거
- 재고이동 화면의 더미 데이터/폴백 제거
- API 응답 기반 렌더링으로 통일
- 메타 누락 시 최소 식별값/대시(-) 처리

### 3.5 화면 UX 정리
- 재고이동 상세 좌/우 패널 구성 반영
- 상태 배너/섹션 간격, 컬럼 정렬, 라벨 문구 수정
- 목록 페이지 상태 안내 배지 제거

---

## 4. 검증 결과 요약

### 4.1 정상
- 재고이동 실행 시 transfer + WH_TRANSFER outbound + outbound 이력(READY_TO_SHIP) 생성 확인

### 4.2 멱등
- 동일 건 재처리 시 outbound 중복 미생성(사전조회/유니크 충돌 재조회)

### 4.3 부분성공
- 다중 라우트 실행에서 실패 라우트 분리 반환, 성공 라우트 커밋

### 4.4 상태동기화
- outbound confirm -> transfer IN_TRANSIT
- outbound arrive -> transfer ARRIVED

### 4.5 회귀
- STORE_ORDER 기반 기존 출고/입고 흐름 영향 없도록 분기 유지
- outbound 유형 필터(예: WH_TRANSFER) 계약 유지

---

## 5. 현재 완료 범위 판단
- 완료:
  - 재고이동 실행 기반 출고 연계 오케스트레이션(BE)
  - 해당 상태 흐름을 보여주는 FE 이력/상세 연동
- 미완료(후속 담당):
  - 입고 확정 연동 후 RECEIVED를 서버 상태로 확정하는 최종 오케스트레이션

---

## 6. 입고 담당자 인수인계 TODO

### 6.1 상태/도메인 연동
- ARRIVED 이후 입고 확정 API에서 transfer 상태를 RECEIVED로 전이
- 전이 규칙/권한/중복호출 멱등 정책 정의

### 6.2 데이터 계약 확장
- 필요 시 transfer 상세/목록에 inbound 상태 필드 추가
- FE 4단계 UI의 RECEIVED 활성 조건을 BE 필드 기반으로 전환

### 6.3 입고 이력 정합성
- inbound 확정 시점의 이력(누가/언제/수량)을 transfer/outbound와 추적 가능하게 설계
- 장애/재시도 시 이력 중복 및 누락 방지

### 6.4 예외/부분실패 정책
- 다건 입고 확정 시 부분성공 허용 여부 확정
- 실패 라인 반환 스키마를 재고이동 execute 실패 포맷과 최대한 일관화

### 6.5 회귀 테스트
- STORE_ORDER 입고 확정 플로우 영향 여부 점검
- WH_TRANSFER 입고 확정 후 출고/재고 화면 상태 반영 E2E 점검

---

## 7. 권장 인수인계 체크리스트
- [ ] ARRIVED -> RECEIVED 전이 API/서비스 구현
- [ ] transfer 상태 enum/DB/응답 스키마 최종 합의
- [ ] FE RECEIVED 활성화 조건 서버 필드로 교체
- [ ] 실패/재시도/멱등 테스트 케이스 추가
- [ ] 운영 전 통합 시나리오 리허설(정상/실패/재처리)

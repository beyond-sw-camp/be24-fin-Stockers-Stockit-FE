# 본사 매장 발주 수동 배치 승인 UI/API 연동 구현보고서

## 1. 개요
- 목표: 본사 관리자 전용 매장 발주 수동 배치 승인 화면(V1) 구현
- 경로: `/hq/batch/store-order-approve`
- 범위: 실행(ALL/STORE) + 결과 조회, 승인 대기 매장 목록 기반 즉시 실행 UX

## 2. 반영 내용
- 라우트/메뉴
  - 본사 배치 승인 화면 라우트 연결
  - 기존 HQ 레이아웃/네비게이션 패턴 유지
- API 연동
  - `POST /api/hq/store-orders/batch-approve/run` 실행 연동
  - `GET /api/hq/store-orders/batch-approve/pending-stores` 목록 연동
  - 인프라 API(`getInfrastructures`)로 지역/지점 필터 데이터 연동
  - 자동 배치 처리(백엔드 스케줄러) 구현 완료 상태를 전제로 수동 배치 보조 기능 제공

## 2.1 API 연동 관점 핵심 정리
- FE-BE 계약 정합
  - 수동 실행 API payload를 백엔드 계약에 맞춰 구성
  - `mode=ALL` 요청: `{ mode: 'ALL' }`
  - `mode=STORE` 요청: `{ mode: 'STORE', storeCode }`
- 응답 모델 사용
  - 실행 응답의 `runId`, `requestedCount`, `successCount`, `failCount`, `results[]`를 화면 상태에 직접 매핑
  - `results[]`의 `orderNo/result/code/message`를 결과 테이블에 렌더링
- 조회/실행 분리
  - 승인 대기 매장 조회(`pending-stores`)와 실행(`run`)을 분리 호출
  - 필터는 FE에서 적용하되, 실제 승인 대상 결정은 BE 기준으로 확정
- 자동/수동 역할 분리
  - 자동 배치: 백엔드 스케줄러가 매일 00:00(KST)에 전날 요청건을 승인 처리
  - 수동 배치: 자동 처리 이전/예외 상황에서 본사 관리자가 즉시 실행
- 실패 코드 표준 반영
  - `4609`, `4610`, `403`을 사용자 메시지로 분기 매핑

## 3. 화면 동작 구현
- 상단 안내
  - 사용자 관점 문구로 승인 완료 처리 시점 안내 추가
  - 기본 자동 승인 + 필요 시 본사 수동 승인 가능 시나리오 안내
- 승인 대기 매장 섹션
  - 지역/지점/검색 필터 바 구성
  - 전체 승인 버튼을 필터 우측 끝에 배치
  - 승인 대기 매장 카드를 2열 리스트로 표시
  - 카드 우측 `수동 배치 실행` 버튼으로 매장별 즉시 실행
- 실행 결과 섹션
  - `runId`, 요청/성공/실패 건수, 결과 테이블 표시

## 4. UX 세부 조정
- 실행 중 중복 클릭 방지
  - 전체 실행 중 또는 개별 실행 중 버튼 비활성화
- 실행 직후 카드 유지 정책
  - 개별 실행 성공 시 카드 즉시 제거하지 않음
  - 해당 카드 버튼을 `처리 완료` + 회색 상태로 전환
  - 새로고침 시 서버 데이터 기준으로 목록 재구성
- 필터/카드 간격 및 타이포 개선
  - 섹션 제목 크기/가독성 강화
  - 카드 정보 배치(지역/코드, 지점명, 승인 대기 배지) 정리

## 5. 스타일 변경 요약
- 실행 조건 박스 제거 후 목록 중심 UX로 전환
- 카드/필터/버튼 톤 통일
- 버튼 스타일 최종안
  - 네이비 계열 버튼
  - 테두리 유지
  - hover 색상 변화만 적용(이동 애니메이션 제거)
- 입력 UI 높이 조정(`h-9`)으로 밀도 최적화

## 6. 에러/권한 처리
- 클라이언트 검증
  - 필수 입력 미충족 시 실행 차단
- 서버 에러코드 매핑
  - `4609`: STORE 모드 `storeCode` 필수
  - `4610`: 유효하지 않은 배치 실행 범위
  - `403`: 본사 권한 아님

## 6.1 API 연동 상세(요청/응답)
- 실행 API
  - Endpoint: `POST /api/hq/store-orders/batch-approve/run`
  - Request
    - ALL: `{ "mode": "ALL" }`
    - STORE: `{ "mode": "STORE", "storeCode": "ST-XX-0001" }`
  - Response(요약)
    - `runId`, `triggerType`, `scope`, `storeCode`, `requestedCount`, `successCount`, `failCount`, `results`
- 승인 대기 매장 조회 API
  - Endpoint: `GET /api/hq/store-orders/batch-approve/pending-stores`
  - Response(요약)
    - `storeCode`, `storeName`, `region`, `requestedCount`

## 6.2 프론트 상태 동기화 정책
- 초기 진입(onMounted)
  - 매장 마스터 목록 + 승인 대기 매장 목록 병렬 조회
- 실행 성공 후
  - 결과 테이블은 실행 응답을 즉시 반영
  - 목록은 즉시 제거 대신 `처리 완료` 로컬 상태를 우선 반영
  - 새로고침 시 서버 재조회로 최종 상태 동기화

## 7. 주요 변경 파일
- `src/views/hq/store-order-batch/HqStoreOrderBatchApproveView.vue`
- `src/api/hq/storeOrderBatch.js`

## 8. 검증 포인트
- `ALL` 실행 시 결과 집계/상세 렌더링 확인
- 매장별 실행 시 대상 카드 `처리 완료` 전환 확인
- 필터(지역/지점/검색) 조합에 따른 카드 필터링 확인
- 새로고침 시 승인 완료 건 목록 제외 확인
- 한글 문구 정상 표시(인코딩 깨짐 없음) 확인
- 운영 검증
  - 자동 배치(스케줄러)로 승인 완료된 건은 수동 배치 대상 목록에서 제외되는지 확인

## 9. 잔여 과제
- 실행 이력 별도 저장/조회 화면은 V2 범위에서 검토
- 권한별 버튼 노출 정책(운영/개발환경 분기) 최종 확정
- 출고/입고 오케스트레이션 연동 이후 상태 표시 확장 검토

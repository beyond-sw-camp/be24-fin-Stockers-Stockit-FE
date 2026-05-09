# 매장 관리자 리팩토링 작업 보고서 (2026-05-03)

## 1) 작업 배경
- 범위: 매장 관리자 페이지(판매/발주/입고) 중 **매장 발주/입고 축** 중심
- 목표:
  - 매장 발주(store)와 본사/창고 발주(hq/warehouse) 혼선 축소
  - 입고 화면 안정화(탭 필터, 카운트, 입고 확정)
  - 스토어 경계 정리(입고 계산 책임 분리)

## 2) 완료된 작업

### 2.1 스토어/네이밍 정리 기반
- `storeOrder` 중심 구조 정리
- `storeInbound` 진입점 도입/사용
- `warehouseInbound` 네이밍 방향 반영

### 2.2 입고 리스트 동작 복구
- 입고 상태 탭(전체/배송 준비중/배송중/배송 완료/입고 완료) 클릭 반영 이슈 수정
- `ALL`/`전체` 키 혼선 보정
- 카운트 바인딩 및 반응형 갱신 누락 문제 보완

### 2.3 입고 확정 테스트 데이터 보강
- `ARRIVED` 샘플 주문 데이터 추가
- 샘플 주문 SKU를 재고 스토어에 존재하는 SKU로 정정
- 기존 로컬 데이터에 잘못된 SKU가 있을 때 fallback 보정 로직 추가

### 2.4 상태 라벨 변경
- 발주 상태 `COMPLETED`의 표시명을 `완료` -> `종료`로 변경
- 발주 히스토리/분석 화면 라벨 반영

### 2.5 화면 파싱 에러 복구
- `StoreOrderAnalysisView.vue`의 닫히지 않은 태그(`</p>`, `</h2>`) 복구
- Vite `Element is missing end tag` 에러 원인 제거

### 2.6 핵심 리팩토링: 입고 도메인 계산 책임 분리
- `storeInbound`에 입고 전용 계산 로직 이관:
  - 대상/목록/이력 산출
  - 필터(탭/검색/기간/정렬)
  - 요약/분석/카운트
- `storeOrder`에서 중복 입고 계산 로직 제거
  - `inboundTargetOrders`, `inboundListOrders`, `inboundHistoryOrders`
  - `filteredInboundList`, `filteredInboundHistory`
  - `inboundStatusCounts`, `inboundSummary`, `inboundAnalytics`

## 3) 현재 구조 요약
- `storeOrder`
  - 주문 원천 데이터/상태 변경 액션 담당
  - 입고 확정 액션(`confirmInbound`) 등 트랜잭션 동작 유지
- `storeInbound`
  - 입고 화면용 계산/필터/요약/분석 담당
  - 입고 UI의 사실상 도메인 스토어 역할 수행

## 4) 남은 리팩토링
1. 네이밍/참조 일관성 최종 정리
   - `warehouseInbound / storeOrder / storeInbound` 기준으로 import/변수명/주석/문서 통일
2. `storeOrders` shim 제거 시점 결정
   - 참조처 0건 확인 후 제거 + 회귀 점검

## 5) 리스크/주의사항
- 과거 작업 중 인코딩 손상 이력이 있어, 이후 편집 원칙 필요:
  - 한글 파일은 `apply_patch` 우선
  - 대량 치환/전체 덮어쓰기 지양
  - 수정 후 즉시 파싱/실행 확인

## 6) 권장 다음 단계
1. 백엔드 API 설계/연동 시작 (현재 구조로 진행 가능)
2. API 계약 확정 후 네이밍 일관성 정리(소규모 배치)
3. 마지막 안정화 단계에서 shim 제거


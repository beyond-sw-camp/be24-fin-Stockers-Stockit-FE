# Circular Sale FE 리팩토링 마스터 설계서
작성일: 2026-05-20  
대상: Stockit-FE 순환재고 판매

## 요약
순환재고 판매 기능의 FE-BE 연동을 안정화하고, 대형 store 비대 문제와 화면 정합성(상태 컬럼)을 최소 침습으로 개선한다.  
핵심 원칙은 **BE 단일 소스 데이터**, **FE는 UI 상태 중심**, **store 책임 분리**다.

## 확정 의사결정
1. 판매 내역 상태 표기 정책
- 내역 화면은 `outboundStatus` 단일 표기
- `status / outboundStatus` 결합 문자열 금지
- 상세 화면의 상태 표시 UI는 이번 범위에서 확장하지 않음(추후 작업)

2. 데이터 소스 정책
- 판매 도메인 사실 데이터(목록/상세/상태/수량/금액)는 BE 단일 소스
- FE에는 UI 상태(입력 draft, 탭/모달/토스트, 임시 입력값)만 유지
- 화면용 파생 계산은 view computed 우선, store 영속 상태 최소화

3. 구조 정책
- `circularStock.js`를 다음으로 분리
  - `circularStockSale`
  - `circularStockInventory`
- 기존 뷰 인터페이스는 최대 호환 유지

## 전체 구현 순서
### S1. 기준선 고정
- 필드 계약표 v1 확정(BE 응답 ↔ FE 사용 필드)
- 화면별 필드 사용표 확정(등록/내역/상세)
- 상태 표기 규약 v1 확정(`outboundStatus` 단일)

### S2. 필드 정리(중복/파생 최소화)
- store에서 중복 의미 필드 제거
- 별칭/레거시 파생 필드 축소
- 화면 계산은 computed로 이동

### S3. 내역 화면 정합성 수정
- 상태군 컬럼을 `outboundStatus` 단일로 교체
- `ARRIVED / ARRIVED` 제거
- 상태 라벨 변환 경로 단일화

### S4. store 분리 리팩토링
- 판매 상태/액션을 `circularStockSale`로 이동
- 재고 조회/페이지/필터 상태를 `circularStockInventory`로 이동
- 매퍼/액션/드래프트 로직 분리 정리

### S5. 화면 후정리
- 등록: 성공 토스트(`saleNo`) + 상세 라우팅(`saleId`) 유지
- 실패: BE 메시지 우선 노출 유지
- 상세: 서버 응답 중심 렌더 + buyer fallback 유지
- 미사용 코드 제거

### S6. 검증
- `npm.cmd run build`
- 수동 검증 5종
  1) 등록 성공 → 상세 이동
  2) 목록 필터/정렬/페이지
  3) 상세 렌더(헤더/라인/상태이력)
  4) 401 refresh 후 재시도
  5) 상태 컬럼 의도대로 표기
- lint 스크립트 부재 시 사유 기록

## 인터페이스/타입 변경 방향
- 판매 표준 필드 중심 유지:
  - `saleId`, `saleNo`, `outboundStatus`, `totalSoldQuantity`, `totalAmount`
- 중복 필드/별칭은 store 영속 상태에서 제거
- 상세 상태 UI는 데이터는 유지 가능하되 표시 정책은 추후 작업에서 결정

## 리스크 및 대응
- 리스크: store 분리 시 참조 깨짐, 파생 필드 제거로 화면 누락
- 대응: S1 계약 확정 후 단계적 반영, 단계별 빌드/수동 검증, 영향 검색(`rg`)으로 누락 방지

## 현재 완료된 선행 조치
- 로그아웃 시 순환재고 판매 draft 초기화 반영
- 파일: `src/stores/auth.js`
- 검증: `npm.cmd run build` 성공

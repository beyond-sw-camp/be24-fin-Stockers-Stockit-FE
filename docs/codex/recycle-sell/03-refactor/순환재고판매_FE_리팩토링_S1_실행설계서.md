# Circular Sale FE 리팩토링 S1 실행 설계서
작성일: 2026-05-20  
단계: S1 기준선 고정

## S1 목표
구현 전에 필드/표기/화면 사용 데이터 기준을 **결정 완료 상태**로 고정한다.  
S1 완료 후에는 구현자가 추가 의사결정 없이 S2~S4를 수행할 수 있어야 한다.

## S1 확정 정책
1. 상태 표기 정책
- 판매 내역 상태 컬럼은 `outboundStatus` 단일 표기
- `status / outboundStatus` 결합 표기 금지
- 상세 화면 상태 표시 UI는 이번 범위에서 확장하지 않음(추후 별도 작업)

2. 데이터 책임 분리
- BE: 도메인 사실 데이터
- FE: UI 상태(입력 draft, 탭/모달/토스트/임시 입력)

## S1 산출물
### 산출물 A: 필드 계약표 v1
대상 API
- `POST /api/hq/circular-inventory/sales`
- `GET /api/hq/circular-inventory/sales`
- `GET /api/hq/circular-inventory/sales/{saleId}`

반드시 포함
- BE 원본 필드
- FE 유지 필드
- 제거 대상(중복/별칭/레거시 파생)
- 사유(중복/표시용 계산/미사용)

### 산출물 B: 화면별 필드 사용표 v1
대상 화면
- 등록
- 내역
- 상세

반드시 포함
- 필드명
- 사용 위치(헤더/테이블/폼/요약)
- 출처(API 원본 / computed / UI 상태)
- store 유지 여부

### 산출물 C: 상태 표기 규약 v1
반드시 포함
- 내역 상태 컬럼 바인딩은 `outboundStatus`
- 상태 라벨 변환 규칙 단일 함수 경유
- 중복 표현 금지 규칙(`A / A` 금지)

## S1 작업 절차
1. 현재 코드 기준 필드 수집
- 스토어 매퍼(list/detail/create payload) 기준 필드 추출
- 등록/내역/상세 뷰의 실제 참조 필드 추출

2. 계약표 초안 작성
- API별 필드 매칭
- 중복 의미 필드 그룹핑

3. 제거 후보 분류
- 즉시 제거 가능
- S2에서 제거
- 추후 검토(기능 의존성 있음)

4. 상태 규약 고정
- 내역 컬럼 정책 문서화
- 상세 상태 UI는 추후 작업 메모

5. 완료 체크
- 구현자가 남은 선택 없이 S2 착수 가능한지 점검

## S1 기준 제거 후보(초안)
- `totalItems` (=`totalSkuCount`)
- `totalDeductedQuantity` (=`totalSoldQuantity`)
- `soldBy` (=`soldByName`)
- `itemName` (=`productName`)
- `deductedQuantity` (=`soldQuantity`)
- `requestedAmount`/`actualAmount` (현재 `lineAmount` 기반 중복)

참고:
- 화면 표시에 필요한 합계/카운트는 computed로 유지 가능
- store 영속 상태에는 중복 의미 필드 금지

## S1 완료 판정(DoD)
- 필드 계약표 v1 작성 완료
- 화면별 필드 사용표 v1 작성 완료
- 상태 표기 규약 v1 작성 완료
- S2/S3/S4 구현자가 추가 질의 없이 작업 가능한 상태

## 가정/기본값
- 이번 라운드 상태 정책은 `outboundStatus` 단일 표기로 고정
- 상세 상태 UI 확장은 이번 범위에서 제외
- lint 스크립트가 없으면 build + 수동 검증 중심으로 품질 확인

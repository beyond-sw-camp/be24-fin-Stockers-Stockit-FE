# 순환재고 판매 Draft 이탈 정책 구현 보고서

- 작성일: 2026-05-20
- 범위: HQ 순환재고 판매 등록

## 1. 구현 요약
등록 흐름 외 이동 시 draft 삭제 확인 모달을 띄우고, 확인 시 `clearDraft()` 후 원래 목적지로 이동하도록 구현했다. 또한 draft 존재 시 새로고침/탭닫기에 대해 브라우저 기본 경고가 뜨도록 적용했다.

## 2. 변경 파일
- `src/stores/hq/circularStock/circularStockSale.js`
- `src/views/hq/circular-stock/HqCircularStockSalesSkuSelectView.vue`
- `src/views/hq/circular-stock/HqCircularStockSalesRegisterView.vue`

## 3. 구현 상세
### 3.1 Store
- `hasActiveDraft` computed 추가
- 판정 기준:
  - `draftItems`
  - `draftBuyerId`
  - `draftMemo`
  - `step3GroupRequestedKg`
  - `hasStartedWorkflow`
- 반환 객체에 `hasActiveDraft` 공개

### 3.2 SKU 선택 화면
- `onBeforeRouteLeave` 추가
- 등록 흐름 라우트 집합 기반 이탈 판정
- 이탈 시 `next(false)` + 이탈 확인 모달 오픈
- `pendingNavigationTarget` 저장 후
  - 취소: 유지
  - 나가기: `clearDraft()` + `router.push(target)`
- `beforeunload` 리스너 추가/해제

### 3.3 등록 워크플로우 화면
- SKU 선택 화면과 동일한 정책으로 적용
- 이탈 확인 모달/목적지 저장/초기화 후 이동 로직 동일
- `beforeunload` 동일 적용

## 4. 정책 동작 결과
- 내부 이동(SKU↔workflow): 경고 없음
- 외부 이동: draft 있을 때 경고 모달
- 모달 확인: draft 삭제 후 이동
- 모달 취소: 현재 상태 유지
- 새로고침/탭닫기: draft 있을 때 기본 경고

## 5. 테스트 결과
- `npm.cmd run build`: 성공
- `npm.cmd run lint`: 실패 (`lint` 스크립트 없음)

## 6. 회귀 확인
- 등록 성공 후 상세 이동 정상
- 로그아웃 draft 초기화 기존 동작 유지
- 기존 SKU 조건변경 초기화 모달과 충돌 없음

# 순환재고 판매 Draft 이탈 정책 설계 보고서

- 작성일: 2026-05-20
- 범위: HQ 순환재고 판매 등록
- 대상 라우트: `/hq/circular-inventory/sales/register`, `/hq/circular-inventory/sales/register/workflow`

## 1. 배경
기존 판매 draft는 로그아웃/등록 성공 시점 외 자동 초기화가 없어, 사용자가 등록 흐름을 벗어나도 입력 상태가 남아 화면 정합성이 깨졌다.

## 2. 설계 목표
- draft 생명주기를 등록 흐름 내부로 한정
- 흐름 이탈 시 사용자 경고 후 확인 시 삭제
- 새로고침/탭닫기 경고 제공
- 기존 등록/상세 이동, 로그아웃 초기화와 충돌 금지

## 3. 핵심 설계
### 3.1 이탈 판정
- 등록 흐름 라우트 2개는 내부 이동으로 간주(경고 없음)
- 그 외 라우트 이동은 이탈 후보

### 3.2 가드 계층
- 전역 가드 미사용
- `HqCircularStockSalesSkuSelectView.vue`, `HqCircularStockSalesRegisterView.vue`에 `onBeforeRouteLeave` 적용
- 이유: 최소 침습, 기능 국소화, 모달 제어 단순화

### 3.3 draft 존재 판정 표준화
`useCircularStockSaleStore`에 `hasActiveDraft` 추가
- `draftItems.length > 0`
- `draftBuyerId` 존재
- `draftMemo` 존재
- `step3GroupRequestedKg` 키 존재
- `hasStartedWorkflow === true`

### 3.4 UX 정책
- 라우트 이탈: 커스텀 모달
- 브라우저 종료: `beforeunload` 기본 경고
- 문구 통일: `화면을 나가면 판매 등록 진행 중인 내용이 사라집니다.`

## 4. 인터페이스 영향
- Store 공개 값 추가: `hasActiveDraft` (read-only)
- FE-BE API 변경 없음
- Router 전역 정책 변경 없음

## 5. 예외/회귀 고려
- 등록 성공 후 상세 이동: 기존 `clearDraft()` 선행으로 경고 없이 허용
- 등록 흐름 내부 이동(SKU↔workflow): 항상 허용
- 기존 조건변경 초기화 모달과 상태 분리

## 6. 검증 계획
1. 내부 이동 시 경고 미발생
2. 외부 이동 시 경고 모달 노출
3. 취소 시 유지 / 확인 시 삭제+이동
4. 새로고침/탭닫기 경고
5. 등록 성공 상세 이동 회귀 확인
6. FE 빌드 확인

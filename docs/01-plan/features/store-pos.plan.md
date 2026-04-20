# store-pos Planning Document

> **Summary**: 매장 관리자 POS 판매 페이지 — 제품 목록 조회, 수량 입력, 판매 시 재고 차감
>
> **Project**: StockIT ERP Frontend
> **Version**: 0.0.0
> **Author**: saralove20
> **Date**: 2026-04-20
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 매장 관리자가 판매를 처리할 화면이 없어 재고 차감 불가, HQ도 실시간 재고 파악 어려움 |
| **Solution** | 공유 Pinia 스토어(useInventoryStore)로 제품 데이터 중앙화, StorePosView에서 판매 시 재고 차감 |
| **Function/UX Effect** | 테이블 형식 제품 목록 + 카테고리 필터 + 행별 수량 입력 + 판매 버튼, localStorage 재고 유지 |
| **Core Value** | 매장 판매와 HQ 재고가 동일 스토어를 공유하여 실시간 재고 일치 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 매장 판매 처리 화면 부재로 재고 관리 단절 |
| **WHO** | 매장 관리자(점주) — `/store/pos` 접근 |
| **RISK** | HQ 재고 현황 뷰 리팩토링 시 기존 UI 깨짐 가능성 |
| **SUCCESS** | 판매 후 StorePosView와 HQ InventoryStatusView 재고 수치 일치 |
| **SCOPE** | Phase 1: useInventoryStore + StorePosView / Phase 2: HQ 뷰 스토어 연결 |

---

## 1. Overview

### 1.1 Purpose

매장 관리자가 제품을 판매할 때 수량을 입력하고 판매 버튼을 누르면 재고가 차감되며, 동일한 재고 데이터를 HQ 재고 현황 뷰와 공유한다.

### 1.2 Background

현재 `StorePosView.vue`는 스캐폴드(준비 중) 상태다. `InventoryStatusView.vue`(HQ)는 하드코딩된 더미 데이터를 사용하고 있어 매장 판매와 연동이 없다. 공유 Pinia 스토어를 도입해 두 화면이 동일한 재고 데이터를 참조하도록 한다.

### 1.3 Related Documents

- 매장 관리자 RBAC: `docs/01-plan/features/rbac-login.plan.md`
- HQ 재고 현황 뷰: `src/views/hq/InventoryStatusView.vue`
- StorePosView 스캐폴드: `src/views/store/StorePosView.vue`

---

## 2. Scope

### 2.1 In Scope

- [x] `src/stores/inventory.js` — useInventoryStore (제품 데이터 + 판매 액션 + localStorage 유지)
- [x] `src/views/store/StorePosView.vue` — 전체 POS UI 구현
- [x] `src/views/hq/InventoryStatusView.vue` — 스토어 데이터 연결 (하드코딩 제거)
- [x] 카테고리 필터 탭
- [x] 제품명 검색
- [x] 행별 수량 입력 + 판매 버튼
- [x] 재고 부족/품절 상태 표시
- [x] 판매 성공 피드백 (토스트 또는 인라인)

### 2.2 Out of Scope

- 판매 이력 로그 (요구사항에서 제외)
- 결제 처리 (금액 계산은 표시하되 결제 플로우 없음)
- 바코드/QR 스캔
- 프린터 연동

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 제품 테이블 표시: 카테고리, 제품명, 단가, 현재 재고, 수량 입력, 판매 버튼 | High | Pending |
| FR-02 | 카테고리 탭 필터 (전체 + 각 카테고리) | High | Pending |
| FR-03 | 제품명 검색 (실시간 필터) | Medium | Pending |
| FR-04 | 수량 입력 후 판매 버튼 클릭 → 재고 차감 | High | Pending |
| FR-05 | 재고 0인 제품 → 품절 표시, 판매 버튼 비활성화 | High | Pending |
| FR-06 | 입력 수량 > 현재 재고 → 경고 표시, 판매 불가 | High | Pending |
| FR-07 | 판매 성공 시 인라인 피드백 (재고 수치 즉시 갱신) | Medium | Pending |
| FR-08 | localStorage에 재고 유지 (새로고침 후에도 반영) | High | Pending |
| FR-09 | HQ InventoryStatusView가 동일 스토어 데이터 표시 | High | Pending |

### 3.2 제품 데이터 명세 (HQ 참고)

```js
// 카테고리: 전자제품, 위생용품, 주방잡화, 문구/사무
[
  { id: 'ITM-E001', category: '전자제품',  name: '고속 충전기 (C타입) 25W',    unitPrice: 24900, stock: 1240 },
  { id: 'ITM-E004', category: '전자제품',  name: '무소음 무선 마우스 (블랙)',   unitPrice: 39900, stock: 0    },
  { id: 'ITM-E008', category: '전자제품',  name: '대용량 보조배터리 20000mAh', unitPrice: 59900, stock: 240  },
  { id: 'ITM-H002', category: '위생용품',  name: '휴대용 가글 (중) 250ml',     unitPrice: 4500,  stock: 12   },
  { id: 'ITM-K003', category: '주방잡화',  name: '유리제 머그컵 350ml',         unitPrice: 12000, stock: 85   },
  { id: 'ITM-S005', category: '문구/사무', name: 'A4 복사용지 80g (500매)',    unitPrice: 6500,  stock: 1200 },
  { id: 'ITM-S006', category: '문구/사무', name: '리무버블 데코 스티커 셋트',   unitPrice: 3900,  stock: 310  },
  { id: 'ITM-S007', category: '문구/사무', name: '스테이플러 심 (10호)',        unitPrice: 1500,  stock: 5    },
]
```

### 3.3 재고 상태 정의

| stock 값 | 상태 | 표시 색상 |
|---------|------|---------|
| 0 | 품절 | 빨강 |
| 1 ~ safetyStock | 부족/임박 | 주황 |
| safetyStock 초과 | 정상 | 초록 |

### 3.4 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| 성능 | 필터/검색 디바운스 없이 즉시 반응 (더미 데이터 크기 작음) |
| UX | 판매 버튼 클릭 후 재고 수치 즉시 갱신 (로딩 없음) |
| 유지보수 | 제품 데이터는 inventory.js store에만 위치 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] StorePosView 테이블에 제품 8개 이상 표시
- [ ] 카테고리 필터 탭 동작 확인
- [ ] 제품명 검색 동작 확인
- [ ] 판매 후 해당 제품 재고 수치 즉시 감소
- [ ] 재고 0 시 품절 표시 + 판매 버튼 비활성화
- [ ] 수량 > 재고 시 경고 표시
- [ ] HQ InventoryStatusView에서 동일 재고 수치 확인
- [ ] 새로고침 후 재고 유지 (localStorage)
- [ ] `npm run build` 성공

### 4.2 Quality Criteria

- [ ] 빌드 성공, 콘솔 에러 없음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| HQ InventoryStatusView 리팩토링 시 기존 테이블/필터 UI 깨짐 | High | Medium | HQ 뷰는 스토어 데이터 읽기만 연결, 기존 CSS/구조 최대 보존 |
| localStorage 데이터 구조 변경 시 파싱 오류 | Low | Low | try/catch + 실패 시 기본값 복원 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `src/views/store/StorePosView.vue` | View | 스캐폴드 → 전체 구현 |
| `src/views/hq/InventoryStatusView.vue` | View | 하드코딩 데이터 → useInventoryStore 연결 |

### 6.2 New Resources

| Resource | Type | 설명 |
|----------|------|------|
| `src/stores/inventory.js` | Pinia Store | 제품 목록 + stock + sell action + localStorage |

---

## 7. Architecture Considerations

### 7.1 useInventoryStore 인터페이스

```js
// state
products: [{ id, category, name, unitPrice, stock, safetyStock }]

// actions
sell(productId, quantity)
  → stock -= quantity
  → persist to localStorage

// getters
filteredProducts(category, search)
stockStatus(product)  // 'normal' | 'low' | 'out'
```

### 7.2 StorePosView 구조

```
StorePosView
├── AppLayout (roleMenus.store, @logout)
└── <slot>
    ├── 헤더 (제목 + 검색 input)
    ├── 카테고리 탭 (전체 | 전자제품 | 위생용품 | 주방잡화 | 문구/사무)
    └── 제품 테이블
        ├── thead: 카테고리 | 제품명 | 단가 | 현재재고 | 판매수량 | 판매
        └── tbody: v-for products
            ├── 재고 상태 배지 (정상/부족/품절)
            ├── number input (min=1, max=stock)
            └── 판매 버튼 (disabled when stock=0 or qty>stock)
```

### 7.3 파일 구조

```
src/
├── stores/
│   └── inventory.js        (신규)
└── views/
    ├── store/
    │   └── StorePosView.vue (수정: 스캐폴드 → 전체 구현)
    └── hq/
        └── InventoryStatusView.vue (수정: 스토어 연결)
```

---

## 8. Convention Prerequisites

- Pinia store: `useInventoryStore`, `src/stores/inventory.js`
- CSS: Tailwind (StorePosView), 기존 scoped CSS 유지 (HQ 뷰)
- localStorage key: `stockit_inventory`

---

## 9. Next Steps

1. [ ] `/pdca design store-pos` — 설계 문서
2. [ ] `/pdca do store-pos` — 구현
3. [ ] `/pdca analyze store-pos` — 갭 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-20 | Initial draft | saralove20 |

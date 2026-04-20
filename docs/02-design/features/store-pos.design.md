# store-pos Design Document

> **Summary**: Option C — useInventoryStore 중앙화 + StorePosView 테이블 UI + HQ 뷰 연결
>
> **Project**: StockIT ERP Frontend
> **Version**: 0.0.0
> **Author**: saralove20
> **Date**: 2026-04-20
> **Status**: Draft
> **Planning Doc**: [store-pos.plan.md](../../01-plan/features/store-pos.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 매장 판매 화면 부재로 재고 관리 단절, HQ와 재고 불일치 |
| **WHO** | 매장 관리자(점주) — `/store/pos` |
| **RISK** | HQ InventoryStatusView 리팩토링 시 기존 테이블 UI 깨짐 |
| **SUCCESS** | 판매 후 StorePosView·HQ 재고 수치 일치, localStorage 유지 |
| **SCOPE** | useInventoryStore 신규 + StorePosView 구현 + HQ 뷰 스토어 연결 |

---

## 1. Overview

### 1.1 Design Goals

- `useInventoryStore` 하나로 StorePosView(쓰기)·HQ InventoryStatusView(읽기) 재고 동기화
- Tailwind CSS로 StorePosView 구현, HQ 뷰 scoped CSS 변경 없음
- localStorage 키 `stockit_inventory`로 재고 유지

### 1.2 Design Principles

- **Single Source of Truth**: 재고 데이터는 `inventory.js` store 하나에만 존재
- **Non-Breaking HQ**: HQ 뷰는 데이터 소스만 교체, 레이아웃·CSS 변경 없음
- **Inline Logic**: 별도 composable 없이 `<script setup>` 내에서 처리

---

## 2. Architecture — Option C

### 2.1 데이터 흐름

```
useInventoryStore (Pinia)
  ├── state: products[] ← localStorage 복원
  ├── action: sell(id, qty) → stock 차감 → localStorage 저장
  └── computed: categories[]

StorePosView (쓰기)          HQ InventoryStatusView (읽기)
  useInventoryStore()           useInventoryStore()
  → products 표시               → products 표시 (기존 테이블 구조 유지)
  → sell() 호출                 → 읽기 전용
```

### 2.2 컴포넌트 의존 관계

| 컴포넌트 | 의존 | 역할 |
|---------|------|------|
| StorePosView | useInventoryStore, AppLayout, roleMenus | POS UI + 판매 처리 |
| HQ InventoryStatusView | useInventoryStore | 재고 현황 표시 (읽기) |
| useInventoryStore | localStorage | 제품 데이터 중앙 관리 |

---

## 3. Data Model

### 3.1 Product 인터페이스

```js
{
  id: String,          // 'ITM-E001'
  category: String,    // '전자제품' | '위생용품' | '주방잡화' | '문구/사무'
  name: String,        // 제품명
  unitPrice: Number,   // 단가 (원)
  stock: Number,       // 현재 재고
  safetyStock: Number, // 안전재고 기준
}
```

### 3.2 재고 상태

| 조건 | status | 배지 색상 |
|------|--------|---------|
| `stock === 0` | `'out'` | 빨강 |
| `stock <= safetyStock` | `'low'` | 주황 |
| `stock > safetyStock` | `'normal'` | 초록 |

### 3.3 useInventoryStore 인터페이스

```js
// state
products: Product[]

// computed
categories: string[]          // 중복 제거된 카테고리 목록

// actions
sell(productId, quantity)
  → stock -= quantity
  → saveToLocalStorage()
  → return { success, message }

// localStorage
STORAGE_KEY = 'stockit_inventory'
init() → localStorage에서 stock 복원 (products 구조는 코드 기준, stock만 덮어씀)
```

### 3.4 초기 제품 데이터

```js
[
  { id: 'ITM-E001', category: '전자제품',  name: '고속 충전기 (C타입) 25W',    unitPrice: 24900, stock: 1240, safetyStock: 100 },
  { id: 'ITM-E004', category: '전자제품',  name: '무소음 무선 마우스 (블랙)',   unitPrice: 39900, stock: 0,    safetyStock: 100 },
  { id: 'ITM-E008', category: '전자제품',  name: '대용량 보조배터리 20000mAh', unitPrice: 59900, stock: 240,  safetyStock: 50  },
  { id: 'ITM-H002', category: '위생용품',  name: '휴대용 가글 (중) 250ml',     unitPrice: 4500,  stock: 12,   safetyStock: 50  },
  { id: 'ITM-K003', category: '주방잡화',  name: '유리제 머그컵 350ml',         unitPrice: 12000, stock: 85,   safetyStock: 100 },
  { id: 'ITM-S005', category: '문구/사무', name: 'A4 복사용지 80g (500매)',    unitPrice: 6500,  stock: 1200, safetyStock: 400 },
  { id: 'ITM-S006', category: '문구/사무', name: '리무버블 데코 스티커 셋트',   unitPrice: 3900,  stock: 310,  safetyStock: 300 },
  { id: 'ITM-S007', category: '문구/사무', name: '스테이플러 심 (10호)',        unitPrice: 1500,  stock: 5,    safetyStock: 40  },
]
```

---

## 4. API / Store 명세 (Frontend Only)

백엔드 없음. Pinia store가 유일한 데이터 소스.

### 4.1 sell() 액션 동작

```
입력: productId (string), quantity (number)
검증:
  - quantity <= 0 → { success: false, message: '수량을 입력해주세요.' }
  - product 없음 → { success: false, message: '제품을 찾을 수 없습니다.' }
  - quantity > stock → { success: false, message: '재고가 부족합니다.' }
처리:
  - product.stock -= quantity
  - localStorage.setItem(STORAGE_KEY, JSON.stringify(stockMap))
반환: { success: true, message: '판매 완료' }
```

---

## 5. UI/UX Design

### 5.1 StorePosView 레이아웃

```
AppLayout (roleMenus.store, @logout)
└── <slot>
    ┌─────────────────────────────────────────────────────┐
    │  POS / 판매                    [검색 input]          │
    ├─────────────────────────────────────────────────────┤
    │  [전체] [전자제품] [위생용품] [주방잡화] [문구/사무]    │  ← 카테고리 탭
    ├──────┬────────────┬────────┬──────┬──────────┬──────┤
    │ 카테 │  제품명     │  단가  │ 재고 │ 판매수량  │  판매 │  ← thead
    ├──────┼────────────┼────────┼──────┼──────────┼──────┤
    │ 전자 │ 고속 충전기 │ 24,900 │ 1240 │ [  1  ▲▼]│[판매]│
    │ 전자 │ 무선 마우스 │ 39,900 │ 품절 │ [  -  ]  │[ -- ]│  ← 품절: 비활성
    │ 위생 │ 가글 250ml │  4,500 │  12  │ [  1  ▲▼]│[판매]│  ← 재고 부족 경고
    └──────┴────────────┴────────┴──────┴──────────┴──────┘
```

### 5.2 재고 상태별 행 표시

| 상태 | 재고 셀 | 판매수량 input | 판매 버튼 |
|------|---------|-------------|---------|
| 정상 | 숫자 (초록 배지) | 활성 | 활성 |
| 부족 | 숫자 (주황 배지) | 활성, max=stock | 활성 |
| 품절 | "품절" (빨강 배지) | disabled | disabled |

### 5.3 판매 성공 피드백

- 판매 버튼 클릭 → 재고 수치 즉시 갱신 (반응형)
- 수량 input → 1로 리셋
- 별도 모달/토스트 없음 (재고 숫자 변화가 피드백)

### 5.4 Page UI Checklist

#### StorePosView

- [ ] Heading: "POS / 판매" 페이지 제목
- [ ] Input: 제품명 검색 (text input, 실시간 필터)
- [ ] Tab: 카테고리 탭 (전체 + 각 카테고리, 활성 탭 강조)
- [ ] Table: 카테고리 | 제품명 | 단가 | 현재재고 | 판매수량 | 판매 컬럼
- [ ] Badge: 재고 상태 배지 (정상=초록, 부족=주황, 품절=빨강)
- [ ] Input: 판매수량 number input (min=1, max=stock, 품절 시 disabled)
- [ ] Button: 판매 버튼 (품절 또는 qty>stock 시 disabled)
- [ ] Text: 수량 초과 시 경고 텍스트 (인라인)

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| 수량 > 재고 | 판매 버튼 disabled + 행에 "재고 부족" 텍스트 |
| stock = 0 | input disabled + 버튼 disabled + "품절" 배지 |
| localStorage 파싱 실패 | try/catch → 기본 stock 값 사용 |

---

## 7. Security Considerations

- 프론트엔드 더미 데이터, 보안 위협 없음
- localStorage 조작 가능하나 MVP 범위 내 허용

---

## 8. Test Plan

### 8.1 L2: UI 동작 테스트

| # | 액션 | 기대 결과 |
|---|------|---------|
| 1 | 카테고리 탭 클릭 | 해당 카테고리 제품만 표시 |
| 2 | 검색 input 입력 | 제품명 포함 항목만 필터 |
| 3 | 수량 입력 후 판매 클릭 | 해당 제품 재고 수치 즉시 감소 |
| 4 | stock=0 제품 | input+버튼 disabled, 품절 배지 |
| 5 | 수량 > 재고 입력 | 버튼 disabled |

### 8.2 L3: E2E 시나리오

| # | 시나리오 | 성공 기준 |
|---|---------|---------|
| 1 | store 로그인 → POS 진입 → 판매 → HQ 로그인 → 재고 확인 | 두 화면 재고 일치 |
| 2 | 판매 → 새로고침 → 재고 유지 | localStorage 복원 확인 |

---

## 9. Clean Architecture

| 파일 | 레이어 | 역할 |
|------|-------|------|
| StorePosView.vue | Presentation | POS UI + 판매 인터랙션 |
| InventoryStatusView.vue | Presentation | 재고 현황 표시 (읽기) |
| inventory.js (store) | Application | 재고 상태 + 판매 비즈니스 로직 |

---

## 10. Coding Convention

| 항목 | 규칙 |
|------|------|
| StorePosView CSS | Tailwind utility classes |
| HQ InventoryStatusView CSS | 기존 scoped CSS 변경 없음 |
| Store | `useInventoryStore`, `src/stores/inventory.js` |
| localStorage key | `stockit_inventory` (stock map: `{ [id]: number }`) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── stores/
│   └── inventory.js              (신규)
└── views/
    ├── store/
    │   └── StorePosView.vue      (수정: 스캐폴드 → 전체 구현, Tailwind)
    └── hq/
        └── InventoryStatusView.vue (수정: 데이터 소스만 스토어로 교체)
```

### 11.2 Implementation Order

1. [ ] `src/stores/inventory.js` — 제품 데이터 + sell 액션 + localStorage
2. [ ] `src/views/store/StorePosView.vue` — 전체 POS UI
3. [ ] `src/views/hq/InventoryStatusView.vue` — useInventoryStore 연결
4. [ ] `npm run build` 검증

### 11.3 Session Guide

| Module | Scope Key | 설명 | 예상 |
|--------|-----------|------|:---:|
| inventory store | `module-1` | useInventoryStore + localStorage | 5턴 |
| StorePosView | `module-2` | 테이블 + 필터 + 판매 UI | 15턴 |
| HQ 뷰 연결 | `module-3` | InventoryStatusView 스토어 연결 | 5턴 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-20 | Initial draft — Option C | saralove20 |

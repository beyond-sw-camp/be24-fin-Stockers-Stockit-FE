# rbac-login Planning Document

> **Summary**: 역할 기반 로그인 기능 — 3가지 사용자 유형별 차별화된 메뉴/화면 제공
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
| **Problem** | 현재 시스템은 단일 HQ 관리자 화면만 존재하며, 역할별 접근 제어와 맞춤형 UI가 없음 |
| **Solution** | Pinia 기반 더미 인증 + Vue Router 가드로 역할별 라우팅 분기, 동일한 AppLayout 구조에 역할별 메뉴 구성 |
| **Function/UX Effect** | 로그인 시 역할 자동 감지 → 전용 메인 페이지 이동, 메뉴는 역할에 허용된 기능만 표시 |
| **Core Value** | 역할별 업무 집중 환경 제공으로 매장·본사·물류 담당자 각각의 워크플로우 효율화 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 단일 화면으로는 매장/본사/물류 담당자 각각의 업무를 지원할 수 없음 |
| **WHO** | 매장 관리자(점주), 본사 중앙 관리자, 물류 창고 관리자 |
| **RISK** | 라우터 가드 미적용 시 URL 직접 접근으로 권한 외 화면 노출 |
| **SUCCESS** | 3개 역할 로그인 성공, 각 역할 메뉴 정확히 표시, 권한 외 경로 접근 차단 |
| **SCOPE** | Phase 1: 인증 인프라(LoginView + store + router guard) / Phase 2: 역할별 뷰 스캐폴딩 |

---

## 1. Overview

### 1.1 Purpose

3가지 사용자 역할(매장 관리자, 본사 중앙 관리자, 물류 창고 관리자)이 각자의 이메일/비밀번호로 로그인하면, 역할에 맞는 메인 페이지와 사이드바 메뉴가 표시되도록 한다.

### 1.2 Background

현재 StockIT ERP 프론트엔드는 본사 중앙 관리자용 3개 화면(대시보드, 재고 현황, 발주 관리)만 구현되어 있다. 매장 관리자와 물류 창고 관리자를 위한 화면이 없고, 로그인 없이 바로 HQ 화면이 열린다. 역할 기반 라우팅과 인증 흐름을 도입하여 멀티롤 ERP 시스템의 기반을 마련한다.

### 1.3 Related Documents

- AppLayout 컴포넌트: `src/components/AppLayout.vue`
- 기존 HQ 뷰: `src/views/hq/`

---

## 2. Scope

### 2.1 In Scope

- [x] LoginView.vue — 이메일/비밀번호 입력 폼 (더미 인증)
- [x] useAuthStore (Pinia) — 역할 상태 관리 + 더미 자격증명
- [x] Vue Router 가드 — 미인증 시 `/login` 리다이렉트, 역할별 홈 분기
- [x] 본사 중앙 관리자 라우트 — 기존 HQ 뷰 재사용 (`/hq/*`)
- [x] 매장 관리자 라우트 — 스캐폴드 뷰 4개 (`/store/*`)
- [x] 물류 창고 관리자 라우트 — 스캐폴드 뷰 3개 (`/warehouse/*`)
- [x] AppLayout — 역할별 sideMenus 설정 분리

### 2.2 Out of Scope

- 실제 백엔드 API 연동 (더미 데이터만 사용)
- JWT 토큰 갱신/만료 처리
- 비밀번호 찾기 / 회원가입 화면
- 매장·물류 뷰의 실제 데이터 구현 (스캐폴드만)
- 권한별 세부 기능 잠금(버튼 레벨 RBAC)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `/login` 페이지에 이메일/비밀번호 입력 폼과 로그인 버튼 표시 | High | Pending |
| FR-02 | 더미 자격증명 3세트로 각 역할 로그인 가능 | High | Pending |
| FR-03 | 로그인 성공 시 역할별 홈 페이지로 자동 이동 | High | Pending |
| FR-04 | 인증되지 않은 상태에서 보호된 경로 접근 시 `/login`으로 리다이렉트 | High | Pending |
| FR-05 | 각 역할별 사이드바 메뉴 항목이 다르게 표시됨 | High | Pending |
| FR-06 | 로그아웃 버튼(AppLayout 우상단 사용자 카드) 클릭 시 인증 초기화 후 `/login` 이동 | High | Pending |
| FR-07 | 다른 역할의 경로 직접 접근 시 자신의 홈으로 리다이렉트 | Medium | Pending |
| FR-08 | 잘못된 자격증명 입력 시 오류 메시지 표시 | Medium | Pending |

### 3.2 더미 자격증명 명세

| 역할 | 이메일 | 비밀번호 | 홈 경로 |
|------|--------|---------|---------|
| 본사 중앙 관리자 | hq@stockit.com | hq1234 | `/hq/dashboard` |
| 매장 관리자 | store@stockit.com | store1234 | `/store/pos` |
| 물류 창고 관리자 | warehouse@stockit.com | wh1234 | `/warehouse/inventory` |

### 3.3 역할별 사이드바 메뉴

**본사 중앙 관리자 (`hq`)**
| 메뉴명 | 경로 | 아이콘 |
|--------|------|--------|
| 대시보드 | `/hq/dashboard` | layout |
| 재고 현황 | `/hq/inventory` | warehouse |
| 발주 관리 | `/hq/orders` | truck |

**매장 관리자 (`store`)**
| 메뉴명 | 경로 | 아이콘 |
|--------|------|--------|
| POS / 판매 | `/store/pos` | store |
| 주문 관리 | `/store/orders` | file |
| 내 재고 관리 | `/store/inventory` | warehouse |
| 입고 관리 | `/store/inbound` | check |

**물류 창고 관리자 (`warehouse`)**
| 메뉴명 | 경로 | 아이콘 |
|--------|------|--------|
| 창고 재고 관리 | `/warehouse/inventory` | warehouse |
| 입고 관리 | `/warehouse/inbound` | check |
| 출고 관리 | `/warehouse/outbound` | truck |

### 3.4 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 보안 | URL 직접 접근 시 권한 외 화면 노출 없음 | 수동 테스트 |
| UX | 로그인 → 홈 이동까지 200ms 이내 | 브라우저 DevTools |
| 유지보수 | 역할별 메뉴 설정이 단일 파일에 집중 관리 | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 3개 역할 더미 로그인 모두 동작
- [ ] 각 역할 로그인 후 올바른 홈 페이지 진입 확인
- [ ] 미인증 URL 직접 접근 시 `/login` 리다이렉트 확인
- [ ] 로그아웃 후 보호 경로 접근 차단 확인
- [ ] 각 역할 사이드바 메뉴 항목 정확성 확인
- [ ] `npm run build` 성공 (타입 에러 없음)

### 4.2 Quality Criteria

- [ ] 린트 에러 없음
- [ ] 빌드 성공
- [ ] 콘솔 에러 없음 (runtime)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 라우터 가드에서 역할 검사 누락으로 크로스롤 접근 허용 | High | Medium | 가드에서 role prefix 검사 + 역할 외 경로는 홈으로 리다이렉트 |
| Pinia store가 새로고침 시 초기화되어 인증 상태 손실 | Medium | High | sessionStorage 또는 localStorage persist (pinia-plugin-persistedstate 또는 직접 구현) |
| AppLayout의 logout 핸들러 미구현으로 로그아웃 불가 | Medium | Medium | AppLayout에 `@logout` 이벤트 emit, 각 역할 뷰에서 useAuthStore 호출 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `src/router/index.js` | Router Config | 전체 재작성 — 역할별 중첩 라우트 + beforeEach 가드 추가 |
| `src/components/AppLayout.vue` | Component | logout emit 이벤트 추가 |
| `src/views/hq/ErpDashboardView.vue` | View | 경로 `/` → `/hq/dashboard` 변경에 따른 sideMenus 경로 수정 |
| `src/views/hq/InventoryStatusView.vue` | View | sideMenus 경로 수정 |
| `src/views/hq/OrderManagementView.vue` | View | sideMenus 경로 수정 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `router/index.js` routes | READ | `main.js` → `app.use(router)` | Needs verification |
| `router/index.js` routes | READ | `AppLayout.vue` → `router-link` in sideMenus | Breaking — 경로 변경 |
| `ErpDashboardView.vue` sideMenus | READ | 자체 참조 (v-for) | Needs verification |

### 6.3 Verification

- [ ] 기존 HQ 뷰 3개가 새 경로(`/hq/*`)에서 정상 렌더링
- [ ] AppLayout sideMenus의 경로가 새 router와 일치
- [ ] 빌드 후 console.warn 없음

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected |
|-------|:--------:|
| Starter | ☐ |
| **Dynamic** | ✅ |
| Enterprise | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Framework | Vue 3 + Vite | 기존 프로젝트 유지 |
| State Management | Pinia (useAuthStore) | 기존 프로젝트 사용 중 |
| 인증 방식 | 더미 credentials (hardcoded) | 백엔드 없음, 프론트 MVP |
| 라우터 가드 | beforeEach + meta.requiresAuth + meta.role | Vue Router 표준 패턴 |
| 역할별 메뉴 설정 | `src/config/roleMenus.js` 단일 파일 | 메뉴 변경 시 한 곳만 수정 |
| 세션 유지 | localStorage (직접 구현) | 외부 의존성 최소화 |
| Styling | Scoped CSS (기존 패턴 유지) | 일관성 |

### 7.3 File Structure Preview

```
src/
├── components/
│   └── AppLayout.vue          (수정: logout emit 추가)
├── config/
│   └── roleMenus.js           (신규: 역할별 메뉴 설정)
├── stores/
│   └── auth.js                (신규: useAuthStore)
├── views/
│   ├── LoginView.vue          (신규)
│   ├── hq/
│   │   ├── ErpDashboardView.vue     (수정: sideMenus 경로)
│   │   ├── InventoryStatusView.vue  (수정: sideMenus 경로)
│   │   └── OrderManagementView.vue  (수정: sideMenus 경로)
│   ├── store/
│   │   ├── StorePosView.vue         (신규 스캐폴드)
│   │   ├── StoreOrdersView.vue      (신규 스캐폴드)
│   │   ├── StoreInventoryView.vue   (신규 스캐폴드)
│   │   └── StoreInboundView.vue     (신규 스캐폴드)
│   └── warehouse/
│       ├── WarehouseInventoryView.vue (신규 스캐폴드)
│       ├── WarehouseInboundView.vue   (신규 스캐폴드)
│       └── WarehouseOutboundView.vue  (신규 스캐폴드)
└── router/
    └── index.js               (전체 재작성)
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [ ] CLAUDE.md — 없음
- [ ] ESLint — 없음 (Vite 기본)
- [x] Vue 3 Composition API (`<script setup>`) — 전체 적용
- [x] Scoped CSS — 전체 적용
- [x] Pinia stores in `src/stores/` — 기존 `counter.js` 존재

### 8.2 Conventions to Apply

| Category | Rule |
|----------|------|
| Store 파일명 | camelCase (`auth.js`), export `useAuthStore` |
| View 파일명 | PascalCase + 역할 prefix (`StoreOrdersView.vue`) |
| Router meta | `requiresAuth: Boolean`, `role: String ('hq'|'store'|'warehouse')` |
| 더미 credentials | `src/stores/auth.js` 내부에만 위치 (설정 파일 분리 안 함) |

### 8.3 Environment Variables Needed

없음 (더미 데이터, 백엔드 연동 없음)

---

## 9. Next Steps

1. [ ] `/pdca design rbac-login` — 설계 문서 작성 (컴포넌트 구조, 라우터 설계, store 인터페이스)
2. [ ] `/pdca do rbac-login` — 구현 (Phase 1: 인증 인프라, Phase 2: 역할별 뷰 스캐폴딩)
3. [ ] `/pdca analyze rbac-login` — 갭 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-20 | Initial draft | saralove20 |

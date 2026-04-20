# rbac-login Design Document

> **Summary**: Option C (Pragmatic) — roleMenus.js 중앙 관리 + Tailwind CSS 신규 뷰
>
> **Project**: StockIT ERP Frontend
> **Version**: 0.0.0
> **Author**: saralove20
> **Date**: 2026-04-20
> **Status**: Draft
> **Planning Doc**: [rbac-login.plan.md](../../01-plan/features/rbac-login.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 단일 화면으로는 매장/본사/물류 담당자 각각의 업무를 지원할 수 없음 |
| **WHO** | 매장 관리자(점주), 본사 중앙 관리자, 물류 창고 관리자 |
| **RISK** | 라우터 가드 미적용 시 URL 직접 접근으로 권한 외 화면 노출 |
| **SUCCESS** | 3개 역할 로그인 성공, 각 역할 메뉴 정확히 표시, 권한 외 경로 접근 차단 |
| **SCOPE** | Phase 1: 인증 인프라 / Phase 2: 역할별 뷰 스캐폴딩 |

---

## 1. Overview

### 1.1 Design Goals

- `roleMenus.js` 단일 파일로 모든 역할의 사이드바 메뉴를 중앙 관리
- Vue Router `beforeEach` 가드로 인증/역할 접근 제어
- Tailwind CSS를 신규 뷰(LoginView, store/*, warehouse/*)에 적용 — 기존 HQ 뷰 CSS 변경 없음
- AppLayout.vue는 구조(logout emit 추가)만 최소 수정

### 1.2 Design Principles

- **Central Config**: 역할별 메뉴는 `src/config/roleMenus.js` 한 곳에서만 정의
- **Non-Breaking**: 기존 HQ 뷰 3개는 CSS/로직 변경 없이 경로만 업데이트
- **Tailwind for New**: 신규 뷰에만 Tailwind 적용, 기존 scoped CSS는 건드리지 않음
- **Minimal Deps**: localStorage 직접 구현, 외부 auth 라이브러리 불필요

---

## 2. Architecture — Option C (Pragmatic)

### 2.0 선택 이유

| 기준 | 결정 |
|------|------|
| 선택 | **Option C — Pragmatic Balance** |
| 핵심 이유 | 역할 추가 시 roleMenus.js 한 파일만 수정, 기존 구조 최대 보존 |
| CSS 전략 | 신규 뷰 Tailwind CSS, 기존 뷰 scoped CSS 유지 |

### 2.1 컴포넌트 다이어그램

```
LoginView
    │ submit
    ▼
useAuthStore ──── localStorage (persist)
    │ role
    ▼
router/index.js (beforeEach guard)
    │ role prefix match
    ├── /hq/*    → HQ 뷰 (기존 그대로)
    ├── /store/* → Store 뷰 (Tailwind 신규)
    └── /wh/*   → Warehouse 뷰 (Tailwind 신규)

각 뷰:
    import roleMenus from '@/config/roleMenus.js'
    │
    ▼
AppLayout
  props: sideMenus = roleMenus[role]
  emit: @logout → useAuthStore.logout() → router.push('/login')
```

### 2.2 데이터 흐름

```
사용자 입력(email/pw)
  → useAuthStore.login()
  → credentials 매칭 → role 확정
  → localStorage.setItem('auth', JSON.stringify({role, user}))
  → router.push(roleHomeMap[role])

페이지 새로고침:
  → useAuthStore init → localStorage.getItem('auth') → 상태 복원
  → router guard → 이미 인증됨 → 정상 진입

로그아웃:
  → AppLayout emit('logout')
  → 각 뷰 handleLogout() → useAuthStore.logout()
  → localStorage.removeItem('auth')
  → router.push('/login')
```

### 2.3 의존 관계

| 컴포넌트 | 의존 | 목적 |
|---------|------|------|
| LoginView | useAuthStore, vue-router | 인증 처리 후 역할 홈으로 이동 |
| 각 역할 뷰 | AppLayout, roleMenus, useAuthStore | 레이아웃 + 메뉴 주입 + 로그아웃 |
| router/index.js | useAuthStore | 가드에서 인증 상태·역할 확인 |
| AppLayout | (수정) emit logout | 로그아웃 이벤트 전파 |

---

## 3. Data Model

### 3.1 Auth State (Pinia + localStorage)

```js
// useAuthStore state
{
  user: {
    email: String,
    name: String,
    role: 'hq' | 'store' | 'warehouse'
  } | null,
  isAuthenticated: Boolean
}
```

### 3.2 더미 Credentials

```js
const DUMMY_USERS = [
  { email: 'hq@stockit.com',        password: 'hq1234',    role: 'hq',        name: '본사 관리자' },
  { email: 'store@stockit.com',     password: 'store1234', role: 'store',     name: '매장 관리자' },
  { email: 'warehouse@stockit.com', password: 'wh1234',    role: 'warehouse', name: '창고 관리자' },
]
```

### 3.3 roleMenus 구조

```js
// src/config/roleMenus.js
export const roleMenus = {
  hq: [
    { label: '대시보드',  path: '/hq/dashboard', icon: 'layout'    },
    { label: '재고 현황', path: '/hq/inventory',  icon: 'warehouse' },
    { label: '발주 관리', path: '/hq/orders',     icon: 'truck'     },
  ],
  store: [
    { label: 'POS / 판매',   path: '/store/pos',       icon: 'store'     },
    { label: '주문 관리',    path: '/store/orders',    icon: 'file'      },
    { label: '내 재고 관리', path: '/store/inventory', icon: 'warehouse' },
    { label: '입고 관리',    path: '/store/inbound',   icon: 'check'     },
  ],
  warehouse: [
    { label: '창고 재고 관리', path: '/warehouse/inventory', icon: 'warehouse' },
    { label: '입고 관리',     path: '/warehouse/inbound',   icon: 'check'     },
    { label: '출고 관리',     path: '/warehouse/outbound',  icon: 'truck'     },
  ],
}

export const roleHomeMap = {
  hq:        '/hq/dashboard',
  store:     '/store/pos',
  warehouse: '/warehouse/inventory',
}
```

---

## 4. Router 설계

### 4.1 라우트 구조

```js
[
  { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },

  // HQ (기존 뷰 재사용, 경로만 변경)
  { path: '/hq/dashboard', name: 'hq-dashboard', component: ErpDashboardView,    meta: { requiresAuth: true, role: 'hq' } },
  { path: '/hq/inventory', name: 'hq-inventory', component: InventoryStatusView, meta: { requiresAuth: true, role: 'hq' } },
  { path: '/hq/orders',    name: 'hq-orders',    component: OrderManagementView,  meta: { requiresAuth: true, role: 'hq' } },

  // Store (신규 스캐폴드)
  { path: '/store/pos',       name: 'store-pos',       component: StorePosView,       meta: { requiresAuth: true, role: 'store' } },
  { path: '/store/orders',    name: 'store-orders',    component: StoreOrdersView,    meta: { requiresAuth: true, role: 'store' } },
  { path: '/store/inventory', name: 'store-inventory', component: StoreInventoryView, meta: { requiresAuth: true, role: 'store' } },
  { path: '/store/inbound',   name: 'store-inbound',   component: StoreInboundView,   meta: { requiresAuth: true, role: 'store' } },

  // Warehouse (신규 스캐폴드)
  { path: '/warehouse/inventory', name: 'wh-inventory', component: WarehouseInventoryView, meta: { requiresAuth: true, role: 'warehouse' } },
  { path: '/warehouse/inbound',   name: 'wh-inbound',   component: WarehouseInboundView,   meta: { requiresAuth: true, role: 'warehouse' } },
  { path: '/warehouse/outbound',  name: 'wh-outbound',  component: WarehouseOutboundView,  meta: { requiresAuth: true, role: 'warehouse' } },

  // Fallback
  { path: '/', redirect: '/login' },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]
```

### 4.2 Router Guard 로직

```js
router.beforeEach((to, from) => {
  const auth = useAuthStore()
  const { isAuthenticated, user } = auth

  // 1. 인증 불필요 페이지 (login)
  if (!to.meta.requiresAuth) {
    if (isAuthenticated) return roleHomeMap[user.role]  // 이미 로그인 → 홈으로
    return true
  }

  // 2. 미인증 → 로그인 페이지
  if (!isAuthenticated) return { name: 'login' }

  // 3. 역할 미스매치 → 자신의 홈으로
  if (to.meta.role && to.meta.role !== user.role) return roleHomeMap[user.role]

  return true
})
```

---

## 5. UI/UX Design

### 5.1 LoginView 화면 레이아웃

```
┌─────────────────────────────────┐
│  (전체 화면 중앙 정렬, 어두운 배경)   │
│  ┌───────────────────────────┐  │
│  │  StockIT ERP              │  │
│  │  [로고/브랜드명]            │  │
│  │                           │  │
│  │  이메일 ─────────────────  │  │
│  │  비밀번호 ────────────────  │  │
│  │                           │  │
│  │  [로그인]                  │  │
│  │                           │  │
│  │  오류 메시지 (조건부)        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

디자인 참고: 기존 AppLayout의 브랜드 색상(#1a2b4a, #2a7fff) 계승

### 5.2 스캐폴드 뷰 레이아웃

```
AppLayout (기존 그대로)
  └── <slot>
        ┌─────────────────────────────┐
        │  [페이지 제목]               │
        │  준비 중인 기능입니다.        │
        │  (아이콘 + 설명 텍스트)       │
        └─────────────────────────────┘
```

### 5.3 컴포넌트 목록

| 컴포넌트/파일 | 위치 | 역할 | CSS |
|-------------|------|------|-----|
| LoginView.vue | `src/views/` | 로그인 폼 | Tailwind |
| StorePosView.vue | `src/views/store/` | POS 스캐폴드 | Tailwind |
| StoreOrdersView.vue | `src/views/store/` | 주문 스캐폴드 | Tailwind |
| StoreInventoryView.vue | `src/views/store/` | 재고 스캐폴드 | Tailwind |
| StoreInboundView.vue | `src/views/store/` | 입고 스캐폴드 | Tailwind |
| WarehouseInventoryView.vue | `src/views/warehouse/` | 창고재고 스캐폴드 | Tailwind |
| WarehouseInboundView.vue | `src/views/warehouse/` | 입고 스캐폴드 | Tailwind |
| WarehouseOutboundView.vue | `src/views/warehouse/` | 출고 스캐폴드 | Tailwind |
| roleMenus.js | `src/config/` | 역할별 메뉴 중앙 설정 | - |
| auth.js (store) | `src/stores/` | 인증 상태 관리 | - |
| AppLayout.vue | `src/components/` | logout emit 추가 | scoped CSS 유지 |
| index.js (router) | `src/router/` | 전체 재작성 | - |

### 5.4 Page UI Checklist

#### LoginView

- [ ] Input: 이메일 (type="email", placeholder, required)
- [ ] Input: 비밀번호 (type="password", placeholder, required)
- [ ] Button: 로그인 (submit, loading 상태)
- [ ] Text: 브랜드명 "StockIT ERP" 헤더
- [ ] Alert: 오류 메시지 (잘못된 자격증명, 조건부 표시)

#### 스캐폴드 뷰 (store/warehouse 공통)

- [ ] Heading: 페이지 제목
- [ ] Icon: 페이지 대표 아이콘
- [ ] Text: "준비 중인 기능입니다" 안내 텍스트
- [ ] AppLayout wrapper (sideMenus, activeSideMenu, @logout)

---

## 6. Error Handling

| 상황 | 처리 |
|------|------|
| 잘못된 이메일/비밀번호 | LoginView에 "이메일 또는 비밀번호가 올바르지 않습니다" 표시 |
| 미인증 경로 접근 | router guard → `/login` 리다이렉트 |
| 역할 외 경로 접근 | router guard → 자신의 홈으로 리다이렉트 |
| localStorage 파싱 실패 | try/catch → null 처리, 재로그인 유도 |

---

## 7. Security Considerations

- [ ] 더미 credentials는 store 파일 내부에만 위치 (소스 코드 배포 전제이므로 OK)
- [ ] router guard는 모든 protected 경로에 적용
- [ ] 역할 prefix 불일치 시 무조건 자신의 홈으로 리다이렉트

---

## 8. Test Plan

### 8.1 Test Scope

| Type | 대상 | 방법 |
|------|------|------|
| L2: UI 동작 | LoginView 폼 제출, 오류 메시지 | 수동 브라우저 테스트 |
| L3: E2E 시나리오 | 3개 역할 로그인 → 홈 이동 → 메뉴 확인 → 로그아웃 | 수동 브라우저 테스트 |

### 8.2 L3 시나리오

| # | 시나리오 | 단계 | 성공 기준 |
|---|---------|------|---------|
| 1 | HQ 로그인 | `/login` → hq@stockit.com/hq1234 → submit | `/hq/dashboard` 이동, 사이드바 3개 메뉴 |
| 2 | Store 로그인 | `/login` → store@stockit.com/store1234 → submit | `/store/pos` 이동, 사이드바 4개 메뉴 |
| 3 | Warehouse 로그인 | `/login` → warehouse@stockit.com/wh1234 → submit | `/warehouse/inventory` 이동, 사이드바 3개 메뉴 |
| 4 | 미인증 접근 차단 | 로그아웃 후 `/hq/dashboard` 직접 접근 | `/login`으로 리다이렉트 |
| 5 | 크로스롤 접근 차단 | store 로그인 후 `/hq/dashboard` 접근 | `/store/pos`로 리다이렉트 |
| 6 | 로그아웃 | 로그인 상태에서 우상단 로그아웃 클릭 | `/login`으로 이동 |
| 7 | 새로고침 유지 | 로그인 후 F5 | 동일 페이지 유지 (localStorage 복원) |

---

## 9. Clean Architecture (Vue 3 적용)

### 9.1 레이어 배정

| 파일 | 레이어 | 위치 |
|------|-------|------|
| LoginView.vue, *View.vue | Presentation | `src/views/` |
| AppLayout.vue | Presentation | `src/components/` |
| useAuthStore | Application | `src/stores/auth.js` |
| roleMenus.js | Domain (config) | `src/config/roleMenus.js` |
| router/index.js | Infrastructure | `src/router/` |

---

## 10. Coding Convention

| 항목 | 규칙 |
|------|------|
| 신규 뷰 CSS | Tailwind utility classes (scoped 없음) |
| 기존 뷰 CSS | scoped CSS 변경 없음 |
| Store | `useAuthStore`, Composition API |
| 더미 데이터 | `DUMMY_USERS` 상수, auth.js 내부 |
| 타입 체크 | JS (TypeScript 미사용, 기존 프로젝트 일치) |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── config/
│   └── roleMenus.js              (신규)
├── stores/
│   └── auth.js                   (신규)
├── views/
│   ├── LoginView.vue             (신규 - Tailwind)
│   ├── hq/                       (기존 - sideMenus 경로만 수정)
│   │   ├── ErpDashboardView.vue
│   │   ├── InventoryStatusView.vue
│   │   └── OrderManagementView.vue
│   ├── store/                    (신규 - Tailwind 스캐폴드)
│   │   ├── StorePosView.vue
│   │   ├── StoreOrdersView.vue
│   │   ├── StoreInventoryView.vue
│   │   └── StoreInboundView.vue
│   └── warehouse/                (신규 - Tailwind 스캐폴드)
│       ├── WarehouseInventoryView.vue
│       ├── WarehouseInboundView.vue
│       └── WarehouseOutboundView.vue
├── components/
│   └── AppLayout.vue             (수정: logout emit)
└── router/
    └── index.js                  (전체 재작성)
```

### 11.2 Implementation Order

1. [ ] Tailwind CSS 설치 (`@tailwindcss/vite` + `tailwindcss`)
2. [ ] `src/config/roleMenus.js` 생성
3. [ ] `src/stores/auth.js` 생성 (useAuthStore)
4. [ ] `src/router/index.js` 재작성 (가드 + 역할별 라우트)
5. [ ] `src/components/AppLayout.vue` 수정 (logout emit)
6. [ ] `src/views/LoginView.vue` 생성 (Tailwind)
7. [ ] HQ 뷰 3개 sideMenus 경로 수정
8. [ ] Store 뷰 4개 스캐폴드 생성 (Tailwind)
9. [ ] Warehouse 뷰 3개 스캐폴드 생성 (Tailwind)
10. [ ] `npm run build` 검증

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | 예상 |
|--------|-----------|-------------|:---:|
| 인증 인프라 | `module-1` | Tailwind 설치 + roleMenus + store + router + AppLayout | 15턴 |
| LoginView | `module-2` | 로그인 화면 구현 (Tailwind) | 5턴 |
| HQ 뷰 수정 | `module-3` | 기존 3개 뷰 sideMenus 경로 업데이트 | 5턴 |
| 신규 뷰 스캐폴드 | `module-4` | store 4개 + warehouse 3개 (Tailwind) | 10턴 |

#### Recommended Session Plan

| 세션 | 범위 | Scope Key |
|------|------|---------|
| 현재 세션 | 전체 구현 (10개 파일 이하) | 전체 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-20 | Initial draft — Option C + Tailwind | saralove20 |

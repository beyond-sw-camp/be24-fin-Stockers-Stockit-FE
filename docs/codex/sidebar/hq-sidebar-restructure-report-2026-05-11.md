# 사이드바 메뉴 구조 개편 통합 보고서

## 1) 문서 개요
본 문서는 사이드바 메뉴 구조 개편 내역을 **권한 단위**로 정리한 통합 보고서입니다.  
현재는 HQ(본사), Store(매장) 반영 내역이 완료되어 있으며, Warehouse(물류창고) 개편 내용은 후속 섹션에 추가 가능한 구조로 준비했습니다.

---

## 2) HQ(본사 관리자) 개편 정리

### 2-1. 핵심 개편 요약
- 대시보드 단일화: `본사 대시보드` 상위 단일 메뉴화(하위 제거)
- 재고 구조 2축화:
  - `전사 재고 조회` (상위 단일)
  - `물류 창고간 재고이동` (상위 + 하위 `재고 이동`, `재고 이동 내역`)
- 발주 구조 단순화: `물류 창고 발주` 상위 단일화 + 공급처 관리 제거
- 순환 재고 정리: `순환 재고 후보 조회` → `순환 재고 전환`, 판매 분석 제거
- 인프라 정리: `매장/창고 정보 관리` 상위 단일화 + 매핑 관리 제거
- 배치 승인 정리: `매장 발주 배치 처리` 상위 단일화
- 메뉴 순서/아이콘 정리: 요청 순서 반영 + Lucide 아이콘 체계로 통일

### 2-2. 라우터/파일 정리 요약
- 제거된 주요 라우트(예시):
  - `/hq/vendors`
  - `/hq/infrastructure/mappings`
  - `/hq/circular-inventory/sales/analysis`
- 삭제된 주요 페이지(예시):
  - `HqVendorManagementView.vue`
  - `HqInfrastructureMappingView.vue`
  - `HqCircularStockSalesAnalysisView.vue`
- 기타 참조 0 코드/컴포넌트 정리 완료

### 2-3. 현재 HQ 상위 메뉴 구조 (최신)
```text
HQ
├─ 본사 대시보드 (/hq/dashboard)
├─ 전사 재고 조회 (/hq/inventory/company-wide)
├─ 물류 창고 발주 (/hq/purchase-orders)
├─ 물류 창고간 재고이동 (/hq/inventory/warehouse-comparison)
│  ├─ 재고 이동 (/hq/inventory/warehouse-comparison)
│  └─ 재고 이동 내역 (/hq/inventory/warehouse-transfer-history)
├─ 순환 재고 관리 (/hq/circular-inventory/candidates)
│  ├─ 순환 재고 전환 (/hq/circular-inventory/candidates)
│  ├─ 순환 재고 조회 (/hq/circular-inventory)
│  ├─ 순환 재고 거래처 관리 (/hq/circular-inventory/buyers)
│  ├─ 순환 재고 판매 등록 (/hq/circular-inventory/sales/register)
│  └─ 순환 재고 판매 내역 (/hq/circular-inventory/sales/history)
├─ 상품 관리 (/hq/products)
│  ├─ 카테고리 관리 (/hq/products?tab=categories)
│  └─ 제품 마스터 (/hq/products?tab=products)
├─ 매장/창고 정보 관리 (/hq/infrastructure)
├─ 매장 발주 배치 처리 (/hq/batch/store-order-approve)
├─ ESG 대시보드 (/hq/esg)
│  ├─ 친환경 발자국 현황판 (/hq/esg)
│  ├─ 친환경 나무 키우기 점수 (/hq/esg/tree-score)
│  ├─ 탄소중립 관리 (/hq/esg/emissionquota)
│  └─ 배출권 시장 가치 (/hq/esg/carbon-price)
├─ 정산/통계 (/hq/analytics)
│  ├─ 통합 KPI 대시보드 (/hq/analytics)
│  ├─ 판매량 통계 (/hq/analytics/sales)
│  ├─ 재고 회전율 통계 (/hq/analytics/turnover)
│  ├─ 발주량 통계 (/hq/analytics/order-stats)
│  └─ 순환재고 거래처 통계 (/hq/analytics/vendors)
└─ 계정 관리 (/hq/accounts)
   ├─ 회원가입 승인 (/hq/accounts/approvals)
   └─ 계정 관리 (/hq/accounts)
```

---

## 3) Store(매장 관리자) 개편 정리

### 3-1. 핵심 개편 요약
- 대시보드/재고 단일 상위화:
  - `대시보드` 상위 단일
  - `재고 관리` → `매장 재고 조회` 상위 단일
- 판매/발주 분석 제거:
  - `판매 분석` 메뉴/라우트/페이지 제거
  - `발주 분석` 메뉴/라우트/페이지 제거
- 입고 관리 단일화:
  - `입고 관리` 상위 단일
  - `입고 분석` 메뉴/라우트/페이지 제거
- 통계 구조 개편:
  - 통계 상위 메뉴 삭제
  - 기존 통계 화면을 `/store/dashboard`로 연결
  - 기존 대시보드 화면은 `/store/dashboard2`로 분리
  - `/store/stats` 라우트 삭제

### 3-2. 파일 리네이밍/이동
- 기존 대시보드:
  - `src/views/store/dashboard/StoreDashboardView.vue`
  - → `src/views/store/dashboard/StoreDashboardView2.vue`
- 기존 통계:
  - `src/views/store/stats/StoreStatsView.vue`
  - → `src/views/store/dashboard/StoreDashboardView.vue` (폴더 이동 + 파일명 변경)
- 두 파일 모두 삭제 없이 유지

### 3-3. 현재 Store 상위 메뉴 구조 (최신)
```text
STORE
├─ 대시보드 (/store/dashboard)                # 기존 통계 화면
├─ 매장 재고 조회 (/store/inventory)
├─ 판매 관리 (/store/sales/register)
│  ├─ POS / 판매 등록 (/store/sales/register)
│  └─ 판매 내역 (/store/sales/history)
├─ 발주 관리 (/store/orders/request)
│  ├─ 발주 요청 (/store/orders/request)
│  └─ 발주 내역 (/store/orders/history)
└─ 입고 관리 (/store/inbound/list)
```

### 3-4. Store 라우트 핵심 매핑
- `/store/dashboard` → `StoreDashboardView` (재고 운영 통계 화면)
- `/store/dashboard2` → `StoreDashboardView2` (기존 대시보드 화면)
- 삭제:
  - `/store/stats`
  - `/store/sales/analysis`
  - `/store/orders/analysis`
  - `/store/inbound/analysis`

---

## 4) Warehouse(물류창고 관리자) 개편 정리

### 4-1. 핵심 개편 요약
- 대시보드/재고 단일 상위화 + 라벨 변경:
  - `대시보드` → `창고 대시보드` (상위 단일)
  - `재고 관리` → `창고 재고 조회` (상위 단일)
- 홈 진입 경로 변경:
  - `warehouse` 기본 진입을 `/warehouse/dashboard`로 통일
- 입출고 구조 분리:
  - 기존 상위 `입/출고 관리` 삭제
  - `입고 관리`, `출고 관리`를 각각 상위 단일 메뉴로 분리
- 화면 바인딩 동기화:
  - 대시보드/재고/입고/출고(상세 포함) 화면에서 children 의존 제거
  - 단일 상위 구조에 맞춰 `:side-menus="[]"` 방식으로 정리
- 아이콘 체계 정리:
  - Lucide 기반 매핑 유지
  - `입고 관리`/`출고 관리`는 `inbound`/`outbound` 키로 분리해 서로 다른 아이콘 적용

### 4-2. 라우터/파일 정리 요약
- 라우트 경로 유지(구조/라벨 중심 개편):
  - `/warehouse/dashboard`
  - `/warehouse/inventory`
  - `/warehouse/inbound`
  - `/warehouse/outbound`
  - `/warehouse/outbound/:id`
- 본 개편에서 Warehouse 라우트 삭제는 없음
- 관련 화면의 활성 메뉴/사이드메뉴 바인딩 로직 정리 완료

### 4-3. 현재 Warehouse 상위 메뉴 구조 (최신)
```text
WAREHOUSE
├─ 창고 대시보드 (/warehouse/dashboard)
├─ 창고 재고 조회 (/warehouse/inventory)
├─ 입고 관리 (/warehouse/inbound)
└─ 출고 관리 (/warehouse/outbound)
```

### 4-4. Warehouse 라우트 핵심 매핑
- `/warehouse/dashboard` → `WarehouseDashboardView`
- `/warehouse/inventory` → `WarehouseInventoryView`
- `/warehouse/inventory/:itemCode/skus` → `WarehouseInventorySkuDetailView`
- `/warehouse/inbound` → `WarehouseInboundView`
- `/warehouse/outbound` → `WarehouseOutboundView`
- `/warehouse/outbound/:id` → `WarehouseOutboundDetailView`

---

## 5) 공통 적용 원칙
- 메뉴 구조 개편 시 가능하면 기존 URL 호환성 우선 검토
- 단일 상위화된 메뉴는 `children` 제거 + 화면 `:side-menus="[]"` 일관 적용
- 페이지 삭제 요청 시: 메뉴/라우트 제거 + 파일 삭제 + 참조 0 코드 정리
- 변경 후 `rg` 잔여 참조 점검 + `npm.cmd run build`로 회귀 검증

## 6) 검증 상태
- 주요 단계별 정적 점검(`rg`) 수행 완료
- 주요 단계별 `npm.cmd run build` 성공 확인
- 현재 기준 메뉴 라벨/활성 상태/라우트 매핑 정합성 확보

## 7) 다음 작업 메모
- HQ의 `정산/통계`, `계정 관리`, `ESG 대시보드`는 후속 개편 예정 항목

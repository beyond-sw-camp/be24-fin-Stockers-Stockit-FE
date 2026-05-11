# HQ 사이드바 메뉴 구조 개편 보고서

## 1) 개요
본 문서는 HQ(본사) 권한 기준 사이드바 메뉴 구조 개편 작업의 진행 결과를 정리한 보고서입니다.  
요청에 따라 메뉴 구조 단순화(상위 단일화), 라벨/매핑 정합성 확보, 죽은 라우트 제거, 미사용 코드/파일 정리를 중심으로 반영했습니다.

## 2) 현재까지 반영 완료 사항

### 2-1. 대시보드 단일화
- 상위 메뉴 `본사 대시보드`를 단일 메뉴로 정리(하위 메뉴 제거).
- 기존 `운영현황` 화면을 대시보드 진입점(`/hq/dashboard`)으로 매칭.
- `AppLayout`에서 children 없는 상위 메뉴에 대해:
  - 하위 펼침 아이콘 미노출
  - 클릭 시 즉시 해당 `path`로 이동
  - fallback 하위 메뉴 생성 로직 제거
- 관련 불필요 코드/파일 정리:
  - `src/views/hq/dashboard/dashboardMenus.js` 삭제
  - 사용되지 않던 일부 대시보드 화면 참조 정리

### 2-2. 재고 메뉴 2축 재구성
- 기존 `재고 관리(상위 1)` 구조를 아래처럼 개편:
  1. `전사 재고 조회` (상위 단일, 하위 없음)
  2. `물류 창고간 재고이동` (상위 + 하위 2)
     - `재고 이동` → `/hq/inventory/warehouse-comparison`
     - `재고 이동 내역` → `/hq/inventory/warehouse-transfer-history`
- 관련 뷰들의 `activeTopMenu/activeSideMenu/sideMenus` 매핑 동기화.
- 라우터 경로는 유지하고 내비게이션 구조/라벨만 변경.

### 2-3. 물류 창고 발주 단일화 + 공급처 관리 제거
- `물류 창고 발주`를 상위 단일 메뉴로 변경, 클릭 시 `/hq/purchase-orders`로 바로 진입.
- 하위 `공급처 발주/공급처 관리` 제거.
- `/hq/vendors` 라우트 제거 및 관련 import 제거.
- `HqVendorManagementView.vue` 삭제.
- vendor 관련 미사용 컴포넌트/컴포저블(참조 0) 삭제.
- 구매발주 화면의 레이아웃 바인딩을 단일 상위 구조에 맞게 정리.

### 2-4. Legacy 화면 정리
- `src/views/hq/legacy` 하위 화면 삭제(요청 범위 내 불필요 화면 정리).

### 2-5. 순환 재고 메뉴 정리
- 하위 메뉴 라벨 변경:
  - `순환 재고 후보 조회` → `순환 재고 전환`
- `순환 재고 판매 분석` 메뉴/페이지 제거:
  - `/hq/circular-inventory/sales/analysis` 라우트 삭제
  - `HqCircularStockSalesAnalysisView.vue` 파일 삭제
- 후보 화면의 활성 메뉴 라벨 매칭 동기화.

### 2-6. 인프라 메뉴 단일화 + 매핑 관리 제거
- 상위 `인프라 관리` 구조를 `매장/창고 정보 관리` 단일 상위 메뉴로 개편.
- `매장/창고 매핑 관리` 메뉴 제거.
- `/hq/infrastructure/mappings` 라우트 삭제.
- `HqInfrastructureMappingView.vue` 파일 삭제.
- 인프라 관련 뷰에서 side menu 의존 및 구 라벨/미사용 코드 정리.

### 2-7. 매장 발주 배치 메뉴 단일화
- `매장 발주 수동 승인` → `매장 발주 배치 처리`로 상위 메뉴명 변경.
- 하위 `매장 발주 수동 배치 처리` 제거, 기존 페이지 경로(`/hq/batch/store-order-approve`)를 상위 진입점으로 유지.
- `HqStoreOrderBatchApproveView`의 사이드 메뉴 바인딩 제거 및 활성 상위 메뉴 라벨 동기화.

### 2-8. HQ 상위 메뉴 순서 정렬
- 요청 순서에 맞춰 HQ 상위 메뉴 순서 재배치.
- 추가 요청 반영으로 `ESG 대시보드`와 `정산/통계` 순서 교체 완료.

### 2-9. 아이콘 체계 정리 (AppLayout)
- `AppLayout`의 수동 SVG 아이콘 정의(`IconBase`) 제거.
- `lucide-vue-next` 아이콘 import/매핑 방식으로 전환.
- 추가 아이콘 요청 반영:
  - `물류 창고간 재고이동` → `ArrowRightLeft`
  - `순환 재고 관리` → `Recycle`
  - `계정 관리` → `Users`

## 3) 현재 HQ 상위 메뉴 구조 (최신)
1. 본사 대시보드
2. 전사 재고 조회
3. 물류 창고 발주
4. 물류 창고간 재고이동
5. 순환 재고 관리
6. 상품 관리
7. 매장/창고 정보 관리
8. 매장 발주 배치 처리
9. ESG 대시보드
10. 정산/통계
11. 계정 관리

## 4) 본사 관리자 전체 메뉴 구조 (폴더 형식)
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

## 5) 라우터/코드 정리 원칙 적용 결과
- 메뉴 구조 개편 시 가능한 한 기존 URL 경로는 유지(북마크/직접 진입 호환성 유지).
- 삭제 요청된 페이지는:
  - 라우트 제거
  - 해당 뷰 파일 삭제
  - 참조 0인 관련 코드만 추가 정리
- 상위 단일화된 메뉴는 `children` 제거 + 화면 측 `sideMenus=[]` 패턴으로 일관화.

## 6) 검증 결과
- 각 단계별 `rg` 잔여 참조 점검 수행.
- 주요 개편 단계마다 `npm.cmd run build` 성공 확인.
- 큰 회귀 이슈 없이 메뉴 라벨/활성 상태/경로 매칭 정합성 확보.

## 7) 내일 변경 예정 사항 (사전 반영)
아래 3개 메뉴는 **내일 추가 개편 예정**으로 인지하고 있습니다.
- `정산/통계`
- `계정 관리`
- `ESG 대시보드`

본 보고서 기준 현재 구조는 최신 반영 상태이며, 위 3개 메뉴는 다음 작업에서 재개편될 수 있습니다.  
내일 작업 시에는 아래 우선순서로 진행 권장:
1. 목표 메뉴 정보 구조(상위/하위/경로/라벨) 확정
2. `roleMenus.hq` 반영
3. 관련 뷰의 `activeTopMenu/sideMenus` 동기화
4. 라우터/죽은 코드 정리
5. 잔여 참조 검색 + build 검증

# StockIt 담당범위 테이블 명세서

- 작성일: 2026-04-30
- 기준: 이전 확정 DDL(29개 테이블)
- 범위: 매장 관리자 전체 / 본사 순환재고 / 물류창고간 이동 / 물류창고 관리자 출고

## 1. 테이블 목록

| No | 테이블명 | 도메인 | 설명 |
|---|---|---|---|
| 1 | roles | 공통 | 역할 마스터 |
| 2 | users | 공통 | 사용자 마스터 |
| 3 | user_roles | 공통 | 사용자-역할 매핑 |
| 4 | stores | 공통 | 매장 마스터 |
| 5 | warehouses | 공통 | 창고 마스터 |
| 6 | products | 상품 | 상품 마스터 |
| 7 | product_skus | 상품 | SKU 마스터 |
| 8 | sku_material_compositions | 상품 | SKU 소재 구성 |
| 9 | store_inventories | 재고 | 매장 SKU 재고 |
| 10 | warehouse_inventories | 재고 | 창고 SKU 재고 |
| 11 | inventory_transactions | 재고 | 재고 증감 이력 |
| 12 | store_sales | 매장 판매 | 판매 헤더 |
| 13 | store_sale_items | 매장 판매 | 판매 라인 |
| 14 | store_orders | 매장 발주/입고 | 발주 헤더 |
| 15 | store_order_items | 매장 발주/입고 | 발주 라인 |
| 16 | store_order_status_histories | 매장 발주/입고 | 발주 상태 이력 |
| 17 | store_inbound_status_histories | 매장 발주/입고 | 입고 상태 이력 |
| 18 | warehouse_outbounds | 창고 출고 | 출고 헤더 |
| 19 | warehouse_outbound_items | 창고 출고 | 출고 라인 |
| 20 | warehouse_outbound_status_histories | 창고 출고 | 출고 상태 이력 |
| 21 | warehouse_transfers | 창고간 이동 | 이동 헤더 |
| 22 | warehouse_transfer_items | 창고간 이동 | 이동 라인 |
| 23 | warehouse_transfer_status_histories | 창고간 이동 | 이동 상태 이력 |
| 24 | circular_inventory_candidates | 순환재고 | 순환 후보 |
| 25 | circular_inventories | 순환재고 | 순환 재고 |
| 26 | circular_inventory_buyers | 순환재고 | 순환 거래처 |
| 27 | circular_inventory_sales | 순환재고 판매 | 판매 헤더 |
| 28 | circular_inventory_sale_items | 순환재고 판매 | 판매 라인 |
| 29 | circular_inventory_sale_esg_snapshots | 순환재고 ESG | ESG 스냅샷 |

## 2. 테이블별 명세

### 2.1 공통/권한

#### roles
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 역할 ID |
| role_code | VARCHAR(50) | Y | UQ | 역할 코드(HQ_ADMIN 등) |
| role_name | VARCHAR(100) | Y |  | 역할명 |
| created_at | DATETIME | Y |  | 생성일 |

#### users
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 사용자 ID |
| email | VARCHAR(191) | Y | UQ | 로그인 이메일 |
| password_hash | VARCHAR(255) | Y |  | 비밀번호 해시 |
| name | VARCHAR(100) | Y |  | 이름 |
| member_id | VARCHAR(50) | N | UQ | 사번/회원ID |
| phone | VARCHAR(30) | N |  | 연락처 |
| status | VARCHAR(30) | Y |  | 상태 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### user_roles
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 매핑 ID |
| user_id | BIGINT UNSIGNED | Y | FK | users.id |
| role_id | BIGINT UNSIGNED | Y | FK | roles.id |
| created_at | DATETIME | Y |  | 생성일 |

#### stores
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 매장 ID |
| store_code | VARCHAR(50) | Y | UQ | 매장 코드 |
| store_name | VARCHAR(120) | Y |  | 매장명 |
| address | VARCHAR(255) | N |  | 주소 |
| status | VARCHAR(30) | Y |  | 상태 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### warehouses
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 창고 ID |
| warehouse_code | VARCHAR(50) | Y | UQ | 창고 코드 |
| warehouse_name | VARCHAR(120) | Y |  | 창고명 |
| address | VARCHAR(255) | N |  | 주소 |
| status | VARCHAR(30) | Y |  | 상태 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

### 2.2 상품/재고

#### products
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 상품 ID |
| product_code | VARCHAR(50) | Y | UQ | 상품 코드 |
| product_name | VARCHAR(150) | Y | IDX | 상품명 |
| main_category | VARCHAR(50) | Y | IDX | 대분류 |
| sub_category | VARCHAR(50) | Y | IDX | 소분류 |
| description | TEXT | N |  | 설명 |
| status | VARCHAR(30) | Y |  | 상태 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### product_skus
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | SKU ID |
| sku_code | VARCHAR(50) | Y | UQ | 품목코드 |
| product_id | BIGINT UNSIGNED | Y | FK | products.id |
| color | VARCHAR(50) | Y |  | 색상 |
| size | VARCHAR(30) | Y |  | 사이즈 |
| unit_price | DECIMAL(12,2) | Y |  | 단가 |
| unit_weight_kg | DECIMAL(12,4) | N |  | 단위중량 |
| safety_stock | INT | Y |  | 안전재고 |
| status | VARCHAR(30) | Y |  | 상태 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### sku_material_compositions
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 소재 구성 ID |
| sku_id | BIGINT UNSIGNED | Y | FK | product_skus.id |
| material_code | VARCHAR(50) | Y |  | 소재 코드 |
| material_name | VARCHAR(80) | Y |  | 소재명 |
| ratio_percent | DECIMAL(5,2) | Y |  | 소재 비율 |
| created_at | DATETIME | Y |  | 생성일 |

#### store_inventories
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 매장재고 ID |
| store_id | BIGINT UNSIGNED | Y | FK/UQ | stores.id |
| sku_id | BIGINT UNSIGNED | Y | FK/UQ | product_skus.id |
| on_hand_qty | INT | Y |  | 실재고 |
| reserved_qty | INT | Y |  | 예약재고 |
| inbound_expected_qty | INT | Y |  | 입고예정 |
| available_qty | INT | Y |  | 가용재고(계산) |
| updated_at | DATETIME | Y |  | 수정일 |

#### warehouse_inventories
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 창고재고 ID |
| warehouse_id | BIGINT UNSIGNED | Y | FK/UQ | warehouses.id |
| sku_id | BIGINT UNSIGNED | Y | FK/UQ | product_skus.id |
| on_hand_qty | INT | Y |  | 실재고 |
| reserved_qty | INT | Y |  | 예약재고 |
| transferable_qty | INT | Y |  | 이동가능재고(계산) |
| updated_at | DATETIME | Y |  | 수정일 |

#### inventory_transactions
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 재고원장 ID |
| tx_type | VARCHAR(50) | Y | IDX | 거래유형(SALE 등) |
| location_type | VARCHAR(20) | Y | IDX | 위치유형(STORE/WAREHOUSE) |
| location_id | BIGINT UNSIGNED | Y | IDX | 위치 ID |
| sku_id | BIGINT UNSIGNED | Y | FK | product_skus.id |
| qty_delta | INT | Y |  | 증감수량 |
| ref_type | VARCHAR(50) | Y | IDX | 참조유형 |
| ref_id | BIGINT UNSIGNED | Y | IDX | 참조ID |
| note | VARCHAR(255) | N |  | 메모 |
| created_by | BIGINT UNSIGNED | N | FK | users.id |
| created_at | DATETIME | Y |  | 생성일 |

### 2.3 매장 판매

#### store_sales
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 판매 ID |
| sale_no | VARCHAR(50) | Y | UQ | 판매번호 |
| store_id | BIGINT UNSIGNED | Y | FK | stores.id |
| sold_at | DATETIME | Y | IDX | 판매시각 |
| sold_by | BIGINT UNSIGNED | N | FK | users.id |
| total_quantity | INT | Y |  | 총수량 |
| total_amount | DECIMAL(14,2) | Y |  | 총금액 |
| created_at | DATETIME | Y |  | 생성일 |

#### store_sale_items
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 판매라인 ID |
| sale_id | BIGINT UNSIGNED | Y | FK | store_sales.id |
| sku_id | BIGINT UNSIGNED | Y | FK | product_skus.id |
| product_id | BIGINT UNSIGNED | Y | FK | products.id |
| unit_price | DECIMAL(12,2) | Y |  | 단가 |
| quantity | INT | Y |  | 수량 |
| line_amount | DECIMAL(14,2) | Y |  | 금액 |
| created_at | DATETIME | Y |  | 생성일 |

### 2.4 매장 발주/입고

#### store_orders
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 발주 ID |
| order_no | VARCHAR(50) | Y | UQ | 발주번호 |
| store_id | BIGINT UNSIGNED | Y | FK | stores.id |
| requested_at | DATETIME | Y | IDX | 요청시각 |
| requested_by | BIGINT UNSIGNED | N | FK | users.id |
| status | VARCHAR(30) | Y | IDX | REQUESTED/APPROVED/COMPLETED/CANCELLED |
| inbound_status | VARCHAR(30) | N | IDX | READY_TO_SHIP/IN_TRANSIT/ARRIVED/RECEIVED |
| memo | TEXT | N |  | 메모 |
| cancel_reason | TEXT | N |  | 취소사유 |
| inbound_expected_at | DATETIME | N |  | 입고예정일 |
| inbound_completed_at | DATETIME | N |  | 입고완료시각 |
| inbound_confirmed_by | BIGINT UNSIGNED | N | FK | users.id |
| total_sku_count | INT | Y |  | 총 SKU |
| total_requested_quantity | INT | Y |  | 총 요청수량 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### store_order_items
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 발주라인 ID |
| order_id | BIGINT UNSIGNED | Y | FK | store_orders.id |
| sku_id | BIGINT UNSIGNED | Y | FK | product_skus.id |
| product_id | BIGINT UNSIGNED | Y | FK | products.id |
| current_store_stock | INT | Y |  | 현재고 |
| inbound_expected_quantity | INT | Y |  | 입고예정 |
| available_store_stock | INT | Y |  | 가용재고 |
| safety_stock | INT | Y |  | 안전재고 |
| recommended_quantity | INT | Y |  | 권장발주량 |
| requested_quantity | INT | Y |  | 요청수량 |
| expected_inbound_quantity | INT | Y |  | 입고반영수량 |
| unit_price | DECIMAL(12,2) | Y |  | 단가 |
| created_at | DATETIME | Y |  | 생성일 |

#### store_order_status_histories
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 이력 ID |
| order_id | BIGINT UNSIGNED | Y | FK | store_orders.id |
| from_status | VARCHAR(30) | N |  | 이전상태 |
| to_status | VARCHAR(30) | Y |  | 변경상태 |
| changed_by | BIGINT UNSIGNED | N | FK | users.id |
| changed_at | DATETIME | Y | IDX | 변경시각 |
| note | VARCHAR(255) | N |  | 메모 |

#### store_inbound_status_histories
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 이력 ID |
| order_id | BIGINT UNSIGNED | Y | FK | store_orders.id |
| from_inbound_status | VARCHAR(30) | N |  | 이전입고상태 |
| to_inbound_status | VARCHAR(30) | Y |  | 변경입고상태 |
| changed_by | BIGINT UNSIGNED | N | FK | users.id |
| changed_at | DATETIME | Y | IDX | 변경시각 |
| note | VARCHAR(255) | N |  | 메모 |

### 2.5 창고 출고

#### warehouse_outbounds
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 출고 ID |
| outbound_no | VARCHAR(50) | Y | UQ | 출고번호 |
| order_id | BIGINT UNSIGNED | N | FK | store_orders.id |
| warehouse_id | BIGINT UNSIGNED | Y | FK | warehouses.id |
| store_id | BIGINT UNSIGNED | N | FK | stores.id |
| outbound_type | VARCHAR(30) | Y | IDX | STORE_OUTBOUND/WH_TRANSFER/CIRCULAR_SALE |
| status | VARCHAR(30) | Y | IDX | READY_TO_SHIP/IN_TRANSIT/COMPLETED |
| requested_at | DATETIME | Y | IDX | 요청시각 |
| confirmed_at | DATETIME | N |  | 확정시각 |
| confirmed_by | BIGINT UNSIGNED | N | FK | users.id |
| completed_at | DATETIME | N |  | 완료시각 |
| total_sku_count | INT | Y |  | 총 SKU |
| total_requested_quantity | INT | Y |  | 총 요청수량 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### warehouse_outbound_items
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 출고라인 ID |
| outbound_id | BIGINT UNSIGNED | Y | FK | warehouse_outbounds.id |
| sku_id | BIGINT UNSIGNED | Y | FK | product_skus.id |
| product_id | BIGINT UNSIGNED | Y | FK | products.id |
| requested_quantity | INT | Y |  | 요청수량 |
| unit_price | DECIMAL(12,2) | Y |  | 단가 |
| created_at | DATETIME | Y |  | 생성일 |

#### warehouse_outbound_status_histories
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 이력 ID |
| outbound_id | BIGINT UNSIGNED | Y | FK | warehouse_outbounds.id |
| from_status | VARCHAR(30) | N |  | 이전상태 |
| to_status | VARCHAR(30) | Y |  | 변경상태 |
| changed_by | BIGINT UNSIGNED | N | FK | users.id |
| changed_at | DATETIME | Y | IDX | 변경시각 |
| note | VARCHAR(255) | N |  | 메모 |

### 2.6 창고간 이동

#### warehouse_transfers
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 이동 ID |
| transfer_no | VARCHAR(50) | Y | UQ | 이동번호 |
| from_warehouse_id | BIGINT UNSIGNED | Y | FK | 출발 창고 |
| to_warehouse_id | BIGINT UNSIGNED | Y | FK | 도착 창고 |
| status | VARCHAR(30) | Y | IDX | REQUESTED/APPROVED/IN_TRANSIT/ARRIVED/COMPLETED/CANCELLED |
| requested_at | DATETIME | Y |  | 요청시각 |
| requested_by | BIGINT UNSIGNED | N | FK | users.id |
| approved_at | DATETIME | N |  | 승인시각 |
| approved_by | BIGINT UNSIGNED | N | FK | users.id |
| departed_at | DATETIME | N |  | 출발시각 |
| arrived_at | DATETIME | N |  | 도착시각 |
| completed_at | DATETIME | N |  | 완료시각 |
| reason | VARCHAR(255) | N |  | 이동사유 |
| memo | TEXT | N |  | 메모 |
| total_sku_count | INT | Y |  | 총 SKU |
| total_transfer_quantity | INT | Y |  | 총 이동수량 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### warehouse_transfer_items
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 이동라인 ID |
| transfer_id | BIGINT UNSIGNED | Y | FK | warehouse_transfers.id |
| sku_id | BIGINT UNSIGNED | Y | FK | product_skus.id |
| product_id | BIGINT UNSIGNED | Y | FK | products.id |
| requested_quantity | INT | Y |  | 요청수량 |
| shipped_quantity | INT | Y |  | 출고수량 |
| received_quantity | INT | Y |  | 입고수량 |
| unit_price | DECIMAL(12,2) | Y |  | 단가 |
| created_at | DATETIME | Y |  | 생성일 |

#### warehouse_transfer_status_histories
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 이력 ID |
| transfer_id | BIGINT UNSIGNED | Y | FK | warehouse_transfers.id |
| from_status | VARCHAR(30) | N |  | 이전상태 |
| to_status | VARCHAR(30) | Y |  | 변경상태 |
| changed_by | BIGINT UNSIGNED | N | FK | users.id |
| changed_at | DATETIME | Y | IDX | 변경시각 |
| note | VARCHAR(255) | N |  | 메모 |

### 2.7 순환재고/ESG

#### circular_inventory_candidates
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 후보 ID |
| sku_id | BIGINT UNSIGNED | Y | FK | product_skus.id |
| store_id | BIGINT UNSIGNED | N | FK | stores.id |
| warehouse_id | BIGINT UNSIGNED | N | FK | warehouses.id |
| candidate_reason | VARCHAR(100) | Y |  | 후보 사유 |
| age_months | INT | N |  | 재고 경과월 |
| current_qty | INT | Y |  | 현재 수량 |
| current_weight_kg | DECIMAL(14,4) | Y |  | 현재 무게 |
| material_type | VARCHAR(30) | Y |  | 소재 타입 |
| status | VARCHAR(30) | Y | IDX | OPEN/CONVERTED/DROPPED |
| detected_at | DATETIME | Y | IDX | 탐지시각 |
| created_at | DATETIME | Y |  | 생성일 |

#### circular_inventories
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 순환재고 ID |
| circular_code | VARCHAR(50) | Y | UQ | 순환재고 코드 |
| source_candidate_id | BIGINT UNSIGNED | N | FK | circular_inventory_candidates.id |
| sku_id | BIGINT UNSIGNED | Y | FK | product_skus.id |
| item_name | VARCHAR(150) | Y |  | 품목명 |
| main_category | VARCHAR(50) | Y |  | 대분류 |
| sub_category | VARCHAR(50) | Y |  | 소분류 |
| material_type | VARCHAR(30) | Y |  | 소재 타입 |
| materials_summary | VARCHAR(255) | N |  | 소재 요약 |
| available_quantity | INT | Y |  | 가용수량 |
| available_weight_kg | DECIMAL(14,4) | Y |  | 가용무게 |
| unit_weight_kg | DECIMAL(12,4) | Y |  | 단위중량 |
| status | VARCHAR(30) | Y | IDX | ACTIVE/DEPLETED/ARCHIVED |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### circular_inventory_buyers
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 거래처 ID |
| buyer_code | VARCHAR(50) | Y | UQ | 거래처 코드 |
| company_name | VARCHAR(150) | Y | IDX | 업체명 |
| industry_group | VARCHAR(100) | Y |  | 산업군 |
| product_types | VARCHAR(255) | N |  | 취급품목 |
| description | TEXT | N |  | 설명 |
| primary_material_fit | VARCHAR(30) | Y | IDX | 대표 소재 적합도 |
| manager_name | VARCHAR(100) | Y |  | 담당자명 |
| phone | VARCHAR(30) | Y |  | 연락처 |
| status | VARCHAR(30) | Y |  | 상태 |
| created_at | DATETIME | Y |  | 생성일 |
| updated_at | DATETIME | Y |  | 수정일 |

#### circular_inventory_sales
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 판매 ID |
| sale_no | VARCHAR(50) | Y | UQ | 판매번호 |
| buyer_id | BIGINT UNSIGNED | Y | FK | circular_inventory_buyers.id |
| buyer_name_snapshot | VARCHAR(150) | Y |  | 판매시점 거래처명 스냅샷 |
| sold_at | DATETIME | Y | IDX | 판매시각 |
| sold_by | BIGINT UNSIGNED | N | FK | users.id |
| memo | TEXT | N |  | 메모 |
| total_items | INT | Y |  | 총 품목수 |
| total_estimated_quantity | DECIMAL(14,4) | Y |  | 환산수량 |
| total_weight_kg | DECIMAL(14,4) | Y |  | 총 판매kg |
| total_amount | DECIMAL(14,2) | Y |  | 총 판매금액 |
| created_at | DATETIME | Y |  | 생성일 |

#### circular_inventory_sale_items
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 판매라인 ID |
| sale_id | BIGINT UNSIGNED | Y | FK | circular_inventory_sales.id |
| inventory_id | BIGINT UNSIGNED | Y | FK | circular_inventories.id |
| item_code | VARCHAR(50) | Y |  | 품목코드 |
| item_name | VARCHAR(150) | Y |  | 품목명 |
| main_category | VARCHAR(50) | Y |  | 대분류 |
| sub_category | VARCHAR(50) | Y |  | 소분류 |
| materials | VARCHAR(255) | N |  | 소재 구성 |
| available_quantity | INT | Y |  | 판매전 수량 |
| available_weight_kg | DECIMAL(14,4) | Y |  | 판매전 무게 |
| unit_weight_kg | DECIMAL(12,4) | Y |  | 단위중량 |
| sold_weight_kg | DECIMAL(14,4) | Y |  | 판매kg |
| estimated_quantity | DECIMAL(14,4) | Y |  | 환산벌수 |
| deducted_quantity | INT | Y |  | 차감수량(올림) |
| unit_price | DECIMAL(12,2) | Y |  | kg당 단가 |
| line_amount | DECIMAL(14,2) | Y |  | 금액 |
| created_at | DATETIME | Y |  | 생성일 |

#### circular_inventory_sale_esg_snapshots
| 컬럼 | 타입 | NN | Key | 설명 |
|---|---|---|---|---|
| id | BIGINT UNSIGNED | Y | PK | 스냅샷 ID |
| sale_id | BIGINT UNSIGNED | Y | FK/UQ | circular_inventory_sales.id |
| tree_grow_points | DECIMAL(14,2) | Y |  | 총 ESG 점수 |
| execution_points | DECIMAL(14,2) | Y |  | 실행 점수 |
| resource_circulation_points | DECIMAL(14,2) | Y |  | 자원순환 점수 |
| carbon_contribution_points | DECIMAL(14,2) | Y |  | 탄소기여 점수 |
| traceability_points | DECIMAL(14,2) | Y |  | 추적성 점수 |
| saved_carbon_kg | DECIMAL(14,4) | Y |  | 탄소절감량 |
| carbon_credit_value | DECIMAL(14,2) | Y |  | 탄소가치 |
| tradable_carbon_credit_value | DECIMAL(14,2) | Y |  | 거래가치 추정 |
| sales_revenue | DECIMAL(14,2) | Y |  | 매출 |
| waste_loss_recovered_value | DECIMAL(14,2) | Y |  | 손실회수 가치 |
| treatment_type | VARCHAR(50) | N |  | 처리유형 |
| kau_price_at_sale | DECIMAL(14,2) | N |  | 시점 KAU 가격 |
| formula_summary | TEXT | N |  | 산식요약 |
| material_breakdown_json | JSON | N |  | 소재별 상세 |
| traceability_breakdown_json | JSON | N |  | 추적성 상세 |
| score_breakdown_json | JSON | N |  | 점수 상세 |
| kpi_snapshot_json | JSON | N |  | KPI 상세 |
| created_at | DATETIME | Y |  | 생성일 |

## 3. 관계도 (ERD)

```mermaid
erDiagram
  users ||--o{ user_roles : has
  roles ||--o{ user_roles : maps

  products ||--o{ product_skus : has
  product_skus ||--o{ sku_material_compositions : has

  stores ||--o{ store_inventories : has
  product_skus ||--o{ store_inventories : stocked

  warehouses ||--o{ warehouse_inventories : has
  product_skus ||--o{ warehouse_inventories : stocked

  stores ||--o{ store_sales : creates
  store_sales ||--o{ store_sale_items : contains
  product_skus ||--o{ store_sale_items : sold
  products ||--o{ store_sale_items : sold

  stores ||--o{ store_orders : creates
  store_orders ||--o{ store_order_items : contains
  store_orders ||--o{ store_order_status_histories : tracks
  store_orders ||--o{ store_inbound_status_histories : tracks
  product_skus ||--o{ store_order_items : ordered

  warehouses ||--o{ warehouse_outbounds : ships
  stores ||--o{ warehouse_outbounds : targets
  store_orders ||--o{ warehouse_outbounds : source
  warehouse_outbounds ||--o{ warehouse_outbound_items : contains
  warehouse_outbounds ||--o{ warehouse_outbound_status_histories : tracks

  warehouses ||--o{ warehouse_transfers : from
  warehouses ||--o{ warehouse_transfers : to
  warehouse_transfers ||--o{ warehouse_transfer_items : contains
  warehouse_transfers ||--o{ warehouse_transfer_status_histories : tracks

  product_skus ||--o{ circular_inventory_candidates : candidate
  circular_inventory_candidates ||--o{ circular_inventories : converts
  product_skus ||--o{ circular_inventories : based_on

  circular_inventory_buyers ||--o{ circular_inventory_sales : buys
  circular_inventory_sales ||--o{ circular_inventory_sale_items : contains
  circular_inventories ||--o{ circular_inventory_sale_items : sold
  circular_inventory_sales ||--|| circular_inventory_sale_esg_snapshots : snapshot

  users ||--o{ inventory_transactions : logs
  product_skus ||--o{ inventory_transactions : affects
```

## 4. 핵심 관계 요약표

| 부모 | 자식 | 관계 | 비고 |
|---|---|---|---|
| products | product_skus | 1:N | 상품-옵션 |
| product_skus | store_inventories / warehouse_inventories | 1:N | 위치별 재고 |
| store_sales | store_sale_items | 1:N | 판매 헤더-라인 |
| store_orders | store_order_items | 1:N | 발주 헤더-라인 |
| store_orders | store_order_status_histories | 1:N | 발주 상태이력 |
| store_orders | store_inbound_status_histories | 1:N | 입고 상태이력 |
| warehouse_outbounds | warehouse_outbound_items | 1:N | 출고 헤더-라인 |
| warehouse_transfers | warehouse_transfer_items | 1:N | 이동 헤더-라인 |
| circular_inventory_sales | circular_inventory_sale_items | 1:N | 순환판매 헤더-라인 |
| circular_inventory_sales | circular_inventory_sale_esg_snapshots | 1:1 | ESG 스냅샷 |

## 5. 비고

- 상태값(예: `REQUESTED`, `IN_TRANSIT`)은 현재 VARCHAR 코드값 기준.
- 운영 고도화 시 상태코드/유형코드 공통 코드테이블 분리 권장.
- 본 문서는 현재 담당범위 구현 문서 기준의 논리/물리 중간 명세서다.

export const roleMenus = {
  hq: [
    {
      label: '본사 대시보드',
      path: '/hq/dashboard',
      icon: 'layout',
    },
    {
      label: '전사 재고 조회',
      path: '/hq/inventory/company-wide',
      icon: 'warehouse',
    },
    {
      label: '물류 창고간 재고이동',
      path: '/hq/inventory/warehouse-comparison',
      icon: 'warehouse',
      children: [
        { label: '재고 이동', path: '/hq/inventory/warehouse-comparison' },
        { label: '재고 이동 내역', path: '/hq/inventory/warehouse-transfer-history' },
      ],
    },
    {
      label: '물류 창고 발주',
      path: '/hq/purchase-orders',
      icon: 'truck',
    },
    {
      label: '순환 재고 관리',
      path: '/hq/circular-inventory/candidates',
      icon: 'refresh',
      children: [
        { label: '순환 재고 전환', path: '/hq/circular-inventory/candidates' },
        { label: '순환 재고 조회', path: '/hq/circular-inventory' },
        { label: '순환 재고 거래처 관리', path: '/hq/circular-inventory/buyers' },
        { label: '순환 재고 판매 등록', path: '/hq/circular-inventory/sales/register' },
        { label: '순환 재고 판매 내역', path: '/hq/circular-inventory/sales/history' },
      ],
    },
    {
      label: '상품 관리',
      path: '/hq/products',
      icon: 'file',
      children: [
        { label: '카테고리 관리', path: '/hq/products?tab=categories' },
        { label: '제품 마스터', path: '/hq/products?tab=products' },
      ],
    },
    {
      label: '인프라 관리',
      path: '/hq/infrastructure',
      icon: 'store',
      children: [
        { label: '매장/창고 정보 관리', path: '/hq/infrastructure' },
        { label: '매장/창고 매핑 관리', path: '/hq/infrastructure/mappings' },
      ],
    },
    {
      label: '매장 발주 수동 승인',
      path: '/hq/batch/store-order-approve',
      icon: 'check',
      children: [
        { label: '매장 발주 수동 배치 처리', path: '/hq/batch/store-order-approve' },
      ],
    },
    {
      label: '정산/통계',
      path: '/hq/analytics',
      icon: 'chart',
      children: [
        { label: '통합 KPI 대시보드', path: '/hq/analytics' },
        { label: '판매량 통계', path: '/hq/analytics/sales' },
        { label: '재고 회전율 통계', path: '/hq/analytics/turnover' },
        { label: '발주량 통계', path: '/hq/analytics/order-stats' },
        { label: '순환재고 거래처 통계', path: '/hq/analytics/vendors' },
      ],
    },
    {
      label: '계정 관리',
      path: '/hq/accounts',
      icon: 'settings',
      children: [
        { label: '회원가입 승인', path: '/hq/accounts/approvals' },
        { label: '계정 관리', path: '/hq/accounts' },
      ],
    },
    {
      label: 'ESG 대시보드',
      path: '/hq/esg',
      icon: 'sprout',
      children: [
        { label: '친환경 발자국 현황판', path: '/hq/esg' },
        { label: '친환경 나무 키우기 점수', path: '/hq/esg/tree-score' },
        { label: '탄소중립 관리', path: '/hq/esg/emissionquota' },
        { label: '배출권 시장 가치', path: '/hq/esg/carbon-price' },
      ],
    },
  ],
  store: [
    {
      label: '대시보드',
      path: '/store/dashboard',
      icon: 'layout',
      children: [{ label: '대시보드', path: '/store/dashboard' }],
    },
    {
      label: '재고 관리',
      path: '/store/inventory',
      icon: 'warehouse',
      children: [{ label: '매장 재고 조회', path: '/store/inventory' }],
    },
    {
      label: '판매 관리',
      path: '/store/sales/register',
      icon: 'store',
      children: [
        { label: 'POS / 판매 등록', path: '/store/sales/register' },
        { label: '판매 내역', path: '/store/sales/history' },
        { label: '판매 분석', path: '/store/sales/analysis' },
      ],
    },
    {
      label: '발주 관리',
      path: '/store/orders/request',
      icon: 'file',
      children: [
        { label: '발주 요청', path: '/store/orders/request' },
        { label: '발주 내역', path: '/store/orders/history' },
        { label: '발주 분석', path: '/store/orders/analysis' },
      ],
    },
    {
      label: '입고 관리',
      path: '/store/inbound/list',
      icon: 'check',
      children: [
        { label: '입고 리스트', path: '/store/inbound/list' },
        { label: '입고 분석', path: '/store/inbound/analysis' },
      ],
    },
    {
      label: '통계',
      path: '/store/stats',
      icon: 'chart',
      children: [
        { label: '재고 운영 통계', path: '/store/stats' },
      ],
    },
  ],
  warehouse: [
    {
      label: '대시보드',
      path: '/warehouse/dashboard',
      icon: 'layout',
      children: [{ label: '창고 대시보드', path: '/warehouse/dashboard' }],
    },
    {
      label: '재고 관리',
      path: '/warehouse/inventory',
      icon: 'warehouse',
      children: [{ label: '창고 재고 조회', path: '/warehouse/inventory' }],
    },
    {
      label: '입/출고 관리',
      path: '/warehouse/inbound',
      icon: 'truck',
      children: [
        { label: '입고 관리', path: '/warehouse/inbound' },
        { label: '출고 관리', path: '/warehouse/outbound' },
      ],
    },
  ],
}

export const roleHomeMap = {
  hq: '/hq/dashboard',
  store: '/store/dashboard',
  warehouse: '/warehouse/inventory',
}

export const roleDisplayName = {
  hq: '본사 관리자',
  store: '매장 관리자',
  warehouse: '물류 창고 관리자',
}

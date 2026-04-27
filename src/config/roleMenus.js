export const roleMenus = {
  hq: [
    {
      label: '대시보드',
      path: '/hq/dashboard',
      icon: 'layout',
      children: [
        { label: '운영 현황', path: '/hq/dashboard' },
      ],
    },
    {
      label: '재고 관리',
      path: '/hq/inventory/company-wide',
      icon: 'warehouse',
      children: [
        { label: '전사 재고 조회', path: '/hq/inventory/company-wide' },
        { label: '창고별 재고 비교', path: '/hq/inventory/warehouse-comparison' },
      ],
    },
    {
      label: '주문/발주 관리',
      path: '/hq/orders',
      icon: 'truck',
      children: [
        { label: '매장 주문', path: '/hq/orders' },
        { label: '거래처 발주', path: '/hq/purchase-orders' },
        { label: '거래처 관리', path: '/hq/vendors' },
      ],
    },
    {
      label: '순환 재고 관리',
      path: '/hq/circular-inventory/candidates',
      icon: 'refresh',
      children: [
        { label: '순환 재고 후보 조회', path: '/hq/circular-inventory/candidates' },
        { label: '순환 재고 조회', path: '/hq/circular-inventory' },
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
        { label: '매장 정보 관리' },
        { label: '창고 정보 관리' },
        { label: '매장-창고 매핑 설정' },
      ],
    },
    {
      label: '정산/통계',
      path: '/hq/analytics',
      icon: 'chart',
      children: [
        { label: '통합 KPI 대시보드' },
        { label: '메뉴별 판매량 및 판매 비중' },
        { label: '시간대·요일 매출 패턴', path: '/hq/analytics/sales-pattern' },
        { label: '재고 회전율 통계', path: '/hq/analytics/turnover' },
        { label: '계절별 판매량 변화', path: '/hq/analytics/seasonal' },
        { label: '발주량 통계', path: '/hq/analytics/order-stats' },
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
      label: 'AI 리포트',
      path: '/hq/ai-report',
      icon: 'chart',
      children: [
        { label: 'AI 리포트', path: '/hq/ai-report' },
      ],
    },
    {
      label: 'ESG 대시보드',
      path: '/hq/esg',
      icon: 'leaf',
      children: [
        { label: '친환경 발자국 현황판', path: '/hq/esg' },
      ],
    },
  ],
  store: [
    { label: 'POS / 판매', path: '/store/pos', icon: 'store' },
    { label: '주문 관리', path: '/store/orders', icon: 'file' },
    { label: '재고 관리', path: '/store/inventory', icon: 'warehouse' },
    { label: '입고 관리', path: '/store/inbound', icon: 'check' },
    { label: 'AI 리포트', path: '/store/ai-report', icon: 'chart' },
  ],
  warehouse: [
    { label: '대시보드', path: '/warehouse/dashboard', icon: 'layout' },
    { label: '창고 재고 관리', path: '/warehouse/inventory', icon: 'warehouse' },
    { label: '입고 관리', path: '/warehouse/inbound', icon: 'check' },
    { label: '출고 관리', path: '/warehouse/outbound', icon: 'truck' },
  ],
}

export const roleHomeMap = {
  hq: '/hq/dashboard',
  store: '/store/pos',
  warehouse: '/warehouse/inventory',
}

export const roleDisplayName = {
  hq: '본사 관리자',
  store: '매장 관리자',
  warehouse: '물류 창고 관리자',
}

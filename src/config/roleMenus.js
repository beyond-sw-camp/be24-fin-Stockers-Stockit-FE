export const roleMenus = {
  hq: [
    {
      label: '대시보드',
      path: '/hq/dashboard',
      icon: 'layout',
      children: [
        { label: '운영 현황', path: '/hq/dashboard' },
        { label: '재고 위험', path: '/hq/dashboard/inventory-risk' },
        { label: '입출고 흐름', path: '/hq/dashboard/flow' },
        { label: '알림 센터', path: '/hq/dashboard/alerts' },
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
        { label: '카테고리 관리' },
        { label: '제품 마스터' },
        { label: '단가/계약 관리' },
        { label: '거래처 정보 관리' },
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
        { label: '매출 분석' },
        { label: '상품/카테고리 분석' },
        { label: '재고 회전율 분석' },
        { label: '발주/수요 분석' },
        { label: '예측 정확도 분석' },
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
  ],
  store: [
    { label: 'POS / 판매', path: '/store/pos', icon: 'store' },
    { label: '주문 관리', path: '/store/orders', icon: 'file' },
    { label: '재고 관리', path: '/store/inventory', icon: 'warehouse' },
    { label: '입고 관리', path: '/store/inbound', icon: 'check' },
    { label: 'AI 리포트', path: '/store/ai-report', icon: 'chart' },
  ],
  warehouse: [
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

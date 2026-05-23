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
      label: '물류 창고 발주',
      path: '/hq/purchase-orders',
      icon: 'truck',
    },
    {
      label: '물류 창고간 재고이동',
      path: '/hq/inventory/warehouse-comparison',
      icon: 'transfer',
      children: [
        { label: '재고 이동', path: '/hq/inventory/warehouse-comparison' },
        { label: '재고 이동 내역', path: '/hq/inventory/warehouse-transfer-history' },
      ],
    },
    {
      label: '순환 재고 관리',
      path: '/hq/circular-inventory/candidates',
      icon: 'recycle',
      children: [
        { label: '순환 재고 전환', path: '/hq/circular-inventory/candidates' },
        { label: '순환 재고 조회', path: '/hq/circular-inventory' },
        { label: '순환 재고 거래처 관리', path: '/hq/circular-inventory/buyers' },
        { label: '순환 재고 판매 등록', path: '/hq/circular-inventory/sales/register' },
        { label: '순환 재고 판매 내역', path: '/hq/circular-inventory/sales/history' },
        { label: '순환 재고 판매 통계', path: '/hq/analytics/vendors' },
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
      label: '매장/창고 정보 관리',
      path: '/hq/infrastructure',
      icon: 'store',
    },
    {
      label: '매장 발주 배치 처리',
      path: '/hq/batch/store-order-approve',
      icon: 'check',
    },
    {
      label: 'ESG 탄소 성과 관리',
      path: '/hq/esg',
      icon: 'sprout',
      children: [
        { label: '탄소 배출 관리', path: '/hq/esg' },
        { label: '친환경 나무 키우기 점수', path: '/hq/esg/tree-score' },
      ],
    },
    {
      label: '계정 관리',
      path: '/hq/accounts',
      icon: 'user',
    },
    {
      label: '알림',
      path: '/hq/notifications',
      icon: 'bell',
    },
  ],
  store: [
    {
      label: '매장 대시보드',
      path: '/store/dashboard',
      icon: 'layout',
    },
    {
      label: '매장 재고 조회',
      path: '/store/inventory',
      icon: 'warehouse',
    },
    {
      label: '판매 관리',
      path: '/store/sales/register',
      icon: 'store',
      children: [
        { label: 'POS / 판매 등록', path: '/store/sales/register' },
        { label: '판매 내역', path: '/store/sales/history' },
      ],
    },
    {
      label: '발주 관리',
      path: '/store/orders/request',
      icon: 'file',
      children: [
        { label: '발주 요청', path: '/store/orders/request' },
        { label: '발주 내역', path: '/store/orders/history' },
      ],
    },
    {
      label: '입고 관리',
      path: '/store/inbound/list',
      icon: 'check',
    },
    {
      label: '알림',
      path: '/store/notifications',
      icon: 'bell',
    },
  ],
  warehouse: [
    {
      label: '창고 대시보드',
      path: '/warehouse/dashboard',
      icon: 'layout',
    },
    {
      label: '창고 재고 조회',
      path: '/warehouse/inventory',
      icon: 'warehouse',
    },
    {
      label: '입고 관리',
      path: '/warehouse/inbound',
      icon: 'inbound',
    },
    {
      label: '출고 관리',
      path: '/warehouse/outbound',
      icon: 'outbound',
    },
    {
      label: '알림',
      path: '/warehouse/notifications',
      icon: 'bell',
    },
  ],
}

export const roleHomeMap = {
  hq: '/hq/dashboard',
  store: '/store/dashboard',
  warehouse: '/warehouse/dashboard',
}

export const roleDisplayName = {
  hq: '본사 관리자',
  store: '매장 관리자',
  warehouse: '물류 창고 관리자',
}

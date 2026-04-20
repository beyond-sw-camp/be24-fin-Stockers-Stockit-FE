export const roleMenus = {
  hq: [
    { label: '대시보드', path: '/hq/dashboard', icon: 'layout' },
    { label: '재고 관리', path: '/hq/inventory', icon: 'warehouse' },
    { label: '발주 관리', path: '/hq/orders', icon: 'truck' },
    { label: '상품 관리', path: '/hq/products', icon: 'file' },
    { label: '인프라 관리', path: '/hq/infrastructure', icon: 'store' },
    { label: '정산/통계', path: '/hq/analytics', icon: 'chart' },
  ],
  store: [
    { label: '대시보드', path: '/store/dashboard', icon: 'layout' },
    { label: '판매', path: '/store/pos', icon: 'store' },
    { label: '재고 관리', path: '/store/inventory', icon: 'warehouse' },
    { label: '주문 관리', path: '/store/orders', icon: 'file' },
    { label: '입고 관리', path: '/store/inbound', icon: 'check' },
    { label: '통계/모니터링', path: '/store/monitoring', icon: 'chart' },
  ],
  warehouse: [
    { label: '창고 재고 관리', path: '/warehouse/inventory', icon: 'warehouse' },
    { label: '입고 관리', path: '/warehouse/inbound', icon: 'check' },
    { label: '출고 관리', path: '/warehouse/outbound', icon: 'truck' },
  ],
}

export const storeTopMenus = roleMenus.store

export const storeSideMenusByTopMenu = {
  대시보드: [
    { label: '매장 요약', icon: 'layout' },
    { label: '오늘 알림', icon: 'alert' },
  ],
  판매: [
    { label: '판매 페이지', icon: 'store' },
  ],
  '재고 관리': [
    { label: '매장 보유 재고 조회', icon: 'warehouse' },
    { label: '품절/부족 재고', icon: 'alert' },
  ],
  '주문 관리': [
    { label: '주문 요청', icon: 'file' },
    { label: '주문 목록 조회', icon: 'history' },
  ],
  '입고 관리': [
    { label: '입고 리스트 조회', icon: 'file' },
    { label: '입고 검수', icon: 'check' },
    { label: '입고 확정 처리', icon: 'warehouse' },
    { label: '과거 입고 이력 조회', icon: 'history' },
  ],
  '통계/모니터링': [
    { label: '핵심 지표', icon: 'chart' },
    { label: '자연어 맞춤 질의', icon: 'file' },
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

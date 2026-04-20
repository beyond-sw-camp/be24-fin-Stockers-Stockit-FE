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

export const roleDisplayName = {
  hq:        '본사 중앙 관리자',
  store:     '매장 관리자',
  warehouse: '물류 창고 관리자',
}

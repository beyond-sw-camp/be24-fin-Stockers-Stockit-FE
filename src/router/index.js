import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { roleHomeMap } from '@/config/roleMenus.js'

import LoginView             from '@/views/LoginView.vue'
import StorePosView          from '@/views/store/StorePosView.vue'
import StoreOrdersView       from '@/views/store/StoreOrdersView.vue'
import StoreInventoryView    from '@/views/store/StoreInventoryView.vue'
import StoreInboundView      from '@/views/store/StoreInboundView.vue'
import WarehouseInventoryView from '@/views/warehouse/WarehouseInventoryView.vue'
import WarehouseInboundView  from '@/views/warehouse/WarehouseInboundView.vue'
import WarehouseOutboundView from '@/views/warehouse/WarehouseOutboundView.vue'
import HqErpDashboardView from '@/views/hq/HqErpDashboardView.vue'
import HqInventoryStatusView from '@/views/hq/HqInventoryStatusView.vue'
import HqOrderManagementView from '@/views/hq/HqOrderManagementView.vue'
import HqProductManagementView from '@/views/hq/HqProductManagementView.vue'
import HqInfrastructureManagementView from '@/views/hq/HqInfrastructureManagementView.vue'
import HqSettlementStatisticsView from '@/views/hq/HqSettlementStatisticsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },

    { path: '/hq/dashboard', name: 'hq-dashboard', component: HqErpDashboardView,       meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/inventory', name: 'hq-inventory', component: HqInventoryStatusView,    meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/orders',    name: 'hq-orders',    component: HqOrderManagementView,    meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/products',    name: 'hq-products',    component: HqProductManagementView,    meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/infrastructure',    name: 'hq-infrastructure',    component: HqInfrastructureManagementView,    meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics',    name: 'hq-analytics',    component: HqSettlementStatisticsView,    meta: { requiresAuth: true, role: 'hq' } },

    { path: '/store/pos',       name: 'store-pos',       component: StorePosView,       meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/orders',    name: 'store-orders',    component: StoreOrdersView,    meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inventory', name: 'store-inventory', component: StoreInventoryView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inbound',   name: 'store-inbound',   component: StoreInboundView,   meta: { requiresAuth: true, role: 'store' } },

    { path: '/warehouse/inventory', name: 'wh-inventory', component: WarehouseInventoryView, meta: { requiresAuth: true, role: 'warehouse' } },
    { path: '/warehouse/inbound',   name: 'wh-inbound',   component: WarehouseInboundView,   meta: { requiresAuth: true, role: 'warehouse' } },
    { path: '/warehouse/outbound',  name: 'wh-outbound',  component: WarehouseOutboundView,  meta: { requiresAuth: true, role: 'warehouse' } },

    { path: '/', redirect: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (!to.meta.requiresAuth) {
    if (auth.isAuthenticated) return roleHomeMap[auth.user.role]
    return true
  }

  if (!auth.isAuthenticated) return { name: 'login' }

  if (to.meta.role && to.meta.role !== auth.user.role) {
    return roleHomeMap[auth.user.role]
  }

  return true
})

export default router

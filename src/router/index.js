import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { roleHomeMap } from '@/config/roleMenus.js'

import DevLoginView from '@/views/DevLoginView.vue'
import LoginView from '@/views/LoginView.vue'
import SignupView from '@/views/SignupView.vue'

import StorePosView from '@/views/store/StorePosView.vue'
import StoreOrdersView from '@/views/store/StoreOrdersView.vue'
import StoreInventoryView from '@/views/store/StoreInventoryView.vue'
import StoreInboundView from '@/views/store/StoreInboundView.vue'

import WarehouseInventoryView from '@/views/warehouse/WarehouseInventoryView.vue'
import WarehouseInboundView from '@/views/warehouse/WarehouseInboundView.vue'
import WarehouseOutboundView from '@/views/warehouse/WarehouseOutboundView.vue'

import OperationStatusView from '@/views/hq/dashboard/OperationStatusView.vue'
import InventoryRiskView from '@/views/hq/dashboard/InventoryRiskView.vue'
import InboundOutboundFlowView from '@/views/hq/dashboard/InboundOutboundFlowView.vue'
import AlertCenterView from '@/views/hq/dashboard/AlertCenterView.vue'
import AllTransactionsView from '@/views/hq/dashboard/AllTransactionsView.vue'
import AllFlowTransactionsView from '@/views/hq/dashboard/AllFlowTransactionsView.vue'

import HqInventoryStatusView from '@/views/hq/HqInventoryStatusView.vue'
import HqOrderManagementView from '@/views/hq/HqOrderManagementView.vue'
import HqProductManagementView from '@/views/hq/HqProductManagementView.vue'
import HqInfrastructureManagementView from '@/views/hq/HqInfrastructureManagementView.vue'
import HqSettlementStatisticsView from '@/views/hq/HqSettlementStatisticsView.vue'
import HqPurchaseOrderView from '@/views/hq/HqPurchaseOrderView.vue'
import HqVendorManagementView from '@/views/hq/HqVendorManagementView.vue'
import AccountListView from '@/views/hq/account/AccountListView.vue'
import AccountApprovalView from '@/views/hq/account/AccountApprovalView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
    { path: '/dev-login', name: 'dev-login', component: DevLoginView, meta: { requiresAuth: false } },
    { path: '/signup', name: 'signup', component: SignupView, meta: { requiresAuth: false } },
    { path: '/hq/dashboard', name: 'hq-dashboard', component: OperationStatusView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/inventory-risk', name: 'hq-dashboard-inventory-risk', component: InventoryRiskView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/flow', name: 'hq-dashboard-flow', component: InboundOutboundFlowView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/flow/all', name: 'hq-dashboard-flow-all', component: AllFlowTransactionsView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/alerts', name: 'hq-dashboard-alerts', component: AlertCenterView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/transactions', name: 'hq-dashboard-transactions', component: AllTransactionsView, meta: { requiresAuth: true, role: 'hq' } },

    
    { path: '/hq/account/accountlist', name: 'hq-account-list', component: AccountListView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/account/approval', name: 'hq-account-approval', component: AccountApprovalView, meta: { requiresAuth: true, role: 'hq' } },


    { path: '/hq/inventory', name: 'hq-inventory', component: HqInventoryStatusView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/orders', name: 'hq-orders', component: HqOrderManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/products', name: 'hq-products', component: HqProductManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/infrastructure', name: 'hq-infrastructure', component: HqInfrastructureManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics', name: 'hq-analytics', component: HqSettlementStatisticsView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/purchase-orders', name: 'hq-purchase-orders', component: HqPurchaseOrderView, meta: { requiresAuth: true, role: 'hq' } },

    
    { path: '/hq/vendors', name: 'hq-vendors', component: HqVendorManagementView, meta: { requiresAuth: true, role: 'hq' } },
    

    { path: '/store/pos', name: 'store-pos', component: StorePosView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/orders', name: 'store-orders', component: StoreOrdersView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inventory', name: 'store-inventory', component: StoreInventoryView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inbound', name: 'store-inbound', component: StoreInboundView, meta: { requiresAuth: true, role: 'store' } },

    { path: '/warehouse/inventory', name: 'wh-inventory', component: WarehouseInventoryView, meta: { requiresAuth: true, role: 'warehouse' } },
    { path: '/warehouse/inbound', name: 'wh-inbound', component: WarehouseInboundView, meta: { requiresAuth: true, role: 'warehouse' } },
    { path: '/warehouse/outbound', name: 'wh-outbound', component: WarehouseOutboundView, meta: { requiresAuth: true, role: 'warehouse' } },

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
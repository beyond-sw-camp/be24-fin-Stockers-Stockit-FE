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
import StoreAiReportView from '@/views/store/StoreAiReportView.vue'

import WarehouseDashboardView from '@/views/warehouse/WarehouseDashboardView.vue'
import WarehouseInventoryView from '@/views/warehouse/WarehouseInventoryView.vue'
import WarehouseInboundView from '@/views/warehouse/WarehouseInboundView.vue'
import WarehouseOutboundView from '@/views/warehouse/WarehouseOutboundView.vue'

import OperationStatusView from '@/views/hq/dashboard/OperationStatusView.vue'

import HqCompanyWideInventoryView from '@/views/hq/inventory/HqCompanyWideInventoryView.vue'
import HqWarehouseInventoryComparisonView from '@/views/hq/inventory/HqWarehouseInventoryComparisonView.vue'
import HqOrderManagementView from '@/views/hq/HqOrderManagementView.vue'
import HqProductManagementView from '@/views/hq/HqProductManagementView.vue'
import HqInfrastructureManagementView from '@/views/hq/HqInfrastructureManagementView.vue'
import HqSettlementStatisticsView from '@/views/hq/HqSettlementStatisticsView.vue'
import HqPurchaseOrderView from '@/views/hq/HqPurchaseOrderView.vue'
import HqVendorManagementView from '@/views/hq/HqVendorManagementView.vue'
import HqCategoryAddView from '@/views/hq/HqCategoryAddView.vue'
import HqCircularInventoryCandidateView from '@/views/hq/circular-inventory/HqCircularInventoryCandidateView.vue'
import HqCircularInventoryView from '@/views/hq/circular-inventory/HqCircularInventoryView.vue'
import HqAiReportView from '@/views/hq/HqAiReportView.vue'
import EsgDashBoardView from '@/views/hq/esg/EsgDashBoardView.vue'
import AccountListView from '@/views/hq/account/AccountListView.vue'
import AccountApprovalView from '@/views/hq/account/AccountApprovalView.vue'
import HqAnalyticsOrderStatsView from '@/views/hq/analytics/HqAnalyticsOrderStatsView.vue'
import HqAnalyticsSeasonalView from '@/views/hq/analytics/HqAnalyticsSeasonalView.vue'
import HqAnalyticsTurnoverView from '@/views/hq/analytics/HqAnalyticsTurnoverView.vue'
import HqAnalyticsSalesPatternView from '@/views/hq/analytics/HqAnalyticsSalesPatternView.vue'
import HqAnalyticsMenuSalesView from '@/views/hq/analytics/HqAnalyticsMenuSalesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
    {
      path: '/dev-login',
      name: 'dev-login',
      component: DevLoginView,
      meta: { requiresAuth: false },
    },
    { path: '/signup', name: 'signup', component: SignupView, meta: { requiresAuth: false } },
    { path: '/hq/dashboard', name: 'hq-dashboard', component: OperationStatusView, meta: { requiresAuth: true, role: 'hq' } },

    { path: '/hq/inventory', redirect: { name: 'hq-inventory-company-wide' } },
    { path: '/hq/inventory/company-wide', name: 'hq-inventory-company-wide', component: HqCompanyWideInventoryView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/inventory/warehouse-comparison', name: 'hq-inventory-warehouse-comparison', component: HqWarehouseInventoryComparisonView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/orders', name: 'hq-orders', component: HqOrderManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/products', name: 'hq-products', component: HqProductManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/products/categories/add', name: 'hq-category-add', component: HqCategoryAddView, meta: { requiresAuth: true, role: 'hq' } },
    {
      path: '/hq/products/new',
      name: 'hq-product-new',
      component: () => import('@/views/hq/HqProductCreateView.vue'),
      meta: { requiresAuth: true, role: 'hq' },
    },
    { path: '/hq/infrastructure', name: 'hq-infrastructure', component: HqInfrastructureManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics', name: 'hq-analytics', component: HqSettlementStatisticsView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/order-stats', name: 'hq-analytics-order-stats', component: HqAnalyticsOrderStatsView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/seasonal', name: 'hq-analytics-seasonal', component: HqAnalyticsSeasonalView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/turnover', name: 'hq-analytics-turnover', component: HqAnalyticsTurnoverView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/sales-pattern', name: 'hq-analytics-sales-pattern', component: HqAnalyticsSalesPatternView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/menu-sales', name: 'hq-analytics-menu-sales', component: HqAnalyticsMenuSalesView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/purchase-orders', name: 'hq-purchase-orders', component: HqPurchaseOrderView, meta: { requiresAuth: true, role: 'hq' } },
    {
      path: '/hq/purchase-orders/new',
      name: 'hq-purchase-order-new',
      component: () => import('@/views/hq/HqPurchaseOrderCreateView.vue'),
      meta: { requiresAuth: true, role: 'hq' },
    },
    {
      path: '/hq/purchase-orders/:id/edit',
      name: 'hq-purchase-order-edit',
      component: () => import('@/views/hq/HqPurchaseOrderCreateView.vue'),
      meta: { requiresAuth: true, role: 'hq' },
    },
    { path: '/hq/vendors', name: 'hq-vendors', component: HqVendorManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/circular-inventory/candidates', name: 'hq-circular-inventory-candidates', component: HqCircularInventoryCandidateView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/circular-inventory', name: 'hq-circular-inventory', component: HqCircularInventoryView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/accounts', name: 'hq-accounts', component: AccountListView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/accounts/approvals', name: 'hq-account-approvals', component: AccountApprovalView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/account/accountlist', name: 'hq-account-list', component: AccountListView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/account/approval', name: 'hq-account-approval', component: AccountApprovalView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/ai-report', name: 'hq-ai-report', component: HqAiReportView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/esg', name: 'hq-esg', component: EsgDashBoardView, meta: { requiresAuth: true, role: 'hq' } },

    { path: '/store/pos', name: 'store-pos', component: StorePosView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/orders', name: 'store-orders', component: StoreOrdersView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inventory', name: 'store-inventory', component: StoreInventoryView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inbound', name: 'store-inbound', component: StoreInboundView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/ai-report', name: 'store-ai-report', component: StoreAiReportView, meta: { requiresAuth: true, role: 'store' } },

    {
      path: '/warehouse/dashboard',
      name: 'wh-dashboard',
      component: WarehouseDashboardView,
      meta: { requiresAuth: true, role: 'warehouse' },
    },
    {
      path: '/warehouse/inventory',
      name: 'wh-inventory',
      component: WarehouseInventoryView,
      meta: { requiresAuth: true, role: 'warehouse' },
    },
    {
      path: '/warehouse/inbound',
      name: 'wh-inbound',
      component: WarehouseInboundView,
      meta: { requiresAuth: true, role: 'warehouse' },
    },
    {
      path: '/warehouse/outbound',
      name: 'wh-outbound',
      component: WarehouseOutboundView,
      meta: { requiresAuth: true, role: 'warehouse' },
    },

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

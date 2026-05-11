import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { roleHomeMap } from '@/config/roleMenus.js'

import DevLoginView from '@/views/user/DevLoginView.vue'
import LoginView from '@/views/user/LoginView.vue'
import SignupView from '@/views/user/SignupView.vue'
import MyPageView from '@/views/user/MyPageView.vue'

import StoreDashboardView from '@/views/store/dashboard/StoreDashboardView.vue'
import StorePosView from '@/views/store/sales/StorePosView.vue'
import StoreSalesHistoryView from '@/views/store/sales/StoreSalesHistoryView.vue'
import StoreSalesAnalysisView from '@/views/store/sales/StoreSalesAnalysisView.vue'
import StoreOrderRequestView from '@/views/store/orders/StoreOrderRequestView.vue'
import StoreOrderHistoryView from '@/views/store/orders/StoreOrderHistoryView.vue'
import StoreOrderAnalysisView from '@/views/store/orders/StoreOrderAnalysisView.vue'
import StoreOrderDetailView from '@/views/store/orders/StoreOrderDetailView.vue'
import StoreInboundListView from '@/views/store/inbound/StoreInboundListView.vue'
import StoreInboundDetailView from '@/views/store/inbound/StoreInboundDetailView.vue'
import StoreInboundAnalysisView from '@/views/store/inbound/StoreInboundAnalysisView.vue'
import StoreInventoryView from '@/views/store/inventory/StoreInventoryView.vue'
import StoreInventorySkuDetailView from '@/views/store/inventory/StoreInventorySkuDetailView.vue'
import StoreStatsView from '@/views/store/stats/StoreStatsView.vue'

import WarehouseDashboardView from '@/views/warehouse/dashboard/WarehouseDashboardView.vue'
import WarehouseInventoryView from '@/views/warehouse/WarehouseInventoryView.vue'
import WarehouseInventorySkuDetailView from '@/views/warehouse/WarehouseInventorySkuDetailView.vue'
import WarehouseInboundView from '@/views/warehouse/inbound/WarehouseInboundView.vue'
import WarehouseOutboundView from '@/views/warehouse/WarehouseOutboundView.vue'
import WarehouseOutboundDetailView from '@/views/warehouse/WarehouseOutboundDetailView.vue'

import OperationStatusView from '@/views/hq/dashboard/OperationStatusView.vue'
import InventoryRiskView from '@/views/hq/dashboard/InventoryRiskView.vue'
import InboundOutboundFlowView from '@/views/hq/dashboard/InboundOutboundFlowView.vue'
import AlertCenterView from '@/views/hq/dashboard/AlertCenterView.vue'
import AllTransactionsView from '@/views/hq/dashboard/AllTransactionsView.vue'
import AllFlowTransactionsView from '@/views/hq/dashboard/AllFlowTransactionsView.vue'

import HqCompanyWideInventoryView from '@/views/hq/inventory/HqCompanyWideInventoryView.vue'
import HqWarehouseInventoryComparisonView from '@/views/hq/inventory/HqWarehouseInventoryComparisonView.vue'
import HqWarehouseSkuTransferDetailView from '@/views/hq/inventory/HqWarehouseSkuTransferDetailView.vue'
import HqWarehouseTransferHistoryView from '@/views/hq/inventory/HqWarehouseTransferHistoryView.vue'
import HqWarehouseTransferHistoryDetailView from '@/views/hq/inventory/HqWarehouseTransferHistoryDetailView.vue'
import HqCompanyWideInventorySkuDetailView from '@/views/hq/inventory/HqCompanyWideInventorySkuDetailView.vue'
import HqProductManagementView from '@/views/hq/products/HqProductManagementView.vue'
import HqInfrastructureManagementView from '@/views/hq/infrastructure/HqInfrastructureManagementView.vue'
import HqInfrastructureMappingView from '@/views/hq/infrastructure/HqInfrastructureMappingView.vue'
import HqStoreDetailView from '@/views/hq/infrastructure/HqStoreDetailView.vue'
import HqWarehouseDetailView from '@/views/hq/infrastructure/HqWarehouseDetailView.vue'
import HqStoreOrderBatchApproveView from '@/views/hq/store-order-batch/HqStoreOrderBatchApproveView.vue'
import HqPurchaseOrderView from '@/views/hq/purchase-order/HqPurchaseOrderView.vue'
import HqCategoryAddView from '@/views/hq/products/HqCategoryAddView.vue'
import HqCircularStockCandidateView from '@/views/hq/circular-stock/HqCircularStockCandidateView.vue'
import HqCircularStockInventoryView from '@/views/hq/circular-stock/HqCircularStockInventoryView.vue'
import HqCircularStockBuyerManagementView from '@/views/hq/circular-stock/HqCircularStockBuyerManagementView.vue'
import HqCircularStockSalesRegisterView from '@/views/hq/circular-stock/HqCircularStockSalesRegisterView.vue'
import HqCircularStockSalesHistoryView from '@/views/hq/circular-stock/HqCircularStockSalesHistoryView.vue'
import HqCircularStockSalesDetailView from '@/views/hq/circular-stock/HqCircularStockSalesDetailView.vue'
import EsgDashBoardView from '@/views/hq/esg/EsgDashBoardView.vue'
import EsgCarbonPriceView from '@/views/hq/esg/EsgCarbonPriceView.vue'
import EsgQuotaView from '@/views/hq/esg/EsgQuotaView.vue'
import EsgTreeScoreView from '@/views/hq/esg/EsgTreeScoreView.vue'
import AccountListView from '@/views/hq/account/AccountListView.vue'
import AccountApprovalView from '@/views/hq/account/AccountApprovalView.vue'
import HqAnalyticsOrderStatsView from '@/views/hq/analytics/HqAnalyticsOrderStatsView.vue'
import HqAnalyticsTurnoverView from '@/views/hq/analytics/HqAnalyticsTurnoverView.vue'
import HqAnalyticsDashboardView from '@/views/hq/analytics/HqAnalyticsDashboardView.vue'
import HqAnalyticsSalesView from '@/views/hq/analytics/HqAnalyticsSalesView.vue'
import HqAnalyticsVendorView from '@/views/hq/analytics/HqAnalyticsVendorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 기존 /login 진입은 모두 /dev-login 으로 통합 (LoginView 는 호환성 유지를 위해 import 만 보존)
    { path: '/login', redirect: '/dev-login' },
    {
      path: '/dev-login',
      name: 'dev-login',
      component: DevLoginView,
      meta: { requiresAuth: false },
    },
    { path: '/signup', name: 'signup', component: SignupView, meta: { requiresAuth: false } },
    // 마이페이지 — 모든 권한 공통 (HQ/STORE/WAREHOUSE 동일 라우트, 페이지 내부에서 권한별 분기 표시)
    { path: '/mypage', name: 'mypage', component: MyPageView, meta: { requiresAuth: true } },
    { path: '/hq/dashboard', name: 'hq-dashboard', component: OperationStatusView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/inventory-risk', name: 'hq-dashboard-inventory-risk', component: InventoryRiskView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/flow', name: 'hq-dashboard-flow', component: InboundOutboundFlowView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/flow/all', name: 'hq-dashboard-flow-all', component: AllFlowTransactionsView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/alerts', name: 'hq-dashboard-alerts', component: AlertCenterView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/dashboard/transactions', name: 'hq-dashboard-transactions', component: AllTransactionsView, meta: { requiresAuth: true, role: 'hq' } },

    { path: '/hq/inventory', redirect: { name: 'hq-inventory-company-wide' } },
    { path: '/hq/inventory/company-wide', name: 'hq-inventory-company-wide', component: HqCompanyWideInventoryView, meta: { requiresAuth: true, role: 'hq' } },
    {
      path: '/hq/inventory/company-wide/:itemCode/skus',
      name: 'hq-inventory-sku-detail',
      component: HqCompanyWideInventorySkuDetailView,
      meta: { requiresAuth: true, role: 'hq' },
    },
    { path: '/hq/inventory/warehouse-comparison', name: 'hq-inventory-warehouse-comparison', component: HqWarehouseInventoryComparisonView, meta: { requiresAuth: true, role: 'hq' } },
    {
      path: '/hq/inventory/warehouse-comparison/:skuCode',
      name: 'hq-inventory-warehouse-transfer-detail',
      component: HqWarehouseSkuTransferDetailView,
      meta: { requiresAuth: true, role: 'hq' },
    },
    {
      path: '/hq/inventory/warehouse-transfer-history',
      name: 'hq-inventory-warehouse-transfer-history',
      component: HqWarehouseTransferHistoryView,
      meta: { requiresAuth: true, role: 'hq' },
    },
    {
      path: '/hq/inventory/warehouse-transfer-history/:transferNo',
      name: 'hq-inventory-warehouse-transfer-history-detail',
      component: HqWarehouseTransferHistoryDetailView,
      meta: { requiresAuth: true, role: 'hq' },
    },
    { path: '/hq/products', name: 'hq-products', component: HqProductManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/products/categories/add', name: 'hq-category-add', component: HqCategoryAddView, meta: { requiresAuth: true, role: 'hq' } },
    {
      path: '/hq/products/new',
      name: 'hq-product-new',
      component: () => import('@/views/hq/products/HqProductCreateView.vue'),
      meta: { requiresAuth: true, role: 'hq' },
    },
    {
      path: '/hq/products/:productCode/skus',
      name: 'hq-product-sku-detail',
      component: () => import('@/views/hq/products/HqProductSkuDetailView.vue'),
      meta: { requiresAuth: true, role: 'hq' },
    },
    {
      path: '/hq/products/:productCode/edit',
      name: 'hq-product-edit',
      component: () => import('@/views/hq/products/HqProductCreateView.vue'),
      meta: { requiresAuth: true, role: 'hq' },
    },
    { path: '/hq/infrastructure', name: 'hq-infrastructure', component: HqInfrastructureManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/infrastructure/mappings', name: 'hq-infrastructure-mappings', component: HqInfrastructureMappingView, meta: { requiresAuth: true, role: 'hq' } },
    {
      path: '/hq/infrastructure/stores/:storeId',
      name: 'hq-infrastructure-store-detail',
      component: HqStoreDetailView,
      meta: { requiresAuth: true, role: 'hq' },
    },
    {
      path: '/hq/infrastructure/warehouses/:warehouseId',
      name: 'hq-infrastructure-warehouse-detail',
      component: HqWarehouseDetailView,
      meta: { requiresAuth: true, role: 'hq' },
    },
    {
      path: '/hq/batch/store-order-approve',
      name: 'hq-store-order-batch-approve',
      component: HqStoreOrderBatchApproveView,
      meta: { requiresAuth: true, role: 'hq' },
    },
    { path: '/hq/analytics', name: 'hq-analytics', component: HqAnalyticsDashboardView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/sales', name: 'hq-analytics-sales', component: HqAnalyticsSalesView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/vendors', name: 'hq-analytics-vendors', component: HqAnalyticsVendorView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/order-stats', name: 'hq-analytics-order-stats', component: HqAnalyticsOrderStatsView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/seasonal', redirect: '/hq/analytics/sales?tab=seasonal' },
    { path: '/hq/analytics/turnover', name: 'hq-analytics-turnover', component: HqAnalyticsTurnoverView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/analytics/sales-pattern', redirect: '/hq/analytics/sales?tab=time' },
    { path: '/hq/analytics/menu-sales', redirect: '/hq/analytics/sales?tab=item' },
    { path: '/hq/purchase-orders', name: 'hq-purchase-orders', component: HqPurchaseOrderView, meta: { requiresAuth: true, role: 'hq' } },
    {
      path: '/hq/purchase-orders/new',
      name: 'hq-purchase-order-new',
      component: () => import('@/views/hq/purchase-order/HqPurchaseOrderCreateView.vue'),
      meta: { requiresAuth: true, role: 'hq' },
    },
    {
      path: '/hq/purchase-orders/:id/edit',
      name: 'hq-purchase-order-edit',
      component: () => import('@/views/hq/purchase-order/HqPurchaseOrderCreateView.vue'),
      meta: { requiresAuth: true, role: 'hq' },
    },
    { path: '/hq/circular-inventory/candidates', name: 'hq-circular-inventory-candidates', component: HqCircularStockCandidateView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/circular-inventory', name: 'hq-circular-inventory', component: HqCircularStockInventoryView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/circular-inventory/buyers', name: 'hq-circular-inventory-buyers', component: HqCircularStockBuyerManagementView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/circular-inventory/sales/register', name: 'hq-circular-inventory-sales-register', component: HqCircularStockSalesRegisterView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/circular-inventory/sales/history', name: 'hq-circular-inventory-sales-history', component: HqCircularStockSalesHistoryView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/circular-inventory/sales/history/:saleId', name: 'hq-circular-inventory-sales-history-detail', component: HqCircularStockSalesDetailView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/accounts', name: 'hq-accounts', component: AccountListView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/accounts/approvals', name: 'hq-account-approvals', component: AccountApprovalView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/account/accountlist', name: 'hq-account-list', component: AccountListView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/account/approval', name: 'hq-account-approval', component: AccountApprovalView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/esg', name: 'hq-esg', component: EsgDashBoardView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/esg/tree-score', name: 'hq-esg-tree-score', component: EsgTreeScoreView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/esg/carbon-price', name: 'hq-esg-carbon-price', component: EsgCarbonPriceView, meta: { requiresAuth: true, role: 'hq' } },
    { path: '/hq/esg/emissionquota', name: 'hq-esg-emissionquota', component: EsgQuotaView, meta: { requiresAuth: true, role: 'hq' } },

    { path: '/store/dashboard', name: 'store-dashboard', component: StoreDashboardView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/pos', redirect: { name: 'store-sales-register' } },
    { path: '/store/sales/register', name: 'store-sales-register', component: StorePosView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/sales/history', name: 'store-sales-history', component: StoreSalesHistoryView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/sales/analysis', name: 'store-sales-analysis', component: StoreSalesAnalysisView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/orders', redirect: { name: 'store-order-request' } },
    { path: '/store/orders/request', name: 'store-order-request', component: StoreOrderRequestView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/orders/request/:orderNo/edit', name: 'store-order-edit', component: StoreOrderRequestView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/orders/history', name: 'store-order-history', component: StoreOrderHistoryView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/orders/history/:orderNo', name: 'store-order-detail', component: StoreOrderDetailView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/orders/analysis', name: 'store-order-analysis', component: StoreOrderAnalysisView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inventory', name: 'store-inventory', component: StoreInventoryView, meta: { requiresAuth: true, role: 'store' } },
    {
      path: '/store/inventory/:itemCode/skus',
      name: 'store-inventory-sku-detail',
      component: StoreInventorySkuDetailView,
      meta: { requiresAuth: true, role: 'store' },
    },
    { path: '/store/inbound', redirect: { name: 'store-inbound-list' } },
    { path: '/store/inbound/list', name: 'store-inbound-list', component: StoreInboundListView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inbound/list/:id', name: 'store-inbound-detail', component: StoreInboundDetailView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/inbound/history', redirect: { name: 'store-inbound-list' } },
    { path: '/store/inbound/history/:id', redirect: (to) => ({ name: 'store-inbound-detail', params: { id: to.params.id } }) },
    { path: '/store/inbound/analysis', name: 'store-inbound-analysis', component: StoreInboundAnalysisView, meta: { requiresAuth: true, role: 'store' } },
    { path: '/store/stats', name: 'store-stats', component: StoreStatsView, meta: { requiresAuth: true, role: 'store' } },

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
      path: '/warehouse/inventory/:itemCode/skus',
      name: 'wh-inventory-sku-detail',
      component: WarehouseInventorySkuDetailView,
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
    {
      path: '/warehouse/outbound/:id',
      name: 'wh-outbound-detail',
      component: WarehouseOutboundDetailView,
      meta: { requiresAuth: true, role: 'warehouse' },
    },

    // 첫 진입 — dev-login 으로 (인증된 상태면 router.beforeEach 에서 권한별 홈으로 재이동)
    { path: '/', redirect: '/dev-login' },
    // 알 수 없는 경로 — dev-login 으로
    { path: '/:pathMatch(.*)*', redirect: '/dev-login' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (!to.meta.requiresAuth) {
    if (auth.isAuthenticated) return roleHomeMap[auth.user.role]
    return true
  }

  if (!auth.isAuthenticated) return { name: 'dev-login' }

  if (to.meta.role && to.meta.role !== auth.user.role) {
    return roleHomeMap[auth.user.role]
  }

  return true
})

export default router

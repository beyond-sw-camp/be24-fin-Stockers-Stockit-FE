import { createRouter, createWebHistory } from 'vue-router'
import ErpDashboardView from '../views/ErpDashboardView.vue'
import InventoryStatusView from '../views/InventoryStatusView.vue'
import OrderManagementView from '../views/OrderManagementView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ErpDashboardView,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryStatusView,
    },
    {
      path: '/orders',
      name: 'orders',
      component: OrderManagementView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router

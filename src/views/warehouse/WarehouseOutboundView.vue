<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const activeSideMenu = ref('출고 관리')
const topMenus = roleMenus.warehouse
const sideMenus = roleMenus.warehouse.find((menu) => menu.label === '입/출고 관리')?.children ?? []

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    active-top-menu="입/출고 관리"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div class="w-16 h-16 bg-[#E6F2F0] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#004D3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17H5a2 2 0 0 1-2-2V7h11v10Z"/><path d="M14 17h-1V9h3l3 3v5h-1"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/></svg>
      </div>
      <h1 class="text-base font-black text-gray-800 uppercase tracking-wider">출고 관리</h1>
      <p class="text-sm text-gray-400">준비 중인 기능입니다.</p>
    </div>
  </AppLayout>
</template>

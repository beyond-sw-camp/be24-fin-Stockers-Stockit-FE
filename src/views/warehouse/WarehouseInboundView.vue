<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const activeSideMenu = ref('입고 관리')
const sideMenus = roleMenus.warehouse

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    active-top-menu="입고 관리"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div class="w-16 h-16 bg-[#E6F2F0] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#004D3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></svg>
      </div>
      <h1 class="text-base font-black text-gray-800 uppercase tracking-wider">입고 관리</h1>
      <p class="text-sm text-gray-400">준비 중인 기능입니다.</p>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const storeMenus = roleMenus.store
const sideMenus = roleMenus.store.find((menu) => menu.label === '발주 관리')?.children ?? []
const activeTopMenu = ref('발주 관리')
const activeSideMenu = ref('발주 관리')

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <div class="w-16 h-16 bg-[#E6F2F0] flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#004D3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>
      </div>
      <h1 class="text-base font-black text-gray-800 uppercase tracking-wider">발주 관리</h1>
      <p class="text-sm text-gray-400">준비 중인 기능입니다.</p>
    </div>
  </AppLayout>
</template>

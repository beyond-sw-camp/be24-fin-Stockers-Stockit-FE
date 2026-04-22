<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const aiReportMenus = roleMenus.hq.find(menu => menu.label === 'AI 리포트')?.children ?? []

const activeTopMenu = computed(() => 'AI 리포트')
const activeSideMenu = ref('AI 리포트')

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="aiReportMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div class="flex h-16 w-16 items-center justify-center bg-[#EBF5F5]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#004D3C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15l3-4 3 2 4-7" />
        </svg>
      </div>
      <h1 class="text-base font-black uppercase tracking-wider text-gray-800">AI 리포트</h1>
      <p class="text-sm text-gray-400">준비 중인 기능입니다.</p>
    </div>
  </AppLayout>
</template>

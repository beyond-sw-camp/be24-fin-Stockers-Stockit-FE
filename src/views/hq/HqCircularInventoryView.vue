<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const circularInventoryMenus = roleMenus.hq.find(menu => menu.label === '순환 재고 관리')?.children ?? []

const activeTopMenu = computed(() => '순환 재고 관리')
const activeSideMenu = ref('순환 재고 조회')

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="circularInventoryMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Circular Inventory</p>
        <h1 class="mt-1 text-lg font-black text-gray-900">순환 재고 조회</h1>
      </section>

      <section class="border border-[#D6EAEA] bg-[#EBF5F5] p-6">
        <p class="text-sm font-black text-gray-900">순환 재고 조회 화면 준비 중입니다.</p>
        <p class="mt-2 text-xs font-bold text-gray-500">
          순환 재고 전환 내역과 운영 현황을 조회하는 기능이 이곳에 연결될 예정입니다.
        </p>
      </section>
    </div>
  </AppLayout>
</template>

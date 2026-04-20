<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  ShoppingCart,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { storeSideMenusByTopMenu, storeTopMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useInventoryStore } from '@/stores/inventory.js'

const router = useRouter()
const auth = useAuthStore()
const inventory = useInventoryStore()

const activeTopMenu = '대시보드'
const activeSideMenu = ref('매장 요약')
const sideMenus = storeSideMenusByTopMenu[activeTopMenu]

const lowStockItems = computed(() => inventory.products.filter((item) => inventory.stockStatus(item) !== 'normal'))
const todayCards = computed(() => [
  { label: '오늘 판매', value: '₩1,248,000', caption: '전일 대비 +8.4%', icon: ShoppingCart, tone: 'emerald' },
  { label: '재고 부족/품절', value: `${lowStockItems.value.length}건`, caption: '즉시 확인 필요', icon: AlertCircle, tone: 'red' },
  { label: '입고 예정/검수 대기', value: '6건', caption: '오늘 도착 3건', icon: PackageCheck, tone: 'blue' },
  { label: '진행 중 주문 요청', value: '4건', caption: '대기 2건, 승인 2건', icon: ClipboardList, tone: 'amber' },
])

const alerts = [
  { title: '무소음 무선 마우스 블랙 품절', meta: '재고 0개 · 주문 요청 권장' },
  { title: '휴대용 가글 중 250ml 안전재고 미만', meta: '현재 12개 · 추천 주문량 80개' },
  { title: '입고 검수 대기 2건', meta: '도착 차량 확인 후 검수 필요' },
]

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeTopMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">
      <section class="border border-gray-300 bg-white px-5 py-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-lg font-black text-gray-900">매장 운영 대시보드</h1>
            <p class="mt-1 text-sm text-gray-500">오늘 처리해야 할 판매, 재고, 입고, 주문 요청 현황을 요약합니다.</p>
          </div>
          <span class="border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">실시간 갱신 중</span>
        </div>
      </section>

      <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article v-for="card in todayCards" :key="card.label" class="border border-gray-300 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold text-gray-500">{{ card.label }}</p>
              <p class="mt-4 text-3xl font-semibold text-gray-950">{{ card.value }}</p>
              <p class="mt-2 text-xs font-medium text-gray-400">{{ card.caption }}</p>
            </div>
            <component
              :is="card.icon"
              :size="24"
              :class="{
                'text-emerald-700': card.tone === 'emerald',
                'text-red-600': card.tone === 'red',
                'text-blue-600': card.tone === 'blue',
                'text-amber-600': card.tone === 'amber',
              }"
            />
          </div>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex h-14 items-center justify-between border-b border-gray-200 px-5">
            <h2 class="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
              <BarChart3 :size="16" />
              오늘 핵심 흐름
            </h2>
          </div>
          <div class="grid gap-3 p-5 md:grid-cols-3">
            <div class="border border-gray-200 bg-gray-50 p-4">
              <p class="text-xs font-bold text-gray-500">판매 진행률</p>
              <p class="mt-3 text-2xl font-semibold text-gray-900">78%</p>
              <div class="mt-4 h-2 bg-gray-200"><div class="h-full w-[78%] bg-[#004D3C]" /></div>
            </div>
            <div class="border border-gray-200 bg-gray-50 p-4">
              <p class="text-xs font-bold text-gray-500">입고 처리율</p>
              <p class="mt-3 text-2xl font-semibold text-gray-900">62%</p>
              <div class="mt-4 h-2 bg-gray-200"><div class="h-full w-[62%] bg-blue-600" /></div>
            </div>
            <div class="border border-gray-200 bg-gray-50 p-4">
              <p class="text-xs font-bold text-gray-500">주문 요청 승인율</p>
              <p class="mt-3 text-2xl font-semibold text-gray-900">50%</p>
              <div class="mt-4 h-2 bg-gray-200"><div class="h-full w-[50%] bg-amber-500" /></div>
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex h-14 items-center border-b border-gray-200 px-5">
            <h2 class="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
              <AlertCircle :size="16" class="text-red-600" />
              최근 주요 알림
            </h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="alert in alerts" :key="alert.title" class="flex gap-3 px-5 py-4">
              <CheckCircle2 :size="15" class="mt-0.5 shrink-0 text-[#004D3C]" />
              <div>
                <p class="text-sm font-bold text-gray-800">{{ alert.title }}</p>
                <p class="mt-1 text-xs text-gray-500">{{ alert.meta }}</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

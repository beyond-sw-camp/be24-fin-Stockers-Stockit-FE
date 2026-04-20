<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BarChart3, Bot, TrendingUp } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { storeSideMenusByTopMenu, storeTopMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const activeTopMenu = '통계/모니터링'
const activeSideMenu = ref('핵심 지표')
const sideMenus = storeSideMenusByTopMenu[activeTopMenu]

const metrics = [
  { label: '오늘 매출', value: '₩1,248,000', change: '+8.4%' },
  { label: '판매 건수', value: '186건', change: '+12건' },
  { label: '평균 객단가', value: '₩6,710', change: '-1.2%' },
  { label: '품절 위험 SKU', value: '3개', change: '+1' },
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
        <h1 class="text-lg font-black text-gray-900">통계/모니터링</h1>
        <p class="mt-1 text-sm text-gray-500">매장 운영에 필요한 핵심 지표와 자연어 질의 영역입니다.</p>
      </section>

      <section v-if="activeSideMenu === '핵심 지표'" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article v-for="metric in metrics" :key="metric.label" class="border border-gray-300 bg-white p-5 shadow-sm">
          <p class="text-xs font-bold text-gray-500">{{ metric.label }}</p>
          <p class="mt-4 text-3xl font-semibold text-gray-950">{{ metric.value }}</p>
          <p class="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#004D3C]">
            <TrendingUp :size="13" />
            {{ metric.change }}
          </p>
        </article>
      </section>

      <section v-else class="grid gap-3 xl:grid-cols-[1fr_360px]">
        <article class="border border-gray-300 bg-white p-5 shadow-sm">
          <h2 class="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
            <Bot :size="17" />
            자연어 맞춤 질의
          </h2>
          <textarea
            class="mt-4 min-h-40 w-full resize-none border border-gray-300 bg-white p-4 text-sm outline-none focus:border-[#004D3C]"
            placeholder="예: 이번 주 품절 위험이 높은 상품과 추천 주문량을 알려줘"
          />
          <button type="button" class="mt-3 bg-[#004D3C] px-4 py-2 text-sm font-bold text-white hover:bg-[#003d30]">
            질의 실행
          </button>
        </article>

        <aside class="border border-gray-300 bg-white p-5 shadow-sm">
          <h3 class="inline-flex items-center gap-2 text-sm font-bold text-gray-800">
            <BarChart3 :size="16" />
            추천 질문
          </h3>
          <div class="mt-4 space-y-2 text-sm text-gray-600">
            <button type="button" class="w-full border border-gray-200 px-3 py-2 text-left hover:bg-gray-50">오늘 재고 경고를 요약해줘</button>
            <button type="button" class="w-full border border-gray-200 px-3 py-2 text-left hover:bg-gray-50">판매가 증가한 카테고리를 알려줘</button>
            <button type="button" class="w-full border border-gray-200 px-3 py-2 text-left hover:bg-gray-50">입고 지연 가능성이 있는 주문을 찾아줘</button>
          </div>
        </aside>
      </section>
    </div>
  </AppLayout>
</template>

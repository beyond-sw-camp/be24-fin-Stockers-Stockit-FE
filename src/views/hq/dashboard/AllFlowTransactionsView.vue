<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRightLeft, Clock3, ListOrdered } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { dashboardSideMenus } from '@/views/hq/dashboard/dashboardMenus.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('입출고 흐름')
const sideMenus = dashboardSideMenus

const flowTransactions = [
  { id: 'FLOW-240420-01', type: '입고', location: '용인 물류센터', item: '종이컵 6.5온스', qty: '+4,500', status: '검수 진행', time: '15:12:20' },
  { id: 'FLOW-240420-02', type: '출고', location: '성수 직영점', item: '아메리카노 원두 1kg', qty: '-120', status: '출고 완료', time: '15:09:42' },
  { id: 'FLOW-240420-03', type: '이동', location: '인천 제2센터 → 인천 제1센터', item: '무선 마우스 블랙', qty: '-60', status: '이동중', time: '14:58:11' },
  { id: 'FLOW-240420-04', type: '입고', location: '부산 중앙창고', item: '유리제 머그컵 350ml', qty: '+220', status: '지연', time: '14:41:05' },
  { id: 'FLOW-240420-05', type: '출고', location: '판교 테크노점', item: '종이컵 6.5온스', qty: '-800', status: '상차 진행', time: '14:30:00' },
  { id: 'FLOW-240420-06', type: '입고', location: '인천 제1센터', item: '고속 충전기 25W', qty: '+500', status: '입고 대기', time: '14:15:22' },
  { id: 'FLOW-240420-07', type: '출고', location: '강남 서초점', item: '손세정제 리필 500ml', qty: '-240', status: '출고 대기', time: '13:55:40' },
]

const activeTopMenu = computed(() => '대시보드')
const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="hqMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    show-system-card
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-400">
            <button
              type="button"
              class="transition-colors hover:text-gray-700"
              @click="router.push('/hq/dashboard')"
            >
              대시보드
            </button>
            <span>&gt;</span>
            <button
              type="button"
              class="transition-colors hover:text-gray-700"
              @click="router.push('/hq/dashboard/flow')"
            >
              입출고 흐름
            </button>
            <span>&gt;</span>
            <span class="text-gray-700">전체 입출고 조회</span>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
              <ListOrdered :size="18" />
              전체 입출고 조회
            </h2>
            <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">기준: {{ dateLabel }}</span>
            <span class="inline-flex items-center gap-1 border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
              <Clock3 :size="12" />
              물류 흐름 기준
            </span>
          </div>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-800">입출고 트랜잭션 목록</h3>
            <ArrowRightLeft :size="14" class="text-gray-400" />
          </div>
          <span class="text-[11px] text-gray-400">총 {{ flowTransactions.length }}건</span>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[980px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">ID</th>
                <th class="px-3 py-2.5 text-left font-bold">구분</th>
                <th class="px-3 py-2.5 text-left font-bold">거점</th>
                <th class="px-3 py-2.5 text-left font-bold">품목</th>
                <th class="px-3 py-2.5 text-right font-bold">수량</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
                <th class="px-3 py-2.5 text-left font-bold">시각</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="row in flowTransactions" :key="row.id" class="hover:bg-gray-50/50">
                <td class="px-3 py-2.5 font-mono text-gray-400">{{ row.id }}</td>
                <td class="px-3 py-2.5 text-xs font-bold text-gray-700">{{ row.type }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ row.location }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ row.item }}</td>
                <td class="px-3 py-2.5 text-right font-bold" :class="row.qty.startsWith('+') ? 'text-emerald-600' : 'text-red-600'">
                  {{ row.qty }}
                </td>
                <td class="px-3 py-2.5 text-gray-700">{{ row.status }}</td>
                <td class="px-3 py-2.5 text-gray-400">{{ row.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRightLeft,
  Clock3,
  PackageCheck,
  Truck,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { dashboardSideMenus } from '@/views/hq/dashboard/dashboardMenus.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('입출고 흐름')
const sideMenus = dashboardSideMenus

const flowStats = [
  { label: '금일 입고 예정', value: '22', unit: '건' },
  { label: '금일 출고 예정', value: '54', unit: '건' },
  { label: '이동 지시 진행중', value: '8', unit: '건' },
  { label: '지연 처리 건수', value: '3', unit: '건' },
]

const inboundQueues = [
  { center: '인천 제1센터', item: '고속 충전기 25W', qty: '500 EA', eta: '15:40', state: '입고 대기' },
  { center: '용인 물류센터', item: '종이컵 6.5온스', qty: '4,500 EA', eta: '16:10', state: '검수 진행' },
  { center: '부산 중앙창고', item: '유리제 머그컵 350ml', qty: '220 EA', eta: '17:20', state: '지연' },
]

const outboundQueues = [
  { target: '성수 직영점', item: '아메리카노 원두 1kg', qty: '120 EA', depart: '14:20', state: '출고 완료' },
  { target: '판교 테크노점', item: '종이컵 6.5온스', qty: '800 EA', depart: '15:10', state: '상차 진행' },
  { target: '강남 서초점', item: '손세정제 리필 500ml', qty: '240 EA', depart: '16:00', state: '출고 대기' },
]

const centerFlows = [
  { center: '인천 제1센터', inbound: 12, outbound: 18, transfer: 3, status: '정상' },
  { center: '인천 제2센터', inbound: 4, outbound: 9, transfer: 2, status: '주의' },
  { center: '용인 물류센터', inbound: 15, outbound: 21, transfer: 2, status: '혼잡' },
  { center: '부산 중앙창고', inbound: 3, outbound: 6, transfer: 1, status: '지연' },
]

const liveLogs = [
  { id: 'FLOW-240420-01', type: '입고', location: '용인 물류센터', item: '종이컵 6.5온스', qty: '+4,500', status: '검수 진행', time: '15:12:20' },
  { id: 'FLOW-240420-02', type: '출고', location: '성수 직영점', item: '아메리카노 원두 1kg', qty: '-120', status: '출고 완료', time: '15:09:42' },
  { id: 'FLOW-240420-03', type: '이동', location: '인천 제2센터 → 인천 제1센터', item: '무선 마우스 블랙', qty: '-60', status: '이동중', time: '14:58:11' },
  { id: 'FLOW-240420-04', type: '입고', location: '부산 중앙창고', item: '유리제 머그컵 350ml', qty: '+220', status: '지연', time: '14:41:05' },
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

function goToAllFlowTransactions() {
  router.push('/hq/dashboard/flow/all')
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
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <ArrowRightLeft :size="18" />
            입출고 흐름
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">기준: {{ dateLabel }}</span>
          <span class="inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
            <Clock3 :size="12" />
            물류 흐름 실시간
          </span>
        </div>

      </section>

      <section class="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="stat in flowStats"
          :key="stat.label"
          class="flex h-[80px] flex-col justify-between border border-gray-300 bg-white px-3 py-3 shadow-sm"
        >
          <p class="text-[11px] font-medium leading-tight text-gray-500">{{ stat.label }}</p>
          <div class="flex items-end justify-between gap-1">
            <div class="min-w-0 leading-none">
              <span class="text-[20px] font-bold tracking-tight text-gray-950">{{ stat.value }}</span>
              <span class="ml-0.5 text-[11px] text-gray-400">{{ stat.unit }}</span>
            </div>
            <Truck :size="14" class="text-[#1f4b3a]" />
          </div>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(300px,0.9fr)]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <PackageCheck :size="16" />
              입고 진행 현황
            </h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="row in inboundQueues" :key="`${row.center}-${row.item}`" class="px-3 py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold text-gray-800">{{ row.center }}</p>
                  <p class="mt-1 text-[11px] text-gray-600">{{ row.item }} · {{ row.qty }}</p>
                  <p class="mt-2 text-[11px] text-gray-400">예정 {{ row.eta }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium"
                  :class="row.state === '지연' ? 'bg-red-50 text-red-700' : row.state === '검수 진행' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'">
                  {{ row.state }}
                </span>
              </div>
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Truck :size="16" />
              출고 진행 현황
            </h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="row in outboundQueues" :key="`${row.target}-${row.item}`" class="px-3 py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold text-gray-800">{{ row.target }}</p>
                  <p class="mt-1 text-[11px] text-gray-600">{{ row.item }} · {{ row.qty }}</p>
                  <p class="mt-2 text-[11px] text-gray-400">출발 {{ row.depart }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium"
                  :class="row.state === '출고 완료' ? 'bg-emerald-50 text-emerald-700' : row.state === '상차 진행' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'">
                  {{ row.state }}
                </span>
              </div>
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="text-sm font-medium text-gray-800">거점별 흐름</h3>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="row in centerFlows" :key="row.center" class="px-3 py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-[13px] font-semibold text-gray-800">{{ row.center }}</p>
                  <p class="mt-1 text-[11px] text-gray-500">입고 {{ row.inbound }} · 출고 {{ row.outbound }} · 이동 {{ row.transfer }}</p>
                </div>
                <span class="shrink-0 rounded-full px-2 py-1 text-[11px] font-medium"
                  :class="row.status === '정상' ? 'bg-emerald-50 text-emerald-700' : row.status === '주의' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">
                  {{ row.status }}
                </span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-800">최근 입출고 로그</h3>
            <span class="bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>
          </div>
          <button type="button" class="text-xs font-semibold text-[#1f4b3a] hover:underline" @click="goToAllFlowTransactions">전체 입출고 조회</button>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[800px] text-[13px]">
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
              <tr v-for="row in liveLogs" :key="row.id" class="hover:bg-gray-50/50">
                <td class="px-3 py-2.5 font-mono text-gray-400">{{ row.id.split('-')[2] }}</td>
                <td class="px-3 py-2.5 text-xs font-bold text-gray-700">{{ row.type }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ row.location }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ row.item }}</td>
                <td class="px-3 py-2.5 text-right font-bold" :class="row.qty.startsWith('+') ? 'text-emerald-600' : 'text-red-600'">{{ row.qty }}</td>
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

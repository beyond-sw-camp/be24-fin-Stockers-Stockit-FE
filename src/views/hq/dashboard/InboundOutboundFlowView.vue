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
import { dashboardSideMenus } from '@/views/hq/dashboard/dashboardMenus.js'

const router = useRouter()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('입출고 흐름')
const sideMenus = dashboardSideMenus

const flowStats = []

const inboundQueues = []

const outboundQueues = []

const centerFlows = []

const liveLogs = []

const activeTopMenu = computed(() => '대시보드')
const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)


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
        <article
          v-if="flowStats.length === 0"
          class="col-span-2 border border-gray-300 bg-white px-3 py-6 text-center text-xs font-medium text-gray-400 xl:col-span-4"
        >
          표시할 흐름 지표가 없습니다.
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
            <div v-if="inboundQueues.length === 0" class="px-3 py-10 text-center text-xs text-gray-400">
              입고 진행 데이터가 없습니다.
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
            <div v-if="outboundQueues.length === 0" class="px-3 py-10 text-center text-xs text-gray-400">
              출고 진행 데이터가 없습니다.
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
            <div v-if="centerFlows.length === 0" class="px-3 py-10 text-center text-xs text-gray-400">
              거점별 흐름 데이터가 없습니다.
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
              <tr v-if="liveLogs.length === 0">
                <td colspan="7" class="px-3 py-10 text-center text-xs text-gray-400">
                  최근 입출고 로그가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

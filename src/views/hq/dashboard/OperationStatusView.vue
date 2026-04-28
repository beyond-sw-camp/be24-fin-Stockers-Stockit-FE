<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  BarChart3,
  Clock,
  Grid2X2,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { dashboardSideMenus } from '@/views/hq/dashboard/dashboardMenus.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('운영 현황')

const sideMenus = dashboardSideMenus

const kpiStats = [
  { label: '전사 총 재고 수량', value: '124,582', unit: 'EA', change: '+2.4%', status: 'up' },
  { label: '재고 가치 총액', value: '₩4,821.5M', unit: '', change: '+0.8%', status: 'up' },
  { label: '안전 재고 부족 매장', value: '08', unit: '곳', change: '+2', status: 'down' },
  { label: '금일 입고 진행률', value: '82', unit: '%', change: '12/15 건', status: 'neutral' },
  { label: '금일 출고 진행률', value: '45', unit: '%', change: '18/40 건', status: 'neutral' },
  { label: '품절 임박 SKU', value: '14', unit: 'SKU', change: '-3', status: 'up' },
]

const chartHeights = [60, 45, 80, 95, 70, 85, 90]

const alerts = [
  { type: '재고', msg: '성수점: 아메리카노 원두 품절 임박', time: '10분 전' },
  { type: '발주', msg: '인천센터: (주)하림 입고 지연 발생', time: '25분 전' },
  { type: '정산', msg: '판교점: POS 재고 데이터 불일치', time: '1시간 전' },
]

const logisticsData = [
  { id: '20240416-001', center: '인천 제1물류센터', item: 'A사 프리미엄 원두 (500g)', qty: 500, status: '승인완료', time: '16:45:10' },
  { id: '20240416-002', center: '강남 서초점', item: '유기농 우유 1L (12입)', qty: -24, status: '출고대기', time: '16:30:22' },
  { id: '20240416-003', center: '성수 직영점', item: '친환경 종이컵 (1000ea)', qty: 10, status: '검수중', time: '16:15:45' },
  { id: '20240416-004', center: '판교 테크노점', item: '무라벨 생수 500ml', qty: 120, status: '승인완료', time: '15:50:12' },
  { id: '20240416-005', center: '부산 중앙창고', item: '질소 포장 디저트 박스', qty: -1200, status: '이동중', time: '15:20:30' },
]

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()),
)

const activeTopMenu = computed(() => '대시보드')

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function goToAlertCenter() {
  router.push('/hq/dashboard/alerts')
}

function goToTransactions() {
  router.push('/hq/dashboard/transactions')
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
        <div class="flex items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Grid2X2 :size="18" stroke-width="2" />
            {{ activeSideMenu }}
          </h2>
          <div class="flex gap-2">
            <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">기준: {{ dateLabel }}</span>
            <span class="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
              <Clock :size="12" /> 실시간
            </span>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <article
          v-for="stat in kpiStats"
          :key="stat.label"
          class="flex h-[80px] flex-col justify-between border border-gray-300 bg-white px-3 py-3 shadow-sm"
        >
          <p class="text-[11px] font-medium leading-tight text-gray-500">{{ stat.label }}</p>
          <div class="flex items-end justify-between gap-1">
            <div class="min-w-0 leading-none">
              <span class="text-[20px] font-bold tracking-tight text-gray-950">{{ stat.value }}</span>
              <span v-if="stat.unit" class="ml-0.5 text-[11px] text-gray-400">{{ stat.unit }}</span>
            </div>
            <span
              class="shrink-0 text-[11px] font-bold"
              :class="{
                'text-emerald-600': stat.status === 'up',
                'text-red-600': stat.status === 'down',
                'text-gray-400': stat.status === 'neutral',
              }"
            >{{ stat.change }}</span>
          </div>
        </article>
      </section>

      <section class="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <BarChart3 :size="16" /> 전사 입출고 트렌드 분석
            </h3>
            <div class="flex gap-3 text-[10px] font-medium text-gray-400">
              <span class="flex items-center gap-1"><i class="h-2 w-2 bg-[#1f4b3a]" />출고</span>
              <span class="flex items-center gap-1"><i class="h-2 w-2 bg-gray-200" />입고</span>
            </div>
          </div>
          <div class="px-3 py-3">
            <div class="flex gap-2">
              <div class="flex h-[220px] w-8 shrink-0 flex-col justify-between pb-4 pt-2 text-right text-[10px] font-medium text-gray-400">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
              <div
                class="flex flex-1 items-end border-b border-l border-gray-200"
                style="height: 220px; padding: 10px 6px 16px 4px;"
              >
                <div
                  v-for="(height, index) in chartHeights"
                  :key="index"
                  class="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div class="flex h-full w-full items-end justify-center gap-1">
                    <div class="w-4.5 rounded-sm bg-[#1f4b3a]" :style="{ height: `${height}%` }" />
                    <div class="w-4.5 rounded-sm bg-gray-200" :style="{ height: `${height * 0.7}%` }" />
                  </div>
                  <span class="text-[11px] font-medium text-gray-400">{{ 10 + index }}일</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <AlertCircle :size="16" class="text-red-600" /> 긴급 장애/경보
            </h3>
          </div>
          <div class="flex-1 divide-y divide-gray-100">
            <button
              v-for="alert in alerts"
              :key="alert.msg"
              type="button"
              class="w-full px-3 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <span class="block text-[13px] font-semibold text-gray-800">{{ alert.msg }}</span>
              <span class="mt-1 block text-[11px] text-gray-400">{{ alert.type }} · {{ alert.time }}</span>
            </button>
          </div>
          <button type="button" class="border-t border-gray-200 py-2.5 text-[12px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800" @click="goToAlertCenter">
            알림 센터 바로가기
          </button>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-800">최근 물류 트랜잭션</h3>
            <span class="bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>
          </div>
          <button type="button" class="text-xs font-semibold text-[#1f4b3a] hover:underline" @click="goToTransactions">전체 트랜잭션 조회</button>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[800px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">ID</th>
                <th class="px-3 py-2.5 text-left font-bold">물류 거점</th>
                <th class="px-3 py-2.5 text-left font-bold">품목</th>
                <th class="px-3 py-2.5 text-right font-bold">수량</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
                <th class="px-3 py-2.5 text-left font-bold">시각</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="row in logisticsData" :key="row.id" class="hover:bg-gray-50/50">
                <td class="px-3 py-2.5 font-mono text-gray-400">{{ row.id.split('-')[1] }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ row.center }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ row.item }}</td>
                <td class="px-3 py-2.5 text-right font-bold" :class="row.qty > 0 ? 'text-emerald-600' : 'text-red-600'">
                  {{ row.qty > 0 ? `+${row.qty.toLocaleString()}` : row.qty.toLocaleString() }}
                </td>
                <td class="px-3 py-2.5 text-xs font-bold text-gray-700">{{ row.status }}</td>
                <td class="px-3 py-2.5 text-gray-400">{{ row.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

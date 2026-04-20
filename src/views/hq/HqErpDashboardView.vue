<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Filter,
  Grid2X2,
  PlusCircle,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('실시간 요약')

const sideMenus = [
  { label: '실시간 요약', icon: 'layout' },
  { label: '전사 재고 집계', icon: 'warehouse' },
  { label: '안전재고 모니터링', icon: 'alert' },
  { label: '거점별 물동량', icon: 'truck' },
  { label: 'AI 수요 예측', icon: 'chart' },
  { label: '시스템 감사 로그', icon: 'file' },
]

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
  {
    id: '20240416-001',
    center: '인천 제1물류센터',
    item: 'A사 프리미엄 원두 (500g)',
    vendor: '(주)커피트럭스',
    qty: 500,
    manager: '이선엽',
    status: '승인완료',
    time: '16:45:10',
  },
  {
    id: '20240416-002',
    center: '강남 서초점',
    item: '유기농 우유 1L (12입)',
    vendor: '매일유업',
    qty: -24,
    manager: '박범수',
    status: '출고대기',
    time: '16:30:22',
  },
  {
    id: '20240416-003',
    center: '성수 직영점',
    item: '친환경 종이컵 (1000ea)',
    vendor: '그린팩',
    qty: 10,
    manager: '김사라',
    status: '검수중',
    time: '16:15:45',
  },
  {
    id: '20240416-004',
    center: '판교 테크노점',
    item: '무라벨 생수 500ml',
    vendor: '삼다수',
    qty: 120,
    manager: '이우경',
    status: '승인완료',
    time: '15:50:12',
  },
  {
    id: '20240416-005',
    center: '부산 중앙창고',
    item: '질소 포장 디저트 박스',
    vendor: '하림',
    qty: -1200,
    manager: '이선엽',
    status: '이동중',
    time: '15:20:30',
  },
]

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)

const activeTopMenu = computed(() => '대시보드')

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
    <div class="space-y-5">
      <section class="flex min-h-[88px] flex-wrap items-center justify-between gap-4 border border-gray-300 bg-white px-5 py-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Grid2X2 :size="17" stroke-width="2" />
            실시간 요약
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
            데이터 기준: {{ dateLabel }}
          </span>
          <span class="inline-flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Clock :size="12" />
            실시간 갱신 중
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" class="inline-flex h-11 items-center gap-2 border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Filter :size="15" />
            필터 설정
          </button>
          <button type="button" class="inline-flex h-11 items-center gap-2 border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download :size="15" />
            CSV 추출
          </button>
          <button type="button" class="inline-flex h-11 items-center gap-2 border border-[#1f4b3a] bg-[#1f4b3a] px-4 text-sm font-semibold text-white hover:bg-[#17392c]">
            <PlusCircle :size="15" />
            긴급 재고 생성
          </button>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <article v-for="stat in kpiStats" :key="stat.label" class="min-h-[106px] border border-gray-300 bg-white px-4 py-4 shadow-sm">
          <p class="text-[11px] font-medium text-gray-500">{{ stat.label }}</p>
          <div class="mt-5 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <span class="text-[28px] font-medium leading-none tracking-tight text-gray-950">{{ stat.value }}</span>
              <span v-if="stat.unit" class="ml-0.5 text-xs font-medium text-gray-500">{{ stat.unit }}</span>
            </div>
            <span
              class="pb-0.5 text-[11px] font-medium"
              :class="{
                'text-emerald-700': stat.status === 'up',
                'text-red-600': stat.status === 'down',
                'text-gray-400': stat.status === 'neutral',
              }"
            >
              <span v-if="stat.status === 'up'">↗</span>
              <span v-else-if="stat.status === 'down'">↘</span>
              {{ stat.change }}
            </span>
          </div>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(320px,1fr)]">
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex h-14 items-center justify-between border-b border-gray-200 px-5">
            <h3 class="inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.04em] text-gray-800">
              <BarChart3 :size="15" />
              전사 입출고 트렌드 분석 (7D)
            </h3>
            <div class="flex items-center gap-4 text-[11px] text-gray-500">
              <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 bg-[#1f4b3a]" />출고</span>
              <span class="inline-flex items-center gap-1.5"><i class="h-2.5 w-2.5 border border-gray-400 bg-gray-200" />입고</span>
            </div>
          </div>

          <div class="h-[300px] px-5 py-5">
            <div class="flex h-full items-end border-l border-b border-gray-200 px-5 pb-7">
              <div v-for="(height, index) in chartHeights" :key="index" class="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div class="flex h-full w-full items-end justify-center gap-2">
                  <div class="w-[22px] bg-[#1f4b3a]" :style="{ height: `${height}%` }" />
                  <div class="w-[22px] bg-gray-200" :style="{ height: `${height * 0.7}%` }" />
                </div>
                <span class="text-[11px] font-medium text-gray-400">04/{{ 10 + index }}</span>
              </div>
            </div>
          </div>
        </article>

        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex h-14 items-center border-b border-gray-200 px-5">
            <h3 class="inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.04em] text-gray-800">
              <AlertCircle :size="15" class="text-red-600" />
              긴급 장애/경보
            </h3>
          </div>

          <div class="divide-y divide-gray-100">
            <button v-for="alert in alerts" :key="alert.msg" type="button" class="flex min-h-[84px] w-full gap-3 px-5 py-5 text-left hover:bg-gray-50">
              <AlertCircle :size="14" class="mt-0.5 shrink-0 text-red-600" />
              <span class="min-w-0">
                <span class="block text-xs font-medium text-gray-800">{{ alert.msg }}</span>
                <span class="mt-2 block text-[11px] font-medium text-gray-400">{{ alert.type }} · {{ alert.time }}</span>
              </span>
            </button>
          </div>

          <button type="button" class="h-14 w-full border-t border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
            관제 센터 바로가기
          </button>
        </article>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div class="flex items-center gap-1">
            <h3 class="text-[13px] font-medium tracking-[0.08em] text-gray-800">최근 물류 트랜잭션 (REAL-TIME LOG)</h3>
            <span class="bg-gray-950 px-1.5 py-0.5 text-[9px] font-semibold text-white">LIVE</span>
          </div>

          <div class="flex items-center gap-4 text-xs font-medium text-gray-600">
            <label class="inline-flex items-center gap-1.5">
              <input type="checkbox" checked readonly class="h-3.5 w-3.5 accent-[#1f4b3a]" />
              <span>자동 갱신</span>
            </label>
            <button type="button" class="inline-flex items-center gap-1 text-[#1f4b3a]">
              모든 트랜잭션 조회
              <ExternalLink :size="12" />
            </button>
          </div>
        </div>

        <div class="overflow-auto">
          <table class="w-full min-w-[980px] border-collapse text-sm">
            <thead class="bg-gray-100 text-xs text-gray-500">
              <tr>
                <th class="border-b border-r border-gray-200 px-4 py-4 text-left font-medium">트랜잭션 ID</th>
                <th class="border-b border-r border-gray-200 px-4 py-4 text-left font-medium">물류 거점</th>
                <th class="border-b border-r border-gray-200 px-4 py-4 text-left font-medium">품목 정보</th>
                <th class="border-b border-r border-gray-200 px-4 py-4 text-left font-medium">거래처</th>
                <th class="border-b border-r border-gray-200 px-4 py-4 text-right font-medium">수량</th>
                <th class="border-b border-r border-gray-200 px-4 py-4 text-left font-medium">담당자</th>
                <th class="border-b border-r border-gray-200 px-4 py-4 text-left font-medium">승인 상태</th>
                <th class="border-b border-gray-200 px-4 py-4 text-left font-medium">발생 시각</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in logisticsData" :key="row.id" class="hover:bg-gray-50">
                <td class="border-b border-r border-gray-100 px-4 py-4 font-medium text-gray-400">{{ row.id }}</td>
                <td class="border-b border-r border-gray-100 px-4 py-4 font-medium text-gray-800">{{ row.center }}</td>
                <td class="border-b border-r border-gray-100 px-4 py-4 text-gray-700">{{ row.item }}</td>
                <td class="border-b border-r border-gray-100 px-4 py-4 text-gray-600">{{ row.vendor }}</td>
                <td
                  class="border-b border-r border-gray-100 px-4 py-4 text-right font-medium"
                  :class="row.qty > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
                >
                  {{ row.qty > 0 ? `+${row.qty.toLocaleString()}` : row.qty.toLocaleString() }}
                </td>
                <td class="border-b border-r border-gray-100 px-4 py-4 text-gray-600">{{ row.manager }}</td>
                <td class="border-b border-r border-gray-100 px-4 py-4">
                  <span
                    class="inline-flex items-center gap-1.5 font-medium"
                    :class="{
                      'text-emerald-700': row.status === '승인완료',
                      'text-amber-700': row.status === '출고대기',
                      'text-[#1f4b3a]': row.status === '이동중',
                      'text-gray-600': row.status === '검수중',
                    }"
                  >
                    <CheckCircle2 v-if="row.status === '승인완료'" :size="13" />
                    <Clock v-else :size="13" />
                    {{ row.status }}
                  </span>
                </td>
                <td class="border-b border-gray-100 px-4 py-4 font-medium text-gray-400">{{ row.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </AppLayout>
</template>


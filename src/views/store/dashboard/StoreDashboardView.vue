<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const storeMenus = roleMenus.store
const sideMenus = roleMenus.store.find((menu) => menu.label === '대시보드')?.children ?? []
const activeSideMenu = ref('대시보드')

const kpiStats = [
  { label: '오늘 매출', value: '4,821,500', unit: '원', change: '+12.3%', status: 'up' },
  { label: '오늘 판매량', value: '138', unit: '건', change: '+8건', status: 'up' },
  { label: '재고 품목 수', value: '312', unit: '품목', change: '-5', status: 'down' },
  { label: '입고 예정', value: '4', unit: '건', change: '내일 2건 포함', status: 'neutral' },
  { label: '발주 건수', value: '9', unit: '건', change: '이번 주 총계', status: 'neutral' },
  { label: '처리 중 발주', value: '3', unit: '건', change: '승인대기 1건', status: 'neutral' },
]

const chartHeights = [48, 63, 55, 72, 58, 85, 78]

const recentSales = [
  { id: 'S-041', item: '오버사이즈 코튼 티셔츠 (화이트 / M)', qty: 2, price: 59800, status: '완료', time: '16:52:10' },
  { id: 'S-040', item: '슬림 데님 팬츠 (인디고 / 30)', qty: 1, price: 89000, status: '완료', time: '16:44:33' },
  { id: 'S-039', item: '린넨 블렌드 셔츠 (베이지 / L)', qty: 1, price: 72000, status: '완료', time: '16:31:05' },
  { id: 'S-038', item: '울 혼방 니트 가디건 (네이비 / S)', qty: 1, price: 118000, status: '완료', time: '16:18:47' },
  { id: 'S-037', item: '코튼 캔버스 토트백 (블랙)', qty: 3, price: 54000, status: '완료', time: '15:55:20' },
]

const stockAlerts = [
  { item: '슬림 데님 팬츠 — 28사이즈', stock: 2, threshold: 10, level: 'danger' },
  { item: '오버사이즈 코튼 티셔츠 — XS', stock: 5, threshold: 15, level: 'warning' },
  { item: '울 혼방 니트 가디건 — M', stock: 8, threshold: 20, level: 'warning' },
]

const orderStatuses = [
  { id: 'PO-2024-091', item: '오버사이즈 코튼 티셔츠 (S/M/L 각 30장)', qty: 90, status: '승인완료', date: '2024-04-16' },
  { id: 'PO-2024-090', item: '슬림 데님 팬츠 (28~34 혼합)', qty: 60, status: '입고대기', date: '2024-04-15' },
  { id: 'PO-2024-089', item: '린넨 블렌드 셔츠 (화이트/베이지 각 20장)', qty: 40, status: '검수중', date: '2024-04-15' },
]

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()),
)

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <AppLayout
    active-top-menu="대시보드"
    :top-menus="storeMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
  >
    <div class="flex flex-col gap-3">

      <!-- 헤더 -->
      <section class="flex flex-wrap items-center justify-between gap-3 border border-gray-300 bg-white px-3 py-2.5 shadow-sm">
        <div class="flex items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            대시보드
          </h2>
          <div class="flex gap-2">
            <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">기준: {{ dateLabel }}</span>
            <span class="inline-flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              실시간
            </span>
          </div>
        </div>
      </section>

      <!-- KPI 카드 -->
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

      <!-- 차트 + 재고 알림 -->
      <section class="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">

        <!-- 판매 트렌드 차트 -->
        <article class="border border-gray-300 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 20h18M7 16V8M12 16V4M17 16v-6"/>
              </svg>
              일별 판매 트렌드
            </h3>
            <div class="flex gap-3 text-[10px] font-medium text-gray-400">
              <span class="flex items-center gap-1"><i class="inline-block h-2 w-2 bg-[#004D3C]" />판매량</span>
              <span class="flex items-center gap-1"><i class="inline-block h-2 w-2 bg-gray-200" />매출</span>
            </div>
          </div>
          <div class="px-3 py-3">
            <div class="flex gap-2">
              <div class="flex h-[200px] w-8 shrink-0 flex-col justify-between pb-4 pt-2 text-right text-[10px] font-medium text-gray-400">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
              <div
                class="flex flex-1 items-end border-b border-l border-gray-200"
                style="height: 200px; padding: 10px 6px 16px 4px;"
              >
                <div
                  v-for="(height, index) in chartHeights"
                  :key="index"
                  class="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <div class="flex h-full w-full items-end justify-center gap-1">
                    <div class="w-4 rounded-sm bg-[#004D3C]" :style="{ height: `${height}%` }" />
                    <div class="w-4 rounded-sm bg-gray-200" :style="{ height: `${height * 0.65}%` }" />
                  </div>
                  <span class="text-[11px] font-medium text-gray-400">{{ 21 + index }}일</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <!-- 재고 부족 알림 -->
        <article class="flex flex-col border border-gray-300 bg-white shadow-sm">
          <div class="border-b border-gray-200 px-3 py-2.5">
            <h3 class="flex items-center gap-2 text-sm font-medium text-gray-800">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><path d="M12 16h.01"/>
              </svg>
              재고 부족 알림
            </h3>
          </div>
          <div class="flex-1 divide-y divide-gray-100">
            <div
              v-for="alert in stockAlerts"
              :key="alert.item"
              class="px-3 py-3"
            >
              <span class="block text-[13px] font-semibold text-gray-800">{{ alert.item }}</span>
              <div class="mt-1.5 flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    class="h-1.5 rounded-full transition-all"
                    :class="alert.level === 'danger' ? 'bg-red-500' : 'bg-orange-400'"
                    :style="{ width: `${Math.min((alert.stock / alert.threshold) * 100, 100)}%` }"
                  />
                </div>
                <span
                  class="shrink-0 text-[11px] font-bold"
                  :class="alert.level === 'danger' ? 'text-red-600' : 'text-orange-500'"
                >
                  {{ alert.stock }} / {{ alert.threshold }}
                </span>
              </div>
            </div>
            <div v-if="stockAlerts.length === 0" class="flex h-20 items-center justify-center">
              <p class="text-[11px] text-gray-400">부족 재고 없음</p>
            </div>
          </div>
          <button type="button" class="border-t border-gray-200 py-2.5 text-[12px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800" @click="$router.push('/store/inventory')">
            재고 관리 바로가기
          </button>
        </article>
      </section>

      <!-- 최근 판매 내역 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-medium text-gray-800">최근 판매 내역</h3>
            <span class="bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">LIVE</span>
          </div>
          <button type="button" class="text-xs font-semibold text-[#004D3C] hover:underline" @click="$router.push('/store/sales/register')">
            POS 바로가기
          </button>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[640px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">ID</th>
                <th class="px-3 py-2.5 text-left font-bold">품목</th>
                <th class="px-3 py-2.5 text-right font-bold">수량</th>
                <th class="px-3 py-2.5 text-right font-bold">금액</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
                <th class="px-3 py-2.5 text-left font-bold">시각</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="row in recentSales" :key="row.id" class="hover:bg-gray-50/50">
                <td class="px-3 py-2.5 font-mono text-gray-400">{{ row.id }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ row.item }}</td>
                <td class="px-3 py-2.5 text-right text-gray-700">{{ row.qty }}</td>
                <td class="px-3 py-2.5 text-right font-bold text-gray-800">₩{{ row.price.toLocaleString() }}</td>
                <td class="px-3 py-2.5">
                  <span class="bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{{ row.status }}</span>
                </td>
                <td class="px-3 py-2.5 text-gray-400">{{ row.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 발주 현황 -->
      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <h3 class="text-sm font-medium text-gray-800">발주 현황</h3>
          <button type="button" class="text-xs font-semibold text-[#004D3C] hover:underline" @click="$router.push('/store/orders/request')">
            발주 관리 바로가기
          </button>
        </div>
        <div class="overflow-auto">
          <table class="w-full min-w-[560px] text-[13px]">
            <thead class="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th class="px-3 py-2.5 text-left font-bold">발주번호</th>
                <th class="px-3 py-2.5 text-left font-bold">품목</th>
                <th class="px-3 py-2.5 text-right font-bold">수량</th>
                <th class="px-3 py-2.5 text-left font-bold">상태</th>
                <th class="px-3 py-2.5 text-left font-bold">발주일</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 border-t border-gray-200">
              <tr v-for="row in orderStatuses" :key="row.id" class="hover:bg-gray-50/50">
                <td class="px-3 py-2.5 font-mono text-gray-400">{{ row.id }}</td>
                <td class="px-3 py-2.5 font-semibold text-gray-800">{{ row.item }}</td>
                <td class="px-3 py-2.5 text-right text-gray-700">{{ row.qty.toLocaleString() }}</td>
                <td class="px-3 py-2.5">
                  <span
                    class="px-2 py-0.5 text-[11px] font-bold"
                    :class="{
                      'bg-emerald-100 text-emerald-700': row.status === '승인완료',
                      'bg-blue-100 text-blue-700': row.status === '입고대기',
                      'bg-orange-100 text-orange-700': row.status === '검수중',
                    }"
                  >{{ row.status }}</span>
                </td>
                <td class="px-3 py-2.5 text-gray-400">{{ row.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  </AppLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShoppingCart,
  Warehouse,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq
const sideMenus = roleMenus.hq.find((menu) => menu.label === '대시보드')?.children ?? []

const activeTopMenu = computed(() => '대시보드')
const activeSideMenu = ref('운영 현황')

const dateLabel = computed(() =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date()),
)

const kpiStats = [
  { label: '가용 재고율', value: '84.7', unit: '%', caption: '비가용 제외', tone: 'blue' },
  { label: '부족 재고', value: '18', unit: 'SKU', caption: '안전재고 이하', tone: 'red' },
  { label: '순환 재고 후보', value: '126', unit: '품목', caption: '전환 검토 필요', tone: 'lime' },
  { label: '발주 진행', value: '14', unit: '건', caption: '본사 거래처 발주', tone: 'gray' },
]

const inventoryRisks = [
  {
    item: '코튼 베이직 반팔 티셔츠',
    category: '상의 > 반팔',
    location: '이천 풀필먼트',
    status: '부족',
    stock: 74,
    safety: 90,
  },
  {
    item: '코튼 베이직 반팔 티셔츠',
    category: '상의 > 반팔',
    location: '부산 물류창고',
    status: '품절',
    stock: 0,
    safety: 70,
  },
  {
    item: '플리츠 롱스커트',
    category: '치마 > 롱스커트',
    location: '인천 제1창고',
    status: '부족',
    stock: 18,
    safety: 55,
  },
  {
    item: '라이트 숏 패딩',
    category: '아우터 > 패딩',
    location: '대전 허브창고',
    status: '품절',
    stock: 0,
    safety: 30,
  },
  {
    item: '오버핏 옥스포드 셔츠',
    category: '상의 > 셔츠',
    location: '인천 제1창고',
    status: '안전',
    stock: 490,
    safety: 130,
  },
]

const warehouseImbalances = [
  {
    item: '코튼 베이직 반팔 티셔츠',
    category: '상의 > 반팔',
    warehouses: [
      { warehouse: '인천 제1창고', stock: 398, safety: 120, status: '안전' },
      { warehouse: '이천 풀필먼트', stock: 74, safety: 90, status: '부족' },
      { warehouse: '부산 물류창고', stock: 0, safety: 70, status: '품절' },
      { warehouse: '대전 허브창고', stock: 132, safety: 80, status: '안전' },
    ],
  },
  {
    item: '플리츠 롱스커트',
    category: '치마 > 롱스커트',
    warehouses: [
      { warehouse: '인천 제1창고', stock: 18, safety: 55, status: '부족' },
      { warehouse: '이천 풀필먼트', stock: 0, safety: 45, status: '품절' },
      { warehouse: '부산 물류창고', stock: 58, safety: 50, status: '안전' },
      { warehouse: '대전 허브창고', stock: 32, safety: 50, status: '부족' },
    ],
  },
  {
    item: '라이트 숏 패딩',
    category: '아우터 > 패딩',
    warehouses: [
      { warehouse: '인천 제1창고', stock: 116, safety: 50, status: '안전' },
      { warehouse: '이천 풀필먼트', stock: 92, safety: 45, status: '안전' },
      { warehouse: '부산 물류창고', stock: 14, safety: 35, status: '부족' },
      { warehouse: '대전 허브창고', stock: 0, safety: 30, status: '품절' },
    ],
  },
  {
    item: '라이트 코튼 쇼츠',
    category: '바지 > 반바지',
    warehouses: [
      { warehouse: '인천 제1창고', stock: 98, safety: 80, status: '안전' },
      { warehouse: '이천 풀필먼트', stock: 39, safety: 65, status: '부족' },
      { warehouse: '부산 물류창고', stock: 296, safety: 90, status: '안전' },
      { warehouse: '대전 허브창고', stock: 64, safety: 60, status: '안전' },
    ],
  },
]

const currentImbalanceIndex = ref(0)

const currentWarehouseImbalance = computed(() => warehouseImbalances[currentImbalanceIndex.value])

const imbalancePositionLabel = computed(
  () => `${currentImbalanceIndex.value + 1} / ${warehouseImbalances.length}`,
)

const orderStatuses = [
  { label: '발주 요청', value: 36, color: 'bg-[#004D3C]' },
  { label: '창고 배정', value: 28, color: 'bg-[#7fb3a8]' },
  { label: '출고 준비', value: 18, color: 'bg-[#D6EAEA]' },
  { label: '배송 중', value: 12, color: 'bg-sky-200' },
]

const purchaseStatuses = [
  { label: '발주 요청', value: 14, color: 'bg-[#004D3C]' },
  { label: '거래처 확인', value: 9, color: 'bg-[#7fb3a8]' },
  { label: '입고 예정', value: 5, color: 'bg-[#D6EAEA]' },
]

const alerts = [
  {
    type: '매장 발주량 이상 감지',
    message: '성수 쇼룸 반팔 티셔츠 발주량 평균 대비 3배 초과',
    time: '8분 전',
  },
  {
    type: '창고 발주량 이상 알림',
    message: '이천 풀필먼트 플리츠 롱스커트 대량 발주 이상 감지',
    time: '21분 전',
  },
  {
    type: '매장 재고 부족 알림',
    message: '홍대 플래그십 후드티 안전재고 미달 보충 필요',
    time: '42분 전',
  },
  {
    type: '창고 재고 부족 알림',
    message: '부산 물류창고 라이트 숏 패딩 재고 부족',
    time: '1시간 전',
  },
]

function handleLogout() {
  auth.logout()
  router.push('/login')
}

const goTo = (path) => router.push(path)

const moveImbalance = (direction) => {
  currentImbalanceIndex.value =
    (currentImbalanceIndex.value + direction + warehouseImbalances.length) %
    warehouseImbalances.length
}

const statusBadgeClass = (status) =>
  ({
    안전: 'bg-[#EBF5F5] text-[#004D3C]',
    부족: 'bg-amber-50 text-amber-700',
    품절: 'bg-red-50 text-red-700',
  })[status] ?? 'bg-gray-50 text-gray-500'

const alertTypeBadgeClass = (type) =>
  ({
    '매장 발주량 이상 감지': 'bg-amber-50 text-amber-700',
    '창고 발주량 이상 알림': 'bg-orange-50 text-orange-700',
    '매장 재고 부족 알림': 'bg-red-50 text-red-700',
    '창고 재고 부족 알림': 'bg-rose-50 text-rose-700',
  })[type] ?? 'bg-gray-50 text-gray-500'
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
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              HQ Operation Dashboard
            </p>
            <h1 class="mt-1 text-xl font-black text-gray-950">중앙관리자 운영 현황t</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">
              전사 재고, 주문/발주, 알림을 한 화면에서 확인합니다.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="inline-flex h-8 items-center gap-1 border border-[#D6EAEA] bg-[#EBF5F5] px-3 text-[11px] font-black text-[#004D3C]"
            >
              <Clock :size="13" />
              {{ dateLabel }}
            </span>
            <span
              class="inline-flex h-8 items-center gap-1 border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-black text-emerald-700"
            >
              <CheckCircle2 :size="13" />
              실시간 모니터링
            </span>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article
          v-for="stat in kpiStats"
          :key="stat.label"
          class="border border-gray-200 bg-white p-3 shadow-sm"
        >
          <p class="text-[11px] font-bold text-gray-500">{{ stat.label }}</p>
          <div class="mt-3 flex items-end justify-between gap-2">
            <div class="min-w-0">
              <span class="text-2xl font-black text-gray-950">{{ stat.value }}</span>
              <span class="ml-1 text-xs font-black text-gray-400">{{ stat.unit }}</span>
            </div>
            <span
              class="h-2.5 w-2.5 shrink-0"
              :class="{
                'bg-[#004D3C]': stat.tone === 'green',
                'bg-sky-400': stat.tone === 'blue',
                'bg-red-400': stat.tone === 'red',
                'bg-orange-300': stat.tone === 'orange',
                'bg-lime-300': stat.tone === 'lime',
                'bg-gray-300': stat.tone === 'gray',
              }"
            />
          </div>
          <p class="mt-2 text-[11px] font-bold text-gray-400">{{ stat.caption }}</p>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <AlertTriangle :size="16" class="text-red-500" />
              전사 재고 위험
            </h2>
            <button
              type="button"
              class="text-xs font-black text-[#004D3C] hover:underline"
              @click="goTo('/hq/inventory/company-wide')"
            >
              전사 재고 조회
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[680px] text-left text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="px-4 py-3 font-black">품목</th>
                  <th class="px-4 py-3 font-black">카테고리</th>
                  <th class="px-4 py-3 font-black">위치</th>
                  <th class="px-4 py-3 text-right font-black">현재/안전</th>
                  <th class="px-4 py-3 font-black">상태</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr
                  v-for="item in inventoryRisks"
                  :key="`${item.item}-${item.location}`"
                  class="hover:bg-[#EBF5F5]/60"
                >
                  <td class="px-4 py-3 font-black text-gray-900">{{ item.item }}</td>
                  <td class="px-4 py-3 font-bold text-gray-500">{{ item.category }}</td>
                  <td class="px-4 py-3 font-bold text-gray-700">{{ item.location }}</td>
                  <td class="px-4 py-3 text-right font-black text-gray-900">
                    {{ item.stock }} / {{ item.safety }}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-1 text-[11px] font-black"
                      :class="statusBadgeClass(item.status)"
                      >{{ item.status }}</span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="border border-gray-200 bg-white shadow-sm">
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3"
          >
            <div class="flex min-w-0 items-center gap-2">
              <h2 class="inline-flex min-w-0 items-center gap-2 text-sm font-black text-gray-900">
                <Warehouse :size="16" class="shrink-0" />
                <span class="truncate">창고별 재고 불균형</span>
              </h2>
              <span class="shrink-0 text-[11px] font-black text-gray-400">{{
                imbalancePositionLabel
              }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 transition hover:border-[#004D3C] hover:text-[#004D3C]"
                aria-label="이전 불균형 품목"
                @click="moveImbalance(-1)"
              >
                <ChevronLeft :size="14" />
              </button>
              <button
                type="button"
                class="inline-flex h-7 w-7 items-center justify-center border border-gray-200 text-gray-500 transition hover:border-[#004D3C] hover:text-[#004D3C]"
                aria-label="다음 불균형 품목"
                @click="moveImbalance(1)"
              >
                <ChevronRight :size="14" />
              </button>
              <button
                type="button"
                class="ml-1 text-xs font-black text-[#004D3C] hover:underline"
                @click="goTo('/hq/inventory/warehouse-comparison')"
              >
                창고 비교
              </button>
            </div>
          </div>
          <div class="px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate font-black text-gray-900">
                  {{ currentWarehouseImbalance.item }}
                </p>
                <p class="mt-1 text-[11px] font-bold text-gray-400">
                  {{ currentWarehouseImbalance.category }}
                </p>
              </div>
            </div>
            <div class="h-4" aria-hidden="true" />

            <div class="grid gap-2 sm:grid-cols-2">
              <div
                v-for="warehouse in currentWarehouseImbalance.warehouses"
                :key="warehouse.warehouse"
                class="border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate text-[11px] font-black text-gray-900">
                    {{ warehouse.warehouse }}
                  </p>
                  <span
                    class="shrink-0 px-2 py-1 text-[10px] font-black"
                    :class="statusBadgeClass(warehouse.status)"
                  >
                    {{ warehouse.status }}
                  </span>
                </div>
                <div class="mt-2 flex items-end justify-between gap-2">
                  <span class="text-lg font-black text-gray-950">{{ warehouse.stock }}</span>
                  <span class="text-[11px] font-bold text-gray-400"
                    >/ {{ warehouse.safety }} EA</span
                  >
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article class="border border-gray-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <ShoppingCart :size="16" />
              매장 발주·거래처 발주 현황
            </h2>
            <div class="flex gap-2">
              <button
                type="button"
                class="text-xs font-black text-[#004D3C] hover:underline"
                @click="goTo('/hq/orders')"
              >
                매장 주문
              </button>
              <button
                type="button"
                class="text-xs font-black text-[#004D3C] hover:underline"
                @click="goTo('/hq/purchase-orders')"
              >
                거래처 발주
              </button>
            </div>
          </div>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p class="mb-3 text-[11px] font-black text-gray-500">매장 발주</p>
              <div class="space-y-3">
                <div v-for="status in orderStatuses" :key="status.label">
                  <div class="flex justify-between text-xs font-black text-gray-600">
                    <span>{{ status.label }}</span>
                    <span>{{ status.value }}건</span>
                  </div>
                  <div class="mt-1 h-7 bg-gray-100">
                    <div
                      class="h-full"
                      :class="status.color"
                      :style="{ width: `${Math.min(status.value, 80)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p class="mb-3 text-[11px] font-black text-gray-500">거래처 발주</p>
              <div class="space-y-3">
                <div v-for="status in purchaseStatuses" :key="status.label">
                  <div class="flex justify-between text-xs font-black text-gray-600">
                    <span>{{ status.label }}</span>
                    <span>{{ status.value }}건</span>
                  </div>
                  <div class="mt-1 h-7 bg-gray-100">
                    <div
                      class="h-full"
                      :class="status.color"
                      :style="{ width: `${Math.min(status.value, 80)}%` }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="border border-gray-200 bg-white shadow-sm">
          <div class="border-b border-gray-100 px-4 py-3">
            <h2 class="inline-flex items-center gap-2 text-sm font-black text-gray-900">
              <AlertTriangle :size="16" />
              알림 센터 요약
            </h2>
          </div>
          <div class="divide-y divide-gray-100">
            <div v-for="alert in alerts" :key="alert.message" class="px-4 py-3">
              <div class="flex items-center justify-between gap-2">
                <span
                  class="px-2 py-1 text-[11px] font-black"
                  :class="alertTypeBadgeClass(alert.type)"
                  >{{ alert.type }}</span
                >
                <span class="text-[11px] font-bold text-gray-400">{{ alert.time }}</span>
              </div>
              <p class="mt-2 text-xs font-black text-gray-900">{{ alert.message }}</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

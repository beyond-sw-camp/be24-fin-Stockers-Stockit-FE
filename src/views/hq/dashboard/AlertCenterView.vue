<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  Bell,
  CheckCheck,
  ChevronRight,
  Clock3,
  Package,
  Truck,
  Wallet,
} from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { dashboardSideMenus } from '@/views/hq/dashboard/dashboardMenus.js'

const router = useRouter()
const auth = useAuthStore()
const hqMenus = roleMenus.hq

const activeSideMenu = ref('알림 센터')
const sideMenus = dashboardSideMenus

const summaryStats = [
  { label: '미확인 알림', value: '14', note: '우선 확인 필요', tone: 'danger' },
  { label: '오늘 발생', value: '26', note: '방금 포함', tone: 'neutral' },
  { label: '긴급 알림', value: '4', note: '즉시 대응 필요', tone: 'danger' },
  { label: '처리 완료', value: '12', note: '오늘 기준', tone: 'done' },
]

const filterTabs = [
  { label: '전체', value: 'all' },
  { label: '재고', value: 'inventory' },
  { label: '배송', value: 'shipping' },
  { label: '입고', value: 'inbound' },
  { label: '정산', value: 'settlement' },
]

const activeFilter = ref('all')

const alerts = [
  { category: 'inventory', type: '재고', title: '성수 직영점 원두 품절 임박', detail: '안전재고 30EA 대비 현재고 8EA', meta: '성수 직영점 · 아메리카노 원두 1kg', time: '10분 전', status: '긴급', unread: true },
  { category: 'inbound', type: '입고', title: '부산 중앙창고 입고 지연', detail: '유리제 머그컵 350ml 납기 지연', meta: '부산 중앙창고 · 거래처 하림', time: '24분 전', status: '확인 필요', unread: true },
  { category: 'settlement', type: '정산', title: '판교점 POS 재고 불일치', detail: '실재고와 시스템 수량 차이 발생', meta: '판교 테크노점 · 마감 정산', time: '1시간 전', status: '조치 중', unread: true },
  { category: 'shipping', type: '배송', title: '인천 제2센터 출고 마감 임박', detail: '미처리 출고 3건 남음', meta: '인천 제2센터 · 출고 마감 30분 전', time: '1시간 전', status: '확인 필요', unread: false },
  { category: 'inventory', type: '재고', title: '강남 서초점 안전재고 하회', detail: '손세정제 리필 500ml 보충 필요', meta: '강남 서초점 · 부족분 26EA', time: '2시간 전', status: '조치 중', unread: false },
  { category: 'shipping', type: '배송', title: '용인 물류센터 상차 완료', detail: '성수 직영점 출고 건 2건 처리 완료', meta: '용인 물류센터 · 차량 12A', time: '2시간 전', status: '완료', unread: false },
]

const categoryIconMap = {
  inventory: Package,
  shipping: Truck,
  inbound: Truck,
  settlement: Wallet,
}

const filteredAlerts = computed(() =>
  activeFilter.value === 'all'
    ? alerts
    : alerts.filter((alert) => alert.category === activeFilter.value),
)

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
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="inline-flex items-center gap-2 text-[15px] font-semibold text-gray-900">
            <Bell :size="18" />
            알림 센터
          </h2>
          <span class="border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">기준: {{ dateLabel }}</span>
          <span class="inline-flex items-center gap-1 border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
            <Clock3 :size="12" />
            실시간 알림 추적
          </span>
        </div>
      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="border-b border-gray-200 px-3 py-2.5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="mr-2 text-sm font-medium text-gray-800">알림 필터</h3>
              <button
                v-for="tab in filterTabs"
                :key="tab.value"
                type="button"
                class="rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors"
                :class="
                  activeFilter === tab.value
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                "
                @click="activeFilter = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <div
                v-for="stat in summaryStats"
                :key="stat.label"
                class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1.5"
              >
                <CheckCheck v-if="stat.tone === 'done'" :size="12" class="text-emerald-600" />
                <AlertCircle v-else :size="12" :class="stat.tone === 'danger' ? 'text-red-600' : 'text-amber-600'" />
                <span class="text-[11px] font-medium text-gray-500">{{ stat.label }}</span>
                <span class="text-[12px] font-semibold text-gray-900">{{ stat.value }}</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      <section class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
          <div>
            <h3 class="text-sm font-medium text-gray-800">알림 목록</h3>
            <p class="mt-0.5 text-[11px] text-gray-400">최신순으로 누적 표시됩니다.</p>
          </div>
          <span class="text-[11px] font-medium text-gray-400">총 {{ filteredAlerts.length }}건</span>
        </div>
        <div class="divide-y divide-gray-100">
          <article
            v-for="item in filteredAlerts"
            :key="`${item.category}-${item.title}`"
            class="px-3 py-3 transition-colors hover:bg-gray-50"
          >
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-600">
                <component :is="categoryIconMap[item.category] ?? Bell" :size="16" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{{ item.type }}</span>
                  <span
                    v-if="item.unread"
                    class="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white"
                  >
                    미확인
                  </span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    :class="
                      item.status === '긴급'
                        ? 'bg-red-50 text-red-700'
                        : item.status === '확인 필요'
                          ? 'bg-amber-50 text-amber-700'
                          : item.status === '완료'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-700'
                    "
                  >
                    {{ item.status }}
                  </span>
                </div>
                <p class="mt-2 text-[14px] font-semibold text-gray-900">{{ item.title }}</p>
                <p class="mt-1 text-[12px] text-gray-600">{{ item.detail }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                  <span>{{ item.meta }}</span>
                  <span>{{ item.time }}</span>
                </div>
              </div>
              <button type="button" class="mt-0.5 shrink-0 text-gray-400 hover:text-gray-700">
                <ChevronRight :size="16" />
              </button>
            </div>
          </article>
          <div v-if="filteredAlerts.length === 0" class="px-3 py-10 text-center text-[12px] text-gray-400">
            선택한 필터의 알림이 없습니다.
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

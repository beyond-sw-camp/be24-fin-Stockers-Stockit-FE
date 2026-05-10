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

const router = useRouter()
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

const kpiStats = []

const inventoryRisks = []

const warehouseImbalances = []

const currentImbalanceIndex = ref(0)

const currentWarehouseImbalance = computed(() => warehouseImbalances[currentImbalanceIndex.value] ?? null)

const imbalancePositionLabel = computed(
  () => `${warehouseImbalances.length === 0 ? 0 : currentImbalanceIndex.value + 1} / ${warehouseImbalances.length}`,
)

const orderStatuses = []

const purchaseStatuses = []

const alerts = []


const goTo = (path) => router.push(path)

const moveImbalance = (direction) => {
  if (warehouseImbalances.length === 0) return
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
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              HQ Operation Dashboard
            </p>
            <h1 class="mt-1 text-xl font-black text-gray-950">중앙관리자 운영 현황</h1>
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
        <article
          v-if="kpiStats.length === 0"
          class="col-span-2 border border-gray-200 bg-white p-3 text-xs font-bold text-gray-400 lg:col-span-4"
        >
          표시할 운영 지표가 없습니다.
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
                <tr v-if="inventoryRisks.length === 0">
                  <td colspan="5" class="px-4 py-8 text-center text-xs font-bold text-gray-400">
                    재고 위험 데이터가 없습니다.
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
            <template v-if="currentWarehouseImbalance">
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
            </template>
            <p v-else class="py-8 text-center text-xs font-bold text-gray-400">
              창고 불균형 데이터가 없습니다.
            </p>
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
                <p v-if="orderStatuses.length === 0" class="py-6 text-center text-xs font-bold text-gray-400">
                  데이터가 없습니다.
                </p>
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
                <p v-if="purchaseStatuses.length === 0" class="py-6 text-center text-xs font-bold text-gray-400">
                  데이터가 없습니다.
                </p>
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
            <p v-if="alerts.length === 0" class="px-4 py-8 text-center text-xs font-bold text-gray-400">
              알림 데이터가 없습니다.
            </p>
          </div>
        </article>
      </section>
    </div>
  </AppLayout>
</template>

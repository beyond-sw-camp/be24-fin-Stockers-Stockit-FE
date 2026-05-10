<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Archive, BadgeCheck, Truck } from 'lucide-vue-next'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import {
  arriveWarehouseOutbound,
  confirmWarehouseOutbound,
  getWarehouseOutboundDetail,
} from '@/api/warehouse/outbound.js'
import { extractErrorMessage } from '@/api/axios.js'
import { formatDateTime } from '@/features/store/common/ui.js'

const route = useRoute()
const router = useRouter()

const activeSideMenu = ref('출고 관리')
const topMenus = roleMenus.warehouse
const sideMenus = roleMenus.warehouse.find((menu) => menu.label === '입/출고 관리')?.children ?? []

const outboundNo = computed(() => String(route.params.id || ''))
const outbound = ref(null)
const loading = ref(false)
const loadingAction = ref('')
const errorMessage = ref('')
const resultMessage = ref('')
const outboundSteps = [
  { key: 'READY_TO_SHIP', label: '출고 준비' },
  { key: 'IN_TRANSIT', label: '배송 중' },
  { key: 'ARRIVED', label: '배송 완료' },
]

function normalizeOutboundType(sourceType) {
  if (sourceType === 'STORE_ORDER' || sourceType === 'STORE_OUTBOUND') return 'STORE_OUTBOUND'
  if (sourceType === 'WAREHOUSE_TRANSFER' || sourceType === 'WH_TRANSFER') return 'WH_TRANSFER'
  if (sourceType === 'CIRCULAR_SALE') return 'CIRCULAR_SALE'
  return sourceType
}

function outboundTypeLabel(sourceType) {
  return (
    {
      STORE_OUTBOUND: '매장 출고',
      WH_TRANSFER: '창고간 이동',
      CIRCULAR_SALE: '순환재고 판매',
    }[normalizeOutboundType(sourceType)] ?? sourceType
  )
}

function statusClass(status) {
  return (
    {
      READY_TO_SHIP: 'bg-amber-50 text-amber-700',
      IN_TRANSIT: 'bg-blue-50 text-blue-700',
      ARRIVED: 'bg-emerald-50 text-emerald-700',
    }[status] ?? 'bg-gray-100 text-gray-600'
  )
}

function statusLabel(status) {
  return (
    {
      READY_TO_SHIP: '출고 준비중',
      IN_TRANSIT: '배송중',
      ARRIVED: '도착 완료',
    }[status] ?? status
  )
}

function timelineDotClass(status) {
  if (status === 'ARRIVED') return 'bg-emerald-500'
  if (status === 'IN_TRANSIT') return 'bg-blue-500'
  return 'bg-slate-400'
}

function stepState(stepKey) {
  const order = ['READY_TO_SHIP', 'IN_TRANSIT', 'ARRIVED']
  const currentIdx = order.indexOf(outbound.value?.status)
  const stepIdx = order.indexOf(stepKey)
  if (currentIdx < 0 || stepIdx < 0) return 'upcoming'
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'current'
  return 'upcoming'
}

function stepClass(stepKey) {
  const state = stepState(stepKey)
  if (state === 'done') return 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
  if (state === 'current') return 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
  return 'bg-slate-100 text-slate-400 border-slate-200'
}

function stepLabelClass(stepKey) {
  const state = stepState(stepKey)
  if (state === 'current') return 'text-blue-700'
  if (state === 'done') return 'text-emerald-700'
  return 'text-slate-500'
}

function connectorClass(leftStepKey) {
  const leftState = stepState(leftStepKey)
  if (leftState === 'done') return 'bg-emerald-400'
  if (leftState === 'current') return 'bg-blue-300'
  return 'bg-slate-200'
}

async function fetchDetail() {
  if (!outboundNo.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    outbound.value = await getWarehouseOutboundDetail(outboundNo.value)
  } catch (error) {
    outbound.value = null
    errorMessage.value = extractErrorMessage(error, '출고 상세 조회 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

async function confirmOutbound() {
  if (!outbound.value || outbound.value.status !== 'READY_TO_SHIP') return
  loadingAction.value = 'confirm'
  resultMessage.value = ''
  try {
    outbound.value = await confirmWarehouseOutbound(outbound.value.outboundNo)
    resultMessage.value = '출고확정이 완료되었습니다.'
  } catch (error) {
    resultMessage.value = extractErrorMessage(error, '출고확정 처리 중 오류가 발생했습니다.')
  } finally {
    loadingAction.value = ''
    await fetchDetail()
  }
}

async function arriveOutbound() {
  if (!outbound.value || outbound.value.status !== 'IN_TRANSIT') return
  loadingAction.value = 'arrive'
  resultMessage.value = ''
  try {
    outbound.value = await arriveWarehouseOutbound(outbound.value.outboundNo)
    resultMessage.value = '배송완료가 처리되었습니다.'
  } catch (error) {
    resultMessage.value = extractErrorMessage(error, '배송완료 처리 중 오류가 발생했습니다.')
  } finally {
    loadingAction.value = ''
    await fetchDetail()
  }
}

function goList() {
  router.push({ name: 'wh-outbound' })
}

onMounted(fetchDetail)
</script>

<template>
  <AppLayout
    active-top-menu="입/출고 관리"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <section class="flex items-center justify-between border border-gray-300 bg-white p-4 shadow-sm">
        <div>
          <p class="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">Warehouse Outbound Detail</p>
          <h1 class="mt-1 text-lg font-black text-gray-900">출고 상세</h1>
        </div>
        <button
          type="button"
          class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
          @click="goList"
        >
          목록으로
        </button>
      </section>

      <p v-if="errorMessage" class="border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700">
        {{ errorMessage }}
      </p>

      <section v-if="loading" class="border border-gray-300 bg-white px-4 py-10 text-center text-sm font-bold text-gray-500 shadow-sm">
        조회 중입니다.
      </section>

      <section v-else-if="!outbound" class="border border-gray-300 bg-white px-4 py-10 text-center text-sm font-bold text-gray-500 shadow-sm">
        출고 상세 데이터를 찾을 수 없습니다.
      </section>

      <template v-else>
        <section class="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <article class="border border-gray-300 bg-white p-4 shadow-sm">
            <div class="grid gap-3 md:grid-cols-2">
              <p class="text-xs font-bold text-gray-500">출고번호 <strong class="ml-2 text-gray-900">{{ outbound.outboundNo }}</strong></p>
              <p class="text-xs font-bold text-gray-500">원천번호 <strong class="ml-2 text-gray-900">{{ outbound.sourceRefNo }}</strong></p>
              <p class="text-xs font-bold text-gray-500">창고 <strong class="ml-2 text-gray-900">{{ outbound.warehouseName || '-' }}</strong></p>
              <p class="text-xs font-bold text-gray-500">
                목적지
                <strong class="ml-2 text-gray-900">
                  {{ outbound.destinationName || `${outbound.destinationType || '-'}${outbound.destinationId ? ` (${outbound.destinationId})` : ''}` }}
                </strong>
              </p>
              <p class="text-xs font-bold text-gray-500">유형 <strong class="ml-2 text-gray-900">{{ outboundTypeLabel(outbound.sourceType) }}</strong></p>
              <p class="text-xs font-bold text-gray-500">요청일시 <strong class="ml-2 text-gray-900">{{ formatDateTime(outbound.requestedAt) }}</strong></p>
            </div>
            <div class="overflow-auto" style="margin-top: 16px;">
              <table class="w-full min-w-[760px] table-fixed border-collapse text-xs">
                <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th class="w-36 px-3 py-2 text-left font-black">상품코드</th>
                    <th class="w-44 px-3 py-2 text-left font-black">상품명</th>
                    <th class="w-28 px-3 py-2 text-left font-black">옵션</th>
                    <th class="w-28 px-3 py-2 text-left font-black">카테고리</th>
                    <th class="w-20 px-3 py-2 text-right font-black">요청수량</th>
                    <th class="w-20 px-3 py-2 text-right font-black">단가</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in outbound.items || []" :key="item.id || item.skuCode" class="hover:bg-gray-50">
                    <td class="px-3 py-3 font-bold text-gray-600">{{ item.productCode || item.itemCode || '-' }}</td>
                    <td class="px-3 py-3 font-black text-gray-900">{{ item.productName }}</td>
                    <td class="px-3 py-3 font-bold text-gray-600">{{ item.color }} / {{ item.size }}</td>
                    <td class="px-3 py-3 font-bold text-gray-600">{{ item.mainCategory }} > {{ item.subCategory }}</td>
                    <td class="px-3 py-3 text-right font-black text-gray-700">{{ item.requestedQuantity }}</td>
                    <td class="px-3 py-3 text-right font-black text-gray-700">₩{{ Number(item.unitPrice || 0).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article class="flex flex-col gap-3">
            <section class="border border-gray-200 bg-white p-4 shadow-sm">
              <div class="flex items-center justify-between gap-2">
                <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">배송 흐름</p>
                <span class="inline-flex px-2 py-1 text-[11px] font-black" :class="statusClass(outbound.status)">
                  {{ statusLabel(outbound.status) }}
                </span>
              </div>
              <div class="rounded-lg border border-slate-100 bg-slate-50 p-3" style="margin-top: 8px;">
                <ol class="flex items-start justify-between gap-1">
                  <li
                    v-for="(step, idx) in outboundSteps"
                    :key="step.key"
                    class="relative flex min-w-0 flex-1 flex-col items-center"
                  >
                    <div
                      class="z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all"
                      :class="stepClass(step.key)"
                    >
                      <Archive v-if="step.key === 'READY_TO_SHIP'" class="h-5 w-5" />
                      <Truck v-else-if="step.key === 'IN_TRANSIT'" class="h-5 w-5" />
                      <BadgeCheck v-else class="h-5 w-5" />
                    </div>
                    <p class="mt-2 text-center text-[11px] font-black" :class="stepLabelClass(step.key)">
                      {{ step.label }}
                    </p>
                    <span
                      v-if="idx < outboundSteps.length - 1"
                      class="absolute left-[calc(50%+22px)] top-[22px] h-[3px] w-[calc(100%-44px)] rounded-full"
                      :class="connectorClass(step.key)"
                    />
                  </li>
                </ol>
              </div>
            </section>

            <section class="border border-gray-200 bg-white p-4 shadow-sm">
              <h2 class="text-sm font-black text-gray-900">출고 진행 이력</h2>
              <ol style="margin-top: 8px;">
                <li
                  v-for="(history, index) in outbound.statusHistory || []"
                  :key="`${history.changedAt}-${index}`"
                  class="relative pb-3 pl-5 last:pb-0"
                >
                  <span class="absolute left-0 top-1 block h-2.5 w-2.5" :class="timelineDotClass(history.status)" />
                  <span v-if="index < (outbound.statusHistory || []).length - 1" class="absolute bottom-0 left-[4px] top-3.5 w-px bg-gray-300" />
                  <p class="text-[11px] font-black text-slate-700">{{ statusLabel(history.status) }}</p>
                  <p class="text-[10px] text-gray-500">{{ formatDateTime(history.changedAt) }} · {{ history.changedByName || '-' }}</p>
                </li>
              </ol>
            </section>

            <section class="border border-gray-200 bg-white p-4 shadow-sm">
              <h2 class="text-sm font-black text-gray-900">출고 처리</h2>
              <div class="space-y-4" style="margin-top: 8px;">
                <button
                  type="button"
                  class="w-full border border-[#004D3C] bg-[#004D3C] px-3 py-2.5 text-[11px] font-black text-white hover:bg-[#1f4b3a] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                  :disabled="outbound.status !== 'READY_TO_SHIP' || loadingAction !== ''"
                  @click="confirmOutbound"
                >
                  {{ loadingAction === 'confirm' ? '처리 중...' : '출고확정' }}
                </button>
                <button
                  type="button"
                  class="w-full border border-[#0E4F8A] bg-[#0E4F8A] px-3 py-2.5 text-[11px] font-black text-white hover:bg-[#0b3f6d] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                  style="margin-top: 12px;"
                  :disabled="outbound.status !== 'IN_TRANSIT' || loadingAction !== ''"
                  @click="arriveOutbound"
                >
                  {{ loadingAction === 'arrive' ? '처리 중...' : '배송완료' }}
                </button>
                <p v-if="resultMessage" class="border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">
                  {{ resultMessage }}
                </p>
              </div>
            </section>
          </article>
        </section>
      </template>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
              <p class="text-xs font-bold text-gray-500">유형 <strong class="ml-2 text-gray-900">{{ outbound.sourceType }}</strong></p>
              <p class="text-xs font-bold text-gray-500">요청일시 <strong class="ml-2 text-gray-900">{{ formatDateTime(outbound.requestedAt) }}</strong></p>
            </div>
            <div class="mt-4 overflow-auto">
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

          <article class="border border-gray-300 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-sm font-black text-gray-900">출고 진행 이력</h2>
              <span class="inline-flex px-2 py-1 text-[11px] font-black" :class="statusClass(outbound.status)">
                {{ statusLabel(outbound.status) }}
              </span>
            </div>
            <ol class="mt-3 space-y-2">
              <li
                v-for="(history, index) in outbound.statusHistory || []"
                :key="`${history.changedAt}-${index}`"
                class="border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <p class="text-xs font-black text-gray-800">{{ statusLabel(history.status) }}</p>
                <p class="mt-1 text-[11px] font-bold text-gray-500">{{ formatDateTime(history.changedAt) }} · {{ history.changedByName || '-' }}</p>
                <p class="mt-1 text-[11px] text-gray-500">{{ history.reason || '-' }}</p>
              </li>
            </ol>

            <div class="mt-4 space-y-2 border-t border-gray-200 pt-4">
              <h2 class="text-sm font-black text-gray-900">출고 처리</h2>
              <button
                type="button"
                class="w-full border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-xs font-black text-white hover:bg-[#1f4b3a] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                :disabled="outbound.status !== 'READY_TO_SHIP' || loadingAction !== ''"
                @click="confirmOutbound"
              >
                {{ loadingAction === 'confirm' ? '처리 중...' : '출고확정' }}
              </button>
              <button
                type="button"
                class="w-full border border-[#0E4F8A] bg-[#0E4F8A] px-3 py-2 text-xs font-black text-white hover:bg-[#0b3f6d] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                :disabled="outbound.status !== 'IN_TRANSIT' || loadingAction !== ''"
                @click="arriveOutbound"
              >
                {{ loadingAction === 'arrive' ? '처리 중...' : '배송완료' }}
              </button>
              <p v-if="resultMessage" class="text-[11px] font-bold text-[#004D3C]">
                {{ resultMessage }}
              </p>
            </div>
          </article>
        </section>
      </template>
    </div>
  </AppLayout>
</template>

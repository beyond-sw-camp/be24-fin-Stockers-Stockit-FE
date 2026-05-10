<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import {
  confirmStoreInbound,
  getStoreInboundDetail,
} from '@/api/store/inbound.js'
import { extractErrorMessage } from '@/api/axios.js'
import { formatDateTime } from '@/features/store/common/ui.js'

const route = useRoute()
const router = useRouter()

const storeMenus = roleMenus.store
const inboundMenus = roleMenus.store.find((menu) => menu.label === '입고 관리')?.children ?? []
const activeTopMenu = computed(() => '입고 관리')
const activeSideMenu = ref('입고 리스트')

const inboundNo = computed(() => String(route.params.id ?? ''))
const inbound = ref(null)
const loading = ref(false)
const loadingAction = ref(false)
const showConfirmModal = ref(false)
const toastMessage = ref('')
const errorMessage = ref('')

const canConfirmInbound = computed(() => inbound.value?.status === 'PENDING_RECEIPT')

function inboundStatusClass(status) {
  return {
    PENDING_RECEIPT: 'bg-amber-100 text-amber-700',
    RECEIVED: 'bg-[#EBF5F5] text-black',
  }[status] ?? 'bg-gray-100 text-gray-600'
}

function inboundStatusLabel(status) {
  return {
    PENDING_RECEIPT: '입고 대기',
    RECEIVED: '입고 완료',
  }[status] ?? status
}

async function fetchDetail() {
  if (!inboundNo.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    inbound.value = await getStoreInboundDetail(inboundNo.value)
  } catch (error) {
    inbound.value = null
    errorMessage.value = extractErrorMessage(error, '입고 상세 조회 중 오류가 발생했습니다.')
  } finally {
    loading.value = false
  }
}

function openConfirmModal() {
  if (!canConfirmInbound.value || loadingAction.value) return
  showConfirmModal.value = true
}

async function confirmInbound() {
  if (!inbound.value) return
  loadingAction.value = true
  toastMessage.value = ''
  try {
    inbound.value = await confirmStoreInbound(inbound.value.inboundNo)
    toastMessage.value = '입고 확정이 완료되었습니다.'
  } catch (error) {
    toastMessage.value = extractErrorMessage(error, '입고 확정 처리 중 오류가 발생했습니다.')
  } finally {
    loadingAction.value = false
    showConfirmModal.value = false
    await fetchDetail()
  }
}

onMounted(fetchDetail)
</script>

<template>
  <AppLayout
    :active-top-menu="activeTopMenu"
    :top-menus="storeMenus"
    :side-menus="inboundMenus"
    v-model:active-side-menu="activeSideMenu"
  >
    <div class="flex flex-col gap-4">
      <section class="border border-gray-300 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Store Inbound</p>
            <h1 class="mt-1 text-lg font-black text-gray-900">입고 상세</h1>
            <p class="mt-1 text-xs font-bold text-gray-500">입고 상태와 품목을 확인하고 입고 확정을 처리합니다.</p>
          </div>
          <button
            type="button"
            class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="router.push({ name: 'store-inbound-list' })"
          >
            목록으로
          </button>
        </div>
      </section>

      <p v-if="errorMessage" class="border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700">
        {{ errorMessage }}
      </p>

      <section v-if="loading" class="border border-gray-300 bg-white px-6 py-16 text-center text-sm font-bold text-gray-400 shadow-sm">
        조회 중입니다.
      </section>

      <section v-else-if="inbound" class="border border-gray-300 bg-white shadow-sm">
        <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h2 class="text-sm font-black text-gray-900">{{ inbound.inboundNo }}</h2>
            <p class="mt-1 text-[11px] font-bold text-gray-400">{{ formatDateTime(inbound.requestedAt) }}</p>
          </div>
          <span class="inline-flex px-2 py-1 text-[10px] font-black" :class="inboundStatusClass(inbound.status)">
            {{ inboundStatusLabel(inbound.status) }}
          </span>
        </div>

        <div class="flex flex-col gap-4 p-4">
          <section class="grid gap-3 sm:grid-cols-2">
            <div class="border border-gray-200 bg-gray-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">원천번호</p>
              <p class="mt-1 text-sm font-black text-gray-900">{{ inbound.sourceRefNo }}</p>
            </div>
            <div class="border border-gray-200 bg-gray-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">연계 출고번호</p>
              <p class="mt-1 text-sm font-black text-gray-900">{{ inbound.outboundNo || '-' }}</p>
            </div>
            <div class="border border-gray-200 bg-gray-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">예정수량</p>
              <p class="mt-1 text-sm font-black text-gray-900">{{ inbound.totalExpectedQuantity || 0 }}</p>
            </div>
            <div class="border border-gray-200 bg-gray-50 px-3 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">입고확정일시</p>
              <p class="mt-1 text-sm font-black text-gray-900">{{ formatDateTime(inbound.receivedAt) }}</p>
            </div>
          </section>

          <section class="min-w-0">
            <table class="w-full table-fixed border-collapse text-xs">
              <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                <tr>
                  <th class="w-[18%] px-3 py-2.5 text-left font-black">상품코드</th>
                  <th class="w-[20%] px-2 py-2.5 text-left font-black">상품명</th>
                  <th class="w-[17%] px-2 py-2.5 text-left font-black">옵션</th>
                  <th class="w-[18%] px-2 py-2.5 text-left font-black">카테고리</th>
                  <th class="w-[12%] px-2 py-2.5 text-center font-black">예정수량</th>
                  <th class="w-[15%] px-2 py-2.5 text-right font-black">단가</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in inbound.items || []" :key="item.id || item.skuCode">
                  <td class="px-3 py-2.5 font-mono font-bold text-gray-500">{{ item.productCode || item.skuCode }}</td>
                  <td class="px-2 py-2.5">
                    <p class="truncate font-black text-gray-900">{{ item.productName }}</p>
                  </td>
                  <td class="px-2 py-2.5 font-bold text-gray-700">{{ item.color }} / {{ item.size }}</td>
                  <td class="px-2 py-2.5 font-bold text-gray-500">{{ item.mainCategory }} &gt; {{ item.subCategory }}</td>
                  <td class="px-3 py-2.5 text-center font-black text-gray-900">{{ item.expectedQuantity }}</td>
                  <td class="px-3 py-2.5 text-right font-black text-gray-900">₩{{ Number(item.unitPrice || 0).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="w-full">
            <p class="mb-2 text-[10px] font-black uppercase text-gray-400">입고 진행 이력</p>
            <ol class="ml-2 border border-gray-200 bg-white px-4 py-4">
              <li v-for="(history, index) in inbound.statusHistory || []" :key="`${history.id || history.changedAt}-${index}`" class="relative pb-3 pl-5 last:pb-0">
                <span class="absolute left-0 top-1 block h-2.5 w-2.5 bg-slate-500" />
                <span v-if="index < (inbound.statusHistory || []).length - 1" class="absolute bottom-0 left-[4px] top-3.5 w-px bg-gray-300" />
                <p class="text-[11px] font-black text-slate-700">{{ inboundStatusLabel(history.status) }}</p>
                <p class="text-[10px] text-gray-500">{{ formatDateTime(history.changedAt) }} · {{ history.changedByName || '-' }}</p>
                <p v-if="history.reason" class="text-[10px] text-gray-400">{{ history.reason }}</p>
              </li>
            </ol>
          </section>

          <div class="w-full space-y-3">
            <button
              v-if="canConfirmInbound"
              type="button"
              class="w-full border border-[#004D3C] bg-[#004D3C] px-3 py-2.5 text-[11px] font-black text-white hover:bg-[#003d30] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300"
              :disabled="loadingAction"
              @click="openConfirmModal"
            >
              입고 확정
            </button>
            <p v-else class="border border-gray-200 bg-gray-50 px-3 py-3 text-center text-xs font-bold text-gray-500">
              입고 대기 상태에서만 입고 확정이 가능합니다.
            </p>

            <p v-if="toastMessage" class="border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">
              {{ toastMessage }}
            </p>
          </div>
        </div>
      </section>

      <section v-else class="border border-gray-300 bg-white px-6 py-16 text-center text-sm font-bold text-gray-400 shadow-sm">
        입고 상세 정보를 찾을 수 없습니다.
      </section>

      <div v-if="showConfirmModal && inbound" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showConfirmModal = false">
        <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
          <div class="bg-[#004D3C] px-5 py-3 text-white">
            <h2 class="text-sm font-black">입고 확정</h2>
          </div>
          <div class="space-y-3 p-5 text-xs text-gray-700">
            <p><strong>{{ inbound.inboundNo }}</strong> 건을 입고 확정합니다.</p>
            <p>확정 후 상태가 <strong>입고 완료</strong>로 변경됩니다.</p>
          </div>
          <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
            <button type="button" class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100" @click="showConfirmModal = false">
              취소
            </button>
            <button type="button" class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#003d30]" :disabled="loadingAction" @click="confirmInbound">
              {{ loadingAction ? '처리 중...' : '입고 확정' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/common/AppLayout.vue'
import { roleMenus } from '@/config/roleMenus.js'
import { useAuthStore } from '@/stores/auth.js'
import { useWarehouseOutboundStore } from '@/stores/warehouse/warehouseOutbound.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const outboundStore = useWarehouseOutboundStore()

const activeSideMenu = ref('출고 관리')
const topMenus = roleMenus.warehouse
const sideMenus = roleMenus.warehouse.find((menu) => menu.label === '입/출고 관리')?.children ?? []
const resultMessage = ref('')

const outboundId = computed(() => String(route.params.id || ''))
const outbound = computed(() => outboundStore.getOutboundById(outboundId.value))

function handleLogout() {
  auth.logout()
  router.push('/login')
}

function goList() {
  router.push({ name: 'wh-outbound' })
}

function statusClass(status) {
  return (
    {
      READY_TO_SHIP: 'bg-amber-50 text-amber-700',
      IN_TRANSIT: 'bg-blue-50 text-blue-700',
      COMPLETED: 'bg-emerald-50 text-emerald-700',
    }[status] ?? 'bg-gray-100 text-gray-600'
  )
}

function formatDate(iso) {
  if (!iso) return '-'
  return iso.replace('T', ' ').slice(0, 16)
}

function statusLabel(status) {
  return outboundStore.outboundStatusLabelMap[status] ?? status
}

function historyStatusLabel(history) {
  if (history.originalStatus === 'ARRIVED') return '매장 도착'
  if (history.originalStatus === 'RECEIVED') return '입고 완료'
  return statusLabel(history.status)
}

function confirmOutbound() {
  if (!outbound.value) return
  const actor = auth.user?.storeName || '서울 1센터'
  const result = outboundStore.confirmOutbound(outbound.value.outboundId, actor)
  resultMessage.value = result.success ? '출고 확정 처리되어 배송중으로 전환되었습니다.' : result.message
}
</script>

<template>
  <AppLayout
    active-top-menu="입/출고 관리"
    :top-menus="topMenus"
    :side-menus="sideMenus"
    v-model:active-side-menu="activeSideMenu"
    @logout="handleLogout"
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

      <section v-if="!outbound" class="border border-gray-300 bg-white px-4 py-10 text-center text-sm font-bold text-gray-500 shadow-sm">
        출고 상세 데이터를 찾을 수 없습니다.
      </section>

      <template v-else>
        <section class="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <article class="border border-gray-300 bg-white p-4 shadow-sm">
            <div class="grid gap-3 md:grid-cols-2">
              <p class="text-xs font-bold text-gray-500">출고번호 <strong class="ml-2 text-gray-900">{{ outbound.outboundId }}</strong></p>
              <p class="text-xs font-bold text-gray-500">발주번호 <strong class="ml-2 text-gray-900">{{ outbound.orderId }}</strong></p>
              <p class="text-xs font-bold text-gray-500">출고처 <strong class="ml-2 text-gray-900">{{ outbound.sourceName }}</strong></p>
              <p class="text-xs font-bold text-gray-500">목적지 <strong class="ml-2 text-gray-900">{{ outbound.targetName }}</strong></p>
              <p class="text-xs font-bold text-gray-500">출고유형 <strong class="ml-2 text-gray-900">{{ outboundStore.outboundTypeLabelMap[outbound.outboundType] }}</strong></p>
              <p class="text-xs font-bold text-gray-500">요청일시 <strong class="ml-2 text-gray-900">{{ formatDate(outbound.requestedAt) }}</strong></p>
            </div>
            <div class="mt-4 overflow-auto">
              <table class="w-full min-w-[760px] table-fixed border-collapse text-xs">
                <thead class="bg-gray-100 text-[10px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th class="w-36 px-3 py-2 text-left font-black">품목코드</th>
                    <th class="w-44 px-3 py-2 text-left font-black">상품명</th>
                    <th class="w-28 px-3 py-2 text-left font-black">옵션</th>
                    <th class="w-28 px-3 py-2 text-left font-black">카테고리</th>
                    <th class="w-20 px-3 py-2 text-right font-black">요청수량</th>
                    <th class="w-20 px-3 py-2 text-right font-black">단가</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in outbound.items" :key="item.skuId" class="hover:bg-gray-50">
                    <td class="px-3 py-3 font-bold text-gray-600">{{ item.itemCode }}</td>
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
                {{ outboundStore.outboundStatusLabelMap[outbound.status] }}
              </span>
            </div>
            <ol class="mt-3 space-y-2">
              <li
                v-for="(history, index) in outbound.outboundStatusHistory"
                :key="`${history.at}-${index}`"
                class="border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <p class="text-xs font-black text-gray-800">{{ historyStatusLabel(history) }}</p>
                <p class="mt-1 text-[11px] font-bold text-gray-500">{{ formatDate(history.at) }} · {{ history.byName }}</p>
                <p class="mt-1 text-[11px] text-gray-500">{{ history.note }}</p>
              </li>
            </ol>

            <div class="mt-4 space-y-2 border-t border-gray-200 pt-4">
              <h2 class="text-sm font-black text-gray-900">출고 처리</h2>
              <button
                type="button"
                class="w-full border border-[#004D3C] bg-[#004D3C] px-3 py-2 text-xs font-black text-white hover:bg-[#1f4b3a] disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-200 disabled:text-gray-500"
                :disabled="outbound.status !== 'READY_TO_SHIP' || !outbound.actionable"
                @click="confirmOutbound"
              >
                출고확정
              </button>
              <p v-if="outbound.actionable" class="text-[11px] font-bold text-gray-500">
                출고확정 시 상태가 배송중으로 변경됩니다. 완료 상태는 매장 입고 확정 후 자동 반영됩니다.
              </p>
              <p v-else class="text-[11px] font-bold text-gray-500">
                {{ outboundStore.outboundTypeLabelMap[outbound.outboundType] }} 유형은 현재 조회 전용입니다.
              </p>
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

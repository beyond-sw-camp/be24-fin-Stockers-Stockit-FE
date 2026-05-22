<script setup>
// 창고 입고 우측 상세 패널.
// inboundType 분기 — PURCHASE_ORDER 면 품목 테이블 + 단가/소계, WAREHOUSE_TRANSFER 는 placeholder.
// ARRIVED 일 때만 [입고 확정] 버튼 노출, 그 외는 안내 문구.
import { computed } from 'vue'
import {
  CheckIcon,
  InfoIcon,
  UserIcon,
  XIcon,
} from '@/components/warehouse/inbound/icons.js'
import { useWarehouseStatusFormat } from '@/composables/warehouse/useWarehouseStatusFormat.js'

const props = defineProps({
  order: { type: Object, required: true },
  itemStocks: { type: Map, default: () => new Map() },
})
defineEmits(['close', 'confirm-inbound'])

const {
  statusClass,
  statusLabel,
  historyDotClass,
  historyTextClass,
  inboundTypeClass,
  inboundTypeLabel,
  formatDate,
} = useWarehouseStatusFormat()

function getItemStock(item) {
  return props.itemStocks.get(item.skuCode) ?? null
}

function isItemShortage(item) {
  const s = getItemStock(item)
  return !!(s && s.onHand < s.safetyStock)
}

// 창고 관점 진행 이력 — 거래처 단계(READY_TO_SHIP/IN_TRANSIT/ARRIVED) + COMPLETED 노출.
// REQUESTED/APPROVED 는 본사 승인 영역, CANCELLED 는 창고 화면 미노출이라 필터.
const visibleHistory = computed(() => {
  const list = props.order?.statusHistory ?? []
  return list.filter((h) =>
    h.status === 'READY_TO_SHIP'
    || h.status === 'IN_TRANSIT'
    || h.status === 'ARRIVED'
    || h.status === 'COMPLETED'
  )
})
</script>

<template>
  <aside
    class="flex w-full shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm xl:w-[420px]"
  >
    <!-- 상세 패널 헤더 -->
    <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
      <h3 class="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
        <InfoIcon :size="14" />
        입고 상세
      </h3>
      <div class="flex items-center gap-3">
        <span class="inline-flex px-2 py-1 text-[10px] font-black" :class="statusClass(order.status)">
          {{ statusLabel(order.status) }}
        </span>
        <button
          type="button"
          class="p-1 text-white/80 hover:bg-white/10"
          aria-label="닫기"
          @click="$emit('close')"
        >
          <XIcon :size="16" />
        </button>
      </div>
    </div>

    <!-- 상세 내용 -->
    <div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <!-- 기본 정보 (공통) -->
      <section class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">입고번호</p>
            <p class="mt-0.5 text-sm font-black text-gray-900">{{ order.inboundCode }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">출처번호</p>
            <p class="mt-0.5 text-xs font-black text-gray-700">{{ order.sourceRefNo }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">
              {{ order.inboundType === 'WAREHOUSE_TRANSFER' ? '출발 창고' : '공급처' }}
            </p>
            <p class="mt-0.5 text-xs font-black text-gray-800">{{ order.sourceName }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">입고 창고</p>
            <p class="mt-0.5 text-xs font-black text-gray-800">{{ order.warehouseName }}</p>
          </div>
          <div>
            <p class="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
              <UserIcon :size="10" />
              종류
            </p>
            <p class="mt-0.5">
              <span
                class="inline-flex px-2 py-1 text-[10px] font-black"
                :class="inboundTypeClass(order.inboundType)"
              >
                {{ inboundTypeLabel(order.inboundType) }}
              </span>
            </p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">생성일시</p>
            <p class="mt-0.5 text-xs font-bold text-gray-500">{{ formatDate(order.createdAt) }}</p>
          </div>
        </div>
      </section>

      <!-- 발주 입고 분기 (PURCHASE_ORDER) — 품목 테이블 + 단가/소계 -->
      <section v-if="order.inboundType === 'PURCHASE_ORDER'">
        <p class="mb-2 text-[10px] font-black uppercase text-gray-400">발주 품목</p>
        <table class="w-full text-xs">
          <thead class="bg-gray-100 text-[10px] uppercase text-gray-500">
            <tr>
              <th class="px-2 py-2 text-left font-black">제품명</th>
              <th class="w-10 px-2 py-2 text-right font-black">수량</th>
              <th class="w-12 px-2 py-2 text-right font-black">실재고</th>
              <th class="w-10 px-2 py-2 text-right font-black">안전</th>
              <th class="w-16 px-2 py-2 text-right font-black">단가</th>
              <th class="w-16 px-2 py-2 text-right font-black">소계</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in order.items" :key="item.id">
              <td class="px-2 py-2 font-bold text-gray-800">
                <div>{{ item.productName }}</div>
                <div
                  v-if="item.displayOption"
                  class="mt-0.5 text-[10px] font-bold text-[#004D3C]"
                >
                  {{ item.displayOption }}
                </div>
              </td>
              <td class="px-2 py-2 text-right font-bold text-gray-700">{{ item.quantity }}</td>
              <td
                class="px-2 py-2 text-right font-black"
                :class="isItemShortage(item) ? 'text-red-600' : 'text-gray-800'"
              >
                <template v-if="getItemStock(item)">{{ getItemStock(item).onHand }}</template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-2 py-2 text-right font-bold text-gray-500">
                <template v-if="getItemStock(item)">{{ getItemStock(item).safetyStock }}</template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-2 py-2 text-right text-gray-500">
                ₩{{ item.unitPrice.toLocaleString() }}
              </td>
              <td class="px-2 py-2 text-right font-bold text-gray-700">
                ₩{{ item.subtotal.toLocaleString() }}
              </td>
            </tr>
          </tbody>
          <tfoot class="border-t border-gray-300 bg-gray-50 font-black text-gray-900">
            <tr>
              <td colspan="5" class="px-2 py-2">총계</td>
              <td class="px-2 py-2 text-right text-[#004D3C]">
                <template v-if="order.totalAmount != null">
                  ₩{{ order.totalAmount.toLocaleString() }}
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <!-- 이동 입고 분기 (WAREHOUSE_TRANSFER) — 후속 사이클 -->
      <div
        v-else-if="order.inboundType === 'WAREHOUSE_TRANSFER'"
        class="border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-xs text-gray-400"
      >
        창고간 이동 입고 상세는 outbound 도메인 합류 후 사이클에서 추가됩니다.
      </div>

      <!-- 진행 이력 타임라인 — 모든 inboundType 공통 -->
      <section v-if="visibleHistory.length">
        <p class="mb-2 text-[10px] font-black uppercase text-gray-400">진행 이력</p>
        <ol class="ml-2">
          <li
            v-for="(h, idx) in visibleHistory"
            :key="idx"
            class="relative pb-3 pl-5 last:pb-0"
          >
            <span class="absolute left-0 top-1 block h-2.5 w-2.5" :class="historyDotClass(h.status)" />
            <span
              v-if="idx < visibleHistory.length - 1"
              class="absolute bottom-0 left-[4px] top-3.5 w-px bg-gray-300"
            />
            <p class="text-[11px] font-black" :class="historyTextClass(h.status)">
              {{ statusLabel(h.status) }}
            </p>
            <p class="text-[10px] text-gray-500">{{ formatDate(h.at) }} · {{ h.byName }}</p>
          </li>
        </ol>
      </section>
    </div>

    <!-- 액션/안내 (상태별 분기) -->
    <div class="space-y-3 px-4 pb-6 pt-2">
      <template v-if="order.status === 'READY_TO_SHIP'">
        <p class="pt-2 text-center text-xs leading-relaxed text-gray-500">
          공급처에서 배송 준비 중입니다. 배송 시작 시 자동으로 다음 단계로 전환됩니다.
        </p>
      </template>

      <template v-else-if="order.status === 'IN_TRANSIT'">
        <p class="pt-2 text-center text-xs leading-relaxed text-gray-500">
          배송 중입니다. 도착 시 자동으로 [배송 완료] 단계로 전환됩니다.
        </p>
      </template>

      <template v-else-if="order.status === 'ARRIVED'">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-1.5 border border-[#004D3C] bg-[#004D3C] px-2 py-3 text-[11px] font-black text-white hover:bg-[#1f4b3a]"
          @click="$emit('confirm-inbound')"
        >
          <CheckIcon :size="12" />
          입고 확정
        </button>
        <p class="pt-1 text-center text-[11px] leading-relaxed text-gray-400">
          배송 완료된 발주입니다. [입고 확정] 을 누르면 창고 자산으로 등록됩니다.
        </p>
      </template>

      <template v-else-if="order.status === 'COMPLETED'">
        <p class="pt-2 text-center text-xs text-gray-400">입고 완료된 발주입니다.</p>
      </template>
    </div>

    <!-- 하단: 닫기 -->
    <div class="border-t border-gray-200">
      <button
        type="button"
        class="w-full px-4 py-2.5 text-center text-[11px] font-bold text-gray-500 hover:bg-gray-50"
        @click="$emit('close')"
      >
        닫기 (ESC)
      </button>
    </div>
  </aside>
</template>

<script setup>
// 본사 발주 목록 우측 상세 패널.
// REQUESTED 단계만 본사 권한(수정/취소) 노출 — 그 외 자동 전환 단계는 안내문만.
import {
  EditIcon,
  InfoIcon,
  UserIcon,
  XIcon,
} from '@/components/hq/purchase-order/icons.js'
import { useStatusFormat } from '@/composables/hq/purchaseOrder/useStatusFormat.js'

defineProps({
  order: { type: Object, required: true },
})
defineEmits(['close', 'edit', 'cancel'])

const { statusClass, statusLabel, historyDotClass, historyTextClass, formatDate } = useStatusFormat()
</script>

<template>
  <aside
    class="flex w-full shrink-0 flex-col overflow-hidden border border-gray-300 bg-white shadow-sm xl:w-[420px]"
  >
    <!-- 상세 패널 헤더 -->
    <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
      <h3 class="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider">
        <InfoIcon :size="14" />
        발주 상세
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
      <!-- 기본 정보 카드 -->
      <section class="space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">발주번호</p>
            <p class="mt-0.5 text-sm font-black text-gray-900">{{ order.id }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">공급처</p>
            <p class="mt-0.5 text-xs font-black text-gray-800">{{ order.vendorName }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">입고 창고</p>
            <p class="mt-0.5 text-xs font-black text-gray-800">{{ order.warehouseName }}</p>
          </div>
          <div>
            <p class="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
              <UserIcon :size="10" />
              담당자
            </p>
            <p class="mt-0.5 text-xs font-black text-gray-800">{{ order.memberName }}</p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase text-gray-400">생성일시</p>
            <p class="mt-0.5 text-xs font-bold text-gray-500">{{ formatDate(order.createdAt) }}</p>
          </div>
        </div>
      </section>

      <!-- 품목 테이블 -->
      <section>
        <p class="mb-2 text-[10px] font-black uppercase text-gray-400">발주 품목</p>
        <table class="w-full text-xs">
          <thead class="bg-gray-100 text-[10px] uppercase text-gray-500">
            <tr>
              <th class="px-2 py-2 text-left font-black">제품명</th>
              <th class="w-10 px-2 py-2 text-right font-black">수량</th>
              <th class="w-20 px-2 py-2 text-right font-black">단가</th>
              <th class="w-20 px-2 py-2 text-right font-black">소계</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in order.items" :key="item.skuCode || item.productId">
              <td class="px-2 py-2 align-top">
                <div class="font-bold text-gray-800">{{ item.productName }}</div>
                <div v-if="item.displayOption" class="mt-0.5 text-[11px] font-bold text-[#004D3C]">
                  {{ item.displayOption }}
                </div>
                <div v-if="item.skuCode" class="text-[10px] text-gray-400">{{ item.skuCode }}</div>
              </td>
              <td class="px-2 py-2 text-right font-bold text-gray-700 align-top">
                {{ item.quantity }}
              </td>
              <td class="px-2 py-2 text-right text-gray-500 align-top">
                ₩{{ item.unitPrice.toLocaleString() }}
              </td>
              <td class="px-2 py-2 text-right font-bold text-gray-700 align-top">
                ₩{{ item.subtotal.toLocaleString() }}
              </td>
            </tr>
          </tbody>
          <tfoot class="border-t border-gray-300 bg-gray-50 font-black text-gray-900">
            <tr>
              <td colspan="3" class="px-2 py-2">총계</td>
              <td class="px-2 py-2 text-right text-[#004D3C]">
                ₩{{ order.totalPrice.toLocaleString() }}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <!-- 진행 이력 타임라인 -->
      <section v-if="order.statusHistory?.length">
        <p class="mb-2 text-[10px] font-black uppercase text-gray-400">진행 이력</p>
        <ol class="ml-2">
          <li
            v-for="(h, idx) in order.statusHistory"
            :key="idx"
            class="relative pb-3 pl-5 last:pb-0"
          >
            <span class="absolute left-0 top-1 block h-2.5 w-2.5" :class="historyDotClass(h.status)" />
            <span
              v-if="idx < order.statusHistory.length - 1"
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

    <!-- 액션/안내 (상태별 조건부) -->
    <div class="space-y-4 px-4 pb-6 pt-2">
      <template v-if="order.status === 'REQUESTED'">
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 border border-gray-400 bg-white px-2 py-2.5 text-[11px] font-black text-gray-700 hover:bg-gray-50"
            @click="$emit('edit')"
          >
            <EditIcon :size="12" />
            수정
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 border border-red-500 bg-red-50 px-2 py-2.5 text-[11px] font-black text-red-700 hover:bg-red-100"
            @click="$emit('cancel')"
          >
            <XIcon :size="12" />
            취소
          </button>
        </div>
        <p class="pt-1 text-center text-[11px] leading-relaxed text-gray-500">
          30분 후 시스템이 자동으로 공급처 승인을 처리합니다.<br />
          그 전에 [수정] 또는 [취소] 가능합니다.
        </p>
      </template>

      <template v-else-if="order.status === 'APPROVED'">
        <p class="text-center text-xs leading-relaxed text-gray-500">
          승인 완료 · 30분 후 시스템이 자동으로 배송 준비 처리합니다.
        </p>
      </template>

      <template v-else-if="order.status === 'READY_TO_SHIP'">
        <p class="text-center text-xs leading-relaxed text-gray-500">
          배송 준비 중 · 30분 후 시스템이 자동으로 배송 시작 처리합니다.
        </p>
      </template>

      <template v-else-if="order.status === 'IN_TRANSIT'">
        <p class="text-center text-xs leading-relaxed text-gray-500">
          배송 중 · 30분 후 시스템이 자동으로 배송 완료 처리합니다.
        </p>
      </template>

      <template v-else-if="order.status === 'ARRIVED'">
        <p class="text-center text-xs text-gray-500">배송 완료 · 창고 입고 확정 대기</p>
      </template>

      <template v-else>
        <p
          v-if="order.status === 'CANCELLED' && order.cancelReason"
          class="border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-bold leading-relaxed text-red-700"
        >
          취소 사유: {{ order.cancelReason }}
        </p>
        <p class="pt-2 text-center text-xs text-gray-400">
          {{ order.status === 'COMPLETED' ? '종료된 발주입니다.' : '취소된 발주입니다.' }}
        </p>
      </template>
    </div>

    <!-- 하단: 닫기 버튼 -->
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

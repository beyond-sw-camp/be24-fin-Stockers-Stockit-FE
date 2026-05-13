<script setup>
// 발주 요청/수정 최종 확인 모달.
// 신규 모드: 멀티 공급처 → vendor 그룹 카드 N장 + "발주 N건 생성" 안내문.
// edit 모드: 단일 vendor → 기존 단일 카드.
import { computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  isEditMode: { type: Boolean, default: false },
  warehouseName: { type: String, default: '' },
  vendorName: { type: String, default: '' },
  groupedByVendor: { type: Array, default: () => [] },
  itemCount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
})
defineEmits(['cancel', 'confirm'])

const vendorCount = computed(() => props.groupedByVendor.length)
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-md overflow-hidden bg-white shadow-xl">
      <div class="bg-[#004D3C] px-5 py-3 text-white">
        <h2 class="text-sm font-black">{{ isEditMode ? '발주 수정 확인' : '발주 요청 확인' }}</h2>
      </div>
      <div class="space-y-3 p-5 text-sm text-gray-700">
        <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">발주서 요약</p>
        <dl class="space-y-1.5">
          <div class="flex justify-between gap-2">
            <dt class="text-gray-500">입고 창고</dt>
            <dd class="font-bold text-gray-800">{{ warehouseName }}</dd>
          </div>
          <!-- edit 모드 — 단일 vendor 표시 (기존 흐름) -->
          <div v-if="isEditMode" class="flex justify-between gap-2">
            <dt class="text-gray-500">공급처</dt>
            <dd class="font-bold text-gray-800">{{ vendorName }}</dd>
          </div>
          <!-- 신규 모드 — 멀티 vendor 요약 -->
          <div v-else class="flex justify-between gap-2">
            <dt class="text-gray-500">공급처</dt>
            <dd class="font-bold text-gray-800">{{ vendorCount }}곳</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-gray-500">품목</dt>
            <dd class="font-bold text-gray-800">{{ itemCount }}건</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-gray-500">총액</dt>
            <dd class="font-black text-[#004D3C]">₩{{ totalAmount.toLocaleString() }}</dd>
          </div>
        </dl>

        <!-- 신규 모드 — vendor 그룹 카드 N장 (공급처별로 발주 1건씩 자동 생성) -->
        <div v-if="!isEditMode && vendorCount > 0" class="space-y-2 pt-1">
          <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            공급처별 발주 ({{ vendorCount }}건 생성)
          </p>
          <ul class="space-y-1.5">
            <li
              v-for="g in groupedByVendor"
              :key="g.vendorId"
              class="flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-black text-gray-800">{{ g.vendorName }}</p>
                <p class="text-[11px] text-gray-500">{{ g.itemCount }}건</p>
              </div>
              <span class="text-xs font-bold text-[#004D3C]">
                ₩{{ g.subtotal.toLocaleString() }}
              </span>
            </li>
          </ul>
        </div>

        <p class="pt-2 text-xs leading-relaxed text-gray-500">
          <template v-if="isEditMode">
            이 내용으로 발주를 수정합니다. 공급처 승인 전까지만 가능합니다.
          </template>
          <template v-else>
            공급처별로 발주 {{ vendorCount }}건이 자동 생성됩니다. 한 건이라도 실패하면 전체가
            취소되고 장바구니는 유지됩니다.
          </template>
        </p>
      </div>
      <div
        class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3"
      >
        <button
          type="button"
          class="border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-100"
          @click="$emit('cancel')"
        >
          취소
        </button>
        <button
          type="button"
          class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-sm font-black text-white hover:bg-[#1f4b3a]"
          @click="$emit('confirm')"
        >
          {{ isEditMode ? '수정 저장' : '발주 요청' }}
        </button>
      </div>
    </div>
  </div>
</template>

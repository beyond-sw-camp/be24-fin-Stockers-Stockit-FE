<script setup>
// 발주 요청/수정 최종 확인 모달. 발주서 요약(창고/공급처/품목 수/총액) + mode 별 안내문.
defineProps({
  open: { type: Boolean, required: true },
  isEditMode: { type: Boolean, default: false },
  warehouseName: { type: String, default: '' },
  vendorName: { type: String, default: '' },
  itemCount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
})
defineEmits(['cancel', 'confirm'])
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
      <div class="bg-[#004D3C] px-5 py-3 text-white">
        <h2 class="text-sm font-black">{{ isEditMode ? '발주 수정 확인' : '발주 요청 확인' }}</h2>
      </div>
      <div class="space-y-2 p-5 text-xs text-gray-700">
        <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">발주서 요약</p>
        <dl class="space-y-1.5">
          <div class="flex justify-between gap-2">
            <dt class="text-gray-500">입고 창고</dt>
            <dd class="font-bold text-gray-800">{{ warehouseName }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-gray-500">공급처</dt>
            <dd class="font-bold text-gray-800">{{ vendorName }}</dd>
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
        <p class="pt-2 text-[11px] leading-relaxed text-gray-500">
          <template v-if="isEditMode">
            이 내용으로 발주를 수정합니다. 공급처 승인 전까지만 가능합니다.
          </template>
          <template v-else>
            이 내용으로 공급처에 발주 요청합니다.
            요청 후 공급처 응답 받기 전까지 [취소] 가능합니다.
          </template>
        </p>
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
        <button
          type="button"
          class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
          @click="$emit('cancel')"
        >
          취소
        </button>
        <button
          type="button"
          class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
          @click="$emit('confirm')"
        >
          {{ isEditMode ? '수정 저장' : '발주 요청' }}
        </button>
      </div>
    </div>
  </div>
</template>

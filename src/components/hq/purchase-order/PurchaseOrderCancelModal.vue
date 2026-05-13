<script setup>
import { ref, watch } from 'vue'

// 발주 취소 모달 — REQUESTED 단계만 취소 가능 (CEN-038).
// cancelReason textarea 는 모달 로컬 state, 모달 닫을 때 초기화.
const props = defineProps({
  open: { type: Boolean, required: true },
  order: { type: Object, default: null },
})
const emit = defineEmits(['cancel', 'confirm'])

const reason = ref('')

watch(
  () => props.open,
  (next) => {
    if (next) reason.value = ''
  },
)

function onConfirm() {
  emit('confirm', reason.value)
}
</script>

<template>
  <div
    v-if="open && order"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="emit('cancel')"
  >
    <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
      <div class="bg-red-700 px-5 py-3 text-white">
        <h2 class="text-sm font-black">발주 취소</h2>
      </div>
      <div class="space-y-3 p-5 text-sm text-gray-700">
        <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">발주 정보</p>
        <p>
          <strong>{{ order.id }}</strong> ·
          {{ order.vendorName }} ·
          <span class="font-bold text-[#004D3C]">₩{{ order.totalPrice.toLocaleString() }}</span>
        </p>
        <label class="block">
          <span class="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            취소 사유 (선택)
          </span>
          <textarea
            v-model="reason"
            rows="3"
            maxlength="500"
            placeholder="예: 공급처 단가 변경, 수량 잘못 입력 등"
            class="mt-1 w-full resize-none border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-red-500"
          />
        </label>
        <p class="text-xs leading-relaxed text-red-600">
          취소 후에는 되돌릴 수 없습니다. 같은 발주가 필요하면 새 발주로 다시 만들어야 합니다.
        </p>
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
        <button
          type="button"
          class="border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-100"
          @click="emit('cancel')"
        >
          취소
        </button>
        <button
          type="button"
          class="border border-red-700 bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-600"
          @click="onConfirm"
        >
          취소 확정
        </button>
      </div>
    </div>
  </div>
</template>

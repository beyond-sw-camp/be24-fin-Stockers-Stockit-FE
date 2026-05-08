<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  selectedCount: { type: Number, required: true },
})
const emit = defineEmits(['close', 'apply'])

const qtyInput = ref(0)

// open 변경 시 입력값 초기화. 모달이 다시 열릴 때 이전 값 안 남게.
watch(
  () => props.open,
  (next) => {
    if (next) qtyInput.value = 0
  },
)

function onApply() {
  const qty = Number(qtyInput.value) || 0
  emit('apply', qty)
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
      <div class="bg-[#004D3C] px-5 py-3 text-white">
        <h2 class="text-sm font-black">수량 일괄 입력</h2>
      </div>
      <div class="p-5 text-xs text-gray-700">
        <p class="mb-3">
          선택한 <strong>{{ selectedCount }}개 SKU</strong> 모두에 동일한 수량을 적용합니다.
        </p>
        <input
          v-model.number="qtyInput"
          type="number"
          min="1"
          placeholder="수량"
          class="w-full border border-gray-300 px-3 py-2 text-center text-sm outline-none focus:border-[#004D3C]"
          @keydown.enter="onApply"
        />
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
        <button
          type="button"
          class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
          @click="emit('close')"
        >
          취소
        </button>
        <button
          type="button"
          class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
          @click="onApply"
        >
          적용
        </button>
      </div>
    </div>
  </div>
</template>

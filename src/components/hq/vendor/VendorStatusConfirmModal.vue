<script setup>
import { XIcon } from './icons.js'

defineProps({
  open: { type: Boolean, required: true },
  pendingChange: { type: Object, default: null },
})

defineEmits(['cancel', 'confirm'])
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-sm border border-gray-300 bg-white shadow-xl">
      <div class="flex items-center justify-between bg-[#004D3C] px-4 py-3 text-white">
        <h3 class="text-[11px] font-black uppercase tracking-wider">계약 상태 변경 확인</h3>
        <button type="button" class="p-1 hover:bg-white/10" @click="$emit('cancel')">
          <XIcon :size="16" />
        </button>
      </div>

      <div class="p-5 text-xs text-gray-700 space-y-2">
        <p>
          <strong class="font-black text-gray-900">{{ pendingChange?.productName }}</strong>
          계약을
          <strong
            class="font-black"
            :class="
              pendingChange?.newStatus === 'active' ? 'text-emerald-700' : 'text-amber-700'
            "
          >
            "{{ pendingChange?.label }}"
          </strong>
          상태로 변경하시겠습니까?
        </p>
        <p class="text-[10px] font-bold text-gray-400">
          변경 즉시 본사 발주 가능 여부에 영향이 있습니다.
        </p>
      </div>

      <div class="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
        <button
          type="button"
          class="border border-gray-300 bg-white px-4 py-2 text-[11px] font-black text-gray-700 hover:bg-gray-50"
          @click="$emit('cancel')"
        >
          취소
        </button>
        <button
          type="button"
          class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-[11px] font-black text-white hover:bg-[#1f4b3a]"
          @click="$emit('confirm')"
        >
          변경
        </button>
      </div>
    </div>
  </div>
</template>

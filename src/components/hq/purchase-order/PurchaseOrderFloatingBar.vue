<script setup>
defineProps({
  selectedCount: { type: Number, required: true },
})
defineEmits(['openBulkQty', 'clearSelection'])
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200"
    leave-active-class="transition-all duration-200"
    enter-from-class="opacity-0 translate-y-2"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="selectedCount > 0"
      class="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform"
    >
      <div class="flex items-center gap-3 border border-[#004D3C] bg-[#004D3C] px-4 py-2.5 text-white shadow-xl">
        <span class="text-sm font-black">{{ selectedCount }}개 SKU 선택됨</span>
        <button
          type="button"
          class="border border-white bg-white px-3 py-1 text-xs font-black text-[#004D3C] hover:bg-gray-100"
          @click="$emit('openBulkQty')"
        >
          수량 일괄 입력
        </button>
        <button
          type="button"
          class="text-xs font-bold text-white/80 hover:text-white underline"
          @click="$emit('clearSelection')"
        >
          선택 해제
        </button>
      </div>
    </div>
  </Transition>
</template>

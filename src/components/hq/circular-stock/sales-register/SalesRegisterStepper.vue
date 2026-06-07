<script setup>
defineProps({
  saleStep: {
    type: Number,
    required: true,
  },
  saleType: {
    type: String,
    default: 'SALE',
  },
})

const emit = defineEmits(['move-step'])
</script>

<template>
  <div class="h-5" />
  <div class="relative">
    <div
      class="pointer-events-none absolute left-0 right-0 top-5 flex items-center px-[16.666%]"
    >
      <span class="relative h-[2px] flex-1 rounded-full bg-gray-200">
        <span
          class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2F9E87] to-[#0F5C4D] transition-all duration-400 ease-out"
          :style="{ width: saleStep >= 2 ? '100%' : '0%' }"
        />
      </span>
      <span class="mx-2 h-[2px] w-8 rounded-full bg-transparent" />
      <span class="relative h-[2px] flex-1 rounded-full bg-gray-200">
        <span
          class="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#2F9E87] to-[#0F5C4D] transition-all duration-400 ease-out"
          :style="{ width: saleStep >= 3 ? '100%' : '0%' }"
        />
      </span>
    </div>

    <div class="relative flex items-start">
      <button
        type="button"
        class="group flex min-w-0 flex-1 flex-col items-center gap-3 text-center"
        @click="emit('move-step', 1)"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all duration-200"
          :class="
            saleStep >= 1
              ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-[0_6px_14px_-8px_rgba(15,92,77,0.75)] ring-2 ring-[#0F5C4D]/15'
              : 'border-gray-300 bg-white text-gray-500 shadow-sm'
          "
          >1</span
        >
        <span
          class="text-xs font-black"
          :class="saleStep === 1 ? 'text-[#0F5C4D]' : 'text-gray-600'"
          >선택한 SKU 확인</span
        >
      </button>

      <button
        type="button"
        class="group flex min-w-0 flex-1 flex-col items-center gap-3 text-center"
        @click="emit('move-step', 2)"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all duration-200"
          :class="
            saleStep >= 2
              ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-[0_6px_14px_-8px_rgba(15,92,77,0.75)] ring-2 ring-[#0F5C4D]/15'
              : 'border-gray-300 bg-white text-gray-500 shadow-sm'
          "
          >2</span
        >
        <span
          class="text-xs font-black"
          :class="saleStep === 2 ? 'text-[#0F5C4D]' : 'text-gray-600'"
          >{{ saleType === 'DONATION' ? '기부처 입력' : '거래처 매칭' }}</span
        >
      </button>

      <button
        type="button"
        class="group flex min-w-0 flex-1 flex-col items-center gap-3 text-center"
        @click="emit('move-step', 3)"
      >
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black transition-all duration-200"
          :class="
            saleStep >= 3
              ? 'border-[#0F5C4D] bg-[#0F5C4D] text-white shadow-[0_6px_14px_-8px_rgba(15,92,77,0.75)] ring-2 ring-[#0F5C4D]/15'
              : 'border-gray-300 bg-white text-gray-500 shadow-sm'
          "
          >3</span
        >
        <span
          class="text-xs font-black"
          :class="saleStep === 3 ? 'text-[#0F5C4D]' : 'text-gray-600'"
          >{{ saleType === 'DONATION' ? '기부 조건 확정' : '판매 조건 확정' }}</span
        >
      </button>
    </div>
  </div>
  <div class="h-14" />
</template>

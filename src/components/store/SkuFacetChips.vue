<script setup>
const selectedColor = defineModel('selectedColor', { type: String, default: '' })
const selectedSize = defineModel('selectedSize', { type: String, default: '' })

defineProps({
  colors: {
    type: Array,
    default: () => [],
  },
  sizes: {
    type: Array,
    default: () => [],
  },
  wrapperClass: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div
    v-if="colors.length > 0 || sizes.length > 0"
    :class="wrapperClass || 'flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50/60 px-4 py-3'"
  >
    <div v-if="colors.length > 0" class="flex flex-wrap items-center gap-1">
      <span class="text-[11px] font-black tracking-wider text-gray-400">색상</span>
      <button
        v-for="c in colors"
        :key="`chip-color-${c}`"
        type="button"
        class="border px-2 py-0.5 text-[11px] font-bold transition-colors"
        :class="selectedColor === c
          ? 'border-[#004D3C] bg-[#004D3C] text-white'
          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
        @click="selectedColor = (selectedColor === c ? '' : c)"
      >{{ c }}</button>
    </div>
    <div v-if="sizes.length > 0" class="flex flex-wrap items-center gap-1">
      <span class="text-[11px] font-black tracking-wider text-gray-400">사이즈</span>
      <button
        v-for="s in sizes"
        :key="`chip-size-${s}`"
        type="button"
        class="border px-2 py-0.5 text-[11px] font-bold transition-colors"
        :class="selectedSize === s
          ? 'border-[#004D3C] bg-[#004D3C] text-white'
          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'"
        @click="selectedSize = (selectedSize === s ? '' : s)"
      >{{ s }}</button>
    </div>
  </div>
</template>

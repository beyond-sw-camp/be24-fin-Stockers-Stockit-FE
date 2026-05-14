<script setup>
// 마스터/SKU 보기 모드 토글 (라디오).
const props = defineProps({
  modelValue: { type: String, default: 'master' },   // 'master' | 'sku'
  masterLabel: { type: String, default: '마스터별' },
  skuLabel: { type: String, default: 'SKU별' },
})

const emit = defineEmits(['update:modelValue'])

function set(mode) {
  if (mode !== props.modelValue) emit('update:modelValue', mode)
}
</script>

<template>
  <div class="inline-flex items-center gap-1 border border-gray-200 bg-white p-1 text-xs font-black">
    <button
      type="button"
      class="px-3 py-1.5 transition"
      :class="modelValue === 'master' ? 'bg-[#004D3C] text-white' : 'text-gray-600 hover:text-black'"
      @click="set('master')"
    >{{ masterLabel }}</button>
    <button
      type="button"
      class="px-3 py-1.5 transition"
      :class="modelValue === 'sku' ? 'bg-[#004D3C] text-white' : 'text-gray-600 hover:text-black'"
      @click="set('sku')"
    >{{ skuLabel }}</button>
  </div>
</template>

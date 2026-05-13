<script setup>
import { computed } from 'vue'
import { AlertTriangleIcon } from '@/components/hq/purchase-order/icons.js'

// 단순 confirm 모달 (창고 변경 / 공급처 변경 / 장바구니 비우기 통합).
// 본문은 slot — 호출처가 메시지 자유롭게 작성.
// variant 가 header 색상 + confirm 버튼 색상 + 경고 아이콘 노출 결정.
const props = defineProps({
  open: { type: Boolean, required: true },
  variant: {
    type: String,
    default: 'signature',
    validator: (v) => ['signature', 'amber', 'red'].includes(v),
  },
  title: { type: String, required: true },
  confirmLabel: { type: String, required: true },
})
defineEmits(['cancel', 'confirm'])

const headerClass = computed(() => {
  if (props.variant === 'amber') return 'flex items-center gap-2 bg-amber-600 px-5 py-3 text-white'
  if (props.variant === 'red') return 'bg-red-700 px-5 py-3 text-white'
  return 'bg-[#004D3C] px-5 py-3 text-white'
})

const confirmBtnClass = computed(() => {
  if (props.variant === 'amber') {
    return 'border border-amber-600 bg-amber-600 px-4 py-2 text-sm font-black text-white hover:bg-amber-500'
  }
  if (props.variant === 'red') {
    return 'border border-red-700 bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-600'
  }
  return 'border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-sm font-black text-white hover:bg-[#1f4b3a]'
})
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="$emit('cancel')"
  >
    <div class="w-full max-w-sm overflow-hidden bg-white shadow-xl">
      <div :class="headerClass">
        <AlertTriangleIcon v-if="variant === 'amber'" :size="14" />
        <h2 class="text-sm font-black">{{ title }}</h2>
      </div>
      <div class="p-5 text-sm text-gray-700">
        <slot />
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
        <button
          type="button"
          class="border border-gray-300 bg-white px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-100"
          @click="$emit('cancel')"
        >
          취소
        </button>
        <button type="button" :class="confirmBtnClass" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '판매 등록 화면 이탈' },
  message: {
    type: String,
    default: '화면을 나가면 판매 등록 진행 중인 내용이 사라집니다.',
  },
  cancelLabel: { type: String, default: '취소' },
  confirmLabel: { type: String, default: '나가기' },
})

defineEmits(['cancel', 'confirm'])
</script>

<template>
  <div
    v-if="props.open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
  >
    <section class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl">
      <p class="text-base font-black text-gray-900" style="margin-bottom: 6px">
        {{ props.title }}
      </p>
      <p class="mt-2 text-sm font-bold text-gray-600" style="margin-bottom: 15px">
        {{ props.message }}
      </p>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-black text-gray-700 hover:bg-gray-50"
          @click="$emit('cancel')"
        >
          {{ props.cancelLabel }}
        </button>
        <button
          type="button"
          class="h-9 rounded-lg border border-rose-700 bg-rose-700 px-3 text-xs font-black text-white hover:bg-rose-800"
          @click="$emit('confirm')"
        >
          {{ props.confirmLabel }}
        </button>
      </div>
    </section>
  </div>
</template>

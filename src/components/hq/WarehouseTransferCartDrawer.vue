<script setup>
import { computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  cartGroups: { type: Array, default: () => [] },
  cartLineCount: { type: Number, default: 0 },
})

const emit = defineEmits([
  'close',
  'clear-all',
  'execute',
  'remove-line',
  'update-line-qty',
])

const hasLines = computed(() => props.cartLineCount > 0)

const onQtyChange = (lineId, event) => {
  emit('update-line-qty', lineId, event)
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/35" @click="emit('close')" />
    <section class="absolute right-0 top-0 h-full w-full max-w-[520px] overflow-y-auto border-l border-gray-200 bg-white shadow-2xl">
      <div class="sticky top-0 z-10 border-b border-gray-100 bg-white px-5 py-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-base font-black text-gray-900">재고 이동 장바구니</h2>
            <p class="mt-1 text-[11px] font-bold text-gray-500">총 {{ cartLineCount }}건</p>
          </div>
          <button type="button" class="h-8 border border-gray-300 px-3 text-xs font-black text-gray-700 hover:bg-gray-100" @click="emit('close')">닫기</button>
        </div>
      </div>

      <div class="space-y-4 p-5 pb-28">
        <div v-if="!hasLines" class="border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-xs font-bold text-gray-400">
          장바구니가 비어 있습니다.
        </div>

        <article v-for="group in cartGroups" :key="group.routeKey" class="border border-gray-200 bg-white">
          <header class="border-b border-gray-100 bg-gray-50 px-4 py-3">
            <p class="text-xs font-black text-gray-900">{{ group.fromWarehouseName }} → {{ group.toWarehouseName }}</p>
            <p class="mt-1 text-[11px] font-bold text-gray-500">{{ group.lines.length }}건 · 총 {{ group.totalQty.toLocaleString() }}개</p>
          </header>

          <div class="divide-y divide-gray-100">
            <div v-for="line in group.lines" :key="line.lineId" class="space-y-2 px-4 py-3">
              <p class="text-[11px] font-black text-gray-800">{{ line.itemName }}</p>
              <p class="font-mono text-[11px] font-bold text-gray-500">{{ line.skuCode }}</p>
              <div class="flex items-center gap-2">
                <input
                  :value="line.qty"
                  type="number"
                  min="1"
                  class="h-8 w-24 border border-gray-300 px-2 text-xs font-black text-gray-900 outline-none focus:border-[#004D3C]"
                  @change="onQtyChange(line.lineId, $event)"
                />
                <span class="text-[11px] font-bold text-gray-500">개</span>
                <button
                  type="button"
                  class="ml-auto h-8 border border-red-200 px-3 text-[11px] font-black text-red-600 hover:bg-red-50"
                  @click="emit('remove-line', line.lineId)"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div class="fixed bottom-0 right-0 w-full max-w-[520px] border-t border-gray-200 bg-white px-5 py-3">
        <div class="flex gap-2">
          <button
            type="button"
            class="h-10 flex-1 border border-gray-300 px-4 text-xs font-black text-gray-700 hover:bg-gray-100"
            :disabled="!hasLines"
            @click="emit('clear-all')"
          >
            전체 비우기
          </button>
          <button
            type="button"
            class="h-10 flex-1 px-4 text-xs font-black transition"
            :class="hasLines ? 'bg-[#004D3C] text-white hover:bg-[#00382c]' : 'cursor-not-allowed bg-gray-100 text-gray-400'"
            :disabled="!hasLines"
            @click="emit('execute')"
          >
            재고 이동 실행
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

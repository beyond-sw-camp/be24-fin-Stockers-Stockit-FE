<script setup>
// 입고 확정 confirm 모달.
// preview 는 부모(view) 의 stockStore.getInboundPreview 결과 — 입고 후 실재고 변화 + 안전재고 미달 경고.
defineProps({
  open: { type: Boolean, required: true },
  order: { type: Object, default: null },
  preview: { type: Array, default: () => [] },
  hasShortage: { type: Boolean, default: false },
})
const emit = defineEmits(['cancel', 'confirm'])
</script>

<template>
  <div
    v-if="open && order"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    @click.self="emit('cancel')"
  >
    <div class="w-full max-w-lg overflow-hidden bg-white shadow-xl">
      <div class="bg-[#004D3C] px-5 py-3 text-white">
        <h2 class="text-sm font-black">입고 확정</h2>
      </div>
      <div class="space-y-3 p-5 text-xs text-gray-700">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">발주 정보</p>
          <p class="mt-1">
            <strong>{{ order.id }}</strong> ·
            {{ order.vendorName }} ·
            <span class="font-bold text-[#004D3C]">
              ₩{{ order.totalPrice.toLocaleString() }}
            </span>
          </p>
        </div>

        <!-- 입고 후 재고 변화 미리보기 -->
        <div v-if="preview.length > 0">
          <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            입고 후 재고 변화 ({{ order.warehouseName }})
          </p>
          <table class="mt-1 w-full table-fixed border-collapse text-[11px]">
            <thead class="bg-gray-50 text-[9px] uppercase tracking-wider text-gray-500">
              <tr>
                <th class="px-2 py-1.5 text-left font-black">품목</th>
                <th class="w-12 px-2 py-1.5 text-right font-black">입고</th>
                <th class="w-20 px-2 py-1.5 text-right font-black">실재고</th>
                <th class="w-12 px-2 py-1.5 text-right font-black">안전</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="row in preview" :key="row.productCode">
                <td class="truncate px-2 py-1.5 font-bold text-gray-800">{{ row.productName }}</td>
                <td class="px-2 py-1.5 text-right font-black text-[#004D3C]">+{{ row.quantity }}</td>
                <td class="px-2 py-1.5 text-right font-bold">
                  <template v-if="row.before">
                    <span class="text-gray-400">{{ row.before.onHand }}</span>
                    <span class="mx-1 text-gray-300">→</span>
                    <span :class="row.shortageAfter ? 'text-red-600' : 'text-gray-800'">
                      {{ row.after.onHand }}
                    </span>
                  </template>
                  <span v-else class="text-gray-300">—</span>
                </td>
                <td class="px-2 py-1.5 text-right font-bold text-gray-500">
                  <template v-if="row.before">{{ row.before.safetyStock }}</template>
                  <span v-else class="text-gray-300">—</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p
            v-if="hasShortage"
            class="mt-2 border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-bold text-amber-800"
          >
            ⚠ 입고 확정 후에도 안전재고 미달 품목이 있습니다 — 추가 발주 검토 필요.
          </p>
        </div>

        <p class="pt-1 text-[11px] text-gray-500">
          창고 자산으로 등록되며 발주 상태가 <strong>입고 완료</strong>로 변경됩니다.
        </p>
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
        <button
          type="button"
          class="border border-gray-300 bg-white px-4 py-2 text-xs font-black text-gray-700 hover:bg-gray-100"
          @click="emit('cancel')"
        >
          취소
        </button>
        <button
          type="button"
          class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#1f4b3a]"
          @click="emit('confirm')"
        >
          입고 확정
        </button>
      </div>
    </div>
  </div>
</template>

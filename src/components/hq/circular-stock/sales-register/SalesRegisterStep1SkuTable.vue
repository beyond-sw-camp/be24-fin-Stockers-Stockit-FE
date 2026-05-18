<script setup>
import { Info } from 'lucide-vue-next'

defineProps({
  draftItems: {
    type: Array,
    required: true,
  },
  outboundWarehouseLabel: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['remove-item', 'clear-all'])

function formatMaterials(materials) {
  return (materials || []).map((material) => `${material.name} ${material.ratio}%`).join(', ')
}
</script>

<template>
  <div class="mt-0">
    <div class="mb-0 pl-2 flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-black text-gray-900">선택한 SKU 확인</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-black text-gray-500">
          출고 창고: <span class="text-gray-900">{{ outboundWarehouseLabel }}</span>
        </span>
        <button
          type="button"
          class="pr-4 cursor-pointer text-[11px] font-black text-gray-500 hover:text-gray-900"
          @click="emit('clear-all')"
        >
          전체 비우기
        </button>
      </div>
    </div>
    <div class="h-2.5" />
    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table class="w-full border-collapse text-left text-xs">
        <thead class="sticky top-0 bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
          <tr>
            <th class="px-3 py-3 font-black">SKU</th>
            <th class="px-3 py-3 font-black">품목</th>
            <th class="px-3 py-3 font-black">소재 구분</th>
            <th class="px-3 py-3 font-black">소재 상세</th>
            <th class="px-3 py-3 text-center font-black">재고 수량</th>
            <th class="px-3 py-3 text-right font-black">kg당 단가</th>
            <th class="px-3 py-3 text-right font-black">환산 금액</th>
            <th class="px-3 py-3 text-right font-black">총 무게</th>
            <th class="px-3 py-3 text-right font-black">개당 무게</th>
            <th class="px-3 py-3 text-center font-black">제거</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="item in draftItems" :key="item.draftId">
            <td class="px-3 py-3 font-mono font-bold text-gray-600">
              {{ item.skuCode }}
            </td>
            <td class="px-3 py-3 font-black text-gray-900">{{ item.itemName }}</td>
            <td class="px-3 py-3 font-black text-gray-700">{{ item.materialType }}</td>
            <td class="px-3 py-3 font-bold text-gray-700">
              {{ formatMaterials(item.materials) }}
            </td>
            <td class="px-3 py-3 text-center font-black text-gray-900">
              {{ item.availableQuantity.toLocaleString() }}벌
            </td>
            <td class="px-3 py-3 text-right font-black text-gray-900">
              ₩{{ Number(item.defaultKgUnitPrice || 0).toLocaleString() }}
            </td>
            <td class="px-3 py-3 text-right font-black text-gray-900">
              ₩{{
                Math.round(
                  Number(item.availableWeightKg || 0) * Number(item.defaultKgUnitPrice || 0),
                ).toLocaleString()
              }}
            </td>
            <td class="px-3 py-3 text-right font-black text-gray-900">
              {{ Number(item.availableWeightKg || 0).toFixed(2) }}kg
            </td>
            <td class="px-3 py-3 text-right font-black text-gray-900">
              {{ Number(item.unitWeightKg || 0).toFixed(3) }}kg
            </td>
            <td class="px-3 py-3 text-center">
              <button
                type="button"
                class="h-8 rounded-lg border border-gray-200 bg-white px-3 text-[11px] font-black text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
                @click="emit('remove-item', item.draftId)"
              >
                삭제
              </button>
            </td>
          </tr>
          <tr v-if="draftItems.length === 0">
            <td colspan="10" class="px-3 py-8 text-center text-xs font-bold text-gray-400">
              선택된 SKU가 없습니다.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="h-3" />
    <div
      class="flex items-start gap-2 rounded-lg border border-[#F1E7CF] bg-[#FFFBF3] px-4 py-2 text-xs font-bold text-[#7D6432]"
    >
      <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B38A3A]" :stroke-width="2" />
      <span>한 건의 판매에서는 같은 소재 구분의 SKU만 함께 선택할 수 있습니다.</span>
    </div>
  </div>
</template>

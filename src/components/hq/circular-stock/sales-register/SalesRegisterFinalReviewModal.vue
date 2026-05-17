<script setup>
defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  selectedBuyer: {
    type: Object,
    default: null,
  },
  lockedMaterialType: {
    type: String,
    default: '',
  },
  drawerSummary: {
    type: Object,
    required: true,
  },
  finalReviewSummary: {
    type: Object,
    required: true,
  },
  includedMaterialNames: {
    type: Array,
    required: true,
  },
  draftItems: {
    type: Array,
    required: true,
  },
  draftMemo: {
    type: String,
    default: '',
  },
  formatMaterials: {
    type: Function,
    required: true,
  },
  formatKg: {
    type: Function,
    required: true,
  },
  formatCurrency: {
    type: Function,
    required: true,
  },
  formatQuantity: {
    type: Function,
    required: true,
  },
  hasWeightAdjustment: {
    type: Function,
    required: true,
  },
  materialFitLabel: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['close', 'return-edit', 'submit'])
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="flex h-full w-full items-center justify-center p-4">
      <div
        class="flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-md bg-white shadow-2xl"
      >
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
              Final Review
            </p>
            <h2 class="mt-1 text-lg font-black text-gray-900">최종 판매 등록서 확인</h2>
          </div>
          <button
            type="button"
            class="border border-gray-300 bg-white px-3 py-2 text-xs font-black text-gray-700 hover:bg-gray-50"
            @click="emit('close')"
          >
            닫기
          </button>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <section class="border border-gray-200 bg-white">
            <div class="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.65fr)]">
              <div>
                <div class="flex flex-wrap items-start justify-between gap-3 pb-3">
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                      거래 요약
                    </p>
                    <p class="mt-1 text-base font-black text-gray-900">
                      {{ selectedBuyer?.companyName ?? '-' }}
                    </p>
                    <p class="mt-1 text-xs font-bold text-gray-500">
                      소재 구분 {{ lockedMaterialType || '-' }} · 담긴 SKU
                      {{ formatQuantity(drawerSummary.totalItems) }}건
                    </p>
                  </div>
                  <div class="rounded-full bg-[#EAF4F0] px-3 py-1 text-[10px] font-black text-[#255F52]">
                    {{ materialFitLabel(selectedBuyer?.primaryMaterialFit) || '-' }}
                  </div>
                </div>

                <div class="mt-2 grid gap-3 pb-4 md:grid-cols-2 xl:grid-cols-4">
                  <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                      요청 / 실제 KG
                    </p>
                    <p class="mt-1 text-sm font-black text-gray-900">
                      {{ formatKg(finalReviewSummary.totalRequestedWeightKg) }}
                    </p>
                    <p class="mt-1 text-sm font-black text-[#0F5C4D]">
                      {{ formatKg(finalReviewSummary.totalActualWeightKg) }}
                    </p>
                  </div>
                  <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                      환산 / 실차감
                    </p>
                    <p class="mt-1 text-sm font-black text-gray-900">
                      {{ Number(finalReviewSummary.totalEstimatedQuantity).toFixed(2) }}벌
                    </p>
                    <p class="mt-1 text-sm font-black text-amber-700">
                      {{ formatQuantity(finalReviewSummary.totalDeductedQuantity) }}벌
                    </p>
                  </div>
                  <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                      예상 / 실제 금액
                    </p>
                    <p class="mt-1 text-sm font-black text-gray-900">
                      {{ formatCurrency(finalReviewSummary.totalRequestedAmount) }}
                    </p>
                    <p class="mt-1 text-sm font-black text-[#0F5C4D]">
                      {{ formatCurrency(finalReviewSummary.totalActualAmount) }}
                    </p>
                  </div>
                  <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                      포함 소재
                    </p>
                    <p class="mt-1 text-sm font-black leading-5 text-gray-900">
                      {{ includedMaterialNames.join(', ') || '-' }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="
                    Math.abs(
                      finalReviewSummary.totalActualWeightKg -
                        finalReviewSummary.totalRequestedWeightKg,
                    ) >= 0.01
                  "
                  class="rounded-md border border-[#D7E9E3] bg-[#F3FAF8] px-3 py-3"
                >
                  <p class="text-xs font-black text-[#0F5C4D]">
                    요청 {{ formatKg(finalReviewSummary.totalRequestedWeightKg) }} → 실재고 차감
                    기준 {{ formatKg(finalReviewSummary.totalActualWeightKg) }} 반영
                  </p>
                </div>
              </div>

              <aside class="border border-gray-200 bg-gray-50 px-4 py-4">
                <div class="flex items-start justify-between gap-3 pb-3">
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
                      거래처 정보
                    </p>
                    <div class="mt-1 flex flex-wrap items-center gap-2">
                      <p class="text-sm font-black text-gray-900">
                        {{ selectedBuyer?.companyName ?? '-' }}
                      </p>
                      <p class="font-mono text-[11px] font-black text-gray-500">
                        {{ selectedBuyer?.code ?? '-' }}
                      </p>
                    </div>
                  </div>
                  <span class="text-[11px] font-black text-gray-500">{{
                    selectedBuyer?.industryGroup ?? '-'
                  }}</span>
                </div>

                <div class="mt-2 grid grid-cols-2 gap-3">
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                      담당자
                    </p>
                    <p class="mt-1 text-xs font-black text-gray-800">
                      {{ selectedBuyer?.managerName ?? '-' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                      연락처
                    </p>
                    <p class="mt-1 text-xs font-black text-gray-800">
                      {{ selectedBuyer?.phone ?? '-' }}
                    </p>
                  </div>
                </div>

                <div class="mt-4 border-t border-gray-200 pt-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                    취급제품 / 생산품
                  </p>
                  <p class="mt-1 text-xs font-bold leading-5 text-gray-700">
                    {{ selectedBuyer?.productTypes?.join(', ') || selectedBuyer?.productNote || '-' }}
                  </p>
                </div>

                <div class="mt-4 border-t border-gray-200 pt-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                    거래처 설명
                  </p>
                  <p class="mt-1 text-xs font-bold leading-5 text-gray-700">
                    {{ selectedBuyer?.description || '설명 없음' }}
                  </p>
                </div>

                <div class="mt-4 border-t border-gray-200 pt-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.08em] text-gray-400">
                    판매 메모
                  </p>
                  <p class="mt-1 text-xs font-bold leading-5 text-gray-700">
                    {{ draftMemo?.trim() || '입력된 메모 없음' }}
                  </p>
                </div>
              </aside>
            </div>
          </section>

          <section class="mt-4 min-w-0 border border-gray-200 bg-white">
            <div class="border-b border-gray-100 px-3 py-3">
              <h3 class="text-sm font-black text-gray-900">판매 SKU 상세</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-[1450px] w-full border-collapse text-left text-xs">
                <thead class="bg-gray-50 text-[10px] uppercase tracking-[0.12em] text-gray-500">
                  <tr>
                    <th class="px-3 py-3 font-black">SKU 코드</th>
                    <th class="pl-0.5 pr-3 py-3 text-left font-black">품목명</th>
                    <th class="px-3 py-3 text-left font-black">소재 구분</th>
                    <th class="px-3 py-3 font-black">소재 상세</th>
                    <th class="px-3 py-3 text-left font-black">현재 재고</th>
                    <th class="px-3 py-3 text-left font-black">요청 kg</th>
                    <th class="px-3 py-3 text-left font-black">환산 수량</th>
                    <th class="px-3 py-3 text-left font-black">실차감 재고</th>
                    <th class="px-3 py-3 text-left font-black">실제 반영 kg</th>
                    <th class="px-3 py-3 text-left font-black">kg당 단가</th>
                    <th class="px-3 py-3 text-left font-black">예상 금액</th>
                    <th class="px-3 py-3 text-left font-black">실제 금액</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="item in draftItems" :key="item.draftId">
                    <td class="pl-3 pr-0 py-3 font-mono font-bold text-gray-500">
                      {{ item.skuCode }}
                    </td>
                    <td class="pl-0.5 pr-3 py-3 font-black text-gray-900">
                      {{ item.itemName }}
                    </td>
                    <td class="px-3 py-3 text-left font-black text-gray-900">
                      {{ item.materialType }}
                    </td>
                    <td class="px-3 py-3 font-bold text-gray-700">
                      {{ formatMaterials(item.materials) }}
                    </td>
                    <td class="px-3 py-3 text-left font-black text-gray-600">
                      {{ formatQuantity(item.availableQuantity) }}벌 /
                      {{ formatKg(item.availableWeightKg) }}
                    </td>
                    <td class="px-3 py-3 text-left font-black text-gray-900">
                      {{ formatKg(item.requestedWeightKg) }}
                    </td>
                    <td class="px-3 py-3 text-left font-black text-gray-700">
                      {{ Number(item.estimatedQuantity || 0).toFixed(2) }}벌
                    </td>
                    <td class="px-3 py-3 text-left font-black text-amber-700">
                      {{ formatQuantity(item.deductedQuantity) }}벌
                    </td>
                    <td
                      class="px-3 py-3 text-left font-black"
                      :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'"
                    >
                      {{ formatKg(item.actualWeightKg) }}
                    </td>
                    <td class="px-3 py-3 text-left font-black text-gray-900">
                      {{ formatCurrency(item.unitPrice) }}
                    </td>
                    <td class="px-3 py-3 text-left font-black text-gray-900">
                      {{ formatCurrency(item.requestedAmount) }}
                    </td>
                    <td
                      class="px-3 py-3 text-left font-black"
                      :class="hasWeightAdjustment(item) ? 'text-[#0F5C4D]' : 'text-gray-900'"
                    >
                      {{ formatCurrency(item.actualAmount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <div class="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            class="border border-[#004D3C] bg-[#004D3C] px-4 py-2 text-xs font-black text-white hover:bg-[#00382c]"
            @click="emit('submit')"
          >
            이 내용으로 최종 등록
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
